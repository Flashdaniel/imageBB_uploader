# ImgBB Uploader Premium

A sleek, ultra-professional web-based image uploader built to interact seamlessly with the [ImgBB API](https://api.imgbb.com/). Designed with a beautiful, tactile Glassmorphism aesthetic, this tool allows you to securely upload images directly from your browser in parallel, without any backend processing overhead.

![ImgBB Uploader UI](./screenshot.png)

## Features
- **Parallel Uploading**: Upload multiple images simultaneously. It's blazingly fast.
- **Direct Browser Uploads**: Uploads images straight to ImgBB securely from the client side. Your API key never touches a third-party server.
- **Local Storage Persistence**: Your API key, your UI preferences, and your full upload history are automatically saved directly to your browser. You can refresh the page safely without losing anything.
- **Drag & Drop Interface**: Seamlessly drop images onto the page or click to browse.
- **Real-Time Previews**: Generates local thumbnail previews of your selected images instantly.
- **Links-Only Mode**: A custom toggle switch to collapse the results grid into a compact list of raw URLs.
- **Bulk Clipboard Actions**: Click the "Copy All" button to instantly copy every successful image URL from your current history to your clipboard.
- **History Management**: Delete individual image records or clear your entire upload history in one click.
- **Premium UI**: Hand-crafted, modern, glassmorphism UI with subtle gradients and smooth micro-animations.

## Live Demo
Check out the live deployment here: **[https://Flashdaniel.github.io/imageBB_uploader/](https://Flashdaniel.github.io/imageBB_uploader/)**

## Setup & Usage (Local Development)

1. **Start a local server**:
   Serve the `public` directory using any local web server. For example, using Node.js:
   ```bash
   npx serve public
   ```
2. **Open the app**:
   Navigate to `http://localhost:3000` in your web browser.
3. **Configure your API Key**:
   Paste your ImgBB API v1 Key into the input field. (It securely saves to your browser's local storage so you don't have to enter it again).
4. **Upload**:
   Drag, drop, and upload!

## Technologies Used
- HTML5
- CSS3 (CSS Variables, Grid, Flexbox, Glassmorphism, Animations)
- Vanilla JavaScript (ES6+, Fetch API, Promises, LocalStorage)

---
*Built to eliminate the friction of image hosting.*
