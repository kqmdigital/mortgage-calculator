import React, { useState, useRef, useEffect } from 'react';
import { Calculator, LogOut, TrendingUp, DollarSign, BarChart3, Sparkles, Menu, UserPlus } from 'lucide-react';
import { useAuth } from './contexts/EnhancedAuthContext';
import TDSRMSRCalculator from './components/TDSRMSRCalculator';
import ProgressivePaymentCalculator from './ProgressivePaymentCalculator';
import MonthlyRepaymentCalculator from './MonthlyRepaymentCalculator';
import AdminManagement from './components/AdminManagement';

const AuthenticatedApp = () => {
  const { user, logout, canPerformAdminActions } = useAuth();
  
  const [calculatorType, setCalculatorType] = useState('tdsr');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAdminManagement, setShowAdminManagement] = useState(false);
  
  // Add ref for user menu to handle click outside
  const userMenuRef = useRef(null);
  

 // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const toggleUserMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowUserMenu(!showUserMenu);
  };

  const handleMenuItemClick = (action) => {
    return (e) => {
      e.preventDefault();
      e.stopPropagation();
      setShowUserMenu(false);
      setTimeout(() => action(), 100);
    };
  };

  const handleLogout = () => {
    logout();
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img 
                src="https://ik.imagekit.io/hst9jooux/KeyQuest%20Logo1.JPG?updatedAt=1753157996192" 
                alt="KeyQuest Mortgage Logo" 
                className="w-42 h-36 lg:w-46 lg:h-40 rounded-2xl shadow-lg border-2 border-white object-cover"
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
              <div className="relative" ref={userMenuRef}>
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
                      onClick={toggleUserMenu}
                      className="btn-standard btn-secondary btn-sm"
                      type="button"
                    >
                      <Menu className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border z-50">
                    <div className="p-4">
                      {canPerformAdminActions() && (
                        <button
                          onClick={handleMenuItemClick(() => setShowAdminManagement(true))}
                          className="w-full btn-standard btn-primary mb-2"
                          type="button"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>User Management</span>
                        </button>
                      )}
                      
                      <button
                        onClick={handleMenuItemClick(handleLogout)}
                        className="w-full btn-standard btn-danger"
                        type="button"
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


      {/* Admin Management Modal */}
      <AdminManagement 
        isOpen={showAdminManagement} 
        onClose={() => setShowAdminManagement(false)} 
      />

    </div>
  );
};

export default AuthenticatedApp;