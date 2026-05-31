import React, { useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Discover from './pages/Discover';
import ReelsFeed from './pages/ReelsFeed';
import RestaurantDetail from './pages/RestaurantDetail';
import Checkout from './pages/Checkout';
import PaymentGateway from './pages/PaymentGateway';
import MerchantDashboard from './pages/MerchantDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import UserProfile from './pages/UserProfile';
import BecomePartner from './pages/BecomePartner';
import { AuthContext } from './context/AuthContext';
import { ChefMoodProvider } from './components/ChefSystem/ChefMoodEngine';
import CinematicLoader from './components/CinematicLoader';

// Protected Route Component for Role-Based Access Controls
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex-center min-h-[80vh]">
        <div className="text-[15px] text-text-muted">Synchronizing security handshake...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// ScrollToTop resets viewport scroll positions on SPA navigation
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  const [appLoading, setAppLoading] = useState(true);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <ChefMoodProvider>
        <AnimatePresence mode="wait">
          {appLoading && (
            <CinematicLoader onComplete={() => setAppLoading(false)} />
          )}
        </AnimatePresence>

        <div 
          className="flex flex-col min-h-screen bg-background-primary text-text-primary [transition:background_var(--transition-smooth),_color_var(--transition-smooth)]"
        >
          {/* Persistent Premium Navbar */}
          <Navbar />

          {/* Core Main SPA Screens */}
          <main className="flex-1 pt-[192px] md:pt-[208px]">
          <Routes>
            {/* Public Screens */}
            <Route path="/" element={<Home />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/reels" element={<ReelsFeed />} />
            <Route path="/restaurant/:id" element={<RestaurantDetail />} />
            
            {/* Session Screens */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Client Screens */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute allowedRoles={['customer', 'restaurant', 'admin']}>
                  <UserProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/partner" 
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <BecomePartner />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/checkout" 
              element={
                <ProtectedRoute allowedRoles={['customer', 'restaurant', 'admin']}>
                  <Checkout />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payment-gateway" 
              element={
                <ProtectedRoute allowedRoles={['customer', 'restaurant', 'admin']}>
                  <PaymentGateway />
                </ProtectedRoute>
              } 
            />

            {/* Protected Merchant SaaS Screen */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['restaurant', 'admin']}>
                  <MerchantDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Protected Admin Control Center Screen */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Fallback Catch-all Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </main>

          {/* Global Premium Footer */}
          <Footer />
        </div>
      </ChefMoodProvider>
    </BrowserRouter>
  );
}
