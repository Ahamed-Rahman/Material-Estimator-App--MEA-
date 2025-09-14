// utils/ceilingCalculator.js
function detectCase(A, B) {
  if (A < 2 || B < 2) return "C1: Too small for grid";
  if (A <= 4 || B <= 4) return "C2: Very narrow room";
  if (A <= 12 && B <= 12) return "C3: Standard small grid";
  if (A > 12 && B <= 12) return "C4: Join MT (A > 12)";
  if (A <= 12 && B > 12) return "C5: Extra CT rows (B > 12)";
  if (A > 12 && B > 12) return "C6: Test both layouts";
  if (A % 2 !== 0 || B % 2 !== 0) return "C7: Odd dimensions";
  if (A % 12 !== 0 || B % 12 !== 0) return "C8: Join/reuse MTs";
  if (!Number.isInteger(A) || !Number.isInteger(B)) return "C9: Decimal dimensions";
  if (!Number.isInteger(A) && !Number.isInteger(B)) return "C10: Decimal mix";
  if (A >= 3 * B || B >= 3 * A) return "C12: Corridor or toilet";
  return "C3: Default standard grid";
}

function calculateLayout(length, width, prices) {
  const A = Math.max(length, width);
  const B = Math.min(length, width);
  const WA_len = 10;
  const MT_len = 12;
  const P_area = 4;
  const gridSpacing = 2; // 2 ft grid

  const orientations = [
    { label: "Main T-bars along Length", MT_side: A, CT_side: B },
    { label: "Main T-bars along Width", MT_side: B, CT_side: A }
  ];

  const results = orientations.map((option) => {
    // Main T-Bar lines placed every 2ft, starting after 2ft up to before wall
    const MT_lines = Math.floor((option.CT_side - 0.01) / gridSpacing);
    const MT_per_line = Math.ceil(option.MT_side / MT_len);
    const MT = MT_lines * MT_per_line;
    // Cross T-Bar: one every 2ft across MT length
    const CT_lines = Math.floor((option.MT_side - 0.01) / gridSpacing);
    const CT_per_line = MT_lines + 1;
    const CT = CT_lines * CT_per_line;
    // Panel count
    const panels = Math.ceil((length * width) / P_area);
    // Wall Angle: full room perimeter
    const WA = Math.ceil((2 * (length + width)) / WA_len);
    // Cost
    const cost =
      MT * prices.mt +
      CT * prices.ct +
      panels * prices.panel +
      WA * prices.wa;

    return {
      orientation: option.label,
      MT,
      CT,
      panels,
      WA,
      cost,
      joinRequired: option.MT_side > MT_len
    };
  });

  const best = results.reduce((a, b) => (a.cost < b.cost ? a : b));
  const worst = results.find((r) => r !== best);

  return {
    room: `${length} ft × ${width} ft`,
    caseDetected: detectCase(A, B),
    options: results,
    recommended: best,
    savings: worst.cost - best.cost
  };
}

module.exports = {
  calculateLayout
};