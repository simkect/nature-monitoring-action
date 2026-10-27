const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', (req, res) => res.redirect('/photos'));

// ===== Login =====
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/photos');
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
      role: user.role
    };
    res.redirect('/photos');
  } catch (err) {
    res.render('register', { error: 'Username already exists' });
  }
});

// ===== Admin Dashboard =====
router.get('/admin', requireAdmin, async (req, res) => {
  const users = await User.find().sort({ username: 1 });
  res.render('admin', { users });
});

router.delete('/admin/users/:id', requireAdmin, async (req, res) => {
  // Prevent the admin from deleting themselves
  if (req.params.id === req.session.user._id.toString()) {
    return res.redirect('/admin');
  }
  await User.findByIdAndDelete(req.params.id);
  res.redirect('/admin');
});

// ===== Logout =====
// Uses method-override: form must include <input type="hidden" name="_method" value="DELETE">
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

module.exports = router;