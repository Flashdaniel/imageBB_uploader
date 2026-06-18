const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
    try {
        const browser = await puppeteer.launch({ 
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            headless: 'new' 
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
        
        await page.goto('https://imgbb.com/', { waitUntil: 'networkidle2' });
        
        // Find any image link or list item
        const html = await page.content();
        fs.writeFileSync('imgbb-home.html', html);
        
        console.log('Saved to imgbb-home.html');
        await browser.close();
    } catch (e) {
        console.error(e);
    }
})();
