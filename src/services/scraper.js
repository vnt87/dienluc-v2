const axios = require('axios');
const cheerio = require('cheerio');
const Outage = require('../models/outage');
const { sendTelegramNotification } = require('./telegram');

const PROVINCES = [
  { name: "Hà Nội", url: "https://lichcupdien.org/lich-cup-dien-ha-noi" },
  { name: "Hà Giang", url: "https://lichcupdien.org/lich-cup-dien-ha-giang" },
  { name: "Cao Bằng", url: "https://lichcupdien.org/lich-cup-dien-cao-bang" },
  { name: "Bắc Kạn", url: "https://lichcupdien.org/lich-cup-dien-bac-kan" },
  { name: "Tuyên Quang", url: "https://lichcupdien.org/lich-cup-dien-tuyen-quang" },
  { name: "Lào Cai", url: "https://lichcupdien.org/lich-cup-dien-lao-cai" },
  { name: "Điện Biên", url: "https://lichcupdien.org/lich-cup-dien-dien-bien" },
  { name: "Lai Châu", url: "https://lichcupdien.org/lich-cup-dien-lai-chau" },
  { name: "Sơn La", url: "https://lichcupdien.org/lich-cup-dien-son-la" },
  { name: "Yên Bái", url: "https://lichcupdien.org/lich-cup-dien-yen-bai" },
  { name: "Hoà Bình", url: "https://lichcupdien.org/lich-cup-dien-hoa-binh" },
  { name: "Thái Nguyên", url: "https://lichcupdien.org/lich-cup-dien-thai-nguyen" },
  { name: "Lạng Sơn", url: "https://lichcupdien.org/lich-cup-dien-lang-son" },
  { name: "Quảng Ninh", url: "https://lichcupdien.org/lich-cup-dien-quang-ninh" },
  { name: "Bắc Giang", url: "https://lichcupdien.org/lich-cup-dien-bac-giang" },
  { name: "Phú Thọ", url: "https://lichcupdien.org/lich-cup-dien-phu-tho" },
  { name: "Vĩnh Phúc", url: "https://lichcupdien.org/lich-cup-dien-vinh-phuc" },
  { name: "Bắc Ninh", url: "https://lichcupdien.org/lich-cup-dien-bac-ninh" },
  { name: "Hải Dương", url: "https://lichcupdien.org/lich-cup-dien-hai-duong" },
  { name: "Hải Phòng", url: "https://lichcupdien.org/lich-cup-dien-hai-phong" },
  { name: "Hưng Yên", url: "https://lichcupdien.org/lich-cup-dien-hung-yen" },
  { name: "Thái Bình", url: "https://lichcupdien.org/lich-cup-dien-thai-binh" },
  { name: "Hà Nam", url: "https://lichcupdien.org/lich-cup-dien-ha-nam" },
  { name: "Nam Định", url: "https://lichcupdien.org/lich-cup-dien-nam-dinh" },
  { name: "Ninh Bình", url: "https://lichcupdien.org/lich-cup-dien-ninh-binh" },
  { name: "Thanh Hoá", url: "https://lichcupdien.org/lich-cup-dien-thanh-hoa" },
  { name: "Nghệ An", url: "https://lichcupdien.org/lich-cup-dien-nghe-an" },
  { name: "Hà Tĩnh", url: "https://lichcupdien.org/lich-cup-dien-ha-tinh" },
  { name: "Quảng Bình", url: "https://lichcupdien.org/lich-cup-dien-quang-binh" },
  { name: "Quảng Trị", url: "https://lichcupdien.org/lich-cup-dien-quang-tri" },
  { name: "Thừa Thiên Huế", url: "https://lichcupdien.org/lich-cup-dien-thua-thien-hue" },
  { name: "Đà Nẵng", url: "https://lichcupdien.org/lich-cup-dien-da-nang" },
  { name: "Quảng Nam", url: "https://lichcupdien.org/lich-cup-dien-quang-nam" },
  { name: "Quảng Ngãi", url: "https://lichcupdien.org/lich-cup-dien-quang-ngai" },
  { name: "Bình Định", url: "https://lichcupdien.org/lich-cup-dien-binh-dinh" },
  { name: "Phú Yên", url: "https://lichcupdien.org/lich-cup-dien-phu-yen" },
  { name: "Khánh Hoà", url: "https://lichcupdien.org/lich-cup-dien-khanh-hoa" },
  { name: "Ninh Thuận", url: "https://lichcupdien.org/lich-cup-dien-ninh-thuan" },
  { name: "Bình Thuận", url: "https://lichcupdien.org/lich-cup-dien-binh-thuan" },
  { name: "Kon Tum", url: "https://lichcupdien.org/lich-cup-dien-kon-tum" },
  { name: "Gia Lai", url: "https://lichcupdien.org/lich-cup-dien-gia-lai" },
  { name: "Đắk Lắk", url: "https://lichcupdien.org/lich-cup-dien-dak-lak" },
  { name: "Đắk Nông", url: "https://lichcupdien.org/lich-cup-dien-dak-nong" },
  { name: "Lâm Đồng", url: "https://lichcupdien.org/lich-cup-dien-lam-dong" },
  { name: "Bình Phước", url: "https://lichcupdien.org/lich-cup-dien-binh-phuoc" },
  { name: "Tây Ninh", url: "https://lichcupdien.org/lich-cup-dien-tay-ninh" },
  { name: "Bình Dương", url: "https://lichcupdien.org/lich-cup-dien-binh-duong" },
  { name: "Đồng Nai", url: "https://lichcupdien.org/lich-cup-dien-dong-nai" },
  { name: "Bà Rịa - Vũng Tàu", url: "https://lichcupdien.org/lich-cup-dien-ba-ria-vung-tau" },
  { name: "Hồ Chí Minh", url: "https://lichcupdien.org/lich-cup-dien-ho-chi-minh" },
  { name: "Long An", url: "https://lichcupdien.org/lich-cup-dien-long-an" },
  { name: "Tiền Giang", url: "https://lichcupdien.org/lich-cup-dien-tien-giang" },
  { name: "Bến Tre", url: "https://lichcupdien.org/lich-cup-dien-ben-tre" },
  { name: "Trà Vinh", url: "https://lichcupdien.org/lich-cup-dien-tra-vinh" },
  { name: "Vĩnh Long", url: "https://lichcupdien.org/lich-cup-dien-vinh-long" },
  { name: "Đồng Tháp", url: "https://lichcupdien.org/lich-cup-dien-dong-thap" },
  { name: "An Giang", url: "https://lichcupdien.org/lich-cup-dien-an-giang" },
  { name: "Kiên Giang", url: "https://lichcupdien.org/lich-cup-dien-kien-giang" },
  { name: "Cần Thơ", url: "https://lichcupdien.org/lich-cup-dien-can-tho" },
  { name: "Hậu Giang", url: "https://lichcupdien.org/lich-cup-dien-hau-giang" },
  { name: "Sóc Trăng", url: "https://lichcupdien.org/lich-cup-dien-soc-trang" },
  { name: "Bạc Liêu", url: "https://lichcupdien.org/lich-cup-dien-bac-lieu" },
  { name: "Cà Mau", url: "https://lichcupdien.org/lich-cup-dien-ca-mau" }
];

