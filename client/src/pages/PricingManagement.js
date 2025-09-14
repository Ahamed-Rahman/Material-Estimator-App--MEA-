import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/PricingManagement.css';
import priceConfig from '../pages/priceConfig';

// Small inline SVG icons so you don't depend on Font Awesome
const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M6 7h12v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7zm3-5h6l1 1h4v2H4V3h4l1-1z"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="m19 6.41-1.41-1.41L12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
);

// Core items map (keys must match your existing localStorage shape)
const CORE_ITEMS = [
  { id: 'priceMT',    label: 'Main T-bar',   cfgKey: 'mt' },
  { id: 'priceCT',    label: 'Cross T-bar',  cfgKey: 'ct' },
  { id: 'pricePanel', label: 'Panel',        cfgKey: 'panel' },
  { id: 'priceWA',    label: 'Wall Angle',   cfgKey: 'wa' },
];

const LS_CORE = 'ceilingPrices';
const LS_EXTRA = 'ceilingExtraMaterials';

export default function PricingManagement() {
  // Core prices (object with the 4 keys your app expects)
  const [core, setCore] = useState({
    priceMT: priceConfig.mt,
    priceCT: priceConfig.ct,
    pricePanel: priceConfig.panel,
    priceWA: priceConfig.wa,
  });

  // Extra materials (array of {id, name, price})
  const [extras, setExtras] = useState([]);

  // UI: editing state
  const [editingId, setEditingId] = useState(null);
  const [tempPrice, setTempPrice] = useState('');

  // UI: add modal
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  // Load from localStorage
  useEffect(() => {
    const storedCore = localStorage.getItem(LS_CORE);
    if (storedCore) {
      try {
        setCore(JSON.parse(storedCore));
      } catch {}
    }
    const storedExtras = localStorage.getItem(LS_EXTRA);
    if (storedExtras) {
      try {
        setExtras(JSON.parse(storedExtras));
      } catch {}
    }
  }, []);

  // Helpers to persist
  const saveCore = (next) => {
    setCore(next);
    localStorage.setItem(LS_CORE, JSON.stringify(next));
  };
  const saveExtras = (next) => {
    setExtras(next);
    localStorage.setItem(LS_EXTRA, JSON.stringify(next));
  };

  // Build rows for the table
  const rows = [
    ...CORE_ITEMS.map(ci => ({
      id: ci.id,
      name: ci.label,
      price: Number(core[ci.id] ?? 0),
      core: true,
    })),
    ...extras.map(e => ({
      id: e.id,
      name: e.name,
      price: Number(e.price ?? 0),
      core: false,
    })),
  ];

  // Format
  const formatRs = (v) =>
    isFinite(v) ? `Rs. ${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—';

  // Editing
  const startEdit = (row) => {
    setEditingId(row.id);
    setTempPrice(String(row.price));
  };
  const cancelEdit = () => {
    setEditingId(null);
    setTempPrice('');
  };
  const saveEdit = (row) => {
    const price = Math.max(0, Number(tempPrice || 0));
    if (row.core) {
      // update one of the 4 core keys
      const next = { ...core, [row.id]: price };
      saveCore(next);
    } else {
      const next = extras.map(x => x.id === row.id ? { ...x, price } : x);
      saveExtras(next);
    }
    cancelEdit();
  };

  // Delete (extras only)
  const handleDelete = (row) => {
    if (row.core) return; // delete disabled for core
    if (!window.confirm(`Delete "${row.name}"?`)) return;
    const next = extras.filter(x => x.id !== row.id);
    saveExtras(next);
  };

  // Add new material (extras)
  const handleAdd = (e) => {
    e.preventDefault();
    const name = newName.trim();
    const price = Math.max(0, Number(newPrice || 0));
    if (!name) return;
    const item = { id: `x-${Date.now()}`, name, price };
    const next = [...extras, item];
    saveExtras(next);
    setShowAdd(false);
    setNewName('');
    setNewPrice('');
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="pricing-container">
        <div className="pm-header">
          <div>
            <h2>Ceiling Material Prices</h2>
            <p className="pm-sub">Edit your pricing for calculations. Core items are protected from deletion.</p>
          </div>
          <button className="pm-add-btn" onClick={() => setShowAdd(true)}>
            + Add Material
          </button>
        </div>

        <div className="pm-card">
          <table className="pm-table">
            <thead>
              <tr>
                <th style={{width:'52%'}}>Material</th>
                <th style={{width:'24%'}}>Price (Rs)</th>
                <th style={{width:'24%'}} className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isEditing = editingId === row.id;
                return (
                  <tr key={row.id} className={row.core ? 'is-core' : ''}>
                    <td className="pm-name">
                      {row.name}
                      {row.core && <span className="pm-chip">Core</span>}
                    </td>

                    <td className="pm-price">
                      {isEditing ? (
                        <input
                          className="pm-input"
                          type="number"
                          min="0"
                          step="0.01"
                          value={tempPrice}
                          onChange={(e) => setTempPrice(e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <span>{formatRs(row.price)}</span>
                      )}
                    </td>

                    <td className="pm-actions">
                      {isEditing ? (
                        <>
                          <button className="pm-icon success" title="Save" onClick={() => saveEdit(row)}>
                            <CheckIcon />
                          </button>
                          <button className="pm-icon" title="Cancel" onClick={cancelEdit}>
                            <CloseIcon />
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="pm-icon" title="Edit" onClick={() => startEdit(row)}>
                            <EditIcon />
                          </button>
                          <button
                            className="pm-icon danger"
                            title={row.core ? 'Delete disabled for core items' : 'Delete'}
                            onClick={() => handleDelete(row)}
                            disabled={row.core}
                          >
                            <TrashIcon />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="3" className="pm-empty">No materials yet. Click “Add Material”.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add modal */}
        {showAdd && (
          <div className="pm-modal-backdrop" onClick={() => setShowAdd(false)}>
            <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="pm-modal-head">
                <h3>Add Material</h3>
                <button className="pm-icon" onClick={() => setShowAdd(false)} aria-label="Close">
                  <CloseIcon />
                </button>
              </div>
              <form className="pm-form" onSubmit={handleAdd}>
                <label>
                  <span>Material Name</span>
                  <input
                    type="text"
                    placeholder="e.g. Hanger Wire"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </label>
                <label>
                  <span>Price (Rs)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 120.00"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    required
                  />
                </label>
                <div className="pm-modal-actions">
                  <button type="button" className="btn ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                  <button type="submit" className="btn primary">Add</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
