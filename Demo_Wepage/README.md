Overview:

This project is a News Aggregator that fetches real-time news updates from ThePrint website and displays them on a user-friendly webpage. The system is built using HTML, CSS, JavaScript for the frontend and Node.js, Express.js, Cheerio, and Axios for the backend web scraping functionality.

Project Structure:

news-aggregator/
news-aggregator/
│── server.js        # Backend API to fetch news
│── public/
│   ├── index.html   # Frontend UI
│   ├── styles.css   # CSS styling
│   ├── script.js    # JavaScript functionality
│   ├── default.jpg  # Placeholder image (if no image is available)
│── package.json     # Project dependencies
│── README.md        # Project documentation

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

Backend not working? :

Ensure Node.js is installed.
Run npm install to check dependencies.
Check for errors in the console (node server.js).

Frontend not displaying news? :

Open browser console (F12 > Console) for errors.
Ensure backend server is running before opening index.html.

Future Enhancements:

Implement a search filter for news.
Add pagination for better navigation.
Improve UI design with animations.