const mongoose = require('mongoose');

const tileEstimationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectName: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  roomLength: {
    type: Number,
    required: true
  },
  roomWidth: {
    type: Number,
    required: true
  },
  tileLength: {
    type: Number,
    required: true
  },
  tileWidth: {
    type: Number,
    required: true
  },
  allowance: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  totalArea: {
    type: Number,
    required: true
  },
  tileCount: {
    type: Number,
    required: true
  },
  estimatedCost: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['Tile', 'Ceiling'],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('TileEstimation', tileEstimationSchema);
