// ===================================
// GLOBAL VARIABLES - PRESERVED FROM ORIGINAL
// ===================================
let allPackages = [];
let rateTypes = [];
let currentLoanType = 'New Home Loan';
let currentResults = [];
let searchCriteria = {};

// ===================================
// INITIALIZATION - PRESERVED FROM ORIGINAL
// ===================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Recommended Packages page loading...');
    await checkAuthentication();
    setupEventListeners();
    loadData();
});

// ===================================
// AUTHENTICATION CHECK - PRESERVED FROM ORIGINAL
// ===================================
async function checkAuthentication() {
    try {
        if (typeof AuthService === 'undefined') {
            console.error('AuthService not available');
            window.location.href = 'login.html';
            return;
        }

        const { success, user } = await AuthService.getCurrentUser();
        
        if (!success || !user) {
            console.warn('❌ No authenticated user found, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        // Update user display
        if (user.name) {
            document.getElementById('userName').textContent = user.name;
            document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
        }
    } catch (error) {
        console.error('💥 Auth check failed:', error);
        window.location.href = 'login.html';
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
        
function setupEventListeners() {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Existing event listeners...
    document.addEventListener('click', function(event) {
        const userDropdown = document.getElementById('userDropdown');
        const userInfo = document.querySelector('.user-info');
        
        if (userInfo && !userInfo.contains(event.target) && userDropdown) {
            userDropdown.style.display = 'none';
        }
    });

    const loanTabs = document.querySelectorAll('.loan-tab');
    loanTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const loanType = this.getAttribute('data-loan-type');
            selectLoanType(loanType);
        });
    });

    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', searchPackages);
    }

    // Enhanced live filtering event listeners - INCLUDING NEW FILTERS
    const filterInputs = [
        'propertyType',
        'propertyStatus', 
        'buyUnder',
        'loanAmount',
        'loanTenure',
        'existingInterestRate',
        'rateTypeFilter',
        'lockPeriodFilter'
    ];

    filterInputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.addEventListener('input', debounce(performLiveFilter, 300));
            element.addEventListener('change', performLiveFilter);
        }
    });

    // Add event listeners for multi-select changes
    document.addEventListener('change', function(event) {
        if (event.target.matches('#bankMultiSelect input[type="checkbox"]:not(#bankAll)')) {
            updateBankDisplay();
            performLiveFilter();
        }
        if (event.target.matches('#featuresMultiSelect input[type="checkbox"]:not(#featuresAll)')) {
            updateFeaturesDisplay();
            performLiveFilter();
        }
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.multi-select-filter')) {
            document.querySelectorAll('.multi-select-filter').forEach(filter => {
                filter.classList.remove('open');
                filter.querySelector('.multi-select-dropdown').classList.remove('open');
            });
        }
    });
    
    // Add existing bank filter listener
    const existingBankSelect = document.getElementById('existingBank');
    if (existingBankSelect) {
        existingBankSelect.addEventListener('change', performLiveFilter);
    }

    console.log('✅ Enhanced event listeners set up successfully');
}

// New function to clear all filters
function clearAllFilters() {
    // Clear existing filters
    document.getElementById('propertyType').value = '';
    document.getElementById('propertyStatus').value = '';
    document.getElementById('buyUnder').value = '';
    document.getElementById('loanAmount').value = '';
    document.getElementById('loanTenure').value = '';
    document.getElementById('existingInterestRate').value = '';
    document.getElementById('existingBank').value = '';
    document.getElementById('rateTypeFilter').value = '';
    document.getElementById('lockPeriodFilter').value = '';
    
    // Clear multi-select banks
    document.querySelectorAll('#bankMultiSelect input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('bankSelected').textContent = 'Select Banks';
    
    // Clear multi-select features
    document.querySelectorAll('#featuresMultiSelect input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('featuresSelected').textContent = 'Select Features';
    
    // Clear results
    clearResults();
    searchCriteria = {};
    
    showNotification('All filters cleared', 'info');
}

// ===================================
// LOAN TYPE SELECTION - PRESERVED FROM ORIGINAL
// ===================================
function selectLoanType(loanType) {
    currentLoanType = loanType;
    
    // Update tab appearance
    document.querySelectorAll('.loan-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-loan-type') === loanType) {
            tab.classList.add('active');
        }
    });
    
    // Show/hide existing rate input and existing bank for refinancing
    const existingRateGroup = document.getElementById('existingRateGroup');
    const existingBankGroup = document.getElementById('existingBankGroup');
    
    if (loanType === 'Refinancing Home Loan') {
        if (existingRateGroup) existingRateGroup.classList.remove('hidden');
        if (existingBankGroup) existingBankGroup.classList.remove('hidden');
    } else {
        if (existingRateGroup) existingRateGroup.classList.add('hidden');
        if (existingBankGroup) existingBankGroup.classList.add('hidden');
        document.getElementById('existingInterestRate').value = '';
        document.getElementById('existingBank').value = '';
    }
    
    // Clear previous results
    clearResults();
    
    console.log(`📋 Selected loan type: ${loanType}`);
}

// Multi-select functionality for banks
function toggleMultiSelect(selectId) {
    const container = document.getElementById(selectId);
    const dropdown = container.querySelector('.multi-select-dropdown');
    const isOpen = container.classList.contains('open');
    
    // Close all other dropdowns first
    document.querySelectorAll('.multi-select-filter').forEach(filter => {
        filter.classList.remove('open');
        filter.querySelector('.multi-select-dropdown').classList.remove('open');
    });
    
    if (!isOpen) {
        container.classList.add('open');
        dropdown.classList.add('open');
        
        // Ensure dropdown is positioned correctly
        const rect = container.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const dropdownHeight = 250; // max-height from CSS
        
        // Check if there's enough space below
        if (rect.bottom + dropdownHeight > viewportHeight) {
            // Not enough space below, show above instead
            dropdown.style.top = 'auto';
            dropdown.style.bottom = '100%';
            dropdown.style.marginTop = '0';
            dropdown.style.marginBottom = '4px';
        } else {
            // Enough space below, show normally
            dropdown.style.top = '100%';
            dropdown.style.bottom = 'auto';
            dropdown.style.marginTop = '4px';
            dropdown.style.marginBottom = '0';
        }
    }
}
        
