import React from 'react';
import { useUser } from '../context/UserContext';
import '../styles/GlobalAvatar.css';

export default function GlobalAvatar({ onClick }) {
  const { profilePicUrl } = useUser();
  const src = profilePicUrl || '/profile-avatar.png'; // fallback image in /public
  return (
    <button className="global-avatar" onClick={onClick} aria-label="Open profile">
      <img src={src} alt="Profile" />
    </button>
  );
}
