const express = require('express');
const router = express.Router();
const TileEstimation = require('../models/TileEstimation');

// ✅ Save tile estimation
router.post('/save', async (req, res) => {
  try {
    const {
      userId,
      projectName,
      date,
      roomLength,
      roomWidth,
      tileLength,
      tileWidth,
      allowance,
      price,
      totalArea,
      tileCount,
      estimatedCost,
      type
    } = req.body;

    if (!userId || !projectName || !date || !tileCount || !estimatedCost) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const estimation = new TileEstimation({
      userId,
      projectName,
      date,
      roomLength,
      roomWidth,
      tileLength,
      tileWidth,
      allowance,
      price,
      totalArea,
      tileCount,
      estimatedCost,
      type: type || 'Tile'
    });

    const savedEstimation = await estimation.save();
    res.status(200).json({ message: 'Saved successfully', data: savedEstimation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update tile estimation
router.put('/update/:id', async (req, res) => {
  try {
    const updated = await TileEstimation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all projects by user
router.get('/user/:id', async (req, res) => {
  try {
    const projects = await TileEstimation.find({ userId: req.params.id });
    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET  /api/tile/user/:userId    → list all for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const projects = await TileEstimation.find({ userId: req.params.userId });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET  /api/tile/:id            → fetch one by ID (optional)
router.get('/:id', async (req, res) => {
  try {
    const project = await TileEstimation.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tile/delete/:id   → delete one
router.delete('/delete/:id', async (req, res) => {
  try {
    const deleted = await TileEstimation.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// …after all your router.get, router.post, etc.
module.exports = router;
