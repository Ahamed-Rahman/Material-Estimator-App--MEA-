import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/TileEstimation.css';

/* Tiny inline icons */
const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2m13 8H6v10h14V10zM6 6v2h14V6H6z"/>
  </svg>
);
const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M10 4l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h6z"/>
  </svg>
);
const RulerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M3.3 17.7l14.4-14.4 3.5 3.5L6.8 21.2l-3.5-3.5m2.8 0l2.1 2.1 1.4-1.4-2.1-2.1-1.4 1.4m3.5-3.5l2.1 2.1 1.4-1.4-2.1-2.1-1.4 1.4m3.5-3.5l2.1 2.1 1.4-1.4-2.1-2.1-1.4 1.4m3.6-3.6l2.1 2.1 1.4-1.4-2.1-2.1-1.4 1.4z"/>
  </svg>
);
const GridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M3 3h8v8H3V3m10 0h8v8h-8V3M3 13h8v8H3v-8m10 0h8v8h-8v-8z"/>
  </svg>
);
const PercentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M7 17a3 3 0 110-6 3 3 0 010 6m10 0a3 3 0 110-6 3 3 0 010 6M7 19L19 7"/>
  </svg>
);
const CurrencyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M7 6h6a4 4 0 110 8H9v4H7V6m6 6a2 2 0 100-4H9v4h4z"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2m1 6h2v9h-2V9m4 0h2v9h-2V9M7 9h2v9H7V9z"/>
  </svg>
);

