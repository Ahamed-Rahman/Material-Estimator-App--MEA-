import React, { useState } from "react";
import '../styles/Signup.css';
import { useNavigate } from "react-router-dom";
import SuccessModal from "../components/SuccessModal";
import axios from "axios";

/* ================= ICONS ================= */

const ShopIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path fill="currentColor" d="M4 4h16l-1 6H5L4 4zm2 8h12v8H6v-8zm2 2v4h8v-4H8z"/>
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path fill="currentColor" d="M12 12a5 5 0 100-10 5 5 0 000 10zm-9 9a9 9 0 0118 0H3z"/>
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path fill="currentColor" d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 4l8 5 8-5"/>
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path fill="currentColor" d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm-3 8V7a3 3 0 116 0v3H9z"/>
  </svg>
);

const EyeIcon = ({ off }) => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    {off ? (
      <path fill="currentColor" d="M2 4.27L3.28 3 21 20.72 19.73 22l-2.29-2.29A10.8 10.8 0 0112 20C6 20 2 12 2 12a18.6 18.6 0 013.86-4.93L2 4.27z"/>
    ) : (
      <path fill="currentColor" d="M12 6c6 0 10 8 10 8s-4 8-10 8S2 14 2 14 6 6 12 6zm0 4a4 4 0 100 8 4 4 0 000-8z"/>
    )}
  </svg>
);

/* ================= COMPONENT ================= */

const Signup = () => {
  const [formData, setFormData] = useState({
    shopName: "",
    ownerName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, message: "", type: "success" });

  const navigate = useNavigate();

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setModal({ show: true, message: "Passwords don't match ❌", type: "error" });
      return;
    }

    try {
      setLoading(true);

      // ✅ USE ENV VARIABLE (VERY IMPORTANT)
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/signup`,
        formData
      );

      setModal({
        show: true,
        message: "Account created successfully 🎉",
        type: "success",
      });

      setTimeout(() => {
        setModal({ show: false, message: "", type: "success" });
        navigate("/login");
      }, 2000);

    } catch (err) {
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

  /* ================= UI ================= */

  return (
    <div className="auth-signup-page">
      <div className="auth-signup-card">

        <h1>Create your account</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input name="shopName" placeholder="Shop Name" onChange={handleChange} required />
          <input name="ownerName" placeholder="Owner Name" onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email" onChange={handleChange} required />

          <input
            name="password"
            type={showPw ? "text" : "password"}
            placeholder="Password"
            onChange={handleChange}
            required
          />

          <input
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm Password"
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Sign up"}
          </button>
        </form>
      </div>

      {modal.show && (
        <SuccessModal
          isOpen={modal.show}
          message={modal.message}
          type={modal.type}
          onClose={() => setModal({ ...modal, show: false })}
        />
      )}
    </div>
  );
};

export default Signup;
