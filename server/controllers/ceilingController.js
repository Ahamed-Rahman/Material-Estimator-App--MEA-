const { calculateLayout } = require('../utils/ceilingCalculator');

exports.calculateEstimate = (req, res) => {
  const { rooms, prices } = req.body;
  if (!Array.isArray(rooms) || !prices) {
    return res.status(400).json({ error: 'rooms array and prices are required' });
  }

  const results = rooms.map(({ name, length, width }) => {
    const layout = calculateLayout(length, width, prices);
    // layout contains: { caseDetected, options, recommended, savings, … }
    return { room: name, ...layout };
  });

  const totalCost = results.reduce((sum, r) => sum + r.recommended.cost, 0);
  const totalSavings = results.reduce((sum, r) => sum + r.savings, 0);

  res.json({ results, totalCost, totalSavings });
};



