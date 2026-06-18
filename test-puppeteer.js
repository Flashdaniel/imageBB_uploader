const puppeteer = require('puppeteer-core');

(async () => {
    try {
        const browser = await puppeteer.launch({ 
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            headless: 'new' 
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
        
        console.log('Navigating to login...');
        await page.goto('https://imgbb.com/login', { waitUntil: 'networkidle2' });
        
        console.log('Typing credentials...');
        await page.type('#login-subject', 'dummy_user_1234');
        await page.type('#login-password', 'dummy_pass_1234');
        
        console.log('Submitting...');
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})
        ]);
        
        console.log('Checking result...');
        await page.screenshot({ path: 'test-login-screenshot.png' });
        console.log('Screenshot saved to test-login-screenshot.png');
        await browser.close();
    } catch (e) {
        console.error('Crash:', e);
    }
})();
