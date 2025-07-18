const express = require('express');
const { Log } = require('./logger/logger');

const app = express();
app.use(express.json());

// In-memory store for demo only
const urls = {}; // { shortcode: {originalUrl, createdAt, expiresAt, stats: {visits, createdBy}} }

// --- URL Shortening Endpoint
app.post('/shorturls', async (req, res) => {
  try {
    await Log('backend', 'info', 'route', 'POST /shorturls called.');

    const { url, validity, shortcode } = req.body;
    // Basic validation
    if (!url || typeof url !== 'string' || !/^https?:\/\/.+/.test(url)) {
      await Log('backend', 'warn', 'route', 'Invalid original URL');
      return res.status(400).json({ error: 'Invalid or missing URL.' });
    }
    let code = shortcode || Math.random().toString(36).substring(2, 8);
    if (urls[code]) {
      await Log('backend', 'warn', 'route', 'Shortcode already exists');
      return res.status(409).json({ error: 'Shortcode taken.' });
    }

    // Handle optional validity
    let expiresAt = null;
    if (validity) {
      let expireDate = new Date(validity);
      if (isNaN(expireDate.getTime())) {
        await Log('backend', 'warn', 'route', 'Invalid expiry date');
        return res.status(400).json({ error: 'Invalid validity/expiration datetime.' });
      }
      expiresAt = expireDate;
    }

    urls[code] = {
      originalUrl: url,
      createdAt: new Date(),
      expiresAt,
      stats: { visits: 0 }
    };

    await Log('backend', 'info', 'repository', `Short URL created for ${url} as ${code}`);
    res.status(201).json({ shortUrl: code });
  } catch (err) {
    await Log('backend', 'error', 'handler', 'Error in POST /shorturls: ' + err.message);
    res.status(500).json({ error: 'Failed to create short URL.' });
  }
});

// --- Statistics Endpoint
app.get('/shorturls/:shortcode', async (req, res) => {
  try {
    const code = req.params.shortcode;
    await Log('backend', 'info', 'route', `GET /shorturls/${code} called`);
    const entry = urls[code];
    if (!entry) {
      await Log('backend', 'warn', 'repository', `Shortcode ${code} not found`);
      return res.status(404).json({ error: 'Shortcode not found.' });
    }

    // Update visits count for stats demo (not for analytics, just stats)
    entry.stats.visits += 1;

    res.json({
      originalUrl: entry.originalUrl,
      createdAt: entry.createdAt,
      expiresAt: entry.expiresAt,
      stats: entry.stats
    });
    await Log('backend', 'info', 'repository', `Stats returned for ${code}`);
  } catch (err) {
    await Log('backend', 'error', 'handler', 'Error in GET /shorturls/:shortcode: ' + err.message);
    res.status(500).json({ error: 'Failed to get stats.' });
  }
});

module.exports = app;
