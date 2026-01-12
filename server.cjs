require('dotenv').config();
const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
const path = require('path');
app.use(express.static(path.join(__dirname, '.')));
app.use(bodyParser.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'thehangover',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


const initDb = () => {
    const userTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY, 
            username VARCHAR(255)
        )
    `;
    const eventTable = `
        CREATE TABLE IF NOT EXISTS events (
            id INT AUTO_INCREMENT PRIMARY KEY, 
            user_id INT, 
            name VARCHAR(255), 
            data LONGTEXT
        )
    `;

    pool.query(userTable, (err) => {
        if (err) console.error("Error creating users table:", err);
        else console.log("Users table ready");
    });

    pool.query(eventTable, (err) => {
        if (err) console.error("Error creating events table:", err);
        else console.log("Events table ready");
    });
};

initDb();

app.post('/login', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });

    pool.query("SELECT id, username FROM users WHERE username = ?", [username], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            pool.query("INSERT INTO users (username) VALUES (?)", [username], (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: result.insertId, username });
            });
        }
    });
});

app.get('/events', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    pool.query("SELECT id, name, data FROM events WHERE user_id = ?", [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const events = rows.map(r => ({
            id: r.id,
            name: r.name,
            data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data
        }));
        res.json(events);
    });
});

app.get('/event/:id', (req, res) => {
    pool.query("SELECT id, name, data FROM events WHERE id = ?", [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (rows.length === 0) return res.status(404).json({ error: 'Event not found' });

        const row = rows[0];
        res.json({
            id: row.id,
            name: row.name,
            data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data
        });
    });
});

app.post('/events', (req, res) => {
    const { userId, name, data } = req.body;
    pool.query("INSERT INTO events (user_id, name, data) VALUES (?, ?, ?)", [userId, name, JSON.stringify(data)], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId });
    });
});

app.put('/events/:id', (req, res) => {
    const { name, data } = req.body;
    pool.query("UPDATE events SET name = ?, data = ? WHERE id = ?", [name, JSON.stringify(data), req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/events/:id', (req, res) => {
    pool.query("DELETE FROM events WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
