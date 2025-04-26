Overview:
This project is a News Aggregator that fetches real-time news updates from ThePrint website and displays them on a user-friendly webpage. The system is built using HTML, CSS, JavaScript for the frontend and Node.js, Express.js, Cheerio, and Axios for the backend web scraping functionality.

Technologies Used:
Frontend: HTML5, CSS3 (Bootstrap), JavaScript
Backend: Node.js, Express.js, Cheerio, Axios
Tools: Live Server (for frontend testing), npm (for package management)

Installation and Setup:
1. Clone the Repository
    git clone <repository-url>
    cd news-aggregator
2. Install Dependencies
    npm install express axios cheerio cors
3. Start the Backend Server
    node server.js
                   The server runs on http://localhost:5000/news
4. Start the Frontend
Open index.html in the browser or use Live Server extension in VS Code.


Code Explanation:
Backend (server.js):
Uses Axios to fetch the HTML content from ThePrint.
Cheerio parses and extracts news articles (title, link, image).
Express.js serves the scraped data as a JSON API at /news endpoint.

Frontend (index.html, styles.css, script.js):
Fetches news data from http://localhost:5000/news.
Displays the news articles dynamically in Bootstrap cards.
Uses JavaScript (fetch API) to update content in real-time.
Troubleshooting
