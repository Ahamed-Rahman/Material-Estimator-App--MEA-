// src/App.js
import React from 'react';
import {
  BrowserRouter as Router,
  Routes, Route, Navigate, Outlet,
  useNavigate, useLocation
} from 'react-router-dom';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import NewEstimation from './pages/NewEstimation';
import Profile from './pages/Profile';
import TileEstimation from './pages/TileEstimation';
import TileEstimationResult from './pages/TileEstimationResult';
import Projects from './pages/Projects';
import CeilingEstimation from './pages/CeilingEstimation';
import CeilingEstimationResult from './pages/CeilingEstimationResult';
import PriceConfig from './pages/priceConfig';
import PricingManagement from './pages/PricingManagement';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import ResetPassword from './pages/ResetPassword';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { UserProvider } from './context/UserContext';
import GlobalAvatar from './components/GlobalAvatar';

/* Guards */
function PrivateRoute() {
  const token = localStorage.getItem('token');
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}
function PublicOnlyRoute() {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

/* Avatar hidden on public/auth pages */
function AvatarWithNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const hideOn = ['/', '/login', '/signup', '/forgotPassword', '/verifyOTP', '/resetPassword'];
  if (hideOn.includes(pathname)) return null;
  return <GlobalAvatar onClick={() => navigate('/profile')} />;
}

export default function App() {
  return (
    <UserProvider>
      <Router>
        <AvatarWithNav />

        <Routes>
          {/* Public-only routes */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgotPassword" element={<ForgotPassword />} />
            <Route path="/verifyOTP" element={<VerifyOTP />} />
            <Route path="/resetPassword" element={<ResetPassword />} />
          </Route>

          {/* Private routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new-estimation" element={<NewEstimation />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/tile-estimation" element={<TileEstimation />} />
            <Route path="/tile-estimation-result" element={<TileEstimationResult />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/ceiling-estimation" element={<CeilingEstimation />} />
            <Route path="/ceiling-result" element={<CeilingEstimationResult />} />
            <Route path="/priceConfig" element={<PriceConfig />} />
            <Route path="/pricing" element={<PricingManagement />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* ✅ Toast container must be outside Routes */}
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </UserProvider>
  );
}
