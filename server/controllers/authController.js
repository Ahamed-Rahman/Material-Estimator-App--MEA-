const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// ✅ Signup logic (no changes needed)
exports.signup = async (req, res) => {
  try {
    const { shopName, ownerName, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ shopName, ownerName, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Login logic (updated to include user info)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // ✅ Return token + user object
    res.status(200).json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        ownerName: user.ownerName,
        shopName: user.shopName
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
  await user.save();

  // Send email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'shakeekarifan2@gmail.com',
      pass: 'xonwpuooctcbvzdb'
    }
  });

  await transporter.sendMail({
    from: 'shakeekarifan2@gmail.com',
    to: email,
    subject: 'Password Reset OTP',
    text: `Your OTP is ${otp}`
  });

  res.json({ message: 'OTP sent' });
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email, otp });
  if (!user || user.otpExpires < Date.now()) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  res.json({ message: 'OTP verified' });
};

exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  await user.save();

  res.json({ message: 'Password updated' });
};
