import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Landing.css';

const SparkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 2l1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2z"/>
  </svg>
);
const BoltIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M11 21h-1l1-7H7l6-11h1l-1 7h4l-6 11z"/>
  </svg>
);
const GridIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M10 3H3v7h7V3zm11 0h-7v7h7V3zM10 14H3v7h7v-7zm11 0h-7v7h7v-7z"/>
  </svg>
);
const WalletIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M21 7H3a2 2 0 00-2 2v7a2 2 0 002 2h18a2 2 0 002-2v-7a2 2 0 00-2-2zm-3 7a2 2 0 110-4 2 2 0 010 4z"/>
  </svg>
);

export default function Landing() {
  return (
    <div className="landing-page">
      <div className="lp-art" aria-hidden="true">
        <div className="lp-blob b1" />
        <div className="lp-blob b2" />
        <div className="lp-blob b3" />
      </div>

      <header className="lp-header">
        <div className="lp-logo">ME</div>
        <nav className="lp-nav">
          <Link to="/login" className="lp-link">Sign in</Link>
          <Link to="/signup" className="lp-btn small">Get started</Link>
        </nav>
      </header>

      <main className="lp-hero">
        <div className="lp-hero-text">
          <h1>Estimate ceiling & tile materials in seconds</h1>
          <p className="lp-sub">
            Material Estimator (MEA) helps shop owners create accurate material lists,
            visualize layouts, and calculate costs—fast.
          </p>
          <div className="lp-cta">
            <Link to="/signup" className="lp-btn">Create an account</Link>
            <Link to="/login" className="lp-btn ghost">I already have an account</Link>
          </div>
          <div className="lp-note">
            <SparkIcon /> No credit card required • Try it with sample data
          </div>
        </div>

        <div className="lp-hero-card">
          <div className="lp-card-title">
            <BoltIcon /> Why MEA?
          </div>
          <ul className="lp-list">
            <li><GridIcon /> 2D layout preview that matches your inputs</li>
            <li><WalletIcon /> Live cost calculation with your unit prices</li>
            <li><SparkIcon /> Save projects and export reports</li>
          </ul>
        </div>
      </main>

      <footer className="lp-footer">
        <span>© {new Date().getFullYear()} Material Estimator (MEA)</span>
        <div className="lp-footer-links">
          <a href="#" onClick={(e)=>e.preventDefault()}>Docs</a>
          <a href="#" onClick={(e)=>e.preventDefault()}>Privacy</a>
          <a href="#" onClick={(e)=>e.preventDefault()}>Contact</a>
        </div>
      </footer>
    </div>
  );
}
