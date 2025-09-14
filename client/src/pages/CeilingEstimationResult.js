// src/pages/CeilingEstimationResult.js

import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/CeilingEstimationResult.css';
import jsPDF from 'jspdf';
import React, { useLayoutEffect as useEffect } from 'react';

/* ===================== Shared visual helpers (Tile-style) ===================== */

// rounded rectangle
function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// PDF helpers (matching Tile report look)
function asciiSafe(s) {
  if (s == null) return '';
  return String(s)
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/≈/g, '~')
    .replace(/\u2022/g, '-')
    .trim();
}

/* ===================== Canvas renderer (now grid-aligned like OLD code) ===================== */
/**
 * drawPrettyCeilingLayout
 * - Keeps your modern styling/legend
 * - **BUT** places T-bars exactly on the grid like the old code:
 *   MT lines at y = i * cellPx (i = 1..MT), CT lines at x = j * cellPx (j = 1..CT)
 *   WA is the inner border.
 */
function measureLegend(ctx, items, spacing = 14, chipW = 16) {
  let total = 0;
  items.forEach((it, i) => {
    const w = ctx.measureText(it.label).width + chipW + 8 + (i ? spacing : 0);
    total += w;
  });
  return total;
}

// ⬇️ DROP-IN REPLACEMENT (only this function)
function drawPrettyCeilingLayout(ctx, cfg) {
  const {
    rows = 12,
    cols = 12,
    mt = 0,
    ct = 0,
    cellPx = 24,
    margin = 20,
    radius = 14,
  } = cfg;

  // -------- Hi-DPI canvas setup (crisp lines) --------
  const gridW = cols * cellPx;
  const gridH = rows * cellPx;

  // legend pre-measure (so we size canvas once)
  ctx.font = '12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
  const legendItems = [
    { key: 'mt', label: 'Main T-bar', color: 'rgba(231,76,60,0.95)' },   // red (solid horizontal)
    { key: 'ct', label: 'Cross T-bar', color: 'rgba(52,152,219,0.95)' }, // blue (dashed vertical)
    { key: 'wa', label: 'Wall Angle',  color: '#27ae60' },               // green (border)
  ];
  const innerW = gridW + margin * 2;
  const legendW = measureLegend(ctx, legendItems);
  const fitsOne = legendW <= innerW - 120;
  const legendH = fitsOne ? 18 : 36;

  const W = gridW + margin * 2;
  const H = gridH + margin * 2 + 18 + legendH;

  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  ctx.canvas.style.width = `${W}px`;
  ctx.canvas.style.height = `${H}px`;
  ctx.canvas.width = Math.round(W * dpr);
  ctx.canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // -------- Background & card --------
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#eef3ff');
  bg.addColorStop(1, '#f7f9fc');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Soft shadowed card
  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.10)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, margin, margin, gridW, gridH, radius);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  // -------- Clip to room and translate --------
  ctx.save();
  roundRect(ctx, margin, margin, gridW, gridH, radius);
  ctx.clip();
  ctx.translate(margin, margin);

  // -------- Panel shading (checker tint) --------
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#fbfdff' : '#f4f7fb';
      ctx.fillRect(c * cellPx, r * cellPx, cellPx, cellPx);
    }
  }

  // -------- Soft grid lines --------
  ctx.strokeStyle = '#e6edf5';
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  for (let r = 0; r <= rows; r++) {
    const y = r * cellPx + 0.5; // pixel-align
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(gridW, y);
    ctx.stroke();
  }
  for (let c = 0; c <= cols; c++) {
    const x = c * cellPx + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, gridH);
    ctx.stroke();
  }

  // -------- OLD-SEMANTIC MT/CT (grid aligned) --------
  const hCount = Math.max(0, Math.floor(mt));
  const vCount = Math.max(0, Math.floor(ct));
  const maxH = Math.min(hCount, rows - 1);
  const maxV = Math.min(vCount, cols - 1);

  // Main T (horizontal): solid red lines on grid
  ctx.strokeStyle = 'rgba(231,76,60,0.95)';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  for (let i = 1; i <= maxH; i++) {
    const y = i * cellPx + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(gridW, y);
    ctx.stroke();
  }

  // Cross T (vertical): dashed blue lines on grid
  ctx.strokeStyle = 'rgba(52,152,219,0.95)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  for (let j = 1; j <= maxV; j++) {
    const x = j * cellPx + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, gridH);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Intersections (nodes)
  if (maxH > 0 && maxV > 0) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
    const rNode = 2.4;
    for (let i = 1; i <= maxH; i++) {
      for (let j = 1; j <= maxV; j++) {
        const x = j * cellPx;
        const y = i * cellPx;
        ctx.beginPath();
        ctx.arc(x, y, rNode, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // -------- Wall Angle (double border glow) --------
  // outer glow
  ctx.strokeStyle = 'rgba(39,174,96,0.35)';
  ctx.lineWidth = 6;
  roundRect(ctx, 0.5, 0.5, gridW - 1, gridH - 1, Math.max(0, radius - 2));
  ctx.stroke();
  // inner crisp line
  ctx.strokeStyle = '#27ae60';
  ctx.lineWidth = 2;
  roundRect(ctx, 1.5, 1.5, gridW - 3, gridH - 3, Math.max(0, radius - 3));
  ctx.stroke();

  ctx.restore();

  // -------- Legend (line chips; wraps to 2 rows if needed) --------
  const baseX = margin + 8;
  let yLegend = margin + gridH + 18;

  ctx.fillStyle = '#1f2a44';
  ctx.font = '12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
  ctx.fillText('Legend:', baseX, yLegend);

  const drawLineChip = (x, spec) => {
    const chipY = yLegend - 7; // vertical center
    if (spec.key === 'mt') {
      // solid red horizontal
      ctx.strokeStyle = spec.color;
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x, chipY);
      ctx.lineTo(x + 18, chipY);
      ctx.stroke();
    } else if (spec.key === 'ct') {
      // dashed blue vertical
      ctx.strokeStyle = spec.color;
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(x + 9, chipY - 6);
      ctx.lineTo(x + 9, chipY + 6);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      // WA rounded rect
      ctx.strokeStyle = spec.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, chipY - 6, 18, 12);
    }
  };

  const labelStart = baseX + ctx.measureText('Legend:').width + 10;
  const drawItem = (x, item) => {
    drawLineChip(x, item);
    const textX = x + 24;
    ctx.fillStyle = '#0f172a';
    ctx.fillText(item.label, textX, yLegend);
    return textX + ctx.measureText(item.label).width;
  };

  let x = labelStart;
  if (fitsOne) {
    legendItems.forEach((it, idx) => {
      if (idx) x += 16;
      x = drawItem(x, it);
    });
  } else {
    // two rows
    const row1 = legendItems.slice(0, 2);
    const row2 = legendItems.slice(2);
    row1.forEach((it, idx) => {
      if (idx) x += 16;
      x = drawItem(x, it);
    });
    yLegend += 16;
    x = baseX + 56;
    row2.forEach((it, idx) => {
      if (idx) x += 16;
      x = drawItem(x, it);
    });
  }
}


