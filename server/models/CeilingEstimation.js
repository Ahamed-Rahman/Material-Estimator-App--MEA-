const mongoose = require('mongoose');

const ceilingEstimationSchema = new mongoose.Schema({
  userId: String,
  projectName: String,
  date: String,
  roomLength: Number,
  roomWidth: Number,
  priceMT: Number,
  priceCT: Number,
  pricePanel: Number,
  priceWA: Number,
  recommendedOption: String,
  MT: Number,
  CT: Number,
  Panels: Number,
  WallAngles: Number,
  totalCost: Number,
  type: { type: String, default: 'Ceiling' }
  },
 { timestamps: true });


module.exports = mongoose.model('CeilingEstimation', ceilingEstimationSchema);
