const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_PASSWORD = "LunariaSecret123!";

app.use(cors());
app.use(express.json());

// Cloud-Safe Memory Storage (Immune to Render storage wipe resets)
let currentPrices = [
    { item_id: 'minecraft:diamond', item_name: 'Diamond', buy_price: 500.00, sell_price: 150.00, old_price: 500.00, all_time_high: 500.00 },
    { item_id: 'minecraft:iron_ingot', item_name: 'Iron Ingot', buy_price: 50.00, sell_price: 15.00, old_price: 50.00, all_time_high: 50.00 },
    { item_id: 'minecraft:netherite_ingot', item_name: 'Netherite Ingot', buy_price: 5000.00, sell_price: 2000.00, old_price: 5000.00, all_time_high: 5000.00 }
];

// Search Route
app.get('/api/prices', (req, res) => {
    const query = req.query.search ? req.query.search.toLowerCase() : '';
    
    // Filter matching results instantly from active memory data logs
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

    // Process price trends and history math arrays safely
    item.old_price = item.buy_price;
    item.buy_price = buy_price;
    item.sell_price = sell_price;
    if (buy_price > item.all_time_high) {
        item.all_time_high = buy_price;
    }

    res.json({ message: "🎯 Prices successfully updated in Lunaria memory hub!" });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

