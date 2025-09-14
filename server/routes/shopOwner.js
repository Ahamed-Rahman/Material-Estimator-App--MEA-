// routes/shopOwner.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer  = require('multer');
const path = require('path');
const fs   = require('fs');

// ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/profile-pics');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// ───────────────── GET /profile ─────────────────
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'Access denied' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const fullPicUrl = user.profilePic
      ? `${req.protocol}://${req.get('host')}${user.profilePic}`
      : null;

    res.json({
      ownerName: user.ownerName,
      email:     user.email,
      shopName:  user.shopName,
      profilePicUrl: fullPicUrl
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ──────────────── PUT /change-password ────────────────
router.put('/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization;
    const { currentPassword, newPassword } = req.body;
    if (!token) return res.status(401).json({ error: 'Access denied' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ──────────────── PUT /update-profile ────────────────
router.put('/update-profile', upload.single('profilePic'), async (req, res) => {
  try {
    // 1) Auth
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'Access denied' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2) Build updates
    const updates = {};
    if (req.body.ownerName) updates.ownerName = req.body.ownerName;
    if (req.body.shopName)  updates.shopName  = req.body.shopName;
    if (req.file) {
      // store as a relative path served by your static middleware
      updates.profilePic = `/uploads/profile-pics/${req.file.filename}`;
    }

    // 3) Persist
    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      { $set: updates },
      { new: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ error: 'User not found' });

    // 4) Build response
    const fullPicUrl = updatedUser.profilePic
      ? `${req.protocol}://${req.get('host')}${updatedUser.profilePic}`
      : null;

    res.json({
      ownerName: updatedUser.ownerName,
      shopName:  updatedUser.shopName,
      profilePicUrl: fullPicUrl
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
