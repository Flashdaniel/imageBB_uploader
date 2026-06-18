# ImgBB Uploader Premium (Full-Stack Edition)

A sleek, ultra-professional web-based image dashboard built to interact seamlessly with the [ImgBB API](https://api.imgbb.com/). Designed with a beautiful, tactile Glassmorphism aesthetic, this tool has evolved from a simple static website into a robust **Full-Stack Application** featuring user authentication, local database persistence, and advanced web-scraping to sync your historic uploads natively!

## 🔥 Key Features

- **Advanced Authentication System**: Securely register and log in to your own isolated dashboard. Sessions are protected using industry-standard JWTs and bcrypt password hashing.
- **SQLite Database Persistence**: All your uploads, sync history, and metadata are securely stored in an embedded SQLite database. No more losing data when you clear your browser cache!
- **ImgBB Native Account Sync**: Lost the API upload history? Enter your ImgBB account credentials, and our backend **Puppeteer scraper** will securely log in to ImgBB and synchronize your entire profile history directly into your dashboard.
- **Smart Pagination**: View your images in a fast, responsive 12-item grid layout with sleek page navigation. The dashboard perfectly remembers your scroll position and active tab across page refreshes.
- **One-Click Image Downloads**: Beautifully integrated download buttons allow you to fetch and download high-resolution images back to your local device directly from the dashboard.
- **Custom Modal Dialogs**: Goodbye ugly browser popups! Dangerous actions (like deleting or clearing history) are protected by beautiful glassmorphism confirmation modals.
- **Links-Only Mode**: A custom toggle switch to collapse the results grid into a compact list of raw URLs while keeping success badges elegantly visible.
- **Parallel Uploading**: Upload multiple images simultaneously. It's blazingly fast.

## 🚀 Setup & Local Development

### 1. Prerequisites
Ensure you have **Node.js** (v18 or higher) installed on your system.

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Server
Start the Node.js backend:
```bash
npm start
```

### 4. Open the App
Navigate to `http://localhost:3000` in your web browser. Register a new account to get started!

## 🌍 Live Deployment (Render.com)

Because this application uses a Node.js backend, an SQLite database, and Puppeteer (which requires Chromium OS dependencies), it **cannot** be hosted on static sites like GitHub Pages. 

It is officially configured to be deployed effortlessly on [Render](https://render.com/) via the included Docker configuration.

### Deployment Steps:
1. Create a new **Web Service** on Render and connect this GitHub repository.
2. Render will automatically detect the included **Dockerfile** and set the environment to `Docker`.
3. In the Render Advanced settings, add an Environment Variable named `JWT_SECRET` and set it to a long, secure, random string.
4. Click **Create Web Service**. The build process will compile SQLite from source and install Chromium automatically.

*(Note: If you use Render's free tier, the filesystem is ephemeral and your database may periodically reset. For persistent data, consider upgrading to a Render Disk or migrating to a Postgres database).*

## 🛠️ Technologies Used
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 (CSS Variables, Grid, Flexbox, Glassmorphism, Animations, Modals)
- **Backend**: Node.js, Express.js
- **Database**: SQLite3 (compiled from source for OS-matching glibc)
- **Security**: JWT (JSON Web Tokens), bcrypt
- **Scraping**: Puppeteer Core (with smart Chevereto DOM traversal)
- **Deployment**: Docker

---
*Built to eliminate the friction of image hosting.*
