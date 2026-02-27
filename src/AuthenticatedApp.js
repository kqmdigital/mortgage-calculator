import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Calculator, Download, CheckCircle, XCircle, LogOut, Home, Building, TrendingUp, DollarSign, BarChart3, Sparkles, Users, Menu, UserPlus, Building2, Factory } from 'lucide-react';
import { useAuth } from './contexts/EnhancedAuthContext';
import logger from './utils/logger';
import useDebounce from './hooks/useDebounce';
import ProgressivePaymentCalculator from './ProgressivePaymentCalculator';
import MonthlyRepaymentCalculator from './MonthlyRepaymentCalculator';
import AdminManagement from './components/AdminManagement';
import RecommendedPackages from './RecommendedPackages';

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

  // Calculate Effective Monthly Income (accounts for variable income with 30% haircut)
  // Formula: Monthly Salary + ((Annual Salary - (Monthly Salary × 12)) × 70% / 12)
  const calculateEffectiveMonthlyIncome = (monthlySalary, annualSalary) => {
    if (!monthlySalary || monthlySalary <= 0) return 0;
    if (!annualSalary || annualSalary <= 0) return monthlySalary;

    const fixedAnnual = monthlySalary * 12;
    const variableIncome = annualSalary - fixedAnnual;

    // Only apply 70% haircut if there's positive variable income
    if (variableIncome > 0) {
      const adjustedVariable = variableIncome * 0.70;
      const monthlyVariable = adjustedVariable / 12;
      return monthlySalary + monthlyVariable;
    }

    return monthlySalary;
  };

  const calculateAverageAge = useCallback(() => {
    const ageA = parseNumberInput(inputs.applicantAgeA) || 0;
    const ageB = parseNumberInput(inputs.applicantAgeB) || 0;
    const monthlySalaryA = parseNumberInput(inputs.monthlySalaryA) || 0;
    const monthlySalaryB = parseNumberInput(inputs.monthlySalaryB) || 0;
    const annualSalaryA = parseNumberInput(inputs.annualSalaryA) || 0;
    const annualSalaryB = parseNumberInput(inputs.annualSalaryB) || 0;

    // Calculate effective monthly income (includes 70% of variable income)
    const effectiveIncomeA = calculateEffectiveMonthlyIncome(monthlySalaryA, annualSalaryA);
    const effectiveIncomeB = calculateEffectiveMonthlyIncome(monthlySalaryB, annualSalaryB);

    // Use Income Weighted Average Age (IWAA) formula with effective monthly income
    // Formula: (age1*income1) + (age2*income2) / (income1 + income2)
    if (ageA > 0 && ageB > 0 && effectiveIncomeA > 0 && effectiveIncomeB > 0) {
      const totalIncome = effectiveIncomeA + effectiveIncomeB;
      return ((ageA * effectiveIncomeA) + (ageB * effectiveIncomeB)) / totalIncome;
    } else if (ageA > 0 && effectiveIncomeA > 0) {
      return ageA; // Single applicant A
    } else if (ageB > 0 && effectiveIncomeB > 0) {
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
  }, [inputs.applicantAgeA, inputs.applicantAgeB, inputs.monthlySalaryA, inputs.monthlySalaryB, inputs.annualSalaryA, inputs.annualSalaryB]);

  // Helper function to round down tenor to nearest whole number
  const roundDownTenor = useCallback((value) => {
    if (!value || isNaN(value)) return 0;
    return Math.floor(parseFloat(value));
  }, []);

  // Helper function to round down loan amount to nearest hundred
  const roundDownToNearestHundred = useCallback((amount) => {
    if (!amount || isNaN(amount)) return 0;
    return Math.floor(parseFloat(amount) / 100) * 100;
  }, []);

  // Helper function to round up loan amount to nearest thousand
  const roundUpToNearestThousand = useCallback((amount) => {
    if (!amount || isNaN(amount)) return 0;
    return Math.ceil(parseFloat(amount) / 1000) * 1000;
  }, []);

  // Helper function to round up amount to nearest hundred
  const roundUpToNearestHundred = useCallback((amount) => {
    if (!amount || isNaN(amount)) return 0;
    return Math.ceil(parseFloat(amount) / 100) * 100;
  }, []);

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
        return Math.floor(Math.min(25, Math.max(1, 65 - averageAge)));
      } else if (loanPercentage <= 55) {
        return Math.floor(Math.min(30, Math.max(1, 75 - averageAge)));
      }
    } else if (inputs.propertyType === 'commercial') {
      // Commercial/Industrial properties: max 30 years, age limit up to 75
      return Math.floor(Math.min(30, Math.max(1, 75 - averageAge)));
    } else {
      // Private and EC properties use standard private property age rules
      if (loanPercentage >= 56 && loanPercentage <= 75) {
        return Math.floor(Math.min(30, Math.max(1, 65 - averageAge)));
      } else if (loanPercentage <= 55) {
        return Math.floor(Math.min(35, Math.max(1, 75 - averageAge)));
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
        return Math.floor(Math.min(25, Math.max(1, 65 - averageAge)));
      } else if (loanPercentage <= 55) {
        return Math.floor(Math.min(30, Math.max(1, 75 - averageAge)));
      }
    } else if (propertyType === 'commercial') {
      // Commercial/Industrial properties: max 30 years, age limit up to 75
      return Math.floor(Math.min(30, Math.max(1, 75 - averageAge)));
    } else {
      // Private and EC properties use standard private property age rules
      if (loanPercentage >= 56 && loanPercentage <= 75) {
        return Math.floor(Math.min(30, Math.max(1, 65 - averageAge)));
      } else if (loanPercentage <= 55) {
        return Math.floor(Math.min(35, Math.max(1, 75 - averageAge)));
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
      } else if (purchasePrice <= 1500000) {
        return 1800 + 3600 + 19200 + (purchasePrice - 1000000) * 0.04;
      } else if (purchasePrice <= 3000000) {
        return 1800 + 3600 + 19200 + 20000 + (purchasePrice - 1500000) * 0.05;
      } else {
        return 1800 + 3600 + 19200 + 20000 + 75000 + (purchasePrice - 3000000) * 0.06;
      }
    } else {
      // Commercial/Industrial properties
      if (purchasePrice <= 180000) {
        return purchasePrice * 0.01;
      } else if (purchasePrice <= 360000) {
        return 1800 + (purchasePrice - 180000) * 0.02;
      } else if (purchasePrice <= 1000000) {
        return 1800 + 3600 + (purchasePrice - 360000) * 0.03;
      } else if (purchasePrice <= 1500000) {
        return 1800 + 3600 + 19200 + (purchasePrice - 1000000) * 0.04;
      } else {
        return 1800 + 3600 + 19200 + 20000 + (purchasePrice - 1500000) * 0.05;
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

    // Calculate maximum monthly installment based on income limits (with precision buffer)
    const maxMonthlyTDSR = (combinedMonthlyIncome * 0.55) - totalCommitmentsTDSR - 15.00; // $15 buffer for calculation discrepancies
    const maxMonthlyMSR = (combinedMonthlyIncome * 0.30) - totalPropertyLoans - 15.00; // $15 buffer for calculation discrepancies

    // Use the more restrictive limit
    let maxMonthlyInstallment;
    let limitingFactor;
    let relevantCommitments;
    
    if (propertyType === 'hdb' || propertyType === 'ec') {
      // HDB/EC uses the more restrictive of MSR or TDSR for affordability calculation
      // But for display purposes, always show MSR-relevant commitments (property loans only)
      // since MSR is the primary regulation for these property types
      if (maxMonthlyMSR < maxMonthlyTDSR) {
        maxMonthlyInstallment = maxMonthlyMSR;
        limitingFactor = 'MSR (30%)';
      } else {
        maxMonthlyInstallment = maxMonthlyTDSR;
        limitingFactor = 'TDSR (55%)';
      }
      // For HDB/EC, always display MSR-relevant commitments in affordability view
      relevantCommitments = totalPropertyLoans; // MSR only includes property loans
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
        totalCommitmentsTDSR: totalCommitmentsTDSR, // Always include full TDSR commitments
        relevantCommitments: relevantCommitments, // The commitments used for the limiting calculation
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
      totalCommitmentsTDSR: totalCommitmentsTDSR, // Always include full TDSR commitments
      relevantCommitments: relevantCommitments, // The commitments used for the limiting calculation
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
  }, [inputs, calculateAverageAge, calculateMaxTenureForLTV, roundDownToNearestHundred, roundUpToNearestThousand]);

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
    
    const cashShowTDSR = tdsrPass ? 0 : roundUpToNearestHundred(Math.abs(tdsrDeficit) / 0.00625);
    const cashShowHDB = hdbPass ? 0 : roundUpToNearestHundred(Math.abs(hdbDeficit) / 0.00625);
    const cashPledgeTDSR = tdsrPass ? 0 : roundUpToNearestHundred(Math.abs(tdsrDeficit) * 48);
    const cashPledgeHDB = hdbPass ? 0 : roundUpToNearestHundred(Math.abs(hdbDeficit) * 48);

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
  }, [inputs, calculateAverageAge, calculateMaxLoanTenor, roundUpToNearestThousand]);

  // ✅ OPTIMIZED: Debounce inputs and memoize calculations
  useDebounce(inputs, 300);
  
  const memoizedResults = useMemo(() => {
    return calculateMortgage();
  }, [calculateMortgage]);

  // Memoize affordability calculations
  const memoizedAffordability = useMemo(() => {
    return calculateMaxAffordability();
  }, [calculateMaxAffordability]);

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

  // Handle click on affordability card to auto-populate loan configuration
  const handleAffordabilityCardClick = (ltvPercentage) => {
    if (!memoizedAffordability?.hasValidData) return;

    let maxPrice, maxTenure;
    
    if (ltvPercentage === 75) {
      maxPrice = memoizedAffordability.maxPropertyPrice75;
      maxTenure = memoizedAffordability.maxTenure75;
    } else if (ltvPercentage === 55) {
      maxPrice = memoizedAffordability.maxPropertyPrice55;
      maxTenure = memoizedAffordability.maxTenure55;
    }

    // Update the inputs to populate purchase price, loan settings, and tenure
    setInputs(prev => ({
      ...prev,
      purchasePrice: maxPrice.toString(),
      loanPercentage: ltvPercentage,
      loanTenor: maxTenure.toString(),
      useCustomAmount: false, // Reset to percentage-based loan
      customLoanAmount: '' // Clear custom amount
    }));
    
    // Mark loan tenor as manually edited to prevent auto-overwrite
    setLoanTenorManuallyEdited(true);
  };

  const generatePDFReport = () => {
    if (!results) {
      alert('Please calculate the mortgage first before generating a report.');
      return;
    }

    try {
      const propertyTypeText = getPropertyTypeText(inputs.propertyType);
      const currentDate = new Date().toLocaleDateString('en-SG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="format-detection" content="telephone=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>TDSR/MSR Analysis Report - ${propertyTypeText}</title>
    <style>
        @page {
            size: A4;
            margin: 0.5in;
            @top-left { content: ""; }
            @top-center { content: ""; }
            @top-right { content: ""; }  
            @bottom-left { content: ""; }
            @bottom-center { content: ""; }
            @bottom-right { content: counter(page) "/" counter(pages); }
        }
        
        @media print {
            @page {
                size: A4;
                margin: 0.5in;
                @top-left { content: ""; }
                @top-center { content: ""; }
                @top-right { content: ""; }  
                @bottom-left { content: ""; }
                @bottom-center { content: ""; }
                @bottom-right { content: counter(page) "/" counter(pages); }
            }
            
            html { margin: 0 !important; padding: 0 !important; }
            
            * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            
            body { 
                margin: 0; 
                padding: 0;
                font-size: 11px;
                line-height: 1.3;
            }
            
            .page-break { 
                page-break-before: always; 
            }
            
            .no-break { 
                page-break-inside: avoid; 
                break-inside: avoid;
            }
            
            .logo-section img {
                width: 80px !important;
                height: auto !important;
            }
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.4;
            color: #333;
            max-width: 100%;
            margin: 0;
            padding: 0;
            background: white;
            font-size: 12px;
            position: relative;
        }

        
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #264A82;
            position: relative;
            z-index: 1;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
        }
        
        .logo-section img {
            width: 96px !important;
            height: auto !important;
            display: block;
            margin: 0 auto;
        }
        
        .header-logo {
            height: 48px !important;
            max-width: none !important;
            width: auto !important;
            min-height: 48px !important;
            display: block !important;
        }
        
        .report-title {
            color: #DC2626;
            font-size: 24px;
            font-weight: bold;
            margin: 15px 0;
        }
        
        .property-type-banner {
            background: #264A82;
            color: white;
            padding: 8px 15px;
            border-radius: 6px;
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .report-info {
            margin-top: 8px;
            font-size: 10px;
            color: #666;
        }
        
        .section {
            margin: 10px 0;
            page-break-inside: avoid;
            break-inside: avoid;
            position: relative;
            z-index: 1;
        }
        
        .section-header {
            background: #264A82;
            color: white;
            padding: 8px 15px;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 0;
        }
        
        .section-content {
            background: white;
            border: 1px solid #E5E7EB;
            border-top: none;
        }
        
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
        }
        
        .info-table td {
            width: 25%;
        }
        
        .info-table tr:nth-child(even) {
            background: #F3F4F6;
        }
        
        .info-table tr:nth-child(odd) {
            background: white;
        }
        
        .info-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #E5E7EB;
            font-size: 11px;
        }
        
        .info-label {
            font-weight: 600;
            color: #374151;
            width: 60%;
        }
        
        .info-value {
            font-weight: bold;
            color: #111827;
            text-align: right;
            width: 40%;
        }
        
        .highlight-section {
            background: #264A82;
            color: white;
            padding: 12px 15px;
            margin: 15px 0;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
        }
        
        .assessment-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
            margin: 15px 0;
            border: 1px solid #E5E7EB;
        }
        
        .assessment-card {
            padding: 15px;
            text-align: center;
            border-right: 1px solid #E5E7EB;
        }
        
        .assessment-card:last-child {
            border-right: none;
        }
        
        .assessment-card.pass {
            background: #F0FDF4;
            color: #166534;
        }
        
        .assessment-card.fail {
            background: #FEF2F2;
            color: #DC2626;
        }
        
        .assessment-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .assessment-result {
            font-size: 18px;
            font-weight: bold;
            margin: 8px 0;
        }
        
        .funding-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
            margin: 10px 0;
            border: 1px solid #E5E7EB;
        }
        
        .funding-card {
            background: white;
            padding: 12px;
            text-align: center;
            font-size: 11px;
            border-right: 1px solid #E5E7EB;
        }
        
        .funding-card:last-child {
            border-right: none;
        }
        
        .funding-amount {
            font-size: 16px;
            font-weight: bold;
            color: #DC2626;
            margin-top: 5px;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 9px;
            page-break-inside: avoid;
            break-inside: avoid;
            position: relative;
            z-index: 1;
        }
        
        .disclaimer {
            background: #F9FAFB;
            border: 1px solid #E5E7EB;
            padding: 12px;
            border-radius: 4px;
            margin: 20px 0;
            font-size: 9px;
            color: #555;
            page-break-inside: avoid;
            break-inside: avoid;
            position: relative;
            z-index: 1;
        }
        
        .disclaimer h4 {
            margin: 0 0 8px 0;
            color: #333;
            font-size: 11px;
        }
        
        @media print {
            .assessment-grid, .funding-grid { 
                grid-template-columns: 1fr 1fr !important; 
            }
            
            /* Enhanced Mobile PDF Support */
            .section,
            .disclaimer,
            .footer { 
                page-break-inside: avoid !important;
                -webkit-column-break-inside: avoid !important;
                break-inside: avoid !important;
                display: block !important;
                overflow: visible !important;
                float: none !important;
                clear: both !important;
                width: 100% !important;
                margin-bottom: 15px !important;
                padding-bottom: 8px !important;
            }
            
            /* Prevent assessment grids from splitting */
            .assessment-grid,
            .funding-grid {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                -webkit-column-break-inside: avoid !important;
                margin-bottom: 10px !important;
            }
            
            /* Mobile WebKit specific fixes */
            @supports (-webkit-appearance: none) {
                .section,
                .assessment-grid,
                .funding-grid {
                    -webkit-column-break-inside: avoid !important;
                    -webkit-region-break-inside: avoid !important;
                    orphans: 3 !important;
                    widows: 3 !important;
                }
            }
        }
        
        /* Android PDF Generation Optimizations - Android Only */
        @media screen and (-webkit-min-device-pixel-ratio: 1) and (max-width: 600px) and (orientation: portrait) {
            body:not(.ios-device) {
                font-size: 13px !important;
                line-height: 1.5 !important;
            }
            
            body:not(.ios-device) .section-content {
                padding: 8px !important;
            }
            
            body:not(.ios-device) .info-table td {
                padding: 6px 10px !important;
                font-size: 11px !important;
            }
            
            body:not(.ios-device) .assessment-grid, 
            body:not(.ios-device) .funding-grid { 
                grid-template-columns: 1fr 1fr !important;
                gap: 8px !important;
            }
        }
        
        /* iPhone Safari PDF Generation Optimizations - iPhone Only */
        @media screen and (-webkit-min-device-pixel-ratio: 2) and (max-device-width: 812px) and (-webkit-touch-callout: default) {
            html, body {
                -webkit-text-size-adjust: 100% !important;
                -webkit-font-smoothing: antialiased !important;
                font-size: 12px !important;
                line-height: 1.4 !important;
            }
            
            .section {
                margin: 8px 0 !important;
                padding: 0 !important;
                -webkit-column-break-inside: avoid !important;
                break-inside: avoid !important;
            }
            
            .section-header {
                font-size: 13px !important;
                padding: 6px 12px !important;
                line-height: 1.2 !important;
            }
            
            .section-content {
                padding: 6px !important;
            }
            
            .info-table td {
                padding: 4px 8px !important;
                font-size: 10px !important;
            }
            
            .assessment-grid, .funding-grid { 
                grid-template-columns: 1fr !important;
                margin: 5px 0 !important;
                gap: 0 !important;
            }
            
            .assessment-card, .funding-card {
                border-right: none !important;
                border-bottom: 1px solid #E5E7EB !important;
                padding: 8px !important;
                font-size: 10px !important;
            }
            
            .assessment-card:last-child, .funding-card:last-child {
                border-bottom: none !important;
            }
            
            .funding-amount {
                font-size: 14px !important;
            }
            
            .two-column {
                grid-template-columns: 1fr !important;
                gap: 5px !important;
                padding: 6px !important;
            }
            
            .info-row {
                padding: 3px 0 !important;
                font-size: 10px !important;
            }
            
            .disclaimer {
                margin: 8px 0 !important;
                padding: 6px !important;
                font-size: 9px !important;
            }
        }
        
        /* iPhone Safari Print Specific Optimizations - iPhone Only */
        @media print and (-webkit-min-device-pixel-ratio: 2) and (max-device-width: 812px) {
            html {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                font-size: 11px !important;
            }
            
            body {
                margin: 0 !important;
                padding: 0 !important;
                font-size: 11px !important;
                line-height: 1.3 !important;
                -webkit-font-smoothing: antialiased !important;
            }
            
            @page {
                size: A4 !important;
                margin: 0.4in !important;
            }
            
            .section {
                margin: 6px 0 !important;
                padding: 0 !important;
                page-break-inside: avoid !important;
                -webkit-column-break-inside: avoid !important;
                break-inside: avoid !important;
                orphans: 3 !important;
                widows: 3 !important;
            }
            
            .section-header {
                font-size: 12px !important;
                padding: 6px 12px !important;
                page-break-after: avoid !important;
            }
            
            .section-content {
                padding: 6px !important;
                page-break-inside: avoid !important;
            }
            
            .assessment-grid,
            .funding-grid {
                page-break-inside: avoid !important;
                -webkit-column-break-inside: avoid !important;
                break-inside: avoid !important;
                margin: 6px 0 !important;
            }
            
            .disclaimer,
            .footer {
                margin: 6px 0 !important;
                padding: 6px !important;
                page-break-inside: avoid !important;
            }
            
            /* Force consistent rendering across WebKit engines */
            * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                box-sizing: border-box !important;
            }
        }
        
        @media (max-width: 600px) {
            .assessment-grid, .funding-grid { 
                grid-template-columns: 1fr; 
            }
            .assessment-card, .funding-card {
                border-right: none;
                border-bottom: 1px solid #E5E7EB;
            }
            .assessment-card:last-child, .funding-card:last-child {
                border-bottom: none;
            }
        }
    </style>
