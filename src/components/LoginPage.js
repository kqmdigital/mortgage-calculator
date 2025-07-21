import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, LogIn, KeyRound, Mail, User, ArrowLeft, CheckCircle, XCircle, AlertTriangle, RefreshCw, Settings } from 'lucide-react';
import { useAuth } from '../contexts/EnhancedAuthContext';
import { validatePassword, validateEmail } from '../utils/auth';
import { AuthService } from '../utils/supabase';

const LoginPage = () => {
  const { login, error, isLoading, rateLimitInfo, clearError } = useAuth();
  
  const [activeView, setActiveView] = useState('login'); // 'login', 'reset', 'change'
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  
  // Password reset form state
  const [resetForm, setResetForm] = useState({
    email: '',
    message: '',
    isSuccess: false,
    isLoading: false
  });
  
  // Change password form state
  const [changePasswordForm, setChangePasswordForm] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    message: '',
    isSuccess: false,
    isLoading: false
  });

  // Clear errors when switching views
  useEffect(() => {
    clearError();
    setResetForm(prev => ({ ...prev, message: '', isSuccess: false }));
    setChangePasswordForm(prev => ({ ...prev, message: '', isSuccess: false }));
  }, [activeView, clearError]);

  // Handle login form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    clearError();

    if (!loginForm.email || !loginForm.password) {
      return;
    }

    const result = await login(loginForm.email, loginForm.password);
    
    if (result.success) {
      // Login successful - redirect handled by parent component
    }
  };

  // Handle password reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (!resetForm.email) {
      setResetForm(prev => ({ 
        ...prev, 
        message: 'Please enter your email address.',
        isSuccess: false 
      }));
      return;
    }

    if (!validateEmail(resetForm.email)) {
      setResetForm(prev => ({ 
        ...prev, 
        message: 'Please enter a valid email address.',
        isSuccess: false 
      }));
      return;
    }

    setResetForm(prev => ({ ...prev, isLoading: true, message: '' }));

    try {
      // Check if user exists
      const users = await AuthService.listUsers('super_admin'); // This might need adjustment based on permissions
      const userExists = users.some(user => user.email.toLowerCase() === resetForm.email.toLowerCase());
      
      if (!userExists) {
        setResetForm(prev => ({
          ...prev,
          isLoading: false,
          message: 'If an account with this email exists, password reset instructions have been sent.',
          isSuccess: true
        }));
        return;
      }

      // Since we don't have email service integrated, show manual reset instructions
      setResetForm(prev => ({
        ...prev,
        isLoading: false,
        message: 'Password reset request received. Please contact your system administrator at kenneth@keyquestmortgage.com.sg for password reset assistance.',
        isSuccess: true
      }));

    } catch (error) {
      setResetForm(prev => ({
        ...prev,
        isLoading: false,
        message: 'Password reset service is currently unavailable. Please contact support.',
        isSuccess: false
      }));
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    const { email, currentPassword, newPassword, confirmPassword } = changePasswordForm;

    if (!email || !currentPassword || !newPassword || !confirmPassword) {
      setChangePasswordForm(prev => ({ 
        ...prev, 
        message: 'Please fill in all fields.',
        isSuccess: false 
      }));
      return;
    }

    if (!validateEmail(email)) {
      setChangePasswordForm(prev => ({ 
        ...prev, 
        message: 'Please enter a valid email address.',
        isSuccess: false 
      }));
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePasswordForm(prev => ({ 
        ...prev, 
        message: 'New passwords do not match.',
        isSuccess: false 
      }));
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setChangePasswordForm(prev => ({ 
        ...prev, 
        message: passwordValidation.errors.join('. '),
        isSuccess: false 
      }));
      return;
    }

    setChangePasswordForm(prev => ({ ...prev, isLoading: true, message: '' }));

    try {
      // First, verify user with current credentials
      const userData = await AuthService.loginUser(email, currentPassword);
      
      if (userData) {
        // Change password
        await AuthService.changePassword(userData.id, currentPassword, newPassword);
        
        setChangePasswordForm(prev => ({
          ...prev,
          isLoading: false,
          message: 'Password changed successfully! You can now login with your new password.',
          isSuccess: true,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
    } catch (error) {
      setChangePasswordForm(prev => ({
        ...prev,
        isLoading: false,
        message: error.message || 'Failed to change password. Please verify your current password.',
        isSuccess: false
      }));
    }
  };

  const handleInputChange = (form, field, value) => {
    if (form === 'login') {
      setLoginForm(prev => ({ ...prev, [field]: value }));
    } else if (form === 'reset') {
      setResetForm(prev => ({ ...prev, [field]: value }));
    } else if (form === 'change') {
      setChangePasswordForm(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            KeyQuest Mortgage
          </h1>
          <p className="text-white/70 mt-2 font-medium">Professional Mortgage Calculator Suite</p>
        </div>

        {/* Navigation Tabs */}
        <div className="tab-navigation mb-6">
          <button
            onClick={() => setActiveView('login')}
            className={`tab-button ${activeView === 'login' ? 'active' : ''}`}
          >
            <LogIn className="w-5 h-5" />
            <span className="tab-text">Login</span>
          </button>
          <button
            onClick={() => setActiveView('reset')}
            className={`tab-button ${activeView === 'reset' ? 'active' : ''}`}
          >
            <KeyRound className="w-5 h-5" />
            <span className="tab-text">Reset</span>
          </button>
          <button
            onClick={() => setActiveView('change')}
            className={`tab-button ${activeView === 'change' ? 'active' : ''}`}
          >
            <Settings className="w-5 h-5" />
            <span className="tab-text">Change</span>
          </button>
        </div>

        {/* Login Form */}
        {activeView === 'login' && (
          <div className="standard-card card-gradient-blue backdrop-blur-lg transform hover:scale-105 transition-all duration-300">
            <div className="text-center mb-6">
              <LogIn className="w-12 h-12 mx-auto text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
              <p className="text-gray-600">Sign in to access your dashboard</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => handleInputChange('login', 'email', e.target.value)}
                    className="standard-input"
                    placeholder="Enter your email"
                    required
                  />
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginForm.password}
                    onChange={(e) => handleInputChange('login', 'password', e.target.value)}
                    className="standard-input"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Rate Limit Warning */}
              {rateLimitInfo && !rateLimitInfo.allowed && (
                <div className="result-card error">
                  <div className="result-header">
                    <div className="result-icon">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-red-700 text-sm font-medium m-0">
                      Too many failed attempts. Please try again in {rateLimitInfo.retryAfter} seconds.
                    </p>
                  </div>
                </div>
              )}

              {/* Login Error */}
              {error && (
                <div className="result-card error">
                  <div className="result-header">
                    <div className="result-icon">
                      <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-red-700 text-sm font-medium m-0">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || (rateLimitInfo && !rateLimitInfo.allowed)}
                className="btn-standard btn-primary btn-lg w-full"
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Password Reset Form */}
        {activeView === 'reset' && (
          <div className="standard-card card-gradient-yellow backdrop-blur-lg transform hover:scale-105 transition-all duration-300">
            <div className="text-center mb-6">
              <KeyRound className="w-12 h-12 mx-auto text-yellow-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
              <p className="text-gray-600">Enter your email to reset your password</p>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={resetForm.email}
                    onChange={(e) => handleInputChange('reset', 'email', e.target.value)}
                    className="standard-input"
                    placeholder="Enter your email"
                    required
                  />
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Reset Message */}
              {resetForm.message && (
                <div className={`result-card ${resetForm.isSuccess ? 'success' : 'error'}`}>
                  <div className="result-header">
                    <div className="result-icon">
                      {resetForm.isSuccess ? 
                        <CheckCircle className="w-5 h-5 text-green-500" /> : 
                        <XCircle className="w-5 h-5 text-red-500" />
                      }
                    </div>
                    <p className={`${resetForm.isSuccess ? 'text-green-700' : 'text-red-700'} text-sm font-medium m-0`}>
                      {resetForm.message}
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={resetForm.isLoading}
                className="btn-standard btn-warning btn-lg w-full"
              >
                {resetForm.isLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Sending Request...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    <span>Reset Password</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setActiveView('login')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </div>
          </div>
        )}

        {/* Change Password Form */}
        {activeView === 'change' && (
          <div className="standard-card card-gradient-green backdrop-blur-lg transform hover:scale-105 transition-all duration-300">
            <div className="text-center mb-6">
              <Settings className="w-12 h-12 mx-auto text-green-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800">Change Password</h2>
              <p className="text-gray-600">Update your account password</p>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={changePasswordForm.email}
                    onChange={(e) => handleInputChange('change', 'email', e.target.value)}
                    className="standard-input"
                    placeholder="Enter your email"
                    required
                  />
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={changePasswordForm.currentPassword}
                    onChange={(e) => handleInputChange('change', 'currentPassword', e.target.value)}
                    className="standard-input"
                    placeholder="Enter current password"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={changePasswordForm.newPassword}
                    onChange={(e) => handleInputChange('change', 'newPassword', e.target.value)}
                    className="standard-input"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={changePasswordForm.confirmPassword}
                    onChange={(e) => handleInputChange('change', 'confirmPassword', e.target.value)}
                    className="standard-input"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              {changePasswordForm.newPassword && (
                <div className="text-xs space-y-1 bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-700">Password Requirements:</p>
                  <div className="grid grid-cols-1 gap-1">
                    <span className={`${changePasswordForm.newPassword.length >= 8 ? 'text-green-600' : 'text-red-600'}`}>
                      • At least 8 characters
                    </span>
                    <span className={`${/[A-Z]/.test(changePasswordForm.newPassword) ? 'text-green-600' : 'text-red-600'}`}>
                      • One uppercase letter
                    </span>
                    <span className={`${/[a-z]/.test(changePasswordForm.newPassword) ? 'text-green-600' : 'text-red-600'}`}>
                      • One lowercase letter
                    </span>
                    <span className={`${/\d/.test(changePasswordForm.newPassword) ? 'text-green-600' : 'text-red-600'}`}>
                      • One number
                    </span>
                    <span className={`${/[!@#$%^&*(),.?":{}|<>]/.test(changePasswordForm.newPassword) ? 'text-green-600' : 'text-red-600'}`}>
                      • One special character
                    </span>
                    <span className={`${changePasswordForm.newPassword === changePasswordForm.confirmPassword && changePasswordForm.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                      • Passwords match
                    </span>
                  </div>
                </div>
              )}

              {/* Change Password Message */}
              {changePasswordForm.message && (
                <div className={`result-card ${changePasswordForm.isSuccess ? 'success' : 'error'}`}>
                  <div className="result-header">
                    <div className="result-icon">
                      {changePasswordForm.isSuccess ? 
                        <CheckCircle className="w-5 h-5 text-green-500" /> : 
                        <XCircle className="w-5 h-5 text-red-500" />
                      }
                    </div>
                    <p className={`${changePasswordForm.isSuccess ? 'text-green-700' : 'text-red-700'} text-sm font-medium m-0`}>
                      {changePasswordForm.message}
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  changePasswordForm.isLoading || 
                  !changePasswordForm.email || 
                  !changePasswordForm.currentPassword || 
                  !changePasswordForm.newPassword ||
                  changePasswordForm.newPassword !== changePasswordForm.confirmPassword ||
                  !validatePassword(changePasswordForm.newPassword).isValid
                }
                className="btn-standard btn-success btn-lg w-full"
              >
                {changePasswordForm.isLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Changing Password...</span>
                  </>
                ) : (
                  <>
                    <Settings className="w-5 h-5" />
                    <span>Change Password</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setActiveView('login')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/70 text-sm">
            © 2025 KeyQuest Mortgage
          </p>
          <p className="text-white/50 text-xs mt-1">
            Professional Mortgage Advisory Services
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
