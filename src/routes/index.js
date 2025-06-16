const express = require('express');
const router = express.Router();
const Outage = require('../models/outage');
const { PROVINCES, scrapeOutages } = require('../services/scraper');

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

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const [outages, total] = await Promise.all([
            Outage.find({ startTime: { $gte: new Date() } })
                .sort({ startTime: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Outage.countDocuments({ startTime: { $gte: new Date() } })
        ]);

        const totalPages = Math.max(1, Math.ceil(total / limit));
        const pagesToShow = getPagesToShow(page, totalPages);

        // Lấy danh sách công ty điện lực duy nhất
        const powerCompanies = await Outage.distinct('powerCompany');

        // Lấy ngày hôm nay (giờ VN)
        const now = new Date();
        const todayVN = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrowVN = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        // Lấy danh sách tỉnh và tổng số lượt cúp điện, số hôm nay, số sắp tới
        const provinceStats = await Outage.aggregate([
            {
                $group: {
                    _id: "$province",
                    count: { $sum: 1 },
                    outages: { $push: "$startTime" }
                }
            }
        ]);
        // Tính số hôm nay và sắp tới cho từng tỉnh
        for (const stat of provinceStats) {
            stat.today = stat.outages.filter(t => {
                const d = new Date(t);
                return d >= todayVN && d < tomorrowVN;
            }).length;
            stat.upcoming = stat.outages.filter(t => {
                const d = new Date(t);
                return d >= tomorrowVN;
            }).length;
        }
        provinceStats.sort((a, b) => b.count - a.count);

        // Mapping tỉnh -> vùng miền
        const provincesRegion = {
            "Hà Nội": "Miền Bắc", "Hải Phòng": "Miền Bắc", "Bắc Giang": "Miền Bắc", "Bắc Kạn": "Miền Bắc", "Bắc Ninh": "Miền Bắc", "Cao Bằng": "Miền Bắc", "Điện Biên": "Miền Bắc", "Hà Giang": "Miền Bắc", "Hà Nam": "Miền Bắc", "Hải Dương": "Miền Bắc", "Hưng Yên": "Miền Bắc", "Lai Châu": "Miền Bắc", "Lạng Sơn": "Miền Bắc", "Lào Cai": "Miền Bắc", "Nam Định": "Miền Bắc", "Ninh Bình": "Miền Bắc", "Phú Thọ": "Miền Bắc", "Quảng Ninh": "Miền Bắc", "Sơn La": "Miền Bắc", "Thái Bình": "Miền Bắc", "Thái Nguyên": "Miền Bắc", "Tuyên Quang": "Miền Bắc", "Vĩnh Phúc": "Miền Bắc",
            "Đà Nẵng": "Miền Trung", "Thanh Hoá": "Miền Trung", "Nghệ An": "Miền Trung", "Hà Tĩnh": "Miền Trung", "Quảng Bình": "Miền Trung", "Quảng Trị": "Miền Trung", "Thừa Thiên Huế": "Miền Trung", "Quảng Nam": "Miền Trung", "Quảng Ngãi": "Miền Trung", "Bình Định": "Miền Trung", "Phú Yên": "Miền Trung", "Khánh Hoà": "Miền Trung", "Ninh Thuận": "Miền Trung", "Bình Thuận": "Miền Trung", "Kon Tum": "Miền Trung", "Gia Lai": "Miền Trung", "Đắk Lắk": "Miền Trung", "Đắk Nông": "Miền Trung", "Lâm Đồng": "Miền Trung",
            "TP. Hồ Chí Minh": "Miền Nam", "Bà Rịa - Vũng Tàu": "Miền Nam", "Bình Dương": "Miền Nam", "Bình Phước": "Miền Nam", "Bình Thuận": "Miền Nam", "Cà Mau": "Miền Nam", "Cần Thơ": "Miền Nam", "Đồng Nai": "Miền Nam", "Đồng Tháp": "Miền Nam", "Hậu Giang": "Miền Nam", "Kiên Giang": "Miền Nam", "Long An": "Miền Nam", "Sóc Trăng": "Miền Nam", "Tây Ninh": "Miền Nam", "Tiền Giang": "Miền Nam", "Trà Vinh": "Miền Nam", "Vĩnh Long": "Miền Nam", "An Giang": "Miền Nam", "Bạc Liêu": "Miền Nam", "Bến Tre": "Miền Nam"
        };

        res.render('home', {
            outages,
            provinces: PROVINCES.map(p => p.name),
            currentPage: page,
            totalPages,
            pagesToShow,
            powerCompanies,
            provinceStats,
            provincesRegion
        });
    } catch (error) {
        console.error('Error fetching outages:', error);
        res.status(500).render('error', { message: 'Lỗi khi tải dữ liệu' });
    }
});

// Route để trigger scraping
router.get('/scrape', async (req, res) => {
  try {
    await scrapeOutages();
    res.send('Scraping completed successfully!');
  } catch (error) {
    console.error('Error during scraping:', error);
    res.status(500).send('Error during scraping: ' + error.message);
  }
});

// API trả về lịch cắt điện theo tỉnh
router.get('/api/outages', async (req, res) => {
  try {
    const { province } = req.query;
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    if (!province) return res.status(400).json({ error: 'Thiếu tham số province' });
    const query = { province, startTime: { $gte: new Date() } };
    const total = await Outage.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const outages = await Outage.find(query)
      .sort({ startTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    res.json({ outages, currentPage: page, totalPages, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router; 
