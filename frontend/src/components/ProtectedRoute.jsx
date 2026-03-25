import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRole }) {
  const { isLoggedIn, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base">
        <div className="w-9 h-9 border-[3px] border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (allowedRole && user?.role !== allowedRole) return <Navigate to="/" replace />;

  return children;
}
