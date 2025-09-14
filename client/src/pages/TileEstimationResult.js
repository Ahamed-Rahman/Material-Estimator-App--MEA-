// src/pages/TileEstimationResult.jsx
// updated code
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import '../styles/TileEstimationResult.css';

/* ===================== Helpers ===================== */

// convert “tile size” to feet (if user typed inches like 24 → 2 ft)
function normalizeFeet(x) {
  const v = Number(x || 0);
  if (!isFinite(v) || v <= 0) return 0;
  return v >= 12 ? v / 12 : v;
}

// grid + waste stats that MATCH drawing semantics for ONE room
function tileStatsFeet(L, W, tL, tW) {
  if (!L || !W || !tL || !tW) {
    return {
      cols: 0, rows: 0, full: 0, cut: 0,
      covered: 0, roomArea: 0,
      cutWasteArea: 0, cutWastePct: 0,
      panelArea: tL * tW || 0,
    };
  }

  const cols = Math.ceil(W / tW);
  const rows = Math.ceil(L / tL);

  let full = 0;
  let cut = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isCut = ((c + 1) * tW > W) || ((r + 1) * tL > L);
      if (isCut) cut++;
      else full++;
    }
  }

  const panelArea = tL * tW;                // ft² per tile
  const totalTiles = full + cut;
  const covered = totalTiles * panelArea;   // grid-laid area
  const roomArea = L * W;
  const cutWasteArea = Math.max(0, covered - roomArea);
  const cutWastePct = covered > 0 ? (cutWasteArea / covered) * 100 : 0;

  return {
    cols, rows, full, cut,
    covered, roomArea,
    cutWasteArea, cutWastePct,
    panelArea,
  };
}

// purchase waste (includes allowance)
function purchaseWaste(roomArea, panelArea, allowancePct) {
  if (!panelArea || !roomArea) {
    return { purchaseTiles: 0, purchaseWasteArea: 0, purchaseWastePct: 0, purchaseCovered: 0 };
  }
  const areaWithAllowance = roomArea * (1 + Number(allowancePct || 0) / 100);
  const purchaseTiles = Math.ceil(areaWithAllowance / panelArea);
  const purchaseCovered = purchaseTiles * panelArea;
  const purchaseWasteArea = Math.max(0, purchaseCovered - roomArea);
  const purchaseWastePct = purchaseCovered > 0 ? (purchaseWasteArea / purchaseCovered) * 100 : 0;
  return { purchaseTiles, purchaseWasteArea, purchaseWastePct, purchaseCovered };
}

// rounded rectangle path
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

