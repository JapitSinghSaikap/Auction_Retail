import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AuctionDetail from './pages/AuctionDetail';
import SellerDashboard from './pages/SellerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import ProtectedRoute from './components/ProtectedRoute';

/* Routes that have their own full-page shell — hide the global Navbar */
const DASHBOARD_ROUTES = ['/seller-dashboard', '/buyer-dashboard'];

export default function App() {
  const { pathname } = useLocation();
  const isDashboard = DASHBOARD_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <div className="min-h-screen bg-base">
      {!isDashboard && <Navbar />}

      <Routes>
        <Route path="/"             element={<Home />} />
        <Route path="/login"        element={<Login />} />
        <Route path="/register"     element={<Register />} />
        <Route path="/auction/:id"  element={<AuctionDetail />} />

        <Route
          path="/seller-dashboard"
          element={
            <ProtectedRoute allowedRole="seller">
              <SellerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer-dashboard"
          element={
            <ProtectedRoute allowedRole="buyer">
              <BuyerDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
