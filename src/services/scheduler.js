const cron = require('node-cron');
const { scrapeOutages } = require('./scraper');
const { checkAndNotifyNewOutages } = require('./telegram');

// Cập nhật dữ liệu vào 6 giờ sáng mỗi ngày
const SCHEDULE = '0 6 * * *';

function startScheduler() {
    console.log('Starting scheduler...');
    
    // Chạy ngay lập tức lần đầu tiên
    runUpdate();
    
    // Lên lịch chạy định kỳ
    cron.schedule(SCHEDULE, async () => {
        console.log('Running scheduled update...');
        await runUpdate();
    });
}

async function runUpdate() {
    try {
        console.log('Starting data update...');
        await scrapeOutages();
        await checkAndNotifyNewOutages();
        console.log('Data update completed successfully');
    } catch (error) {
        console.error('Error during scheduled update:', error);
    }
}

module.exports = {
    startScheduler
}; 