// ===================================
// SECURITY UTILITIES
// Enhanced security functions for XSS prevention and input validation
// ===================================

class SecurityUtils {
    // HTML Sanitization to prevent XSS
    static sanitizeHTML(html) {
        const temp = document.createElement('div');
        temp.textContent = html;
        return temp.innerHTML;
    }

    // Safe DOM manipulation - replaces innerHTML usage
    static safeSetHTML(element, html) {
        if (!element) return;
        
        // Clear existing content
        element.textContent = '';
        
        // Create a temporary element to parse HTML safely
        const temp = document.createElement('div');
        temp.innerHTML = this.sanitizeHTML(html);
        
        // Move children to target element
        while (temp.firstChild) {
            element.appendChild(temp.firstChild);
        }
    }

    // Safe text content setting
    static safeSetText(element, text) {
        if (!element) return;
        element.textContent = text || '';
    }

    // Input validation functions
    static validateEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }

    static validateRequired(value) {
        return value && value.trim().length > 0;
    }

    static validateLength(value, min, max) {
        if (!value) return false;
        const length = value.trim().length;
        return length >= min && length <= max;
    }

    static validateNumber(value, min = -Infinity, max = Infinity) {
        const num = parseFloat(value);
        return !isNaN(num) && num >= min && num <= max;
    }

    // Escape HTML special characters
    static escapeHTML(text) {
        if (typeof text !== 'string') return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        };
        return text.replace(/[&<>"'/`=]/g, m => map[m]);
    }

    // Rate limiting for form submissions
    static createRateLimiter(maxAttempts, timeWindow) {
        const attempts = new Map();
        
        return function(identifier) {
            const now = Date.now();
            const userAttempts = attempts.get(identifier) || [];
            
            // Remove old attempts outside time window
            const recentAttempts = userAttempts.filter(
                attempt => now - attempt < timeWindow
            );
            
            if (recentAttempts.length >= maxAttempts) {
                return false; // Rate limited
            }
            
            recentAttempts.push(now);
            attempts.set(identifier, recentAttempts);
            return true; // Allowed
        };
    }

    // Secure localStorage wrapper
    static secureStorage = {
        set(key, value, expirationMs = null) {
            const item = {
                value: value,
                timestamp: Date.now(),
                expiration: expirationMs ? Date.now() + expirationMs : null
            };
            
            try {
                localStorage.setItem(key, JSON.stringify(item));
                return true;
            } catch (error) {
                console.error('Failed to save to localStorage:', error);
                return false;
            }
        },

        get(key) {
            try {
                const item = JSON.parse(localStorage.getItem(key));
                if (!item) return null;
                
                // Check expiration
                if (item.expiration && Date.now() > item.expiration) {
                    localStorage.removeItem(key);
                    return null;
                }
                
                return item.value;
            } catch (error) {
                console.error('Failed to read from localStorage:', error);
                return null;
            }
        },

        remove(key) {
            localStorage.removeItem(key);
        },

        clear() {
            localStorage.clear();
        }
    };

    // Form validation wrapper
    static validateForm(formData, rules) {
        const errors = [];
        
        for (const [field, rule] of Object.entries(rules)) {
            const value = formData.get(field);
            
            if (rule.required && !this.validateRequired(value)) {
                errors.push(`${rule.label || field} is required`);
                continue;
            }
            
            if (value && rule.email && !this.validateEmail(value)) {
                errors.push(`${rule.label || field} must be a valid email`);
            }
            
            if (value && rule.length) {
                const { min, max } = rule.length;
                if (!this.validateLength(value, min, max)) {
                    errors.push(`${rule.label || field} must be between ${min} and ${max} characters`);
                }
            }
            
            if (value && rule.number) {
                const { min, max } = rule.number;
                if (!this.validateNumber(value, min, max)) {
                    errors.push(`${rule.label || field} must be a number between ${min} and ${max}`);
                }
            }
        }
        
        return errors;
    }
}

// Create rate limiter for login attempts
const loginRateLimiter = SecurityUtils.createRateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes

// Export for global use
window.SecurityUtils = SecurityUtils;
window.loginRateLimiter = loginRateLimiter;

console.log('Security utilities loaded successfully');