/* ------- PDF helper: draw a bounded, aligned Room Breakdown table ------- */
// helper: draw a bounded, aligned Room Breakdown table
function drawRoomBreakdownTable(pdf, x, y, innerW, rows) {
  const headerH = 26;
  const rowH = 22;
  const padX = 10;

  // fixed layout that always sums to innerW
  const nameW  = Math.min(160, Math.max(110, innerW * 0.28));
  const sizeW  = Math.min(150, Math.max(110, innerW * 0.26));
  const areaW  = 80;
  const tilesW = 70;
  const costW  = innerW - (nameW + sizeW + areaW + tilesW); // remainder fits exactly

  const colX = [
    x,
    x + nameW,
    x + nameW + sizeW,
    x + nameW + sizeW + areaW,
    x + nameW + sizeW + areaW + tilesW
  ];

  // header
  pdf.setFillColor(241,245,249);
  pdf.setDrawColor(226,232,240);
  pdf.roundedRect(x, y, innerW, headerH, 6, 6, 'FD');

  pdf.setFont('helvetica','bold'); pdf.setFontSize(11); pdf.setTextColor(17,24,39);
  pdf.text('Room',       colX[0] + padX,           y + 16);
  pdf.text('Size (ft)',  colX[1] + padX,           y + 16);
  pdf.text('Area (ft²)', colX[2] + areaW  - padX,  y + 16, { align: 'right' });
  pdf.text('Tiles',      colX[3] + tilesW - padX,  y + 16, { align: 'right' });
  pdf.text('Cost (Rs.)', colX[4] + costW  - padX,  y + 16, { align: 'right' });

  let cy = y + headerH;

  // rows
  pdf.setFont('helvetica','normal'); pdf.setFontSize(11); pdf.setTextColor(31,41,55);
  let totalArea = 0, totalTiles = 0, totalCost = 0;

  rows.forEach((r, idx) => {
    if (idx % 2 === 0) { pdf.setFillColor(250,250,250); pdf.rect(x, cy, innerW, rowH, 'F'); }
    else { pdf.setDrawColor(235,238,242); pdf.rect(x, cy, innerW, rowH); }

    const nameTxt = pdf.splitTextToSize(asciiSafe(r.name || ''), nameW - padX*2);
    const sizeTxt = pdf.splitTextToSize(asciiSafe(r.size || ''), sizeW - padX*2);
    const areaTxt  = (Number(r.area)  || 0).toFixed(2);
    const tilesTxt = String(Math.round(Number(r.tiles) || 0));
    const costTxt  = (Number(r.cost)  || 0).toFixed(2);

    pdf.text(nameTxt, colX[0] + padX, cy + 15);
    pdf.text(sizeTxt, colX[1] + padX, cy + 15);
    pdf.text(areaTxt,  colX[2] + areaW  - padX, cy + 15, { align: 'right' });
    pdf.text(tilesTxt, colX[3] + tilesW - padX, cy + 15, { align: 'right' });
    pdf.text(costTxt,  colX[4] + costW  - padX, cy + 15, { align: 'right' });

    totalArea += Number(r.area)  || 0;
    totalTiles += Number(r.tiles) || 0;
    totalCost  += Number(r.cost)  || 0;
    cy += rowH;
  });

  // total row
  pdf.setFillColor(243,244,246);
  pdf.rect(x, cy, innerW, rowH, 'F');
  pdf.setFont('helvetica','bold');
  pdf.text('Total', colX[0] + padX, cy + 15);
  pdf.text(totalArea.toFixed(2), colX[2] + areaW  - padX, cy + 15, { align: 'right' });
  pdf.text(String(totalTiles),   colX[3] + tilesW - padX, cy + 15, { align: 'right' });
  pdf.text(totalCost.toFixed(2), colX[4] + costW  - padX, cy + 15, { align: 'right' });

  return cy + rowH; // new y after table
}

// pretty layout renderer (expects exact pixel sizes) for ONE room
function drawPrettyTileLayout(ctx, cfg) {
  const { roomWpx, roomHpx, tileWpx, tileHpx, margin = 20, radius = 14 } = cfg;

  // canvas size (extra for legend)
  const W = roomWpx + margin * 2;
  const H = roomHpx + margin * 2 + 36;
  ctx.canvas.width = W;
  ctx.canvas.height = H;

  // background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#f6f9ff');
  bg.addColorStop(1, '#eef2f8');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // glass card
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.09)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  const x = margin, y = margin, rw = roomWpx, rh = roomHpx;
  roundRect(ctx, x, y, rw, rh, radius);
  ctx.fillStyle = 'rgba(94, 182, 188, 0.9)';
  ctx.fill();
  ctx.restore();

  // clip to room, draw grid & tiles
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, x, y, rw, rh, radius);
  ctx.clip();
  ctx.translate(x, y);

  // grid
  ctx.strokeStyle = '#295283ff';
  ctx.lineWidth = 1;
  for (let yy = 0; yy <= rh; yy += tileHpx) {
    ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(rw, yy); ctx.stroke();
  }
  for (let xx = 0; xx <= rw; xx += tileWpx) {
    ctx.beginPath(); ctx.moveTo(xx, 0); ctx.lineTo(xx, rh); ctx.stroke();
  }

  const cols = Math.round(rw / tileWpx);
  const rows = Math.round(rh / tileHpx);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const xx = c * tileWpx;
      const yy = r * tileHpx;
      const w = Math.min(tileWpx, rw - xx);
      const h = Math.min(tileHpx, rh - yy);

      const isCut =
        (c === cols - 1 && rw % tileWpx !== 0) ||
        (r === rows - 1 && rh % tileHpx !== 0);

      ctx.fillStyle = isCut ? 'rgba(239,68,68,0.6)'   : 'rgba(16,185,129,0.16)';
      ctx.fillRect(xx, yy, w, h);
    }
  }

  // inner border
  ctx.strokeStyle = '#1b3a63ff';
  ctx.lineWidth = 2;
  roundRect(ctx, 0, 0, rw, rh, radius);
  ctx.stroke();
  ctx.restore();

  // legend
  const lx = margin, ly = margin + roomHpx + 18;
  ctx.font = '13px ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('Legend:', lx, ly);
  ctx.fillStyle = 'rgba(94, 182, 188, 0.9)'; ctx.fillRect(lx + 56, ly - 9, 16, 10);
  ctx.fillStyle = '#0f172a'; ctx.fillText('Full tile', lx + 76, ly);
  ctx.fillStyle = 'rgba(239,68,68,0.6)'; ctx.fillRect(lx + 140, ly - 9, 16, 10);
  ctx.fillStyle = '#0f172a'; ctx.fillText('Cut tile', lx + 160, ly);
}

