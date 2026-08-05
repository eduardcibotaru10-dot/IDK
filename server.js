const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_PASSWORD = "LunariaSecret123!";

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('prices.db', (err) => {
    if (err) console.error(err.message);
    console.log('Lunaria Database Ready.');
});

// Helper function to make sure items always exist in the table layout
function ensureDefaultItems(callback) {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id TEXT NOT NULL UNIQUE,
            item_name TEXT NOT NULL,
            buy_price REAL,
            sell_price REAL,
            old_price REAL,
            all_time_high REAL
        )`, () => {
            // Count items to see if Render wiped the database
            db.get(`SELECT COUNT(*) as count FROM prices`, (err, row) => {
                if (row && row.count === 0) {
                    console.log("Render reset detected! Auto-populating items now...");
                    const insertStmt = db.prepare(`INSERT OR IGNORE INTO prices (item_id, item_name, buy_price, sell_price, old_price, all_time_high) VALUES (?, ?, ?, ?, ?, ?)`);
                    insertStmt.run('minecraft:diamond', 'Diamond', 500.00, 150.00, 500.00, 500.00);
                    insertStmt.run('minecraft:iron_ingot', 'Iron Ingot', 50.00, 15.00, 50.00, 50.00);
                    insertStmt.run('minecraft:netherite_ingot', 'Netherite Ingot', 5000.00, 2000.00, 5000.00, 5000.00);
                    insertStmt.finalize(() => {
                        if (callback) callback();
                    });
                } else {
                    if (callback) callback();
                }
            });
        });
    });
}

// Run the check once immediately on startup
ensureDefaultItems();

// Search Route - Now safely forces an auto-check before loading the grid
app.get('/api/prices', (req, res) => {
    const query = req.query.search || '';
    
    ensureDefaultItems(() => {
        db.all(`SELECT * FROM prices WHERE item_name LIKE ? OR item_id LIKE ?`, [`%${query}%`, `%${query}%`], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });
});

// Admin Update Route
app.post('/api/prices/update', (req, res) => {
    const { item_id, buy_price, sell_price, password } = req.body;

    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({ message: "❌ Invalid Admin Password Access Denied!" });
    }

    ensureDefaultItems(() => {
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
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
