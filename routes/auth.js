const router = require('express').Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Photo = require('../models/Photo');
const { GridFSBucket } = require('mongodb');
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', (req, res) => res.redirect('/photos'));

// ===== Login =====
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/photos');
  res.set('Cache-Control', 'no-store');
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return res.render('login', { error: 'Invalid credentials' });
  }
  // Store role in session so requireAdmin works
  req.session.user = {
    _id: user._id,
    username: user.username,
    role: user.role
  };
  res.redirect('/photos');
});

// ===== Register =====
router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/photos');
  res.render('register', { error: null });
});

router.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({
      username: req.body.username,
      password: hashedPassword
    });
    req.session.user = {
      _id: user._id,
      username: user.username,
    };
    res.redirect('/photos');
  } catch (err) {
    res.render('register', { error: 'Username already exists' });
  }
});

// ===== Admin Dashboard =====
router.get('/admin', requireAdmin, async (req, res) => {
  const users = await User.find();
  
  users.sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (b.role === 'admin' && a.role !== 'admin') return 1;
    return a.username.localeCompare(b.username);
  });
  
  res.render('admin', { users });
});

// Delete User and ALL their associated data
router.delete('/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    // 1. Prevent admin from deleting themselves
    if (userId === req.session.user._id.toString()) {
      return res.redirect('/admin'); 
    }

    // 2. Find all photos uploaded by this user
    const userPhotos = await Photo.find({ author: userId });

    // 3. Initialize GridFS bucket to delete image files
    const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'photos' });

    // 4. Loop through photos, delete the image file, then the photo document
    for (const photo of userPhotos) {
      const files = await bucket.find({ filename: photo.filename }).toArray();
      if (files.length > 0) {
        await bucket.delete(files[0]._id); // Deletes the actual image file
      }
      await photo.deleteOne(); // Deletes the MongoDB document record
    }

    // 5. Finally, delete the User
    await User.findByIdAndDelete(userId);

    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting user and their data");
  }
});

// ===== Logout =====
// Uses method-override: form must include <input type="hidden" name="_method" value="DELETE">
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

// Session check for tab-restore detection
router.get('/auth/check', (req, res) => {
  if (req.session.user) {
    return res.json({ ok: true, user: req.session.user.username });
  }
  res.status(401).json({ ok: false });
});

module.exports = router;