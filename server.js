const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('prices.db', (err) => {
    if (err) console.error(err.message);
    console.log('Lunaria Database Ready.');
});

db.serialize(() => {
    // Recreates the table with price analytics tracking columns
    db.run(`CREATE TABLE IF NOT EXISTS prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id TEXT NOT NULL UNIQUE,
        item_name TEXT NOT NULL,
        buy_price REAL,
        sell_price REAL,
        old_price REAL,
        all_time_high REAL
    )`);

    const insertStmt = db.prepare(`INSERT OR IGNORE INTO prices (item_id, item_name, buy_price, sell_price, old_price, all_time_high) VALUES (?, ?, ?, ?, ?, ?)`);
    insertStmt.run('minecraft:diamond', 'Diamond', 500.00, 150.00, 450.00, 600.00);
    insertStmt.run('minecraft:iron_ingot', 'Iron Ingot', 50.00, 15.00, 50.00, 55.00);
    insertStmt.run('minecraft:netherite_ingot', 'Netherite Ingot', 5700.00, 2000.00, 6000.00, 6500.00);
    insertStmt.finalize();
});

// Search API
app.get('/api/prices', (req, res) => {
    const query = req.query.search || '';
    const sql = `SELECT * FROM prices WHERE item_name LIKE ? OR item_id LIKE ?`;
    
    db.all(sql, [`%${query}%`, `%${query}%`], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
