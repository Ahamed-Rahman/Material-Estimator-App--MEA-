import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/NewEstimation.css';
import tileIcon from '../assets/tile-icon.png';
import ceilingIcon from '../assets/ceiling-icon.png';

/* Small inline icons (no extra deps) */
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

const NewEstimation = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [type, setType] = useState('');
  const [projectName, setProjectName] = useState('');
  const [date, setDate] = useState(today); // Default to today's date only

  const handleEstimate = () => {
    if (!type || !projectName || !date) {
      alert('Please fill in all fields.');
      return;
    }

    if (date !== today) {
      alert("You can only select today's date.");
      return;
    }

    const state = { projectName, date };

    if (type === 'Tile') {
      navigate('/tile-estimation', { state });
    } else if (type === 'Ceiling') {
      navigate('/ceiling-estimation', { state });
    } else {
      alert('Please select a type of estimation.');
    }
  };

  const valid = Boolean(type && projectName && date === today);

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="estimation-content">
        {/* Header */}
        <header className="ne-header">
          <div>
            <h2>New Estimation</h2>
            <p className="ne-sub">What would you like to estimate today?</p>
          </div>

          {/* Steps (purely visual) */}
          <ol className="ne-steps" aria-label="Steps">
            <li className={`step ${type ? 'done' : 'active'}`}><span>1</span>Choose type</li>
            <li className={`step ${type ? 'active' : ''}`}><span>2</span>Name & date</li>
            <li className="step"><span>3</span>Estimate</li>
          </ol>
        </header>

        {/* Type select cards */}
        <div className="estimation-types">
          <button
            type="button"
            className={`type-card ${type === 'Tile' ? 'selected' : ''}`}
            onClick={() => setType('Tile')}
          >
            <img src={tileIcon} alt="" />
            <span>Tile</span>
          </button>

          <button
  type="button"
  className={`type-card ceiling ${type === 'Ceiling' ? 'selected' : ''}`}
  onClick={() => setType('Ceiling')}
>
  <img src={ceilingIcon} alt="" />
  <span>Ceiling</span>
</button>
        </div>

        {/* Form card */}
        <section className="ne-card">
          <div className="ne-grid">
            <label className="field">
              <span className="label">Project name</span>
              <div className="field-wrap">
                <span className="icon"><FolderIcon /></span>
                <input
                  type="text"
                  placeholder="E.g., Hall renovation"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
            </label>

            <label className="field">
              <span className="label">Date</span>
              <div className="field-wrap">
                <span className="icon"><CalendarIcon /></span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={today}
                  max={today}
                />
              </div>
              <small className="hint">Only today is allowed for demo consistency.</small>
            </label>
          </div>
        </section>

        <div className="ne-cta">
          <button className="estimate-btn" onClick={handleEstimate} disabled={!valid}>
            Estimate
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewEstimation;
