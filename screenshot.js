const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ 
            defaultViewport: { width: 1200, height: 850 } 
        });
        const page = await browser.newPage();
        
        // Wait for the local server to respond
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        
        // Type a dummy API key to make the UI look active
        await page.type('#api-key', '••••••••••••••••••••••••••••••••');
        
        // Take a screenshot of the app
        await page.screenshot({ path: 'screenshot.png' });
        
        await browser.close();
        console.log('Screenshot saved successfully.');
    } catch (err) {
        console.error('Failed to take screenshot:', err);
    }
})();
