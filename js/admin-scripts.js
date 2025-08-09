// ===================================
// ENHANCED ADMIN JAVASCRIPT FRAMEWORK
// Version: 2.0 - Updated for Rate Package Enhancements
// ===================================

// ===================================
// GLOBAL CONFIGURATION & CONSTANTS
// ===================================

const AdminApp = {
    editingItemId: null,
    currentUser: null,
    isLoading: false,
    config: {
        pagination: {
            itemsPerPage: 10
        },
        notifications: {
            duration: 5000
        }
    }
};

// Standardized bank mappings for consistency across all pages
const STANDARD_BANK_MAPPINGS = {
    'CIMB': 'CIMB',
    'OCBC': 'OCBC', 
    'UOB': 'UOB',
    'DBS': 'DBS',
    'Maybank': 'MBB',
    'Standard Chartered': 'SCB',
    'HSBC': 'HSBC',
    'SBI': 'SBI',
    'Bank Of China': 'BOC',
    'Hong Leong Finance': 'HLF',
    'Singapura Finance': 'SF',
    'RHB Bank': 'RHB',
    'Sing Investments & Finance': 'SIF',
    'Citibank': 'Citibank'
};

// Reverse mapping for display purposes
const REVERSE_BANK_MAPPINGS = Object.fromEntries(
    Object.entries(STANDARD_BANK_MAPPINGS).map(([full, abbr]) => [abbr, full])
);

// ===================================
// UTILITY FUNCTIONS
// ===================================

// Enhanced bank name conversion functions
function getFullBankName(abbreviation) {
    return REVERSE_BANK_MAPPINGS[abbreviation] || abbreviation;
}

function getBankAbbreviation(fullName) {
    return STANDARD_BANK_MAPPINGS[fullName] || fullName;
}

// Convert bank names for database storage (full names)
function convertBankNamesForStorage(bankAbbreviations) {
    return bankAbbreviations.map(abbr => getFullBankName(abbr));
}

// Convert bank names for display (abbreviations)
function convertBankNamesForDisplay(bankFullNames) {
    if (!Array.isArray(bankFullNames)) return [];
    return bankFullNames.map(full => getBankAbbreviation(full));
}

// Enhanced notification system
function showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                ${type === 'success' ? '<i data-lucide="check-circle"></i>' : 
                  type === 'error' ? '<i data-lucide="x-circle"></i>' : 
                  type === 'warning' ? '<i data-lucide="alert-triangle"></i>' : 
                  '<i data-lucide="info"></i>'}
            </div>
            <div class="notification-message">${message}</div>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i data-lucide="x"></i>
            </button>
        </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Auto-remove after duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, duration);
}

