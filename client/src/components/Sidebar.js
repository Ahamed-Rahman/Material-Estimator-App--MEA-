import React from 'react';
import { FaHome, FaProjectDiagram, FaPlus, FaDollarSign, FaUser } from 'react-icons/fa';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import logo from '../assets/logo.jpeg';

import '../styles/Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser, setProfilePicUrl } = useUser?.() || {};

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('resetEmail');
    if (setUser) setUser(null);
    if (setProfilePicUrl) setProfilePicUrl(null);
    navigate('/login', { replace: true });
  };

  return (
    <div className="sidebar">
      {/* Heading */}
      <div className="logo">Material Estimator App</div>

      {/* Logo image BELOW the heading */}
      <div className="logo-image-wrap">
        {/* Put your file at public/mea-logo.png, or change the src path */}
        <img src={logo} alt="MEA Logo" className="logo-image" />
      </div>

      {/* Buttons BELOW the logo */}
      <ul className="nav-list">
        <li className={location.pathname === '/dashboard' ? 'active' : ''}>
          <Link to="/dashboard"><FaHome /> Dashboard</Link>
        </li>
        <li className={location.pathname === '/new-estimation' ? 'active' : ''}>
          <Link to="/new-estimation"><FaPlus /> New Estimation</Link>
        </li>
        <li className={location.pathname === '/projects' ? 'active' : ''}>
          <Link to="/projects"><FaProjectDiagram /> Projects</Link>
        </li>
        <li className={location.pathname === '/pricing' ? 'active' : ''}>
          <Link to="/pricing"><FaDollarSign /> Pricing Management</Link>
        </li>
        <li className={location.pathname === '/profile' ? 'active' : ''}>
          <Link to="/profile"><FaUser /> Account Profile</Link>
        </li>
      </ul>

      {/* Pinned at bottom */}
      <div className="sb-logout">
        <button className="sb-logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default Sidebar;