/* ===================== Fonts for PDF (optional Poppins embed) ===================== */

let _poppinsLoaded = false;

async function loadPoppinsForPDF(pdf) {
  if (_poppinsLoaded) {
    pdf.addFont('Poppins-Regular.ttf', 'Poppins', 'normal');
    pdf.addFont('Poppins-Bold.ttf', 'Poppins', 'bold');
    return;
  }

  const fetchAsBase64 = async (url) => {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        resolve(String(reader.result).split(',')[1]); // strip "data:*;base64,"
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const [regB64, boldB64] = await Promise.all([
    fetchAsBase64('/fonts/Poppins-Regular.ttf'),
    fetchAsBase64('/fonts/Poppins-Bold.ttf'),
  ]);

  pdf.addFileToVFS('Poppins-Regular.ttf', regB64);
  pdf.addFileToVFS('Poppins-Bold.ttf', boldB64);
  pdf.addFont('Poppins-Regular.ttf', 'Poppins', 'normal');
  pdf.addFont('Poppins-Bold.ttf', 'Poppins', 'bold');

  _poppinsLoaded = true;
}

/* ===================== Component ===================== */

const CeilingEstimationResult = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const {
    results = [],
    totalCost = 0,
    totalSavings = 0,
    projectName = '',
    date = '',
    timeSaved = 0,
  } = state || {};

  // draw canvases with (now) old-aligned renderer
  useEffect(() => {
    results.forEach((r, i) => {
      const a = r?.options?.[0] || { MT: 0, CT: 0, WA: 0 };
      const b = r?.options?.[1] || { MT: 0, CT: 0, WA: 0 };
      const ca = document.getElementById(`canvasA-${i}`);
      const cb = document.getElementById(`canvasB-${i}`);
      if (!ca || !cb) return;
      drawPrettyCeilingLayout(ca.getContext('2d'), {
        rows: 12,
        cols: 12,
        mt: a.MT,
        ct: a.CT,
        wa: a.WA,
        cellPx: 24,
        margin: 20,
        radius: 14,
      });
      drawPrettyCeilingLayout(cb.getContext('2d'), {
        rows: 12,
        cols: 12,
        mt: b.MT,
        ct: b.CT,
        wa: b.WA,
        cellPx: 24,
        margin: 20,
        radius: 14,
      });
    });
  }, [results]);

  // write timeSaved once per session (avoids StrictMode double run)
  useEffect(() => {
    const key = `ceilingTimeSaved:${projectName}:${date}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    const v = Math.max(0, Number(timeSaved || 0));
    if (!v) return;
    const arr = JSON.parse(localStorage.getItem('ceilingTimeSavings') || '[]');
    arr.push(v);
    localStorage.setItem('ceilingTimeSavings', JSON.stringify(arr));
  }, [projectName, date, timeSaved]);

  const handleSave = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('User not logged in. Please log in again.');
      return;
    }
    const data = {
      userId,
      projectName,
      date,
      results,
      totalCost,
      totalSavings,
      type: 'Ceiling',
    };
    try {
      await axios.post('http://localhost:5000/api/ceiling/save', data);
      alert('Estimation saved successfully!');
      navigate('/projects');
    } catch (err) {
      console.error('❌ Save failed:', err.response?.data || err.message);
      alert('Save failed. Check console for error details.');
    }
  };

  /* ---------- Export PNG (3×) with A/B side-by-side per room ---------- */
  const handleExportImage = () => {
    if (!results.length) return;

    const scale = 3;
    const cellPx = 24 * scale;
    const margin = 20;
    const radius = 14;

    const rw = 12 * cellPx;
    const rh = 12 * cellPx;

    // estimate legend block at scale, conservatively 36px high
    const legendH = 18 * scale + 18 * scale;

    const cardW = rw + margin * 2;
    const cardH = rh + margin * 2 + 18 * scale + legendH;

    const gap = 28 * scale;
    const rowGap = 40 * scale;

    const totalW = cardW * 2 + gap;
    const totalH = results.length * cardH + (results.length - 1) * rowGap;

    const off = document.createElement('canvas');
    off.width = totalW;
    off.height = totalH;
    const ctx = off.getContext('2d');

    // bg
    const bg = ctx.createLinearGradient(0, 0, 0, totalH);
    bg.addColorStop(0, '#f6f9ff');
    bg.addColorStop(1, '#eef2f8');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, totalW, totalH);

    results.forEach((r, i) => {
      const a = r?.options?.[0] || { MT: 0, CT: 0, WA: 0 };
      const b = r?.options?.[1] || { MT: 0, CT: 0, WA: 0 };

      const aCan = document.createElement('canvas');
      drawPrettyCeilingLayout(aCan.getContext('2d'), {
        rows: 12,
        cols: 12,
        mt: a.MT,
        ct: a.CT,
        wa: a.WA,
        cellPx,
        margin,
        radius,
      });

      const bCan = document.createElement('canvas');
      drawPrettyCeilingLayout(bCan.getContext('2d'), {
        rows: 12,
        cols: 12,
        mt: b.MT,
        ct: b.CT,
        wa: b.WA,
        cellPx,
        margin,
        radius,
      });

      const y = i * (cardH + rowGap);

      // section titles
      ctx.font = `${16 * scale}px ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto`;
      ctx.fillStyle = '#0f172a';
      ctx.fillText(`${r.room} — Option A: ${a.orientation || '-'}`, 12 * scale, y + 20 * scale);
      ctx.fillText(
        `${r.room} — Option B: ${b.orientation || '-'}`,
        cardW + gap + 12 * scale,
        y + 20 * scale
      );

      ctx.drawImage(aCan, 0, y + 26 * scale);
      ctx.drawImage(bCan, cardW + gap, y + 26 * scale);
    });

    const link = document.createElement('a');
    link.href = off.toDataURL('image/png');
    link.download = `${projectName || 'ceiling'}-layouts@3x.png`;
    link.click();
  };

  /* ---------- Export PDF (A4, harmonized with Tile report) ---------- */
  const handleExportPDF = async () => {
    if (!results.length) return;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    await loadPoppinsForPDF(pdf);

    const PW = pdf.internal.pageSize.getWidth();
    const PH = pdf.internal.pageSize.getHeight();

    // Layout constants
    const M = 48; // outer margin
    const CONTENT_W = PW - M * 2;
    const HEADER_H = 96;
    const PAD = 18; // inner padding inside cards
    const SECTION_GAP = 18; // gap between sections on same page

    // Small helpers
    const header = () => {
      pdf.setFillColor(28, 76, 145);
      pdf.rect(0, 0, PW, HEADER_H, 'F');
      pdf.setFont('Poppins', 'bold');
      pdf.setFontSize(20);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Material Estimator App (MEA)', M, 44);
      pdf.setFontSize(12);
      pdf.text('Ceiling Estimation Report', M, 66);
      return HEADER_H + 22; // initial y
    };
    const ensureSpace = (y, need) => {
      if (y + need <= PH - 40) return y;
      pdf.addPage();
      return header();
    };

    // ───────────────── Header
    let y = header();

    // ───────────────── Project Info Card (auto height)
    const infoTop = y;
    pdf.setDrawColor(229, 231, 235);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(M, infoTop, CONTENT_W, 140, 12, 12, 'FD'); // provisional

    let yL = infoTop + PAD + 29;
    let yR = yL;

    // Title
    pdf.setFont('Poppins', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(17, 24, 39);
    pdf.text('Project Information', M + PAD, yL);
    yL += 20;
    yR += 20;

    // Key/Value printer (left)
    const leftKeyX = M + PAD,
      leftValX = M + 140;
    const putKV = (key, val, yIn) => {
      pdf.setFont('Poppins', 'bold');
      pdf.setTextColor(17, 24, 39);
      pdf.text(`${key}:`, leftKeyX, yIn);
      pdf.setFont('Poppins', 'normal');
      pdf.setTextColor(31, 41, 55);
      pdf.text(String(val), leftValX, yIn);
      return yIn + 18;
    };
    yL = putKV('Project', projectName || '-', yL);
    yL = putKV('Date', date || '-', yL);
    yL = putKV('Time Saved', `${Math.max(0, Number(timeSaved || 0)).toFixed(2)} mins`, yL);

    // Right column
    const rightKeyX = M + PAD + CONTENT_W / 2,
      rightValX = rightKeyX + 120;
    const putKVR = (key, val, yIn) => {
      pdf.setFont('Poppins', 'bold');
      pdf.setTextColor(17, 24, 39);
      pdf.text(`${key}:`, rightKeyX, yIn);
      pdf.setFont('Poppins', 'normal');
      pdf.setTextColor(31, 41, 55);
      pdf.text(String(val), rightValX, yIn);
      return yIn + 18;
    };
    yR = putKVR('Total Cost', `Rs. ${totalCost}`, yR);
    yR = putKVR('Estimated Savings', `Rs. ${totalSavings}`, yR);

    // Resize card neatly to content
    const infoH = Math.max(145, Math.max(yL, yR) - infoTop + PAD);
    pdf.setDrawColor(229, 231, 235);
    pdf.roundedRect(M, infoTop, CONTENT_W, infoH, 12, 12);
    y = infoTop + infoH + SECTION_GAP;

    // ───────────────── Rooms Overview table (responsive + wrapped, no overflow)
    {
      const INNER_W = CONTENT_W - 2 * PAD;
      const PCT = [0.26, 0.30, 0.16, 0.16, 0.12]; // Room, Case, A, B, Cheaper
      let COLS = PCT.map((p) => Math.floor(INNER_W * p));
      COLS[COLS.length - 1] += INNER_W - COLS.reduce((a, b) => a + b, 0);

      const headers = ['Room', 'Detected Case', 'Option A', 'Option B', 'Cheaper'];

      const rawRows = results.map((r) => {
        const a = r?.options?.[0];
        const b = r?.options?.[1];
        const cheaper = a && b ? (a.cost <= b.cost ? `A` : `B`) : '-';
        return [r.room || '-', r.caseDetected || '-', `Rs. ${a?.cost ?? '-'}`, `Rs. ${b?.cost ?? '-'}`, cheaper];
      });

      const TITLE_BASELINE = y + PAD + 18;
      const GAP_AFTER_TITLE = 10;
      const TABLE_HDR_H = 26;
      const LINE_H = 12;
      const CELL_PAD = 8;

      const wrappedRows = rawRows.map((row) =>
        row.map((text, i) => pdf.splitTextToSize(String(text), Math.max(12, COLS[i] - CELL_PAD - 4)))
      );
      const rowHeights = wrappedRows.map((cells) => {
        const maxLines = Math.max(...cells.map((lines) => lines.length || 1));
        return maxLines * LINE_H + 8;
      });

      const tableNeed = PAD + 18 + GAP_AFTER_TITLE + TABLE_HDR_H + rowHeights.reduce((a, b) => a + b, 0) + PAD;
      y = ensureSpace(y, tableNeed);

      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(229, 231, 235);
      pdf.roundedRect(M, y, CONTENT_W, tableNeed, 12, 12, 'FD');

      pdf.setFont('Poppins', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(17, 24, 39);
      pdf.text('Rooms Overview', M + PAD, TITLE_BASELINE);

      const headerTop = y + PAD + 18 + GAP_AFTER_TITLE;
      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(M + PAD, headerTop, INNER_W, TABLE_HDR_H, 6, 6, 'F');

      pdf.setFont('Poppins', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(17, 24, 39);
      let hx = M + PAD + CELL_PAD;
      const headBaseline = headerTop + 16;
      headers.forEach((t, i) => {
        pdf.text(t, hx, headBaseline);
        hx += COLS[i];
      });

      pdf.setFont('Poppins', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(31, 41, 55);
      let rowTop = headerTop + TABLE_HDR_H;
      wrappedRows.forEach((cells, idx) => {
        const h = rowHeights[idx];
        if (idx % 2 === 0) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(M + PAD, rowTop, INNER_W, h, 'F');
        }
        let cx = M + PAD + CELL_PAD;
        cells.forEach((lines, i) => {
          let ly = rowTop + 14;
          lines.forEach((line) => {
            pdf.text(line, cx, ly);
            ly += LINE_H;
          });
          cx += COLS[i];
        });
        rowTop += h;
      });

      y = y + tableNeed + SECTION_GAP;
    }

    // ───────────────── Per-room pages (aligned columns, wrapped stats)
    {
      // Canvas rendering params for PDF (same look as page canvases)
      const CELL = 20;
      const CANVAS_MARGIN = 16;
      const CANVAS_RADIUS = 12;

      const INNER_W = CONTENT_W - 2 * PAD;
      const COL_GAP = 20;
      const COL_W = Math.floor((INNER_W - COL_GAP) / 2);

      const TITLE_FS = 13;
      const LABEL_FS = 11;
      const STATS_FS = 10;

      const TITLE_LINE = 22;
      const LINE_GAP = 8;
      const STATS_LINE_H = 14;

      results.forEach((r, idx) => {
        if (idx === 0) {
          const minNeed = 360;
          if (y + minNeed > PH - 40) {
            pdf.addPage();
            y = header();
          }
        } else {
          pdf.addPage();
          y = header();
        }

        const a = r?.options?.[0] || { MT: 0, CT: 0, panels: 0, WA: 0, cost: 0, orientation: '-' };
        const b = r?.options?.[1] || { MT: 0, CT: 0, panels: 0, WA: 0, cost: 0, orientation: '-' };

        const aCan = document.createElement('canvas');
        const bCan = document.createElement('canvas');
        drawPrettyCeilingLayout(aCan.getContext('2d'), {
          rows: 12,
          cols: 12,
          mt: a.MT,
          ct: a.CT,
          wa: a.WA,
          cellPx: CELL,
          margin: CANVAS_MARGIN,
          radius: CANVAS_RADIUS,
        });
        drawPrettyCeilingLayout(bCan.getContext('2d'), {
          rows: 12,
          cols: 12,
          mt: b.MT,
          ct: b.CT,
          wa: b.WA,
          cellPx: CELL,
          margin: CANVAS_MARGIN,
          radius: CANVAS_RADIUS,
        });

        const aImg = aCan.toDataURL('image/png');
        const bImg = bCan.toDataURL('image/png');

        const aRatio = aCan.height / aCan.width;
        const bRatio = bCan.height / bCan.width;
        const IMG_W = Math.min(COL_W, aCan.width); // scale image to column width
        const IMG_H_A = IMG_W * aRatio;
        const IMG_H_B = IMG_W * bRatio;
        const IMG_BLOCK_H = Math.max(IMG_H_A, IMG_H_B);
        const IMG_PAD_BELOW = 6;

        const statsA = `MT ${a.MT} • CT ${a.CT} • Panels ${a.panels} • WA ${a.WA} • Rs. ${a.cost}`;
        const statsB = `MT ${b.MT} • CT ${b.CT} • Panels ${b.panels} • WA ${b.WA} • Rs. ${b.cost}`;
        const STATS_WRAP_W = COL_W - 2;
        const statsALines = pdf.splitTextToSize(statsA, STATS_WRAP_W);
        const statsBLines = pdf.splitTextToSize(statsB, STATS_WRAP_W);
        const STATS_H = Math.max(statsALines.length, statsBLines.length) * STATS_LINE_H;

        const cardH =
          PAD + TITLE_LINE + LINE_GAP + TITLE_LINE + LINE_GAP + IMG_BLOCK_H + IMG_PAD_BELOW + STATS_H + PAD;

        y = ensureSpace(y, cardH);

        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(229, 231, 235);
        pdf.roundedRect(M, y, CONTENT_W, cardH, 12, 12, 'FD');

        pdf.setFont('Poppins', 'bold');
        pdf.setFontSize(TITLE_FS);
        pdf.setTextColor(17, 24, 39);
        const titleBase = y + PAD + 16;
        pdf.text(`${r.room || 'Room'} — A vs B`, M + PAD, titleBase);

        const AX = M + PAD;
        const BX = M + PAD + COL_W + COL_GAP;

        const labelBase = titleBase + (TITLE_LINE - 16) + LINE_GAP;
        pdf.setFont('Poppins', 'bold');
        pdf.setFontSize(LABEL_FS);
        pdf.setTextColor(17, 24, 39);
        pdf.text(`Option A: ${a.orientation || '-'}`, AX, labelBase);
        pdf.text(`Option B: ${b.orientation || '-'}`, BX, labelBase);

        const dividerTop = labelBase + LINE_GAP;
        const dividerBottom = y + cardH - PAD;
        pdf.setDrawColor(235, 238, 242);
        pdf.line(M + PAD + COL_W + COL_GAP / 2, dividerTop, M + PAD + COL_W + COL_GAP / 2, dividerBottom);

        const imgTop = labelBase + LINE_GAP;
        const imgTopA = imgTop + (IMG_BLOCK_H - IMG_H_A) / 2;
        const imgTopB = imgTop + (IMG_BLOCK_H - IMG_H_B) / 2;
        pdf.addImage(aImg, 'PNG', AX, imgTopA, IMG_W, IMG_H_A);
        pdf.addImage(bImg, 'PNG', BX, imgTopB, IMG_W, IMG_H_B);

        const statsTop = imgTop + IMG_BLOCK_H + IMG_PAD_BELOW;
        pdf.setFont('Poppins', 'normal');
        pdf.setFontSize(STATS_FS);
        pdf.setTextColor(31, 41, 55);

        let syA = statsTop;
        statsALines.forEach((line) => {
          pdf.text(line, AX, syA);
          syA += STATS_LINE_H;
        });

        let syB = statsTop;
        statsBLines.forEach((line) => {
          pdf.text(line, BX, syB);
          syB += STATS_LINE_H;
        });

        y += cardH + SECTION_GAP;
      });
    }

    // Footer
    const footY = PH - 24;
    pdf.setDrawColor(226, 232, 240);
    pdf.line(M, footY - 12, PW - M, footY - 12);
    pdf.setFont('Poppins', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    pdf.text('Generated by MEA • www.example.com', M, footY);

    pdf.save(`${projectName || 'ceiling'}-estimation.pdf`);
  };

  return (
    <div className="dashboardcc">
      <Sidebar />
      <div className="result-content">
        {/* Header */}
        <div className="page-header">
          <div className="title-wrap">
            <h2>Ceiling Estimation Result</h2>
            <div className="sub">
              <span className="chip">{projectName || 'Untitled Project'}</span>
              <span className="chip">{date || 'No Date'}</span>
              <span className="chip success">
                Time Saved: {Math.max(0, Number(timeSaved || 0)).toFixed(2)} mins
              </span>
            </div>
          </div>

          <div className="actions-inline">
            <button className="btn ghost" onClick={() => navigate('/projects')}>
              Projects
            </button>
            <button className="btn primary" onClick={handleSave}>
              Save
            </button>
            <button className="btn accent" onClick={handleExportImage}>
              Export PNG (3×)
            </button>
            <button className="btn accent" onClick={handleExportPDF}>
              Export PDF (A4)
            </button>
          </div>
        </div>

        {/* KPI chips */}
        <div className="kpi-row">
          <div className="kpi">
            <div className="kpi-title">Total Cost</div>
            <div className="kpi-value">Rs. {totalCost}</div>
          </div>
          <div className="kpi">
            <div className="kpi-title">Estimated Savings</div>
            <div className="kpi-value">Rs. {totalSavings}</div>
          </div>
          <div className="kpi">
            <div className="kpi-title">Rooms</div>
            <div className="kpi-value">{results.length}</div>
          </div>
        </div>

        {/* Rooms */}
        {results.map((r, i) => (
          <div key={i} className="room-result">
            <h3>{r.room}</h3>
            <p className="Case">Detected Case: {r.caseDetected}</p>

            <div className="optionsAandB">
              <div className="First">
                {/* Option A card */}
                <h3 className="firstlable">Option A: {r?.options?.[0]?.orientation || '-'}</h3>
                <ul className="firstLi">
                  <li>Main T-bars: {r.options[0].MT}</li>
                  <li>Cross T-bars: {r.options[0].CT}</li>
                  <li>Panel Sheets: {r.options[0].panels}</li>
                  <li>Wall Angles: {r.options[0].WA}</li>
                  <li className="fonttt">Total Cost: Rs. {r.options[0].cost}</li>
                </ul>
              </div>

              <div className="First">
                {/* Option B card */}
                <h3 className="firstlable">Option B: {r?.options?.[1]?.orientation || '-'}</h3>
                <ul className="firstLi">
                  <li>Main T-bars: {r.options[1].MT}</li>
                  <li>Cross T-bars: {r.options[1].CT}</li>
                  <li>Panel Sheets: {r.options[1].panels}</li>
                  <li>Wall Angles: {r.options[1].WA}</li>
                  <li className="fonttt">Total Cost: Rs. {r.options[1].cost}</li>
                </ul>
              </div>
            </div>

            {/* Layouts */}
            <div className="Layo">
              <div className="canvas-card">
                <h4 className="layTextA">Option A Layout</h4>
                <canvas id={`canvasA-${i}`} className="borA" />
              </div>
              <div className="canvas-card">
                <h4 className="layTextB">Option B Layout</h4>
                <canvas id={`canvasB-${i}`} className="borB" />
              </div>
            </div>
          </div>
        ))}

        <div className="summary">
          <h2>Total Cost for All Rooms: Rs. {totalCost}</h2>
          <p>Estimated Savings: Rs. {totalSavings}</p>
        </div>
      </div>
    </div>
  );
};

export default CeilingEstimationResult;