// Enhanced loading system
function showLoading(message = 'Loading...') {
    AdminApp.isLoading = true;
    
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <div class="loading-message">${message}</div>
        </div>
    `;
    
    document.body.appendChild(loadingOverlay);
}

function hideLoading() {
    AdminApp.isLoading = false;
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

// Loading wrapper for async operations
async function withLoading(asyncFunction, loadingMessage = 'Processing...') {
    try {
        showLoading(loadingMessage);
        return await asyncFunction();
    } finally {
        hideLoading();
    }
}

// ===================================
// MODAL MANAGEMENT
// ===================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus first input if available
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        
        // Reset forms in modal
        const forms = modal.querySelectorAll('form');
        forms.forEach(form => {
            form.reset();
            // Clear any calculated rates
            const calculatedDivs = form.querySelectorAll('.calculated-rate');
            calculatedDivs.forEach(div => div.textContent = '');
        });
        
        // Reset editing state
        AdminApp.editingItemId = null;
    }
}

// ===================================
// SIDEBAR MANAGEMENT
// ===================================

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar) {
        sidebar.classList.toggle('sidebar-open');
        
        if (!overlay) {
            const sidebarOverlay = document.createElement('div');
            sidebarOverlay.className = 'sidebar-overlay';
            sidebarOverlay.onclick = closeSidebar;
            document.body.appendChild(sidebarOverlay);
        }
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar) {
        sidebar.classList.remove('sidebar-open');
    }
    
    if (overlay) {
        overlay.remove();
    }
}

// ===================================
// RATE PACKAGE SPECIFIC FUNCTIONS
// ===================================

// Enhanced rate calculation with validation
function calculateRateWithValidation(rateType, operator, value, availableRateTypes) {
    if (!rateType || !value || !availableRateTypes) {
        return null;
    }

    // Find the rate type data
    const rateTypeData = availableRateTypes.find(rt => rt.rate_type === rateType);
    if (!rateTypeData) {
        return null;
    }

    const baseRate = parseFloat(rateTypeData.rate_value) || 0;
    const adjustmentValue = parseFloat(value) || 0;
    const multiplier = operator === '-' ? -1 : 1;
    
    return {
        baseRate: baseRate,
        adjustment: adjustmentValue,
        operator: operator,
        finalRate: baseRate + (multiplier * adjustmentValue),
        rateType: rateType,
        display: `${rateType} (${baseRate.toFixed(3)}%) ${operator}${adjustmentValue.toFixed(3)}% = ${(baseRate + (multiplier * adjustmentValue)).toFixed(3)}%`
    };
}

// Validate rate package form with enhanced bank-rate type validation
function validateRatePackageForm(formData, availableRateTypes) {
    const errors = [];
    const selectedBank = formData.get('bank_name');
    
    if (!selectedBank) {
        errors.push('Bank name is required');
        return errors;
    }

    const fullBankName = getFullBankName(selectedBank);

    // Validate at least one year has rate data
    let hasRateData = false;
    const rateYears = ['year1', 'year2', 'year3', 'year4', 'year5', 'thereafter'];
    
    for (const year of rateYears) {
        const rateType = formData.get(`${year}_rate_type`);
        const value = formData.get(`${year}_value`);
        
        if (rateType && value) {
            hasRateData = true;
            
            // Validate rate type is available for selected bank
            const rateTypeData = availableRateTypes.find(rt => rt.rate_type === rateType);
            if (!rateTypeData) {
                errors.push(`Rate type "${rateType}" not found in database`);
                continue;
            }
            
            if (!rateTypeData.bank_names || !Array.isArray(rateTypeData.bank_names)) {
                errors.push(`Rate type "${rateType}" has invalid bank data`);
                continue;
            }
            
            if (!rateTypeData.bank_names.includes(fullBankName)) {
                errors.push(`Rate type "${rateType}" is not available for ${selectedBank}`);
            }

            // Validate rate value range
            const rateValue = parseFloat(value);
            if (isNaN(rateValue)) {
                errors.push(`Invalid rate value for ${year}`);
            } else if (rateValue < 0 || rateValue > 100) {
                errors.push(`Rate value for ${year} must be between 0 and 100`);
            }
        }
    }

    if (!hasRateData) {
        errors.push('At least one year must have rate information');
    }

    // Validate minimum loan size
    const minLoanSize = formData.get('minimum_loan_size');
    if (minLoanSize && (isNaN(parseFloat(minLoanSize)) || parseFloat(minLoanSize) < 0)) {
        errors.push('Minimum loan size must be a positive number');
    }

    return errors;
}

// Enhanced bank filtering for rate types
function filterRateTypesByBank(rateTypes, selectedBankAbbr) {
    if (!selectedBankAbbr || !rateTypes) {
        return [];
    }

    const fullBankName = getFullBankName(selectedBankAbbr);
    
    return rateTypes.filter(rateType => {
        return rateType.bank_names && 
               Array.isArray(rateType.bank_names) && 
               rateType.bank_names.includes(fullBankName);
    });
}

// ===================================
// RATE TYPES SPECIFIC FUNCTIONS
// ===================================

// Enhanced validation for rate types
function validateRateTypeForm(formData, selectedBanks) {
    const errors = [];
    
    // Validate rate type
    const rateType = formData.get('rate_type')?.trim();
    if (!rateType) {
        errors.push('Rate type is required');
    } else if (rateType.length < 2) {
        errors.push('Rate type must be at least 2 characters');
    } else if (!/^[A-Z0-9\s]+$/i.test(rateType)) {
        errors.push('Rate type can only contain letters, numbers, and spaces');
    }
    
    // Validate rate value
    const rateValue = parseFloat(formData.get('rate_value'));
    if (isNaN(rateValue)) {
        errors.push('Rate value is required and must be a number');
    } else if (rateValue < 0) {
        errors.push('Rate value must be positive');
    } else if (rateValue > 100) {
        errors.push('Rate value cannot exceed 100%');
    }
    
    // Validate bank selection
    if (!selectedBanks || selectedBanks.length === 0) {
        errors.push('At least one bank must be selected');
    }
    
    return errors;
}

// Format rate value for display
function formatRateValue(value) {
    if (value === null || value === undefined) return 'N/A';
    return parseFloat(value).toFixed(3) + '%';
}

// Format bank names for table display with abbreviations
function formatBankDisplay(bankNames, maxDisplay = 3) {
    if (!bankNames || !Array.isArray(bankNames) || bankNames.length === 0) {
        return '<span style="color: #9ca3af; font-style: italic;">No banks assigned</span>';
    }
    
    if (bankNames.length <= maxDisplay) {
        return bankNames.map(bank => `<span class="bank-tag">${escapeHtml(bank)}</span>`).join('');
    } else {
        const displayed = bankNames.slice(0, maxDisplay);
        const remaining = bankNames.length - maxDisplay;
        return displayed.map(bank => `<span class="bank-tag">${escapeHtml(bank)}</span>`).join('') + 
               `<span class="bank-tag more">+${remaining} more</span>`;
    }
}

// ===================================
// DATA EXPORT FUNCTIONS
// ===================================

// Enhanced CSV export with proper escaping
function exportToCSV(data, headers, filename = 'export.csv') {
    if (!data || data.length === 0) {
        showNotification('No data to export', 'warning');
        return;
    }
    
    // Escape CSV values
    function escapeCSV(value) {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    }
    
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => escapeCSV(row[header] || '')).join(',')
        )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Data exported successfully', 'success');
}

// Print table functionality
function printTable(tableSelector = '.table') {
    const table = document.querySelector(tableSelector);
    if (!table) {
        showNotification('No table found to print', 'error');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Print Table</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f5f5f5; font-weight: bold; }
                    .bank-tag { background: #e5e7eb; padding: 2px 4px; border-radius: 2px; font-size: 11px; }
                    .status-badge { padding: 2px 6px; border-radius: 4px; font-size: 11px; }
                    .status-completed { background: #dcfce7; color: #166534; }
                    .status-pending { background: #fef3c7; color: #92400e; }
                    .status-inactive { background: #f3f4f6; color: #6b7280; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <h1>Table Export - ${new Date().toLocaleDateString()}</h1>
                ${table.outerHTML}
                <script>window.print(); window.close();</script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

// ===================================
// RECENT ACTIONS MANAGEMENT
// ===================================

function addRecentAction(type, description) {
    const actions = getRecentActions();
    const newAction = {
        id: Date.now(),
        type: type,
        description: description,
        timestamp: new Date().toISOString(),
        user: AdminApp.currentUser?.email || 'admin'
    };
    
    actions.unshift(newAction);
    
    // Keep only last 10 actions
    const trimmedActions = actions.slice(0, 10);
    
    try {
        localStorage.setItem('recentActions', JSON.stringify(trimmedActions));
        updateRecentActionsDisplay();
    } catch (error) {
        console.warn('Could not save recent actions:', error);
    }
}

function getRecentActions() {
    try {
        const actions = localStorage.getItem('recentActions');
        return actions ? JSON.parse(actions) : [];
    } catch (error) {
        console.warn('Could not load recent actions:', error);
        return [];
    }
}

function updateRecentActionsDisplay() {
    const container = document.getElementById('recentActionsList');
    if (!container) return;
    
    const actions = getRecentActions();
    
    if (actions.length === 0) {
        container.innerHTML = '<div class="no-actions">No recent actions</div>';
        return;
    }
    
    container.innerHTML = actions.map(action => `
        <div class="recent-action-item">
            <div class="action-icon action-${action.type}">
                ${getActionIcon(action.type)}
            </div>
            <div class="action-details">
                <div class="action-description">${escapeHtml(action.description)}</div>
                <div class="action-timestamp">${formatTimestamp(action.timestamp)}</div>
            </div>
        </div>
    `).join('');
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function getActionIcon(type) {
    const icons = {
        'add': '<i data-lucide="plus"></i>',
        'edit': '<i data-lucide="edit"></i>',
        'delete': '<i data-lucide="trash-2"></i>',
        'duplicate': '<i data-lucide="copy"></i>',
        'view': '<i data-lucide="eye"></i>',
        'export': '<i data-lucide="download"></i>'
    };
    return icons[type] || '<i data-lucide="activity"></i>';
}

function formatTimestamp(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
}

function loadRecentActions() {
    updateRecentActionsDisplay();
}

// ===================================
// FORM UTILITIES
// ===================================

// Enhanced multi-select functionality
function toggleMultiSelect(selectId) {
    const select = document.getElementById(selectId);
    const dropdown = select?.nextElementSibling;
    
    if (dropdown && dropdown.classList.contains('multi-select-dropdown')) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

// Clear all filters functionality
function clearAllFilters() {
    const filterElements = document.querySelectorAll('.search-input, .filter-select, .filter-input');
    filterElements.forEach(element => {
        if (element.type === 'checkbox') {
            element.checked = false;
        } else {
            element.value = '';
        }
    });
    
    // Trigger filter function if it exists
    if (typeof filterPackages === 'function') filterPackages();
    if (typeof filterRateTypes === 'function') filterRateTypes();
    if (typeof filterBanks === 'function') filterBanks();
    if (typeof filterAgents === 'function') filterAgents();
    if (typeof filterBankers === 'function') filterBankers();
    if (typeof filterEnquiries === 'function') filterEnquiries();
}

// ===================================
// AUTHENTICATION UTILITIES
// ===================================

// Enhanced sign out with confirmation
function confirmSignOut() {
    const modal = document.getElementById('signout-modal');
    if (modal) {
        openModal('signout-modal');
    } else {
        // Fallback if modal doesn't exist
        if (confirm('Are you sure you want to sign out?')) {
            performSignOut();
        }
    }
}

async function performSignOut() {
    try {
        showLoading('Signing out...');
        
        if (typeof supabaseClient !== 'undefined') {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
        }
        
        // Clear stored data
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to login
        window.location.href = 'login.html';
        
    } catch (error) {
        console.error('Sign out error:', error);
        showNotification('Sign out failed: ' + error.message, 'error');
    } finally {
        hideLoading();
        const modal = document.getElementById('signout-modal');
        if (modal) {
            closeModal('signout-modal');
        }
    }
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

// Enhanced HTML escaping
function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
        '/': '&#x2F;'
    };
    return text.replace(/[&<>"'/]/g, m => map[m]);
}

// Debounce function for search inputs
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

// Format numbers with thousand separators
function formatNumber(num) {
    if (!num || isNaN(num)) return 'N/A';
    return new Intl.NumberFormat('en-US').format(num);
}

// Format currency
function formatCurrency(amount, currency = 'SGD') {
    if (!amount || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('en-SG', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Format date consistently
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-SG');
}

// Format date with time
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-SG');
}

// ===================================
// ERROR HANDLING
// ===================================

// Global error handler for rate package operations
function handleRatePackageError(error, operation = 'operation') {
    console.error(`Rate package ${operation} error:`, error);
    
    let message = `Failed to ${operation} rate package`;
    
    if (typeof error === 'string') {
        if (error.includes('duplicate') || error.includes('unique')) {
            message = 'A rate package with similar details already exists';
        } else if (error.includes('foreign key') || error.includes('reference')) {
            message = 'Invalid reference to bank or rate type';
        } else if (error.includes('check constraint')) {
            message = 'Invalid data format. Please check your inputs';
        }
    } else if (error.message) {
        message += ': ' + error.message;
    }
    
    showNotification(message, 'error');
}

// Global error handler for rate type operations
function handleRateTypeError(error, operation = 'operation') {
    console.error(`Rate type ${operation} error:`, error);
    
    let message = `Failed to ${operation} rate type`;
    
    if (typeof error === 'string') {
        if (error.includes('duplicate') || error.includes('unique')) {
            message = 'A rate type with this name and value already exists';
        } else if (error.includes('network') || error.includes('fetch')) {
            message = 'Network error. Please check your connection and try again';
        } else if (error.includes('permission') || error.includes('auth')) {
            message = 'You do not have permission to perform this action';
        }
    }
    
    showNotification(message, 'error');
}

// ===================================
// KEYBOARD SHORTCUTS
// ===================================

// Initialize keyboard shortcuts for rate types page
function initRateTypeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + N: New rate type
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            const addButton = document.querySelector('[onclick*="openAddRateTypeModal"]');
            if (addButton) addButton.click();
        }
        
        // Ctrl/Cmd + E: Export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            const exportButton = document.querySelector('[onclick*="exportRateTypes"]');
            if (exportButton) exportButton.click();
        }
    });
}

// Initialize keyboard shortcuts for rate packages page
function initRatePackageKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + N: New rate package
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            const addButton = document.querySelector('[onclick*="openModal(\'package-modal\')"]');
            if (addButton) addButton.click();
        }
        
        // Ctrl/Cmd + E: Export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            const exportButton = document.querySelector('[onclick*="exportToCSV"]');
            if (exportButton) exportButton.click();
        }
    });
}

// ===================================
// INITIALIZATION FUNCTIONS
// ===================================

// Initialize rate types page functionality
function initRateTypesPage() {
    console.log('Initializing rate types page...');
    
    // Initialize keyboard shortcuts
    initRateTypeKeyboardShortcuts();
    
    // Load recent actions
    loadRecentActions();
    
    // Add enhanced styling for rate types
    const style = document.createElement('style');
    style.textContent = `
        .bank-tag {
            display: inline-block;
            background: #e5e7eb;
            color: #374151;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            margin: 1px;
            font-weight: 500;
        }
        
        .bank-tag.more {
            background: #3b82f6;
            color: white;
        }
        
        .rate-value {
            font-family: monospace;
            font-weight: 600;
            color: #059669;
        }
        
        .no-data {
            text-align: center;
            padding: 40px;
            color: #6b7280;
        }
        
        .no-data svg {
            width: 48px;
            height: 48px;
            margin: 0 auto 16px;
        }
        
        .no-data h3 {
            margin: 0 0 8px 0;
            font-size: 18px;
            font-weight: 600;
        }
        
        .no-data p {
            margin: 0;
            font-size: 14px;
        }
    `;
    document.head.appendChild(style);
    
    console.log('Rate types page functionality initialized');
}

// Initialize rate packages page functionality
function initRatePackagesPage() {
    console.log('Initializing rate packages page...');
    
    // Initialize keyboard shortcuts
    initRatePackageKeyboardShortcuts();
    
    // Load recent actions
    loadRecentActions();
    
    console.log('Rate packages page functionality initialized');
}

// ===================================
// NOTIFICATION STYLES
// ===================================

// Add notification styles to page
function addNotificationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            animation: slideIn 0.3s ease-out;
        }
        
        .notification-content {
            display: flex;
            align-items: flex-start;
            padding: 16px;
            gap: 12px;
        }
        
        .notification-icon {
            flex-shrink: 0;
            width: 20px;
            height: 20px;
        }
        
        .notification-message {
            flex: 1;
            font-size: 14px;
            line-height: 1.4;
            white-space: pre-line;
        }
        
        .notification-close {
            flex-shrink: 0;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            width: 16px;
            height: 16px;
            opacity: 0.5;
        }
        
        .notification-close:hover {
            opacity: 1;
        }
        
        .notification-success {
            background: #dcfce7;
            color: #166534;
            border: 1px solid #bbf7d0;
        }
        
        .notification-error {
            background: #fef2f2;
            color: #dc2626;
            border: 1px solid #fecaca;
        }
        
        .notification-warning {
            background: #fef3c7;
            color: #92400e;
            border: 1px solid #fde68a;
        }
        
        .notification-info {
            background: #dbeafe;
            color: #1d4ed8;
            border: 1px solid #bfdbfe;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        }
        
        .loading-content {
            background: white;
            padding: 32px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        
        .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #f3f4f6;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading-message {
            color: #374151;
            font-size: 14px;
        }
    `;
    document.head.appendChild(style);
}