</head>
<body>
    <div class="header no-break">
        <div class="logo-section">
            <img 
                src="https://ik.imagekit.io/hst9jooux/KeyQuest%20Logo1.JPG?updatedAt=1753157996192" 
                alt="KeyQuest Mortgage Logo"
            />
        </div>
        
        <div class="property-type-banner">
            ${propertyTypeText} TDSR/MSR Analysis
        </div>
        <div class="report-title">
            Mortgage Affordability Assessment Report
        </div>
        
        <div class="report-info">
            Generated: ${currentDate} | Report ID: KQM-${Date.now()}
        </div>
    </div>

    <div class="section no-break">
        <div class="section-header">📋 LOAN SUMMARY</div>
        <div class="section-content">
            <table class="info-table">
                <tr>
                    <td class="info-label">Property Type:</td>
                    <td class="info-value">${propertyTypeText}</td>
                    <td class="info-label">Combined Income:</td>
                    <td class="info-value">${formatCurrency(results.combinedMonthlyIncome || 0)}</td>
                </tr>
                <tr>
                    <td class="info-label">Property Value:</td>
                    <td class="info-value">${formatCurrency(parseNumberInput(inputs.purchasePrice) || 0)}</td>
                    <td class="info-label">Loan Tenure:</td>
                    <td class="info-value">${roundDownTenor(results.finalLoanTenure || inputs.loanTenor || 0)} years</td>
                </tr>
                <tr>
                    <td class="info-label">Loan Amount:</td>
                    <td class="info-value">${formatCurrency(results.loanAmount || 0)}</td>
                    <td class="info-label">Stress Test Rate:</td>
                    <td class="info-value">${inputs.stressTestRate}%</td>
                </tr>
                <tr>
                    <td class="info-label">Loan-to-Value:</td>
                    <td class="info-value">${parseNumberInput(inputs.purchasePrice) > 0 ? ((results.loanAmount || 0) / parseNumberInput(inputs.purchasePrice) * 100).toFixed(1) + '%' : '0.0%'}</td>
                    <td class="info-label"></td>
                    <td class="info-value"></td>
                </tr>
            </table>
        </div>
    </div>

    <div class="section no-break">
        <div class="section-header">💰 DOWNPAYMENT BREAKDOWN</div>
        <div class="section-content">
            <table class="info-table">
                <tr>
                    <td class="info-label">Cash Required (${((results.downPayment.cashRequired / results.purchasePrice) * 100).toFixed(1)}%):</td>
                    <td class="info-value" style="color: #DC2626; font-weight: bold;">${formatCurrency(results.downPayment.cashRequired)}</td>
                    <td class="info-label">CPF Allowed (${inputs.propertyType === 'commercial' ? '0' : ((results.downPayment.cpfAllowed / results.purchasePrice) * 100).toFixed(1)}%):</td>
                    <td class="info-value" style="color: #2563EB; font-weight: bold;">
                        ${inputs.propertyType === 'commercial' ? 'Not Allowed' : formatCurrency(results.downPayment.cpfAllowed)}
                    </td>
                </tr>
                <tr>
                    <td class="info-label">Total Downpayment:</td>
                    <td class="info-value" style="color: #059669; font-weight: bold;">${formatCurrency(results.downPayment.totalDownPayment)}</td>
                    <td class="info-label">% of Purchase Price:</td>
                    <td class="info-value">${(((results.downPayment.totalDownPayment) / results.purchasePrice) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                    <td class="info-label">Buyer's Stamp Duty (BSD):</td>
                    <td class="info-value" style="color: #7C3AED; font-weight: bold;">${formatCurrency(results.stampDuty)}</td>
                    <td class="info-label">Effective Rate:</td>
                    <td class="info-value">${((results.stampDuty / results.purchasePrice) * 100).toFixed(3)}%</td>
                </tr>
            </table>
        </div>
    </div>

    ${memoizedAffordability && memoizedAffordability.hasValidData ? `
    <div class="section no-break">
        <div class="section-header">📊 MAXIMUM AFFORDABILITY ANALYSIS</div>
        <div class="section-content">
            <table class="info-table">
                <tr>
                    <td class="info-label" style="font-weight: bold;">75% LTV Scenario</td>
                    <td class="info-value"></td>
                    <td class="info-label" style="font-weight: bold;">55% LTV Scenario</td>
                    <td class="info-value"></td>
                </tr>
                <tr>
                    <td class="info-label">Max Property Price:</td>
                    <td class="info-value" style="color: #EA580C; font-weight: bold;">${formatCurrency(memoizedAffordability.maxPropertyPrice75)}</td>
                    <td class="info-label">Max Property Price:</td>
                    <td class="info-value" style="color: #2563EB; font-weight: bold;">${formatCurrency(memoizedAffordability.maxPropertyPrice55)}</td>
                </tr>
                <tr>
                    <td class="info-label">Max Loan Amount:</td>
                    <td class="info-value" style="color: #EA580C; font-weight: bold;">${formatCurrency(memoizedAffordability.maxLoanAmount75)}</td>
                    <td class="info-label">Max Loan Amount:</td>
                    <td class="info-value" style="color: #2563EB; font-weight: bold;">${formatCurrency(memoizedAffordability.maxLoanAmount55)}</td>
                </tr>
                <tr>
                    <td class="info-label">Tenure:</td>
                    <td class="info-value" style="color: #EA580C; font-weight: bold;">${roundDownTenor(memoizedAffordability.maxTenure75)} years</td>
                    <td class="info-label">Tenure:</td>
                    <td class="info-value" style="color: #2563EB; font-weight: bold;">${roundDownTenor(memoizedAffordability.maxTenure55)} years</td>
                </tr>
            </table>
        </div>
    </div>
    ` : ''}

    <div style="background: ${results.tdsrPass ? '#F0FDF4' : '#FEF2F2'}; border: 2px solid ${results.tdsrPass ? '#166534' : '#DC2626'}; color: ${results.tdsrPass ? '#166534' : '#DC2626'}; padding: 15px; margin: 20px 0; text-align: center; font-weight: bold; font-size: 16px; border-radius: 8px;">
        TDSR Assessment: ${results.tdsrPass ? 'PASS ✓' : 'FAIL ✗'}
        <br/>
        <span style="font-size: 14px; margin-top: 5px; display: block;">
            Required Income: ${formatCurrency(results.requiredIncomeTDSR || 0)} | Deficit/Surplus: ${formatCurrency(results.tdsrDeficit || 0)}
        </span>
    </div>

    ${(inputs.propertyType === 'hdb' || inputs.propertyType === 'ec') ? `
    <div style="background: ${results.hdbPass ? '#F0FDF4' : '#FEF2F2'}; border: 2px solid ${results.hdbPass ? '#166534' : '#DC2626'}; color: ${results.hdbPass ? '#166534' : '#DC2626'}; padding: 15px; margin: 20px 0; text-align: center; font-weight: bold; font-size: 16px; border-radius: 8px;">
        MSR Assessment: ${results.hdbPass ? 'PASS ✓' : 'FAIL ✗'}
        <br/>
        <span style="font-size: 14px; margin-top: 5px; display: block;">
            Required Income: ${formatCurrency(results.requiredIncomeHDB || 0)} | Deficit/Surplus: ${formatCurrency(results.hdbDeficit || 0)}
        </span>
    </div>

    ${!results.hdbPass ? `
    <div class="section no-break">
        <div class="section-header">💡 MSR FUNDING SOLUTIONS</div>
        <div class="section-content" style="padding: 8px;">
            <p style="margin-bottom: 15px; font-size: 11px; text-align: center;">To meet the MSR requirements, you need one of the following:</p>
            
            <table class="info-table" style="width: 100%; border-collapse: collapse; margin: 0;">
                <thead style="background: #F9FAFB;">
                    <tr>
                        <th style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: 600; color: #264A82; text-align: center; font-size: 11px; width: 50%;">Show Fund Option</th>
                        <th style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: 600; color: #264A82; text-align: center; font-size: 11px; width: 50%;">Pledge Option</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 12px; border: 1px solid #E5E7EB; text-align: center; font-size: 16px; font-weight: bold; color: #DC2626;">${formatCurrency(results.cashShowHDB || 0)}</td>
                        <td style="padding: 12px; border: 1px solid #E5E7EB; text-align: center; font-size: 16px; font-weight: bold; color: #DC2626;">${formatCurrency(results.cashPledgeHDB || 0)}</td>
                    </tr>
                </tbody>
            </table>
            
            <p style="font-style: italic; color: #666; font-size: 10px; margin: 10px 0; text-align: center;">Choose either Show Fund OR Pledge option, not both</p>
        </div>
    </div>
    ` : ''}
    ` : ''}

    ${!results.tdsrPass ? `
    <div class="section no-break">
        <div class="section-header">💡 TDSR FUNDING SOLUTIONS</div>
        <div class="section-content" style="padding: 8px;">
            <p style="margin-bottom: 15px; font-size: 11px; text-align: center;">To meet the TDSR requirements, you need one of the following:</p>
            
            <table class="info-table" style="width: 100%; border-collapse: collapse; margin: 0;">
                <thead style="background: #F9FAFB;">
                    <tr>
                        <th style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: 600; color: #264A82; text-align: center; font-size: 11px; width: 50%;">Show Fund Option</th>
                        <th style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: 600; color: #264A82; text-align: center; font-size: 11px; width: 50%;">Pledge Option</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 12px; border: 1px solid #E5E7EB; text-align: center; font-size: 16px; font-weight: bold; color: #DC2626;">${formatCurrency(results.cashShowTDSR)}</td>
                        <td style="padding: 12px; border: 1px solid #E5E7EB; text-align: center; font-size: 16px; font-weight: bold; color: #DC2626;">${formatCurrency(results.cashPledgeTDSR)}</td>
                    </tr>
                </tbody>
            </table>
            
            <p style="font-style: italic; color: #666; font-size: 10px; margin: 10px 0; text-align: center;">Choose either Show Fund OR Pledge option, not both</p>
        </div>
    </div>
    ` : ''}

    <div class="section no-break">
        <div class="section-header">👥 APPLICANT DETAILS</div>
        <div class="section-content">
            <table class="info-table" style="width: 100%; border-collapse: collapse; margin: 0;">
                <thead style="background: #F9FAFB;">
                    <tr>
                        <th style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: 600; color: #374151; text-align: left; font-size: 11px; width: 25%;">Field</th>
                        <th style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: 600; color: #264A82; text-align: center; font-size: 11px; width: 37.5%;">Primary Applicant</th>
                        <th style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: 600; color: #264A82; text-align: center; font-size: 11px; width: 37.5%;">Co-Applicant</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: 600; color: #374151; font-size: 11px;">Monthly Salary:</td>
                        <td style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: bold; color: #111827; text-align: right; font-size: 11px;">${formatCurrency(parseNumberInput(inputs.monthlySalaryA) || 0)}</td>
                        <td style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: bold; color: #111827; text-align: right; font-size: 11px;">${formatCurrency(parseNumberInput(inputs.monthlySalaryB) || 0)}</td>
                    </tr>
                    <tr style="background: #F9FAFB;">
                        <td style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: 600; color: #374151; font-size: 11px;">Annual Salary:</td>
                        <td style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: bold; color: #111827; text-align: right; font-size: 11px;">${formatCurrency(parseNumberInput(inputs.annualSalaryA) || 0)}</td>
                        <td style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: bold; color: #111827; text-align: right; font-size: 11px;">${formatCurrency(parseNumberInput(inputs.annualSalaryB) || 0)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: 600; color: #374151; font-size: 11px;">Age:</td>
                        <td style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: bold; color: #111827; text-align: right; font-size: 11px;">${parseNumberInput(inputs.applicantAgeA) || 0} years</td>
                        <td style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: bold; color: #111827; text-align: right; font-size: 11px;">${parseNumberInput(inputs.applicantAgeB) || 0} years</td>
                    </tr>
                    <tr style="background: #F9FAFB;">
                        <td style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: 600; color: #374151; font-size: 11px;">Total Income:</td>
                        <td style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: bold; color: #111827; text-align: right; font-size: 11px;">${formatCurrency(results.totalMonthlyIncomeA || 0)}</td>
                        <td style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: bold; color: #111827; text-align: right; font-size: 11px;">${formatCurrency(results.totalMonthlyIncomeB || 0)}</td>
                    </tr>
                </tbody>
            </table>
            <div style="text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px solid #E5E7EB;">
                <h4 style="color: #264A82; margin-bottom: 5px; font-size: 16px;">Combined Household Income</h4>
                <div style="font-size: 20px; font-weight: bold; color: #264A82;">${formatCurrency(results.combinedMonthlyIncome || 0)}</div>
            </div>
            
            
            ${results.averageAge > 0 ? `
            <div style="margin-top: 20px; padding: 8px; background: #F9FAFB; border-radius: 6px;">
                <h4 style="color: #264A82; margin-bottom: 15px; font-size: 14px; text-align: center;">Age & Tenor Information</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div class="info-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                        <span class="info-label" style="font-weight: 600; color: #374151;">Average Age:</span>
                        <span class="info-value" style="font-weight: bold; color: #111827;">${results.averageAge.toFixed(1)} years</span>
                    </div>
                    <div class="info-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                        <span class="info-label" style="font-weight: 600; color: #374151;">Max Loan Tenor:</span>
                        <span class="info-value" style="font-weight: bold; color: #111827;">${roundDownTenor(results.finalLoanTenure || inputs.loanTenor || 0)} years</span>
                    </div>
                </div>
            </div>
            ` : ''}
            
            ${(parseNumberInput(inputs.showFundAmount) > 0 || parseNumberInput(inputs.pledgeAmount) > 0) ? `
            <div style="margin-top: 20px; padding: 8px; background: #F9FAFB; border-radius: 6px;">
                <h4 style="color: #264A82; margin-bottom: 15px; font-size: 14px; text-align: center;">Additional Funding Options</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    ${parseNumberInput(inputs.showFundAmount) > 0 ? `
                    <div class="info-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                        <span class="info-label" style="font-weight: 600; color: #374151;">Show Fund Amount:</span>
                        <span class="info-value" style="font-weight: bold; color: #111827;">${formatCurrency(parseNumberInput(inputs.showFundAmount) || 0)}</span>
                    </div>
                    ` : ''}
                    ${parseNumberInput(inputs.pledgeAmount) > 0 ? `
                    <div class="info-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                        <span class="info-label" style="font-weight: 600; color: #374151;">Pledge Amount:</span>
                        <span class="info-value" style="font-weight: bold; color: #111827;">${formatCurrency(parseNumberInput(inputs.pledgeAmount) || 0)}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}
        </div>
    </div>

    <div class="section no-break">
        <div class="section-header">📊 MONTHLY COMMITMENTS</div>
        <div class="section-content" style="padding-top: 3px !important;">
            ${(inputs.propertyType === 'hdb' || inputs.propertyType === 'ec') ? `
            <div style="padding: 4px;">
                <div style="margin-bottom: 8px;">
                    <h4 style="color: #DC2626; margin-bottom: 5px; font-size: 14px;">MSR Commitments: ${formatCurrency(results.totalCommitments || 0)}</h4>
                    <p style="font-size: 11px; color: #666; margin-bottom: 5px;"><strong>${propertyTypeText} MSR Calculation:</strong> Includes property loans only (${formatCurrency(results.totalCommitments || 0)}). Car loans and personal loans are excluded from MSR.</p>
                </div>
                
                <div style="margin-bottom: 8px;">
                    <h4 style="color: #DC2626; margin-bottom: 5px; font-size: 14px;">TDSR Commitments: ${formatCurrency(results.totalCommitmentsTDSR || 0)}</h4>
                    <p style="font-size: 11px; color: #666; margin-bottom: 5px;"><strong>${propertyTypeText} TDSR Calculation:</strong> Includes all commitments:</p>
                    <ul style="font-size: 11px; color: #666; margin: 0; padding-left: 20px;">
                        <li>Car loans: ${formatCurrency((parseNumberInput(inputs.carLoanA) || 0) + (parseNumberInput(inputs.carLoanB) || 0))}</li>
                        <li>Personal loans: ${formatCurrency((parseNumberInput(inputs.personalLoanA) || 0) + (parseNumberInput(inputs.personalLoanB) || 0))}</li>
                        <li>Property loans: ${formatCurrency((parseNumberInput(inputs.propertyLoanA) || 0) + (parseNumberInput(inputs.propertyLoanB) || 0))}</li>
                    </ul>
                </div>
            </div>
            ` : `
            <div style="padding: 4px;">
                <div style="margin-bottom: 8px;">
                    <h4 style="color: #DC2626; margin-bottom: 5px; font-size: 14px;">TDSR Commitments: ${formatCurrency(results.totalCommitmentsTDSR || 0)}</h4>
                    <p style="font-size: 11px; color: #666; margin-bottom: 5px;"><strong>Private Property TDSR Calculation:</strong> Includes all commitments:</p>
                    <ul style="font-size: 11px; color: #666; margin: 0; padding-left: 20px;">
                        <li>Car loans: ${formatCurrency((parseNumberInput(inputs.carLoanA) || 0) + (parseNumberInput(inputs.carLoanB) || 0))}</li>
                        <li>Personal loans: ${formatCurrency((parseNumberInput(inputs.personalLoanA) || 0) + (parseNumberInput(inputs.personalLoanB) || 0))}</li>
                        <li>Property loans: ${formatCurrency((parseNumberInput(inputs.propertyLoanA) || 0) + (parseNumberInput(inputs.propertyLoanB) || 0))}</li>
                    </ul>
                </div>
            </div>
            `}
        </div>
    </div>

    <div class="section no-break">
        <div class="section-header">⚠️ DISCLAIMER – KEYQUEST VENTURES PRIVATE LIMITED</div>
        <div class="section-content">
            <div style="padding: 12px; font-size: 10px; color: #555; line-height: 1.6;">
                <p style="margin: 8px 0;">This report is for general information and personal reference only. It does not constitute financial, investment, or professional advice, and does not take into account individual goals or financial situations.</p>
                <p style="margin: 8px 0;">Users should not rely solely on this information when making financial or investment decisions. While we aim to use reliable data, Keyquest Ventures Private Limited does not guarantee its accuracy or completeness.</p>
                <p style="margin: 8px 0;">Use of our reports, consultancy services, or advice—whether by the recipient directly or through our consultants, affiliates, or partners—is undertaken entirely at the user's own risk.</p>
                <p style="margin: 8px 0;">Keyquest Ventures Private Limited, including its affiliates and employees, bears no responsibility or liability for any decisions made or actions taken based on the information provided.</p>
            </div>
        </div>
    </div>

    <div class="footer no-break" style="text-align: center; margin-top: 30px; padding: 15px; color: #264A82; border-top: 1px solid #E5E7EB;">
        <div style="font-size: 9px; color: #6b7280;">
            ${currentUser?.name || 'User'} | ${currentUser?.email || 'email@example.com'} | contactus@keyquestmortgage.com.sg<br>
            <strong style="color: #264A82; margin-top: 5px; display: block;">Your Trusted Mortgage Advisory Partner</strong>
        </div>
    </div>

    <script>
        // Cross-Platform PDF Generation Optimizations
        (function() {
            // Enhanced device detection
            const userAgent = navigator.userAgent || '';
            const isIPhone = /iPhone/.test(userAgent);
            const isAndroid = /Android/.test(userAgent);
            const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
            const isChrome = /Chrome/.test(userAgent);
            const isFirefox = /Firefox/.test(userAgent);
            const isMobile = isIPhone || isAndroid || /Mobile|Tablet/.test(userAgent);
            
            // Add device-specific CSS classes to prevent conflicts
            if (isIPhone) {
                document.body.classList.add('ios-device');
            } else if (isAndroid) {
                document.body.classList.add('android-device');
            }
            
            // Device-specific optimizations
            if (isIPhone && isSafari) {
                logger.debug('iPhone Safari detected - applying PDF optimizations');
                
                // Force text size adjustment
                document.documentElement.style.setProperty('-webkit-text-size-adjust', '100%', 'important');
                document.body.style.setProperty('-webkit-text-size-adjust', '100%', 'important');
                
                // Add iPhone-specific class for targeted styling
                document.body.classList.add('iphone-safari');
                
                // Force consistent font rendering
                const style = document.createElement('style');
                style.textContent = \`
                    .iphone-safari {
                        -webkit-font-smoothing: antialiased !important;
                        -moz-osx-font-smoothing: grayscale !important;
                    }
                    
                    .iphone-safari .section {
                        margin: 6px 0 !important;
                        page-break-inside: avoid !important;
                        -webkit-column-break-inside: avoid !important;
                    }
                    
                    .iphone-safari .section-content {
                        padding: 6px !important;
                    }
                    
                    .iphone-safari .info-table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        font-size: 10px !important;
                    }
                    
                    .iphone-safari .info-table th,
                    .iphone-safari .info-table td {
                        padding: 4px 6px !important;
                        border: 1px solid #E5E7EB !important;
                        font-size: 9px !important;
                    }
                    
                    .iphone-safari .info-row {
                        padding: 2px 0 !important;
                        font-size: 10px !important;
                    }
                    
                    .iphone-safari .assessment-grid {
                        display: block !important;
                        margin: 6px 0 !important;
                    }
                    
                    .iphone-safari .assessment-card {
                        display: block !important;
                        margin-bottom: 8px !important;
                        border: 1px solid #E5E7EB !important;
                        border-radius: 4px !important;
                    }
                    
                    @media print {
                        .iphone-safari {
                            font-size: 10px !important;
                            line-height: 1.2 !important;
                        }
                        
                        .iphone-safari @page {
                            margin: 0.3in !important;
                            size: A4 !important;
                        }
                        
                        .iphone-safari .section {
                            margin: 4px 0 !important;
                            padding: 0 !important;
                        }
                        
                        .iphone-safari .section-header {
                            font-size: 11px !important;
                            padding: 4px 8px !important;
                        }
                        
                        .iphone-safari .section-content {
                            padding: 4px !important;
                        }
                    }
                \`;
                document.head.appendChild(style);
                
                // Fix viewport issues for PDF generation
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) {
                    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
                }
                
                // Force layout recalculation
                setTimeout(() => {
                    document.body.style.display = 'none';
                    document.body.offsetHeight; // Trigger reflow
                    document.body.style.display = '';
                }, 100);
            }
            
            // Android Chrome/Browser specific optimizations
            if (isAndroid) {
                logger.debug('Android device detected - applying PDF optimizations');
                
                // Force text size adjustment for Android
                document.documentElement.style.setProperty('-webkit-text-size-adjust', '100%', 'important');
                document.body.style.setProperty('-webkit-text-size-adjust', '100%', 'important');
                
                // Add Android-specific class for targeted styling
                document.body.classList.add('android-browser');
                
                // Android-specific CSS optimizations
                const androidStyle = document.createElement('style');
                androidStyle.textContent = \`
                    .android-browser {
                        -webkit-font-smoothing: antialiased !important;
                        -webkit-tap-highlight-color: transparent !important;
                    }
                    
                    .android-browser .section {
                        margin: 8px 0 !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    
                    .android-browser .info-table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        font-size: 11px !important;
                    }
                    
                    .android-browser .info-table th,
                    .android-browser .info-table td {
                        padding: 6px 8px !important;
                        border: 1px solid #E5E7EB !important;
                        font-size: 10px !important;
                    }
                    
                    @media print {
                        .android-browser {
                            font-size: 11px !important;
                            line-height: 1.3 !important;
                        }
                        
                        .android-browser .section {
                            margin: 6px 0 !important;
                            padding: 0 !important;
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }
                        
                        .android-browser .section-header {
                            font-size: 12px !important;
                            padding: 6px 12px !important;
                        }
                        
                        .android-browser .section-content {
                            padding: 6px !important;
                        }
                        
                        .android-browser .info-table {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }
                    }
                \`;
                document.head.appendChild(androidStyle);
                
                // Fix viewport for Android browsers
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) {
                    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=yes, viewport-fit=cover');
                }
            }
            
            // General mobile optimizations
            if (isMobile) {
                document.body.classList.add('mobile-browser');
                
                // Force consistent font rendering across mobile browsers
                const mobileStyle = document.createElement('style');
                mobileStyle.textContent = \`
                    .mobile-browser .info-table {
                        border-collapse: collapse !important;
                        width: 100% !important;
                    }
                    
                    .mobile-browser .info-table th,
                    .mobile-browser .info-table td {
                        border: 1px solid #E5E7EB !important;
                        padding: 6px 8px !important;
                        font-size: 10px !important;
                        word-wrap: break-word !important;
                    }
                    
                    @media print {
                        .mobile-browser .info-table {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }
                    }
                \`;
                document.head.appendChild(mobileStyle);
            }
            
            // Enhanced print optimization for all devices
            const setupPrintOptimizations = () => {
                window.addEventListener('beforeprint', function() {
                    logger.debug('Print started - applying optimizations');
                    
                    // Add print-optimized class
                    document.body.classList.add('printing');
                    
                    // Force consistent rendering across all elements
                    const elements = document.querySelectorAll('.section, .section-content, .assessment-grid, .funding-grid, .info-table');
                    elements.forEach(el => {
                        el.style.pageBreakInside = 'avoid';
                        el.style.breakInside = 'avoid';
                        el.style.webkitColumnBreakInside = 'avoid';
                        
                        // Android Chrome specific fixes
                        if (isAndroid && isChrome) {
                            el.style.webkitTransform = 'translateZ(0)';
                            el.style.backfaceVisibility = 'hidden';
                        }
                    });
                    
                    // Force layout recalculation for Android
                    if (isAndroid) {
                        setTimeout(() => {
                            const body = document.body;
                            body.style.visibility = 'hidden';
                            body.offsetHeight; // Trigger reflow
                            body.style.visibility = 'visible';
                        }, 50);
                    }
                });
                
                window.addEventListener('afterprint', function() {
                    logger.debug('Print completed - cleaning up');
                    document.body.classList.remove('printing');
                });
            };
            
            // Initialize print optimizations
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setupPrintOptimizations);
            } else {
                setupPrintOptimizations();
            }
        })();
    </script>

</body>
</html>
`;

      // Open PDF in new window with enhanced download functionality
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Add enhanced download functionality matching other calculators
      setTimeout(() => {
        // Add download and print functionality to the new window
        const addDownloadFeature = () => {
          // Create control buttons container
          const controlsDiv = printWindow.document.createElement('div');
          controlsDiv.id = 'pdf-controls';
          controlsDiv.style.cssText = `
            position: fixed; 
            top: 20px; 
            right: 20px; 
            z-index: 9999; 
            display: flex; 
            gap: 10px;
            font-family: Arial, sans-serif;
          `;
          
          // Download PDF button
          const downloadBtn = printWindow.document.createElement('button');
          downloadBtn.innerHTML = '📥 Save as PDF';
          downloadBtn.style.cssText = `
            background: #4CAF50; 
            color: white; 
            padding: 12px 20px; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer; 
            font-size: 14px; 
            font-weight: 600;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            transition: background 0.2s;
          `;
          downloadBtn.onmouseover = () => downloadBtn.style.background = '#45a049';
          downloadBtn.onmouseout = () => downloadBtn.style.background = '#4CAF50';
          downloadBtn.onclick = () => {
            try {
              // Set print media styles and trigger print with standardized filename
              const currentDate = new Date();
              const dateStr = currentDate.getFullYear() + 
                            String(currentDate.getMonth() + 1).padStart(2, '0') + 
                            String(currentDate.getDate()).padStart(2, '0');
              
              const fileName = `KeyQuest-TDSR-MSR-Report-${dateStr}`;
              
              // Cross-platform print handling
              printWindow.document.title = fileName;
              
              // Android Chrome specific handling
              if (/Android/.test(navigator.userAgent) && /Chrome/.test(navigator.userAgent)) {
                logger.debug('Android Chrome detected - applying specific print handling');
                
                // Force layout stabilization before print
                setTimeout(() => {
                  printWindow.focus();
                  printWindow.print();
                }, 500);
              } else {
                // Standard print for other browsers
                printWindow.focus();
                printWindow.print();
              }
            } catch (error) {
              logger.error('Print error:', error);
              alert('Unable to generate PDF. Please try refreshing the page and generating the report again.');
            }
          };
          
          // Quick Print button
          const printBtn = printWindow.document.createElement('button');
          printBtn.innerHTML = '🖨️ Print';
          printBtn.style.cssText = `
            background: #2196F3; 
            color: white; 
            padding: 12px 20px; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer; 
            font-size: 14px; 
            font-weight: 600;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            transition: background 0.2s;
          `;
          printBtn.onmouseover = () => printBtn.style.background = '#1976D2';
          printBtn.onmouseout = () => printBtn.style.background = '#2196F3';
          printBtn.onclick = () => printWindow.print();
          
          // Close button
          const closeBtn = printWindow.document.createElement('button');
          closeBtn.innerHTML = '✕';
          closeBtn.style.cssText = `
            background: #f44336; 
            color: white; 
            padding: 12px 16px; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer; 
            font-size: 14px; 
            font-weight: 600;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            transition: background 0.2s;
          `;
          closeBtn.onmouseover = () => closeBtn.style.background = '#d32f2f';
          closeBtn.onmouseout = () => closeBtn.style.background = '#f44336';
          closeBtn.onclick = () => printWindow.close();
          
          // Add buttons to controls
          controlsDiv.appendChild(downloadBtn);
          controlsDiv.appendChild(printBtn);
          controlsDiv.appendChild(closeBtn);
          
          // Add controls to page
          printWindow.document.body.appendChild(controlsDiv);
          
          // Hide controls during printing
          const style = printWindow.document.createElement('style');
          style.textContent = '@media print { #pdf-controls { display: none !important; } }';
          printWindow.document.head.appendChild(style);
          
          // Auto-focus for better UX
          printWindow.focus();
        };
        
        addDownloadFeature();
      }, 1000);

      logger.info('Enhanced TDSR/MSR analysis PDF report generated successfully');

    } catch (error) {
      logger.error('Error generating report:', error);
      alert('There was an error generating the report. Please try again.');
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
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
            
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Purchase Price (SGD)</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
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
                        inputMode="numeric"
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
                      inputMode="decimal"
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
                      inputMode="numeric"
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
                      <p><strong>Max tenor:</strong> {roundDownTenor(results.maxLoanTenor)} years</p>
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
                      inputMode="numeric"
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
            
            <div className="space-y-6">
              {/* Primary Applicant Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-300 pb-2">
                  Primary Applicant
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Monthly Car Loan (SGD)</label>
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
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Monthly Personal Loan (SGD)</label>
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
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Monthly Property Loan (SGD)</label>
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
                </div>
              </div>

              {/* Co-Applicant Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-300 pb-2">
                  Co-Applicant (Optional)
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Monthly Car Loan (SGD)</label>
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
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Monthly Personal Loan (SGD)</label>
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
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Monthly Property Loan (SGD)</label>
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
                      <div className="text-sm font-medium text-gray-600 mb-1">
                        {(inputs.propertyType === 'hdb' || inputs.propertyType === 'ec') 
                          ? 'MSR Commitments (Property Loans)' 
                          : 'Combined Monthly Commitment'
                        }
                      </div>
                      <div className="text-xl font-bold text-purple-600">{formatCurrency(memoizedAffordability.relevantCommitments || 0)}</div>
                    </div>
                  </div>
                </div>

                {/* Maximum Affordability Results */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Maximum Purchase Price You Can Afford</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Standard 75% LTV Option */}
                    <div 
                      className="result-card cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 relative group"
                      onClick={() => handleAffordabilityCardClick(75)}
                      title="Click to use this affordability calculation"
                    >
                      <div className="result-header">
                        <div className="result-icon bg-blue-100">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="result-title">Standard (75% LTV)</div>
                          <div className="text-xs text-gray-500 mb-1">Maximum Purchase Price</div>
                          <div className="result-value text-blue-600">{formatCurrency(memoizedAffordability.maxPropertyPrice75)}</div>
                          <div className="result-subtitle">
                            Loan Amount: {formatCurrency(memoizedAffordability.maxLoanAmount75)}<br />
                            Loan Tenure: {roundDownTenor(memoizedAffordability.maxTenure75)} years
                          </div>
                          {/* Use This Button */}
                          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="inline-flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              <span>Click to use this</span>
                              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Conservative 55% LTV Option */}
                    <div 
                      className="result-card cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 relative group"
                      onClick={() => handleAffordabilityCardClick(55)}
                      title="Click to use this affordability calculation"
                    >
                      <div className="result-header">
                        <div className="result-icon bg-orange-100">
                          <Building className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <div className="result-title">Conservative (55% LTV)</div>
                          <div className="text-xs text-gray-500 mb-1">Maximum Purchase Price</div>
                          <div className="result-value text-orange-600">{formatCurrency(memoizedAffordability.maxPropertyPrice55)}</div>
                          <div className="result-subtitle">
                            Loan Amount: {formatCurrency(memoizedAffordability.maxLoanAmount55)}<br />
                            Loan Tenure: {roundDownTenor(memoizedAffordability.maxTenure55)} years
                          </div>
                          {/* Use This Button */}
                          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="inline-flex items-center text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">
                              <span>Click to use this</span>
                              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </div>
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
            <div className="standard-card card-gradient-green">
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
                onClick={generatePDFReport}
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
      <style>
        {`
          /* HEADER LOGO STYLING ONLY - No global overrides */
          /* Desktop (1024px+) - Improved alignment and larger logo */
          @media (min-width: 1024px) {
            .header-logo-container {
              height: 65px !important;
              max-height: 65px !important;
              min-height: 65px !important;
              overflow: visible !important;
              display: flex !important;
              align-items: center !important;
              justify-content: flex-start !important;
            }
            
            .header-logo-container div {
              height: auto !important;
              max-height: none !important;
              min-height: auto !important;
              width: auto !important;
              overflow: visible !important;
              display: flex !important;
              align-items: center !important;
              transform-origin: left center !important;
            }
            
            .header-logo-container div img,
            .header-logo-container img,
            img.header-logo,
            .header-logo {
              height: auto !important;
              max-height: none !important;
              min-height: auto !important;
              width: auto !important;
              display: block !important;
              object-fit: contain !important;
              transform: scale(0.5) translateX(-80px) !important;
              transform-origin: left center !important;
            }
          }

          /* Tablet (769px-1023px) */
          @media (min-width: 769px) and (max-width: 1023px) {
            .header-logo-container {
              height: 40px !important;
              max-height: 40px !important;
              min-height: 40px !important;
              overflow: visible !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            
            .header-logo-container div img,
            .header-logo-container img,
            .header-logo {
              transform: scale(0.25) translateX(0px) !important;
              transform-origin: center !important;
            }
          }

          /* Mobile optimizations (768px and below) - Single row layout */
          @media (max-width: 768px) {
            .header-logo-container {
              justify-content: flex-start !important;
              height: 80px !important;
              max-height: 80px !important;
              min-height: 80px !important;
              margin-bottom: 0 !important;
              width: auto !important;
              flex: 3 !important;
              display: flex !important;
              align-items: center !important;
            }
            
            .header-logo-container div {
              justify-content: flex-start !important;
              display: flex !important;
              align-items: center !important;
              width: auto !important;
              transform-origin: left center !important;
            }
            
            .header-logo-container div img,
            .header-logo-container img,
            .header-logo {
              transform: scale(1.1) translateX(-80px) !important;
              transform-origin: left center !important;
            }
            
            /* Single row layout - user card styling takes 1/4 space */
            .relative {
              flex: 1 !important;
              margin-left: auto !important;
            }
            
            .relative .standard-card.card-gradient-blue {
              width: auto !important;
              max-width: none !important;
              margin: 0 !important;
              height: 80px !important;
              min-height: 80px !important;
              display: flex !important;
              align-items: center !important;
            }
            
            /* Hide text and avatar circle in profile card on mobile */
            .relative .standard-card.card-gradient-blue p,
            .relative .standard-card.card-gradient-blue span,
            .relative .standard-card.card-gradient-blue .w-8.h-8 {
              display: none !important;
            }
          }

          @media (max-width: 640px) {
            .header-logo-container {
              justify-content: flex-start !important;
              height: 70px !important;
              max-height: 70px !important;
              min-height: 70px !important;
              width: auto !important;
              flex: 3 !important;
              display: flex !important;
              align-items: center !important;
            }
            
            .relative {
              flex: 1 !important;
              margin-left: auto !important;
            }
            
            .header-logo-container div {
              justify-content: flex-start !important;
              display: flex !important;
              align-items: center !important;
              width: auto !important;
              transform-origin: left center !important;
            }
            
            .header-logo-container div img,
            .header-logo-container img,
            .header-logo {
              transform: scale(1.4) translateX(-30px) !important;
              transform-origin: left center !important;
            }
            
            /* Compact user card for small screens - single row */
            .relative .standard-card.card-gradient-blue {
              padding: 6px 12px !important;
              height: 70px !important;
              min-height: 70px !important;
              display: flex !important;
              align-items: center !important;
            }
            
            .relative .standard-card.card-gradient-blue .flex.items-center.gap-2 {
              gap: 0.375rem !important;
            }
            
            /* Hide text and avatar circle in profile card on mobile */
            .relative .standard-card.card-gradient-blue p,
            .relative .standard-card.card-gradient-blue span,
            .relative .standard-card.card-gradient-blue .w-8.h-8 {
              display: none !important;
            }
          }
          
          /* Extra small screens */
          @media (max-width: 480px) {
            .header-logo-container {
              height: 60px !important;
              max-height: 60px !important;
              min-height: 60px !important;
              width: auto !important;
              flex: 3 !important;
              display: flex !important;
              align-items: center !important;
              justify-content: flex-start !important;
            }
            
            .relative {
              flex: 1 !important;
              margin-left: auto !important;
            }
            
            .header-logo-container div {
              justify-content: flex-start !important;
              display: flex !important;
              align-items: center !important;
              width: auto !important;
              transform-origin: left center !important;
            }
            
            .header-logo-container div img,
            .header-logo-container img,
            .header-logo {
              transform: scale(1.4) translateX(-30px) !important;
              transform-origin: left center !important;
            }
            
            /* Very compact layout - single row */
            .relative .standard-card.card-gradient-blue {
              padding: 4px 8px !important;
              max-width: none !important;
              height: 60px !important;
              min-height: 60px !important;
              display: flex !important;
              align-items: center !important;
            }
            
            /* Hide text and avatar circle in profile card on mobile */
            .relative .standard-card.card-gradient-blue p,
            .relative .standard-card.card-gradient-blue span,
            .relative .standard-card.card-gradient-blue .w-8.h-8 {
              display: none !important;
            }
          }
        `}
      </style>
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Enhanced Header */}
        <div className="mb-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 lg:px-6 py-3 lg:py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="header-logo-container">
                <div style={{ 
                  height: 'auto', 
                  width: 'auto', 
                  display: 'flex', 
                  alignItems: 'center',
                  maxHeight: 'none',
                  overflow: 'visible',
                  transformOrigin: 'center'
                }}>
                  <img 
                    src="https://ik.imagekit.io/hst9jooux/KEYQUEST%20LOGO%20(Black%20Text%20Horizontal).png?updatedAt=1753262438682" 
                    alt="Keyquest Mortgage" 
                    className="header-logo"
                    style={{
                      height: 'auto',
                      width: 'auto',
                      display: 'block',
                      objectFit: 'contain'
                    }}
                  />
                </div>
              </div>
              
              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <div className="standard-card card-gradient-blue">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{user?.name}</p>
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
                        <>
                          <button
                            onClick={handleMenuItemClick(() => setShowAdminManagement(true))}
                            className="w-full btn-standard btn-primary mb-2"
                            type="button"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>User Management</span>
                          </button>
                          
                        </>
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
        <div className="mb-1 mt-1 relative z-10">
          {/* Desktop Version - Full buttons with text */}
          <div className="hidden lg:flex flex-row gap-4">
            <button
              onClick={() => setCalculatorType('tdsr')}
              className={`flex-1 p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-xl cursor-pointer ${
                calculatorType === 'tdsr'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-600 text-white shadow-xl'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 shadow-md hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className={`p-2 rounded-lg ${
                  calculatorType === 'tdsr' 
                    ? 'bg-white/20' 
                    : 'bg-blue-50'
                }`}>
                  <TrendingUp className={`w-5 h-5 ${
                    calculatorType === 'tdsr' 
                      ? 'text-white' 
                      : 'text-blue-600'
                  }`} />
                </div>
                <div className="text-left">
                  <div className="font-semibold">TDSR/MSR Calculator</div>
                  <div className="text-xs opacity-75">Affordability Assessment</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => setCalculatorType('repayment')}
              className={`flex-1 p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-xl cursor-pointer ${
                calculatorType === 'repayment'
                  ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-600 text-white shadow-xl'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-green-300 shadow-md hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className={`p-2 rounded-lg ${
                  calculatorType === 'repayment' 
                    ? 'bg-white/20' 
                    : 'bg-green-50'
                }`}>
                  <DollarSign className={`w-5 h-5 ${
                    calculatorType === 'repayment' 
                      ? 'text-white' 
                      : 'text-green-600'
                  }`} />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Monthly Repayment Calculator</div>
                  <div className="text-xs opacity-75">Payment Schedules</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => setCalculatorType('progressive')}
              className={`flex-1 p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-xl cursor-pointer ${
                calculatorType === 'progressive'
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600 border-purple-600 text-white shadow-xl'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300 shadow-md hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className={`p-2 rounded-lg ${
                  calculatorType === 'progressive' 
                    ? 'bg-white/20' 
                    : 'bg-purple-50'
                }`}>
                  <BarChart3 className={`w-5 h-5 ${
                    calculatorType === 'progressive' 
                      ? 'text-white' 
                      : 'text-purple-600'
                  }`} />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Progressive Payment Calculator</div>
                  <div className="text-xs opacity-75">BUC Properties</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => setCalculatorType('packages')}
              className={`flex-1 p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-xl cursor-pointer ${
                calculatorType === 'packages'
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 border-orange-600 text-white shadow-xl'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300 shadow-md hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className={`p-2 rounded-lg ${
                  calculatorType === 'packages' 
                    ? 'bg-white/20' 
                    : 'bg-orange-50'
                }`}>
                  <Sparkles className={`w-5 h-5 ${
                    calculatorType === 'packages' 
                      ? 'text-white' 
                      : 'text-orange-600'
                  }`} />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Recommended Packages</div>
                  <div className="text-xs opacity-75">Mortgage Package Finder</div>
                </div>
              </div>
            </button>
          </div>

          {/* Mobile Version - Single row icon buttons */}
          <div className="lg:hidden">
            <div className="flex justify-center gap-4 p-4 bg-gray-50 rounded-xl">
              <button
                onClick={() => setCalculatorType('tdsr')}
                className={`flex-1 p-4 rounded-lg transition-all duration-300 min-h-[72px] touch-manipulation active:scale-95 flex flex-col items-center justify-center ${
                  calculatorType === 'tdsr' 
                    ? 'bg-blue-500 text-white shadow-lg scale-105' 
                    : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  position: 'relative',
                  zIndex: 1
                }}
                title="TDSR/MSR Calculator"
              >
                <TrendingUp className="w-6 h-6 mx-auto mb-1" />
                <div className="text-xs font-medium text-center">TDSR</div>
              </button>
              
              <button
                onClick={() => setCalculatorType('repayment')}
                className={`flex-1 p-4 rounded-lg transition-all duration-300 min-h-[72px] touch-manipulation active:scale-95 flex flex-col items-center justify-center ${
                  calculatorType === 'repayment' 
                    ? 'bg-green-500 text-white shadow-lg scale-105' 
                    : 'bg-white text-gray-600 hover:bg-green-50 hover:text-green-600'
                }`}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  position: 'relative',
                  zIndex: 1
                }}
                title="Monthly Repayment Calculator"
              >
                <DollarSign className="w-6 h-6 mx-auto mb-1" />
                <div className="text-xs font-medium text-center">Repay</div>
              </button>
              
              <button
                onClick={() => setCalculatorType('progressive')}
                className={`flex-1 p-4 rounded-lg transition-all duration-300 min-h-[72px] touch-manipulation active:scale-95 flex flex-col items-center justify-center ${
                  calculatorType === 'progressive' 
                    ? 'bg-purple-500 text-white shadow-lg scale-105' 
                    : 'bg-white text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                }`}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  position: 'relative',
                  zIndex: 1
                }}
                title="Progressive Payment Calculator"
              >
                <BarChart3 className="w-6 h-6 mx-auto mb-1" />
                <div className="text-xs font-medium text-center">Prog</div>
              </button>
              
              <button
                onClick={() => setCalculatorType('packages')}
                className={`flex-1 p-4 rounded-lg transition-all duration-300 min-h-[72px] touch-manipulation active:scale-95 flex flex-col items-center justify-center ${
                  calculatorType === 'packages' 
                    ? 'bg-orange-500 text-white shadow-lg scale-105' 
                    : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                }`}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  position: 'relative',
                  zIndex: 1
                }}
                title="Recommended Packages"
              >
                <Sparkles className="w-6 h-6 mx-auto mb-1" />
                <div className="text-xs font-medium text-center">Packages</div>
              </button>
            </div>
          </div>
        </div>


        {/* Calculator Content */}
        <div className="standard-card" style={{ transform: 'none' }}>
          {calculatorType === 'tdsr' ? (
            <TDSRMSRCalculator currentUser={user} onLogout={handleLogout} />
          ) : calculatorType === 'repayment' ? (
            <MonthlyRepaymentCalculator currentUser={user} />
          ) : calculatorType === 'packages' ? (
            <RecommendedPackages currentUser={user} />
          ) : (
            <ProgressivePaymentCalculator currentUser={user} />
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
