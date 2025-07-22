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
    setChangePasswordForm(prev => ({ ...prev, message: '', isSuccess: false }));
  }, [activeView, clearError]);

  // Handle login form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    clearError();

    if (!loginForm.email || !loginForm.password) {
      return;
    }

    try {
      const result = await login(loginForm.email, loginForm.password);
      
      if (result.success) {
        console.log('Login successful');
      } else {
        console.log('Login failed:', result.error);
      }
    } catch (error) {
      console.error('Login error:', error);
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
      const userData = await AuthService.loginUser(email, currentPassword);
      
      if (userData) {
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

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-blue-50 opacity-50"></div>
      
      <div className="relative z-10 w-full max-w-lg">
        {/* Enhanced Header with Larger Logo */}
        <div className="text-center mb-10">
          {/* Larger Company Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <img 
                src="https://ik.imagekit.io/hst9jooux/KeyQuest%20Logo.jpeg?updatedAt=1748073687798" 
                alt="KeyQuest Mortgage Logo" 
                className="w-32 h-32 lg:w-40 lg:h-40 rounded-3xl shadow-xl border-4 border-white object-cover"
              />
              {/* Professional badge */}
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              KeyQuest Mortgage
            </h1>
            <p className="text-gray-600 text-lg font-medium">Professional Mortgage Calculator Suite</p>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto"></div>
          </div>
        </div>

        {/* Main Form Card with Integrated Tabs */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Tab Header integrated into the card */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 border-b border-gray-200">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Employee Portal</h2>
              <p className="text-gray-600 text-sm">Choose your action below</p>
            </div>
            
            {/* Integrated Navigation Tabs */}
            <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 p-1">
              <button
                onClick={() => setActiveView('login')}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeView === 'login' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>
              <button
                onClick={() => setActiveView('change')}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeView === 'change' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Change Password</span>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8">
            {/* Login Form */}
            {activeView === 'login' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <LogIn className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">Welcome Back</h3>
                  <p className="text-gray-600 text-sm">Sign in to access your dashboard</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
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
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="text-red-700 text-sm font-medium">
                          Too many failed attempts. Please try again in {rateLimitInfo.retryAfter} seconds.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Login Error - Enhanced visibility */}
                  {error && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 animate-pulse">
                      <div className="flex items-center gap-3">
                        <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                        <div>
                          <p className="text-red-700 text-sm font-bold">Login Failed</p>
                          <p className="text-red-600 text-sm">{error}</p>
                        </div>
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
              </div>
            )}

            {/* Change Password Form */}
            {activeView === 'change' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">Change Password</h3>
                  <p className="text-gray-600 text-sm">Update your account password</p>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-5">
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
                    <div className={`border-2 rounded-xl p-4 ${changePasswordForm.isSuccess ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                      <div className="flex items-center gap-3">
                        {changePasswordForm.isSuccess ? 
                          <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" /> : 
                          <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                        }
                        <div>
                          <p className={`text-sm font-bold ${changePasswordForm.isSuccess ? 'text-green-700' : 'text-red-700'}`}>
                            {changePasswordForm.isSuccess ? 'Success!' : 'Error!'}
                          </p>
                          <p className={`text-sm ${changePasswordForm.isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                            {changePasswordForm.message}
                          </p>
                        </div>
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
              </div>
            )}
          </div>
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
