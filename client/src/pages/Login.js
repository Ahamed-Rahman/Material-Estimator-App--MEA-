import React, { useState } from 'react';
import '../styles/Login.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import SuccessModal from '../components/SuccessModal';

// ✅ API base URL from Vercel environment variable
const API_URL = process.env.REACT_APP_API_URL;

const MailIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path fill="currentColor" d="M20 4H4a2 2 0 00-2 2v12a2 2 0 
    002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path fill="currentColor" d="M12 2a5 5 0 00-5 5v3H6a2 2 
    0 00-2 2v8a2 2 0 002 2h12a2 2 
    0 002-2v-8a2 2 0 00-2-2h-1V7a5 5 0 00-5-5z"/>
  </svg>
);

const EyeIcon = ({ off }) => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    {off ? (
      <path fill="currentColor" d="M2 4.27L3.28 3 21 
      20.72 19.73 22l-2.29-2.29A10.8 
      10.8 0 0112 20C6 20 2 12 
      2 12a18.6 18.6 0 013.86-4.93z"/>
    ) : (
      <path fill="currentColor" d="M12 6c6 0 10 8 
      10 8s-4 8-10 8S2 14 2 
      14 6 6 12 6zm0 4a4 
      4 0 100 8 4 4 0 000-8z"/>
    )}
  </svg>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, message: "", type: "success" });

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await axios.post(
        `${API_URL}/api/auth/login`,
        { email, password }
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user._id);

      setModal({ show: true, message: "Login successful 🎉", type: "success" });

      setTimeout(() => {
        setModal({ show: false, message: "", type: "success" });
        navigate("/dashboard");
      }, 2000);

    } catch (err) {
      setModal({
        show: true,
        message: err.response?.data?.error || "Invalid email or password ❌",
        type: "error",
      });

      setTimeout(() => {
        setModal({ show: false, message: "", type: "error" });
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-login-page">
      <div className="auth-login-card">
        <div className="auth-brand">
          <div className="auth-logo">ME</div>
          <div>
            <h1>Welcome back</h1>
            <p className="muted">Sign in to your dashboard</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleLogin}>
          <label className="auth-field">
            <span>Email</span>
            <div className="auth-input-wrap">
              <MailIcon />
              <input
                type="email"
                required
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </label>

          <label className="auth-field">
            <span>Password</span>
            <div className="auth-input-wrap">
              <LockIcon />
              <input
                type={showPw ? "text" : "password"}
                required
                placeholder="Your password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}>
                <EyeIcon off={!showPw} />
              </button>
            </div>
          </label>

          <button className="auth-btn primary" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="auth-small">
            Don’t have an account? <a href="/signup">Create one</a>
          </p>
        </form>
      </div>

      {/* ✅ Success / Error modal */}
      {modal.show && (
        <SuccessModal
          message={modal.message}
          type={modal.type}
          isOpen={modal.show}
          onClose={() => setModal({ ...modal, show: false })}
        />
      )}
    </div>
  );
};

export default Login;
