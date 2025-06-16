const express = require('express');
const router = express.Router();
const Outage = require('../models/outage');
const { scrapeOutages } = require('../services/scraper');
const { checkAndNotifyNewOutages } = require('../services/telegram');

// Home page - List all provinces and their outages
router.get('/', async (req, res) => {
  try {
    const provinces = await Outage.distinct('province');
    const outages = await Outage.find()
      .sort({ startTime: 1 })
      .limit(50);

    res.render('index', { provinces, outages });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Search outages
router.get('/search', async (req, res) => {
  try {
    const { province, district, ward } = req.query;
    const query = {};

    if (province) query.province = province;
    if (district) query.district = district;
    if (ward) query.ward = ward;

    const outages = await Outage.find(query)
      .sort({ startTime: 1 });

    res.render('search', { outages, query: req.query });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// API endpoint to get districts for a province
router.get('/api/districts/:province', async (req, res) => {
  try {
    const districts = await Outage.distinct('district', { province: req.params.province });
    res.json(districts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get wards for a district
router.get('/api/wards/:province/:district', async (req, res) => {
  try {
    const wards = await Outage.distinct('ward', {
      province: req.params.province,
      district: req.params.district
    });
    res.json(wards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manual trigger for scraping
router.post('/scrape', async (req, res) => {
  try {
    await scrapeOutages();
    await checkAndNotifyNewOutages();
    res.json({ message: 'Scraping completed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 