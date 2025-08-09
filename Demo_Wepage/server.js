const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const redis = require("redis");
const rateLimit = require("express-rate-limit");
const admin = require("firebase-admin");
const rssParser = require("rss-parser");
require("dotenv").config(); // For local .env support

const serviceAccount = require("./firebase-config.json");

const app = express();
app.use(cors());
app.use(express.json());

// Use Render's PORT or fallback for local
const PORT = process.env.PORT || 5000;

// ======= Redis Setup =======
const client = redis.createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
});
client.connect().catch(console.error);

// ======= Firebase Setup =======
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://news-aggregation-b4290.firebaseio.com"
});

// ======= Google News RSS Setup =======
const parser = new rssParser();
const rssFeeds = {
    General: "https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en",
    Politics: "https://news.google.com/rss/headlines/section/topic/NATION?hl=en-IN&gl=IN&ceid=IN:en",
    Education: "https://news.google.com/rss/search?q=Education&hl=en-IN&gl=IN&ceid=IN:en",
    World: "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-IN&gl=IN&ceid=IN:en",
    Business: "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-IN&gl=IN&ceid=IN:en",
    Technology: "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-IN&gl=IN&ceid=IN:en",
    Sports: "https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-IN&gl=IN&ceid=IN:en",
    Science: "https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=en-IN&gl=IN&ceid=IN:en",
    Entertainment: "https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-IN&gl=IN&ceid=IN:en",
    Health: "https://news.google.com/rss/headlines/section/topic/HEALTH?hl=en-IN&gl=IN&ceid=IN:en"
};

// ======= Scraping Categories for ThePrint =======
const BASE_URL = "https://theprint.in/";
const categories = {
    "Political News": "category/politics/",
    "Education News": "category/education/",
    "Business News": "category/business/",
    "StockMarket News": "category/economy/",
    "Religious News": "category/religion/",
    "JobRelated News": "category/jobs/",
    "Sports News": "category/sports/",
    "Foreign News": "category/world/"
};

// ======= Rate Limiter =======
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

// ======= ROUTES =======

// Google News (RSS)
app.get("/google-news", async (req, res) => {
    const category = req.query.category || "General";
    const feedUrl = rssFeeds[category] || rssFeeds.General;

    try {
        const feed = await parser.parseURL(feedUrl);
        const articles = feed.items.map(item => ({
            title: item.title,
            link: item.link,
            image: item.enclosure ? item.enclosure.url : "default.jpg"
        }));
        res.json(articles);
    } catch (error) {
        console.error("Error fetching Google News:", error);
        res.status(500).json({ error: "Failed to fetch Google News" });
    }
});

// ThePrint News (with Redis Cache + Pagination)
app.get("/news", async (req, res) => {
    const category = req.query.category || "general";
    const page = req.query.page || 1;
    const cacheKey = `${category}-${page}`;

    try {
        // Check cache
        const cachedData = await client.get(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        const url = `${BASE_URL}category/${category}?page=${page}`;
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const articles = [];
        $(".td-module-container").each((i, element) => {
            const title = $(element).find(".entry-title a").text().trim();
            const link = $(element).find(".entry-title a").attr("href");
            const image = $(element).find("img").attr("src");
            if (title && link) {
                articles.push({ title, link, image });
            }
        });

        // Cache for 1 hour
        await client.setEx(cacheKey, 3600, JSON.stringify(articles));

        res.json(articles);
    } catch (error) {
        console.error("Error fetching news:", error);
        res.status(500).json({ error: "Failed to fetch news." });
    }
});

// Firebase Login
app.post("/login", async (req, res) => {
    const { email } = req.body;
    try {
        const user = await admin.auth().getUserByEmail(email);
        res.json({ success: true, user });
    } catch (error) {
        res.status(400).json({ error: "Invalid credentials" });
    }
});

// ======= START SERVER =======
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
