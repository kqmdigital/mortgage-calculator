import React, { useState } from 'react';
import { Calculator, Download, FileText, CheckCircle, XCircle, Info, Lock, LogOut, Home, Building, TrendingUp, DollarSign, BarChart3, Sparkles, Shield, Users, Award, Menu, X, Settings, UserPlus } from 'lucide-react';
import { useAuth } from './contexts/EnhancedAuthContext';
import ProgressivePaymentCalculator from './ProgressivePaymentCalculator';
import MonthlyRepaymentCalculator from './MonthlyRepaymentCalculator';
import AdminManagement from './components/AdminManagement';

// Import your existing TDSRMSRCalculator component from App.js
// You'll need to extract this component from your App.js file
const TDSRMSRCalculator = ({ currentUser, onLogout }) => {
  // Your existing TDSR/MSR Calculator implementation goes here
  // This is the same component from your App.js file
  
  const [inputs, setInputs] = useState({
    propertyType: 'private',
    purchasePrice: '',
    loanPercentage: 75,
    customLoanAmount: '',
    useCustomAmount: false,
    stressTestRate: 4,
    loanTenor: 30,
    monthlySalaryA: '',
    annualSalaryA: '',
    applicantAgeA: '',
    monthlySalaryB: '',
    annualSalaryB: '',
    applicantAgeB: '',
    showFundAmount: '',
    pledgeAmount: '',
    carLoanA: '',
    carLoanB: '',
    personalLoanA: '',
    personalLoanB: '',
    propertyLoanA: '',
    propertyLoanB: ''
  });

  const [results, setResults] = useState(null);

  // ... (Include all your existing TDSR/MSR Calculator logic here)
  // For brevity, I'm not including the full implementation
  // You can copy it from your existing App.js file
  
  return (
    <div className="space-y-8">
      <div className="standard-card text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">TDSR/MSR Calculator</h2>
        <p className="text-gray-600">Implementation goes here - copy from your existing App.js</p>
      </div>
    </div>
  );
};

