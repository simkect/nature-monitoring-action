const router = require('express').Router();
const mongoose = require('mongoose');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const { GridFSBucket } = require('mongodb');
const crypto = require('crypto');
const Photo = require('../models/Photo');
const User = require('../models/User');

const requireAuth = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

const storage = new GridFsStorage({
  url: process.env.MONGO_URI,
  file: () => ({ filename: crypto.randomBytes(16).toString('hex') + '.jpg', bucketName: 'photos' })
});
const upload = multer({ storage });

let bucket;
mongoose.connection.once('open', () => {
  bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'photos' });
});

// ===== INDEX with FILTERS =====
router.get('/', requireAuth, async (req, res) => {
  const { user, dateFrom, dateTo, label, search } = req.query;
  let query = {};

  // Filter by author
  if (user) query.author = user;

  // Filter by date range
  if (dateFrom || dateTo) {
    query['metadata.capturedAt'] = {};
    if (dateFrom) query['metadata.capturedAt'].$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      query['metadata.capturedAt'].$lte = end;
    }
  }

  // Filter by AI label
  if (label) query['labels.label'] = { $regex: label, $options: 'i' };

  // Filter by caption search
  if (search) query.caption = { $regex: search, $options: 'i' };

  const photos = await Photo.find(query).populate('author').sort({ createdAt: -1 });

  // Get all unique labels for the filter dropdown
  const allLabels = await Photo.distinct('labels.label');

  // Get all users for the filter dropdown
  const users = await User.find({}, 'username').sort({ username: 1 });

  res.render('index', {
    photos,
    filters: { user, dateFrom, dateTo, label, search },
    allLabels,
    users
  });
});

// ===== USER PROFILE PAGE =====
router.get('/user/:id', requireAuth, async (req, res) => {
  const user = await User.findById(req.params.id, '-password');
  if (!user) return res.redirect('/photos');
  const photos = await Photo.find({ author: user._id }).populate('author').sort({ createdAt: -1 });
  res.render('user-profile', { profileUser: user, photos });
});

// NEW (camera page)
router.get('/new', requireAuth, (req, res) => {
  res.render('new');
});

// ===== CREATE — supports BOTH camera capture and file upload =====
router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const meta = JSON.parse(req.body.metadata || '{}');
    const labels = JSON.parse(req.body.labels || '[]');
    
    await Photo.create({
      filename: req.file.filename,
      caption: req.body.caption || 'Untitled Observation',
      metadata: {
        capturedAt: meta.capturedAt || new Date().toISOString(),
        capturedDate: meta.capturedDate,
        capturedTime: meta.capturedTime,
        capturedDay: meta.capturedDay,
        capturedYear: meta.capturedYear,
        capturedMonth: meta.capturedMonth,
        latitude: meta.latitude,
        longitude: meta.longitude,
        compassHeading: meta.compassHeading
      },
      labels,
      author: req.session.user._id
    });
    res.redirect('/photos');
  } catch (err) {
    console.error(err);
    res.redirect('/photos/new');
  }
});

// MAP (before /:id)
router.get('/map', requireAuth, async (req, res) => {
  const photos = await Photo.find().populate('author').sort({ createdAt: -1 });
  res.render('map', { photos });
});

// SHOW — pass isAdmin and isOwner to the template
router.get('/:id', requireAuth, async (req, res) => {
  const photo = await Photo.findById(req.params.id).populate('author');
  if (!photo) return res.redirect('/photos');
  
  const isOwner = photo.author._id.toString() === req.session.user._id.toString();
  const isAdmin = req.session.user.role === 'admin';
  
  res.render('show', { photo, isOwner, isAdmin });
});

// EDIT — allow owner OR admin
router.get('/:id/edit', requireAuth, async (req, res) => {
  const photo = await Photo.findById(req.params.id);
  if (!photo) return res.redirect('/photos');
  
  const isOwner = photo.author._id.toString() === req.session.user._id.toString();
  const isAdmin = req.session.user.role === 'admin';
  
  if (!isOwner && !isAdmin) return res.redirect('/photos');
  
  res.render('edit', { photo, isAdmin });
});

// UPDATE — allow owner OR admin
router.put('/:id', requireAuth, async (req, res) => {
  const photo = await Photo.findById(req.params.id);
  if (!photo) return res.redirect('/photos');
  
  const isOwner = photo.author._id.toString() === req.session.user._id.toString();
  const isAdmin = req.session.user.role === 'admin';
  
  if (isOwner || isAdmin) {
    await Photo.findByIdAndUpdate(req.params.id, { caption: req.body.caption });
  }
  res.redirect(`/photos/${req.params.id}`);
});

// DELETE — allow owner OR admin
router.delete('/:id', requireAuth, async (req, res) => {
  const photo = await Photo.findById(req.params.id);
  if (!photo) return res.redirect('/photos');
  
  const isOwner = photo.author._id.toString() === req.session.user._id.toString();
  const isAdmin = req.session.user.role === 'admin';
  
  if (isOwner || isAdmin) {
    const files = await bucket.find({ filename: photo.filename }).toArray();
    if (files[0]) await bucket.delete(files[0]._id);
    await photo.deleteOne();
  }
  res.redirect('/photos');
});

// SERVE IMAGE
router.get('/image/:filename', (req, res) => {
  const stream = bucket.openDownloadStreamByName(req.params.filename);
  stream.on('error', () => res.status(404).send('Not found'));
  stream.pipe(res);
});

module.exports = router;