// ===================================
// INITIALIZATION ON PAGE LOAD
// ===================================

// Load recent actions on page load
loadRecentActions();

// Add notification styles
addNotificationStyles();

// ===================================
// EXPORT FOR GLOBAL USE
// ===================================

// Make functions globally available
window.AdminApp = AdminApp;
window.showNotification = showNotification;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.withLoading = withLoading;
window.openModal = openModal;
window.closeModal = closeModal;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.toggleMultiSelect = toggleMultiSelect;
window.clearAllFilters = clearAllFilters;
window.exportToCSV = exportToCSV;
window.printTable = printTable;
window.confirmSignOut = confirmSignOut;
window.performSignOut = performSignOut;
window.addRecentAction = addRecentAction;
window.formatNumber = formatNumber;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.escapeHtml = escapeHtml;
window.debounce = debounce;

// Bank standardization functions
window.getFullBankName = getFullBankName;
window.getBankAbbreviation = getBankAbbreviation;
window.convertBankNamesForStorage = convertBankNamesForStorage;
window.convertBankNamesForDisplay = convertBankNamesForDisplay;

// Rate package specific functions
window.calculateRateWithValidation = calculateRateWithValidation;
window.validateRatePackageForm = validateRatePackageForm;
window.filterRateTypesByBank = filterRateTypesByBank;
window.handleRatePackageError = handleRatePackageError;
window.initRatePackagesPage = initRatePackagesPage;

// Rate types specific functions
window.validateRateTypeForm = validateRateTypeForm;
window.formatRateValue = formatRateValue;
window.formatBankDisplay = formatBankDisplay;
window.handleRateTypeError = handleRateTypeError;
window.initRateTypeKeyboardShortcuts = initRateTypeKeyboardShortcuts;
window.initRateTypesPage = initRateTypesPage;

console.log('Enhanced Admin JavaScript framework loaded successfully');

// Auto-initialize page-specific functionality based on current page
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'rate-types.html') {
        initRateTypesPage();
    } else if (currentPage === 'rate-packages.html') {
        initRatePackagesPage();
    }
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});
