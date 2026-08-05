const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'items.json');

const ADMIN_PASSWORD = "LunariaSecret123!";

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Helper function to safely read items from your file
function readItemsFromFile() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return [];
        }
        const fileData = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(fileData);
    } catch (err) {
        console.error("Error reading JSON file:", err);
        return [];
    }
}

// Helper function to safely write updates back to your file
function writeItemsToFile(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error("Error writing to JSON file:", err);
    }
}

// Serve the website layout directly on your main Render URL link
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Search Route
app.get('/api/prices', (req, res) => {
    const query = req.query.search ? req.query.search.toLowerCase() : '';
    const items = readItemsFromFile();
    const filteredRows = items.filter(item => 
        item.item_name.toLowerCase().includes(query) || 
        item.item_id.toLowerCase().includes(query)
    );
    res.json(filteredRows);
});

// Admin Modification & Add New Items Route
app.post('/api/prices/update', (req, res) => {
    const { item_id, item_name, buy_price, sell_price, password } = req.body;

    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({ message: "❌ Invalid Admin Password Access Denied!" });
    }

    let items = readItemsFromFile();
    let item = items.find(i => i.item_id === item_id);

    if (item) {
        // If item exists, update its pricing
        item.buy_price = parseFloat(buy_price);
        item.sell_price = parseFloat(sell_price);
        writeItemsToFile(items);
        res.json({ message: "🎯 Prices successfully updated in your items file!" });
    } else {
        // If item is new, add it completely to the database list
        if (!item_name) {
            return res.status(400).json({ message: "❌ New items require an Item Name!" });
        }
        const newItem = {
            item_id: item_id,
            item_name: item_name,
            buy_price: parseFloat(buy_price),
            sell_price: parseFloat(sell_price)
        };
        items.push(newItem);
        writeItemsToFile(items);
        res.json({ message: `✨ ${item_name} successfully added as a new item!` });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