export default function TileEstimation() {
  const navigate = useNavigate();
  const location = useLocation();
  const previous = location.state || {};
  const startRef = useRef(Date.now());

  /* Project info from previous screen */
  const [projectName, setProjectName] = useState(previous.projectName || '');
  const [date, setDate] = useState(previous.date || '');

  /* GLOBAL tile details (applies to all rooms) */
  const [tileLength, setTileLength] = useState(previous.tileLength || '');
  const [tileWidth, setTileWidth]   = useState(previous.tileWidth || '');
  const [allowance, setAllowance]   = useState(previous.allowance || '5');
  const [price, setPrice]           = useState(previous.price || '');

  /* ROOMS list */
  const [rooms, setRooms] = useState(() => {
    const first = {
      id: crypto.randomUUID(),
      name: 'Room 1',
      length: previous.roomLength || '',
      width: previous.roomWidth || ''
    };
    return [first];
  });

  const blockInvalidKeys = (e) => {
    const k = e.key?.toLowerCase();
    if (k === '-' || k === 'e') e.preventDefault();
  };
  const parseNum = (v, fb = NaN) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fb;
  };

  const addRoom = () => {
    const idx = rooms.length + 1;
    setRooms(r => [...r, { id: crypto.randomUUID(), name: `Room ${idx}`, length: '', width: '' }]);
  };
  const removeRoom = (id) => {
    if (rooms.length === 1) return; // keep at least one
    setRooms(r => r.filter(x => x.id !== id));
  };
  const setRoom = (id, field, value) => {
    setRooms(r => r.map(x => x.id === id ? { ...x, [field]: value } : x));
  };

  const handleEstimate = () => {
    // time saved
    const elapsedMins = (Date.now() - startRef.current) / 60000;
    const timeSaved = Math.max(0, 15 - elapsedMins);

    // increment estimates count
    const prev = parseInt(localStorage.getItem('estimateCount') || '0', 10);
    localStorage.setItem('estimateCount', prev + 1);

    // validate globals
    const tL = parseNum(tileLength), tW = parseNum(tileWidth);
    const allow = parseNum(allowance, 0);
    const unit  = parseNum(price);
    if (![tL, tW, unit].every(n => Number.isFinite(n) && n > 0) || allow < 0) {
      alert('Enter valid global tile details (tile size, price, allowance).');
      return;
    }

    // validate rooms and compute per-room
    const perRoom = [];
    for (let i = 0; i < rooms.length; i++) {
      const r = rooms[i];
      const L = parseNum(r.length), W = parseNum(r.width);
      if (!Number.isFinite(L) || L <= 0 || !Number.isFinite(W) || W <= 0) {
        alert(`Please enter valid dimensions for "${r.name || 'Room ' + (i+1)}".`);
        return;
      }
      const area = L * W;
      const baseTileArea = tL * tW;
      const tiles = Math.ceil((area / baseTileArea) * (1 + allow / 100));
      const cost  = tiles * unit;
      perRoom.push({
        name: r.name?.trim() || `Room ${i+1}`,
        length: L, width: W, area, tiles, cost
      });
    }

    // totals
    const totalArea = perRoom.reduce((s, r) => s + r.area, 0);
    const totalTiles = perRoom.reduce((s, r) => s + r.tiles, 0);
    const totalCost  = perRoom.reduce((s, r) => s + r.cost, 0);

    navigate('/tile-estimation-result', {
      state: {
        projectName, date, timeSaved,
        tileLength: tL, tileWidth: tW, allowance: allow, price: unit,
        rooms: perRoom,
        totals: { totalArea, totalTiles, totalCost }
      }
    });
  };

  // form validity
  const globalsValid =
    parseNum(tileLength) > 0 &&
    parseNum(tileWidth) > 0 &&
    parseNum(price) > 0 &&
    parseNum(allowance, 0) >= 0;

  const roomsValid = rooms.every(r =>
    parseNum(r.length) > 0 && parseNum(r.width) > 0
  );

  const valid = globalsValid && roomsValid;

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="tile-estimation-container">
        {/* Header */}
        <header className="te-header">
          <h2>Tile Estimation</h2>
          <div className="te-tags">
            <span className="tag"><FolderIcon /> {projectName || 'Untitled project'}</span>
            <span className="tag"><CalendarIcon /> {date || 'No date'}</span>
          </div>
        </header>

        {/* Rooms section */}
        <div className="te-card">
          <div className="te-card-title"><RulerIcon /> Rooms</div>

          <div className="rooms-list">
            {rooms.map((r, i) => (
              <div className="room-card" key={r.id}>
                <div className="room-head">
                  <input
                    className="room-name"
                    value={r.name}
                    placeholder={`Room ${i+1}`}
                    onChange={(e)=>setRoom(r.id,'name', e.target.value)}
                  />
                  <button
                    type="button"
                    className="room-remove"
                    onClick={() => removeRoom(r.id)}
                    disabled={rooms.length === 1}
                    title="Remove room"
                  >
                    <TrashIcon /> Remove
                  </button>
                </div>

                <div className="te-grid two">
                  <label className="field">
                    <span className="label">Length</span>
                    <div className="field-wrap">
                      <span className="icon"><RulerIcon /></span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        step="any"
                        value={r.length}
                        placeholder="Length (ft)"
                        onKeyDown={blockInvalidKeys}
                        onChange={(e)=>setRoom(r.id,'length', e.target.value)}
                      />
                      <span className="unit">ft</span>
                    </div>
                  </label>

                  <label className="field">
                    <span className="label">Width</span>
                    <div className="field-wrap">
                      <span className="icon"><RulerIcon /></span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        step="any"
                        value={r.width}
                        placeholder="Width (ft)"
                        onKeyDown={blockInvalidKeys}
                        onChange={(e)=>setRoom(r.id,'width', e.target.value)}
                      />
                      <span className="unit">ft</span>
                    </div>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="add-room" onClick={addRoom}>
            <PlusIcon /> Add another room
          </button>
        </div>

        {/* Global tile details (applies to all rooms) */}
        <div className="te-card">
          <div className="te-card-title"><GridIcon /> Tile details (applies to all rooms)</div>

          <div className="te-grid four">
            <label className="field">
              <span className="label">Tile length</span>
              <div className="field-wrap">
                <span className="icon"><GridIcon /></span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="any"
                  value={tileLength}
                  placeholder="Tile length (ft)"
                  onKeyDown={blockInvalidKeys}
                  onChange={(e)=>setTileLength(e.target.value)}
                />
                <span className="unit">ft</span>
              </div>
            </label>

            <label className="field">
              <span className="label">Tile width</span>
              <div className="field-wrap">
                <span className="icon"><GridIcon /></span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="any"
                  value={tileWidth}
                  placeholder="Tile width (ft)"
                  onKeyDown={blockInvalidKeys}
                  onChange={(e)=>setTileWidth(e.target.value)}
                />
                <span className="unit">ft</span>
              </div>
            </label>

            <label className="field">
              <span className="label">Allowance</span>
              <div className="field-wrap">
                <span className="icon"><PercentIcon /></span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={allowance}
                  placeholder="Allowance (%)"
                  onKeyDown={blockInvalidKeys}
                  onChange={(e)=>setAllowance(e.target.value)}
                />
                <span className="unit">%</span>
              </div>
              <small className="hint">Typical waste 5–10%</small>
            </label>

            <label className="field">
              <span className="label">Unit price</span>
              <div className="field-wrap">
                <span className="icon"><CurrencyIcon /></span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="any"
                  value={price}
                  placeholder="Price (Rs)"
                  onKeyDown={blockInvalidKeys}
                  onChange={(e)=>setPrice(e.target.value)}
                />
                <span className="unit">Rs</span>
              </div>
            </label>
          </div>
        </div>

        <button className="estimate-btn" onClick={handleEstimate} disabled={!valid}>
          Estimate now
        </button>
      </div>
    </div>
  );
}
