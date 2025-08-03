import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { AuthService } from '../utils/supabase';
import { 
  generateSessionToken, 
  setUserSession, 
  getUserSession, 
  clearUserSession,
  checkSessionTimeout 
} from '../utils/auth';
import { 
  authRateLimiter, 
  sanitizeEmail, 
  sanitizeInput,
  AuditLogger,
  validateSession,
  performSecurityChecks,
  validateEnvironment
} from '../utils/security';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  rateLimitInfo: null,
  securityChecks: null,
  lastActivity: null
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_RATE_LIMIT: 'SET_RATE_LIMIT',
  UPDATE_ACTIVITY: 'UPDATE_ACTIVITY',
  SET_SECURITY_CHECKS: 'SET_SECURITY_CHECKS'
};

// Reducer with enhanced security state management
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: action.preserveError ? state.error : null
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        rateLimitInfo: null,
        lastActivity: Date.now()
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        rateLimitInfo: null,
        lastActivity: null
      };
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        error: null,
        lastActivity: Date.now()
      };
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case AUTH_ACTIONS.SET_RATE_LIMIT:
      return {
        ...state,
        rateLimitInfo: action.payload
      };
    
    case AUTH_ACTIONS.UPDATE_ACTIVITY:
      return {
        ...state,
        lastActivity: Date.now()
      };

    case AUTH_ACTIONS.SET_SECURITY_CHECKS:
      return {
        ...state,
        securityChecks: action.payload
      };
    
    default:
      return state;
  }
};

