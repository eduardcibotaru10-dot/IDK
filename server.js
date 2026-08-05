const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// SET YOUR SECRET ADMIN PASSWORD RIGHT HERE!
const ADMIN_PASSWORD = "LunariaSecret123!";

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('prices.db', (err) => {
    if (err) console.error(err.message);
    console.log('Lunaria Database Ready.');
});

db.serialize(() => {
    // Create the pricing table layout
    db.run(`CREATE TABLE IF NOT EXISTS prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id TEXT NOT NULL UNIQUE,
        item_name TEXT NOT NULL,
        buy_price REAL,
        sell_price REAL,
        old_price REAL,
        all_time_high REAL
    )`);

    // Force populate the items right away if they don't exist yet!
    const insertStmt = db.prepare(`INSERT OR IGNORE INTO prices (item_id, item_name, buy_price, sell_price, old_price, all_time_high) VALUES (?, ?, ?, ?, ?, ?)`);
    insertStmt.run('minecraft:diamond', 'Diamond', 500.00, 150.00, 500.00, 500.00);
    insertStmt.run('minecraft:iron_ingot', 'Iron Ingot', 50.00, 15.00, 50.00, 50.00);
    insertStmt.run('minecraft:netherite_ingot', 'Netherite Ingot', 5000.00, 2000.00, 5000.00, 5000.00);
    insertStmt.finalize();
    console.log("Database seeded successfully with default items.");
});

// Search Route
app.get('/api/prices', (req, res) => {
    const query = req.query.search || '';
    db.all(`SELECT * FROM prices WHERE item_name LIKE ? OR item_id LIKE ?`, [`%${query}%`, `%${query}%`], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Admin Update Route
app.post('/api/prices/update', (req, res) => {
    const { item_id, buy_price, sell_price, password } = req.body;

    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({ message: "❌ Invalid Admin Password Access Denied!" });
    }

    db.get(`SELECT buy_price, all_time_high FROM prices WHERE item_id = ?`, [item_id], (err, row) => {
        if (err || !row) return res.status(404).json({ message: "Item profile not found." });

        const current_old_price = row.buy_price;
        const new_ath = buy_price > row.all_time_high ? buy_price : row.all_time_high;

        const updateSql = `UPDATE prices SET buy_price = ?, sell_price = ?, old_price = ?, all_time_high = ? WHERE item_id = ?`;
        db.run(updateSql, [buy_price, sell_price, current_old_price, new_ath, item_id], function(err) {
            if (err) return res.status(500).json({ message: "Database update error." });
            res.json({ message: "🎯 Prices successfully updated in Lunaria database!" });
        });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
