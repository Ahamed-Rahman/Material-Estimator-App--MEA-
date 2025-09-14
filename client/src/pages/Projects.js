// src/pages/Projects.js
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import '../styles/Projects.css';
import ConfirmModal from '../components/ConfirmModal';


/* Tiny inline icons (no extra libraries) */
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M10 3a7 7 0 015.61 11.19l4.6 4.6-1.42 1.42-4.6-4.6A7 7 0 1110 3m0 2a5 5 0 100 10 5 5 0 000-10z" />
  </svg>
);
const TileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M3 3h8v8H3V3m10 0h8v8h-8V3M3 13h8v8H3v-8m10 0h8v8h-8v-8z"/>
  </svg>
);
const CeilingIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M2 6h20v2H2V6m2 4h16v2H4v-2m2 4h12v2H6v-2z"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M9 3h6l1 2h5v2H3V5h5l1-2m1 6v8h2V9h-2m-4 0v8h2V9H7m8 0v8h2V9h-2z"/>
  </svg>
);
const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 6c5 0 9 6 9 6s-4 6-9 6-9-6-9-6 4-6 9-6m0 2a4 4 0 100 8 4 4 0 000-8z"/>
  </svg>
);

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);     // NEW: nicer UX
  const [error, setError] = useState(null);         // NEW: error surface

  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
const [deleteTarget, setDeleteTarget] = useState(null); // { id, type }


  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const [tileRes, ceilingRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/tile/user/${userId}`),
          axios.get(`http://localhost:5000/api/ceiling/user/${userId}`)
        ]);
        const combined = [...tileRes.data, ...ceilingRes.data];
        setProjects(combined);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
        setError('Could not load projects.');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [userId]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesType = filterType === 'All' || p.type === filterType;
      const name = (p.projectName || '').toLowerCase();
      const q = searchTerm.toLowerCase();
      const matchesSearch = name.includes(q);
      return matchesType && matchesSearch;
    });
  }, [projects, filterType, searchTerm]);

  // stats (for header)
  const totalCount = filtered.length;
  const tileCount = filtered.filter(p => p.type === 'Tile').length;
  const ceilingCount = filtered.filter(p => p.type === 'Ceiling').length;

  // pagination
  const rowsPerPage = 10;
  const totalPages = Math.ceil(totalCount / rowsPerPage) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const formatDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? d : dt.toLocaleDateString();
  };

  const handleView = (project) => {
    navigate(
      project.type === 'Tile'
        ? '/tile-estimation-result'
        : '/ceiling-estimation-result',
      { state: project }
    );
  };

 const handleDeleteClick = (id, type) => {
  setDeleteTarget({ id, type });
  setConfirmOpen(true);
};

const handleConfirmDelete = async () => {
  if (!deleteTarget) return;

  try {
    const route = deleteTarget.type === 'Tile' ? 'tile' : 'ceiling';
    await axios.delete(`http://localhost:5000/api/${route}/delete/${deleteTarget.id}`);
    setProjects(prev => prev.filter(p => p._id !== deleteTarget.id));
  } catch (err) {
    alert('Delete failed');
    console.error(err);
  } finally {
    setConfirmOpen(false);
    setDeleteTarget(null);
  }
};

const handleCancelDelete = () => {
  setConfirmOpen(false);
  setDeleteTarget(null);
};


  // keep page in range when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchTerm]);

  

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="projects-container">
        {/* Header */}
        <div className="proj-header">
          <div className="proj-title">
            <h2>Projects</h2>
            <p className="proj-sub">All your saved tile & ceiling estimations</p>
          </div>

          {/* Stats cards */}
          <div className="proj-stats">
            <div className="stat-card total">
              <div className="stat-label">Total</div>
              <div className="stat-value">{totalCount}</div>
            </div>
            <div className="stat-card tile">
              <div className="stat-label">Tile</div>
              <div className="stat-value">{tileCount}</div>
            </div>
            <div className="stat-card ceiling">
              <div className="stat-label">Ceiling</div>
              <div className="stat-value">{ceilingCount}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          {/* Type pills (desktop) */}
          <div className="type-pills" role="tablist" aria-label="Filter by type">
            <button
              className={`pill ${filterType === 'All' ? 'active' : ''}`}
              onClick={() => setFilterType('All')}
            >
              All
            </button>
            <button
              className={`pill ${filterType === 'Tile' ? 'active' : ''}`}
              onClick={() => setFilterType('Tile')}
            >
              <TileIcon /> Tile
            </button>
            <button
              className={`pill ${filterType === 'Ceiling' ? 'active' : ''}`}
              onClick={() => setFilterType('Ceiling')}
            >
              <CeilingIcon /> Ceiling
            </button>
          </div>

          {/* Mobile-friendly select (shows on small screens) */}
          <div className="type-filter-mobile">
            <label>Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Tile">Tile</option>
              <option value="Ceiling">Ceiling</option>
            </select>
          </div>

          {/* Search */}
          <div className="search-filter">
            <div className="search-box">
              <span className="search-icon"><SearchIcon /></span>
              <input
                type="text"
                placeholder="Search projects"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table / Loading / Empty */}
        <div className="table-wrap">
          <table className="projects-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Date</th>
                <th className="actions-col">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                // skeleton rows
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="skeleton-row">
                    <td><div className="sk sk-text" /></td>
                    <td><div className="sk sk-chip" /></td>
                    <td><div className="sk sk-text short" /></td>
                    <td><div className="sk sk-buttons" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan="4" className="center">
                    <div className="error-box">{error}</div>
                  </td>
                </tr>
              ) : paginated.length > 0 ? (
                paginated.map((proj) => (
                  <tr key={proj._id}>
                    <td className="name-cell">
                      <span className="name">{proj.projectName}</span>
                    </td>
                    <td>
                      <span className={`type-badge ${proj.type === 'Tile' ? 'tile' : 'ceiling'}`}>
                        {proj.type === 'Tile' ? <TileIcon /> : <CeilingIcon />}
                        {proj.type}
                      </span>
                    </td>
                    <td>{formatDate(proj.date)}</td>
                    <td className="actions">
                      <button onClick={() => handleView(proj)} className="btn view-btn">
                        <EyeIcon /> View
                      </button>
                      <button
  onClick={() => handleDeleteClick(proj._id, proj.type)}
  className="btn delete-btn"
  title="Delete project"
>
  <TrashIcon /> Delete
</button>

                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="center">
                    <div className="empty-state">
                      <div className="empty-title">No projects found</div>
                      <p className="empty-sub">Try changing filters or create a new estimation.</p>
                      <button
                        className="btn primary"
                        onClick={() => navigate('/new-estimation')}
                      >
                        Create new estimation
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ‹ Prev
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className={currentPage === i + 1 ? 'active' : ''}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next ›
            </button>
          </div>
        )}
      </div>

       {/* Confirm delete modal */}
    <ConfirmModal
      isOpen={confirmOpen}
      message="Are you sure you want to delete this project? This action cannot be undone."
      onConfirm={handleConfirmDelete}
      onCancel={handleCancelDelete}
    />
    </div>
  );
};

export default Projects;
