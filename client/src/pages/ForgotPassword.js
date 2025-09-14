import React, { useState } from 'react';
import axios from 'axios';
import '../styles/AuthFlow.css';

const MailIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="currentColor" d="M4 4h16a2 2 0 012 2v12a2 2 0 
    01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 4l8 5 8-5"/>
  </svg>
);

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      alert('OTP sent to your email');
      localStorage.setItem('resetEmail', email);
      window.location.href = '/verifyOTP';
    } catch (err) {
      alert('Error sending OTP');
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
            <h1>Forgot your password?</h1>
            <p className="muted">We’ll email a 6-digit code to reset it.</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSendOTP}>
          <label className="auth-field">
            <span className="auth-label">Email</span>
            <div className="auth-input-wrap">
              <span className="auth-icon"><MailIcon /></span>
              <input
                type="email"
                placeholder="you@example.com"
                required
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </label>

          <button type="submit" className="auth-btn primary" disabled={loading}>
            {loading ? 'Sending…' : 'Send OTP'}
          </button>

          <p className="auth-small">
            Remembered it? <a className="auth-link" href="/">Back to sign in</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
