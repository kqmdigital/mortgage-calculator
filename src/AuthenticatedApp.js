import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Calculator, Download, CheckCircle, XCircle, Info, LogOut, Home, Building, TrendingUp, DollarSign, BarChart3, Sparkles, Users, Menu, UserPlus, Building2, Factory } from 'lucide-react';
import { useAuth } from './contexts/EnhancedAuthContext';
import logger from './utils/logger';
import useDebounce from './hooks/useDebounce';
import ProgressivePaymentCalculator from './ProgressivePaymentCalculator';
import MonthlyRepaymentCalculator from './MonthlyRepaymentCalculator';
import AdminManagement from './components/AdminManagement';
import { generatePDFReport } from './utils/pdfReportGenerator';

// Import your existing TDSRMSRCalculator component from App.js
// Main TDSR/MSR Calculator Component
const TDSRMSRCalculator = ({ currentUser, onLogout }) => {
  const [inputs, setInputs] = useState({
    propertyType: 'private',
    purchasePrice: '',
    loanPercentage: 75,
    customLoanAmount: '',
    useCustomAmount: false,
    stressTestRate: 4,
    loanTenor: '',
    monthlySalaryA: '',
    annualSalaryA: '',
    applicantAgeA: '',
    monthlySalaryB: '',
    annualSalaryB: '',
    applicantAgeB: '',
    showFundAmount: '',
    pledgeAmount: '',
    carLoanA: '',
    carLoanB: '',
    personalLoanA: '',
    personalLoanB: '',
    propertyLoanA: '',
    propertyLoanB: ''
  });

  const [results, setResults] = useState(null);
  const [loanTenorManuallyEdited, setLoanTenorManuallyEdited] = useState(false);
  const [annualSalaryAManuallyEdited, setAnnualSalaryAManuallyEdited] = useState(false);
  const [annualSalaryBManuallyEdited, setAnnualSalaryBManuallyEdited] = useState(false);

  // Helper function to get default stress test rate based on property type
  const getDefaultStressTestRate = (propertyType) => {
    switch (propertyType) {
      case 'commercial':
        return 5;
      default:
        return 4;
    }
  };

  // Helper function to get property type display text
  const getPropertyTypeText = (type) => {
    switch (type) {
      case 'private': return 'Private Property';
      case 'hdb': return 'HDB Property';
      case 'ec': return 'EC Property';
      case 'commercial': return 'Commercial/Industrial Property';
      default: return 'Property';
    }
  };

  // Helper functions (keeping the same logic as before)
  const formatCurrencyInput = (value) => {
    if (value === '' || value === null || value === undefined) return '';
    const num = parseFloat(value.toString().replace(/,/g, ''));
    if (isNaN(num)) return '';
    return num.toLocaleString();
  };

  const parseNumberInput = (value) => {
    if (value === '' || value === null || value === undefined) return '';
    const num = parseFloat(value.toString().replace(/,/g, ''));
    return isNaN(num) ? '' : num;
  };

  const calculateAverageAge = useCallback(() => {
    const ageA = parseNumberInput(inputs.applicantAgeA) || 0;
    const ageB = parseNumberInput(inputs.applicantAgeB) || 0;
    const salaryA = parseNumberInput(inputs.monthlySalaryA) || 0;
    const salaryB = parseNumberInput(inputs.monthlySalaryB) || 0;
    
    // Use Income Weighted Average Age (IWAA) formula
    // Formula: (age1*salary1) + (age2*salary2) / (salary1 + salary2)
    if (ageA > 0 && ageB > 0 && salaryA > 0 && salaryB > 0) {
      const totalSalary = salaryA + salaryB;
      return ((ageA * salaryA) + (ageB * salaryB)) / totalSalary;
    } else if (ageA > 0 && salaryA > 0) {
      return ageA; // Single applicant A
    } else if (ageB > 0 && salaryB > 0) {
      return ageB; // Single applicant B
    } else if (ageA > 0 && ageB > 0) {
      // Fallback to simple average if no salary data
      return (ageA + ageB) / 2;
    } else if (ageA > 0) {
      return ageA;
    } else if (ageB > 0) {
      return ageB;
    }
    return 0;
  }, [inputs.applicantAgeA, inputs.applicantAgeB, inputs.monthlySalaryA, inputs.monthlySalaryB]);

  const calculateMaxLoanTenor = useCallback(() => {
    const averageAge = calculateAverageAge();
    
    let loanPercentage;
    if (inputs.useCustomAmount) {
      const purchasePrice = parseNumberInput(inputs.purchasePrice) || 0;
      const customAmount = parseNumberInput(inputs.customLoanAmount) || 0;
      loanPercentage = purchasePrice > 0 ? (customAmount / purchasePrice) * 100 : 75;
    } else {
      loanPercentage = inputs.loanPercentage;
    }
    
    if (averageAge === 0) {
      if (inputs.propertyType === 'hdb') {
        return loanPercentage >= 56 && loanPercentage <= 75 ? 25 : 30;
      } else if (inputs.propertyType === 'commercial') {
        // Commercial/Industrial properties: max 30 years regardless of LTV
        return 30;
      } else {
        // Private and EC properties
        return loanPercentage >= 56 && loanPercentage <= 75 ? 30 : 35;
      }
    }
    
    if (inputs.propertyType === 'hdb') {
      if (loanPercentage >= 56 && loanPercentage <= 75) {
        return Math.min(25, Math.max(1, 65 - averageAge));
      } else if (loanPercentage <= 55) {
        return Math.min(30, Math.max(1, 75 - averageAge));
      }
    } else if (inputs.propertyType === 'commercial') {
      // Commercial/Industrial properties: max 30 years, age limit up to 75
      return Math.min(30, Math.max(1, 75 - averageAge));
    } else {
      // Private and EC properties use standard private property age rules
      if (loanPercentage >= 56 && loanPercentage <= 75) {
        return Math.min(30, Math.max(1, 65 - averageAge));
      } else if (loanPercentage <= 55) {
        return Math.min(35, Math.max(1, 75 - averageAge));
      }
    }
    
    return 30;
  }, [inputs.propertyType, inputs.useCustomAmount, inputs.purchasePrice, inputs.customLoanAmount, inputs.loanPercentage, calculateAverageAge]);

  // Helper function to calculate max tenure for a specific loan percentage
  const calculateMaxTenureForLTV = useCallback((loanPercentage, propertyType, averageAge) => {
    if (averageAge === 0) {
      if (propertyType === 'hdb') {
        return loanPercentage >= 56 && loanPercentage <= 75 ? 25 : 30;
      } else if (propertyType === 'commercial') {
        // Commercial/Industrial properties: max 30 years regardless of LTV
        return 30;
      } else {
        // Private and EC properties
        return loanPercentage >= 56 && loanPercentage <= 75 ? 30 : 35;
      }
    }
    
    if (propertyType === 'hdb') {
      if (loanPercentage >= 56 && loanPercentage <= 75) {
        return Math.min(25, Math.max(1, 65 - averageAge));
      } else if (loanPercentage <= 55) {
        return Math.min(30, Math.max(1, 75 - averageAge));
      }
    } else if (propertyType === 'commercial') {
      // Commercial/Industrial properties: max 30 years, age limit up to 75
      return Math.min(30, Math.max(1, 75 - averageAge));
    } else {
      // Private and EC properties use standard private property age rules
      if (loanPercentage >= 56 && loanPercentage <= 75) {
        return Math.min(30, Math.max(1, 65 - averageAge));
      } else if (loanPercentage <= 55) {
        return Math.min(35, Math.max(1, 75 - averageAge));
      }
    }
    
    return 30;
  }, []);

  const calculatePMT = (rate, periods, principal) => {
    if (rate === 0) return principal / periods;
    const monthlyRate = rate / 100 / 12;
    const denominator = Math.pow(1 + monthlyRate, periods) - 1;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, periods)) / denominator;
  };

  // Calculate stamp duty based on property type and purchase price
  const calculateStampDuty = (purchasePrice, propertyType) => {
    if (!purchasePrice || purchasePrice <= 0) return 0;
    
    // Residential properties (Private, EC, HDB)
    if (propertyType !== 'commercial') {
      if (purchasePrice <= 180000) {
        return purchasePrice * 0.01;
      } else if (purchasePrice <= 360000) {
        return 1800 + (purchasePrice - 180000) * 0.02;
      } else if (purchasePrice <= 1000000) {
        return 1800 + 3600 + (purchasePrice - 360000) * 0.03;
      } else {
        return 1800 + 3600 + 19200 + (purchasePrice - 1000000) * 0.04;
      }
    } else {
      // Commercial/Industrial properties
      if (purchasePrice <= 180000) {
        return purchasePrice * 0.01;
      } else if (purchasePrice <= 360000) {
        return 1800 + (purchasePrice - 180000) * 0.02;
      } else {
        return 1800 + 3600 + (purchasePrice - 360000) * 0.03;
      }
    }
  };

  // Calculate downpayment breakdown
  const calculateDownPayment = (purchasePrice, loanAmount, propertyType, loanPercentage) => {
    if (!purchasePrice || purchasePrice <= 0) return { cashRequired: 0, cpfAllowed: 0, totalDownPayment: 0 };
    
    const totalDownPayment = purchasePrice - loanAmount;
    
    // Commercial/Industrial properties - cash only, no CPF
    if (propertyType === 'commercial') {
      return {
        cashRequired: totalDownPayment, // 20% cash for 80% loan
        cpfAllowed: 0,
        totalDownPayment
      };
    }
    
    // Residential properties (PTE, EC, HDB) - different cash requirements based on loan percentage
    let cashPercentage = 0;
    let cpfPercentage = 0;
    
    if (loanPercentage <= 55) {
      // 55% loan: 10% cash + 35% CPF/Cash
      cashPercentage = 10;
      cpfPercentage = 35;
    } else if (loanPercentage <= 75) {
      // 75% loan: 5% cash + 20% CPF/Cash  
      cashPercentage = 5;
      cpfPercentage = 20;
    } else {
      // Higher loan percentages - minimum 5% cash
      cashPercentage = 5;
      cpfPercentage = Math.max(0, (100 - loanPercentage) - 5);
    }
    
    const cashRequired = (purchasePrice * cashPercentage) / 100;
    const cpfAllowed = (purchasePrice * cpfPercentage) / 100;
    
    return {
      cashRequired,
      cpfAllowed,
      totalDownPayment
    };
  };

  // Calculate maximum affordability based on income and commitments
  const calculateMaxAffordability = useCallback(() => {
    const {
      propertyType,
      monthlySalaryA, annualSalaryA,
      monthlySalaryB, annualSalaryB,
      showFundAmount, pledgeAmount,
      carLoanA, carLoanB, personalLoanA, personalLoanB,
      propertyLoanA, propertyLoanB, stressTestRate
    } = inputs;

    const parsedInputs = {
      monthlySalaryA: parseNumberInput(monthlySalaryA) || 0,
      annualSalaryA: parseNumberInput(annualSalaryA) || 0,
      monthlySalaryB: parseNumberInput(monthlySalaryB) || 0,
      annualSalaryB: parseNumberInput(annualSalaryB) || 0,
      showFundAmount: parseNumberInput(showFundAmount) || 0,
      pledgeAmount: parseNumberInput(pledgeAmount) || 0,
      carLoanA: parseNumberInput(carLoanA) || 0,
      carLoanB: parseNumberInput(carLoanB) || 0,
      personalLoanA: parseNumberInput(personalLoanA) || 0,
      personalLoanB: parseNumberInput(personalLoanB) || 0,
      propertyLoanA: parseNumberInput(propertyLoanA) || 0,
      propertyLoanB: parseNumberInput(propertyLoanB) || 0,
      stressTestRate: parseNumberInput(stressTestRate) || 0
    };

    // Return early if no income data
    if (parsedInputs.monthlySalaryA === 0 && parsedInputs.monthlySalaryB === 0) {
      return null;
    }

    // Calculate total monthly income (same logic as main calculator)
    const baseSalaryA = parsedInputs.monthlySalaryA * 12;
    const baseSalaryB = parsedInputs.monthlySalaryB * 12;
    const bonusIncomeA = Math.max(0, (parsedInputs.annualSalaryA - baseSalaryA) / 12) * 0.7;
    const bonusIncomeB = Math.max(0, (parsedInputs.annualSalaryB - baseSalaryB) / 12) * 0.7;
    
    const showFundIncomeA = parsedInputs.showFundAmount * 0.00625;
    const pledgeIncomeB = parsedInputs.pledgeAmount / 48;
    
    const totalMonthlyIncomeA = parsedInputs.monthlySalaryA + bonusIncomeA + showFundIncomeA;
    const totalMonthlyIncomeB = parsedInputs.monthlySalaryB + bonusIncomeB + pledgeIncomeB;
    const combinedMonthlyIncome = totalMonthlyIncomeA + totalMonthlyIncomeB;

    // Calculate total commitments
    const totalCarPersonalLoans = parsedInputs.carLoanA + parsedInputs.carLoanB + 
                                  parsedInputs.personalLoanA + parsedInputs.personalLoanB;
    const totalPropertyLoans = parsedInputs.propertyLoanA + parsedInputs.propertyLoanB;
    const totalCommitmentsTDSR = totalCarPersonalLoans + totalPropertyLoans;

    // Calculate maximum monthly installment based on income limits
    const maxMonthlyTDSR = (combinedMonthlyIncome * 0.55) - totalCommitmentsTDSR;
    const maxMonthlyMSR = (combinedMonthlyIncome * 0.30) - totalPropertyLoans; // MSR only considers property loans

    // Use the more restrictive limit
    let maxMonthlyInstallment;
    let limitingFactor;
    let relevantCommitments;
    
    if (propertyType === 'hdb' || propertyType === 'ec') {
      // HDB/EC uses the more restrictive of MSR or TDSR
      if (maxMonthlyMSR < maxMonthlyTDSR) {
        maxMonthlyInstallment = maxMonthlyMSR;
        limitingFactor = 'MSR (30%)';
        relevantCommitments = totalPropertyLoans; // MSR only includes property loans
      } else {
        maxMonthlyInstallment = maxMonthlyTDSR;
        limitingFactor = 'TDSR (55%)';
        relevantCommitments = totalCommitmentsTDSR; // TDSR includes all commitments
      }
    } else {
      // Private and Commercial use TDSR only
      maxMonthlyInstallment = maxMonthlyTDSR;
      limitingFactor = 'TDSR (55%)';
      relevantCommitments = totalCommitmentsTDSR; // TDSR includes all commitments
    }

    // Ensure positive value
    maxMonthlyInstallment = Math.max(0, maxMonthlyInstallment);

    if (maxMonthlyInstallment <= 0 || parsedInputs.stressTestRate <= 0) {
      return {
        combinedMonthlyIncome,
        totalCommitmentsTDSR: relevantCommitments,
        maxMonthlyInstallment: 0,
        maxLoanAmount: 0,
        maxPropertyPrice75: 0,
        maxPropertyPrice80: 0,
        maxPropertyPrice55: 0,
        limitingFactor,
        hasValidData: false
      };
    }

    // Calculate maximum loan amounts and property prices for different LTV scenarios with proper tenures
    const averageAge = calculateAverageAge();
    
    // Get maximum tenure for different LTV ratios based on loan percentage rules
    const maxTenure55 = calculateMaxTenureForLTV(55, propertyType, averageAge);
    const maxTenure75 = calculateMaxTenureForLTV(75, propertyType, averageAge);
    const maxTenure80 = calculateMaxTenureForLTV(80, propertyType, averageAge);
    
    // Calculate maximum loan amounts for each LTV scenario using their respective tenures
    const maxLoanAmount55 = calculateLoanFromPMT(parsedInputs.stressTestRate, maxTenure55 * 12, maxMonthlyInstallment);
    const maxLoanAmount75 = calculateLoanFromPMT(parsedInputs.stressTestRate, maxTenure75 * 12, maxMonthlyInstallment);
    const maxLoanAmount80 = calculateLoanFromPMT(parsedInputs.stressTestRate, maxTenure80 * 12, maxMonthlyInstallment);

    // Calculate maximum property prices for different LTV ratios
    const maxPropertyPrice55 = maxLoanAmount55 / 0.55;  // 55% LTV with longer tenure
    const maxPropertyPrice75 = maxLoanAmount75 / 0.75;  // 75% LTV with standard tenure
    const maxPropertyPrice80 = maxLoanAmount80 / 0.80;  // 80% LTV with commercial tenure

    // Use the most common scenario (75% for residential, 80% for commercial) as the primary loan amount
    const primaryLoanAmount = propertyType === 'commercial' ? maxLoanAmount80 : maxLoanAmount75;
    const primaryTenure = propertyType === 'commercial' ? maxTenure80 : maxTenure75;

    return {
      combinedMonthlyIncome,
      totalCommitmentsTDSR: relevantCommitments,
      maxMonthlyInstallment,
      maxLoanAmount: primaryLoanAmount,
      maxLoanAmount55,
      maxLoanAmount75,
      maxLoanAmount80,
      maxPropertyPrice75,
      maxPropertyPrice80,
      maxPropertyPrice55,
      maxTenure55,
      maxTenure75,
      maxTenure80,
      limitingFactor,
      hasValidData: true,
      maxTenureUsed: primaryTenure
    };
  }, [inputs, calculateAverageAge, calculateMaxTenureForLTV]);

  // Helper function to calculate loan amount from PMT (reverse PMT calculation)
  const calculateLoanFromPMT = (rate, periods, monthlyPayment) => {
    if (rate === 0) return monthlyPayment * periods;
    const monthlyRate = rate / 100 / 12;
    return monthlyPayment * (Math.pow(1 + monthlyRate, periods) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, periods));
  };

  const calculateMortgage = useCallback(() => {
    const {
      propertyType, purchasePrice, loanPercentage, customLoanAmount, useCustomAmount,
      stressTestRate, loanTenor,
      monthlySalaryA, annualSalaryA, applicantAgeA,
      monthlySalaryB, annualSalaryB, applicantAgeB,
      showFundAmount, pledgeAmount,
      carLoanA, carLoanB, personalLoanA, personalLoanB,
      propertyLoanA, propertyLoanB
    } = inputs;

    const parsedInputs = {
      purchasePrice: parseNumberInput(purchasePrice) || 0,
      customLoanAmount: parseNumberInput(customLoanAmount) || 0,
      stressTestRate: parseNumberInput(stressTestRate) || 0,
      loanTenor: parseNumberInput(loanTenor) || 0,
      monthlySalaryA: parseNumberInput(monthlySalaryA) || 0,
      annualSalaryA: parseNumberInput(annualSalaryA) || 0,
      applicantAgeA: parseNumberInput(applicantAgeA) || 0,
      monthlySalaryB: parseNumberInput(monthlySalaryB) || 0,
      annualSalaryB: parseNumberInput(annualSalaryB) || 0,
      applicantAgeB: parseNumberInput(applicantAgeB) || 0,
      showFundAmount: parseNumberInput(showFundAmount) || 0,
      pledgeAmount: parseNumberInput(pledgeAmount) || 0,
      carLoanA: parseNumberInput(carLoanA) || 0,
      carLoanB: parseNumberInput(carLoanB) || 0,
      personalLoanA: parseNumberInput(personalLoanA) || 0,
      personalLoanB: parseNumberInput(personalLoanB) || 0,
      propertyLoanA: parseNumberInput(propertyLoanA) || 0,
      propertyLoanB: parseNumberInput(propertyLoanB) || 0
    };

    const averageAge = calculateAverageAge();
    const maxLoanTenor = calculateMaxLoanTenor();

    let loanAmount;
    if (useCustomAmount) {
      loanAmount = parsedInputs.customLoanAmount;
    } else {
      loanAmount = parsedInputs.purchasePrice * (loanPercentage / 100);
    }
    
    const loanAmount75 = parsedInputs.purchasePrice * 0.75;
    const loanAmount55 = parsedInputs.purchasePrice * 0.55;
    
    const monthlyInstallmentStressTest = calculatePMT(parsedInputs.stressTestRate, parsedInputs.loanTenor * 12, loanAmount);
    const monthlyInstallment = monthlyInstallmentStressTest;
    
    const baseSalaryA = parsedInputs.monthlySalaryA * 12;
    const baseSalaryB = parsedInputs.monthlySalaryB * 12;
    const bonusIncomeA = Math.max(0, (parsedInputs.annualSalaryA - baseSalaryA) / 12) * 0.7;
    const bonusIncomeB = Math.max(0, (parsedInputs.annualSalaryB - baseSalaryB) / 12) * 0.7;
    
    const showFundIncomeA = parsedInputs.showFundAmount * 0.00625;
    const showFundIncomeB = 0;
    const pledgeIncomeA = 0;
    const pledgeIncomeB = parsedInputs.pledgeAmount / 48;
    
    const totalMonthlyIncomeA = parsedInputs.monthlySalaryA + bonusIncomeA + showFundIncomeA + pledgeIncomeA;
    const totalMonthlyIncomeB = parsedInputs.monthlySalaryB + bonusIncomeB + showFundIncomeB + pledgeIncomeB;
    const combinedMonthlyIncome = totalMonthlyIncomeA + totalMonthlyIncomeB;
    
    let totalCommitments;
    let totalCommitmentsTDSR;
    
    if (propertyType === 'hdb' || propertyType === 'ec') {
      // HDB and EC: MSR includes only property loans, TDSR includes all commitments
      totalCommitments = parsedInputs.propertyLoanA + parsedInputs.propertyLoanB;
      totalCommitmentsTDSR = parsedInputs.carLoanA + parsedInputs.carLoanB + parsedInputs.personalLoanA + parsedInputs.personalLoanB + parsedInputs.propertyLoanA + parsedInputs.propertyLoanB;
    } else {
      // Private and Commercial: TDSR only, includes all commitments
      totalCommitments = parsedInputs.carLoanA + parsedInputs.carLoanB + parsedInputs.personalLoanA + parsedInputs.personalLoanB + parsedInputs.propertyLoanA + parsedInputs.propertyLoanB;
      totalCommitmentsTDSR = totalCommitments;
    }
    
    const tdsr55Available = (combinedMonthlyIncome * 0.55) - totalCommitmentsTDSR;
    const msr30Available = combinedMonthlyIncome * 0.3;
    
    const requiredIncomeTDSR = (monthlyInstallment + totalCommitmentsTDSR) / 0.55;
    const requiredIncomeHDB = (monthlyInstallment + totalCommitments) / 0.3;
    
    const tdsrDeficit = combinedMonthlyIncome - requiredIncomeTDSR;
    const hdbDeficit = combinedMonthlyIncome - requiredIncomeHDB;
    
    const tdsrPass = tdsrDeficit >= 0;
    const hdbPass = hdbDeficit >= 0;
    
    const cashShowTDSR = tdsrPass ? 0 : Math.abs(tdsrDeficit) / 0.00625;
    const cashShowHDB = hdbPass ? 0 : Math.abs(hdbDeficit) / 0.00625;
    const cashPledgeTDSR = tdsrPass ? 0 : Math.abs(tdsrDeficit) * 48;
    const cashPledgeHDB = hdbPass ? 0 : Math.abs(hdbDeficit) * 48;

    // Calculate actual TDSR and MSR percentages
    const actualTDSRPercentage = combinedMonthlyIncome > 0 ? ((monthlyInstallment + totalCommitmentsTDSR) / combinedMonthlyIncome) * 100 : 0;
    const actualMSRPercentage = combinedMonthlyIncome > 0 ? ((monthlyInstallment + totalCommitments) / combinedMonthlyIncome) * 100 : 0;

    // Calculate stamp duty and downpayment
    const stampDuty = calculateStampDuty(parsedInputs.purchasePrice, propertyType);
    const downPayment = calculateDownPayment(parsedInputs.purchasePrice, loanAmount, propertyType, useCustomAmount ? ((parsedInputs.customLoanAmount / parsedInputs.purchasePrice) * 100) : loanPercentage);

    return {
      propertyType,
      loanAmount,
      loanAmount75,
      loanAmount55,
      monthlyInstallment,
      monthlyInstallmentStressTest,
      combinedMonthlyIncome,
      totalMonthlyIncomeA,
      totalMonthlyIncomeB,
      bonusIncomeA,
      bonusIncomeB,
      showFundIncomeA,
      pledgeIncomeA,
      pledgeIncomeB,
      tdsr55Available,
      msr30Available,
      requiredIncomeTDSR,
      requiredIncomeHDB,
      tdsrDeficit,
      hdbDeficit,
      tdsrPass,
      hdbPass,
      cashShowTDSR,
      cashShowHDB,
      cashPledgeTDSR,
      cashPledgeHDB,
      totalCommitments,
      totalCommitmentsTDSR,
      averageAge,
      actualTDSRPercentage,
      actualMSRPercentage,
      maxLoanTenor,
      stampDuty,
      downPayment,
      purchasePrice: parsedInputs.purchasePrice
    };
  }, [inputs, calculateAverageAge, calculateMaxLoanTenor]);

  // ✅ OPTIMIZED: Debounce inputs and memoize calculations
  const debouncedInputs = useDebounce(inputs, 300);
  
  const memoizedResults = useMemo(() => {
    return calculateMortgage();
  }, [debouncedInputs, calculateMortgage]);

  // Memoize affordability calculations
  const memoizedAffordability = useMemo(() => {
    return calculateMaxAffordability();
  }, [debouncedInputs, calculateMaxAffordability]);

  React.useEffect(() => {
    setResults(memoizedResults);
  }, [memoizedResults]);

  // Auto-populate loan tenor with max loan tenor if user hasn't manually edited it
  React.useEffect(() => {
    if (!loanTenorManuallyEdited && results?.maxLoanTenor) {
      setInputs(prev => ({
        ...prev,
        loanTenor: results.maxLoanTenor.toString()
      }));
    }
  }, [results?.maxLoanTenor, loanTenorManuallyEdited]);

  // Auto-populate annual salary A with monthly salary A × 12 if user hasn't manually edited it
  React.useEffect(() => {
    const monthlySalaryA = parseNumberInput(inputs.monthlySalaryA);
    if (!annualSalaryAManuallyEdited && monthlySalaryA > 0) {
      const calculatedAnnual = monthlySalaryA * 12;
      setInputs(prev => ({
        ...prev,
        annualSalaryA: calculatedAnnual.toString()
      }));
    } else if (!monthlySalaryA && !annualSalaryAManuallyEdited) {
      // Reset annual salary when monthly is cleared
      setInputs(prev => ({
        ...prev,
        annualSalaryA: ''
      }));
    }
  }, [inputs.monthlySalaryA, annualSalaryAManuallyEdited]);

  // Auto-populate annual salary B with monthly salary B × 12 if user hasn't manually edited it
  React.useEffect(() => {
    const monthlySalaryB = parseNumberInput(inputs.monthlySalaryB);
    if (!annualSalaryBManuallyEdited && monthlySalaryB > 0) {
      const calculatedAnnual = monthlySalaryB * 12;
      setInputs(prev => ({
        ...prev,
        annualSalaryB: calculatedAnnual.toString()
      }));
    } else if (!monthlySalaryB && !annualSalaryBManuallyEdited) {
      // Reset annual salary when monthly is cleared  
      setInputs(prev => ({
        ...prev,
        annualSalaryB: ''
      }));
    }
  }, [inputs.monthlySalaryB, annualSalaryBManuallyEdited]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleInputChange = (field, value) => {
    const numericFields = [
      'purchasePrice', 'customLoanAmount', 'monthlySalaryA', 'annualSalaryA', 
      'monthlySalaryB', 'annualSalaryB', 'showFundAmount', 'pledgeAmount',
      'carLoanA', 'carLoanB', 'personalLoanA', 'personalLoanB', 
      'propertyLoanA', 'propertyLoanB', 'applicantAgeA', 'applicantAgeB'
    ];
    
    if (field === 'monthlySalaryA') {
      // Handle monthly salary A changes and reset annual salary manual edit flag if cleared
      if (value === '' || value === null || value === undefined) {
        setAnnualSalaryAManuallyEdited(false); // Reset flag when monthly is cleared
      }
      setInputs(prev => ({
        ...prev,
        [field]: value
      }));
    } else if (field === 'monthlySalaryB') {
      // Handle monthly salary B changes and reset annual salary manual edit flag if cleared
      if (value === '' || value === null || value === undefined) {
        setAnnualSalaryBManuallyEdited(false); // Reset flag when monthly is cleared
      }
      setInputs(prev => ({
        ...prev,
        [field]: value
      }));
    } else if (field === 'annualSalaryA') {
      // Mark annual salary A as manually edited when user changes it
      setAnnualSalaryAManuallyEdited(true);
      setInputs(prev => ({
        ...prev,
        [field]: value
      }));
    } else if (field === 'annualSalaryB') {
      // Mark annual salary B as manually edited when user changes it
      setAnnualSalaryBManuallyEdited(true);
      setInputs(prev => ({
        ...prev,
        [field]: value
      }));
    } else if (field === 'purchasePrice') {
      setInputs(prev => ({
        ...prev,
        [field]: value
      }));
    } else if (numericFields.includes(field)) {
      // ✅ FIXED: Store raw value to allow empty fields  
      setInputs(prev => ({
        ...prev,
        [field]: value  // Store raw input, parse only during calculations
      }));
    } else if (field === 'stressTestRate') {
      // ✅ FIXED: Allow empty stress test rate
      setInputs(prev => ({
        ...prev,
        [field]: value  // Store raw value
      }));
    } else if (field === 'loanTenor') {
      // ✅ FIXED: Store raw value for loan tenor and mark as manually edited
      setLoanTenorManuallyEdited(true);
      setInputs(prev => ({
        ...prev,
        [field]: value
      }));
    } else if (field === 'loanTenorValidation') {
      // Separate validation logic
      const parsedValue = parseNumberInput(value);
      const maxTenor = calculateMaxLoanTenor();
      if (parsedValue === '' || parsedValue === null || parsedValue === undefined) {
        setInputs(prev => ({
          ...prev,
          [field]: ''
        }));
      } else {
        const cappedValue = Math.min(maxTenor, Math.max(1, parsedValue));
        setInputs(prev => ({
          ...prev,
          [field]: cappedValue
        }));
      }
    } else if (field === 'propertyType') {
      // When property type changes, update stress test rate, loan percentage defaults, and reset manual edit flags
      const newStressTestRate = getDefaultStressTestRate(value);
      const defaultLoanPercentage = value === 'commercial' ? 80 : 75;
      setLoanTenorManuallyEdited(false); // Allow auto-population for new property type
      setInputs(prev => ({
        ...prev,
        [field]: value,
        stressTestRate: newStressTestRate,
        loanPercentage: prev.useCustomAmount ? prev.loanPercentage : defaultLoanPercentage
      }));
    } else {
      setInputs(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };


  return (
    <div className="space-y-12">
      {/* Input Section - Full Width */}
      <div className="space-y-8">
        
        {/* Input Cards in Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">{/* Left Column: Property & Loan Config */}
          {/* Property Type Selection */}
          <div className="standard-card card-gradient-purple">
            <div className="section-header">
              <div className="icon-container purple">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div className="text-content">
                <h2>Property Type Selection</h2>
                <p>Choose your property category</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="radio-card">
                <input
                  type="radio"
                  name="propertyType"
                  value="private"
                  checked={inputs.propertyType === 'private'}
                  onChange={(e) => handleInputChange('propertyType', e.target.value)}
                />
                <div className="radio-card-content">
                  <Building className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <div className="radio-card-title text-sm">PTE</div>
                  <div className="radio-card-subtitle text-xs">TDSR Assessment</div>
                </div>
              </label>
              
              <label className="radio-card">
                <input
                  type="radio"
                  name="propertyType"
                  value="ec"
                  checked={inputs.propertyType === 'ec'}
                  onChange={(e) => handleInputChange('propertyType', e.target.value)}
                />
                <div className="radio-card-content">
                  <Building2 className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <div className="radio-card-title text-sm">EC</div>
                  <div className="radio-card-subtitle text-xs">MSR + TDSR Assessment</div>
                </div>
              </label>
              
              <label className="radio-card">
                <input
                  type="radio"
                  name="propertyType"
                  value="hdb"
                  checked={inputs.propertyType === 'hdb'}
                  onChange={(e) => handleInputChange('propertyType', e.target.value)}
                />
                <div className="radio-card-content">
                  <Home className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <div className="radio-card-title text-sm">HDB</div>
                  <div className="radio-card-subtitle text-xs">MSR + TDSR Assessment</div>
                </div>
              </label>
              
              <label className="radio-card">
                <input
                  type="radio"
                  name="propertyType"
                  value="commercial"
                  checked={inputs.propertyType === 'commercial'}
                  onChange={(e) => handleInputChange('propertyType', e.target.value)}
                />
                <div className="radio-card-content">
                  <Factory className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                  <div className="radio-card-title text-sm">Comm/Ind</div>
                  <div className="radio-card-subtitle text-xs">TDSR Assessment</div>
                </div>
              </label>
            </div>
          </div>

          {/* Enhanced Loan Details */}
          <div className="standard-card card-gradient-blue">
            <div className="section-header">
              <div className="icon-container blue">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="text-content">
                <h2>Loan Configuration</h2>
                <p>Set your loan parameters</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Purchase Price (SGD)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatCurrencyInput(inputs.purchasePrice)}
                    onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                    className="standard-input currency-input"
                    placeholder="1,000,000.00"
                  />
                  <span className="currency-symbol">SGD</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700">Loan Amount Options</label>
                <div className="radio-card-group">
                  <label className="radio-card">
                    <input
                      type="radio"
                      name="loanOption"
                      checked={!inputs.useCustomAmount && inputs.loanPercentage === (inputs.propertyType === 'commercial' ? 80 : 75)}
                      onChange={() => {
                        const defaultPercentage = inputs.propertyType === 'commercial' ? 80 : 75;
                        handleInputChange('useCustomAmount', false);
                        handleInputChange('loanPercentage', defaultPercentage);
                      }}
                    />
                    <div className="radio-card-content">
                      <div className="radio-card-title">{inputs.propertyType === 'commercial' ? '80%' : '75%'}</div>
                      <div className="radio-card-subtitle text-xs">
                        {formatCurrency((parseNumberInput(inputs.purchasePrice) || 0) * (inputs.propertyType === 'commercial' ? 0.80 : 0.75))}
                      </div>
                    </div>
                  </label>
                  
                  <label className="radio-card">
                    <input
                      type="radio"
                      name="loanOption"
                      checked={!inputs.useCustomAmount && inputs.loanPercentage === 55}
                      onChange={() => {
                        handleInputChange('useCustomAmount', false);
                        handleInputChange('loanPercentage', 55);
                      }}
                    />
                    <div className="radio-card-content">
                      <div className="radio-card-title">55%</div>
                      <div className="radio-card-subtitle text-xs">
                        {formatCurrency((parseNumberInput(inputs.purchasePrice) || 0) * 0.55)}
                      </div>
                    </div>
                  </label>
                  
                  <label className="radio-card">
                    <input
                      type="radio"
                      name="loanOption"
                      checked={inputs.useCustomAmount}
                      onChange={() => handleInputChange('useCustomAmount', true)}
                    />
                    <div className="radio-card-content">
                      <div className="radio-card-title">Custom</div>
                      <div className="radio-card-subtitle">Amount</div>
                    </div>
                  </label>
                </div>
                
                {inputs.useCustomAmount && (
                  <div className="mt-4 fade-in">
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Custom Loan Amount</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatCurrencyInput(inputs.customLoanAmount)}
                        onChange={(e) => handleInputChange('customLoanAmount', e.target.value)}
                        className="standard-input currency-input"
                        placeholder="750,000.00"
                      />
                      <span className="currency-symbol">SGD</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid-responsive cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Stress Test Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={inputs.stressTestRate}
                      onChange={(e) => handleInputChange('stressTestRate', Number(e.target.value))}
                      className="standard-input bg-red-50 border-red-200 focus:border-red-500"
                      placeholder="4.00"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">%</span>
                  </div>
                  <p className="text-xs text-red-600 mt-1 font-medium">Used for affordability calculation</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Loan Tenor (Years)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={inputs.loanTenor}
                      onChange={(e) => handleInputChange('loanTenor', e.target.value)}
                      max={results ? results.maxLoanTenor : "35"}
                      min="0"
                      className="standard-input"
                      placeholder="Auto-filled based on age & property type"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">years</span>
                  </div>
                  {results && (
                    <div className="mt-2 text-xs text-gray-600 space-y-1">
                      <p><strong>Max tenor:</strong> {results.maxLoanTenor} years</p>
                      {results.averageAge > 0 && (
                        <p><strong>Average age:</strong> {results.averageAge.toFixed(1)} years</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Applicant Information */}
          <div className="standard-card card-gradient-green">
            <div className="section-header">
              <div className="icon-container green">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-content">
                <h2>Applicant Details</h2>
                <p>Income and demographic information</p>
              </div>
            </div>
            
            <div className="grid-responsive cols-2">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 text-lg border-b border-green-200 pb-2">Primary Applicant</h3>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Monthly Salary (SGD)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatCurrencyInput(inputs.monthlySalaryA)}
                      onChange={(e) => handleInputChange('monthlySalaryA', e.target.value)}
                      className="standard-input currency-input"
                      placeholder="8,000.00"
                    />
                    <span className="currency-symbol">SGD</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Annual Salary (SGD)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatCurrencyInput(inputs.annualSalaryA)}
                      onChange={(e) => handleInputChange('annualSalaryA', e.target.value)}
                      className="standard-input currency-input"
                      placeholder="Auto-filled (Monthly × 12)"
                    />
                    <span className="currency-symbol">SGD</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Age (Years)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={inputs.applicantAgeA}
                      onChange={(e) => handleInputChange('applicantAgeA', e.target.value)}
                      className="standard-input"
                      placeholder="35"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">years</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 text-lg border-b border-green-200 pb-2">Co-Applicant (Optional)</h3>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Monthly Salary (SGD)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatCurrencyInput(inputs.monthlySalaryB)}
                      onChange={(e) => handleInputChange('monthlySalaryB', e.target.value)}
                      className="standard-input currency-input"
                      placeholder="6,000.00"
                    />
                    <span className="currency-symbol">SGD</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Annual Salary (SGD)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatCurrencyInput(inputs.annualSalaryB)}
                      onChange={(e) => handleInputChange('annualSalaryB', e.target.value)}
                      className="standard-input currency-input"
                      placeholder="Auto-filled (Monthly × 12)"
                    />
                    <span className="currency-symbol">SGD</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Age (Years)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={inputs.applicantAgeB}
                      onChange={(e) => handleInputChange('applicantAgeB', e.target.value)}
                      className="standard-input"
                      placeholder="32"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">years</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>

          <div className="space-y-6">{/* Right Column: Funding & Commitments */}
          
          
          {/* Enhanced Additional Funding */}
          <div className="standard-card card-gradient-yellow">
            <div className="section-header">
              <div className="icon-container yellow">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-content">
                <h2>Additional Funding Solutions</h2>
                <p>Show fund and pledge amount options</p>
              </div>
            </div>
            
            <div className="grid-responsive cols-2">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Show Fund (SGD)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatCurrencyInput(inputs.showFundAmount)}
                    onChange={(e) => handleInputChange('showFundAmount', e.target.value)}
                    className="standard-input currency-input"
                    placeholder="500,000.00"
                  />
                  <span className="currency-symbol">SGD</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Pledging (SGD)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatCurrencyInput(inputs.pledgeAmount)}
                    onChange={(e) => handleInputChange('pledgeAmount', e.target.value)}
                    className="standard-input currency-input"
                    placeholder="300,000.00"
                  />
                  <span className="currency-symbol">SGD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Existing Commitments */}
          <div className="standard-card card-gradient-red">
            <div className="section-header">
              <div className="icon-container red">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="text-content">
                <h2>Existing Monthly Commitments</h2>
                <p>Current loan obligations</p>
              </div>
            </div>
            
            <div className="grid-responsive cols-2">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Monthly Car Loan (A) (SGD)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatCurrencyInput(inputs.carLoanA)}
                    onChange={(e) => handleInputChange('carLoanA', e.target.value)}
                    className="standard-input currency-input"
                    placeholder="800.00"
                  />
                  <span className="currency-symbol">SGD</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Monthly Car Loan (B) (SGD)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatCurrencyInput(inputs.carLoanB)}
                    onChange={(e) => handleInputChange('carLoanB', e.target.value)}
                    className="standard-input currency-input"
                    placeholder="600.00"
                  />
                  <span className="currency-symbol">SGD</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Monthly Personal Loan (A) (SGD)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatCurrencyInput(inputs.personalLoanA)}
                    onChange={(e) => handleInputChange('personalLoanA', e.target.value)}
                    className="standard-input currency-input"
                    placeholder="500.00"
                  />
                  <span className="currency-symbol">SGD</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Monthly Personal Loan (B) (SGD)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatCurrencyInput(inputs.personalLoanB)}
                    onChange={(e) => handleInputChange('personalLoanB', e.target.value)}
                    className="standard-input currency-input"
                    placeholder="300.00"
                  />
                  <span className="currency-symbol">SGD</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Monthly Property Loan (A) (SGD)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatCurrencyInput(inputs.propertyLoanA)}
                    onChange={(e) => handleInputChange('propertyLoanA', e.target.value)}
                    className="standard-input currency-input"
                    placeholder="2,000.00"
                  />
                  <span className="currency-symbol">SGD</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Monthly Property Loan (B) (SGD)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatCurrencyInput(inputs.propertyLoanB)}
                    onChange={(e) => handleInputChange('propertyLoanB', e.target.value)}
                    className="standard-input currency-input"
                    placeholder="1,500.00"
                  />
                  <span className="currency-symbol">SGD</span>
                </div>
              </div>
            </div>
            
            {(inputs.propertyType === 'hdb' || inputs.propertyType === 'ec') && (
              <div className="mt-4 p-4 bg-yellow-100 rounded-xl border border-yellow-300">
                <p className="text-sm text-yellow-800 font-medium">
                  <strong>Note for {inputs.propertyType === 'hdb' ? 'HDB' : 'EC'} (MSR Calculation):</strong> Only property loans are included in MSR calculation. 
                  Car loans and personal loans are excluded from MSR but may still affect overall affordability.
                </p>
              </div>
            )}
            
            {inputs.propertyType === 'private' && (
              <div className="mt-4 p-4 bg-blue-100 rounded-xl border border-blue-300">
                <p className="text-sm text-blue-800 font-medium">
                  <strong>Note for Private Property (TDSR Calculation):</strong> All commitments are included in TDSR calculation
                  (car loans, personal loans, AND property loans).
                </p>
              </div>
            )}
          </div>

          {/* Maximum Affordability Section - Always Visible */}
          <div className="standard-card card-gradient-purple">
            <div className="section-header">
              <div className="icon-container purple">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-content">
                <h2>Maximum Affordability</h2>
                <p>Based on your income and commitments</p>
              </div>
            </div>
            
            {memoizedAffordability && memoizedAffordability.hasValidData ? (
              <div className="space-y-3">
                {/* Combined Income and Commitment Summary */}
                <div className="result-card bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-600 mb-1">Combined Monthly Income</div>
                      <div className="text-xl font-bold text-indigo-600">{formatCurrency(memoizedAffordability.combinedMonthlyIncome)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-600 mb-1">Combined Monthly Commitment</div>
                      <div className="text-xl font-bold text-purple-600">{formatCurrency(memoizedAffordability.totalCommitmentsTDSR || 0)}</div>
                    </div>
                  </div>
                </div>

                {/* Maximum Affordability Results */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Maximum Purchase Price You Can Afford</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Standard 75% LTV Option */}
                    <div className="result-card">
                      <div className="result-header">
                        <div className="result-icon bg-blue-100">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="result-title">Standard (75% LTV)</div>
                          <div className="text-xs text-gray-500 mb-1">Maximum Purchase Price</div>
                          <div className="result-value text-blue-600">{formatCurrency(memoizedAffordability.maxPropertyPrice75)}</div>
                          <div className="result-subtitle">
                            Loan Amount: {formatCurrency(memoizedAffordability.maxPropertyPrice75 * 0.75)}<br />
                            Loan Tenure: {memoizedAffordability.maxTenure75} years
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Conservative 55% LTV Option */}
                    <div className="result-card">
                      <div className="result-header">
                        <div className="result-icon bg-orange-100">
                          <Building className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <div className="result-title">Conservative (55% LTV)</div>
                          <div className="text-xs text-gray-500 mb-1">Maximum Purchase Price</div>
                          <div className="result-value text-orange-600">{formatCurrency(memoizedAffordability.maxPropertyPrice55)}</div>
                          <div className="result-subtitle">
                            Loan Amount: {formatCurrency(memoizedAffordability.maxPropertyPrice55 * 0.55)}<br />
                            Loan Tenure: {memoizedAffordability.maxTenure55} years
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">Enter Your Details</h3>
                <p className="text-sm text-gray-500">
                  Fill in the applicant details above to see your maximum affordability analysis
                </p>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>


      {/* Enhanced Results Section - Full Width */}
      {results && (
        <div className="space-y-8">
          <div className="space-y-6">
            {/* Financial Requirements section */}
            <div className="standard-card">
              <div className="section-header">
                <div className="icon-container green">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div className="text-content">
                  <h2>Financial Requirements</h2>
                  <p>Downpayment breakdown and stamp duty</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3 text-gray-800">Downpayment Requirements</h3>
                  <div className="grid-responsive cols-3 gap-3">
                    <div className="result-card">
                      <div className="result-header">
                        <div className="result-icon bg-red-100">
                          <DollarSign className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <div className="result-title">Cash Required</div>
                          <div className="result-value text-red-600">{formatCurrency(results.downPayment.cashRequired)}</div>
                          <div className="result-subtitle">
                            {inputs.propertyType === 'commercial' 
                              ? '20% cash (no CPF allowed)'
                              : inputs.loanPercentage <= 55 
                                ? '10% cash requirement'
                                : '5% cash requirement'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="result-card">
                      <div className="result-header">
                        <div className="result-icon bg-blue-100">
                          <Building className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="result-title">CPF Allowed</div>
                          <div className="result-value text-blue-600">
                            {inputs.propertyType === 'commercial' 
                              ? 'Not Allowed' 
                              : formatCurrency(results.downPayment.cpfAllowed)
                            }
                          </div>
                          <div className="result-subtitle">
                            {inputs.propertyType === 'commercial' 
                              ? 'Commercial properties'
                              : inputs.loanPercentage <= 55 
                                ? '35% CPF/Cash allowed'
                                : '20% CPF/Cash allowed'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="result-card">
                      <div className="result-header">
                        <div className="result-icon bg-green-100">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="result-title">Total Downpayment</div>
                          <div className="result-value text-green-600">{formatCurrency(results.downPayment.totalDownPayment)}</div>
                          <div className="result-subtitle">
                            {(((results.downPayment.totalDownPayment) / results.purchasePrice) * 100).toFixed(1)}% of purchase price
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid-responsive cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-3 text-gray-800">Loan Details</h3>
                    <div className="result-card">
                      <div className="result-header">
                        <div className="result-icon bg-blue-100">
                          <Calculator className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="result-title">Selected Loan Amount</div>
                          <div className="result-value text-blue-600">{formatCurrency(results.loanAmount)}</div>
                          <div className="result-subtitle">
                            {((results.loanAmount / results.purchasePrice) * 100).toFixed(1)}% of purchase price
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 text-gray-800">Stamp Duty</h3>
                    <div className="result-card">
                      <div className="result-header">
                        <div className="result-icon bg-purple-100">
                          <BarChart3 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="result-title">Buyer's Stamp Duty (BSD)</div>
                          <div className="result-value text-purple-600">{formatCurrency(results.stampDuty)}</div>
                          <div className="result-subtitle">
                            {inputs.propertyType === 'commercial' 
                              ? 'Commercial/Industrial rate'
                              : 'Residential property rate'
                            } - {((results.stampDuty / results.purchasePrice) * 100).toFixed(3)}% effective rate
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Property-specific Results */}
            {(inputs.propertyType === 'private' || inputs.propertyType === 'commercial') && (
              <div className={`result-card ${results.tdsrPass ? 'success' : 'error'}`}>
                <div className="result-header">
                  <div className="result-icon">
                    {results.tdsrPass ? <CheckCircle className="w-8 h-8 text-green-600" /> : <XCircle className="w-8 h-8 text-red-600" />}
                  </div>
                  <div>
                    <div className="result-title">{getPropertyTypeText(inputs.propertyType)} - TDSR: {results.actualTDSRPercentage.toFixed(1)}% (Limit: 55%)</div>
                    <div className={`result-value ${results.tdsrPass ? 'success' : 'error'}`}>
                      {results.tdsrPass ? 'PASS ✓' : 'FAIL ✗'}
                    </div>
                  </div>
                </div>
                <div className="grid-responsive cols-2 mt-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <span className="text-sm text-gray-600">Required Income:</span>
                    <div className="font-bold text-xl">{formatCurrency(results.requiredIncomeTDSR)}</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <span className="text-sm text-gray-600">Deficit/Surplus:</span>
                    <div className={`font-bold text-xl ${results.tdsrDeficit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(results.tdsrDeficit)}
                    </div>
                  </div>
                </div>
                {!results.tdsrPass && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold mb-4">Cash Requirements (Choose One):</h4>
                    <div className="grid-responsive cols-2">
                      <div className="text-center bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <span className="text-sm text-gray-600">Cash to Show:</span>
                        <div className="font-bold text-2xl text-red-600">{formatCurrency(results.cashShowTDSR)}</div>
                      </div>
                      <div className="text-center bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <span className="text-sm text-gray-600">Cash to Pledge:</span>
                        <div className="font-bold text-2xl text-red-600">{formatCurrency(results.cashPledgeTDSR)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

           {(inputs.propertyType === 'hdb' || inputs.propertyType === 'ec') && (
  <div className="space-y-6">
    {/* MSR 30% Assessment */}
    <div className={`result-card ${results.hdbPass ? 'success' : 'error'}`}>
      <div className="result-header">
        <div className="result-icon">
          {results.hdbPass ? <CheckCircle className="w-8 h-8 text-green-600" /> : <XCircle className="w-8 h-8 text-red-600" />}
        </div>
        <div>
          <div className="result-title">{getPropertyTypeText(inputs.propertyType)} - MSR: {results.actualMSRPercentage.toFixed(1)}% (Limit: 30%)</div>
          <div className={`result-value ${results.hdbPass ? 'success' : 'error'}`}>
            {results.hdbPass ? 'PASS ✓' : 'FAIL ✗'}
          </div>
        </div>
      </div>
      
      <div className="grid-responsive cols-2 mt-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <span className="text-sm text-gray-600">Required Income:</span>
          <div className="font-bold text-xl">{formatCurrency(results.requiredIncomeHDB)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <span className="text-sm text-gray-600">Deficit/Surplus:</span>
          <div className={`font-bold text-xl ${results.hdbDeficit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(results.hdbDeficit)}
          </div>
        </div>
      </div>
      
      {!results.hdbPass && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-semibold mb-4 text-center text-gray-700">MSR Funding Solutions (Choose One):</h4>
          <div className="grid-responsive cols-2 gap-4">
            <div className="text-center bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-sm text-gray-600 mb-2">MSR Show Fund:</div>
              <div className="font-bold text-2xl text-red-600">{formatCurrency(results.cashShowHDB)}</div>
            </div>
            <div className="text-center bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-sm text-gray-600 mb-2">MSR Pledge Amount:</div>
              <div className="font-bold text-2xl text-red-600">{formatCurrency(results.cashPledgeHDB)}</div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* TDSR 55% Assessment for HDB */}
    <div className={`result-card ${results.tdsrPass ? 'success' : 'error'}`}>
      <div className="result-header">
        <div className="result-icon">
          {results.tdsrPass ? <CheckCircle className="w-8 h-8 text-green-600" /> : <XCircle className="w-8 h-8 text-red-600" />}
        </div>
        <div>
          <div className="result-title">{getPropertyTypeText(inputs.propertyType)} - TDSR: {results.actualTDSRPercentage.toFixed(1)}% (Limit: 55%)</div>
          <div className={`result-value ${results.tdsrPass ? 'success' : 'error'}`}>
            {results.tdsrPass ? 'PASS ✓' : 'FAIL ✗'}
          </div>
        </div>
      </div>
      
      <div className="grid-responsive cols-2 mt-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <span className="text-sm text-gray-600">Required Income:</span>
          <div className="font-bold text-xl">{formatCurrency(results.requiredIncomeTDSR)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <span className="text-sm text-gray-600">Deficit/Surplus:</span>
          <div className={`font-bold text-xl ${results.tdsrDeficit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(results.tdsrDeficit)}
          </div>
        </div>
      </div>
      
      {!results.tdsrPass && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-semibold mb-4 text-center text-gray-700">TDSR Funding Solutions (Choose One):</h4>
          <div className="grid-responsive cols-2 gap-4">
            <div className="text-center bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-sm text-gray-600 mb-2">TDSR Show Fund:</div>
              <div className="font-bold text-2xl text-red-600">{formatCurrency(results.cashShowTDSR)}</div>
            </div>
            <div className="text-center bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-sm text-gray-600 mb-2">TDSR Pledge Amount:</div>
              <div className="font-bold text-2xl text-red-600">{formatCurrency(results.cashPledgeTDSR)}</div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Overall Assessment */}
    <div className={`result-card text-center ${(results.hdbPass && results.tdsrPass) ? 'success' : 'error'}`}>
      <div className="result-title text-2xl mb-4">
        Overall {getPropertyTypeText(inputs.propertyType)} Assessment: {(results.hdbPass && results.tdsrPass) ? 
          <span className="text-green-700">PASS ✓</span> : 
          <span className="text-red-700">FAIL ✗</span>
        }
      </div>
      <p className="text-sm mt-3 text-gray-600">
        {(results.hdbPass && results.tdsrPass) ? 
          'You meet both MSR (30%) and TDSR (55%) requirements.' :
          'You must pass BOTH MSR (30%) AND TDSR (55%) tests for HDB loan approval.'
        }
      </p>
      
      {/* Additional Information for Failed Cases */}
      {!(results.hdbPass && results.tdsrPass) && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-left">
            <h5 className="font-semibold text-blue-800 mb-2">💡 Quick Summary:</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              {!results.hdbPass && (
                <li>• MSR (30%) test failed - Need additional funding for property-related commitments</li>
              )}
              {!results.tdsrPass && (
                <li>• TDSR (55%) test failed - Need additional funding for total debt commitments</li>
              )}
              <li>• Consider Show Fund (cash deposit) or Pledge (asset commitment) options</li>
              <li>• Contact our specialists for personalized debt restructuring advice</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  </div>
)}

            {/* Generate Report Button */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-1 shadow-lg">
              <button
                onClick={() => generatePDFReport(inputs, results)}
                className="btn-standard btn-lg w-full bg-white text-blue-600 hover:bg-gray-50"
              >
                <Download className="w-6 h-6" />
                <div className="text-left">
                  <div>Generate TDSR/MSR Analysis Report</div>
                  <div className="text-sm opacity-75">Professional PDF assessment</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


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
