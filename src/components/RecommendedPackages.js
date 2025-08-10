import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Home, 
  Repeat, 
  Briefcase, 
  RotateCcw, 
  CheckSquare, 
  FileText, 
  Download, 
  TrendingUp,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/EnhancedAuthContext';
import { AuthService } from '../utils/supabase';
import logger from '../utils/logger';

const RecommendedPackages = () => {
  const { user } = useAuth();
  
  // State management for all functionality
  const [selectedLoanType, setSelectedLoanType] = useState('New Home Loan');
  const [searchForm, setSearchForm] = useState({
    propertyType: '',
    propertyStatus: '',
    buyUnder: '',
    loanAmount: '',
    loanTenure: '',
    existingInterestRate: '',
    existingBank: '',
    rateType: '',
    lockPeriod: ''
  });
  
  const [selectedBanks, setSelectedBanks] = useState([]);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [allPackages, setAllPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [rateTypes, setRateTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [clientName, setClientName] = useState('');
  const [hideBankNames, setHideBankNames] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState(new Set());
  
  // Multi-select dropdown states
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [showFeaturesDropdown, setShowFeaturesDropdown] = useState(false);
  
  // Refs for dropdowns
  const bankDropdownRef = useRef(null);
  const featuresDropdownRef = useRef(null);
  
  // Available options
  const bankOptions = [
    'CIMB', 'OCBC', 'UOB', 'DBS', 'MBB', 'SCB', 
    'HSBC', 'SBI', 'BOC', 'HLF', 'SF', 'RHB', 'SIF', 'Citibank'
  ];
  
  const featureOptions = [
    { value: 'legal_fee_subsidy', label: 'Legal Fee Subsidy' },
    { value: 'cash_rebate', label: 'Cash Rebate' },
    { value: 'free_package_conversion_12m', label: 'Free Conversion (12M)' },
    { value: 'free_package_conversion_24m', label: 'Free Conversion (24M)' },
    { value: 'valuation_subsidy', label: 'Valuation Subsidy' },
    { value: 'partial_repayment', label: 'Partial Repayment' },
    { value: 'waiver_due_to_sales', label: 'Waiver Due to Sales' }
  ];

  // Load only rate types on component mount (lightweight)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Only load rate types initially - don't load packages until filters applied
        if (AuthService.getRateTypes) {
          const rateTypesResult = await AuthService.getRateTypes();
          if (rateTypesResult.success) {
            setRateTypes(rateTypesResult.data || []);
            logger.info(`Loaded ${rateTypesResult.data?.length || 0} rate types`);
          }
        } else {
          // Fallback rate types
          setRateTypes([
            { id: 1, rate_type: 'FIXED', rate_value: 0, name: 'Fixed', description: 'Fixed interest rate' },
            { id: 2, rate_type: 'SORA', rate_value: 3.29, name: 'SORA', description: 'Singapore Overnight Rate Average' }
          ]);
        }
      } catch (error) {
        logger.error('Error loading initial data:', error);
      }
    };
    
    loadInitialData();
  }, []);

  // EXACT calculation functions from recommended-packages-core.js
  const calculateNumericRate = useCallback((pkg, year) => {
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
      // Find the reference rate from global rateTypes
      const referenceRate = rateTypes.find(rt => rt.rate_type === rateType);
      if (!referenceRate) {
        logger.warn(`Reference rate type not found: ${rateType}`);
        return 0;
      }
      
      const referenceRateValue = parseFloat(referenceRate.rate_value) || 0;
      const spreadValue = parseFloat(value) || 0;
      
      return operator === '+' ? 
        referenceRateValue + spreadValue : 
        referenceRateValue - spreadValue;
    }
  }, [rateTypes]);

  const calculateAverageFirst2Years = useCallback((pkg) => {
    const year1Rate = calculateNumericRate(pkg, 1);
    const year2Rate = calculateNumericRate(pkg, 2);
    
    if (year1Rate === 0 && year2Rate === 0) return 0;
    if (year1Rate === 0) return year2Rate;
    if (year2Rate === 0) return year1Rate;
    
    return (year1Rate + year2Rate) / 2;
  }, [calculateNumericRate]);

  const calculateMonthlyInstallment = useCallback((principal, tenureYears, annualRate) => {
    if (!principal || !tenureYears || !annualRate) return 0;
    
    const monthlyRate = annualRate / 100 / 12;
    const totalMonths = tenureYears * 12;
    
    if (monthlyRate === 0) {
      return principal / totalMonths;
    }
    
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                         (Math.pow(1 + monthlyRate, totalMonths) - 1);
    
    return monthlyPayment;
  }, []);

  const searchPackages = useCallback(async () => {
    
    try {
      setLoading(true);
      logger.info('Searching packages with filters:', { 
        loanType: selectedLoanType, 
        form: searchForm,
        banks: selectedBanks,
        features: selectedFeatures 
      });

      let filtered = [...allPackages];

      // Apply loan type filter
      filtered = filtered.filter(pkg => pkg.loan_type === selectedLoanType);

      // Apply form filters
      if (searchForm.propertyType) {
        filtered = filtered.filter(pkg => pkg.property_type === searchForm.propertyType);
      }
      
      if (searchForm.propertyStatus) {
        filtered = filtered.filter(pkg => pkg.property_status === searchForm.propertyStatus);
      }
      
      if (searchForm.buyUnder) {
        filtered = filtered.filter(pkg => pkg.buy_under === searchForm.buyUnder);
      }

      // CRITICAL: Loan amount filter - exclude packages with minimum loan size higher than user's loan amount
      const loanAmount = parseFloat(searchForm.loanAmount) || 0;
      if (loanAmount > 0) {
        const beforeLoanFilter = filtered.length;
        filtered = filtered.filter(pkg => {
          // If package has minimum_loan_size and user's loan amount is less than minimum, exclude it
          if (pkg.minimum_loan_size && loanAmount < pkg.minimum_loan_size) {
            logger.info(`Excluding package ${pkg.banks?.name || pkg.bank_name} - ${pkg.package_name}: min loan ${pkg.minimum_loan_size} > user loan ${loanAmount}`);
            return false;
          }
          return true;
        });
        logger.info(`Loan amount filter: ${beforeLoanFilter} → ${filtered.length} packages (loan amount: ${loanAmount})`);
      }
      
      // Rate Type filter (matches HTML: formData.rateTypeFilter)
      if (searchForm.rateType) {
        filtered = filtered.filter(pkg => pkg.rate_type_category === searchForm.rateType);
      }
      
      // Lock-in Period filter (matches HTML: formData.lockPeriodFilter)
      if (searchForm.lockPeriod) {
        filtered = filtered.filter(pkg => {
          const pkgLockPeriod = pkg.lock_period || '0 Year';
          return pkgLockPeriod === searchForm.lockPeriod;
        });
      }

      // NEW: Exclude existing bank for refinancing (from HTML version)
      if (selectedLoanType === 'Refinancing Home Loan' && searchForm.existingBank) {
        filtered = filtered.filter(pkg => pkg.bank_name !== searchForm.existingBank);
      }

      // Apply bank filter (matches HTML: uses pkg.bank_name)
      if (selectedBanks.length > 0) {
        filtered = filtered.filter(pkg => selectedBanks.includes(pkg.bank_name));
      }

      // Apply feature filters
      if (selectedFeatures.length > 0) {
        filtered = filtered.filter(pkg => {
          return selectedFeatures.some(feature => {
            const featureValue = pkg[feature];
            return featureValue === 'true' || featureValue === true;
          });
        });
      }

      // Calculate metrics for each package - EXACT same logic as HTML
      filtered = filtered.map(pkg => {
        const avgFirst2Years = calculateAverageFirst2Years(pkg);
        const loanAmount = parseFloat(searchForm.loanAmount) || 500000;
        const loanTenure = parseInt(searchForm.loanTenure) || 25;
        const monthlyInstallment = calculateMonthlyInstallment(loanAmount, loanTenure, avgFirst2Years);
        
        return {
          ...pkg,
          avgFirst2Years,
          monthlyInstallment
        };
      });

      // Sort by average rate (lowest first) - same as HTML
      filtered.sort((a, b) => (a.avgFirst2Years || 0) - (b.avgFirst2Years || 0));

      setFilteredPackages(filtered);
      setShowResults(true);
      
      logger.info(`Found ${filtered.length} matching packages`);
      
    } catch (error) {
      logger.error('Error searching packages:', error);
      alert('Error searching packages. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedLoanType, searchForm, selectedBanks, selectedFeatures, allPackages, calculateAverageFirst2Years, calculateMonthlyInstallment]);

  // Auto-search when filters change - load packages on demand
  useEffect(() => {
    const hasFilters = 
      searchForm.propertyType || 
      searchForm.propertyStatus || 
      searchForm.buyUnder || 
      searchForm.loanAmount || 
      searchForm.loanTenure || 
      searchForm.rateType || 
      searchForm.lockPeriod || 
      selectedBanks.length > 0 || 
      selectedFeatures.length > 0;

    if (hasFilters) {
      // Add small delay to prevent too many calls while typing
      const debounceTimer = setTimeout(async () => {
        try {
          setLoading(true);
          
          // Load packages on demand if not already loaded
          if (allPackages.length === 0) {
            await loadData();
          }
          
          // Then search with current filters
          searchPackages();
        } catch (error) {
          logger.error('Error in auto-search:', error);
          setLoading(false);
        }
      }, 300);

      return () => clearTimeout(debounceTimer);
    } else {
      // Clear results if no filters are set
      setFilteredPackages([]);
      setShowResults(false);
    }
  }, [selectedLoanType, searchForm, selectedBanks, selectedFeatures, allPackages, searchPackages]);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bankDropdownRef.current && !bankDropdownRef.current.contains(event.target)) {
        setShowBankDropdown(false);
      }
      if (featuresDropdownRef.current && !featuresDropdownRef.current.contains(event.target)) {
        setShowFeaturesDropdown(false);
      }
    };

    if (showBankDropdown || showFeaturesDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBankDropdown, showFeaturesDropdown]);

  // Show/hide refinancing fields based on loan type
  useEffect(() => {
    if (selectedLoanType === 'Refinancing Home Loan') {
      // Show refinancing-specific fields
    } else {
      // Hide refinancing-specific fields and clear values
      setSearchForm(prev => ({
        ...prev,
        existingInterestRate: '',
        existingBank: ''
      }));
    }
  }, [selectedLoanType]);

  const loadData = async () => {
    try {
      setLoading(true);
      logger.info('Loading recommended packages data...');
      
      // Use AuthService for compatibility with login system (same Supabase connection)
      if (AuthService.getRatePackages) {
        const packagesResult = await AuthService.getRatePackages();
        
        if (packagesResult.success) {
          const packages = packagesResult.data || [];
          setAllPackages(packages);
          setFilteredPackages([]); // Don't show packages until search
          setShowResults(false); // Don't show results until search
          logger.info(`Loaded ${packages.length} packages from AuthService`);
        } else {
          logger.error('Failed to load packages:', packagesResult.error);
          setAllPackages([]);
          setFilteredPackages([]);
          setShowResults(false);
        }
      } else {
        logger.warn('getRatePackages method not available, using fallback data');
        // Will fall through to the catch block to use mock data
        throw new Error('getRatePackages method not available');
      }
      
      // Load rate types using AuthService - fallback if method doesn't exist
      try {
        if (AuthService.getRateTypes) {
          const rateTypesResult = await AuthService.getRateTypes();
          if (rateTypesResult.success) {
            setRateTypes(rateTypesResult.data || []);
          }
        } else {
          // Fallback rate types if method doesn't exist
          setRateTypes([
            { id: 1, rate_type: 'FIXED', rate_value: 0, name: 'Fixed', description: 'Fixed interest rate' },
            { id: 2, rate_type: 'SORA', rate_value: 3.29, name: 'SORA', description: 'Singapore Overnight Rate Average' }
          ]);
        }
      } catch (rateError) {
        logger.warn('Failed to load rate types, using fallback:', rateError);
        setRateTypes([
          { id: 1, rate_type: 'FIXED', rate_value: 0, name: 'Fixed', description: 'Fixed interest rate' },
          { id: 2, rate_type: 'SORA', rate_value: 3.29, name: 'SORA', description: 'Singapore Overnight Rate Average' }
        ]);
      }
      
    } catch (error) {
      logger.error('Error loading data:', error);
      // In case of database error, show message to user but don't block UI
      logger.warn('Unable to load packages data from database, using fallback');
      
      // Fallback to mock data
      const mockPackages = [
        {
          id: 1,
          banks: { name: 'OCBC', is_active: true },
          bank_name: 'OCBC',
          package_name: 'HomeSecure Package',
          interest_rate: 3.25,
          rate_type: 'Fixed',
          lock_period: '2 Years',
          property_type: 'Private Property',
          property_status: 'Completed',
          loan_type: 'New Home Loan',
          cash_rebate: 0.8,
          legal_fee_subsidy: true,
          valuation_subsidy: true,
          partial_repayment: false
        }
      ];
      
      setAllPackages(mockPackages);
      setFilteredPackages([]); // Don't show fallback packages until search
      setShowResults(false); // Don't show results until search
      setRateTypes([
        { id: 1, name: 'Fixed', description: 'Fixed interest rate' },
        { id: 2, name: 'Floating', description: 'Variable interest rate' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoanTypeSelect = (loanType) => {
    setSelectedLoanType(loanType);
    logger.info(`Selected loan type: ${loanType}`);
  };

  const handleInputChange = useCallback((field, value) => {
    setSearchForm(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleBankSelection = useCallback((bank, isSelected) => {
    if (isSelected) {
      setSelectedBanks(prev => [...prev, bank]);
    } else {
      setSelectedBanks(prev => prev.filter(b => b !== bank));
    }
  }, []);

  const handleFeatureSelection = useCallback((feature, isSelected) => {
    if (isSelected) {
      setSelectedFeatures(prev => [...prev, feature]);
    } else {
      setSelectedFeatures(prev => prev.filter(f => f !== feature));
    }
  }, []);

  const formatCurrency = (value) => {
    if (!value || value === 0) return '$0';
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value) => {
    if (value == null || value === 0) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  const toggleAllBanks = () => {
    if (selectedBanks.length === bankOptions.length) {
      setSelectedBanks([]);
    } else {
      setSelectedBanks([...bankOptions]);
    }
  };

  const toggleAllFeatures = () => {
    const allFeatureValues = featureOptions.map(f => f.value);
    if (selectedFeatures.length === allFeatureValues.length) {
      setSelectedFeatures([]);
    } else {
      setSelectedFeatures([...allFeatureValues]);
    }
  };

  const clearAllFilters = () => {
    setSearchForm({
      propertyType: '',
      propertyStatus: '',
      buyUnder: '',
      loanAmount: '',
      loanTenure: '',
      existingInterestRate: '',
      existingBank: '',
      rateType: '',
      lockPeriod: ''
    });
    setSelectedBanks([]);
    setSelectedFeatures([]);
    setShowResults(false);
    setFilteredPackages([]);
    setSelectedPackages(new Set());
    logger.info('All filters cleared');
  };

  const togglePackageSelection = (packageId) => {
    setSelectedPackages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(packageId)) {
        newSet.delete(packageId);
      } else {
        newSet.add(packageId);
      }
      return newSet;
    });
  };

  const toggleAllPackages = () => {
    if (selectedPackages.size === filteredPackages.length) {
      setSelectedPackages(new Set());
    } else {
      setSelectedPackages(new Set(filteredPackages.map(pkg => pkg.id)));
    }
  };

  const exportCSV = () => {
    try {
      const packagesToExport = selectedPackages.size > 0 
        ? filteredPackages.filter(pkg => selectedPackages.has(pkg.id))
        : filteredPackages;

      if (packagesToExport.length === 0) {
        alert('No packages to export. Please select packages or search first.');
        return;
      }

      const csvHeaders = [
        'Bank', 'Package Name', 'Interest Rate (%)', 'Rate Type', 
        'Lock Period', 'Property Type', 'Cash Rebate (%)', 
        'Legal Fee Subsidy', 'Valuation Subsidy'
      ];

      const csvRows = packagesToExport.map(pkg => [
        hideBankNames ? 'Bank A' : (pkg.banks?.name || pkg.bank_name || ''),
        pkg.package_name || '',
        pkg.interest_rate || '',
        pkg.rate_type || '',
        pkg.lock_period || '',
        pkg.property_type || '',
        pkg.cash_rebate || '',
        pkg.legal_fee_subsidy ? 'Yes' : 'No',
        pkg.valuation_subsidy ? 'Yes' : 'No'
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `recommended-packages-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      logger.info(`Exported ${packagesToExport.length} packages to CSV`);
    } catch (error) {
      logger.error('Error exporting CSV:', error);
      alert('Error exporting CSV. Please try again.');
    }
  };

  // Update package feature in filteredPackages state
  const updatePackageFeature = (packageIndex, featureName, isChecked) => {
    setFilteredPackages(prevPackages => {
      const updated = [...prevPackages];
      if (updated[packageIndex]) {
        updated[packageIndex][featureName] = isChecked;
      }
      return updated;
    });
  };

  // Update package remarks in filteredPackages state
  const updatePackageRemarks = (packageIndex, newRemarks) => {
    setFilteredPackages(prevPackages => {
      const updated = [...prevPackages];
      if (updated[packageIndex]) {
        updated[packageIndex].custom_remarks = newRemarks;
      }
      return updated;
    });
  };

  // EXACT rate calculation functions from HTML version
  const calculateInterestRate = (pkg, year) => {
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
        return calculateInterestRate(pkg, 'thereafter');
      }
      return 0;
    }

    if (rateType === 'FIXED') {
      return parseFloat(value) || 0;
    } else {
      // Find the reference rate
      const referenceRate = rateTypes.find(rt => rt.rate_type === rateType);
      if (!referenceRate) {
        logger.warn(`Reference rate type not found: ${rateType}`);
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
  };

  // Format rate display for rate schedule
  const formatRateDisplay = (pkg, year) => {
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
      return '-';
    }

    if (rateType === 'FIXED') {
      const rate = calculateInterestRate(pkg, year);
      return `${formatPercentage(rate)} Fixed`;
    } else {
      const operatorSymbol = operator === '+' ? '+' : '-';
      return `${rateType} ${operatorSymbol} ${parseFloat(value).toFixed(2)}%`;
    }
  };

  // Enhanced PDF Generation matching HTML version functionality
  const generateProfessionalReport = () => {
    try {
      if (filteredPackages.length === 0) {
        alert('No results to generate report. Please search for packages first.');
        return;
      }

      // Get selected packages or default to top 3
      const packagesToExport = selectedPackages.size > 0 
        ? filteredPackages.filter(pkg => selectedPackages.has(pkg.id)).slice(0, 3)
        : filteredPackages.slice(0, 3);

      if (packagesToExport.length === 0) {
        alert('Please select at least one package for the report.');
        return;
      }

      // Helper functions for PDF generation
      const formatCurrency = (amount) => {
        if (!amount || amount === 0) return 'SGD 0';
        return `SGD ${parseFloat(amount).toLocaleString('en-SG', { maximumFractionDigits: 0 })}`;
      };

      const calculateInterestRate = (pkg, year) => {
        if (!pkg) return 0;
        
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

        // Auto-populate with thereafter rate if no specific year data
        if (!rateType || value === null || value === undefined) {
          if (pkg.thereafter_rate_type && pkg.thereafter_value !== null && pkg.thereafter_value !== undefined) {
            return calculateInterestRate(pkg, 'thereafter');
          }
          return 0;
        }

        if (rateType === 'FIXED') {
          return parseFloat(value) || 0;
        } else {
          // For floating rates - use reference rate + spread
          const referenceRateValue = rateType.includes('SORA') ? 3.50 : 3.25; // Default rates
          const spreadValue = parseFloat(value) || 0;
          return operator === '+' ? referenceRateValue + spreadValue : referenceRateValue - spreadValue;
        }
      };

      const calculateMonthlyInstallment = (loanAmount, tenureYears, interestRate) => {
        const monthlyRate = interestRate / 100 / 12;
        const totalMonths = tenureYears * 12;
        
        if (monthlyRate === 0) return loanAmount / totalMonths;
        
        return (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
               (Math.pow(1 + monthlyRate, totalMonths) - 1);
      };

      const calculateMonthlySavings = (loanAmount, tenureYears, currentRate, newRate) => {
        const currentPayment = calculateMonthlyInstallment(loanAmount, tenureYears, currentRate);
        const newPayment = calculateMonthlyInstallment(loanAmount, tenureYears, newRate);
        return currentPayment - newPayment;
      };

      const calculateTotalSavings = (monthlySavings, lockPeriod) => {
        const lockYears = lockPeriod ? (lockPeriod.includes('Year') ? parseInt(lockPeriod) : parseInt(lockPeriod)) : 2;
        return monthlySavings * 12 * lockYears;
      };

      const calculateAverageFirst2Years = (pkg) => {
        const year1Rate = calculateInterestRate(pkg, 1);
        const year2Rate = calculateInterestRate(pkg, 2);
        return (year1Rate + year2Rate) / 2;
      };

      const formatDetailedRateDisplay = (pkg, year) => {
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

        // Auto-populate with thereafter rate if no specific year data
        if (!rateType || value === null || value === undefined) {
          if (pkg.thereafter_rate_type && pkg.thereafter_value !== null && pkg.thereafter_value !== undefined) {
            return formatDetailedRateDisplay(pkg, 'thereafter');
          }
          return '-';
        }

        if (rateType === 'FIXED') {
          const rate = calculateInterestRate(pkg, year);
          return `${rate.toFixed(2)}%\nFIXED`;
        } else {
          const referenceRateValue = rateType.includes('SORA') ? 3.50 : 3.25;
          const spreadValue = parseFloat(value) || 0;
          const totalRate = calculateInterestRate(pkg, year);
          
          const operatorSymbol = operator === '+' ? '+' : '-';
          return `${totalRate.toFixed(2)}%\n${rateType}(${referenceRateValue.toFixed(2)}%) ${operatorSymbol} ${spreadValue.toFixed(2)}%`;
        }
      };

      // Calculate package data with enhanced metrics
      const enhancedPackages = packagesToExport.map(pkg => {
        const avgFirst2Years = calculateAverageFirst2Years(pkg);
        const loanAmount = searchForm.loanAmount ? parseFloat(searchForm.loanAmount) : 500000;
        const loanTenure = searchForm.loanTenure ? parseInt(searchForm.loanTenure) : 25;
        const monthlyInstallment = calculateMonthlyInstallment(loanAmount, loanTenure, avgFirst2Years);
        
        let monthlySavings = 0;
        let totalSavings = 0;
        
        // Calculate savings for refinancing
        if (selectedLoanType === 'Refinancing Home Loan') {
          const existingRate = searchForm.existingInterestRate ? parseFloat(searchForm.existingInterestRate) : 0;
          if (existingRate > 0) {
            monthlySavings = calculateMonthlySavings(loanAmount, loanTenure, existingRate, avgFirst2Years);
            totalSavings = calculateTotalSavings(monthlySavings, pkg.lock_period);
          }
        }
        
        return {
          ...pkg,
          avgFirst2Years,
          monthlyInstallment,
          monthlySavings,
          totalSavings
        };
      });

      // Create comprehensive PDF content matching HTML version
      const reportDate = new Date().toLocaleDateString('en-SG', {
        day: 'numeric',
        month: 'short', 
        year: 'numeric'
      });

      const yearsToShow = [1, 2, 3, 4, 5];

      const reportContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>KeyQuest Mortgage Report</title>
          <meta charset="UTF-8">
          <style>
            @page { margin: 0.4in 0.3in; size: A4; }
            @media print {
              @page { margin: 0.4in 0.3in; size: A4; }
              body { margin: 0 !important; padding: 0 !important; }
              .no-print, header, footer { display: none !important; }
            }
            
            * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; margin: 0; padding: 0; background: white !important; color: #1a1a1a !important; }
            
            .pdf-report-container { padding: 20px !important; background: white !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; line-height: 1.4 !important; color: #1f2937 !important; max-width: none !important; margin: 0 auto !important; overflow: visible !important; }
            
            .pdf-header { display: flex !important; justify-content: space-between !important; align-items: center !important; margin: 0 0 15px 0 !important; padding: 5px 0 10px 0 !important; border-bottom: 2px solid #264A82 !important; height: 85px !important; overflow: visible !important; }
            .pdf-header .logo-section { height: 85px !important; display: flex !important; align-items: center !important; justify-content: flex-start !important; overflow: visible !important; flex-shrink: 0 !important; margin-left: -10px !important; }
            .pdf-header .logo-section img { height: 200px !important; width: auto !important; object-fit: contain !important; margin: 0 !important; padding: 0 !important; border: 0 !important; vertical-align: middle !important; display: block !important; max-width: 280px !important; }
            .pdf-header .title-section { text-align: right !important; flex: 1 !important; margin-left: 30px !important; display: flex !important; flex-direction: column !important; justify-content: center !important; align-items: flex-end !important; }
            .pdf-header h1 { margin: 0 !important; font-size: 24px !important; font-weight: 800 !important; color: #1f2937 !important; letter-spacing: -0.5px !important; line-height: 1.2 !important; }
            .pdf-header .client-name { font-size: 16px !important; color: #6b7280 !important; margin: 2px 0 !important; font-weight: 500 !important; line-height: 1.2 !important; }
            
            .pdf-key-info { background: transparent !important; border: none !important; border-radius: 16px !important; padding: 8px !important; margin-top: 8px !important; margin-bottom: 8px !important; }
            .pdf-info-grid { display: grid !important; grid-template-columns: repeat(5, 1fr) !important; gap: 12px !important; align-items: stretch !important; padding: 6px !important; }
            .pdf-info-item { text-align: center !important; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; min-height: 65px !important; padding: 8px 6px !important; background: linear-gradient(135deg, #264A82 0%, #1e3a6f 100%) !important; border-radius: 8px !important; box-shadow: 0 2px 8px rgba(38, 74, 130, 0.25) !important; margin: 0 !important; }
            .pdf-info-label { color: white !important; margin-bottom: 4px !important; font-weight: 600 !important; font-size: 9px !important; text-transform: uppercase !important; letter-spacing: 0.3px !important; line-height: 1.1 !important; }
            .pdf-info-value { font-size: 12px !important; font-weight: 600 !important; color: white !important; line-height: 1.2 !important; margin: 0 !important; }
            
            .pdf-comparison-section { margin-bottom: 25px !important; }
            .pdf-comparison-title { font-size: 16px !important; font-weight: 700 !important; color: #264A82 !important; margin-bottom: 15px !important; text-align: left !important; }
            
            .pdf-comparison-table { width: 100% !important; border-collapse: collapse !important; background: white !important; border-radius: 12px !important; overflow: hidden !important; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important; table-layout: fixed !important; }
            .pdf-comparison-table thead { background: linear-gradient(135deg, #264A82 0%, #1e3a6f 100%) !important; }
            .pdf-comparison-table th { padding: 10px 6px !important; text-align: center !important; font-weight: 600 !important; font-size: 12px !important; color: white !important; text-transform: uppercase !important; letter-spacing: 0.3px !important; word-wrap: break-word !important; vertical-align: middle !important; }
            .pdf-comparison-table th:first-child { background: #1e3a6f !important; width: 25% !important; text-align: left !important; padding-left: 12px !important; }
            .pdf-comparison-table th:not(:first-child) { width: 25% !important; }
            .pdf-comparison-table th.recommended { background: #1e40af !important; position: relative !important; }
            .pdf-comparison-table th.recommended::after { content: 'RECOMMENDED' !important; position: absolute !important; bottom: -8px !important; left: 50% !important; transform: translateX(-50%) !important; background: #3b82f6 !important; color: white !important; font-size: 6px !important; padding: 2px 6px !important; border-radius: 3px !important; font-weight: 700 !important; white-space: nowrap !important; z-index: 10 !important; }
            
            .pdf-comparison-table tbody tr:nth-child(even) { background: #f8fafc !important; }
            .pdf-comparison-table td { padding: 8px 6px !important; text-align: center !important; border-bottom: 1px solid #e2e8f0 !important; font-size: 11px !important; line-height: 1.4 !important; word-wrap: break-word !important; vertical-align: top !important; max-width: 0 !important; }
            .pdf-comparison-table td:first-child { text-align: left !important; font-weight: 600 !important; color: #374151 !important; padding-left: 12px !important; white-space: nowrap !important; }
            .pdf-comparison-table td.recommended { background: rgba(38, 74, 130, 0.15) !important; font-weight: 600 !important; color: #264A82 !important; }
            .pdf-comparison-table td.rate-value { font-weight: 600 !important; color: #1d4ed8 !important; white-space: pre-line !important; }
            .pdf-comparison-table td.amount { color: #3b82f6 !important; font-weight: 600 !important; }
            .pdf-comparison-table td.period { color: #3b82f6 !important; font-weight: 600 !important; }
            .pdf-comparison-table td.features-cell { text-align: left !important; vertical-align: middle !important; font-size: 11px !important; line-height: 1.3 !important; padding: 8px 4px !important; word-wrap: break-word !important; }
            .pdf-comparison-table td.savings-cell { font-size: 11px !important; line-height: 1.2 !important; text-align: center !important; vertical-align: middle !important; white-space: pre-line !important; }
            
            ${selectedLoanType === 'Refinancing Home Loan' && searchForm.existingInterestRate ? `
            .pdf-savings-section { background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%) !important; border: 2px solid #264A82 !important; border-radius: 16px !important; padding: 20px !important; margin-bottom: 20px !important; margin-top: 15px !important; position: relative !important; }
            .pdf-savings-section::before { content: '💰' !important; position: absolute !important; top: 15px !important; left: 15px !important; font-size: 20px !important; }
            .pdf-savings-title { font-size: 16px !important; font-weight: 700 !important; color: #264A82 !important; margin-bottom: 15px !important; margin-left: 30px !important; }
            .pdf-savings-grid { display: flex !important; justify-content: space-between !important; align-items: stretch !important; gap: 30px !important; flex-wrap: wrap !important; padding: 10px 20px !important; }
            .pdf-savings-item { text-align: center !important; flex: 1 !important; min-width: 140px !important; display: flex !important; flex-direction: column !important; justify-content: center !important; align-items: center !important; }
            .pdf-savings-item .label { color: #6b7280 !important; font-size: 12px !important; margin-bottom: 6px !important; }
            .pdf-savings-item .value { font-size: 18px !important; font-weight: 700 !important; }
            .pdf-savings-item .value.current { color: #1d4ed8 !important; }
            .pdf-savings-item .value.new { color: #264A82 !important; }
            .pdf-savings-item .value.savings { color: #264A82 !important; font-size: 18px !important; font-weight: 800 !important; line-height: 1.3 !important; }
            .pdf-savings-item .sub-label { font-size: 11px !important; color: #6b7280 !important; margin-top: 4px !important; }
            ` : ''}
            
            /* Monthly Repayment Comparison Table Styles */
            .pdf-repayment-section { margin-bottom: 25px !important; page-break-inside: avoid !important; }
            .pdf-repayment-title { font-size: 16px !important; font-weight: 700 !important; color: #264A82 !important; margin-bottom: 15px !important; text-align: left !important; }
            .pdf-repayment-table { width: 100% !important; border-collapse: collapse !important; background: white !important; border-radius: 8px !important; overflow: hidden !important; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important; table-layout: fixed !important; margin-bottom: 15px !important; }
            .pdf-repayment-table thead { background: linear-gradient(135deg, #264A82 0%, #1e3a6f 100%) !important; }
            .pdf-repayment-table th { padding: 12px 8px !important; text-align: center !important; font-weight: 600 !important; font-size: 11px !important; color: white !important; text-transform: uppercase !important; letter-spacing: 0.3px !important; vertical-align: middle !important; }
            .pdf-repayment-table th.recommended { background: #1e40af !important; }
            
            /* Row styling for clean separation */
            .pdf-repayment-table .year-section { background: #f8fafc !important; }
            .pdf-repayment-table .mi-row { background: #ffffff !important; }
            .pdf-repayment-table .breakdown-row { background: #fafbfc !important; border-bottom: 2px solid #e2e8f0 !important; }
            
            .pdf-repayment-table td { padding: 8px 6px !important; text-align: center !important; border-bottom: 1px solid #f1f5f9 !important; font-size: 10px !important; line-height: 1.3 !important; vertical-align: middle !important; }
            .pdf-repayment-table td.year-cell { background: #264A82 !important; color: white !important; font-weight: 700 !important; font-size: 11px !important; writing-mode: horizontal-tb !important; }
            .pdf-repayment-table td.recommended { background: rgba(38, 74, 130, 0.1) !important; font-weight: 600 !important; color: #264A82 !important; }
            .pdf-repayment-table td.rate-value { font-weight: 600 !important; color: #1d4ed8 !important; }
            .pdf-repayment-table td.amount-value { font-weight: 600 !important; color: #059669 !important; }
            
            /* Breakdown cell styling */
            .pdf-repayment-table td.breakdown-cell { padding: 4px !important; vertical-align: top !important; }
            .breakdown-cell .principal-line, .breakdown-cell .interest-line { font-size: 8px !important; color: #6b7280 !important; margin: 2px 0 !important; }
            .breakdown-cell .principal-value { color: #10b981 !important; font-weight: 600 !important; font-size: 9px !important; margin-bottom: 4px !important; }
            .breakdown-cell .interest-value { color: #f59e0b !important; font-weight: 600 !important; font-size: 9px !important; }
            
            /* Monthly Repayment Breakdown Chart Styles */
            .pdf-chart-section { margin-bottom: 25px !important; page-break-inside: avoid !important; }
            .pdf-chart-title { font-size: 16px !important; font-weight: 700 !important; color: #264A82 !important; margin-bottom: 15px !important; text-align: left !important; }
            
            .chart-bars-container { display: flex !important; justify-content: center !important; align-items: flex-end !important; gap: 40px !important; padding: 20px !important; margin-bottom: 15px !important; }
            .chart-column { display: flex !important; flex-direction: column !important; align-items: center !important; }
            .chart-rate-header { font-size: 12px !important; font-weight: 700 !important; color: #264A82 !important; margin-bottom: 10px !important; }
            
            .chart-bar-stack { width: 80px !important; height: 200px !important; border-radius: 8px !important; overflow: hidden !important; display: flex !important; flex-direction: column !important; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important; margin-bottom: 10px !important; }
            
            .chart-bar-segment { display: flex !important; flex-direction: column !important; justify-content: center !important; align-items: center !important; color: white !important; position: relative !important; }
            .interest-segment { background: linear-gradient(135deg, #60a5fa 0%, #93c5fd 100%) !important; }
            .principal-segment { background: linear-gradient(135deg, #264A82 0%, #1e3a6f 100%) !important; }
            
            .chart-segment-label { font-size: 8px !important; font-weight: 600 !important; margin-bottom: 2px !important; text-shadow: 0 1px 2px rgba(0,0,0,0.3) !important; }
            .chart-segment-value { font-size: 7px !important; font-weight: 600 !important; text-shadow: 0 1px 2px rgba(0,0,0,0.3) !important; }
            
            .chart-package-label { font-size: 11px !important; font-weight: 700 !important; color: #374151 !important; margin-bottom: 2px !important; }
            .chart-total-value { font-size: 10px !important; font-weight: 700 !important; color: #264A82 !important; }
            
            /* Chart Legend Styles */
            .chart-legend { display: flex !important; justify-content: center !important; align-items: center !important; gap: 30px !important; margin-top: 15px !important; }
            .legend-item { display: flex !important; align-items: center !important; gap: 8px !important; }
            .legend-color { width: 16px !important; height: 16px !important; border-radius: 4px !important; }
            .principal-color { background: linear-gradient(135deg, #264A82 0%, #1e3a6f 100%) !important; }
            .interest-color { background: linear-gradient(135deg, #60a5fa 0%, #93c5fd 100%) !important; }
            .legend-item span { font-size: 12px !important; font-weight: 600 !important; color: #374151 !important; }
            
            .pdf-disclaimer { background: #f9fafb !important; border: 1px solid #e5e7eb !important; border-radius: 8px !important; padding: 12px !important; margin-top: 20px !important; page-break-inside: avoid !important; }
            .pdf-disclaimer-title { font-weight: 700 !important; color: #374151 !important; margin-bottom: 6px !important; font-size: 12px !important; }
            .pdf-disclaimer-text { font-size: 10px !important; color: #6b7280 !important; line-height: 1.5 !important; }
          </style>
        </head>
        <body>
          <div class="pdf-report-container">
            <!-- Professional Header -->
            <div class="pdf-header">
              <div class="logo-section">
                <img src="https://ik.imagekit.io/hst9jooux/KEYQUEST%20LOGO%20(Black%20Text%20Horizontal).png?updatedAt=1753262438682" alt="KeyQuest Mortgage Logo" onerror="this.style.display='none';" />
              </div>
              <div class="title-section">
                <h1>Mortgage Package Analysis</h1>
                ${clientName ? `<div class="client-name">Prepared for: ${clientName}</div>` : ''}
              </div>
            </div>

            <!-- Key Information Cards -->
            <div class="pdf-key-info">
              <div class="pdf-info-grid">
                <div class="pdf-info-item">
                  <div class="pdf-info-icon">💰</div>
                  <div class="pdf-info-label">Loan Amount</div>
                  <div class="pdf-info-value">${formatCurrency(searchForm.loanAmount || 0)}</div>
                </div>
                <div class="pdf-info-item">
                  <div class="pdf-info-icon">📅</div>
                  <div class="pdf-info-label">Loan Tenure</div>
                  <div class="pdf-info-value">${searchForm.loanTenure || 'N/A'} Years</div>
                </div>
                <div class="pdf-info-item">
                  <div class="pdf-info-icon">🏠</div>
                  <div class="pdf-info-label">Property Type</div>
                  <div class="pdf-info-value property-type">${searchForm.propertyType || 'Private Property'}</div>
                </div>
                <div class="pdf-info-item">
                  <div class="pdf-info-icon">📋</div>
                  <div class="pdf-info-label">Property Status</div>
                  <div class="pdf-info-value property-status">${searchForm.propertyStatus || 'Completed'}</div>
                </div>
                ${selectedLoanType === 'Refinancing Home Loan' && searchForm.existingInterestRate ? `
                <div class="pdf-info-item">
                  <div class="pdf-info-icon">📊</div>
                  <div class="pdf-info-label">Current Rate</div>
                  <div class="pdf-info-value current-rate">${parseFloat(searchForm.existingInterestRate).toFixed(2)}%</div>
                </div>
                ` : `
                <div class="pdf-info-item">
                  <div class="pdf-info-icon">⭐</div>
                  <div class="pdf-info-label">Best Rate</div>
                  <div class="pdf-info-value best-rate">${enhancedPackages[0]?.avgFirst2Years?.toFixed(2) || 'N/A'}%</div>
                </div>
                `}
              </div>
            </div>

            <!-- Package Comparison Table -->
            <div class="pdf-comparison-section">
              <div class="pdf-comparison-title">Package Comparison</div>
              
              <table class="pdf-comparison-table">
                <thead>
                  <tr>
                    <th>Details</th>
                    ${enhancedPackages.map((pkg, index) => `
                      <th class="${index === 0 ? 'recommended' : ''}">
                        ${hideBankNames ? `PKG(${index + 1})` : pkg.bank_name}
                      </th>
                    `).join('')}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Rate Type</td>
                    ${enhancedPackages.map((pkg, index) => `
                      <td class="${index === 0 ? 'recommended' : ''}">
                        ${pkg.rate_type_category || 'Rate Package'}
                      </td>
                    `).join('')}
                  </tr>
                  <tr>
                    <td>Min Loan Amount</td>
                    ${enhancedPackages.map((pkg, index) => `
                      <td class="${index === 0 ? 'recommended amount' : 'amount'}">
                        ${formatCurrency(pkg.minimum_loan_size || 0)}
                      </td>
                    `).join('')}
                  </tr>
                  
                  ${yearsToShow.map((year) => `
                    <tr>
                      <td>Year ${year}</td>
                      ${enhancedPackages.map((pkg, index) => {
                        const rateDisplay = formatDetailedRateDisplay(pkg, year);
                        return `
                        <td class="${index === 0 ? 'recommended rate-value' : 'rate-value'}">
                          ${rateDisplay}
                        </td>
                      `;
                      }).join('')}
                    </tr>
                  `).join('')}
                  
                  <tr>
                    <td>Thereafter</td>
                    ${enhancedPackages.map((pkg, index) => {
                      const rateDisplay = formatDetailedRateDisplay(pkg, 'thereafter');
                      return `
                      <td class="${index === 0 ? 'recommended rate-value' : 'rate-value'}">
                        ${rateDisplay}
                      </td>
                    `;
                    }).join('')}
                  </tr>
                  
                  <tr>
                    <td>Lock-in Period</td>
                    ${enhancedPackages.map((pkg, index) => `
                      <td class="${index === 0 ? 'recommended period' : 'period'}">
                        ${parseInt(pkg.lock_period) || 0} Years
                      </td>
                    `).join('')}
                  </tr>
                  
                  <tr>
                    <td>Monthly Installment</td>
                    ${enhancedPackages.map((pkg, index) => `
                      <td class="${index === 0 ? 'recommended' : ''}">
                        ${formatCurrency(pkg.monthlyInstallment || 0)}
                      </td>
                    `).join('')}
                  </tr>
                  
                  ${selectedLoanType === 'Refinancing Home Loan' && searchForm.existingInterestRate ? `
                  <tr>
                    <td>Total Savings</td>
                    ${enhancedPackages.map((pkg, index) => `
                      <td class="${index === 0 ? 'recommended savings-cell' : 'savings-cell'}">
                        ${pkg.totalSavings > 0 ? 
                          `Save ${formatCurrency(Math.abs(pkg.totalSavings))}\nOver ${parseInt(pkg.lock_period) || 2} Year${parseInt(pkg.lock_period) > 1 ? 's' : ''} Lock-in` : 
                          'No savings'}
                      </td>
                    `).join('')}
                  </tr>
                  ` : ''}
                  
                  <tr>
                    <td>Package Features</td>
                    ${enhancedPackages.map((pkg, index) => `
                      <td class="${index === 0 ? 'recommended features-cell' : 'features-cell'}">
                        ${pkg.legal_fee_subsidy === 'true' || pkg.legal_fee_subsidy === true ? 
                          '<div style="color: #2563eb; margin-bottom: 3px;">✓ Legal Fee Subsidy</div>' : ''}
                        ${pkg.cash_rebate === 'true' || pkg.cash_rebate === true ? 
                          '<div style="color: #2563eb; margin-bottom: 3px;">✓ Cash Rebate</div>' : ''}
                        ${pkg.free_package_conversion_12m === 'true' || pkg.free_package_conversion_12m === true ? 
                          '<div style="color: #2563eb; margin-bottom: 3px;">✓ Free Conversion (12M)</div>' : ''}
                        ${pkg.free_package_conversion_24m === 'true' || pkg.free_package_conversion_24m === true ? 
                          '<div style="color: #2563eb; margin-bottom: 3px;">✓ Free Conversion (24M)</div>' : ''}
                        ${pkg.valuation_subsidy === 'true' || pkg.valuation_subsidy === true ? 
                          '<div style="color: #2563eb; margin-bottom: 3px;">✓ Valuation Subsidy</div>' : ''}
                        ${pkg.partial_repayment === 'true' || pkg.partial_repayment === true ? 
                          '<div style="color: #2563eb; margin-bottom: 3px;">✓ Partial Repayment</div>' : ''}
                        ${pkg.waiver_due_to_sales === 'true' || pkg.waiver_due_to_sales === true ? 
                          '<div style="color: #2563eb; margin-bottom: 3px;">✓ Waiver Due to Sales</div>' : ''}
                        ${(!pkg.legal_fee_subsidy || pkg.legal_fee_subsidy === 'false') && 
                          (!pkg.cash_rebate || pkg.cash_rebate === 'false') && 
                          (!pkg.free_package_conversion_12m || pkg.free_package_conversion_12m === 'false') &&
                          (!pkg.free_package_conversion_24m || pkg.free_package_conversion_24m === 'false') &&
                          (!pkg.valuation_subsidy || pkg.valuation_subsidy === 'false') &&
                          (!pkg.partial_repayment || pkg.partial_repayment === 'false') &&
                          (!pkg.waiver_due_to_sales || pkg.waiver_due_to_sales === 'false') ? 
                            '<div style="color: #6b7280;">Not Specified</div>' : ''}
                      </td>
                    `).join('')}
                  </tr>
                  
                  <tr>
                    <td>Remarks</td>
                    ${enhancedPackages.map((pkg, index) => `
                      <td class="${index === 0 ? 'recommended features-cell' : 'features-cell'}">
                        ${(pkg.custom_remarks || pkg.remarks || 'All packages are structured with fixed rates followed by floating rates based on 3M SORA.').replace(/\n/g, '<br>').substring(0, 200)}${(pkg.custom_remarks || pkg.remarks || '').length > 200 ? '...' : ''}
                      </td>
                    `).join('')}
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Monthly Repayment Comparison Section -->
            <div class="pdf-repayment-section">
              <div class="pdf-repayment-title">Monthly Repayment Comparison</div>
              <table class="pdf-repayment-table">
                <thead>
                  <tr>
                    <th style="width: 25%; background: #1e3a6f !important;">RATE</th>
                    <th class="recommended" style="width: 25% !important;">PKG(1) RECOMMENDED</th>
                    <th style="width: 25% !important;">PKG(2)</th>
                    <th style="width: 25% !important;">PKG(3)</th>
                  </tr>
                </thead>
                <tbody>
                  ${[1, 2, 3, 4, 5].map(year => {
                    const yearInterestRates = enhancedPackages.map(pkg => calculateInterestRate(pkg, year));
                    const yearMonthlyPayments = enhancedPackages.map((pkg, pkgIndex) => 
                      calculateMonthlyInstallment(searchForm.loanAmount || 500000, searchForm.loanTenure || 25, yearInterestRates[pkgIndex])
                    );
                    
                    // Calculate principal and interest for each package
                    const calculatePrincipalInterest = (monthlyPayment, interestRate, loanAmount, year) => {
                      const monthlyInterestRate = interestRate / 100 / 12;
                      const monthsElapsed = (year - 1) * 12;
                      
                      // Calculate remaining balance at start of year
                      let remainingBalance = loanAmount;
                      for (let month = 0; month < monthsElapsed; month++) {
                        const interestPayment = remainingBalance * monthlyInterestRate;
                        const principalPayment = monthlyPayment - interestPayment;
                        remainingBalance = Math.max(0, remainingBalance - principalPayment);
                      }
                      
                      // Calculate annual principal and interest for the year
                      let annualPrincipal = 0;
                      let annualInterest = 0;
                      let currentBalance = remainingBalance;
                      
                      for (let month = 0; month < 12 && currentBalance > 0; month++) {
                        const interestPayment = currentBalance * monthlyInterestRate;
                        const principalPayment = Math.min(monthlyPayment - interestPayment, currentBalance);
                        
                        annualPrincipal += principalPayment;
                        annualInterest += interestPayment;
                        currentBalance = Math.max(0, currentBalance - principalPayment);
                      }
                      
                      return { principal: annualPrincipal, interest: annualInterest };
                    };
                    
                    return `
                      <!-- Year ${year} - MI Row -->
                      <tr class="year-section">
                        <td rowspan="3" class="year-cell">Year ${year} - MI</td>
                        <td class="recommended rate-value">${yearInterestRates[0].toFixed(2)}%</td>
                        <td class="rate-value">${yearInterestRates[1].toFixed(2)}%</td>
                        <td class="rate-value">${yearInterestRates[2].toFixed(2)}%</td>
                      </tr>
                      
                      <!-- Monthly Installment Row -->
                      <tr class="mi-row">
                        <td class="recommended amount-value">${formatCurrency(yearMonthlyPayments[0])}</td>
                        <td class="amount-value">${formatCurrency(yearMonthlyPayments[1])}</td>
                        <td class="amount-value">${formatCurrency(yearMonthlyPayments[2])}</td>
                      </tr>
                      
                      <!-- Principal and Interest Row -->
                      <tr class="breakdown-row">
                        ${enhancedPackages.map((pkg, index) => {
                          const breakdown = calculatePrincipalInterest(
                            yearMonthlyPayments[index], 
                            yearInterestRates[index], 
                            searchForm.loanAmount || 500000, 
                            year
                          );
                          
                          return `
                            <td class="${index === 0 ? 'recommended breakdown-cell' : 'breakdown-cell'}">
                              <div class="principal-line">Total Principal</div>
                              <div class="principal-value">${formatCurrency(breakdown.principal)}</div>
                              <div class="interest-line">Total Interest</div>
                              <div class="interest-value">${formatCurrency(breakdown.interest)}</div>
                            </td>
                          `;
                        }).join('')}
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Monthly Repayment Breakdown Chart -->
            <div class="pdf-chart-section">
              <div class="pdf-chart-title">Monthly Repayment Breakdown</div>
              
              <div class="chart-bars-container">
                ${enhancedPackages.map((pkg, index) => {
                  const rate = calculateInterestRate(pkg, 1); // Use Year 1 rate
                  const monthlyPayment = calculateMonthlyInstallment(searchForm.loanAmount || 500000, searchForm.loanTenure || 25, rate);
                  
                  // Calculate actual principal and interest for first year
                  const monthlyInterestRate = rate / 100 / 12;
                  const loanAmount = searchForm.loanAmount || 500000;
                  
                  // Simple approximation for monthly breakdown
                  const avgMonthlyInterest = loanAmount * monthlyInterestRate;
                  const avgMonthlyPrincipal = monthlyPayment - avgMonthlyInterest;
                  
                  // Calculate percentages for bar height
                  const principalPercent = (avgMonthlyPrincipal / monthlyPayment) * 100;
                  const interestPercent = (avgMonthlyInterest / monthlyPayment) * 100;
                  
                  return `
                    <div class="chart-column">
                      <div class="chart-rate-header">${rate.toFixed(2)}%</div>
                      
                      <div class="chart-bar-stack">
                        <div class="chart-bar-segment interest-segment" style="height: ${interestPercent}%;">
                          <div class="chart-segment-label">Interest</div>
                          <div class="chart-segment-value">${formatCurrency(avgMonthlyInterest)}</div>
                        </div>
                        <div class="chart-bar-segment principal-segment" style="height: ${principalPercent}%;">
                          <div class="chart-segment-label">Principal</div>
                          <div class="chart-segment-value">${formatCurrency(avgMonthlyPrincipal)}</div>
                        </div>
                      </div>
                      
                      <div class="chart-package-label">PKG(${index + 1})</div>
                      <div class="chart-total-value">${formatCurrency(monthlyPayment)}</div>
                    </div>
                  `;
                }).join('')}
              </div>
              
              <!-- Chart Legend -->
              <div class="chart-legend">
                <div class="legend-item">
                  <div class="legend-color principal-color"></div>
                  <span>Principal</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color interest-color"></div>
                  <span>Interest</span>
                </div>
              </div>
            </div>

            ${selectedLoanType === 'Refinancing Home Loan' && searchForm.existingInterestRate ? `
            <!-- Potential Savings Section -->
            <div class="pdf-savings-section">
              <div class="pdf-savings-title">Potential Savings with Our Recommended Package</div>
              <div class="pdf-savings-grid">
                <div class="pdf-savings-item">
                  <div class="label">Current Monthly Payment</div>
                  <div class="value current">${formatCurrency(calculateMonthlyInstallment(searchForm.loanAmount || 500000, searchForm.loanTenure || 25, parseFloat(searchForm.existingInterestRate)))}</div>
                  <div class="sub-label">at ${parseFloat(searchForm.existingInterestRate).toFixed(2)}%</div>
                </div>
                <div class="pdf-savings-item">
                  <div class="label">New Monthly Payment</div>
                  <div class="value new">${formatCurrency(enhancedPackages[0]?.monthlyInstallment || 0)}</div>
                  <div class="sub-label">at ${enhancedPackages[0]?.avgFirst2Years?.toFixed(2) || 'N/A'}%</div>
                </div>
                <div class="pdf-savings-item">
                  <div class="label">Total Savings</div>
                  <div class="value savings">${enhancedPackages[0]?.totalSavings > 0 ? formatCurrency(enhancedPackages[0].totalSavings) : 'No savings'}</div>
                </div>
              </div>
            </div>
            ` : ''}

            <!-- Professional Disclaimer -->
            <div class="pdf-disclaimer">
              <div class="pdf-disclaimer-title">Disclaimer – Keyquest Ventures Private Limited</div>
              <div class="pdf-disclaimer-text">
                This report is for general information and personal reference only. It does not constitute financial, investment, or professional advice, and does not take into account individual goals or financial situations.<br><br>
                Users should not rely solely on this information when making financial or investment decisions. While we aim to use reliable data, Keyquest Ventures Private Limited does not guarantee its accuracy or completeness.<br><br>
                Before refinancing, please check with your bank for any penalties, clawbacks, or fees that may apply.<br><br>
                Use of our reports, consultancy services, or advice—whether by the recipient directly or through our consultants, affiliates, or partners—is undertaken entirely at the user's own risk. Keyquest Ventures Private Limited, including its affiliates and employees, bears no responsibility or liability for any decisions made or actions taken based on the information provided.
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Open PDF in new window for printing
      const printWindow = window.open('', '_blank');
      printWindow.document.write(reportContent);
      printWindow.document.close();
      
      // Trigger print after content loads
      setTimeout(() => {
        printWindow.print();
      }, 1000);
      
      logger.info('Enhanced PDF report generated successfully');
      
    } catch (error) {
      logger.error('Error generating enhanced PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // PackageCard Component - optimized with memoization
  const PackageCard = React.memo(({ 
    pkg, 
    index, 
    isSelected, 
    hideBankNames, 
    rateTypes,
    onToggleSelection, 
    onUpdateFeature, 
    onUpdateRemarks,
    formatCurrency,
    formatPercentage
  }) => {
    const rank = index + 1;
    
    // Generate rate schedule - memoized for performance
    const generateRateSchedule = useMemo(() => {
      const rates = [];
      
      // Always show Years 1-5 (auto-populate empty years with thereafter rate)
      for (let year = 1; year <= 5; year++) {
        let rateType, value;
        
        // Check if this year has actual data
        rateType = pkg[`year${year}_rate_type`];
        value = pkg[`year${year}_value`];
        
        // If no data for this year, check if we can use thereafter rate
        if (!rateType || value === null || value === undefined) {
          // Use thereafter rate if available
          if (pkg.thereafter_rate_type && pkg.thereafter_value !== null && pkg.thereafter_value !== undefined) {
            rates.push(
              <div key={year} className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                <div className="text-xs font-medium text-blue-600 mb-1">Year {year}</div>
                <div className="text-sm font-semibold text-blue-700">{formatRateDisplay(pkg, 'thereafter')}</div>
              </div>
            );
          } else {
            // Only show dash if no thereafter rate exists
            rates.push(
              <div key={year} className="bg-gray-50 border border-gray-100 p-3 rounded-lg">
                <div className="text-xs font-medium text-gray-500 mb-1">Year {year}</div>
                <div className="text-sm font-semibold text-gray-400">-</div>
              </div>
            );
          }
        } else {
          // Show actual data for this year
          rates.push(
            <div key={year} className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
              <div className="text-xs font-medium text-blue-600 mb-1">Year {year}</div>
              <div className="text-sm font-semibold text-blue-700">{formatRateDisplay(pkg, year)}</div>
            </div>
          );
        }
      }

      // Always show thereafter row
      const thereafterRate = calculateInterestRate(pkg, 'thereafter');
      if (thereafterRate > 0) {
        rates.push(
          <div key="thereafter" className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg ring-2 ring-emerald-100">
            <div className="text-xs font-medium text-emerald-600 mb-1">Thereafter</div>
            <div className="text-sm font-bold text-emerald-700">{formatRateDisplay(pkg, 'thereafter')}</div>
          </div>
        );
      }

      return rates;
    }, [pkg]);

    return (
      <div className={`border border-gray-200 rounded-2xl bg-white shadow-sm transition-all duration-300 hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''
      }`}>
        {/* Package Header - Cleaner Design */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm">
                {rank}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {hideBankNames ? `Bank ${String.fromCharCode(64 + rank)}` : pkg.bank_name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    pkg.rate_type_category === 'Fixed' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {pkg.rate_type_category || 'Floating'}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-600 mb-1">
                {formatPercentage(pkg.avgFirst2Years)}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                {formatCurrency(pkg.monthlyInstallment)}/mo
              </div>
            </div>
          </div>

          {/* Package Details Row - Improved Layout */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500 font-medium mb-1">Property</div>
              <div className="text-sm font-semibold text-gray-900">{pkg.property_type}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500 font-medium mb-1">Status</div>
              <div className="text-sm font-semibold text-gray-900">{pkg.property_status}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500 font-medium mb-1">Buy Under</div>
              <div className="text-sm font-semibold text-gray-900">{pkg.buy_under}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500 font-medium mb-1">Lock Period</div>
              <div className="text-sm font-semibold text-gray-900">{pkg.lock_period || 'No Lock-in'}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500 font-medium mb-1">Min Loan</div>
              <div className="text-sm font-semibold text-gray-900">{formatCurrency(pkg.minimum_loan_size || 0)}</div>
            </div>
          </div>

          {/* Selection Checkbox - Better Styling */}
          <div className="mt-4 flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={onToggleSelection}
                  className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 transition-colors"
                />
                {isSelected && (
                  <CheckSquare className="w-4 h-4 text-blue-600 absolute top-0 left-0 pointer-events-none" />
                )}
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                Include in report
              </span>
            </label>
          </div>
        </div>

        {/* Interest Rate Schedule - Enhanced Design */}
        <div className="p-6 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Interest Rate Schedule</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {generateRateSchedule}
          </div>
        </div>

        {/* Package Features Editor - Enhanced */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Package Features</h4>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Editable</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {featureOptions.map(feature => (
              <label key={feature.value} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors group">
                <input
                  type="checkbox"
                  checked={pkg[feature.value] === 'true' || pkg[feature.value] === true}
                  onChange={(e) => onUpdateFeature(feature.value, e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 transition-colors"
                />
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                  {feature.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Client Remarks Editor - Enhanced */}
        <div className="p-6 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-purple-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Client Remarks</h4>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Editable</span>
          </div>
          <textarea
            value={pkg.custom_remarks || pkg.remarks || ''}
            onChange={(e) => onUpdateRemarks(e.target.value)}
            placeholder="Add custom remarks for this package..."
            rows="3"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none transition-all duration-200 text-sm"
          />
        </div>
      </div>
    );
  });

  // Loading Skeleton Component for better UX
  const PackageCardSkeleton = () => (
    <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
        <div className="text-right">
          <div className="h-6 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-50 p-3 rounded-lg">
            <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
          </div>
        ))}
      </div>
      
      <div className="h-32 bg-gray-100 rounded-lg mb-4"></div>
      <div className="h-24 bg-gray-100 rounded-lg"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">Recommended Packages</h1>
              <p className="text-blue-100">Find the best mortgage packages for your clients</p>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-blue-200">{user.role?.replace('_', ' ').toUpperCase()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Loan Type Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-3">
            {['New Home Loan', 'Refinancing Home Loan', 'Commercial/Industrial'].map((loanType) => (
              <button
                key={loanType}
                onClick={() => handleLoanTypeSelect(loanType)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  selectedLoanType === loanType
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200'
                }`}
              >
                {loanType === 'New Home Loan' && <Home className="w-5 h-5" />}
                {loanType === 'Refinancing Home Loan' && <Repeat className="w-5 h-5" />}
                {loanType === 'Commercial/Industrial' && <Briefcase className="w-5 h-5" />}
                {loanType}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="space-y-6">
            {/* Row 1: Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                <select
                  value={searchForm.propertyType}
                  onChange={(e) => handleInputChange('propertyType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Property Type</option>
                  <option value="Private Property">Private Property</option>
                  <option value="HDB">HDB</option>
                  <option value="EC">EC</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Status</label>
                <select
                  value={searchForm.propertyStatus}
                  onChange={(e) => handleInputChange('propertyStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Property Status</option>
                  <option value="Completed">Completed</option>
                  <option value="BUC">BUC</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Buy Under</label>
                <select
                  value={searchForm.buyUnder}
                  onChange={(e) => handleInputChange('buyUnder', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Buy Under</option>
                  <option value="Individual Name">Individual Name</option>
                  <option value="Company Operating">Company Operating</option>
                  <option value="Company Investment">Company Investment</option>
                </select>
              </div>
            </div>

            {/* Row 2: Financial Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loan Amount ($)</label>
                <input
                  type="number"
                  value={searchForm.loanAmount}
                  onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                  placeholder="500,000"
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loan Tenure (Years)</label>
                <input
                  type="number"
                  value={searchForm.loanTenure}
                  onChange={(e) => handleInputChange('loanTenure', e.target.value)}
                  placeholder="25"
                  min="1"
                  max="50"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Refinancing Fields (conditional) */}
            {selectedLoanType === 'Refinancing Home Loan' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-orange-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Interest Rate (%)</label>
                  <input
                    type="number"
                    value={searchForm.existingInterestRate}
                    onChange={(e) => handleInputChange('existingInterestRate', e.target.value)}
                    placeholder="3.50"
                    min="0"
                    max="20"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Bank</label>
                  <select
                    value={searchForm.existingBank}
                    onChange={(e) => handleInputChange('existingBank', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Current Bank</option>
                    {bankOptions.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Row 3: Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Bank Multi-Select */}
              <div className="relative" ref={bankDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank (Multiple Selection)</label>
                <button
                  type="button"
                  onClick={() => setShowBankDropdown(!showBankDropdown)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center bg-white"
                >
                  <span className="text-gray-700">
                    {selectedBanks.length === 0 
                      ? 'Select Banks' 
                      : `${selectedBanks.length} selected`
                    }
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showBankDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    <div className="p-2">
                      <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedBanks.length === bankOptions.length}
                          onChange={toggleAllBanks}
                          className="rounded"
                        />
                        <span className="font-medium">Select All Banks</span>
                      </label>
                      {bankOptions.map(bank => (
                        <label key={bank} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedBanks.includes(bank)}
                            onChange={(e) => handleBankSelection(bank, e.target.checked)}
                            className="rounded"
                          />
                          <span>{bank}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rate Type</label>
                <select
                  value={searchForm.rateType}
                  onChange={(e) => handleInputChange('rateType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Rate Type</option>
                  <option value="Fixed">Fixed</option>
                  <option value="Floating">Floating</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lock-in Period</label>
                <select
                  value={searchForm.lockPeriod}
                  onChange={(e) => handleInputChange('lockPeriod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Lock Period</option>
                  {['0 Year', '1 Year', '2 Years', '3 Years', '4 Years', '5 Years', 
                    '6 Years', '7 Years', '8 Years', '9 Years', '10 Years'].map(period => (
                    <option key={period} value={period}>{period}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 4: Package Features */}
            <div className="relative" ref={featuresDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Package Features (Multiple Selection)</label>
              <button
                type="button"
                onClick={() => setShowFeaturesDropdown(!showFeaturesDropdown)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center bg-white"
              >
                <span className="text-gray-700">
                  {selectedFeatures.length === 0 
                    ? 'Select Features' 
                    : `${selectedFeatures.length} selected`
                  }
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showFeaturesDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  <div className="p-2">
                    <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFeatures.length === featureOptions.length}
                        onChange={toggleAllFeatures}
                        className="rounded"
                      />
                      <span className="font-medium">Select All Features</span>
                    </label>
                    {featureOptions.map(feature => (
                      <label key={feature.value} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFeatures.includes(feature.value)}
                          onChange={(e) => handleFeatureSelection(feature.value, e.target.checked)}
                          className="rounded"
                        />
                        <span>{feature.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Clear Filters Button */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    Filtering packages...
                  </div>
                ) : showResults ? (
                  `Found ${filteredPackages.length} matching packages`
                ) : (
                  'Select filters above to find suitable packages'
                )}
              </div>

              <button
                type="button"
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                Clear All Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {showResults && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">
                  Recommended Packages
                </h2>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {filteredPackages.length} found
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Report Options */}
                <div className="flex items-center gap-4">
                  <div>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Enter client name for report"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hideBankNames"
                      checked={hideBankNames}
                      onChange={(e) => setHideBankNames(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="hideBankNames" className="text-sm text-gray-700">
                      Hide Bank Names in Report
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={generateProfessionalReport}
                    disabled={filteredPackages.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    Generate PDF Report
                  </button>
                  
                  <button
                    onClick={exportCSV}
                    disabled={filteredPackages.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  
                  <button
                    onClick={toggleAllPackages}
                    disabled={filteredPackages.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <CheckSquare className="w-4 h-4" />
                    Toggle All
                  </button>
                </div>
              </div>
            </div>

            {/* Packages List with Loading States */}
            {loading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <PackageCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredPackages.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Matching Packages Found</h3>
                <p className="text-gray-500">Try adjusting your search criteria to find more suitable options.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredPackages.map((pkg, index) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    index={index}
                    isSelected={selectedPackages.has(pkg.id)}
                    hideBankNames={hideBankNames}
                    rateTypes={rateTypes}
                    onToggleSelection={() => togglePackageSelection(pkg.id)}
                    onUpdateFeature={(featureName, isChecked) => updatePackageFeature(index, featureName, isChecked)}
                    onUpdateRemarks={(newRemarks) => updatePackageRemarks(index, newRemarks)}
                    formatCurrency={formatCurrency}
                    formatPercentage={formatPercentage}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendedPackages;