const mongoose = require('mongoose');

const telegramSubscriptionSchema = new mongoose.Schema({
    chatId: {
        type: String,
        required: true,
        unique: true
    },
    province: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: false
    },
    ward: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TelegramSubscription', telegramSubscriptionSchema); 