function selectAllBanks() {
    const allCheckbox = document.getElementById('bankAll');
    const checkboxes = document.querySelectorAll('#bankMultiSelect input[type="checkbox"]:not(#bankAll)');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = allCheckbox.checked;
    });
    
    updateBankDisplay();
    performLiveFilter();
}

function selectAllFeatures() {
    const allCheckbox = document.getElementById('featuresAll');
    const checkboxes = document.querySelectorAll('#featuresMultiSelect input[type="checkbox"]:not(#featuresAll)');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = allCheckbox.checked;
    });
    
    updateFeaturesDisplay();
    performLiveFilter();
}

function updateBankDisplay() {
    const checkboxes = document.querySelectorAll('#bankMultiSelect input[type="checkbox"]:checked:not(#bankAll)');
    const selectedText = document.getElementById('bankSelected');
    
    if (checkboxes.length === 0) {
        selectedText.textContent = 'Select Banks';
    } else if (checkboxes.length === 1) {
        selectedText.textContent = checkboxes[0].value;
    } else {
        selectedText.textContent = `${checkboxes.length} banks selected`;
    }
}

function updateFeaturesDisplay() {
    const checkboxes = document.querySelectorAll('#featuresMultiSelect input[type="checkbox"]:checked:not(#featuresAll)');
    const selectedText = document.getElementById('featuresSelected');
    
    if (checkboxes.length === 0) {
        selectedText.textContent = 'Select Features';
    } else if (checkboxes.length === 1) {
        const value = checkboxes[0].value;
        selectedText.textContent = value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    } else {
        selectedText.textContent = `${checkboxes.length} features selected`;
    }
}

function getSelectedBanks() {
    const checkboxes = document.querySelectorAll('#bankMultiSelect input[type="checkbox"]:checked:not(#bankAll)');
    return Array.from(checkboxes).map(cb => cb.value);
}

function getSelectedFeatures() {
    const checkboxes = document.querySelectorAll('#featuresMultiSelect input[type="checkbox"]:checked:not(#featuresAll)');
    return Array.from(checkboxes).map(cb => cb.value);
}

