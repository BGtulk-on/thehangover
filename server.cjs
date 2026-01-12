require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

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
                username TEXT
            )
        `);
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

app.post('/login', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });

    db.get("SELECT id, username FROM users WHERE username = ?", [username], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (row) {
            res.json(row);
        } else {
            db.run("INSERT INTO users (username) VALUES (?)", [username], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID, username });
            });
        }
    });
});

app.get('/events', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    db.all("SELECT id, name, data FROM events WHERE user_id = ?", [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const events = rows.map(r => ({
            id: r.id,
            name: r.name,
            data: JSON.parse(r.data)
        }));
        res.json(events);
    });
});

app.get('/event/:id', (req, res) => {
    db.get("SELECT id, name, data FROM events WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Event not found' });

        res.json({
            id: row.id,
            name: row.name,
            data: JSON.parse(row.data)
        });
    });
});

app.post('/events', (req, res) => {
    const { userId, name, data } = req.body;
    db.run("INSERT INTO events (user_id, name, data) VALUES (?, ?, ?)", [userId, name, JSON.stringify(data)], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

app.put('/events/:id', (req, res) => {
    const { name, data } = req.body;
    db.run("UPDATE events SET name = ?, data = ? WHERE id = ?", [name, JSON.stringify(data), req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/events/:id', (req, res) => {
    db.run("DELETE FROM events WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Dev Server running on port ${PORT}`);
    console.log(`Using SQLite database: ${dbPath}`);
});
