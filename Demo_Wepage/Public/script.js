document.addEventListener("DOMContentLoaded", () => {
    fetchNews("Political News"); // Load Political News by default

    // Add event listeners to navigation links
    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            const category = this.textContent.trim();
            fetchNews(category);
        });
    });
});

document.getElementById("dark-mode-toggle").addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
});

function fetchNews(category) {
    fetch(`http://localhost:5000/google-news?category=${encodeURIComponent(category)}`)
        .then(response => response.json())
        .then(newsData => {
            const container = document.getElementById("news-container");
            container.innerHTML = "";

            newsData.forEach(news => {
                const newsCard = document.createElement("div");
                newsCard.classList.add("col-md-4", "news-card"); // Added news-card class

                // Create image element
                const img = document.createElement("img");
                img.src = news.image;
                img.alt = "News Image";
                img.classList.add("news-thumbnail"); // Added news-thumbnail class

                newsCard.innerHTML = `
                    ${img.outerHTML}
                    <div class="card-body">
                        <h5 class="card-title">${news.title}</h5>
                        <a href="${news.link}" class="btn btn-primary" target="_blank">Read More</a>
                    </div>
                `;
                container.appendChild(newsCard);
            });
        })
        .catch(error => console.error("Error fetching Google News:", error));
}

function fetchMoreNews() {
    fetch(`http://localhost:5000/news?page=2`)  // Example pagination
        .then(response => response.json())
        .then(data => displayNews(data.articles, true))
        .catch(error => console.error("Error fetching more news:", error));
}

function displayNews(articles) {
    newsContainer.innerHTML = "";
    articles.forEach(article => {
        const newsCard = document.createElement("div");
        newsCard.classList.add("news-card");

        const imageUrl = article.image || "default-image.jpg"; // Use default if no image

        newsCard.innerHTML = `
            <img src="${imageUrl}" alt="News Image" class="news-thumbnail">
            <h3>${article.title}</h3>
            <p>${article.description || "No description available."}</p>
            <a href="${article.url}" target="_blank">Read more</a>
        `;
        newsContainer.appendChild(newsCard);
    });
}

window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        fetchMoreNews(); // Fetch additional news on scroll
    }
});

async function loginUser(email, password) {
    const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
    }
}

if ("Notification" in window) {
    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            new Notification("Breaking News!", {
                body: "Check out the latest news!",
                icon: "news-icon.png"
            });
        }
    });
}