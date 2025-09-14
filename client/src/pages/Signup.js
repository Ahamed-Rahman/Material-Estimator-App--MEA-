import React, { useState } from 'react';
import '../styles/Signup.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import SuccessModal from "../components/SuccessModal"; // ✅ add this


const ShopIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="currentColor" d="M4 4h16l-1 6H5L4 4zm2 8h12v8H6v-8zm2 2v4h8v-4H8z"/>
  </svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="currentColor" d="M12 12a5 5 0 100-10 5 5 0 000 10zm-9 9a9 9 0 
    0118 0H3z"/>
  </svg>
);
const MailIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="currentColor" d="M4 4h16a2 2 0 012 2v12a2 2 0 
    01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 4l8 5 8-5"/>
  </svg>
);
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

const Signup = () => {
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, message: "", type: "success" });


  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (formData.password !== formData.confirmPassword) {
    setModal({ show: true, message: "Passwords don't match ❌", type: "error" });
    return;
  }
  try {
    setLoading(true);
    await axios.post("http://localhost:5000/api/auth/signup", formData);

    // ✅ success popup
    setModal({ show: true, message: "Account created successfully 🎉", type: "success" });

    setTimeout(() => {
      setModal({ show: false, message: "", type: "success" });
      navigate("/login");
    }, 2000);
  } catch (err) {
    // ❌ error popup
    setModal({
      show: true,
      message: err.response?.data?.error || "Signup failed ❌",
      type: "error",
    });
  } finally {
    setLoading(false);
  }
};

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="auth-signup-page">
      <div className="auth-signup-art" aria-hidden="true">
        <div className="sblob s1" />
        <div className="sblob s2" />
        <div className="sblob s3" />
      </div>

      <div className="auth-signup-card">
        <div className="auth-brand">
          <div className="auth-logo">ME</div>
          <div>
            <h1>Create your account</h1>
            <p className="muted">Get started with Material Estimator in minutes</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span className="auth-label">Shop Name</span>
            <div className="auth-input-wrap">
              <span className="auth-icon"><ShopIcon /></span>
              <input
                className="S"
                name="shopName"
                type="text"
                placeholder="Your shop/business"
                onChange={handleChange}
                required
              />
            </div>
          </label>

          <label className="auth-field">
            <span className="auth-label">Owner Name</span>
            <div className="auth-input-wrap">
              <span className="auth-icon"><UserIcon /></span>
              <input
                className="S"
                name="ownerName"
                type="text"
                placeholder="Your full name"
                onChange={handleChange}
                required
              />
            </div>
          </label>

          <label className="auth-field">
            <span className="auth-label">Email</span>
            <div className="auth-input-wrap">
              <span className="auth-icon"><MailIcon /></span>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                onChange={handleChange}
                required
              />
            </div>
          </label>

          <label className="auth-field">
            <span className="auth-label">Password</span>
            <div className="auth-input-wrap">
              <span className="auth-icon"><LockIcon /></span>
              <input
                name="password"
                type={showPw ? 'text' : 'password'}
                placeholder="At least 8 characters"
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPw(s => !s)}
                aria-label="Toggle password visibility">
                <EyeIcon off={!showPw} />
              </button>
            </div>
          </label>

          <label className="auth-field">
            <span className="auth-label">Confirm Password</span>
            <div className="auth-input-wrap">
              <span className="auth-icon"><LockIcon /></span>
              <input
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-type password"
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowConfirm(s => !s)}
                aria-label="Toggle password visibility">
                <EyeIcon off={!showConfirm} />
              </button>
            </div>
          </label>

          <button type="submit" className="auth-btn primary" disabled={loading}>
            {loading ? 'Creating account…' : 'Sign up'}
          </button>

          <p className="auth-small">
            Already have an account? <a className="auth-link" href="/login">Sign in</a>
          </p>
        </form>
      </div>
      {modal.show && (
  <SuccessModal
    message={modal.message}
    onClose={() => setModal({ ...modal, show: false })}
    isOpen={modal.show}
    type={modal.type}
  />
)}

    </div>
  );
};

export default Signup;
