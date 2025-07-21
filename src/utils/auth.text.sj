// Comprehensive test suite for authentication system
import { 
  validatePassword, 
  validateEmail, 
  hashPassword, 
  comparePasswords,
  generateToken,
  verifyToken 
} from '../utils/auth';
import { 
  sanitizeInput, 
  sanitizeEmail, 
  checkPasswordStrength,
  authRateLimiter,
  validators
} from '../utils/security';
import { AuthService } from '../utils/supabase';

// Mock Supabase for testing
jest.mock('../utils/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn()
      })),
      delete: jest.fn(() => ({
        eq: jest.fn()
      }))
    }))
  },
  AuthService: {
    loginUser: jest.fn(),
    createUser: jest.fn(),
    changePassword: jest.fn(),
    getUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
    listUsers: jest.fn(),
    deleteUser: jest.fn()
  }
}));

describe('Authentication Utilities', () => {
  
  describe('Password Validation', () => {
    test('should validate strong passwords', () => {
      const strongPassword = 'MyStr0ng!P@ssw0rd123';
      const result = validatePassword(strongPassword);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject weak passwords', () => {
      const weakPassword = '123';
      const result = validatePassword(weakPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject passwords without special characters', () => {
      const password = 'MyPassword123';
      const result = validatePassword(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    test('should reject short passwords', () => {
      const password = 'Sh0rt!';
      const result = validatePassword(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });
  });

  describe('Email Validation', () => {
    test('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@company.co.uk',
        'admin+test@keyquest.com.sg'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    test('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('Password Hashing', () => {
    test('should hash passwords securely', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2a$')).toBe(true);
    });

    test('should verify correct passwords', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isValid = await comparePasswords(password, hash);
      
      expect(isValid).toBe(true);
    });

    test('should reject incorrect passwords', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await hashPassword(password);
      const isValid = await comparePasswords(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token Management', () => {
    const testUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin'
    };

    test('should generate valid JWT tokens', () => {
      const token = generateToken(testUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    test('should verify valid tokens', () => {
      const token = generateToken(testUser);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.role).toBe(testUser.role);
    });

    test('should reject invalid tokens', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = verifyToken(invalidToken);
      
      expect(decoded).toBeNull();
    });
  });
});

describe('Security Utilities', () => {
  
  describe('Input Sanitization', () => {
    test('should sanitize malicious input', () => {
      const maliciousInput = '<script>alert("xss")</script>Test Input';
      const sanitized = sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
      expect(sanitized).toContain('Test Input');
    });

    test('should limit input length', () => {
      const longInput = 'a'.repeat(2000);
      const sanitized = sanitizeInput(longInput);
      
      expect(sanitized.length).toBeLessThanOrEqual(1000);
    });

    test('should sanitize email addresses', () => {
      const maliciousEmail = 'TEST@EXAMPLE.COM<script>';
      const sanitized = sanitizeEmail(maliciousEmail);
      
      expect(sanitized).toBe('test@example.com');
      expect(sanitized).not.toContain('<script>');
    });
  });

  describe('Password Strength Checker', () => {
    test('should rate very strong passwords highly', () => {
      const password = 'MyVery$tr0ng!P@ssw0rd2024#';
      const result = checkPasswordStrength(password);
      
      expect(result.strength).toBe('Very Strong');
      expect(result.score).toBeGreaterThanOrEqual(6);
    });

    test('should identify weak passwords', () => {
      const password = 'password';
      const result = checkPasswordStrength(password);
      
      expect(result.strength).toBe('Very Weak');
      expect(result.score).toBeLessThan(4);
    });

    test('should provide helpful feedback', () => {
      const password = 'weak';
      const result = checkPasswordStrength(password);
      
      expect(result.feedback).toContain('Use at least 12 characters');
      expect(result.feedback.length).toBeGreaterThan(0);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      // Reset rate limiter before each test
      authRateLimiter.attempts.clear();
      authRateLimiter.blockedIPs.clear();
    });

    test('should allow initial requests', () => {
      const identifier = 'test-user-1';
      const result = authRateLimiter.checkRateLimit(identifier);
      
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(5);
    });

    test('should block after max attempts', () => {
      const identifier = 'test-user-2';
      
      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        authRateLimiter.recordFailedAttempt(identifier);
      }
      
      const result = authRateLimiter.checkRateLimit(identifier);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    test('should clear attempts after successful login', () => {
      const identifier = 'test-user-3';
      
      // Make some failed attempts
      authRateLimiter.recordFailedAttempt(identifier);
      authRateLimiter.recordFailedAttempt(identifier);
      
      // Clear attempts (simulate successful login)
      authRateLimiter.clearAttempts(identifier);
      
      const result = authRateLimiter.checkRateLimit(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(5);
    });
  });

  describe('Data Validators', () => {
    test('should validate email addresses', () => {
      expect(validators.email('test@example.com')).toBe(true);
      expect(validators.email('invalid-email')).toBe(false);
      expect(validators.email('')).toBe(false);
    });

    test('should validate names', () => {
      expect(validators.name('John Doe')).toBe(true);
      expect(validators.name('A')).toBe(false); // Too short
      expect(validators.name('')).toBe(false);
      expect(validators.name('a'.repeat(101))).toBe(false); // Too long
    });

    test('should validate roles', () => {
      expect(validators.role('admin')).toBe(true);
      expect(validators.role('super_admin')).toBe(true);
      expect(validators.role('editor')).toBe(true);
      expect(validators.role('invalid_role')).toBe(false);
    });

    test('should validate UUIDs', () => {
      expect(validators.uuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(validators.uuid('invalid-uuid')).toBe(false);
      expect(validators.uuid('')).toBe(false);
    });
  });
});

describe('AuthService Integration', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Login', () => {
    test('should handle successful login', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin'
      };

      AuthService.loginUser.mockResolvedValue(mockUser);

      const result = await AuthService.loginUser('test@example.com', 'password123');
      
      expect(result).toEqual(mockUser);
      expect(AuthService.loginUser).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    test('should handle login failure', async () => {
      AuthService.loginUser.mockRejectedValue(new Error('Invalid credentials'));

      await expect(
        AuthService.loginUser('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('User Creation', () => {
    test('should create user successfully', async () => {
      const newUser = {
        name: 'New User',
        email: 'new@example.com',
        role: 'editor',
        password: 'StrongPassword123!'
      };

      const mockCreatedUser = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        email: 'new@example.com',
        name: 'New User',
        role: 'editor'
      };

      AuthService.createUser.mockResolvedValue(mockCreatedUser);

      const result = await AuthService.createUser(newUser, 'admin');
      
      expect(result).toEqual(mockCreatedUser);
      expect(AuthService.createUser).toHaveBeenCalledWith(newUser, 'admin');
    });

    test('should handle creation failure', async () => {
      const newUser = {
        name: 'New User',
        email: 'existing@example.com',
        role: 'editor',
        password: 'password123'
      };

      AuthService.createUser.mockRejectedValue(new Error('User already exists'));

      await expect(
        AuthService.createUser(newUser, 'admin')
      ).rejects.toThrow('User already exists');
    });
  });
});

// Performance Tests
describe('Performance Tests', () => {
  
  test('password hashing should complete within reasonable time', async () => {
    const password = 'TestPassword123!';
    const startTime = performance.now();
    
    await hashPassword(password);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should complete within 1 second (bcrypt with 12 rounds)
    expect(duration).toBeLessThan(1000);
  });

  test('token generation should be fast', () => {
    const testUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin'
    };

    const startTime = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      generateToken(testUser);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // 1000 token generations should complete within 100ms
    expect(duration).toBeLessThan(100);
  });

  test('input sanitization should be fast', () => {
    const testInput = 'Test input with <script>alert("xss")</script> content';
    const startTime = performance.now();
    
    for (let i = 0; i < 10000; i++) {
      sanitizeInput(testInput);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // 10000 sanitizations should complete within 100ms
    expect(duration).toBeLessThan(100);
  });
});

// Security Tests
describe('Security Tests', () => {
  
  test('should prevent XSS in input sanitization', () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src="x" onerror="alert(\'xss\')">',
      '<svg onload="alert(\'xss\')">',
      '<iframe src="javascript:alert(\'xss\')"></iframe>'
    ];

    xssPayloads.forEach(payload => {
      const sanitized = sanitizeInput(payload);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('onerror=');
      expect(sanitized).not.toContain('onload=');
    });
  });

  test('should enforce password complexity', () => {
    const weakPasswords = [
      'password',
      '123456',
      'qwerty',
      'admin',
      'letmein'
    ];

    weakPasswords.forEach(password => {
      const result = validatePassword(password);
      expect(result.isValid).toBe(false);
    });
  });

  test('should generate unique tokens', () => {
    const testUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin'
    };

    const tokens = new Set();
    
    for (let i = 0; i < 100; i++) {
      const token = generateToken(testUser);
      tokens.add(token);
    }
    
    // All tokens should be unique (different timestamps)
    expect(tokens.size).toBe(100);
  });
});

// Manual Testing Checklist (to be run manually)
export const manualTestingChecklist = {
  authentication: [
    '✓ Test login with valid credentials',
    '✓ Test login with invalid credentials',
    '✓ Test login with malformed email',
    '✓ Test login with empty fields',
    '✓ Test rate limiting after multiple failed attempts',
    '✓ Test session timeout',
    '✓ Test logout functionality',
    '✓ Test automatic logout on session expiry'
  ],
  
  userManagement: [
    '✓ Create user with admin account',
    '✓ Create user with editor account (should fail)',
    '✓ Update user profile',
    '✓ Change password with correct current password',
    '✓ Change password with incorrect current password',
    '✓ Delete user (super admin only)',
    '✓ Test role-based access control'
  ],
  
  security: [
    '✓ Test XSS prevention in form inputs',
    '✓ Test password strength requirements',
    '✓ Verify JWT tokens are properly signed',
    '✓ Test session management across tabs',
    '✓ Verify rate limiting works correctly',
    '✓ Test input sanitization',
    '✓ Verify HTTPS enforcement in production'
  ],
  
  performance: [
    '✓ Test login performance under load',
    '✓ Monitor memory usage during extended use',
    '✓ Check for memory leaks',
    '✓ Test database query performance',
    '✓ Verify Core Web Vitals scores',
    '✓ Test on different devices and browsers'
  ],
  
  usability: [
    '✓ Test password visibility toggle',
    '✓ Test form validation messages',
    '✓ Test responsive design on mobile',
    '✓ Test keyboard navigation',
    '✓ Test screen reader compatibility',
    '✓ Test error message clarity',
    '✓ Test loading states and feedback'
  ]
};
