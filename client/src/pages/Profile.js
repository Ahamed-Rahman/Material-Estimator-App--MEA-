import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import '../styles/Profile.css';

const API = 'http://localhost:5000';

/* ───────────────── Password strength helper ───────────────── */
function evaluatePassword(pw) {
  const suggestions = [];
  let score = 0;

  if (!pw) return { score: 0, label: 'Very weak', color: '#ef4444', suggestions: ['Start typing a password'] };

  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasNumber = /\d/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);
  const length = pw.length;

  if (length >= 8) score += 1;
  if (length >= 12) score += 1;
  if ((hasLower && hasUpper) || (hasUpper && (hasNumber || hasSymbol))) score += 1;
  if (hasNumber && hasSymbol) score += 1;
  if (score > 4) score = 4;

  if (length < 12) suggestions.push('Use at least 12 characters');
  if (!(hasLower && hasUpper)) suggestions.push('Mix UPPER and lower case');
  if (!hasNumber) suggestions.push('Add a number');
  if (!hasSymbol) suggestions.push('Add a special character');

  const labels = ['Very weak', 'Weak', 'Okay', 'Strong', 'Very strong'];
  const colors = ['#ef4444', '#f59e0b', '#eab308', '#10b981', '#16a34a'];

  return { score, label: labels[score], color: colors[score], suggestions };
}

/* ───────────────── Small inline icons ───────────────── */
const CameraIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M9 3l2 2h4a2 2 0 012 2v1h1a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2h1V7a2 2 0 012-2h1zm3 5a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6z"/>
  </svg>
);
const EyeIcon = ({ off }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    {off ? (
      <path fill="currentColor" d="M2 4.27L3.28 3 21 20.72 19.73 22l-2.3-2.3A10.8 10.8 0 0112 20C6 20 2 12 2 12a18.7 18.7 0 013.84-4.91L2 4.27zM12 6c6 0 10 8 10 8a18.7 18.7 0 01-4.05 5.13l-1.47-1.47A8.7 8.7 0 0020 14s-3-6-8-6c-.77 0-1.5.14-2.2.38L7.3 5.88A10.6 10.6 0 0112 6z"/>
    ) : (
      <path fill="currentColor" d="M12 6c6 0 10 8 10 8s-4 8-10 8S2 14 2 14 6 6 12 6zm0 4a4 4 0 100 8 4 4 0 000-8z"/>
    )}
  </svg>
);

