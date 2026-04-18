const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;



// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const dbPath = path.resolve(__dirname, 'anime_walls.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Database connection error:", err.message);
    else console.log("✅ Connected to SQLite Database");
});


const dbLive = new sqlite3.Database('./anime_walls_live.db');

const dbAdmin = new sqlite3.Database('./admin.db');
const crypto = require('crypto');

// Admin Panel

// --- Admin Login API ---
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    dbAdmin.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, hashedPassword], (err, row) => {
        if (row) {
            res.json({ success: true, message: "Login Successful" });
        } else {
            res.status(401).json({ success: false, message: "Invalid Credentials" });
        }
    });
});

// --- Dashboard Stats API ---
app.get('/api/admin/stats', async (req, res) => {
    try {
        // Static Stats
        const staticStats = await new Promise((resolve) => {
            dbStatic.get("SELECT COUNT(*) as total, SUM(love) as love, SUM(share) as share FROM wallpapers", (err, row) => {
                resolve(row || { total: 0, love: 0, share: 0 });
            });
        });

        // Live Stats
        const liveStats = await new Promise((resolve) => {
            dbLive.get("SELECT COUNT(*) as total, SUM(love) as love, SUM(share) as share FROM live_wallpapers", (err, row) => {
                resolve(row || { total: 0, love: 0, share: 0 });
            });
        });

        res.json({
            totalWallpapers: staticStats.total + liveStats.total,
            staticCount: staticStats.total,
            liveCount: liveStats.total,
            totalLove: (staticStats.love || 0) + (liveStats.love || 0),
            totalShare: (staticStats.share || 0) + (liveStats.share || 0),
            // Note: Download count track korte hole table-e 'download' column thaka lagbe
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- API Endpoints ---

// 1. Get All Wallpapers (with Pagination)
app.get('/api/wallpapers', (req, res) => {
    const query = "SELECT * FROM wallpapers ORDER BY id DESC";
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. Get Wallpapers by Category
app.get('/api/wallpapers/category/:name', (req, res) => {
    const categoryName = req.params.name;
    const query = "SELECT * FROM wallpapers WHERE category = ?";
    db.all(query, [categoryName], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 3. Get All Categories (App-er menu-r jonno)
app.get('/api/categories', (req, res) => {
    const query = "SELECT * FROM categories";
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


// 1. Love React update (POST /api/wallpapers/love/:id)
app.post('/api/wallpapers/love/:id', (req, res) => {
    const id = req.params.id;
    const query = "UPDATE wallpapers SET love = love + 1 WHERE id = ?";
    db.run(query, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Love count updated!" });
    });
});

// 2. Share update (POST /api/wallpapers/share/:id)
app.post('/api/wallpapers/share/:id', (req, res) => {
    const id = req.params.id;
    const query = "UPDATE wallpapers SET share = share + 1 WHERE id = ?";
    db.run(query, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Share count updated!" });
    });
});


// API to get all live wallpapers
app.get('/api/live-wallpapers', (req, res) => {
    dbLive.all("SELECT * FROM live_wallpapers ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Server Start
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});