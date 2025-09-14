import React, { useState } from 'react';
import axios from 'axios';
import '../styles/AuthFlow.css';

const KeyIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="currentColor" d="M14 3a5 5 0 00-4.58 7.03L2 17.44V21h3.56l1.9-1.9h2.24V16.9h2.2v-2.2h1.9A5 5 0 0014 3zm0 3a2 2 0 110 4 2 2 0 010-4z"/>
  </svg>
);

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const email = typeof window !== 'undefined' ? localStorage.getItem('resetEmail') : '';

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post('http://localhost:5000/api/auth/verify-otp', { email, otp });
      alert('OTP verified');
      window.location.href = '/resetPassword';
    } catch (err) {
      alert('Invalid OTP');
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
            <h1>Verify the code</h1>
            <p className="muted">Enter the 6-digit OTP sent to <strong>{email || 'your email'}</strong>.</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleVerify}>
          <label className="auth-field">
            <span className="auth-label">One-Time Password</span>
            <div className="auth-input-wrap">
              <span className="auth-icon"><KeyIcon /></span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter 6-digit code"
                required
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
          </label>

          <button type="submit" className="auth-btn primary" disabled={loading}>
            {loading ? 'Verifying…' : 'Verify'}
          </button>

          <p className="auth-small">
            Didn’t get a code? <a className="auth-link" href="/forgotPassword">Request a new OTP</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;
