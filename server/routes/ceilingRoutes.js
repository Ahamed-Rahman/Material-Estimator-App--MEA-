const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { calculateEstimate } = require('../controllers/ceilingController');
const CeilingEstimation = require('../models/CeilingEstimation');

router.post('/calculate', calculateEstimate);
// ceilingRoutes.js
router.get('/user/:id', async (req, res) => {
  try {
    const projects = await CeilingEstimation.find({ userId: req.params.id });
    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



router.post('/save', async (req, res) => {
  try {
    const {
      userId,
      projectName,
      date,
      roomSize,
      caseDetected,
      options,
      recommended,
      savings,
      type
    } = req.body;

    const estimation = new CeilingEstimation({
      userId,
      projectName,
      date,
      roomSize,
      caseDetected,
      options,
      recommended,
      savings,
      type: type || 'Ceiling'
    });

    const saved = await estimation.save();
    res.status(200).json({ message: 'Ceiling estimation saved', data: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET  /api/ceiling/user/:userId    → list all for one user
router.get('/user/:userId', async (req, res) => {
  try {
    const projects = await CeilingEstimation.find({ userId: req.params.userId });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// (optional) GET  /api/ceiling/:id     → fetch one by ID
router.get('/:id', async (req, res) => {
  try {
    const project = await CeilingEstimation.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/ceiling/delete/:id → delete one
router.delete('/delete/:id', async (req, res) => {
  try {
    const deleted = await CeilingEstimation.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
