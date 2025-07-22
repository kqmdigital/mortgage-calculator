import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, LogIn, Mail, User, ArrowLeft, CheckCircle, XCircle, AlertTriangle, Settings } from 'lucide-react';
import { useAuth } from '../contexts/EnhancedAuthContext';
import { validatePassword, validateEmail } from '../utils/auth';
import { AuthService } from '../utils/supabase';

const LoginPage = () => {
  const { login, error, isLoading, rateLimitInfo, clearError } = useAuth();
  
  const [activeView, setActiveView] = useState('login'); // 'login', 'change'
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  
  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
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
    setLocalError('');
    setChangePasswordForm(prev => ({ ...prev, message: '', isSuccess: false }));
  }, [activeView, clearError]);

  // Handle login form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    clearError();
    setLocalError('');

    if (!loginForm.email || !loginForm.password) {
      setLocalError('Please fill in all fields.');
      return;
    }

    try {
      const result = await login(loginForm.email, loginForm.password);
      
      if (!result.success) {
        // If login function returns error but doesn't set it in context
        setLocalError(result.error || 'Login failed. Please check your email and password.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLocalError('An unexpected error occurred. Please try again.');
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
    } else if (form === 'change') {
      setChangePasswordForm(prev => ({ ...prev, [field]: value }));
    }
  };

  // Get the current error to display (prefer context error, fall back to local error)
  const displayError = error || localError;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-blue-50 opacity-50"></div>
      
      <div className="relative z-10 w-full max-w-lg">
        {/* Logo Section - Outside Form */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <div className="relative">
              <img 
                src="https://ik.imagekit.io/hst9jooux/KeyQuest%20Logo1.JPG?updatedAt=1753157996192" 
                alt="KeyQuest Mortgage Logo" 
                className="w-42 h-36 lg:w-46 lg:h-40 rounded-2xl shadow-lg border-2 border-white object-cover"
              />
            
            </div>
          </div>
        </div>

        {/* Unified Form Container */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 transform hover:scale-[1.02] transition-all duration-300">
          
          {/* Title and Navigation Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Employee Portal</h2>
            
            {/* Navigation Tabs - Directly Below Title */}
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 rounded-xl shadow-inner border border-gray-200 p-1 inline-flex">
                <button
                  onClick={() => setActiveView('login')}
                  className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                    activeView === 'login' 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </button>
                <button
                  onClick={() => setActiveView('change')}
                  className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                    activeView === 'change' 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Change</span>
                </button>
              </div>
            </div>
          </div>

          {/* Login Form */}
          {activeView === 'login' && (
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
                    className="w-full px-4 py-4 pl-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-300 text-gray-800 bg-gray-50 focus:bg-white"
                    placeholder="Enter your email"
                    required
                  />
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                    className="w-full px-4 py-4 pl-12 pr-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-300 text-gray-800 bg-gray-50 focus:bg-white"
                    placeholder="Enter your password"
                    required
                  />
                  <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Rate Limit Warning */}
              {rateLimitInfo && !rateLimitInfo.allowed && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm font-medium">
                      Too many failed attempts. Please try again in {rateLimitInfo.retryAfter} seconds.
                    </p>
                  </div>
                </div>
              )}

              {/* Login Error - Enhanced Error Display */}
              {displayError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm font-medium">{displayError}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || (rateLimitInfo && !rateLimitInfo.allowed)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <LogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </div>
                )}
              </button>
            </form>
          )}

          {/* Change Password Form */}
          {activeView === 'change' && (
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
                    className="w-full px-4 py-4 pl-12 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-all duration-300 text-gray-800 bg-gray-50 focus:bg-white"
                    placeholder="Enter your email"
                    required
                  />
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                    className="w-full px-4 py-4 pl-12 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-all duration-300 text-gray-800 bg-gray-50 focus:bg-white"
                    placeholder="Enter current password"
                    required
                  />
                  <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                    className="w-full px-4 py-4 pl-12 pr-12 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-all duration-300 text-gray-800 bg-gray-50 focus:bg-white"
                    placeholder="Enter new password"
                    required
                  />
                  <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                    className="w-full px-4 py-4 pl-12 pr-12 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-all duration-300 text-gray-800 bg-gray-50 focus:bg-white"
                    placeholder="Confirm new password"
                    required
                  />
                  <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              {changePasswordForm.newPassword && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-gray-700 mb-3 text-sm">Password Requirements:</p>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className={`flex items-center gap-2 ${changePasswordForm.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${changePasswordForm.newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-2 ${/[A-Z]/.test(changePasswordForm.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(changePasswordForm.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span>One uppercase letter</span>
                    </div>
                    <div className={`flex items-center gap-2 ${/[a-z]/.test(changePasswordForm.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${/[a-z]/.test(changePasswordForm.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span>One lowercase letter</span>
                    </div>
                    <div className={`flex items-center gap-2 ${/\d/.test(changePasswordForm.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${/\d/.test(changePasswordForm.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span>One number</span>
                    </div>
                    <div className={`flex items-center gap-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(changePasswordForm.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${/[!@#$%^&*(),.?":{}|<>]/.test(changePasswordForm.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span>One special character</span>
                    </div>
                    <div className={`flex items-center gap-2 ${changePasswordForm.newPassword === changePasswordForm.confirmPassword && changePasswordForm.confirmPassword ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${changePasswordForm.newPassword === changePasswordForm.confirmPassword && changePasswordForm.confirmPassword ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span>Passwords match</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Change Password Message */}
              {changePasswordForm.message && (
                <div className={`border rounded-xl p-4 ${changePasswordForm.isSuccess ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-3">
                    {changePasswordForm.isSuccess ? 
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> : 
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    }
                    <p className={`text-sm font-medium ${changePasswordForm.isSuccess ? 'text-green-700' : 'text-red-700'}`}>
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
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {changePasswordForm.isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Changing Password...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <Settings className="w-5 h-5" />
                    <span>Change Password</span>
                  </div>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Enhanced Footer */}
        <div className="text-center mt-8">
          <div className="space-y-2">
            <p className="text-gray-600 font-medium">© 2025 KeyQuest Mortgage</p>
            <p className="text-gray-500 text-sm">Professional Mortgage Advisory Services</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