// Create context
const EnhancedAuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(EnhancedAuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Enhanced Auth Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Get user's IP or identifier for rate limiting
  const getUserIdentifier = useCallback(() => {
    // In a real app, you'd get this from the server
    return `client_${navigator.userAgent.slice(0, 50)}`;
  }, []);

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  // Periodic session validation
  useEffect(() => {
    if (state.isAuthenticated) {
      const interval = setInterval(() => {
        if (!validateSession()) {
          handleSessionExpired();
        } else {
          dispatch({ type: AUTH_ACTIONS.UPDATE_ACTIVITY });
        }
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [state.isAuthenticated]);

  // Security checks on mount
  useEffect(() => {
    const securityResult = performSecurityChecks();
    dispatch({ type: AUTH_ACTIONS.SET_SECURITY_CHECKS, payload: securityResult });
    
    if (!validateEnvironment()) {
      dispatch({ 
        type: AUTH_ACTIONS.SET_ERROR, 
        payload: 'Application configuration error. Please contact support.' 
      });
    }
  }, []);

  const initializeAuth = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const session = await getUserSession();
      
      if (session && session.user) {
        // Verify user still exists in database
        try {
          const currentUser = await AuthService.getUserProfile(session.user.id);
          
          // Log successful session restoration
          AuditLogger.log('SESSION_RESTORED', currentUser.id, {
            email: currentUser.email,
            role: currentUser.role
          });
          
          dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: currentUser });
        } catch (error) {
          // User no longer exists or session is invalid
          AuditLogger.log('SESSION_INVALID', null, { error: error.message });
          clearUserSession();
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      AuditLogger.log('AUTH_INIT_ERROR', null, { error: error.message });
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const handleSessionExpired = useCallback(() => {
    AuditLogger.log('SESSION_EXPIRED', state.user?.id);
    clearUserSession();
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  }, [state.user]);

  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      // Sanitize inputs
      const cleanEmail = sanitizeEmail(email);
      const cleanPassword = sanitizeInput(password);

      // Validate inputs
      if (!cleanEmail || !cleanPassword) {
        const error = 'Email and password are required';
        dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: error });
        return { success: false, error };
      }

      // Check rate limiting
      const identifier = getUserIdentifier();
      const rateLimitCheck = authRateLimiter.checkRateLimit(identifier);
      
      if (!rateLimitCheck.allowed) {
        const error = `Too many failed attempts. Please try again in ${rateLimitCheck.retryAfter} seconds.`;
        dispatch({ type: AUTH_ACTIONS.SET_RATE_LIMIT, payload: rateLimitCheck });
        dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: error });
        return { success: false, error };
      }

      // Attempt login
      const userData = await AuthService.loginUser(cleanEmail, cleanPassword);
      
      // Generate JWT token
      const token = await generateSessionToken(userData);
      
      // Store session
      setUserSession(token, userData);
      
      // Clear rate limiting on successful login
      authRateLimiter.clearAttempts(identifier);
      
      // Log successful login
      AuditLogger.log('LOGIN_SUCCESS', userData.id, {
        email: userData.email,
        role: userData.role,
        method: 'password'
      });
      
      // Update state
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: userData });
      
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.message || 'Login failed. Please check your email and password.';
      
      console.log('🔴 Login Error Occurred:', errorMessage);
      
      // Record failed attempt for rate limiting
      const identifier = getUserIdentifier();
      authRateLimiter.recordFailedAttempt(identifier);
      
      // Log failed login attempt
      AuditLogger.log('LOGIN_FAILED', null, {
        email: sanitizeEmail(email),
        error: errorMessage,
        identifier
      });
      
      // IMPORTANT: Ensure error is set in context state
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
      
      console.log('🔴 Error dispatched to context:', errorMessage);
      
      // Return error info for additional handling if needed
      return { success: false, error: errorMessage };
    }
  };

  const logout = useCallback(() => {
    try {
      // Log logout
      if (state.user) {
        AuditLogger.log('LOGOUT', state.user.id, {
          email: state.user.email,
          method: 'user_initiated'
        });
      }
      
      // Clear session immediately
      clearUserSession();
      
      // Dispatch logout action
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, still clear the session
      clearUserSession();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, [state.user]);

  const updateUserProfile = async (profileData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true, preserveError: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      // Sanitize inputs
      const cleanData = {
        name: sanitizeInput(profileData.name),
        email: sanitizeEmail(profileData.email)
      };

      const updatedUser = await AuthService.updateUserProfile(state.user.id, cleanData);
      
      // Update session with new data
      const session = await getUserSession();
      if (session) {
        const newToken = await generateSessionToken(updatedUser);
        setUserSession(newToken, updatedUser);
      }
      
      // Log profile update
      AuditLogger.log('PROFILE_UPDATED', updatedUser.id, {
        changes: Object.keys(cleanData),
        email: updatedUser.email
      });
      
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: updatedUser });
      
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.message || 'Profile update failed';
      
      AuditLogger.log('PROFILE_UPDATE_FAILED', state.user?.id, {
        error: errorMessage
      });
      
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true, preserveError: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      // Sanitize inputs
      const cleanCurrentPassword = sanitizeInput(currentPassword);
      const cleanNewPassword = sanitizeInput(newPassword);

      await AuthService.changePassword(state.user.id, cleanCurrentPassword, cleanNewPassword);
      
      // Log password change
      AuditLogger.log('PASSWORD_CHANGED', state.user.id, {
        email: state.user.email,
        timestamp: new Date().toISOString()
      });
      
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false, preserveError: true });
      
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.message || 'Password change failed';
      
      AuditLogger.log('PASSWORD_CHANGE_FAILED', state.user?.id, {
        error: errorMessage
      });
      
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const createUser = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true, preserveError: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      // Sanitize inputs
      const cleanData = {
        name: sanitizeInput(userData.name),
        email: sanitizeEmail(userData.email),
        role: userData.role, // Role validation is done in AuthService
        password: sanitizeInput(userData.password)
      };

      const newUser = await AuthService.createUser(cleanData, state.user.role);
      
      // Log user creation
      AuditLogger.log('USER_CREATED', state.user.id, {
        createdUserId: newUser.id,
        createdUserEmail: newUser.email,
        createdUserRole: newUser.role,
        createdBy: state.user.email
      });
      
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false, preserveError: true });
      
      return { success: true, data: newUser };
      
    } catch (error) {
      const errorMessage = error.message || 'User creation failed';
      
      AuditLogger.log('USER_CREATION_FAILED', state.user?.id, {
        error: errorMessage,
        attemptedEmail: userData?.email
      });
      
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Check if user has specific role
  const hasRole = useCallback((requiredRole) => {
    if (!state.user) return false;
    
    const roleHierarchy = {
      'super_admin': 3,
      'admin': 2,
      'editor': 1
    };
    
    const userLevel = roleHierarchy[state.user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  }, [state.user]);

  // Check if user can perform admin actions
  const canPerformAdminActions = useCallback(() => {
    return hasRole('admin');
  }, [hasRole]);

  // Check if user is super admin
  const isSuperAdmin = useCallback(() => {
    return state.user?.role === 'super_admin';
  }, [state.user]);

  // Get security status
  const getSecurityStatus = useCallback(() => {
    return {
      sessionValid: validateSession(),
      rateLimited: state.rateLimitInfo && !state.rateLimitInfo.allowed,
      securityChecks: state.securityChecks,
      lastActivity: state.lastActivity,
      sessionAge: state.lastActivity ? Date.now() - state.lastActivity : null
    };
  }, [state.rateLimitInfo, state.securityChecks, state.lastActivity]);

  // Force logout (for admin actions)
  const forceLogout = useCallback((reason = 'forced') => {
    AuditLogger.log('LOGOUT_FORCED', state.user?.id, { reason });
    clearUserSession();
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  }, [state.user]);

  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    rateLimitInfo: state.rateLimitInfo,
    lastActivity: state.lastActivity,
    
    // Actions
    login,
    logout,
    updateUserProfile,
    changePassword,
    createUser,
    clearError,
    forceLogout,
    
    // Permissions
    hasRole,
    canPerformAdminActions,
    isSuperAdmin,
    
    // Security
    getSecurityStatus,
    
    // Utilities
    getUserIdentifier
  };

  return (
    <EnhancedAuthContext.Provider value={value}>
      {children}
    </EnhancedAuthContext.Provider>
  );
};

export default EnhancedAuthContext;
