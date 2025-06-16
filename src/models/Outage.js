const mongoose = require('mongoose');

const outageSchema = new mongoose.Schema({
  province: {
    type: String,
    required: true,
    index: true
  },
  district: {
    type: String,
    required: true,
    index: true
  },
  ward: {
    type: String,
    required: true,
    index: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  reason: String,
  powerCompany: {
    type: String
  },
  source: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient searching
outageSchema.index({ province: 1, district: 1, ward: 1 });

module.exports = mongoose.models.Outage || mongoose.model('Outage', outageSchema); 