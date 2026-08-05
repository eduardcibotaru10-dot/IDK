const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_PASSWORD = "LunariaSecret123!";

app.use(cors());
app.use(express.json());

// 1. This tells the server to look for your index.html file in your folder
app.use(express.static(__dirname));

let currentPrices = [
    { item_id: 'minecraft:diamond', item_name: 'Diamond', buy_price: 500.00, sell_price: 150.00 },
    { item_id: 'minecraft:iron_ingot', item_name: 'Iron Ingot', buy_price: 50.00, sell_price: 15.00 },
    { item_id: 'minecraft:netherite_ingot', 'item_name': 'Netherite Ingot', buy_price: 5000.00, sell_price: 2000.00 }
];

// 2. This serves the main website whenever someone visits your Render link directly
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Search Route
app.get('/api/prices', (req, res) => {
    const query = req.query.search ? req.query.search.toLowerCase() : '';
    const filteredRows = currentPrices.filter(item => 
        item.item_name.toLowerCase().includes(query) || 
        item.item_id.toLowerCase().includes(query)
    );
    res.json(filteredRows);
});

// Admin Update Route
app.post('/api/prices/update', (req, res) => {
    const { item_id, buy_price, sell_price, password } = req.body;

    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({ message: "❌ Invalid Admin Password Access Denied!" });
    }

    const item = currentPrices.find(i => i.item_id === item_id);
    if (!item) {
        return res.status(404).json({ message: "Item profile not found." });
    }

    item.buy_price = parseFloat(buy_price);
    item.sell_price = parseFloat(sell_price);

    res.json({ message: "🎯 Prices successfully updated in Lunaria memory hub!" });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});


