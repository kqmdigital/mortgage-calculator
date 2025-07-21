import React from 'react';
import { AuthProvider } from './contexts/EnhancedAuthContext';
import AuthenticatedApp from './AuthenticatedApp';
import LoginPage from './components/LoginPage';
import { useAuth } from './contexts/EnhancedAuthContext';
import { initializeMonitoring } from './utils/monitoring';
import './App.css';

// Initialize monitoring on app start
initializeMonitoring();

// Main App Wrapper Component
const AppWrapper = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="standard-card text-center">
          <div className="loading-spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing application...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <AuthenticatedApp /> : <LoginPage />;
};

// Root App Component
const LoginApp = () => {
  return (
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  );
};

export default LoginApp;
