import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthService } from '../utils/supabase';
import { 
  generateSessionToken, 
  setUserSession, 
  getUserSession, 
  clearUserSession,
  checkSessionTimeout 
} from '../utils/auth';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
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
        error: null
      };
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        error: null
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
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  // Check for session timeout periodically
  useEffect(() => {
    if (state.isAuthenticated) {
      const interval = setInterval(() => {
        if (checkSessionTimeout()) {
          logout();
        }
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [state.isAuthenticated]);

  const initializeAuth = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const session = getUserSession();
      
      if (session && session.user) {
        // Verify user still exists in database
        try {
          const currentUser = await AuthService.getUserProfile(session.user.id);
          dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: currentUser });
        } catch (error) {
          // User no longer exists, clear session
          clearUserSession();
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Attempt login
      const userData = await AuthService.loginUser(email, password);
      
      // Generate session token
      const token = generateSessionToken(userData);
      
      // Store session
      setUserSession(token, userData);
      
      // Update state
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: userData });
      
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.message || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    clearUserSession();
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  const updateUserProfile = async (profileData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const updatedUser = await AuthService.updateUserProfile(state.user.id, profileData);
      
      // Update session with new data
      const session = getUserSession();
      if (session) {
        const newToken = generateSessionToken(updatedUser);
        setUserSession(newToken, updatedUser);
      }
      
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: updatedUser });
      
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.message || 'Profile update failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      await AuthService.changePassword(state.user.id, currentPassword, newPassword);
      
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.message || 'Password change failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const createUser = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const newUser = await AuthService.createUser(userData, state.user.role);
      
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      
      return { success: true, data: newUser };
      
    } catch (error) {
      const errorMessage = error.message || 'User creation failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user has specific role
  const hasRole = (requiredRole) => {
    if (!state.user) return false;
    
    const roleHierarchy = {
      'super_admin': 3,
      'admin': 2,
      'editor': 1
    };
    
    const userLevel = roleHierarchy[state.user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  };

  // Check if user can perform admin actions
  const canPerformAdminActions = () => {
    return hasRole('admin');
  };

  // Check if user is super admin
  const isSuperAdmin = () => {
    return state.user?.role === 'super_admin';
  };

  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    login,
    logout,
    updateUserProfile,
    changePassword,
    createUser,
    clearError,
    
    // Permissions
    hasRole,
    canPerformAdminActions,
    isSuperAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
