// src/pages/CeilingEstimation.js
import React, { useState, useRef } from 'react';
import { useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/CeilingEstimation.css';
import getCeilingPrices from '../utils/getCeilingPrices'; // <-- NEW

const CeilingEstimation = () => {
  const [rooms, setRooms] = useState([{ name: 'Room 1', length: '', width: '' }]);

  // Initialize the form with the latest saved prices (from Pricing Management)
  const [prices, setPrices] = useState(() => getCeilingPrices());

  const navigate = useNavigate();
  const startRef = useRef(Date.now());

  // Keep your existing project meta
  const { state: previous = {} } = useLocation();
  const [projectName] = useState(previous.projectName || '');
  const [date]        = useState(previous.date || '');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // compute elapsed minutes
    const elapsedMs = Date.now() - startRef.current;
    const elapsedMins = elapsedMs / 60000;
    const manualMins = 15;
    const timeSaved = manualMins - elapsedMins;

    // increment estimateCount exactly once on button click
    {
      const prev = parseInt(localStorage.getItem('estimateCount') || '0', 10);
      const updated = prev + 1;
      localStorage.setItem('estimateCount', updated);
    }

    // Prepare numeric values
    const payloadRooms = rooms.map((r) => ({
      name: r.name,
      length: parseFloat(r.length),
      width: parseFloat(r.width),
    }));

    try {
      // send whatever is in the form (already initialized from localStorage)
      const res = await axios.post('http://localhost:5000/api/ceiling/calculate', {
        rooms: payloadRooms,
        prices,
      });

      navigate('/ceiling-result', {
        state: {
          ...res.data,
          projectName: previous.projectName,
          date: previous.date,
          timeSaved,
        },
      });
    } catch (err) {
      alert('Calculation failed');
      console.error(err);
    }
  };

  return (
    <div className="dashboardcc">
      <Sidebar />
      <div className="estimation-content">
        <h2 className="AAAA">Ceiling Panel Estimation</h2>
        <form onSubmit={handleSubmit} className="BBBB">
          {rooms.map((room, idx) => (
            <div key={idx} className="room-input">
              <h4 className="AAAy">{room.name}</h4>
              <input
                type="number"
                placeholder="Length (ft)"
                value={room.length}
                onChange={(e) => {
                  const updated = [...rooms];
                  updated[idx].length = e.target.value;
                  setRooms(updated);
                }}
                required
              />
              <input
                type="number"
                placeholder="Width (ft)"
                value={room.width}
                onChange={(e) => {
                  const updated = [...rooms];
                  updated[idx].width = e.target.value;
                  setRooms(updated);
                }}
                required
              />
              {rooms.length > 1 && (
                <button
                  type="button"
                  onClick={() => setRooms(rooms.filter((_, i) => i !== idx))}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              setRooms([...rooms, { name: `Room ${rooms.length + 1}`, length: '', width: '' }])
            }
          >
            + Add Room
          </button>

          <div className="EEEE">
            <div>
              <label>Main T-Bar (Rs.)</label>
              <input
                type="number"
                value={prices.mt}
                onChange={(e) => setPrices({ ...prices, mt: Number(e.target.value) })}
                className="FFFF"
              />
            </div>
            <div>
              <label>Cross T-Bar (Rs.)</label>
              <input
                type="number"
                value={prices.ct}
                onChange={(e) => setPrices({ ...prices, ct: Number(e.target.value) })}
                className="GGGG"
              />
            </div>
            <div>
              <label>Panel Sheet (Rs.)</label>
              <input
                type="number"
                value={prices.panel}
                onChange={(e) => setPrices({ ...prices, panel: Number(e.target.value) })}
                className="HHHH"
              />
            </div>
            <div>
              <label>Wall Angle (Rs.)</label>
              <input
                type="number"
                value={prices.wa}
                onChange={(e) => setPrices({ ...prices, wa: Number(e.target.value) })}
                className="IIII"
              />
            </div>
          </div>

          <button type="submit" className="JJJJ">
            Calculate
          </button>
        </form>
      </div>
    </div>
  );
};

export default CeilingEstimation;
