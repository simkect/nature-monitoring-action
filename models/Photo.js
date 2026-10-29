const mongoose = require('mongoose');

const labelSchema = new mongoose.Schema({
  label: String,
  probability: Number
}, { _id: false });

const photoSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  caption: { type: String, default: 'Untitled Observation' },
  labels: [labelSchema],
  metadata: {
    latitude: Number,
    longitude: Number,
    compassHeading: Number,
    capturedAt: { type: Date, default: Date.now },
    capturedDate: String,    // "29 October 2026"
    capturedTime: String,    // "14:32"
    capturedDay: String,     // "2026-10-29" (for grouping)
    capturedYear: Number,    // 2026
    capturedMonth: Number    // 10
  },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Index for fast filtering
photoSchema.index({ 'metadata.capturedAt': 1 });
photoSchema.index({ author: 1 });

module.exports = mongoose.model('Photo', photoSchema);