/* ───────────────── Component ───────────────── */
const Profile = () => {
  const [profile, setProfile] = useState({
    ownerName: '',
    email: '',
    shopName: '',
    profilePicUrl: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNew, setShowNew]       = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(
          'http://localhost:5000/api/shop-owner/profile',
          { headers: { Authorization: localStorage.getItem('token') } }
        );
        setProfile({
          ownerName: data.ownerName || '',
          email:     data.email || '',
          shopName:  data.shopName || '',
          profilePicUrl: data.profilePicUrl || ''
        });
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const safeProfileSrc = () => {
    if (!profile.profilePicUrl) return '/profile-avatar.png';
    const url = profile.profilePicUrl;
    return /^(blob:|data:|https?:)/.test(url) ? url : `${API}${url}`;
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setProfile(prev => ({ ...prev, profilePicUrl: URL.createObjectURL(file) }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('ownerName', profile.ownerName);
      formData.append('shopName',  profile.shopName);
      if (selectedFile) formData.append('profilePic', selectedFile);

      const { data } = await axios.put(
        'http://localhost:5000/api/shop-owner/update-profile',
        formData,
        { headers: { Authorization: localStorage.getItem('token') } }
      );

      setSelectedFile(null);
      setProfile(prev => ({
        ...prev,
        ownerName: data.ownerName,
        shopName: data.shopName,
        profilePicUrl: data.profilePicUrl || prev.profilePicUrl
      }));
      setToast({ type: 'success', msg: 'Profile updated successfully' });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', msg: 'Failed to update profile' });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 2000);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setToast({ type: 'error', msg: "Passwords don't match" });
      setTimeout(() => setToast(null), 2000);
      return;
    }
    setChangingPw(true);
    try {
      await axios.put(
        'http://localhost:5000/api/shop-owner/change-password',
        { currentPassword, newPassword },
        { headers: { Authorization: localStorage.getItem('token') } }
      );
      setToast({ type: 'success', msg: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setToast({ type: 'error', msg: err.response?.data?.error || 'Failed to change password' });
    } finally {
      setChangingPw(false);
      setTimeout(() => setToast(null), 2200);
    }
  };

  const strength = evaluatePassword(newPassword);

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="profile-page">
        <header className="pp-header">
          <div>
            <h1>Account Settings</h1>
            <p>Manage your profile details. These appear on invoices and saved reports.</p>
          </div>
        </header>

        <div className="pp-grid">
          {/* Profile Card */}
          <section className="cardss">
            <h2 className="cardss-title">Profile</h2>
            <p className="cardss-sub">Keep your information up to date so your documents look professional.</p>

            <div className="avatar-row">
              <div className="avatar-wrap">
                <img src={safeProfileSrc()} alt="Profile" />
                <button
                  type="button"
                  className="avatar-btn"
                  onClick={() => fileInputRef.current.click()}
                >
                  <CameraIcon /> Change photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
              <div className="avatar-hint">
                <strong>Tip:</strong> Use a clear, square image (min 256×256) for best results.
              </div>
            </div>

            <div className="form-grid">
              <label className="field">
                <span>Owner name</span>
                <input
                  type="text"
                  value={profile.ownerName}
                  onChange={(e) => setProfile({ ...profile, ownerName: e.target.value })}
                  placeholder="Your full name"
                />
              </label>

              <label className="field">
                <span>Email (read-only)</span>
                <input type="email" value={profile.email} disabled />
              </label>

              <label className="field">
                <span>Shop name</span>
                <input
                  type="text"
                  value={profile.shopName}
                  onChange={(e) => setProfile({ ...profile, shopName: e.target.value })}
                  placeholder="Your business / shop name"
                />
              </label>
            </div>

            <div className="actions">
              <button
                className="btn primary"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </section>

          {/* Password Card */}
          <section className="cardss">
            <h2 className="cardss-title">Change Password</h2>
            <p className="cardss-sub">Use a strong, unique password to keep your account secure.</p>

            <div className="form-grid">
              <label className="field">
                <span>Current password</span>
                <div className="password-box">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <button type="button" className="eye" onClick={() => setShowCurrent(s => !s)} aria-label="Toggle visibility">
                    <EyeIcon off={!showCurrent} />
                  </button>
                </div>
              </label>

              <label className="field">
                <span>New password</span>
                <div className="password-box">
                  <input
                    type={showNew ? 'text' : 'password'}
                    placeholder="At least 12 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button type="button" className="eye" onClick={() => setShowNew(s => !s)} aria-label="Toggle visibility">
                    <EyeIcon off={!showNew} />
                  </button>
                </div>

                {/* Strength meter */}
                <div className="meter">
                  <div
                    className="meter-fill"
                    style={{ width: `${(strength.score / 4) * 100}%`, background: strength.color }}
                  />
                </div>
                <div className="meter-label" style={{ color: strength.color }}>
                  {strength.label}
                </div>
               
              </label>

              <label className="field">
                <span>Confirm new password</span>
                <div className="password-box">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-type new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button type="button" className="eye" onClick={() => setShowConfirm(s => !s)} aria-label="Toggle visibility">
                    <EyeIcon off={!showConfirm} />
                  </button>
                </div>
              </label>
            </div>

            <div className="actions">
              <button
                className="btn accent"
                onClick={handleChangePassword}
                disabled={changingPw || !newPassword}
              >
                {changingPw ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Tiny toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default Profile;
