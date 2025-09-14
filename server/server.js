const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const path = require('path');
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);


// Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const shopOwnerRoutes = require('./routes/shopOwner');
const tileRoutes = require('./routes/tileEstimations');
const ceilingRoutes = require('./routes/ceilingRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shop-owner', shopOwnerRoutes);
app.use('/api/tile', tileRoutes);

app.use('/api/ceiling', ceilingRoutes);

app.use('/uploads/profile-pics', express.static('uploads/profile-pics'));



// DB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