// try to get a logo from /mea-logo.png or /logo192.png
function loadLogo() {
  const trySrcs = ['/mea-logo.png', '/logo192.png'];
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    let idx = 0;
    const tryNext = () => {
      if (idx >= trySrcs.length) return resolve(null);
      img.src = trySrcs[idx++];
    };
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ictx = c.getContext('2d');
      ictx.drawImage(img, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = tryNext;
    tryNext();
  });
}

// ---------- PDF HELPERS ----------
function asciiSafe(s) {
  if (s == null) return '';
  return String(s).replace(/[^\x20-\x7E]/g, '').replace(/≈/g, '~').replace(/\u2022/g, '-').trim();
}
function pdfSectionHeader(pdf, text, x, y) {
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13); pdf.setTextColor(17,24,39);
  pdf.text(asciiSafe(text), x, y); return y + 14;
}
function pdfKeyValue(pdf, key, value, xKey, xVal, y, lineHeight = 18) {
  pdf.setFont('helvetica', 'bold');  pdf.setFontSize(11); pdf.setTextColor(17,24,39);
  pdf.text(asciiSafe(`${key}:`), xKey, y);
  pdf.setFont('helvetica', 'normal'); pdf.setTextColor(31,41,55);
  pdf.text(asciiSafe(value), xVal, y); return y + lineHeight;
}
function pdfCard(pdf, x, y, w, h, opts = {}) {
  const r  = opts.radius ?? 10, fc = opts.fill ?? [255,255,255], dc = opts.stroke ?? [229,231,235];
  pdf.setFillColor(...fc); pdf.setDrawColor(...dc); pdf.roundedRect(x, y, w, h, r, r, 'FD');
  return y + (opts.paddingTop ?? 16);
}

/* ===================== Component ===================== */

