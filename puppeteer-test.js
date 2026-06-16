const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    console.log('Attempting to upload a file via file input...');
    try {
        const fileInput = await page.$('#file-input');
        const testImagePath = path.join(__dirname, 'images', 'daniel_photo.png');
        await fileInput.uploadFile(testImagePath);
        
        console.log('File uploaded to input. Waiting a moment...');
        await new Promise(r => setTimeout(r, 1000));
        
        const previewItems = await page.$$('.file-item');
        console.log('Number of file previews found:', previewItems.length);
    } catch (err) {
        console.error('Error during test:', err);
    }

    await browser.close();
    console.log('Done.');
})();
