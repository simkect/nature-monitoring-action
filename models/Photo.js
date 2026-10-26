const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  caption: { type: String, default: 'Untitled Observation' },
  labels: [{ label: String, probability: Number }],
  metadata: {
    latitude: Number,
    longitude: Number,
    compassHeading: Number,
    capturedAt: Date
  },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Photo', photoSchema);