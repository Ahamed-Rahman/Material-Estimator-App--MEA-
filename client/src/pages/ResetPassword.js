import React, { useState } from 'react';
import axios from 'axios';
import '../styles/AuthFlow.css';

const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="currentColor" d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 
    0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm-3 8V7a3 3 
    0 116 0v3H9z"/>
  </svg>
);
const EyeIcon = ({ off }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    {off ? (
      <path fill="currentColor" d="M2 4.27L3.28 3 21 20.72 19.73 22l-2.29-2.29A10.8 10.8 0 0112 20C6 20 2 12 2 12a18.6 18.6 0 013.86-4.93L2 4.27zM12 6c6 0 10 8 10 8a18.5 18.5 0 01-4.06 5.15l-1.47-1.47A8.7 8.7 0 0020 14s-3-6-8-6c-.77 0-1.5.14-2.2.39L7.31 5.9A10.6 10.6 0 0112 6z"/>
    ) : (
      <path fill="currentColor" d="M12 6c6 0 10 8 10 8s-4 8-10 8S2 14 2 14 6 6 12 6zm0 4a4 4 0 100 8 4 4 0 000-8z"/>
    )}
  </svg>
);

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    const email = localStorage.getItem('resetEmail');
    if (newPassword !== confirmPassword) return alert('Passwords do not match');

    try {
      setLoading(true);
      await axios.post('http://localhost:5000/api/auth/reset-password', { email, newPassword });
      alert('Password reset successful');
      localStorage.removeItem('resetEmail');
      window.location.href = '/';
    } catch (err) {
      alert('Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authx-page">
      <div className="authx-art" aria-hidden="true">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
      </div>

      <div className="authx-card">
        <div className="auth-brand">
          <div className="auth-logo">ME</div>
          <div>
            <h1>Set a new password</h1>
            <p className="muted">Create a strong password you don’t use elsewhere.</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleReset}>
          <label className="auth-field">
            <span className="auth-label">New password</span>
            <div className="auth-input-wrap">
              <span className="auth-icon"><LockIcon /></span>
              <input
                type={showNew ? 'text' : 'password'}
                placeholder="At least 8 characters"
                required
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button type="button" className="auth-eye" onClick={() => setShowNew(s => !s)} aria-label="Toggle password visibility">
                <EyeIcon off={!showNew} />
              </button>
            </div>
          </label>

          <label className="auth-field">
            <span className="auth-label">Confirm password</span>
            <div className="auth-input-wrap">
              <span className="auth-icon"><LockIcon /></span>
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-type new password"
                required
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button type="button" className="auth-eye" onClick={() => setShowConfirm(s => !s)} aria-label="Toggle password visibility">
                <EyeIcon off={!showConfirm} />
              </button>
            </div>
          </label>

          <button type="submit" className="auth-btn primary" disabled={loading}>
            {loading ? 'Resetting…' : 'Reset password'}
          </button>

          <p className="auth-small">
            Know your password? <a className="auth-link" href="/">Back to sign in</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