// ===================================
// DATA LOADING FUNCTIONS - PRESERVED FROM ORIGINAL
// ===================================
async function loadData() {
    try {
        showLoading('Loading packages and rate types...');
        
        // Load packages and rate types in parallel
        const [packagesResult, rateTypesResult] = await Promise.all([
            supabaseClient.from('rate_packages').select('*'),
            supabaseClient.from('rate_types').select('*')
        ]);

        if (packagesResult.error) throw packagesResult.error;
        if (rateTypesResult.error) throw rateTypesResult.error;

        allPackages = packagesResult.data || [];
        rateTypes = rateTypesResult.data || [];

        console.log(`📦 Loaded ${allPackages.length} packages and ${rateTypes.length} rate types`);
        
    } catch (error) {
        console.error('💥 Error loading data:', error);
        showNotification('Failed to load data: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ===================================
// SEARCH FUNCTIONS - PRESERVED FROM ORIGINAL  
// ===================================
// Updated searchPackages function
async function searchPackages(event) {
    if (event) event.preventDefault();
    
    try {
        showLoading('Searching for the best packages...');
        
        // Get form values - INCLUDING NEW MULTI-SELECT FILTERS
        const selectedBanks = getSelectedBanks();
        const selectedFeatures = getSelectedFeatures();
        const existingBank = document.getElementById('existingBank').value;
        
        const formData = {
            propertyType: document.getElementById('propertyType').value,
            propertyStatus: document.getElementById('propertyStatus').value,
            buyUnder: document.getElementById('buyUnder').value,
            loanAmount: parseFloat(document.getElementById('loanAmount').value) || 0,
            loanTenure: parseInt(document.getElementById('loanTenure').value) || 25,
            existingInterestRate: parseFloat(document.getElementById('existingInterestRate').value) || 0,
            existingBank: existingBank,
            selectedBanks: selectedBanks,
            selectedFeatures: selectedFeatures,
            rateTypeFilter: document.getElementById('rateTypeFilter').value,
            lockPeriodFilter: document.getElementById('lockPeriodFilter').value
        };

        searchCriteria = { ...formData, loanType: currentLoanType };
        
        // Debug: Log search criteria
        console.log('🔍 searchCriteria set in searchPackages:', searchCriteria);
        console.log('💰 Loan Amount captured:', searchCriteria.loanAmount);
        console.log('📅 Loan Tenure captured:', searchCriteria.loanTenure);
        
        // Enhanced filter logic
        let filteredPackages = allPackages.filter(pkg => {
            // Existing filters
            if (pkg.loan_type !== currentLoanType) return false;
            if (formData.propertyType && pkg.property_type !== formData.propertyType) return false;
            if (formData.propertyStatus && pkg.property_status !== formData.propertyStatus) return false;
            if (formData.buyUnder && pkg.buy_under !== formData.buyUnder) return false;
            if (formData.loanAmount > 0 && pkg.minimum_loan_size && formData.loanAmount < pkg.minimum_loan_size) return false;
            
            // NEW: Exclude existing bank for refinancing
            if (currentLoanType === 'Refinancing Home Loan' && formData.existingBank && pkg.bank_name === formData.existingBank) {
                return false;
            }
            
            // NEW: Multi-select Bank filter
            if (formData.selectedBanks.length > 0 && !formData.selectedBanks.includes(pkg.bank_name)) {
                return false;
            }
            
            // Rate Type filter  
            if (formData.rateTypeFilter && pkg.rate_type_category !== formData.rateTypeFilter) return false;
            
            // Lock-in Period filter
            if (formData.lockPeriodFilter) {
                const pkgLockPeriod = pkg.lock_period || '0 Year';
                if (pkgLockPeriod !== formData.lockPeriodFilter) return false;
            }
            
            // NEW: Multi-select Package Features filter
            if (formData.selectedFeatures.length > 0) {
                const hasAnyFeature = formData.selectedFeatures.some(featureField => {
                    const featureValue = pkg[featureField];
                    return featureValue === 'true' || featureValue === true;
                });
                if (!hasAnyFeature) return false;
            }
            
            return true;
        });

        // Calculate metrics for each package
        filteredPackages = filteredPackages.map(pkg => {
            const avgFirst2Years = calculateAverageFirst2Years(pkg);
            const monthlyInstallment = calculateMonthlyInstallment(formData.loanAmount, formData.loanTenure, avgFirst2Years);
            
            // Calculate savings for refinancing based on LOCK-IN PERIOD
            let monthlySavings = 0;
            let totalSavings = 0;
            if (currentLoanType === 'Refinancing Home Loan' && formData.existingInterestRate) {
                monthlySavings = calculateMonthlySavings(formData.loanAmount, formData.loanTenure, formData.existingInterestRate, avgFirst2Years);
                totalSavings = calculateTotalSavings(monthlySavings, pkg.lock_period); // Use lock_period instead of tenure
            }
            
            return {
                ...pkg,
                avgFirst2Years,
                monthlyInstallment,
                monthlySavings,
                totalSavings,
                lockInYears: parseLockInPeriod(pkg.lock_period), // Add for display
                selected: true // Default to selected for report
            };
        });

        // Sort by average rate (ascending - best rates first)
        filteredPackages.sort((a, b) => a.avgFirst2Years - b.avgFirst2Years);

        currentResults = filteredPackages;
        displayResults(filteredPackages, true);
        
        console.log(`🔍 Found ${filteredPackages.length} matching packages`);
        
    } catch (error) {
        console.error('💥 Search error:', error);
        showNotification('Search failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function performLiveFilter() {
    console.log('🔄 Live filter started');
    
    if (!allPackages.length || !currentLoanType) {
        console.log('❌ Early return - no packages or loan type');
        return;
    }

    try {
        const selectedBanks = getSelectedBanks();
        const selectedFeatures = getSelectedFeatures();
        const existingBank = document.getElementById('existingBank').value;
        
        const formData = {
            propertyType: document.getElementById('propertyType').value,
            propertyStatus: document.getElementById('propertyStatus').value,
            buyUnder: document.getElementById('buyUnder').value,
            loanAmount: parseFloat(document.getElementById('loanAmount').value) || 0,
            loanTenure: parseInt(document.getElementById('loanTenure').value) || 25,
            existingInterestRate: parseFloat(document.getElementById('existingInterestRate').value) || 0,
            existingBank: existingBank,
            selectedBanks: selectedBanks,
            selectedFeatures: selectedFeatures,
            rateTypeFilter: document.getElementById('rateTypeFilter').value,
            lockPeriodFilter: document.getElementById('lockPeriodFilter').value
        };

        // Check if any filters are applied (updated to handle arrays properly)
        const hasFilters = Object.values(formData).some(value => {
            if (Array.isArray(value)) {
                return value.length > 0;
            }
            return value !== '' && value !== 0;
        });

        if (!hasFilters) {
            clearResults();
            return;
        }

        // Apply filtering logic
        let filteredPackages = allPackages.filter(pkg => {
            // Basic loan type filter
            if (pkg.loan_type !== currentLoanType) return false;
            
            // Property type filter
            if (formData.propertyType && pkg.property_type !== formData.propertyType) return false;
            
            // Property status filter
            if (formData.propertyStatus && pkg.property_status !== formData.propertyStatus) return false;
            
            // Buy under filter
            if (formData.buyUnder && pkg.buy_under !== formData.buyUnder) return false;
            
            // Minimum loan amount filter
            if (formData.loanAmount > 0 && pkg.minimum_loan_size && formData.loanAmount < pkg.minimum_loan_size) return false;
            
            // NEW: Exclude existing bank for refinancing
            if (currentLoanType === 'Refinancing Home Loan' && formData.existingBank && pkg.bank_name === formData.existingBank) {
                return false;
            }
            
            // NEW: Multi-select Bank filter
            if (formData.selectedBanks.length > 0 && !formData.selectedBanks.includes(pkg.bank_name)) {
                return false;
            }
            
            // Rate Type filter  
            if (formData.rateTypeFilter && pkg.rate_type_category !== formData.rateTypeFilter) return false;
            
            // Lock-in Period filter
            if (formData.lockPeriodFilter) {
                const pkgLockPeriod = pkg.lock_period || '0 Year';
                if (pkgLockPeriod !== formData.lockPeriodFilter) return false;
            }
            
            // NEW: Multi-select Package Features filter
            if (formData.selectedFeatures.length > 0) {
                const hasAnyFeature = formData.selectedFeatures.some(featureField => {
                    const featureValue = pkg[featureField];
                    return featureValue === 'true' || featureValue === true;
                });
                if (!hasAnyFeature) return false;
            }
            
            return true;
        });

        // Calculate metrics for each package (same as searchPackages)
        filteredPackages = filteredPackages.map(pkg => {
            const avgFirst2Years = calculateAverageFirst2Years(pkg);
            const monthlyInstallment = calculateMonthlyInstallment(formData.loanAmount, formData.loanTenure, avgFirst2Years);
            
            // Calculate savings for refinancing based on LOCK-IN PERIOD
            let monthlySavings = 0;
            let totalSavings = 0;
            if (currentLoanType === 'Refinancing Home Loan' && formData.existingInterestRate) {
                monthlySavings = calculateMonthlySavings(formData.loanAmount, formData.loanTenure, formData.existingInterestRate, avgFirst2Years);
                totalSavings = calculateTotalSavings(monthlySavings, pkg.lock_period);
            }
            
            return {
                ...pkg,
                avgFirst2Years,
                monthlyInstallment,
                monthlySavings,
                totalSavings,
                lockInYears: parseLockInPeriod(pkg.lock_period),
                selected: true // Default to selected for report
            };
        });

        // Sort by average rate (ascending - best rates first)
        filteredPackages.sort((a, b) => a.avgFirst2Years - b.avgFirst2Years);

        currentResults = filteredPackages;
        displayResults(filteredPackages, false); // false = don't scroll to results for live filtering
        
        console.log(`🔍 Live filter found ${filteredPackages.length} matching packages`);
        
    } catch (error) {
        console.error('Live filter error:', error);
    }
}

function clearResults() {
    const resultsContainer = document.getElementById('resultsContainer');
    if (resultsContainer) {
        resultsContainer.classList.add('hidden');
    }
    currentResults = [];
}

// ===================================
// CALCULATION FUNCTIONS - PRESERVED FROM ORIGINAL
// ===================================
function calculateAverageFirst2Years(pkg) {
    const year1Rate = calculateInterestRate(pkg, 1);
    const year2Rate = calculateInterestRate(pkg, 2);
    
    if (year1Rate === 0 && year2Rate === 0) return 0;
    if (year1Rate === 0) return year2Rate;
    if (year2Rate === 0) return year1Rate;
    
    return (year1Rate + year2Rate) / 2;
}

function calculateMonthlyInstallment(principal, tenureYears, annualRate) {
    if (!principal || !tenureYears || !annualRate) return 0;
    
    const monthlyRate = annualRate / 100 / 12;
    const totalMonths = tenureYears * 12;
    
    if (monthlyRate === 0) {
        return principal / totalMonths;
    }
    
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                         (Math.pow(1 + monthlyRate, totalMonths) - 1);
    
    return monthlyPayment;
}

// Calculate numeric interest rate for a given year
function calculateNumericRate(pkg, year) {
    let rateType, operator, value;
    
    if (year === 'thereafter') {
        rateType = pkg.thereafter_rate_type;
        operator = pkg.thereafter_operator;
        value = pkg.thereafter_value;
    } else {
        rateType = pkg[`year${year}_rate_type`];
        operator = pkg[`year${year}_operator`];
        value = pkg[`year${year}_value`];
    }
    
    // If no data for this year, use thereafter rate
    if (!rateType || value === null || value === undefined) {
        if (pkg.thereafter_rate_type && pkg.thereafter_value !== null && pkg.thereafter_value !== undefined) {
            return calculateNumericRate(pkg, 'thereafter');
        }
        return 0;
    }
    
    // Calculate numeric rate
    if (rateType === 'FIXED') {
        return parseFloat(value) || 0;
    } else {
        // Find the reference rate
        const referenceRate = rateTypes.find(rt => rt.rate_type === rateType);
        if (!referenceRate) {
            console.warn(`❌ Reference rate type not found: ${rateType}`);
            return 0;
        }
        
        const referenceRateValue = parseFloat(referenceRate.rate_value) || 0;
        const spreadValue = parseFloat(value) || 0;
        
        return operator === '+' ? 
            referenceRateValue + spreadValue : 
            referenceRateValue - spreadValue;
    }
}

// Calculate total interest cost over entire loan tenure
function calculateTotalInterestCost(pkg, loanAmount, tenureYears) {
    if (!pkg || !loanAmount || !tenureYears) return 0;
    
    // Use simplified calculation: average rate over tenure
    let totalRate = 0;
    let validYears = 0;
    
    // Calculate average rate for first 5 years
    for (let year = 1; year <= Math.min(5, tenureYears); year++) {
        const rate = calculateNumericRate(pkg, year);
        if (rate > 0) {
            totalRate += rate;
            validYears++;
        }
    }
    
    // Add thereafter rate for remaining years
    if (tenureYears > 5) {
        const thereafterRate = calculateNumericRate(pkg, 'thereafter');
        if (thereafterRate > 0) {
            const remainingYears = tenureYears - 5;
            totalRate += thereafterRate * remainingYears;
            validYears += remainingYears;
        }
    }
    
    if (validYears === 0) return 0;
    
    const averageRate = totalRate / validYears;
    const monthlyInstallment = calculateMonthlyInstallment(loanAmount, tenureYears, averageRate);
    const totalPayments = monthlyInstallment * tenureYears * 12;
    
    return totalPayments - loanAmount; // Total interest
}

// Calculate lifetime savings compared to existing rate
function calculateLifetimeSavings(pkg, loanAmount, tenureYears, existingRate) {
    if (!existingRate || existingRate <= 0) return 0;
    
    const newTotalInterest = calculateTotalInterestCost(pkg, loanAmount, tenureYears);
    const existingMonthlyPayment = calculateMonthlyInstallment(loanAmount, tenureYears, existingRate);
    const existingTotalPayment = existingMonthlyPayment * tenureYears * 12;
    const existingTotalInterest = existingTotalPayment - loanAmount;
    
    return existingTotalInterest - newTotalInterest;
}

// Extract numeric value from lock-in period (e.g., "3 Years" -> 3)
function parseLockInPeriod(lockPeriod) {
    if (!lockPeriod) return 0;
    const match = lockPeriod.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

// Calculate potential monthly savings for refinancing
function calculateMonthlySavings(loanAmount, tenure, existingRate, newRate) {
    if (!loanAmount || !tenure || !existingRate || !newRate) return 0;
    
    const existingPayment = calculateMonthlyInstallment(loanAmount, tenure, existingRate);
    const newPayment = calculateMonthlyInstallment(loanAmount, tenure, newRate);
    
    return existingPayment - newPayment;
}

// Calculate total savings over LOCK-IN PERIOD (not full tenure)
function calculateTotalSavings(monthlySavings, lockInPeriod) {
    if (!monthlySavings || !lockInPeriod) return 0;
    const lockInYears = parseLockInPeriod(lockInPeriod);
    return monthlySavings * lockInYears * 12;
}

// Format savings display with lock-in period context
function formatSavings(savings, lockInPeriod = null) {
    if (savings === 0) return 'No savings';
    
    const lockInYears = lockInPeriod ? parseLockInPeriod(lockInPeriod) : null;
    const periodText = lockInYears ? ` Over ${lockInYears} Year${lockInYears > 1 ? 's' : ''} Lock-in` : '';
    
    if (savings > 0) {
        return `Save ${formatCurrency(Math.abs(savings))}${periodText}`;
    } else {
        return `Higher by ${formatCurrency(Math.abs(savings))}${periodText}`;
    }
}

function formatPercentage(rate) {
    return `${rate.toFixed(2)}%`;
}

// Calculate interest rate for a specific year - PRESERVED FROM ORIGINAL
function calculateInterestRate(pkg, year) {
    let rateType, operator, value;
    
    if (year === 'thereafter') {
        rateType = pkg.thereafter_rate_type;
        operator = pkg.thereafter_operator;
        value = pkg.thereafter_value;
    } else {
        rateType = pkg[`year${year}_rate_type`];
        operator = pkg[`year${year}_operator`];
        value = pkg[`year${year}_value`];
    }

    // NEW LOGIC: If no data for this year, use thereafter rate
    if (!rateType || value === null || value === undefined) {
        if (pkg.thereafter_rate_type && pkg.thereafter_value !== null && pkg.thereafter_value !== undefined) {
            return calculateInterestRate(pkg, 'thereafter');
        }
        return 0;
    }

    // Original calculation logic
    if (rateType === 'FIXED') {
        return parseFloat(value) || 0;
    } else {
        // Find the reference rate
        const referenceRate = rateTypes.find(rt => rt.rate_type === rateType);
        if (!referenceRate) {
            console.warn(`❌ Reference rate type not found: ${rateType}`);
            return 0;
        }

        const baseRate = parseFloat(referenceRate.rate_value) || 0;
        const adjustment = parseFloat(value) || 0;
        
        if (operator === '+') {
            return baseRate + adjustment;
        } else if (operator === '-') {
            return Math.max(0, baseRate - adjustment);
        } else {
            return baseRate;
        }
    }
}

// Format rate display for tables - PRESERVED FROM ORIGINAL
function formatRateDisplay(pkg, year) {
    let rateType, operator, value;
    
    if (year === 'thereafter') {
        rateType = pkg.thereafter_rate_type;
        operator = pkg.thereafter_operator;
        value = pkg.thereafter_value;
    } else {
        rateType = pkg[`year${year}_rate_type`];
        operator = pkg[`year${year}_operator`];
        value = pkg[`year${year}_value`];
    }

    // NEW LOGIC: If no data for this year, use thereafter rate
    if (!rateType || value === null || value === undefined) {
        // Check if thereafter rate exists
        if (pkg.thereafter_rate_type && pkg.thereafter_value !== null && pkg.thereafter_value !== undefined) {
            const thereafterType = pkg.thereafter_rate_type;
            const thereafterOp = pkg.thereafter_operator;
            const thereafterVal = pkg.thereafter_value;
            
            if (thereafterType === 'FIXED') {
                const rate = parseFloat(thereafterVal) || 0;
                return `${formatPercentage(rate)} Fixed`;
            } else {
                const operatorSymbol = thereafterOp === '+' ? '+' : '-';
                return `${thereafterType} ${operatorSymbol} ${parseFloat(thereafterVal).toFixed(2)}%`;
            }
        }
        return '-'; // Only show dash if no thereafter rate exists
    }

    // Original logic for years with actual data
    if (rateType === 'FIXED') {
        const rate = calculateInterestRate(pkg, year);
        return `${formatPercentage(rate)} Fixed`;
    } else {
        const operatorSymbol = operator === '+' ? '+' : '-';
        return `${rateType} ${operatorSymbol} ${parseFloat(value).toFixed(2)}%`;
    }
}

// Enhanced rate display with reference rate values
function formatDetailedRateDisplay(pkg, year) {
    let rateType, operator, value;
    
    if (year === 'thereafter') {
        rateType = pkg.thereafter_rate_type;
        operator = pkg.thereafter_operator;
        value = pkg.thereafter_value;
    } else {
        rateType = pkg[`year${year}_rate_type`];
        operator = pkg[`year${year}_operator`];
        value = pkg[`year${year}_value`];
    }

    if (!rateType || value === null || value === undefined) return '-';

    if (rateType === 'FIXED') {
        const rate = calculateInterestRate(pkg, year);
        return `FIXED ${formatPercentage(rate)}`;
    } else {
        // Find the reference rate from rateTypes
        const referenceRate = rateTypes.find(rt => rt.rate_type === rateType);
        const referenceRateValue = referenceRate ? parseFloat(referenceRate.rate_value) || 0 : 0;
        
        const operatorSymbol = operator === '+' ? '+' : '-';
        const spreadValue = parseFloat(value) || 0;
        
        return `${rateType}(${referenceRateValue.toFixed(2)}%) ${operatorSymbol} ${spreadValue.toFixed(2)}%`;
    }
}

// ===================================
// DISPLAY FUNCTIONS - ENHANCED UI WITH PRESERVED LOGIC
// ===================================
// Modified displayResults function to prevent page jumping on live filter
function displayResults(packages, shouldScroll = true) {
    const resultsContainer = document.getElementById('resultsContainer');
    const packagesContainer = document.getElementById('packagesContainer');
    const resultsCount = document.getElementById('resultsCount');
    const noResults = document.getElementById('noResults');

    // Safety checks for DOM elements
    if (!resultsContainer) {
        console.error('❌ Results container not found');
        return;
    }
    
    if (!packagesContainer) {
        console.error('❌ Packages container not found');
        return;
    }

    // Show results container first
    resultsContainer.classList.remove('hidden');

    // Update results count safely
    if (resultsCount) {
        resultsCount.textContent = packages.length;
    }

    if (packages.length === 0) {
        packagesContainer.innerHTML = '';
        if (noResults) {
            noResults.style.display = 'block';
        }
    } else {
        if (noResults) {
            noResults.style.display = 'none';
        }
        
        // Add loading state with fade-in animation (only for initial search)
        if (shouldScroll) {
            packagesContainer.style.opacity = '0';
        }
        
        packagesContainer.innerHTML = packages.map((pkg, index) => createPackageCard(pkg, index)).join('');
        
        // Animate cards in with staggered effect (only for initial search)
        if (shouldScroll) {
            setTimeout(() => {
                packagesContainer.style.transition = 'opacity 0.6s ease';
                packagesContainer.style.opacity = '1';
                
                // Stagger animation for each card
                const cards = packagesContainer.querySelectorAll('.package-card');
                cards.forEach((card, index) => {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(30px)';
                    card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                    
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, index * 150);
                });
            }, 100);
        } else {
            // For live filtering, just ensure opacity is 1
            packagesContainer.style.opacity = '1';
        }
        
        // Update the results subtitle to show selection info
        const resultsTitle = document.querySelector('.results-title');
        if (resultsTitle) {
            const selectedCount = packages.filter(pkg => pkg.selected !== false).length;
            resultsTitle.innerHTML = `
                <i data-lucide="trending-up"></i>
                Recommended Packages
                <span class="results-count">${packages.length}</span>
                <small class="selection-count">
                    (${selectedCount} selected for report)
                </small>
            `;
        }
    }

    // Only scroll to results on initial search, not live filtering
    if (shouldScroll) {
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Re-initialize Lucide icons for dynamically added content
    setTimeout(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, 100);
}

function createPackageCard(pkg, index) {
    const rank = index + 1;
    const rateSchedule = generateRateSchedule(pkg);
    const features = generatePackageFeatures(pkg);
    
    return `
        <div class="package-card" data-package-index="${index}">
            <div class="package-selection">
                <input type="checkbox" 
                       id="pkg-select-${index}" 
                       class="selection-checkbox" 
                       onchange="togglePackageSelection(${index})"
                       ${pkg.selected !== false ? 'checked' : ''}>
            </div>
            
            <div class="package-header">
                <div class="package-rank">${rank}</div>
                <div class="package-bank">
                    <div class="bank-name">${pkg.bank_name}</div>
                    <div class="package-type">${pkg.rate_type_category || 'Rate Package'}</div>
                </div>
                <div class="package-details-inline">
                    <div class="detail-inline">
                        <span class="detail-label-inline">Property:</span>
                        <span class="detail-value-inline">${pkg.property_type}</span>
                    </div>
                    <div class="detail-inline">
                        <span class="detail-label-inline">Status:</span>
                        <span class="detail-value-inline">${pkg.property_status}</span>
                    </div>
                    <div class="detail-inline">
                        <span class="detail-label-inline">Buy Under:</span>
                        <span class="detail-value-inline">${pkg.buy_under}</span>
                    </div>
                    <div class="detail-inline">
                        <span class="detail-label-inline">Lock:</span>
                        <span class="detail-value-inline">${pkg.lock_period || 'No Lock-in'}</span>
                    </div>
                    <div class="detail-inline">
                        <span class="detail-label-inline">Min Loan:</span>
                        <span class="detail-value-inline">${formatCurrency(pkg.minimum_loan_size || 0)}</span>
                    </div>
                    ${pkg.totalSavings ? `
                    <div class="total-savings-compact ${pkg.totalSavings > 0 ? '' : 'negative'}">
                        ${formatSavings(pkg.totalSavings, pkg.lock_period)}
                    </div>
                ` : ''}
                </div>
                <div class="rate-info">
                    <div class="avg-rate">${formatPercentage(pkg.avgFirst2Years)}</div>
                    <div class="monthly-payment">${formatCurrency(pkg.monthlyInstallment)}/mo</div>
                </div>
            </div>

           
            ${rateSchedule ? `
                <div class="rate-schedule">
                    <div class="rate-schedule-title">
                        <i data-lucide="trending-up"></i>
                        Interest Rate Schedule
                    </div>
                    <div class="rate-schedule-grid">
                        ${rateSchedule}
                    </div>
                </div>
            ` : ''}

            <!-- Package Features Selector -->
            <div class="package-features-editor">
                <div class="features-editor-title">
                    <i data-lucide="check-square"></i>
                    Package Features (Editable)
                </div>
                <div class="features-checkboxes" id="features-${index}">
                    <label class="feature-checkbox">
                        <input type="checkbox" 
                               value="legal_fee_subsidy" 
                               onchange="updatePackageFeature(${index}, 'legal_fee_subsidy', this.checked)"
                               ${(pkg.legal_fee_subsidy === 'true' || pkg.legal_fee_subsidy === true) ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        Legal Fee Subsidy
                    </label>
                    <label class="feature-checkbox">
                        <input type="checkbox" 
                               value="cash_rebate" 
                               onchange="updatePackageFeature(${index}, 'cash_rebate', this.checked)"
                               ${(pkg.cash_rebate === 'true' || pkg.cash_rebate === true) ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        Cash Rebate
                    </label>
                    <label class="feature-checkbox">
                        <input type="checkbox" 
                               value="free_package_conversion_12m" 
                               onchange="updatePackageFeature(${index}, 'free_package_conversion_12m', this.checked)"
                               ${(pkg.free_package_conversion_12m === 'true' || pkg.free_package_conversion_12m === true) ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        Free Conversion (12M)
                    </label>
                    <label class="feature-checkbox">
                        <input type="checkbox" 
                               value="free_package_conversion_24m" 
                               onchange="updatePackageFeature(${index}, 'free_package_conversion_24m', this.checked)"
                               ${(pkg.free_package_conversion_24m === 'true' || pkg.free_package_conversion_24m === true) ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        Free Conversion (24M)
                    </label>
                    <label class="feature-checkbox">
                        <input type="checkbox" 
                               value="valuation_subsidy" 
                               onchange="updatePackageFeature(${index}, 'valuation_subsidy', this.checked)"
                               ${(pkg.valuation_subsidy === 'true' || pkg.valuation_subsidy === true) ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        Valuation Subsidy
                    </label>
                    <label class="feature-checkbox">
                        <input type="checkbox" 
                               value="partial_repayment" 
                               onchange="updatePackageFeature(${index}, 'partial_repayment', this.checked)"
                               ${(pkg.partial_repayment === 'true' || pkg.partial_repayment === true) ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        Partial Repayment
                    </label>
                    <label class="feature-checkbox">
                        <input type="checkbox" 
                               value="waiver_due_to_sales" 
                               onchange="updatePackageFeature(${index}, 'waiver_due_to_sales', this.checked)"
                               ${(pkg.waiver_due_to_sales === 'true' || pkg.waiver_due_to_sales === true) ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        Waiver Due to Sales
                    </label>
                </div>
            </div>

            <div class="package-remarks-editor">
                <div class="remarks-editor-title">
                    <i data-lucide="edit"></i>
                    Client Remarks (Editable)
                </div>
                <textarea 
                    class="remarks-textarea" 
                    id="remarks-${pkg.id || index}" 
                    placeholder="Add custom remarks for this package..."
                    onchange="updatePackageRemarks(${index}, this.value)"
                >${pkg.custom_remarks || pkg.remarks || ''}</textarea>
            </div>
        </div>
    `;
}

function generateRateSchedule(pkg) {
    const rates = [];
    
    // Always show Years 1-5 (auto-populate empty years with thereafter rate)
    for (let year = 1; year <= 5; year++) {
        let rateType, operator, value;
        
        // Check if this year has actual data
        rateType = pkg[`year${year}_rate_type`];
        operator = pkg[`year${year}_operator`];
        value = pkg[`year${year}_value`];
        
        // If no data for this year, check if we can use thereafter rate
        if (!rateType || value === null || value === undefined) {
            // Use thereafter rate if available
            if (pkg.thereafter_rate_type && pkg.thereafter_value !== null && pkg.thereafter_value !== undefined) {
                rates.push(`
                    <div class="rate-item">
                        <div class="rate-period">Year ${year}</div>
                        <div class="rate-value">${formatDetailedRateDisplay(pkg, 'thereafter')}</div>
                    </div>
                `);
            } else {
                // Only show dash if no thereafter rate exists
                rates.push(`
                    <div class="rate-item">
                        <div class="rate-period">Year ${year}</div>
                        <div class="rate-value">-</div>
                    </div>
                `);
            }
        } else {
            // Show actual data for this year
            rates.push(`
                <div class="rate-item">
                    <div class="rate-period">Year ${year}</div>
                    <div class="rate-value">${formatDetailedRateDisplay(pkg, year)}</div>
                </div>
            `);
        }
    }

    // Always show thereafter row
    const thereafterRate = calculateInterestRate(pkg, 'thereafter');
    if (thereafterRate > 0) {
        rates.push(`
            <div class="rate-item">
                <div class="rate-period">Thereafter</div>
                <div class="rate-value">${formatDetailedRateDisplay(pkg, 'thereafter')}</div>
            </div>
        `);
    }

    return rates.length > 0 ? rates.join('') : null;
}

function generatePackageFeatures(pkg) {
    const features = [];
    
    if (pkg.legal_fee_subsidy === 'true' || pkg.legal_fee_subsidy === true) {
        features.push(`
            <div class="feature-tag">
                <i data-lucide="shield"></i>
                Legal Fee Subsidy
            </div>
        `);
    }
    
    if (pkg.cash_rebate === 'true' || pkg.cash_rebate === true) {
        features.push(`
            <div class="feature-tag">
                <i data-lucide="dollar-sign"></i>
                Cash Rebate
            </div>
        `);
    }
    
    if (pkg.free_package_conversion_12m === 'true' || pkg.free_package_conversion_12m === true) {
        features.push(`
            <div class="feature-tag">
                <i data-lucide="repeat"></i>
                Free Conversion (12M)
            </div>
        `);
    }

    if (pkg.free_package_conversion_24m === 'true' || pkg.free_package_conversion_24m === true) {
        features.push(`
            <div class="feature-tag">
                <i data-lucide="repeat"></i>
                Free Conversion (24M)
            </div>
        `);
    }

    return features.length > 0 ? features.join('') : null;
}

// ===================================
// UTILITY FUNCTIONS - PRESERVED FROM ORIGINAL
// ===================================
function formatPercentage(value) {
    if (value == null || value === 0) return 'N/A';
    return `${value.toFixed(2)}%`;
}

function formatCurrency(value) {
    if (!value || value === 0) return '$0';
    return new Intl.NumberFormat('en-SG', {
        style: 'currency',
        currency: 'SGD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Clear all filters - PRESERVED FROM ORIGINAL
function clearFilters() {
    document.getElementById('propertyType').value = '';
    document.getElementById('propertyStatus').value = '';
    document.getElementById('buyUnder').value = '';
    document.getElementById('loanAmount').value = '';
    document.getElementById('loanTenure').value = '';
    
    // Clear results
    document.getElementById('resultsContainer').style.display = 'none';
    currentResults = [];
    searchCriteria = {};
}

// Download packages list - PRESERVED FROM ORIGINAL
function downloadPackagesList() {
    if (!currentResults.length) {
        showNotification('No results to download. Please search for packages first.', 'error');
        return;
    }

    generateProfessionalReport();
}

// ===================================
// PACKAGE SELECTION MANAGEMENT
// ===================================
function togglePackageSelection(packageIndex) {
    const checkbox = document.getElementById(`pkg-select-${packageIndex}`);
    if (currentResults[packageIndex]) {
        currentResults[packageIndex].selected = checkbox.checked;
        console.log(`📋 Package ${packageIndex} selection:`, checkbox.checked);
        
        // Update selection count display
        updateSelectionCount();
    }
}

function updateSelectionCount() {
    const resultsSubtitle = document.querySelector('.results-title');
    if (resultsSubtitle && currentResults.length > 0) {
        const selectedCount = currentResults.filter(pkg => pkg.selected !== false).length;
        resultsSubtitle.innerHTML = `
            <i data-lucide="trending-up"></i>
            Recommended Packages
            <span class="results-count">${currentResults.length}</span>
            <small class="selection-count">
                (${selectedCount} selected for report)
            </small>
        `;
        
        // Re-initialize lucide icons
        setTimeout(() => {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 50);
    }
}

function toggleAllSelections() {
    const anySelected = currentResults.some(pkg => pkg.selected !== false);
    const newState = !anySelected;
    
    currentResults.forEach((pkg, index) => {
        pkg.selected = newState;
        const checkbox = document.getElementById(`pkg-select-${index}`);
        if (checkbox) {
            checkbox.checked = newState;
        }
    });
    
    updateSelectionCount();
    showNotification(newState ? 'All packages selected for report' : 'All packages deselected', 'info');
}

// ===================================
// PACKAGE REMARKS MANAGEMENT
// ===================================
function updatePackageRemarks(packageIndex, newRemarks) {
    if (currentResults[packageIndex]) {
        currentResults[packageIndex].custom_remarks = newRemarks;
        console.log(`📝 Updated remarks for package ${packageIndex}:`, newRemarks);
    }
}

// ===================================
// PACKAGE FEATURES MANAGEMENT
// ===================================
function updatePackageFeature(packageIndex, featureName, isChecked) {
    if (currentResults[packageIndex]) {
        currentResults[packageIndex][featureName] = isChecked;
        console.log(`✅ Updated feature "${featureName}" for package ${packageIndex}:`, isChecked);
    }
}

// ===================================
// CSV EXPORT FUNCTION
// ===================================
function exportCSV() {
    if (!currentResults.length) {
        showNotification('No results to export. Please search for packages first.', 'error');
        return;
    }

    const headers = [
        'Rank', 'Bank Name', 'Avg First 2 Years (%)', 'Monthly Installment', 'Property Type', 
        'Property Status', 'Buy Under', 'Rate Type', 'Lock Period', 'Min Loan Size', 'Custom Remarks'
    ];

    const csvContent = [
        headers.join(','),
        ...currentResults.map((pkg, index) => [
            index + 1,
            `"${pkg.bank_name}"`,
            pkg.avgFirst2Years.toFixed(3),
            pkg.monthlyInstallment.toFixed(2),
            `"${pkg.property_type}"`,
            `"${pkg.property_status}"`,
            `"${pkg.buy_under}"`,
            `"${pkg.rate_type_category}"`,
            `"${pkg.lock_period || 'No Lock-in'}"`,
            (pkg.minimum_loan_size || 0),
            `"${(pkg.custom_remarks || pkg.remarks || '').replace(/"/g, '""')}"`
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const filename = `mortgage_recommendations_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Data exported successfully', 'success');
}

// ===================================
// SIGN OUT FUNCTIONS - PRESERVED FROM ORIGINAL  
// ===================================
function confirmSignOut() {
    if (confirm('Are you sure you want to sign out?')) {
        performSignOut();
    }
}

async function performSignOut() {
    try {
        showLoading('Signing out...');
        
        if (typeof AuthService !== 'undefined') {
            const { success } = await AuthService.signOut();
            if (!success) {
                console.warn('Sign out service failed, but continuing...');
            }
        }
        
        // Clear any stored data
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to login
        window.location.href = 'login.html';
        
    } catch (error) {
        console.error('Sign out error:', error);
        showNotification('Sign out failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ===================================
// LOADING AND NOTIFICATION FUNCTIONS - PRESERVED FROM ORIGINAL
// ===================================
function showLoading(message = 'Loading...') {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = loadingOverlay.querySelector('.loading-message');
    if (loadingText) loadingText.textContent = message;
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // You can implement a proper notification system here
}

// ===================================
// MODAL FUNCTIONS
// ===================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// ===================================
// SIDEBAR FUNCTIONS - PRESERVED FROM ORIGINAL
// ===================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    sidebar?.classList.toggle('open');
    overlay?.classList.toggle('active');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    sidebar?.classList.remove('open');
    overlay?.classList.remove('active');
}