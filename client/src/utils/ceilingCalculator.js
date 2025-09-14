// 📁 ceilingCalculator.js — FINAL LOGIC FOR CEILING PANEL CALCULATOR APP

// Case Detector
function detectCase(A, B) {
  if (A < 2 || B < 2) return "C1: Too small";
  if (A <= 4 || B <= 4) return "C2: Very narrow";
  if (A <= 12 && B <= 12) return "C3: Standard small room";
  if (A > 12 && B <= 12) return "C4: Long room (A > 12)";
  if (A <= 12 && B > 12) return "C5: Long room (B > 12)";
  if (A > 12 && B > 12) return "C6: Large room";
  if (A % 2 !== 0 || B % 2 !== 0) return "C7: Not divisible by 2";
  if (A % 12 !== 0 || B % 12 !== 0) return "C8: Not divisible by 12";
  if (!Number.isInteger(A) || !Number.isInteger(B)) return "C9: Decimal dimensions";
  if (!Number.isInteger(A) && !Number.isInteger(B)) return "C10: Mixed decimals";
  if (A >= 3 * B || B >= 3 * A) return "C12: Corridor layout";
  return "Standard Case";
}

// Material Calculator per Option
function calculateOption(length, width, MT_len, CT_len, WA_len, prices, mainTAlongLength = true) {
  const MT_along = mainTAlongLength ? length : width;
  const CT_along = mainTAlongLength ? width : length;

  const MT_lines = Math.floor((CT_along - 2) / 2) + 1;
  const CT_lines = Math.floor((MT_along - 2) / 2) + 1;

  const MT_per_line = Math.ceil(MT_along / MT_len);
  const CT_per_line = MT_lines + 1;

  const MT_total = MT_lines * MT_per_line;
  const CT_total = CT_lines * CT_per_line;

  const panels = Math.ceil((length * width) / 4);
  const WA = Math.ceil((2 * (length + width)) / WA_len);

  const cost = (MT_total * prices.MT) + (CT_total * prices.CT) + (panels * prices.Panel) + (WA * prices.WA);

  return {
    orientation: mainTAlongLength ? "Main T-bars along Length" : "Main T-bars along Width",
    MT: MT_total,
    CT: CT_total,
    Panels: panels,
    WallAngles: WA,
    Cost: cost
  };
}

// Full Estimation Logic
function calculateMaterials(length, width, prices = { MT: 450, CT: 80, Panel: 380, WA: 190 }) {
  const A = Math.max(length, width);
  const B = Math.min(length, width);
  const MT_len = 12;
  const CT_len = 2;
  const WA_len = 10;

  const detectedCase = detectCase(A, B);

  const optionA = calculateOption(length, width, MT_len, CT_len, WA_len, prices, true);
  const optionB = calculateOption(length, width, MT_len, CT_len, WA_len, prices, false);

  const better = optionA.Cost <= optionB.Cost ? optionA : optionB;
  const other = optionA.Cost > optionB.Cost ? optionA : optionB;

  return {
    roomSize: `${length} ft × ${width} ft`,
    detectedCase,
    options: {
      optionA,
      optionB
    },
    recommendedOption: better.orientation,
    savings: Math.abs(other.Cost - better.Cost),
    notes: [`Using ${better.orientation} saves Rs. ${Math.abs(other.Cost - better.Cost)}.`]
  };
}

module.exports = { calculateMaterials };
