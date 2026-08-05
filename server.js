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

function readItemsFromFile() {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
        const fileData = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(fileData);
    } catch (err) {
        console.error("Error reading JSON file:", err);
        return [];
    }
}

function writeItemsToFile(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error("Error writing to JSON file:", err);
    }
}

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

// Admin Update/Add Route
app.post('/api/prices/update', (req, res) => {
    const { item_id, item_name, buy_price, sell_price, password } = req.body;

    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({ message: "❌ Invalid Admin Password Access Denied!" });
    }

    let items = readItemsFromFile();
    let item = items.find(i => i.item_id === item_id);

    if (item) {
        item.buy_price = parseFloat(buy_price);
        item.sell_price = parseFloat(sell_price);
        writeItemsToFile(items);
        res.json({ message: "🎯 Prices successfully updated in your items file!" });
    } else {
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

// 🗑️ NEW: Admin Delete Item Route
app.post('/api/prices/delete', (req, res) => {
    const { item_id, password } = req.body;

    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({ message: "❌ Invalid Admin Password Access Denied!" });
    }

    let items = readItemsFromFile();
    const initialLength = items.length;
    
    // Filter out the item to remove it completely
    items = items.filter(i => i.item_id !== item_id);

    if (items.length === initialLength) {
        return res.status(404).json({ message: "❌ Item ID not found in file." });
    }

    writeItemsToFile(items);
    res.json({ message: "🗑️ Item successfully wiped from the registry file!" });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
