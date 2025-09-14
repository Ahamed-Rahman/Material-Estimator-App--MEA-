import React, { useState } from 'react';
import '../styles/Login.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import SuccessModal from '../components/SuccessModal';  // ✅ import modal


const MailIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="currentColor" d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 
    2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
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

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
    const [success, setSuccess] = useState(false); // ✅ modal state
     const [modal, setModal] = useState({ show: false, message: "", type: "success" }); // ✅ unified state

     const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

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
        message: err.response?.data?.error || "Invalid username or password ❌",
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
      <div className="auth-login-art" aria-hidden="true">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
      </div>

      <div className="auth-login-card">
        <div className="auth-brand">
          <div className="auth-logo">ME</div>
          <div>
            <h1>Welcome back</h1>
            <p className="muted">Sign in to continue to your estimator dashboard</p>
          </div>
        </div>

        

        <form className="auth-form" onSubmit={handleLogin}>
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

          <label className="auth-field">
            <span className="auth-label">Password</span>
            <div className="auth-input-wrap">
              <span className="auth-icon"><LockIcon /></span>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Your password"
                required
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="auth-eye" onClick={() => setShowPw(s => !s)} aria-label="Toggle password visibility">
                <EyeIcon off={!showPw} />
              </button>
            </div>

           
          </label>

          <div className="auth-row">
            <a className="auth-link" href="/forgotPassword">Forgot password?</a>
          </div>

          <button type="submit" className="auth-btn primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="auth-divider"><span>or</span></div>

          <p className="auth-small">
            Don’t have an account? <a className="auth-link" href="/signup">Create one</a>
          </p>
        </form>
      </div>
      
{/* ✅ Place modal at the end of the page, not inside form */}
 {/* ✅ Popup modal for both success & error */}
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

export default Login;
