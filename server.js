const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

const PORT = process.env.PORT || 3000;

const DATA_FILE =
    path.join(__dirname, "items.json");

const ADMIN_PASSWORD =
    "LunariaSecret123!";

app.use(cors());

app.use(express.json());

app.use(express.static(__dirname));

/* =========================
   READ ITEMS
========================= */

function readItemsFromFile() {

    try {

        if (!fs.existsSync(DATA_FILE)) {
            return [];
        }

        const fileData =
            fs.readFileSync(
                DATA_FILE,
                "utf8"
            );

        return JSON.parse(fileData);

    } catch (err) {

        console.error(
            "Error reading JSON file:",
            err
        );

        return [];
    }
}

/* =========================
   WRITE ITEMS
========================= */

function writeItemsToFile(data) {

    try {

        fs.writeFileSync(
            DATA_FILE,
            JSON.stringify(
                data,
                null,
                2
            ),
            "utf8"
        );

        return true;

    } catch (err) {

        console.error(
            "Error writing JSON file:",
            err
        );

        return false;
    }
}

/* =========================
   HOME
========================= */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "index.html"
        )
    );

});

/* =========================
   GET / SEARCH ITEMS
========================= */

app.get(
    "/api/prices",
    (req, res) => {

        const query =
            req.query.search
                ? req.query.search
                    .toLowerCase()
                    .trim()
                : "";

        const items =
            readItemsFromFile();

        const filteredItems =
            items.filter(item => {

                const name =
                    String(
                        item.item_name || ""
                    ).toLowerCase();

                const id =
                    String(
                        item.item_id || ""
                    ).toLowerCase();

                return (
                    name.includes(query) ||
                    id.includes(query)
                );
            });

        res.json(filteredItems);
    }
);

/* =========================
   ADD / UPDATE ITEM
========================= */

app.post(
    "/api/prices/update",
    (req, res) => {

        const {
            item_id,
            item_name,
            sell_price,
            password
        } = req.body;

        /* PASSWORD */

        if (
            password !==
            ADMIN_PASSWORD
        ) {

            return res
                .status(403)
                .json({
                    message:
                        "❌ Invalid Admin Password. Access Denied!"
                });
        }

        /* VALIDATION */

        if (
            !item_id ||
            sell_price === undefined ||
            isNaN(
                parseFloat(
                    sell_price
                )
            )
        ) {

            return res
                .status(400)
                .json({
                    message:
                        "❌ Invalid item ID or price."
                });
        }

        let items =
            readItemsFromFile();

        const item =
            items.find(
                i =>
                    i.item_id ===
                    item_id
            );

        /* UPDATE */

        if (item) {

            item.sell_price =
                parseFloat(
                    sell_price
                );

            if (
                item_name &&
                item_name.trim()
            ) {

                item.item_name =
                    item_name.trim();
            }

            writeItemsToFile(items);

            return res.json({
                message:
                    "🎯 Item worth successfully updated!"
            });
        }

        /* NEW ITEM */

        if (
            !item_name ||
            !item_name.trim()
        ) {

            return res
                .status(400)
                .json({
                    message:
                        "❌ New items require a Display Name!"
                });
        }

        const newItem = {

            item_id:
                item_id.trim(),

            item_name:
                item_name.trim(),

            sell_price:
                parseFloat(
                    sell_price
                )
        };

        items.push(newItem);

        writeItemsToFile(items);

        res.json({
            message:
                `✨ ${item_name} successfully added!`
        });
    }
);

/* =========================
   DELETE ITEM
========================= */

app.post(
    "/api/prices/delete",
    (req, res) => {

        const {
            item_id,
            password
        } = req.body;

        /* PASSWORD */

        if (
            password !==
            ADMIN_PASSWORD
        ) {

            return res
                .status(403)
                .json({
                    message:
                        "❌ Invalid Admin Password. Access Denied!"
                });
        }

        let items =
            readItemsFromFile();

        const originalLength =
            items.length;

        items =
            items.filter(
                item =>
                    item.item_id !==
                    item_id
            );

        /* ITEM NOT FOUND */

        if (
            items.length ===
            originalLength
        ) {

            return res
                .status(404)
                .json({
                    message:
                        "❌ Item ID not found."
                });
        }

        writeItemsToFile(items);

        res.json({
            message:
                "🗑️ Item successfully deleted!"
        });
    }
);

/* =========================
   START SERVER
========================= */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Lunaria server running on port ${PORT}`
        );

    }
);
