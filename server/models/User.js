const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  shopName: String,
  ownerName: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: String,
    // ← add this:
  profilePic: {
    type: String,
    default: ''   // or a default avatar URL if you like
  },
otpExpires: Date

});

module.exports = mongoose.model('User', userSchema);
