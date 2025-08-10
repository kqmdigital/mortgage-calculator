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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
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
            console.log(`📋 Loaded ${rateTypesResult.data?.length || 0} rate types:`, 
              rateTypesResult.data?.map(rt => ({ rate_type: rt.rate_type, rate_value: rt.rate_value })));
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
      const fixedRate = parseFloat(value) || 0;
      console.log(`🔧 FIXED rate for year ${year}:`, { rateType, value, fixedRate });
      return fixedRate;
    } else {
      // Find the reference rate from global rateTypes
      const referenceRate = rateTypes.find(rt => rt.rate_type === rateType);
      if (!referenceRate) {
        console.log(`❌ Reference rate type not found: ${rateType}`, { availableTypes: rateTypes.map(rt => rt.rate_type) });
        logger.warn(`Reference rate type not found: ${rateType}`);
        return 0;
      }
      
      const referenceRateValue = parseFloat(referenceRate.rate_value) || 0;
      const spreadValue = parseFloat(value) || 0;
      const finalRate = operator === '+' ? referenceRateValue + spreadValue : referenceRateValue - spreadValue;
      
      console.log(`🔧 FLOATING rate for year ${year}:`, { 
        rateType, 
        operator, 
        spreadValue, 
        referenceRateValue, 
        finalRate 
      });
      
      return finalRate;
    }
  }, [rateTypes]);

  const calculateAverageFirst2Years = useCallback((pkg) => {
    const year1Rate = calculateNumericRate(pkg, 1);
    const year2Rate = calculateNumericRate(pkg, 2);
    
    console.log(`📊 Rate calculation for ${pkg.bank_name}:`, {
      year1Rate,
      year2Rate,
      average: year1Rate === 0 && year2Rate === 0 ? 0 : 
               year1Rate === 0 ? year2Rate :
               year2Rate === 0 ? year1Rate :
               (year1Rate + year2Rate) / 2
    });
    
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

  const calculateMonthlySavings = useCallback((loanAmount, tenureYears, currentRate, newRate) => {
    const currentPayment = calculateMonthlyInstallment(loanAmount, tenureYears, currentRate);
    const newPayment = calculateMonthlyInstallment(loanAmount, tenureYears, newRate);
    return currentPayment - newPayment;
  }, [calculateMonthlyInstallment]);

  const parseLockInPeriod = useCallback((lockPeriod) => {
    if (!lockPeriod) return 0;
    const match = lockPeriod.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }, []);

  const calculateTotalSavings = useCallback((monthlySavings, lockPeriod) => {
    if (!monthlySavings || !lockPeriod) return 0;
    const lockInYears = parseLockInPeriod(lockPeriod);
    return monthlySavings * lockInYears * 12;
  }, [parseLockInPeriod]);

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
        
        // Calculate savings for refinancing (needed for proper sorting)
        let monthlySavings = 0;
        let totalSavings = 0;
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

      // Sort by average rate (lowest first) - same as HTML - but let's debug this
      console.log('🔍 Package rates before sorting:');
      filtered.forEach((pkg, index) => {
        console.log(`PKG(${index + 1}):`, {
          bank: pkg.bank_name,
          year1_rate_type: pkg.year1_rate_type,
          year1_value: pkg.year1_value,
          year2_rate_type: pkg.year2_rate_type, 
          year2_value: pkg.year2_value,
          avgFirst2Years: pkg.avgFirst2Years,
          totalSavings: pkg.totalSavings
        });
      });
      
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
  }, [selectedLoanType, searchForm, selectedBanks, selectedFeatures, allPackages, calculateAverageFirst2Years, calculateMonthlyInstallment, calculateMonthlySavings, calculateTotalSavings]);

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

  const formatCurrency = useCallback((value) => {
    if (!value || value === 0) return '$0';
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }, []);

  const formatPercentage = useCallback((value) => {
    if (value == null || value === 0) return 'N/A';
    return `${value.toFixed(2)}%`;
  }, []);

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

  const togglePackageSelection = useCallback((packageId) => {
    setSelectedPackages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(packageId)) {
        newSet.delete(packageId);
      } else {
        newSet.add(packageId);
      }
      return newSet;
    });
  }, []);

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
  const updatePackageFeature = useCallback((packageIndex, featureName, isChecked) => {
    setFilteredPackages(prevPackages => {
      const updated = [...prevPackages];
      if (updated[packageIndex]) {
        updated[packageIndex][featureName] = isChecked;
      }
      return updated;
    });
  }, []);

  // Update package remarks in filteredPackages state
  const updatePackageRemarks = useCallback((packageIndex, newRemarks) => {
    setFilteredPackages(prevPackages => {
      const updated = [...prevPackages];
      if (updated[packageIndex]) {
        updated[packageIndex].custom_remarks = newRemarks;
      }
      return updated;
    });
  }, []);

  // EXACT rate calculation functions from HTML version
  const calculateInterestRate = useCallback((pkg, year) => {
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
  }, [rateTypes]);

  // Format rate display for rate schedule
  const formatRateDisplay = useCallback((pkg, year) => {
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
  }, [calculateInterestRate, formatPercentage]);

  // Enhanced PDF Generation matching HTML version functionality
  const generateProfessionalReport = async () => {
    setIsGeneratingPDF(true);
    try {
      if (filteredPackages.length === 0) {
        alert('No results to generate report. Please search for packages first.');
        setIsGeneratingPDF(false);
        return;
      }

      // Get selected packages or default to top 3
      const packagesToExport = selectedPackages.size > 0 
        ? filteredPackages.filter(pkg => selectedPackages.has(pkg.id)).slice(0, 3)
        : filteredPackages.slice(0, 3);

      if (packagesToExport.length === 0) {
        alert('Please select at least one package for the report.');
        setIsGeneratingPDF(false);
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
          // Use actual database rate instead of hardcoded value
          const referenceRate = rateTypes.find(rt => rt.rate_type === rateType);
          const referenceRateValue = referenceRate ? parseFloat(referenceRate.rate_value) : (rateType.includes('SORA') ? 1.65 : 3.25); // Default rates
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

      const parseLockInPeriod = (lockPeriod) => {
        if (!lockPeriod) return 0;
        const match = lockPeriod.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };

      const calculateTotalSavings = (monthlySavings, lockPeriod) => {
        if (!monthlySavings || !lockPeriod) return 0;
        const lockInYears = parseLockInPeriod(lockPeriod);
        return monthlySavings * lockInYears * 12;
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
          return `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 3px;">
            <div style="font-weight: 600; color: #6b7280; margin: 0; line-height: 1.0; font-size: 11px;">-</div>
          </div>`;
        }

        if (rateType === 'FIXED') {
          const rate = calculateInterestRate(pkg, year);
          if (!rate || isNaN(rate)) {
            return `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 3px;">
              <div style="font-weight: 600; color: #6b7280; margin: 0; line-height: 1.0; font-size: 11px;">N/A</div>
            </div>`;
          }
          return `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 3px;">
            <div style="font-weight: 600; color: #1d4ed8; margin: 0; line-height: 1.0; font-size: 11px;">${rate.toFixed(2)}%</div>
            <div style="font-size: 7px; color: #6b7280; line-height: 1.0; margin: 0;">FIXED</div>
          </div>`;
        } else {
          // Use actual database rate instead of hardcoded value
          const referenceRate = rateTypes.find(rt => rt.rate_type === rateType);
          const referenceRateValue = referenceRate ? parseFloat(referenceRate.rate_value) : (rateType.includes('SORA') ? 1.65 : 3.25);
          const spreadValue = parseFloat(value) || 0;
          const totalRate = calculateInterestRate(pkg, year);
          
          if (!totalRate || isNaN(totalRate)) {
            return `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 3px;">
              <div style="font-weight: 600; color: #6b7280; margin: 0; line-height: 1.0; font-size: 11px;">N/A</div>
            </div>`;
          }
          
          const operatorSymbol = operator === '+' ? '+' : '-';
          return `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 3px;">
            <div style="font-weight: 600; color: #1d4ed8; margin: 0; line-height: 1.0; font-size: 11px;">${totalRate.toFixed(2)}%</div>
            <div style="font-size: 7px; color: #6b7280; line-height: 1.0; margin: 0;">${rateType}(${referenceRateValue.toFixed(2)}%) ${operatorSymbol} ${spreadValue.toFixed(2)}%</div>
          </div>`;
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
      // eslint-disable-next-line no-unused-vars
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
            
            * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; font-style: normal !important; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; margin: 0; padding: 0; background: white !important; color: #1a1a1a !important; font-style: normal !important; }
            
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
            
            .pdf-comparison-section { margin-bottom: 25px !important; page-break-inside: avoid !important; }
            .pdf-comparison-title { font-size: 16px !important; font-weight: 700 !important; color: #264A82 !important; margin-bottom: 15px !important; text-align: left !important; }
            
            .pdf-comparison-table { width: 100% !important; border-collapse: collapse !important; background: white !important; border-radius: 12px !important; overflow: hidden !important; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important; table-layout: fixed !important; page-break-inside: auto !important; }
            .pdf-comparison-table thead { background: linear-gradient(135deg, #264A82 0%, #1e3a6f 100%) !important; }
            .pdf-comparison-table th { padding: 10px 6px !important; text-align: center !important; font-weight: 600 !important; font-size: 12px !important; color: white !important; text-transform: uppercase !important; letter-spacing: 0.3px !important; word-wrap: break-word !important; vertical-align: middle !important; }
            .pdf-comparison-table th:first-child { background: #1e3a6f !important; width: 25% !important; text-align: left !important; padding-left: 12px !important; }
            .pdf-comparison-table th:not(:first-child) { width: 25% !important; }
            .pdf-comparison-table th.recommended { background: #1e40af !important; position: relative !important; }
            .pdf-comparison-table th.recommended::after { content: 'RECOMMENDED' !important; position: absolute !important; bottom: -8px !important; left: 50% !important; transform: translateX(-50%) !important; background: #3b82f6 !important; color: white !important; font-size: 6px !important; padding: 2px 6px !important; border-radius: 3px !important; font-weight: 700 !important; white-space: nowrap !important; z-index: 10 !important; }
            
            .pdf-comparison-table tbody tr:nth-child(even) { background: #f8fafc !important; }
            .pdf-comparison-table td { padding: 6px 4px !important; text-align: center !important; border-bottom: 1px solid #e2e8f0 !important; font-size: 11px !important; line-height: 1.3 !important; word-wrap: break-word !important; vertical-align: middle !important; max-width: 0 !important; }
            .pdf-comparison-table td:first-child { text-align: left !important; font-weight: 600 !important; color: #374151 !important; padding-left: 12px !important; white-space: nowrap !important; }
            .pdf-comparison-table td.recommended { background: rgba(38, 74, 130, 0.15) !important; font-weight: 600 !important; color: #264A82 !important; }
            .pdf-comparison-table td.rate-value { font-weight: 600 !important; color: #1d4ed8 !important; text-align: center !important; vertical-align: middle !important; padding: 6px 4px !important; line-height: 1.2 !important; position: relative !important; }
            .pdf-comparison-table td.amount { color: #3b82f6 !important; font-weight: 600 !important; }
            .pdf-comparison-table td.period { color: #3b82f6 !important; font-weight: 600 !important; }
            .pdf-comparison-table td.features-cell { text-align: center !important; vertical-align: middle !important; font-size: 10px !important; line-height: 1.3 !important; padding: 6px 4px !important; word-wrap: break-word !important; }
            .pdf-comparison-table td.features-cell.remarks-cell { font-size: 8px !important; line-height: 1.3 !important; padding: 6px 4px !important; vertical-align: middle !important; max-height: none !important; text-align: left !important; }
            .pdf-comparison-table td.savings-cell { font-size: 11px !important; line-height: 1.2 !important; text-align: center !important; vertical-align: middle !important; white-space: pre-line !important; }
            .pdf-comparison-table td.savings-cell small { font-size: 8px !important; color: #6b7280 !important; }
            
            /* Ensure consistent spacing for ALL table rows - uniform height */
            .pdf-comparison-table tbody tr { height: 35px !important; }
            .pdf-comparison-table tbody tr td { vertical-align: middle !important; padding: 6px 4px !important; line-height: 1.2 !important; }
            
            /* Rate rows use same height as other rows for consistency */
            .pdf-comparison-table tr.rate-row { height: 35px !important; }
            .pdf-comparison-table tr.rate-row td { padding: 6px 4px !important; vertical-align: middle !important; height: 35px !important; line-height: 1.2 !important; }
            .pdf-comparison-table tr.rate-row td:first-child { text-align: left !important; font-weight: 600 !important; color: #374151 !important; padding-left: 12px !important; white-space: nowrap !important; }
            .pdf-comparison-table tr.rate-row td.rate-value { padding: 6px 4px !important; text-align: center !important; vertical-align: middle !important; height: 35px !important; }
            .pdf-comparison-table small { display: block !important; margin: 0 !important; line-height: 1.0 !important; }
            .pdf-comparison-table .rate-value br { line-height: 0.8 !important; }
            
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
            
            /* Monthly Installment Comparison Table - Match HTML Version */
            .pdf-monthly-installment-section { margin: 25px 0 !important; page-break-inside: avoid !important; }
            .pdf-section-title { font-size: 16px !important; font-weight: 700 !important; color: #264A82 !important; margin-bottom: 15px !important; text-align: left !important; }
            
            .pdf-monthly-installment-table { width: 100% !important; border-collapse: collapse !important; background: white !important; border-radius: 12px !important; overflow: hidden !important; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important; table-layout: fixed !important; }
            .pdf-monthly-installment-table th { background: linear-gradient(135deg, #264A82 0%, #1e3a6f 100%) !important; padding: 10px 6px !important; text-align: center !important; font-weight: 600 !important; font-size: 12px !important; color: white !important; text-transform: uppercase !important; letter-spacing: 0.3px !important; word-wrap: break-word !important; vertical-align: middle !important; }
            .pdf-monthly-installment-table .row-header { background: #1e3a6f !important; width: 25% !important; text-align: left !important; padding-left: 12px !important; }
            .pdf-monthly-installment-table .recommended-package-header { background: #1e40af !important; position: relative !important; width: 25% !important; }
            .pdf-monthly-installment-table .recommended-package-header::after { content: 'RECOMMENDED' !important; position: absolute !important; bottom: -8px !important; left: 50% !important; transform: translateX(-50%) !important; background: #3b82f6 !important; color: white !important; font-size: 6px !important; padding: 2px 6px !important; border-radius: 3px !important; font-weight: 700 !important; white-space: nowrap !important; z-index: 10 !important; }
            .pdf-monthly-installment-table .package-header { background: linear-gradient(135deg, #264A82 0%, #1e3a6f 100%) !important; width: 25% !important; }
            
            .pdf-monthly-installment-table td { padding: 8px 6px !important; text-align: center !important; border-bottom: 1px solid #e2e8f0 !important; font-size: 11px !important; line-height: 1.4 !important; word-wrap: break-word !important; vertical-align: top !important; max-width: 0 !important; }
            .pdf-monthly-installment-table .year-label { background: #f3f4f6 !important; font-weight: 600 !important; color: #374151 !important; text-align: left !important; padding-left: 8px !important; }
            .pdf-monthly-installment-table .detail-label { color: #6b7280 !important; font-weight: 500 !important; text-align: left !important; padding-left: 16px !important; font-style: normal !important; font-size: 9px !important; }
            .pdf-monthly-installment-table .package-value { color: #1d4ed8 !important; font-weight: 600 !important; }
            .pdf-monthly-installment-table .package-detail { color: #6b7280 !important; font-size: 11px !important; }
            /* All detail rows have white background */
            .pdf-monthly-installment-table tbody tr.detail-row { background: white !important; }
            
            /* Recommended cell highlighting that respects year grouping */
            .pdf-monthly-installment-table td.package-value.recommended, 
            .pdf-monthly-installment-table td.package-detail.recommended { 
              background: rgba(38, 74, 130, 0.20) !important; font-weight: 600 !important; color: #264A82 !important; 
            }
            
            /* Special highlighting for rate and year rows */
            .pdf-monthly-installment-table .rate-info-row td.recommended,
            .pdf-monthly-installment-table .year-row td.recommended { 
              background: rgba(38, 74, 130, 0.35) !important; font-weight: 700 !important; color: #1a365d !important; 
            }
            .pdf-monthly-installment-table td:first-child { text-align: left !important; font-weight: 600 !important; color: #374151 !important; padding-left: 12px !important; white-space: nowrap !important; }
            .pdf-monthly-installment-table td:not(:first-child) { width: 25% !important; }
            
            /* Reduce font size for Total Principal and Total Interest rows for better hierarchy */
            .pdf-monthly-installment-table .detail-row td { font-size: 9px !important; }
            .pdf-monthly-installment-table .detail-row .detail-label { font-size: 8px !important; }
            
            /* Make Year X Rate and Total Saving same size as Monthly Installment */
            .pdf-monthly-installment-table .rate-info-row td { font-size: 11px !important; }
            .pdf-monthly-installment-table .rate-info-row .detail-label { font-size: 11px !important; }
            .pdf-monthly-installment-table .saving-row td { font-size: 11px !important; }
            .pdf-monthly-installment-table .saving-row .detail-label { font-size: 11px !important; }
            
            /* Visual separation between year sections */
            .pdf-monthly-installment-table .rate-info-row { 
              border-top: 2px solid #264A82 !important; 
              background: #e8f2ff !important; 
            }
            .pdf-monthly-installment-table .rate-info-row td { 
              background: #e8f2ff !important; 
              font-weight: 600 !important; 
              color: #264A82 !important; 
            }
            .pdf-monthly-installment-table .year-row { 
              background: #f0f7ff !important; 
            }
            .pdf-monthly-installment-table .year-row td { 
              background: #f0f7ff !important; 
              font-weight: 600 !important; 
              border-bottom: 1px solid #264A82 !important; 
            }
            
            /* Add spacing after each year section */
            .pdf-monthly-installment-table .saving-row { 
              border-bottom: 3px solid #264A82 !important; 
              margin-bottom: 8px !important; 
            }
            .pdf-monthly-installment-table .saving-row td { 
              border-bottom: 3px solid #264A82 !important; 
            }
            
            /* Bar Chart Styles - Match HTML Version */
            .pdf-chart-section { margin: 20px 0 !important; page-break-inside: avoid !important; }
            .pdf-bar-chart { display: flex !important; justify-content: space-around !important; align-items: flex-end !important; height: 280px !important; padding: 20px !important; background: #f8fafc !important; border-radius: 12px !important; margin: 15px 0 !important; border: 1px solid #e2e8f0 !important; }
            .pdf-bar-item { display: flex !important; flex-direction: column !important; align-items: center !important; position: relative !important; margin: 0 10px !important; }
            .pdf-bar-rate { font-size: 12px !important; font-weight: 600 !important; color: #264A82 !important; margin-bottom: 8px !important; text-align: center !important; }
            .pdf-bar-container { height: 200px !important; display: flex !important; align-items: flex-end !important; margin-bottom: 8px !important; }
            .pdf-bar-stack { width: 80px !important; display: flex !important; flex-direction: column-reverse !important; border-radius: 6px 6px 0 0 !important; overflow: hidden !important; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important; }
            .pdf-bar-stack.new-package { border: 2px solid #264A82 !important; }
            .pdf-bar-segment.principal { background: #264A82 !important; width: 100% !important; min-height: 40px !important; display: flex !important; align-items: center !important; justify-content: center !important; position: relative !important; }
            .pdf-bar-segment.interest { background: #93c5fd !important; width: 100% !important; min-height: 30px !important; display: flex !important; align-items: center !important; justify-content: center !important; position: relative !important; }
            .pdf-bar-label { font-size: 11px !important; font-weight: 600 !important; color: #374151 !important; text-align: center !important; margin-bottom: 4px !important; white-space: nowrap !important; }
            .pdf-bar-amount { font-size: 12px !important; font-weight: 500 !important; color: #264A82 !important; text-align: center !important; }
            .pdf-chart-legend { display: flex !important; justify-content: center !important; gap: 20px !important; margin-top: 15px !important; }
            .pdf-legend-item { display: flex !important; align-items: center !important; gap: 6px !important; font-size: 11px !important; color: #374151 !important; }
            .pdf-legend-color { width: 16px !important; height: 16px !important; border-radius: 3px !important; }
            .pdf-legend-color.principal { background: #264A82 !important; }
            .pdf-legend-color.interest { background: #93c5fd !important; }
            .pdf-bar-text { font-size: 9px !important; font-weight: 500 !important; color: white !important; text-align: center !important; line-height: 1.2 !important; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important; white-space: nowrap !important; display: block !important; }
            
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
                    <tr class="rate-row">
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
                  
                  <tr class="rate-row">
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
                        ${parseLockInPeriod(pkg.lock_period) || 0} Years
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
                          `Save ${formatCurrency(Math.abs(pkg.totalSavings))}<br><small style="font-size: 8px; color: #6b7280;">Over ${parseLockInPeriod(pkg.lock_period) || 2} Year${parseLockInPeriod(pkg.lock_period) > 1 ? 's' : ''} Lock-in</small>` : 
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
                      <td class="${index === 0 ? 'recommended features-cell remarks-cell' : 'features-cell remarks-cell'}">
                        ${(pkg.custom_remarks || pkg.remarks || 'All packages are structured with fixed rates followed by floating rates based on 3M SORA.').replace(/\n/g, '<br>').substring(0, 300)}${(pkg.custom_remarks || pkg.remarks || '').length > 300 ? '...' : ''}
                      </td>
                    `).join('')}
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Monthly Repayment Comparison Section -->
            <div class="pdf-monthly-installment-section">
              <div class="pdf-section-title">Monthly Repayment Comparison</div>
              
              <table class="pdf-monthly-installment-table">
                <thead>
                  <tr>
                    <th class="row-header">RATE</th>
                    <th class="recommended-package-header">PKG(1)</th>
                    <th class="package-header">PKG(2)</th>
                    <th class="package-header">PKG(3)</th>
                  </tr>
                </thead>
                <tbody>
                  ${(() => {
                    // Calculate detailed repayment schedule for each package
                    const calculateDetailedSchedule = (pkg, loanAmount, tenureYears) => {
                      const totalMonths = tenureYears * 12;
                      let balance = loanAmount;
                      const yearlyData = [];
                      
                      for (let year = 1; year <= Math.min(5, tenureYears); year++) {
                        // eslint-disable-next-line no-unused-vars
                        const yearStartBalance = balance;
                        let yearInterestPaid = 0;
                        let yearPrincipalPaid = 0;
                        
                        // Get rate for this year
                        const currentRate = calculateInterestRate(pkg, year <= 5 ? year : 'thereafter');
                        
                        // Calculate monthly payment for this rate (using total loan amount and tenure)
                        const monthlyRate = currentRate / 100 / 12;
                        const monthlyPayment = monthlyRate === 0 ? loanAmount / totalMonths :
                          (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                          (Math.pow(1 + monthlyRate, totalMonths) - 1);
                        
                        // Calculate monthly breakdown for this year
                        for (let month = 1; month <= 12 && balance > 0.01; month++) {
                          const interestPayment = balance * monthlyRate;
                          const principalPayment = Math.min(monthlyPayment - interestPayment, balance);
                          
                          yearInterestPaid += interestPayment;
                          yearPrincipalPaid += principalPayment;
                          balance = Math.max(0, balance - principalPayment);
                          
                          if (balance <= 0.01) break;
                        }
                        
                        yearlyData.push({
                          year,
                          rate: currentRate,
                          monthlyInstalment: monthlyPayment,
                          interestPaid: yearInterestPaid,
                          principalPaid: yearPrincipalPaid
                        });
                        
                        if (balance <= 0.01) break;
                      }
                      
                      return yearlyData;
                    };
                    
                    // Calculate schedules for all packages
                    const packageSchedules = enhancedPackages.map(pkg => 
                      calculateDetailedSchedule(pkg, searchForm.loanAmount || 500000, searchForm.loanTenure || 25)
                    );
                    
                    return [1, 2, 3, 4, 5].map(year => {
                      const yearData = packageSchedules.map(schedule => 
                        schedule.find(data => data.year === year)
                      );
                      
                      return `
                        <tr class="rate-info-row">
                          <td class="detail-label">Year ${year} Rate</td>
                          ${yearData.map((data, index) => `
                            <td class="package-detail ${index === 0 ? 'recommended' : ''}">
                              ${data ? data.rate.toFixed(2) + '%' : 'N/A'}
                            </td>
                          `).join('')}
                        </tr>
                        
                        <tr class="year-row">
                          <td class="year-label">Monthly Installment</td>
                          ${yearData.map((data, index) => `
                            <td class="package-value ${index === 0 ? 'recommended' : ''}">
                              ${data ? formatCurrency(data.monthlyInstalment) : 'N/A'}
                            </td>
                          `).join('')}
                        </tr>
                        
                        <tr class="detail-row">
                          <td class="detail-label">Total Principal</td>
                          ${yearData.map((data, index) => `
                            <td class="package-detail ${index === 0 ? 'recommended' : ''}">
                              ${data ? formatCurrency(data.principalPaid) : 'N/A'}
                            </td>
                          `).join('')}
                        </tr>
                        
                        <tr class="detail-row">
                          <td class="detail-label">Total Interest</td>
                          ${yearData.map((data, index) => `
                            <td class="package-detail ${index === 0 ? 'recommended' : ''}">
                              ${data ? formatCurrency(data.interestPaid) : 'N/A'}
                            </td>
                          `).join('')}
                        </tr>
                        
                        ${selectedLoanType === 'Refinancing Home Loan' && searchForm.existingInterestRate ? `
                        <tr class="detail-row saving-row">
                          <td class="detail-label">Total Saving</td>
                          ${yearData.map((data, index) => {
                            if (!data) return '<td class="package-detail">N/A</td>';
                            const currentMonthlyPayment = calculateMonthlyInstallment(searchForm.loanAmount || 500000, searchForm.loanTenure || 25, parseFloat(searchForm.existingInterestRate));
                            const packageMonthlyPayment = data.monthlyInstalment;
                            const monthlySavings = currentMonthlyPayment - packageMonthlyPayment;
                            const yearSavings = monthlySavings * 12;
                            return `<td class="package-detail ${index === 0 ? 'recommended' : ''}">${formatCurrency(yearSavings)}</td>`;
                          }).join('')}
                        </tr>
                        ` : ''}
                      `;
                    }).join('');
                  })()}
                </tbody>
              </table>
            </div>

            <!-- Monthly Repayment Breakdown Chart -->
            <div class="pdf-chart-section">
              <div class="pdf-section-title">Monthly Repayment Breakdown</div>
              
              <div class="pdf-bar-chart">
                ${selectedLoanType === 'Refinancing Home Loan' && searchForm.existingInterestRate ? `
                  <!-- Current Rate Package for Refinancing -->
                  ${(() => {
                    const currentRate = parseFloat(searchForm.existingInterestRate);
                    const currentMonthlyPayment = calculateMonthlyInstallment(searchForm.loanAmount || 500000, searchForm.loanTenure || 25, currentRate);
                    const loanAmount = searchForm.loanAmount || 500000;
                    const monthlyRate = currentRate / 100 / 12;
                    const monthlyInterest = loanAmount * monthlyRate;
                    const monthlyPrincipal = currentMonthlyPayment - monthlyInterest;
                    
                    // Calculate bar height - normalize with new packages
                    const allPayments = [currentMonthlyPayment, ...enhancedPackages.map(p => {
                      const r = calculateInterestRate(p, 1);
                      return calculateMonthlyInstallment(searchForm.loanAmount || 500000, searchForm.loanTenure || 25, r);
                    })];
                    const maxPayment = Math.max(...allPayments);
                    const barHeight = (currentMonthlyPayment / maxPayment) * 200;
                    const principalHeight = (monthlyPrincipal / currentMonthlyPayment) * barHeight;
                    const interestHeight = (monthlyInterest / currentMonthlyPayment) * barHeight;
                    
                    return `
                      <div class="pdf-bar-item">
                        <div class="pdf-bar-rate" style="color: #dc2626;">${currentRate.toFixed(2)}%</div>
                        <div class="pdf-bar-container">
                          <div class="pdf-bar-stack" style="border: 2px solid #dc2626;">
                            <div class="pdf-bar-segment interest" style="height: ${interestHeight}px; background: #fca5a5 !important;">
                              <span class="pdf-bar-text">Interest<br>${formatCurrency(monthlyInterest)}</span>
                            </div>
                            <div class="pdf-bar-segment principal" style="height: ${principalHeight}px; background: #dc2626 !important;">
                              <span class="pdf-bar-text">Principal<br>${formatCurrency(monthlyPrincipal)}</span>
                            </div>
                          </div>
                        </div>
                        <div class="pdf-bar-label" style="color: #dc2626; font-weight: 700;">CURRENT</div>
                        <div class="pdf-bar-amount" style="color: #dc2626;">${formatCurrency(currentMonthlyPayment)}</div>
                      </div>
                    `;
                  })()}
                ` : ''}
                ${enhancedPackages.map((pkg, index) => {
                  // Get Year 1 data for each package
                  const rate = calculateInterestRate(pkg, 1);
                  const monthlyPayment = calculateMonthlyInstallment(searchForm.loanAmount || 500000, searchForm.loanTenure || 25, rate);
                  
                  // Calculate monthly principal and interest for Year 1
                  const loanAmount = searchForm.loanAmount || 500000;
                  const monthlyRate = rate / 100 / 12;
                  // eslint-disable-next-line no-unused-vars
                  const totalMonths = (searchForm.loanTenure || 25) * 12;
                  
                  // First month's interest and principal (as approximation)
                  const monthlyInterest = loanAmount * monthlyRate;
                  const monthlyPrincipal = monthlyPayment - monthlyInterest;
                  
                  // Calculate bar heights - normalize to 200px max
                  const allPayments = enhancedPackages.map(p => {
                    const r = calculateInterestRate(p, 1);
                    return calculateMonthlyInstallment(searchForm.loanAmount || 500000, searchForm.loanTenure || 25, r);
                  });
                  const maxPayment = Math.max(...allPayments);
                  const barHeight = (monthlyPayment / maxPayment) * 200;
                  const principalHeight = (monthlyPrincipal / monthlyPayment) * barHeight;
                  const interestHeight = (monthlyInterest / monthlyPayment) * barHeight;
                  
                  return `
                    <div class="pdf-bar-item">
                      <div class="pdf-bar-rate">${rate.toFixed(2)}%</div>
                      <div class="pdf-bar-container">
                        <div class="pdf-bar-stack new-package">
                          <div class="pdf-bar-segment interest" style="height: ${interestHeight}px;">
                            <span class="pdf-bar-text">Interest<br>${formatCurrency(monthlyInterest)}</span>
                          </div>
                          <div class="pdf-bar-segment principal" style="height: ${principalHeight}px;">
                            <span class="pdf-bar-text">Principal<br>${formatCurrency(monthlyPrincipal)}</span>
                          </div>
                        </div>
                      </div>
                      <div class="pdf-bar-label">PKG(${index + 1})</div>
                      <div class="pdf-bar-amount">${formatCurrency(monthlyPayment)}</div>
                    </div>
                  `;
                }).join('')}
              </div>
              
              <!-- Chart Legend -->
              <div class="pdf-chart-legend">
                <div class="pdf-legend-item">
                  <div class="pdf-legend-color principal"></div>
                  <span>Principal</span>
                </div>
                <div class="pdf-legend-item">
                  <div class="pdf-legend-color interest"></div>
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
                  <div class="sub-label">Over ${parseLockInPeriod(enhancedPackages[0]?.lock_period) || 2} Year${parseLockInPeriod(enhancedPackages[0]?.lock_period) > 1 ? 's' : ''} Lock-in</div>
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

      // Create downloadable PDF using html2canvas + jsPDF
      try {
        // Import libraries dynamically
        const html2canvas = (await import('html2canvas')).default;
        const jsPDF = (await import('jspdf')).jsPDF;
        
        // Create a temporary div to render the report
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = reportContent;
        tempDiv.style.cssText = 'position: absolute; left: -9999px; top: -9999px; width: 800px;';
        document.body.appendChild(tempDiv);
        
        // Wait a moment for styles to apply
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Convert HTML to canvas
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 800,
          height: tempDiv.scrollHeight
        });
        
        // Clean up temporary div
        document.body.removeChild(tempDiv);
        
        // Create PDF
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        let heightLeft = imgHeight;
        let position = 0;
        
        // Add first page
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Add additional pages if needed
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        // Download the PDF
        const fileName = `mortgage-report-${clientName || 'client'}-${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
        
        logger.info('PDF downloaded successfully:', fileName);
        
      } catch (pdfError) {
        logger.warn('PDF generation failed, falling back to HTML download:', pdfError);
        
        // Fallback: Download as HTML file
        const blob = new Blob([reportContent], { type: 'text/html' });
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `mortgage-report-${clientName || 'client'}-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(downloadLink.href);
      }
      
      // Also open in new window as fallback option for printing
      const printWindow = window.open('', '_blank');
      printWindow.document.write(reportContent);
      printWindow.document.close();
      
      logger.info('Enhanced PDF report generated successfully');
      
    } catch (error) {
      logger.error('Error generating enhanced PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
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
    
    // Local state for remarks to prevent re-render issues
    const [localRemarks, setLocalRemarks] = React.useState(pkg.custom_remarks || pkg.remarks || '');
    const [isEditing, setIsEditing] = React.useState(false);
    
    // Update local state when pkg changes
    React.useEffect(() => {
      if (!isEditing) {
        setLocalRemarks(pkg.custom_remarks || pkg.remarks || '');
      }
    }, [pkg.custom_remarks, pkg.remarks, isEditing]);
    
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
            const rate = calculateInterestRate(pkg, 'thereafter');
            rates.push(
              <div key={year} className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg text-center">
                <div className="text-xs font-medium text-blue-600 mb-1">YEAR {year}</div>
                <div className="text-lg font-bold text-blue-700">{formatPercentage(rate)}</div>
                <div className="text-xs text-blue-500 mt-1">{formatRateDisplay(pkg, 'thereafter')}</div>
              </div>
            );
          } else {
            // Only show dash if no thereafter rate exists
            rates.push(
              <div key={year} className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg text-center">
                <div className="text-xs font-medium text-gray-500 mb-1">YEAR {year}</div>
                <div className="text-lg font-bold text-gray-400">-</div>
              </div>
            );
          }
        } else {
          // Show actual data for this year
          const rate = calculateInterestRate(pkg, year);
          rates.push(
            <div key={year} className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg text-center">
              <div className="text-xs font-medium text-blue-600 mb-1">YEAR {year}</div>
              <div className="text-lg font-bold text-blue-700">{formatPercentage(rate)}</div>
              <div className="text-xs text-blue-500 mt-1">{formatRateDisplay(pkg, year)}</div>
            </div>
          );
        }
      }

      // Always show thereafter row
      const thereafterRate = calculateInterestRate(pkg, 'thereafter');
      if (thereafterRate > 0) {
        rates.push(
          <div key="thereafter" className="bg-green-50 border border-green-200 px-4 py-3 rounded-lg text-center">
            <div className="text-xs font-medium text-green-600 mb-1">THEREAFTER</div>
            <div className="text-lg font-bold text-green-700">{formatPercentage(thereafterRate)}</div>
            <div className="text-xs text-green-500 mt-1">{formatRateDisplay(pkg, 'thereafter')}</div>
          </div>
        );
      }

      return rates;
    }, [pkg, formatPercentage, formatRateDisplay, calculateInterestRate]);

    return (
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}>
        {/* Package Header - Mobile-Responsive Layout */}
        <div className="p-4 sm:p-6 border-b border-gray-100">
          {/* Mobile: Stacked Layout, Desktop: Horizontal Layout */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 space-y-4 lg:space-y-0">
            {/* Bank Info */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg sm:text-xl flex-shrink-0">
                {rank}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  {hideBankNames ? `Bank ${String.fromCharCode(64 + rank)}` : pkg.bank_name}
                </h3>
                <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium mt-1 ${
                  pkg.rate_type_category === 'Fixed' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {pkg.rate_type_category || 'FLOATING'}
                </span>
              </div>
            </div>
            
            {/* Property Details - Mobile: Grid, Desktop: Horizontal */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
              <div className="truncate">
                <span className="font-medium text-gray-500 block sm:inline">Property:</span> 
                <span className="font-semibold text-gray-900 block sm:inline sm:ml-1">{pkg.property_type}</span>
              </div>
              <div className="truncate">
                <span className="font-medium text-gray-500 block sm:inline">Status:</span> 
                <span className="font-semibold text-gray-900 block sm:inline sm:ml-1">{pkg.property_status}</span>
              </div>
              <div className="truncate">
                <span className="font-medium text-gray-500 block sm:inline">Buy Under:</span> 
                <span className="font-semibold text-gray-900 block sm:inline sm:ml-1">{pkg.buy_under}</span>
              </div>
              <div className="truncate">
                <span className="font-medium text-gray-500 block sm:inline">Lock:</span> 
                <span className="font-semibold text-gray-900 block sm:inline sm:ml-1">{pkg.lock_period || '0 Year'}</span>
              </div>
              <div className="truncate col-span-2 sm:col-span-1">
                <span className="font-medium text-gray-500 block sm:inline">Min Loan:</span> 
                <span className="font-semibold text-gray-900 block sm:inline sm:ml-1">{formatCurrency(pkg.minimum_loan_size || 0)}</span>
              </div>
            </div>
            
            {/* Rate, Payment and Include checkbox - Mobile: Center aligned, Desktop: Right aligned */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-end justify-center lg:justify-start lg:text-right">
              <div className="flex items-center gap-2 mb-2 lg:mb-2 order-3 sm:order-1 lg:order-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={onToggleSelection}
                  className="w-5 h-5 sm:w-4 sm:h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700 sm:hidden">Include in Report</span>
              </div>
              <div className="text-center lg:text-right order-1 sm:order-2 lg:order-2 flex-1 sm:ml-4 lg:ml-0">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">
                  {formatPercentage(pkg.avgFirst2Years)}
                </div>
                <div className="text-sm sm:text-base text-gray-600 font-medium">
                  {formatCurrency(pkg.monthlyInstallment)}/mo
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interest Rate Schedule */}
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <h4 className="text-base sm:text-lg font-semibold text-gray-900">Interest Rate Schedule</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
            {generateRateSchedule}
          </div>
        </div>

        {/* Package Features */}
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <h4 className="text-base sm:text-lg font-semibold text-gray-900">Package Features</h4>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">Editable</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {featureOptions.map(feature => (
              <label key={feature.value} className="flex items-center gap-3 cursor-pointer group min-h-[44px] sm:min-h-[auto] p-2 sm:p-0 rounded-lg hover:bg-gray-50 sm:hover:bg-transparent transition-colors">
                <input
                  type="checkbox"
                  checked={pkg[feature.value] === 'true' || pkg[feature.value] === true}
                  onChange={(e) => onUpdateFeature(feature.value, e.target.checked)}
                  className="w-5 h-5 sm:w-4 sm:h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                />
                <span className="text-sm sm:text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                  {feature.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Client Remarks */}
        <div className="p-4 sm:p-6 bg-blue-50">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            <h4 className="text-base sm:text-lg font-semibold text-gray-900">CLIENT REMARKS</h4>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">EDITABLE</span>
          </div>
          <textarea
            value={localRemarks}
            onChange={(e) => {
              setLocalRemarks(e.target.value);
              setIsEditing(true);
            }}
            onBlur={(e) => {
              setIsEditing(false);
              onUpdateRemarks(e.target.value);
            }}
            onFocus={() => setIsEditing(true)}
            placeholder="Enter remarks for this package..."
            rows="4"
            className="w-full px-3 sm:px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm text-gray-700 min-h-[100px]"
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

      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        {/* Loan Type Tabs */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {['New Home Loan', 'Refinancing Home Loan', 'Commercial/Industrial'].map((loanType) => (
              <button
                key={loanType}
                onClick={() => handleLoanTypeSelect(loanType)}
                className={`flex items-center justify-center sm:justify-start gap-2 px-4 sm:px-6 py-3 rounded-lg font-medium transition-all duration-200 min-h-[48px] text-sm sm:text-base ${
                  selectedLoanType === loanType
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200'
                }`}
              >
                {loanType === 'New Home Loan' && <Home className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />}
                {loanType === 'Refinancing Home Loan' && <Repeat className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />}
                {loanType === 'Commercial/Industrial' && <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />}
                <span className="truncate">{loanType}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filter Form */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Row 1: Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                <select
                  value={searchForm.propertyType}
                  onChange={(e) => handleInputChange('propertyType', e.target.value)}
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm min-h-[44px] sm:min-h-[auto]"
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
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm min-h-[44px] sm:min-h-[auto]"
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
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm min-h-[44px] sm:min-h-[auto]"
                >
                  <option value="">Select Buy Under</option>
                  <option value="Individual Name">Individual Name</option>
                  <option value="Company Operating">Company Operating</option>
                  <option value="Company Investment">Company Investment</option>
                </select>
              </div>
            </div>

            {/* Row 2: Financial Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loan Amount ($)</label>
                <input
                  type="number"
                  value={searchForm.loanAmount}
                  onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                  placeholder="500,000"
                  min="0"
                  step="1000"
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm min-h-[44px] sm:min-h-[auto]"
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
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm min-h-[44px] sm:min-h-[auto]"
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

                {/* Action Buttons - Mobile: Stacked, Desktop: Horizontal */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                  <button
                    onClick={generateProfessionalReport}
                    disabled={filteredPackages.length === 0 || isGeneratingPDF}
                    className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium min-h-[44px] sm:min-h-[auto] transition-colors"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <div className="w-4 h-4 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm sm:text-sm">Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 sm:w-4 sm:h-4" />
                        <span className="text-sm sm:text-sm">Generate PDF Report</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={exportCSV}
                    disabled={filteredPackages.length === 0}
                    className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium min-h-[44px] sm:min-h-[auto] transition-colors"
                  >
                    <Download className="w-4 h-4 sm:w-4 sm:h-4" />
                    <span className="text-sm sm:text-sm">Export CSV</span>
                  </button>
                  
                  <button
                    onClick={toggleAllPackages}
                    disabled={filteredPackages.length === 0}
                    className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium min-h-[44px] sm:min-h-[auto] transition-colors"
                  >
                    <CheckSquare className="w-4 h-4 sm:w-4 sm:h-4" />
                    <span className="text-sm sm:text-sm">Toggle All</span>
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