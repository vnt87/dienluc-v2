const express = require('express');
const router = express.Router();
const Outage = require('../models/outage');
const { PROVINCES } = require('../services/scraper');

router.get('/', async (req, res) => {
    try {
        const { province, powerCompany, content, startDate, endDate } = req.query;
        const query = {};

        if (province) query.province = province;
        if (powerCompany) query.powerCompany = powerCompany;
        if (content) {
            query.$or = [
                { province: { $regex: content, $options: 'i' } },
                { district: { $regex: content, $options: 'i' } },
                { ward: { $regex: content, $options: 'i' } },
                { reason: { $regex: content, $options: 'i' } },
                { powerCompany: { $regex: content, $options: 'i' } }
            ];
        }
        if (startDate || endDate) {
            query.startTime = {};
            if (startDate) {
                const [year, month, day] = startDate.split('-');
                query.startTime.$gte = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
            }
            if (endDate) {
                const [year, month, day] = endDate.split('-');
                query.startTime.$lte = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
            }
        }

        // Nếu không có startDate/endDate thì chỉ lấy các lịch từ hôm nay trở đi
        if (!startDate && !endDate) {
            const now = new Date();
            const todayVN = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            query.startTime = { ...query.startTime, $gte: todayVN };
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const [outages, total] = await Promise.all([
            Outage.find(query)
                .sort({ startTime: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Outage.countDocuments(query)
        ]);

        const totalPages = Math.max(1, Math.ceil(total / limit));
        function getPagesToShow(currentPage, totalPages) {
            const pages = [];
            if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
                if (currentPage > 4) {
                    pages.push(1, '...');
                }
                for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
                    pages.push(i);
                }
                if (currentPage < totalPages - 3) {
                    pages.push('...', totalPages);
                }
            }
            return pages;
        }
        const pagesToShow = getPagesToShow(page, totalPages);

        // Lấy danh sách công ty điện lực duy nhất
        const powerCompanies = await Outage.distinct('powerCompany');

        res.render('search', {
            outages,
            provinces: PROVINCES.map(p => p.name),
            query: req.query,
            powerCompanies,
            currentPage: page,
            totalPages,
            pagesToShow
        });
    } catch (error) {
        console.error('Error searching outages:', error);
        res.status(500).render('error', { message: 'Lỗi khi tìm kiếm dữ liệu' });
    }
});

module.exports = router; 