const router = require('express').Router();
const mongoose = require('mongoose');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const { GridFSBucket } = require('mongodb');
const crypto = require('crypto');
const Photo = require('../models/Photo');

// Auth Middleware
const requireAuth = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

// GridFS Setup
const storage = new GridFsStorage({
  url: process.env.MONGO_URI,
  file: () => ({ filename: crypto.randomBytes(16).toString('hex') + '.jpg', bucketName: 'photos' })
});
const upload = multer({ storage });

let bucket;
mongoose.connection.once('open', () => {
  bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'photos' });
});

// INDEX (Read)
router.get('/', requireAuth, async (req, res) => {
  const photos = await Photo.find().populate('author').sort({ createdAt: -1 });
  res.render('index', { photos });
});

// NEW
router.get('/new', requireAuth, (req, res) => {
  res.render('new');
});

// CREATE
router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  const meta = JSON.parse(req.body.metadata || '{}');
  const labels = JSON.parse(req.body.labels || '[]');
  
  await Photo.create({
    filename: req.file.filename,
    caption: req.body.caption,
    metadata: meta,
    labels: labels,
    author: req.session.user._id
  });
  res.redirect('/photos');
});

router.get('/map', requireAuth, async (req, res) => {
  const photos = await Photo.find().populate('author').sort({ createdAt: -1 });
  res.render('map', { photos });
});

// SHOW
router.get('/:id', requireAuth, async (req, res) => {
  const photo = await Photo.findById(req.params.id).populate('author');
  if (!photo) return res.redirect('/photos');
  res.render('show', { photo });
});

// EDIT
router.get('/:id/edit', requireAuth, async (req, res) => {
  const photo = await Photo.findById(req.params.id);
  if (!photo || photo.author.toString() !== req.session.user._id.toString()) {
    return res.redirect('/photos');
  }
  res.render('edit', { photo });
});

// UPDATE
router.put('/:id', requireAuth, async (req, res) => {
  const photo = await Photo.findById(req.params.id);
  if (photo && photo.author.toString() === req.session.user._id.toString()) {
    await Photo.findByIdAndUpdate(req.params.id, { caption: req.body.caption });
  }
  res.redirect(`/photos/${req.params.id}`);
});

// DELETE
router.delete('/:id', requireAuth, async (req, res) => {
  const photo = await Photo.findById(req.params.id);
  if (photo && photo.author.toString() === req.session.user._id.toString()) {
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