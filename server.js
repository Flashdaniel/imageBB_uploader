const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const puppeteer = require('puppeteer');
const { getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ error: 'Not authorized' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token invalid or expired' });
        req.user = user;
        next();
    });
}

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

        const db = await getDb();
        const existing = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (existing) return res.status(400).json({ error: 'Username already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        
        const token = jwt.sign({ id: result.lastID, username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const db = await getDb();
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Protected routes
app.get('/api/metadata', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const rows = await db.all('SELECT * FROM uploads WHERE user_id = ? OR user_id IS NULL ORDER BY date DESC', [req.user.id]);
        res.json(rows.map(row => ({
            ...row,
            isSuccess: row.isSuccess === 1
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch metadata' });
    }
});

app.post('/api/metadata', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const item = req.body;
        
        await db.run(`
            INSERT OR REPLACE INTO uploads (id, name, date, url, display_url, delete_url, isSuccess, user_id, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            item.id,
            item.name,
            item.date,
            item.url,
            item.display_url,
            item.delete_url,
            item.isSuccess ? 1 : 0,
            req.user.id,
            'upload'
        ]);
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error saving metadata:', err);
        res.status(500).json({ error: 'Failed to update metadata' });
    }
});

app.delete('/api/metadata/:id', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        await db.run('DELETE FROM uploads WHERE id = ? AND (user_id = ? OR user_id IS NULL)', [req.params.id, req.user.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting metadata:', err);
        res.status(500).json({ error: 'Failed to delete metadata' });
    }
});

app.delete('/api/metadata', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        await db.run('DELETE FROM uploads WHERE user_id = ? OR user_id IS NULL', [req.user.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to clear metadata' });
    }
});

// Sync
app.post('/api/sync', authenticateToken, async (req, res) => {
    const { imgbbUsername, imgbbPassword, provider = 'imgbb' } = req.body;
    if (!imgbbUsername || !imgbbPassword) return res.status(400).json({ error: 'Credentials required' });

    try {
        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
        
        if (provider === 'imgbb') {
            await page.goto('https://imgbb.com/login', { waitUntil: 'networkidle2' });
            await page.type('#login-subject', imgbbUsername, { delay: 50 });
            await page.type('#login-password', imgbbPassword, { delay: 50 });
            await Promise.all([
                page.click('button[type="submit"]'),
                page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})
            ]);
        } else if (provider === 'google') {
            await page.goto('https://imgbb.com/login', { waitUntil: 'networkidle2' });
            await Promise.all([
                page.click('.btn-google'),
                page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})
            ]);
            await page.waitForSelector('input[type="email"]');
            await page.type('input[type="email"]', imgbbUsername);
            await page.keyboard.press('Enter');
            await new Promise(r => setTimeout(r, 2000));
            await page.waitForSelector('input[type="password"]', { visible: true });
            await page.type('input[type="password"]', imgbbPassword);
            await page.keyboard.press('Enter');
            await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
            await new Promise(r => setTimeout(r, 3000));
        } else if (provider === 'facebook') {
            await page.goto('https://imgbb.com/login', { waitUntil: 'networkidle2' });
            await Promise.all([
                page.click('.btn-facebook'),
                page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})
            ]);
            await page.waitForSelector('#email');
            await page.type('#email', imgbbUsername);
            await page.type('#pass', imgbbPassword);
            await page.click('button[name="login"]');
            await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
            await new Promise(r => setTimeout(r, 3000));
        } else if (provider === 'twitter') {
            await page.goto('https://imgbb.com/login', { waitUntil: 'networkidle2' });
            await Promise.all([
                page.click('.btn-twitter'),
                page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})
            ]);
            await page.waitForSelector('input[autocomplete="username"]');
            await page.type('input[autocomplete="username"]', imgbbUsername);
            await page.keyboard.press('Enter');
            await new Promise(r => setTimeout(r, 2000));
            await page.waitForSelector('input[name="password"]');
            await page.type('input[name="password"]', imgbbPassword);
            await page.keyboard.press('Enter');
            await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
            await new Promise(r => setTimeout(r, 3000));
        } else if (provider === 'vk') {
            await page.goto('https://imgbb.com/login', { waitUntil: 'networkidle2' });
            await Promise.all([
                page.click('.btn-vk'),
                page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})
            ]);
            await page.waitForSelector('input[name="email"]');
            await page.type('input[name="email"]', imgbbUsername);
            const pwField = await page.$('input[name="pass"]');
            if (pwField) {
                 await page.type('input[name="pass"]', imgbbPassword);
                 await page.click('#install_allow');
            } else {
                 await page.keyboard.press('Enter');
                 await new Promise(r => setTimeout(r, 2000));
                 await page.type('input[name="password"]', imgbbPassword);
                 await page.keyboard.press('Enter');
            }
            await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
            await new Promise(r => setTimeout(r, 3000));
        }

        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
            await page.screenshot({ path: 'sync-failed-debug.png' });
            await browser.close();
            return res.status(400).json({ error: 'Failed to login to ImgBB. Check your credentials.' });
        }

        const images = await page.evaluate(() => {
            const data = [];
            
            // Method 1: Chevereto .list-item
            const listItems = document.querySelectorAll('.list-item, .image-container');
            if (listItems.length > 0) {
                listItems.forEach(item => {
                    const img = item.querySelector('img');
                    if (img && img.src) {
                        let url = img.src.replace(/\.th\./, '.').replace(/\.md\./, '.');
                        let name = 'Synced Image';
                        let titleEl = item.querySelector('.list-item-desc-title, .title, .image-title');
                        if (titleEl && titleEl.innerText) name = titleEl.innerText.trim();
                        else if (img.alt) name = img.alt.trim();
                        
                        data.push({
                            url: url,
                            name: name,
                            date: new Date().toISOString()
                        });
                    }
                });
            } else {
                // Method 2: Generic fallback
                const allImages = document.querySelectorAll('img');
                allImages.forEach(img => {
                    if (img.src && (img.src.includes('ibb.co') || img.src.includes('simgbb.com'))) {
                        if (img.src.includes('logo') || img.src.includes('avatar') || img.src.includes('icon')) return;
                        
                        let url = img.src.replace(/\.th\./, '.').replace(/\.md\./, '.');
                        data.push({
                            url: url,
                            name: img.alt || 'Synced Image',
                            date: new Date().toISOString()
                        });
                    }
                });
            }

            // Deduplicate
            const unique = [];
            const seen = new Set();
            for (const item of data) {
                if (!seen.has(item.url)) {
                    seen.add(item.url);
                    unique.push(item);
                }
            }
            return unique;
        });
        
        await browser.close();

        const db = await getDb();
        let added = 0;
        for (const img of images) {
            const exists = await db.get('SELECT id FROM uploads WHERE url = ? AND user_id = ?', [img.url, req.user.id]);
            if (!exists) {
                await db.run(`
                    INSERT INTO uploads (id, name, date, url, display_url, isSuccess, user_id, source)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    img.name,
                    new Date().toISOString(),
                    img.url,
                    img.displayUrl,
                    1,
                    req.user.id,
                    'sync'
                ]);
                added++;
            }
        }

        res.json({ success: true, added, totalFound: images.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sync failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
