require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_me';

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '.')));
app.use(bodyParser.json());

const dbPath = path.resolve(__dirname, 'dev_database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to local SQLite database');
    }
});

const initDb = () => {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                username TEXT,
                password TEXT
            )
        `);
        db.run(`ALTER TABLE users ADD COLUMN password TEXT`, (err) => {
            // Ignore error if column already exists
        });
        db.run(`
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                user_id INTEGER, 
                name TEXT, 
                data TEXT
            )
        `);
    });
};

initDb();

const verifyJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }
        req.user = decoded;
        next();
    });
};

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    db.get("SELECT id, username, password FROM users WHERE username = ?", [username], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (row) {
            if (row.password) {
                // If it looks like a 64-char hex string from old sha256 hash, we should check it
                const isLegacyHash = /^[a-fA-F0-9]{64}$/.test(row.password);

                let matches = false;
                if (isLegacyHash) {
                    const crypto = require('crypto');
                    const hashedPwd = crypto.createHash('sha256').update(password).digest('hex');
                    matches = (hashedPwd === row.password);
                    if (matches) {
                        // upgrade to bcrypt
                        const targetHash = await bcrypt.hash(password, 10);
                        db.run("UPDATE users SET password = ? WHERE id = ?", [targetHash, row.id]);
                    }
                } else {
                    matches = await bcrypt.compare(password, row.password);
                }

                if (!matches) {
                    return res.status(401).json({ error: 'Incorrect password' });
                }
            } else if (!row.password) {
                const targetHash = await bcrypt.hash(password, 10);
                db.run("UPDATE users SET password = ? WHERE id = ?", [targetHash, row.id]);
            }
            const token = jwt.sign({ id: row.id, username: row.username }, JWT_SECRET, { expiresIn: '7d' });
            res.json({ id: row.id, username: row.username, token });
        } else {
            const numSaltRounds = 10;
            const targetHash = await bcrypt.hash(password, numSaltRounds);
            db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, targetHash], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET, { expiresIn: '7d' });
                res.json({ id: this.lastID, username, token });
            });
        }
    });
});

app.get('/events', verifyJwt, (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    // Validate that the request is for the logged-in user
    if (parseInt(userId, 10) !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    db.all("SELECT id, name, data FROM events WHERE user_id = ?", [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const events = rows.map(r => {
            let parsedData = {};
            try { parsedData = JSON.parse(r.data); } catch (e) { }
            return {
                id: r.id,
                name: r.name,
                data: parsedData
            };
        });
        res.json(events);
    });
});

app.get('/event/:id', (req, res) => {
    db.get("SELECT id, name, data FROM events WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Event not found' });

        let parsedData = {};
        try { parsedData = JSON.parse(row.data); } catch (e) { }

        res.json({
            id: row.id,
            name: row.name,
            data: parsedData
        });
    });
});

app.post('/events', verifyJwt, (req, res) => {
    const { userId, name, data } = req.body;
    if (parseInt(userId, 10) !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    db.run("INSERT INTO events (user_id, name, data) VALUES (?, ?, ?)", [userId, name, JSON.stringify(data)], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

app.put('/events/:id', verifyJwt, (req, res) => {
    const { name, data } = req.body;
    const reqUserId = req.user.id;

    db.get("SELECT user_id FROM events WHERE id = ?", [req.params.id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'Event not found' });
        if (row.user_id !== reqUserId) return res.status(403).json({ error: 'Forbidden: You do not own this event' });

        db.run("UPDATE events SET name = ?, data = ? WHERE id = ?", [name, JSON.stringify(data), req.params.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

app.delete('/events/:id', verifyJwt, (req, res) => {
    const reqUserId = req.user.id;
    db.get("SELECT user_id FROM events WHERE id = ?", [req.params.id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'Event not found' });
        if (row.user_id !== reqUserId) return res.status(403).json({ error: 'Forbidden: You do not own this event' });

        db.run("DELETE FROM events WHERE id = ?", [req.params.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Dev Server running on port ${PORT}`);
    console.log(`Using SQLite database: ${dbPath}`);
});
