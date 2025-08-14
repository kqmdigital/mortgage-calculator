import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Users, Shield, Eye, EyeOff, X, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/EnhancedAuthContext';
import { AuthService } from '../utils/supabase';
import { validatePassword, validateEmail } from '../utils/auth';

const AdminManagement = ({ isOpen, onClose }) => {
  const { user, isSuperAdmin, canPerformAdminActions } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Create user form state
  const [createUserForm, setCreateUserForm] = useState({
    name: '',
    email: '',
    role: 'editor',
    password: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false
  });

  useEffect(() => {
    if (isOpen && canPerformAdminActions()) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const userData = await AuthService.listUsers(user.role);
      setUsers(userData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Validation
      if (!createUserForm.name || !createUserForm.email || !createUserForm.password) {
        throw new Error('Please fill in all required fields');
      }

      if (!validateEmail(createUserForm.email)) {
        throw new Error('Please enter a valid email address');
      }

      if (createUserForm.password !== createUserForm.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const passwordValidation = validatePassword(createUserForm.password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join('. '));
      }

      // Create user
      const result = await AuthService.createUser({
        name: createUserForm.name,
        email: createUserForm.email,
        role: createUserForm.role,
        password: createUserForm.password
      }, user.role);

      setSuccessMessage(`User ${result.name} created successfully!`);
      setCreateUserForm({
        name: '',
        email: '',
        role: 'editor',
        password: '',
        confirmPassword: ''
      });
      setShowCreateUser(false);
      loadUsers();

      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      await AuthService.deleteUser(userId, user.role, user.id);
      setSuccessMessage(`User ${userName} deleted successfully!`);
      loadUsers();

      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'editor':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'editor':
        return 'Editor';
      default:
        return 'Unknown';
    }
  };

  if (!isOpen) return null;

  if (!canPerformAdminActions()) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="standard-card w-full max-w-md text-center">
          <div className="mb-4">
            <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-sm sm:text-base text-gray-600">You don't have permission to access user management.</p>
          </div>
          <button onClick={onClose} className="btn-standard btn-primary w-full sm:w-auto">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="standard-card w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800">User Management</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="result-card success mb-4">
            <div className="result-header">
              <div className="result-icon">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-green-700 text-sm font-medium m-0">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="result-card error mb-4">
            <div className="result-header">
              <div className="result-icon">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-red-700 text-sm font-medium m-0">{error}</p>
            </div>
          </div>
        )}

        {/* Create User Button */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div className="text-sm text-gray-600">
            Total Users: <span className="font-semibold">{users.length}</span>
          </div>
          <button
            onClick={() => setShowCreateUser(true)}
            className="btn-standard btn-success w-full sm:w-auto"
            disabled={isLoading}
          >
            <UserPlus className="w-4 h-4" />
            <span>Create User</span>
          </button>
        </div>

        {/* Create User Form */}
        {showCreateUser && (
          <div className="standard-card card-gradient-green mb-4 sm:mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Create New User</h3>
              <button
                onClick={() => setShowCreateUser(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid-responsive cols-1 sm:cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={createUserForm.name}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, name: e.target.value }))}
                  className="standard-input"
                  placeholder="John Doe"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="standard-input"
                  placeholder="john@company.com"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={createUserForm.role}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, role: e.target.value }))}
                  className="standard-input"
                  disabled={isLoading}
                >
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  {isSuperAdmin() && <option value="super_admin">Super Admin</option>}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.password ? "text" : "password"}
                    value={createUserForm.password}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, password: e.target.value }))}
                    className="standard-input"
                    placeholder="Strong password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, password: !prev.password }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPasswords.password ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirmPassword ? "text" : "password"}
                    value={createUserForm.confirmPassword}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="standard-input"
                    placeholder="Confirm password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPasswords.confirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {createUserForm.password && (
              <div className="mt-4 text-xs space-y-1">
                <p className="font-medium text-gray-700">Password Requirements:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <span className={`${createUserForm.password.length >= 8 ? 'text-green-600' : 'text-red-600'}`}>
                    • At least 8 characters
                  </span>
                  <span className={`${/[A-Z]/.test(createUserForm.password) ? 'text-green-600' : 'text-red-600'}`}>
                    • One uppercase letter
                  </span>
                  <span className={`${/[a-z]/.test(createUserForm.password) ? 'text-green-600' : 'text-red-600'}`}>
                    • One lowercase letter
                  </span>
                  <span className={`${/\d/.test(createUserForm.password) ? 'text-green-600' : 'text-red-600'}`}>
                    • One number
                  </span>
                  <span className={`${/[!@#$%^&*(),.?":{}|<>]/.test(createUserForm.password) ? 'text-green-600' : 'text-red-600'}`}>
                    • One special character
                  </span>
                  <span className={`${createUserForm.password === createUserForm.confirmPassword && createUserForm.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                    • Passwords match
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleCreateUser}
                disabled={
                  isLoading || 
                  !createUserForm.name || 
                  !createUserForm.email || 
                  !createUserForm.password ||
                  createUserForm.password !== createUserForm.confirmPassword ||
                  !validatePassword(createUserForm.password).isValid
                }
                className="btn-standard btn-success w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create User</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowCreateUser(false)}
                className="btn-standard btn-secondary w-full sm:w-auto"
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">All Users</h3>
          
          {isLoading && !users.length ? (
            <div className="text-center py-8">
              <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No users found</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {users.map((userData) => (
                <div key={userData.id} className="standard-card">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm sm:text-lg">
                          {userData.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{userData.name}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{userData.email}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(userData.role)}`}>
                            {getRoleDisplayName(userData.role)}
                          </span>
                          {userData.id === user.id && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                      <div className="text-xs text-gray-500">
                        <p>Created: {new Date(userData.created_at).toLocaleDateString()}</p>
                        {userData.updated_at !== userData.created_at && (
                          <p className="hidden sm:block">Updated: {new Date(userData.updated_at).toLocaleDateString()}</p>
                        )}
                      </div>
                      
                      {isSuperAdmin() && userData.id !== user.id && (
                        <button
                          onClick={() => handleDeleteUser(userData.id, userData.name)}
                          className="btn-standard btn-danger btn-sm flex-shrink-0"
                          disabled={isLoading}
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;
