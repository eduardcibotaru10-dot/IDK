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
        fs.writeFileSync(
            DATA_FILE,
            JSON.stringify(data, null, 2),
            'utf8'
        );

        return true;

    } catch (err) {
        console.error("Error writing to JSON file:", err);
        return false;
    }
}

/* =========================
   MAIN WEBSITE
========================= */

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

/* =========================
   SEARCH ITEMS
========================= */

app.get('/api/prices', (req, res) => {

    const query = req.query.search
        ? req.query.search.toLowerCase()
        : '';

    const items = readItemsFromFile();

    const filteredRows = items.filter(item =>
        item.item_name.toLowerCase().includes(query) ||
        item.item_id.toLowerCase().includes(query)
    );

    res.json(filteredRows);
});

/* =========================
   ADMIN UPDATE / ADD
========================= */

app.post('/api/prices/update', (req, res) => {

    const {
        item_id,
        item_name,
        sell_price,
        password
    } = req.body;

    /* Check password */
    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({
            message: "❌ Invalid Admin Password Access Denied!"
        });
    }

    /* Validate item ID */
    if (!item_id) {
        return res.status(400).json({
            message: "❌ Item Namespace ID is required!"
        });
    }

    /* Validate price */
    const parsedSellPrice = parseFloat(sell_price);

    if (isNaN(parsedSellPrice) || parsedSellPrice < 0) {
        return res.status(400).json({
            message: "❌ Worth price must be a valid number!"
        });
    }

    let items = readItemsFromFile();

    /* Find existing item */
    let item = items.find(i => i.item_id === item_id);

    if (item) {

        /* Update existing item */
        item.sell_price = parsedSellPrice;

        /* Allow changing the display name if provided */
        if (item_name) {
            item.item_name = item_name;
        }

        if (!writeItemsToFile(items)) {
            return res.status(500).json({
                message: "❌ Failed to save changes to items.json!"
            });
        }

        return res.json({
            message: "🎯 Worth price successfully updated!"
        });

    } else {

        /* New item requires a name */
        if (!item_name) {
            return res.status(400).json({
                message: "❌ New items require an Item Name!"
            });
        }

        const newItem = {
            item_id: item_id,
            item_name: item_name,
            sell_price: parsedSellPrice
        };

        items.push(newItem);

        if (!writeItemsToFile(items)) {
            return res.status(500).json({
                message: "❌ Failed to save new item!"
            });
        }

        return res.json({
            message: `✨ ${item_name} successfully added to the registry!`
        });
    }
});

/* =========================
   ADMIN DELETE
========================= */

app.post('/api/prices/delete', (req, res) => {

    const {
        item_id,
        password
    } = req.body;

    /* Check password */
    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({
            message: "❌ Invalid Admin Password Access Denied!"
        });
    }

    if (!item_id) {
        return res.status(400).json({
            message: "❌ Item Namespace ID is required!"
        });
    }

    let items = readItemsFromFile();

    const initialLength = items.length;

    /* Remove item */
    items = items.filter(
        i => i.item_id !== item_id
    );

    /* Item wasn't found */
    if (items.length === initialLength) {
        return res.status(404).json({
            message: "❌ Item ID not found in registry."
        });
    }

    /* Save */
    if (!writeItemsToFile(items)) {
        return res.status(500).json({
            message: "❌ Failed to save deletion!"
        });
    }

    res.json({
        message: "🗑️ Item successfully removed from the registry!"
    });
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, '0.0.0.0', () => {
    console.log(
        `🌙 Lunaria Economy API running on port ${PORT}`
    );
});