const AuthenticatedApp = () => {
  const { user, logout, canPerformAdminActions, isSuperAdmin, changePassword } = useAuth();
  
  const [calculatorType, setCalculatorType] = useState('tdsr');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAdminManagement, setShowAdminManagement] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  // Change password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    message: '',
    isSuccess: false,
    isLoading: false
  });

  const handleLogout = () => {
    logout();
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordForm(prev => ({ 
        ...prev, 
        message: 'Please fill in all fields.',
        isSuccess: false 
      }));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordForm(prev => ({ 
        ...prev, 
        message: 'New passwords do not match.',
        isSuccess: false 
      }));
      return;
    }

    setPasswordForm(prev => ({ ...prev, isLoading: true, message: '' }));

    const result = await changePassword(currentPassword, newPassword);
    
    setPasswordForm(prev => ({
      ...prev,
      isLoading: false,
      message: result.success ? 
        'Password changed successfully!' : 
        result.error || 'Failed to change password.',
      isSuccess: result.success,
      currentPassword: result.success ? '' : prev.currentPassword,
      newPassword: result.success ? '' : prev.newPassword,
      confirmPassword: result.success ? '' : prev.confirmPassword
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img 
                src="https://ik.imagekit.io/hst9jooux/KeyQuest%20Logo.jpeg?updatedAt=1748073687798" 
                alt="KeyQuest Mortgage Logo" 
                className="h-24 lg:h-32 w-auto rounded-2xl shadow-lg"
              />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          
          <div className="standard-card">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                  <Calculator className="text-blue-600 w-8 lg:w-10 h-8 lg:h-10" />
                  Comprehensive Mortgage Calculator Suite
                </h1>
                <p className="text-sm lg:text-base text-gray-600 mt-2">Professional mortgage analysis tools for property financing</p>
              </div>
              
              {/* User Menu */}
              <div className="relative">
                <div className="standard-card card-gradient-blue">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{user?.name}</p>
                        <p className="text-sm text-gray-600">{user?.email}</p>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {user?.role?.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="btn-standard btn-secondary btn-sm"
                    >
                      <Menu className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border z-50">
                    <div className="p-4">
                      <button
                        onClick={() => {
                          setShowChangePassword(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full btn-standard btn-secondary mb-2"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Change Password</span>
                      </button>
                      
                      {canPerformAdminActions() && (
                        <button
                          onClick={() => {
                            setShowAdminManagement(true);
                            setShowUserMenu(false);
                          }}
                          className="w-full btn-standard btn-primary mb-2"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>User Management</span>
                        </button>
                      )}
                      
                      <button
                        onClick={handleLogout}
                        className="w-full btn-standard btn-danger"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Calculator Type Selection */}
        <div className="mb-8 overflow-x-auto">
          <div className="tab-navigation">
            <button
              onClick={() => setCalculatorType('tdsr')}
              className={`tab-button ${calculatorType === 'tdsr' ? 'active' : ''}`}
            >
              <TrendingUp className="w-5 h-5" />
              <div className="tab-text">
                <div>TDSR/MSR Calculator</div>
                <div className="text-xs opacity-75">Affordability Assessment</div>
              </div>
            </button>
            <button
              onClick={() => setCalculatorType('repayment')}
              className={`tab-button ${calculatorType === 'repayment' ? 'active' : ''}`}
            >
              <DollarSign className="w-5 h-5" />
              <div className="tab-text">
                <div>Monthly Repayment Calculator</div>
                <div className="text-xs opacity-75">Payment Schedules</div>
              </div>
            </button>
            <button
              onClick={() => setCalculatorType('progressive')}
              className={`tab-button ${calculatorType === 'progressive' ? 'active' : ''}`}
            >
              <BarChart3 className="w-5 h-5" />
              <div className="tab-text">
                <div>Progressive Payment Calculator</div>
                <div className="text-xs opacity-75">BUC Properties</div>
              </div>
            </button>
          </div>
        </div>

        {/* Calculator Content */}
        <div className="standard-card">
          {calculatorType === 'tdsr' ? (
            <TDSRMSRCalculator currentUser={user?.name} onLogout={handleLogout} />
          ) : calculatorType === 'repayment' ? (
            <MonthlyRepaymentCalculator />
          ) : (
            <ProgressivePaymentCalculator />
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="standard-card">
            <p className="text-gray-600 text-sm">
              © 2025 KeyQuest Mortgage
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mt-3 text-xs text-gray-500">
              <span>📧 kenneth@keyquestmortgage.com.sg</span>
              <span className="hidden sm:inline">|</span>
              <span>📞 +65 9795 2338</span>
              <span className="hidden sm:inline">|</span>
              <span>Your Trusted Mortgage Advisory Partner</span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="standard-card w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Change Password</h2>
              <button
                onClick={() => setShowChangePassword(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="standard-input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="standard-input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="standard-input"
                  required
                />
              </div>

              {passwordForm.message && (
                <div className={`result-card ${passwordForm.isSuccess ? 'success' : 'error'}`}>
                  <div className="result-header">
                    <div className="result-icon">
                      {passwordForm.isSuccess ? 
                        <CheckCircle className="w-5 h-5 text-green-500" /> : 
                        <XCircle className="w-5 h-5 text-red-500" />
                      }
                    </div>
                    <p className={`${passwordForm.isSuccess ? 'text-green-700' : 'text-red-700'} text-sm font-medium m-0`}>
                      {passwordForm.message}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={passwordForm.isLoading}
                  className="btn-standard btn-success flex-1"
                >
                  {passwordForm.isLoading ? (
                    <>
                      <div className="loading-spinner"></div>
                      <span>Changing...</span>
                    </>
                  ) : (
                    <>
                      <Settings className="w-4 h-4" />
                      <span>Change Password</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="btn-standard btn-secondary"
                  disabled={passwordForm.isLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Management Modal */}
      <AdminManagement 
        isOpen={showAdminManagement} 
        onClose={() => setShowAdminManagement(false)} 
      />

      {/* Click outside to close menus */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
};

export default AuthenticatedApp;
