import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000';
const Ctx = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem('token') || '';
    const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
    if (!token) return;

    axios.get(`${API}/api/shop-owner/profile`, {
      headers: { Authorization: token }
    }).then(({ data }) => {
      setUser({ ownerName: data.ownerName, email: data.email, shopName: data.shopName });
      setProfilePicUrl(data.profilePicUrl || null);
    }).catch(() => {});
  }, []);

  return (
    <Ctx.Provider value={{ user, setUser, profilePicUrl, setProfilePicUrl }}>
      {children}
    </Ctx.Provider>
  );
}
export const useUser = () => useContext(Ctx);
