const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const redis = require("redis");
const rateLimit = require("express-rate-limit");
const client = redis.createClient();
const rssParser = require("rss-parser");

const app = express();
app.use(cors());
const PORT = 5000;

app.use(express.static("public"));

app.get("/", (_req, res) => {
    res.send("Welcome to Destiny News Aggregator!");
});

const parser = new rssParser();

// Google News RSS Feed URLs
const rssFeeds = {
    "General": "https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en",
    "Politics": "https://news.google.com/rss/headlines/section/topic/NATION?hl=en-IN&gl=IN&ceid=IN:en",
    "Education": "https://news.google.com/rss/search?q=Education&hl=en-IN&gl=IN&ceid=IN:en",
    "World": "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-IN&gl=IN&ceid=IN:en",
    "Business": "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-IN&gl=IN&ceid=IN:en",
    "Technology": "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-IN&gl=IN&ceid=IN:en",
    "Sports": "https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-IN&gl=IN&ceid=IN:en",
    "Science": "https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=en-IN&gl=IN&ceid=IN:en",
    "Entertainment": "https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-IN&gl=IN&ceid=IN:en",
    "Health": "https://news.google.com/rss/headlines/section/topic/HEALTH?hl=en-IN&gl=IN&ceid=IN:en"
};

// Fetch news from Google RSS
app.get("/google-news", async (req, res) => {
    const category = req.query.category || "General";
    const feedUrl = rssFeeds[category] || rssFeeds["General"];

    try {
        const feed = await parser.parseURL(feedUrl);

        const articles = feed.items.map(item => {
            let image = "https://via.placeholder.com/300x200.png?text=No+Image"; // fallback image

            // Some images are embedded in description/content with <img src="">
            const desc = item.content || item.contentSnippet || item.description || "";
            const match = desc.match(/<img[^>]+(?:src|data-src)="([^">]+)"/);

            if (match && match[1]) {
                image = match[1];
            }

            return {
                title: item.title,
                link: item.link,
                image
            };
        });

        res.json(articles);
    } catch (error) {
        console.error("Error fetching news:", error);
        res.status(500).json({ error: "Failed to fetch Google News" });
    }
});

// app.get("/google-news", async (req, res) => {
//     const category = req.query.category || "General";
//     const feedUrl = rssFeeds[category] || rssFeeds["General"];

//     try {
//         const feed = await parser.parseURL(feedUrl);
//         const articles = feed.items.map(item => ({
//             title: item.title,
//             link: item.link,
//             image: item.enclosure ? item.enclosure.url : "default.jpg"
//         }));

//         res.json(articles);
//     } catch (error) {
//         console.error("Error fetching news:", error);
//         res.status(500).json({ error: "Failed to fetch Google News" });
//     }
// });

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

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

app.use(limiter);

app.get("/news", async (req, res) => {
    try {
        const category = req.query.category;
        const categoryUrl = categories[category] ? `${BASE_URL}${categories[category]}` : BASE_URL;

        const { data } = await axios.get(categoryUrl);
        const $ = cheerio.load(data);
        let news = [];

        $(".td-module-container").each((index, element) => {
            const title = $(element).find(".entry-title a").text().trim();
            const link = $(element).find(".entry-title a").attr("href");
            const image = $(element).find("img").attr("src");

            if (title && link) {
                news.push({ title, link, image });
            }
        });

        res.json(news);
    } catch (error) {
        console.error("Error fetching news:", error);
        res.status(500).json({ error: "Error fetching news" });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