async function scrapeOutages() {
  for (const province of PROVINCES) {
    try {
      console.log(`Scraping data for ${province.name}...`);
      const response = await axios.get(province.url);
      const $ = cheerio.load(response.data);
      
      const outages = [];
      $('.lcd_detail_wrapper').each((i, element) => {
        const $item = $(element);

        let powerCompany = '';
        let dateStr = '';
        let startTimeStr = '';
        let endTimeStr = '';
        let location = '';
        let reason = '';
        let status = '';

        $item.find('.new_lcd_wrapper').each((j, row) => {
          const label = $(row).find('.title_item_lcd_wrapper').text().trim();
          const value = $(row).find('.content_item_content_lcd_wrapper').text().trim();

          if (label === 'Điện lực:') powerCompany = value;
          if (label === 'Ngày:') dateStr = value;
          if (label === 'Thời gian:') {
            // value: "Từ 07:30 đến 08:30"
            const matches = value.match(/Từ\s*(\d{2}:\d{2})\s*đến\s*(\d{2}:\d{2})/);
            if (matches) {
              startTimeStr = matches[1];
              endTimeStr = matches[2];
            }
          }
          if (label === 'Khu vực:') location = value;
          if (label === 'Lý do:') reason = value;
          if (label === 'Trạng thái:') status = value;
        });

        // Parse ngày/tháng/năm từ dạng "16 tháng 6 năm 2025"
        let startTime = null, endTime = null;
        const dateMatch = dateStr.match(/(\d{1,2}) tháng (\d{1,2}) năm (\d{4})/);
        if (dateMatch && startTimeStr && endTimeStr) {
          const [_, day, month, year] = dateMatch;
          startTime = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${startTimeStr}:00`);
          endTime = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${endTimeStr}:00`);
        }

        if (location && startTime && endTime) {
          outages.push({
            province: province.name,
            district: powerCompany,
            ward: location,
            startTime,
            endTime,
            reason,
            powerCompany,
            status,
            source: province.url
          });
        } else {
          console.warn('Bỏ qua 1 record vì thiếu trường bắt buộc:', { location, startTime, endTime });
        }
      });

      for (const outage of outages) {
        const existingOutage = await Outage.findOne({
          province: outage.province,
          district: outage.district,
          ward: outage.ward,
          startTime: outage.startTime,
          endTime: outage.endTime
        });

        if (!existingOutage) {
          const newOutage = new Outage(outage);
          await newOutage.save();
          if (typeof sendTelegramNotification === 'function') {
            await sendTelegramNotification(newOutage);
          }
        }
      }

      console.log(`Saved ${outages.length} outages for ${province.name}`);
    } catch (error) {
      console.error(`Error scraping ${province.name}:`, error.message);
    }
  }
}

module.exports = {
  scrapeOutages,
  PROVINCES
}; 