// server.js
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const redis = require("redis");
const rateLimit = require("express-rate-limit");
const admin = require("firebase-admin");
const rssParser = require("rss-parser");

// Load .env in dev
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Parse firebase service account JSON from env var
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Redis client
const client = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});
client.connect().catch(console.error);

// Firebase init
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

// RSS Parser and Feeds
const parser = new rssParser();
const rssFeeds = {
  general: "https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en",
  politics: "https://news.google.com/rss/headlines/section/topic/NATION?hl=en-IN&gl=IN&ceid=IN:en",
  education: "https://news.google.com/rss/search?q=Education&hl=en-IN&gl=IN&ceid=IN:en",
  world: "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-IN&gl=IN&ceid=IN:en",
  business: "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-IN&gl=IN&ceid=IN:en",
  technology: "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-IN&gl=IN&ceid=IN:en",
  sports: "https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-IN&gl=IN&ceid=IN:en",
  science: "https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=en-IN&gl=IN&ceid=IN:en",
  entertainment: "https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-IN&gl=IN&ceid=IN:en",
  health: "https://news.google.com/rss/headlines/section/topic/HEALTH?hl=en-IN&gl=IN&ceid=IN:en",
};

const BASE_URL = "https://theprint.in/";
const categories = {
  politics: "category/politics/",
  education: "category/education/",
  business: "category/business/",
  economy: "category/economy/",
  religion: "category/religion/",
  jobs: "category/jobs/",
  sports: "category/sports/",
  world: "category/world/",
};

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to Destiny News API!");
});

// Google News endpoint
app.get("/google-news", async (req, res) => {
  const categoryRaw = req.query.category || "general";
  const category = categoryRaw.toLowerCase();

  const feedUrl = rssFeeds[category] || rssFeeds.general;

  try {
    const feed = await parser.parseURL(feedUrl);
    const articles = feed.items.map(item => ({
      title: item.title,
      link: item.link,
      image: item.enclosure ? item.enclosure.url : "default.jpg",
    }));
    res.json(articles);
  } catch (err) {
    console.error("Error fetching Google News:", err);
    res.status(500).json({ error: "Failed to fetch Google News" });
  }
});

// ThePrint news endpoint with caching
app.get("/news", async (req, res) => {
  const categoryRaw = req.query.category || "politics";
  const category = categoryRaw.toLowerCase();

  if (!categories[category]) {
    return res.status(400).json({ error: "Invalid category" });
  }

  const page = req.query.page || 1;
  const cacheKey = `${category}-${page}`;

  try {
    const cached = await client.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for ${cacheKey}`);
      return res.json(JSON.parse(cached));
    }

    const url = `${BASE_URL}${categories[category]}?page=${page}`;
    console.log(`Fetching fresh data from: ${url}`);

    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const articles = [];
    $(".td-module-container").each((i, el) => {
      const title = $(el).find(".entry-title a").text().trim();
      const link = $(el).find(".entry-title a").attr("href");
      const image = $(el).find("img").attr("src");
      if (title && link) articles.push({ title, link, image });
    });

    await client.setEx(cacheKey, 3600, JSON.stringify(articles)); // Cache for 1 hour
    res.json(articles);
  } catch (err) {
    console.error("Error fetching news:", err);
    res.status(500).json({ error: "Failed to fetch news." });
  }
});

// Firebase login route
app.post("/login", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await admin.auth().getUserByEmail(email);
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ error: "Invalid credentials" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
