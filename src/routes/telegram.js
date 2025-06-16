const express = require('express');
const router = express.Router();
const TelegramSubscription = require('../models/TelegramSubscription');
const { PROVINCES } = require('../services/scraper');

router.get('/', (req, res) => {
    const Outage = require('../models/outage');
    Outage.distinct('powerCompany').then(powerCompanies => {
        res.render('telegram', {
            provinces: PROVINCES.map(p => p.name),
            powerCompanies
        });
    });
});

router.post('/', async (req, res) => {
    try {
        const { chatId, province, district, ward } = req.body;

        // Kiểm tra xem đã đăng ký chưa
        const existingSubscription = await TelegramSubscription.findOne({ chatId });
        if (existingSubscription) {
            return res.render('telegram', {
                error: 'Bạn đã đăng ký nhận thông báo trước đó.',
                provinces: PROVINCES.map(p => p.name)
            });
        }

        // Tạo subscription mới
        const subscription = new TelegramSubscription({
            chatId,
            province,
            district,
            ward
        });

        await subscription.save();

        res.render('telegram', {
            success: 'Đăng ký nhận thông báo thành công!',
            provinces: PROVINCES.map(p => p.name)
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.render('telegram', {
            error: 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại sau.',
            provinces: PROVINCES.map(p => p.name)
        });
    }
});

module.exports = router; 