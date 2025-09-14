// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import {
  BarChart, Bar, XAxis, YAxis,
  PieChart, Pie, Cell, Tooltip, Legend
} from 'recharts';

const MONTHS = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec'
];

const PIE_COLORS = ['#1c4c91', '#ff8c00', '#10b981']; // Tile, Ceiling, All types

const Dashboard = () => {
  const [barData, setBarData] = useState(
    MONTHS.map(m => ({ month: m, count: 0 }))
  );
  const [savedProjectsCount, setSavedProjectsCount] = useState(0);
  const [totalEstimations, setTotalEstimations] = useState(0);
  const [totalTimeSaved, setTotalTimeSaved] = useState(0);

  // NEW: dynamic pie data
  const [pieData, setPieData] = useState([
    { name: 'Tile', value: 0 },
    { name: 'Ceiling', value: 0 },
    { name: 'All types', value: 0 },
  ]);

  useEffect(() => {
    const userId = localStorage.getItem('userId');

    // 1) Time saved (from your ceiling page storage)
    const arr = JSON.parse(localStorage.getItem('ceilingTimeSavings') || '[]');
    const total = arr.reduce((sum, v) => sum + v, 0);
    setTotalTimeSaved(total);

    if (!userId) return;

    // 2) Fetch saved projects
    Promise.all([
      axios.get(`http://localhost:5000/api/tile/user/${userId}`),
      axios.get(`http://localhost:5000/api/ceiling/user/${userId}`)
    ])
    .then(([tileRes, ceilingRes]) => {
      const tiles = tileRes.data || [];
      const ceilings = ceilingRes.data || [];
      const projects = [...tiles, ...ceilings];

      // overall count (as your current UI does: counts each saved entry)
      setSavedProjectsCount(projects.length);

      // 3) Build monthly tally for the bar
      const counts = MONTHS.reduce((acc, m) => {
        acc[m] = 0;
        return acc;
      }, {});

      projects.forEach(p => {
        const d = new Date(p.date);
        if (!isNaN(d)) {
          const m = MONTHS[d.getMonth()];
          counts[m]++;
        }
      });

      setBarData(MONTHS.map(m => ({ month: m, count: counts[m] })));

      // 4) Build "Tile / Ceiling / All types" distribution by projectName
      //    (All types means the same projectName exists in both lists)
      const nameKey = s => (s || '').trim().toLowerCase();

      const map = new Map(); // projectName -> Set of types
      tiles.forEach(p => {
        const k = nameKey(p.projectName);
        if (!map.has(k)) map.set(k, new Set());
        map.get(k).add('Tile');
      });
      ceilings.forEach(p => {
        const k = nameKey(p.projectName);
        if (!map.has(k)) map.set(k, new Set());
        map.get(k).add('Ceiling');
      });

      let tileOnly = 0, ceilingOnly = 0, both = 0;
      for (const types of map.values()) {
        const hasT = types.has('Tile');
        const hasC = types.has('Ceiling');
        if (hasT && hasC) both++;
        else if (hasT) tileOnly++;
        else if (hasC) ceilingOnly++;
      }

      setPieData([
        { name: 'Tile', value: tileOnly },
        { name: 'Ceiling', value: ceilingOnly },
        { name: 'All types', value: both },
      ]);
    })
    .catch(console.error);

    // 5) Total estimations (all runs, saved or not)
    const ec = parseInt(localStorage.getItem('estimateCount') || '0', 10);
    setTotalEstimations(ec);
  }, []);

  // nice % tooltip for the pie
  const renderPieTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const total = pieData.reduce((s, d) => s + d.value, 0) || 1;
    const { name, value } = payload[0].payload;
    const pct = Math.round((value / total) * 100);
    return (
      <div className="recharts-default-tooltip" style={{ background:'#fff', border:'1px solid #e5e7eb', padding:'8px 10px', borderRadius:6 }}>
        <div style={{ fontWeight:600 }}>{name}</div>
        <div>{value} project{value === 1 ? '' : 's'} ({pct}%)</div>
      </div>
    );
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-content">

        <div className="top-cards">
          <div className="card">
            Saved Projects <span>{savedProjectsCount}</span>
          </div>
          <div className="card">
            Total Estimations <span>{totalEstimations}</span>
          </div>
          <div className="card">
            Time Saved (mins) <span>{totalTimeSaved.toFixed(2)}</span>
          </div>
          <div className="card">
            Custom Pricing Enabled <span>YES</span>
          </div>
        </div>

        <div className="charts">
          <div className="bar">
            <h3>Saved Estimations Per Month</h3>
            <BarChart width={400} height={250} data={barData}>
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#1c4c91" />
            </BarChart>
          </div>

          <div className="pie">
            <h3>Estimation Types</h3>
            <PieChart width={360} height={300}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                dataKey="value"
                nameKey="name"
              >
                {pieData.map((entry, idx) => (
                  <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={renderPieTooltip} />
              <Legend />
            </PieChart>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