const TileEstimationResult = () => {
  const canvasRef = useRef(null);
  const { state } = useLocation();
  const navigate = useNavigate();
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  const s = state || {};
  const {
    projectName = '',
    date = '',
    tileLength: TL0 = 0,
    tileWidth: TW0 = 0,
    allowance = 0,
    price = 0,
    rooms: roomsIn = [],                              // [{name,length,width,area,tiles,cost}]
    totals: totalsFromState,
    // legacy single-room fields (fallback)
    roomLength: RL_legacy = 0,
    roomWidth: RW_legacy = 0,
    totalArea: totalAreaLegacy = 0,
    tileCount: tilesLegacy = 0,
    estimatedCost: costLegacy = 0
  } = s;

  // If no rooms array was provided, build one from legacy fields
  const legacyRooms = (!roomsIn || roomsIn.length === 0) && (RL_legacy || RW_legacy)
    ? [{
        name: 'Room 1',
        length: Number(RL_legacy) || 0,
        width:  Number(RW_legacy) || 0,
        area:   Number(totalAreaLegacy) || ((Number(RL_legacy)||0) * (Number(RW_legacy)||0)),
        tiles:  Number(tilesLegacy) || 0,
        cost:   Number(costLegacy) || 0
      }]
    : [];

  const rooms = roomsIn.length ? roomsIn : legacyRooms;

  // normalize tile size to feet
  const tileLength = normalizeFeet(TL0);
  const tileWidth  = normalizeFeet(TW0);

  // compute totals if not passed
  const computedTotals = rooms.length
    ? {
        totalArea: rooms.reduce((a, r) => a + (Number(r.area)  || (Number(r.length)||0)*(Number(r.width)||0)), 0),
        totalTiles: rooms.reduce((a, r) => a + (Number(r.tiles) || Number(r.tileCount) || 0), 0),
        totalCost: rooms.reduce((a, r) => a + (Number(r.cost)  || Number(r.estimatedCost) || 0), 0),
      }
    : { totalArea: 0, totalTiles: 0, totalCost: 0 };

  const totals = totalsFromState || computedTotals;

  // which room is previewed on the canvas / AI section
  const [active, setActive] = useState(0);

  // stats + purchase plan for ACTIVE room
  const activeRoom = rooms[active] || rooms[0] || {};
  const L = Number(activeRoom.length) || 0;
  const W = Number(activeRoom.width)  || 0;
  const stats = tileStatsFeet(L, W, tileLength, tileWidth);
  const buy   = purchaseWaste(stats.roomArea, stats.panelArea, allowance);
  const coveragePct = Math.min(100, stats.roomArea ? (stats.covered / stats.roomArea) * 100 : 0);

  // draw canvas with exact-fit logic for ACTIVE room
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (!L || !W || !tileLength || !tileWidth) {
      canvas.width = 560; canvas.height = 120;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '14px system-ui,-apple-system,Segoe UI,Roboto';
      ctx.fillStyle = '#6b7280';
      ctx.fillText('Insufficient data to draw layout.', 16, 48);
      return;
    }

    const maxInner = 520;
    const scale = Math.min(maxInner / W, maxInner / L);
    let roomWpx = Math.max(1, Math.round(W * scale));
    let roomHpx = Math.max(1, Math.round(L * scale));

    const colsFeet = W / tileWidth;
    const rowsFeet = L / tileLength;
    const isWidthExact  = Math.abs(colsFeet - Math.round(colsFeet)) < 1e-9;
    const isHeightExact = Math.abs(rowsFeet - Math.round(rowsFeet)) < 1e-9;

    const tileWpx = isWidthExact
      ? Math.round(roomWpx / Math.round(colsFeet))
      : Math.max(1, Math.round(tileWidth * scale));
    const tileHpx = isHeightExact
      ? Math.round(roomHpx / Math.round(rowsFeet))
      : Math.max(1, Math.round(tileLength * scale));

    if (isWidthExact)  roomWpx = tileWpx * Math.round(colsFeet);
    if (isHeightExact) roomHpx = tileHpx * Math.round(rowsFeet);

    drawPrettyTileLayout(ctx, { roomWpx, roomHpx, tileWpx, tileHpx });
  }, [L, W, tileLength, tileWidth, active]);

  /* ===================== Actions ===================== */

  const handleSave = async () => {
    if (!userId) { alert('User not logged in. Please login again.'); return; }

    // Save one aggregated record (backend schema unchanged)
    const payload = {
      userId,
      projectName,
      date,
      // Keep existing fields (use first room sizes for compatibility)
      roomLength: rooms[0]?.length || 0,
      roomWidth:  rooms[0]?.width  || 0,
      tileLength,
      tileWidth,
      allowance,
      price,
      totalArea: totals.totalArea,
      tileCount: totals.totalTiles,
      estimatedCost: totals.totalCost,
      type: 'Tile'
    };

    try {
      await axios.post('http://localhost:5000/api/tile/save', payload);
      alert('Saved successfully!');
      navigate('/projects');
    } catch (err) {
      console.error('❌ Save failed:', err.response?.data || err.message);
      alert('Save failed. Check console for details.');
    }
  };

  // Export PNG (3×, exact-fit) of ACTIVE room
  const handleExportImage = () => {
    if (!L || !W || !tileLength || !tileWidth) return;

    const off = document.createElement('canvas');
    const ctx = off.getContext('2d');

    const maxInner = 520;
    const baseScale = Math.min(maxInner / W, maxInner / L);
    let roomWpx = Math.max(1, Math.round(W * baseScale * 3));
    let roomHpx = Math.max(1, Math.round(L * baseScale * 3));

    const colsFeet = W / tileWidth;
    const rowsFeet = L / tileLength;
    const isWidthExact  = Math.abs(colsFeet - Math.round(colsFeet)) < 1e-9;
    const isHeightExact = Math.abs(rowsFeet - Math.round(rowsFeet)) < 1e-9;

    const tileWpx = isWidthExact
      ? Math.round(roomWpx / Math.round(colsFeet))
      : Math.max(1, Math.round(tileWidth * baseScale * 3));
    const tileHpx = isHeightExact
      ? Math.round(roomHpx / Math.round(rowsFeet))
      : Math.max(1, Math.round(tileLength * baseScale * 3));

    if (isWidthExact)  roomWpx = tileWpx * Math.round(colsFeet);
    if (isHeightExact) roomHpx = tileHpx * Math.round(rowsFeet);

    drawPrettyTileLayout(ctx, { roomWpx, roomHpx, tileWpx, tileHpx });

    const link = document.createElement('a');
    link.href = off.toDataURL('image/png');
    link.download = `${projectName || 'tile'}-${(activeRoom.name || 'room')}-layout@3x.png`;
    link.click();
  };

  // Export PDF (A4) with header, project info, AI summary (ACTIVE room),
  // room breakdown (all rooms), and preview (ACTIVE room)
  const handleExportPDF = async () => {
    if (!L || !W || !tileLength || !tileWidth) return;

    // Render ACTIVE room layout at 3× (exact-fit)
    const layoutCanvas = document.createElement('canvas');
    const lctx = layoutCanvas.getContext('2d');
    const maxInner = 520;
    const baseScale = Math.min(maxInner / W, maxInner / L);
    let roomWpx = Math.max(1, Math.round(W * baseScale * 3));
    let roomHpx = Math.max(1, Math.round(L * baseScale * 3));

    const colsFeet = W / tileWidth;
    const rowsFeet = L / tileLength;
    const isWidthExact  = Math.abs(colsFeet - Math.round(colsFeet)) < 1e-9;
    const isHeightExact = Math.abs(rowsFeet - Math.round(rowsFeet)) < 1e-9;

    const tileWpx = isWidthExact
      ? Math.round(roomWpx / Math.round(colsFeet))
      : Math.max(1, Math.round(tileWidth * baseScale * 3));
    const tileHpx = isHeightExact
      ? Math.round(roomHpx / Math.round(rowsFeet))
      : Math.max(1, Math.round(tileLength * baseScale * 3));

    if (isWidthExact)  roomWpx = tileWpx * Math.round(colsFeet);
    if (isHeightExact) roomHpx = tileHpx * Math.round(rowsFeet);

    drawPrettyTileLayout(lctx, { roomWpx, roomHpx, tileWpx, tileHpx });
    const layoutImg = layoutCanvas.toDataURL('image/png');

    const logoImg = await loadLogo();

    // PDF page
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const margin = 48;
    const contentW = pw - margin * 2;

    // Header ribbon
    pdf.setFillColor(28, 76, 145);
    pdf.rect(0, 0, pw, 96, 'F');
    if (logoImg) pdf.addImage(logoImg, 'PNG', margin, 22, 52, 52);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(255, 255, 255);
    pdf.text(asciiSafe('Material Estimator App (MEA)'), margin + 64, 44);
    pdf.setFontSize(12);
    pdf.text(asciiSafe('Tile Estimation Report'), margin + 64, 66);

    let y = 118;

    // -------- Project Info Card --------
    const projCardH = 150;
    pdfCard(pdf, margin, y, contentW, projCardH, {
      fill: [255,255,255], stroke: [229,231,235], radius: 12, paddingTop: 18
    });
    y += 18;

    let y1 = pdfSectionHeader(pdf, 'Project Information', margin + 16, y);
    let y2 = y1;

    pdf.setFont('helvetica','normal'); pdf.setFontSize(11);
    // Left column
    y1 = pdfKeyValue(pdf, 'Project', projectName || '-', margin + 16, margin + 140, y1);
    y1 = pdfKeyValue(pdf, 'Date',    date || '-',        margin + 16, margin + 140, y1);
    y1 = pdfKeyValue(pdf, 'Rooms',   String(rooms.length || 0), margin + 16, margin + 140, y1);

    // Right column
    const rightX = margin + 16 + contentW/2;
    y2 = pdfKeyValue(pdf, 'Tile Size', `${tileLength} ft × ${tileWidth} ft`, rightX, rightX + 140, y2);
    y2 = pdfKeyValue(pdf, 'Allowance', `${allowance}%`, rightX, rightX + 140, y2);
    y2 = pdfKeyValue(pdf, 'Unit Price', `Rs. ${price}`, rightX, rightX + 140, y2);

    y = Math.max(y1, y2) + 18;

    // -------- AI Analysis (ACTIVE room) --------
    const aiCardH = 114;
    pdfCard(pdf, margin, y, contentW, aiCardH, {
      fill: [248, 250, 252], stroke: [226, 232, 240], radius: 12, paddingTop: 16
    });
    y += 16;
    y = pdfSectionHeader(pdf, ` Analytics — ${asciiSafe(activeRoom.name || 'Room')}`, margin + 16, y);
    pdf.setFont('helvetica','normal'); pdf.setFontSize(11); pdf.setTextColor(31,41,55);
    pdf.text(asciiSafe(`- Full tiles: ${stats.full}`),                     margin + 16, y + 14);
    pdf.text(asciiSafe(`- Cut tiles: ${stats.cut}`),                       margin + 16, y + 34);
    pdf.text(asciiSafe(`- Coverage: ${coveragePct.toFixed(0)}%`),          margin + 16, y + 54);
    pdf.text(asciiSafe(`- Purchase waste (incl. allowance): ${buy.purchaseWastePct.toFixed(1)}%`), margin + 16, y + 74);
    y += aiCardH + 16;

    /* -------- Room Breakdown Card (replaces old Materials Summary) -------- */
    {
      // Build rows from the rooms array (or legacy single-room fallback)
      const roomsArr = rooms.length
        ? rooms.map((r, i) => ({
            name: r.name || `Room ${i + 1}`,
            size: `${r.length} × ${r.width}`,
            area: (Number(r.area) || ((Number(r.length)||0)*(Number(r.width)||0))).toFixed(2),
            tiles: Number(r.tiles ?? r.tileCount) || 0,
            cost: Number(r.cost ?? r.estimatedCost) || 0
          }))
        : [{
            name: 'Room 1',
            size: `${RL_legacy} × ${RW_legacy}`,
            area: (Number(totalAreaLegacy) || ((Number(RL_legacy)||0)*(Number(RW_legacy)||0))).toFixed(2),
            tiles: Number(tilesLegacy) || 0,
            cost: Number(costLegacy) || 0
          }];

      // Card size estimate
      const cardTop = y;
      const innerPadding = 16;
      const innerW = contentW - innerPadding * 2;
      const estimatedH = 20 /*title*/ + 10 /*gap*/ + 26 /*hdr*/ + (roomsArr.length + 1) * 22 /*rows*/ + 20 /*bottom*/;

      // Page break if needed
      if (cardTop + estimatedH > ph - 120) { pdf.addPage(); y = 48; }

      const finalTop = y;
      const cardH = estimatedH;

      pdfCard(pdf, margin, finalTop, contentW, cardH, {
        fill: [255,255,255],
        stroke: [229,231,235],
        radius: 12,
        paddingTop: innerPadding
      });

      let ty = pdfSectionHeader(pdf, 'Room Breakdown', margin + innerPadding, finalTop + innerPadding);
      drawRoomBreakdownTable(pdf, margin + innerPadding, ty + 10, innerW, roomsArr);

      y = finalTop + cardH + 16;
    }

    // -------- Layout Preview of ACTIVE room --------
    const layoutCardTop = y;
    const maxImgW = contentW - 32;
    let imgW = maxImgW;
    const imgRatio = layoutCanvas.height / layoutCanvas.width;
    let imgH = imgW * imgRatio;

    const spaceLeft = ph - (layoutCardTop + 130);
    if (imgH > spaceLeft) { const s2 = spaceLeft / imgH; imgH *= s2; imgW *= s2; }

    const layoutCardH = imgH + 60;
    if (layoutCardTop + layoutCardH > ph - 40) { pdf.addPage(); y = margin; }

    const cardTop = layoutCardTop > ph - 40 ? margin : layoutCardTop;
    pdfCard(pdf, margin, cardTop, contentW, layoutCardH, {
      fill: [255,255,255], stroke: [229,231,235], radius: 12, paddingTop: 18
    });

    const centerX = margin + (contentW - imgW) / 2;
    y = pdfSectionHeader(pdf, `Layout Preview — ${asciiSafe(activeRoom.name||'Room')}`, margin + 16, cardTop + 20);
    pdf.addImage(layoutImg, 'PNG', centerX, y, imgW, imgH);

    // Footer
    const footerY = ph - 24;
    pdf.setDrawColor(226,232,240);
    pdf.line(margin, footerY - 12, pw - margin, footerY - 12);
    pdf.setFont('helvetica','normal'); pdf.setFontSize(10); pdf.setTextColor(100,116,139);
    pdf.text(asciiSafe('Generated by MEA • www.MEA.com'), margin, footerY);

    pdf.save(`${projectName || 'tile'}-estimation.pdf`);
  };

  const handleEdit = () => {
    // Send first room back for convenience; users can re-add others fast
    navigate('/tile-estimation', {
      state: {
        projectName, date,
        tileLength, tileWidth, allowance, price,
        roomLength: rooms[0]?.length || '',
        roomWidth: rooms[0]?.width  || ''
      }
    });
  };

  const missingState = !state;

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="tile-result-container">

        {/* AI header pill */}
        <div className="ai-chip">
          <span className="bot">🤖</span>
          <span className="label">Analytics (Active room)</span>
        </div>

        {/* AI metrics for ACTIVE room */}
        <div className="ai-values">
          <div className="ai-badge">
            Full tiles: <b>{stats.full}</b>
          </div>
          <div className="ai-badge danger">
            Cut tiles: <b>{stats.cut}</b>
          </div>
          <div className="ai-badge">
            Coverage: <b>{coveragePct.toFixed(0)}%</b>
          </div>
          <div className="ai-badge purchase">
            Purchase Waste: <b>{buy.purchaseWastePct.toFixed(1)}%</b>
          </div>
        </div>

        {/* Totals summary chips (all rooms) */}
        <div className="stats-row">
          <div className="chip"><span>Total area</span><b>{totals.totalArea.toFixed(2)} ft²</b></div>
          <div className="chip"><span>Total tiles</span><b>{totals.totalTiles}</b></div>
          <div className="chip"><span>Total cost</span><b>Rs. {totals.totalCost.toFixed(2)}</b></div>
        </div>

        <h2>Room breakdown</h2>

        {/* Room table */}
        <div className="rooms-table-wrap">
          <table className="rooms-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Size (ft)</th>
                <th>Area (ft²)</th>
                <th>Tiles</th>
                <th>Cost (Rs.)</th>
                <th>Preview</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r, i) => (
                <tr key={i} className={active===i ? 'active' : ''}>
                  <td>{r.name}</td>
                  <td>{r.length} × {r.width}</td>
                  <td className="num">{Number(r.area ?? ((Number(r.length)||0)*(Number(r.width)||0))).toFixed(2)}</td>
                  <td className="num">{Number(r.tiles ?? r.tileCount) || 0}</td>
                  <td className="num">{(Number(r.cost ?? r.estimatedCost) || 0).toFixed(2)}</td>
                  <td className="center">
                    <button className="mini" onClick={() => setActive(i)}>
                      {active === i ? 'Selected' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>Total</th>
                <th>—</th>
                <th className="num">{totals.totalArea.toFixed(2)}</th>
                <th className="num">{totals.totalTiles}</th>
                <th className="num">Rs. {totals.totalCost.toFixed(2)}</th>
                <th>—</th>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Canvas preview for ACTIVE room */}
        <div className="canvas-frame">
          <canvas ref={canvasRef} />
        </div>

        {/* Global details */}
        <div className="result-details">
          <p><strong>Tile size:</strong> {tileLength} ft × {tileWidth} ft</p>
          <p><strong>Allowance:</strong> {allowance}% &nbsp; • &nbsp; <strong>Unit price:</strong> Rs. {price}</p>
          <p><strong>Project:</strong> {projectName || 'Untitled'}  &nbsp; • &nbsp;  <strong>Date:</strong> {date || '-'}</p>
        </div>

        <div className="button-group2">
          <button className="save-btn" onClick={handleSave}>Save</button>
          <button className="edit-btn" onClick={handleEdit}>Edit</button>
        </div>

        <div className="button-group">
          <button onClick={handleExportImage} className="export-btn">Export PNG (3×)</button>
          <button onClick={handleExportPDF} className="export-btn">Export PDF (A4)</button>
        </div>

        {missingState && (
          <div style={{ marginTop: 10 }}>
            <p>No estimation data found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TileEstimationResult;
