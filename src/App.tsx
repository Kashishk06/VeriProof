import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './components/ui/Toast';
import SplashCursor from './components/ui/SplashCursor';

// Layout
import AppLayout from './components/layout/AppLayout';

// Pages
import LandingPage from './pages/Landing';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import SuperAdminDashboard from './pages/SuperAdmin';
import IssuerDashboard from './pages/Issuer';
import VerifierDashboard from './pages/Verifier';
import PublicVerificationPage from './pages/PublicVerification';
import ForgeryLabPage from './pages/ForgeryLab';
import HumanReviewPage from './pages/HumanReview';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <ToastProvider>
            <SplashCursor />
            <Routes>
              {/* Existing Landing Page (100% Intact & Untouched) */}
              <Route path="/" element={<LandingPage />} />

              {/* Public Application Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/verify" element={<PublicVerificationPage />} />
              <Route path="/verify/:id" element={<PublicVerificationPage />} />
              <Route path="/public-verification" element={<PublicVerificationPage />} />
              <Route path="/public-verification/:verificationId" element={<PublicVerificationPage />} />
              <Route path="/documents/:id" element={<PublicVerificationPage />} />

              {/* Authenticated Role-based Application Workspace */}
              <Route element={<AppLayout />}>
                {/* Admin Routes */}
                <Route path="/admin" element={<SuperAdminDashboard />} />
                <Route path="/admin/*" element={<SuperAdminDashboard />} />
                <Route path="/super-admin" element={<Navigate to="/admin" replace />} />
                <Route path="/super-admin/*" element={<Navigate to="/admin" replace />} />

                {/* Issuer Routes */}
                <Route path="/issuer" element={<IssuerDashboard />} />
                <Route path="/issuer/*" element={<IssuerDashboard />} />

                {/* Verifier & Viewer Routes */}
                <Route path="/verifier" element={<VerifierDashboard />} />
                <Route path="/verifier/*" element={<VerifierDashboard />} />
                <Route path="/viewer" element={<Navigate to="/verifier" replace />} />
                <Route path="/viewer/*" element={<Navigate to="/verifier" replace />} />

                {/* Specialized Labs & Operations */}
                <Route path="/forgery-lab" element={<ForgeryLabPage />} />
                <Route path="/human-review" element={<HumanReviewPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
