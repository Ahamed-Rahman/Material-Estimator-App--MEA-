const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ error: 'Admin not found' });

  if (password !== admin.password) {
  return res.status(401).json({ error: 'Incorrect password' });
}



    const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, message: 'Admin logged in successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
