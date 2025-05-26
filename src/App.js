import React, { useState, useCallback } from 'react';
import { Calculator, Download, FileText, CheckCircle, XCircle, Info, Lock, LogOut, Home, Building } from 'lucide-react';
import './App.css';

// Employee credentials (in production, store these securely)
const EMPLOYEE_CREDENTIALS = {
  'admin': 'admin123',
  'manager': 'manager456',
  'analyst': 'analyst789',
  'employee1': 'emp123',
  'employee2': 'emp456',
  // Add more employees as needed
};

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');

    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (EMPLOYEE_CREDENTIALS[username] === password) {
      onLogin(username);
    } else {
      setError('Invalid credentials. Please check your username and password.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Access</h1>
          <p className="text-gray-600 mt-2">Comprehensive Mortgage Calculator Portal</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your username"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            <p className="font-medium mb-2">Demo Credentials:</p>
            <div className="space-y-1">
              <p>• admin / admin123</p>
              <p>• manager / manager456</p>
              <p>• analyst / analyst789</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MortgageCalculator = ({ currentUser, onLogout }) => {
  // Reset all values to empty when component mounts (fresh login)
  const [inputs, setInputs] = useState({
    // Property Type Selection
    propertyType: 'private', // 'private' or 'hdb'
    
    purchasePrice: '',
    loanPercentage: 75, // 55, 75, or custom
    customLoanAmount: '',
    useCustomAmount: false,
    
    // Stress test rate (separate field for calculations)
    stressTestRate: 4,
    
    // Interest rates for each year
    interestRateY1: '',      // Year 1
    interestRateY2: '',      // Year 2
    interestRateY3: '',      // Year 3
    interestRateY4: '',      // Year 4
    interestRateY5: '',      // Year 5
    interestRateThereafter: '', // Thereafter
    
    // Total interest period selection
    interestPeriodSelection: 5, // Default to 5 years
    
    loanTenor: 30, // Default to 30 years
    
    // Applicant A
    monthlySalaryA: '',
    annualSalaryA: '',
    applicantAgeA: '',
    
    // Applicant B
    monthlySalaryB: '',
    annualSalaryB: '',
    applicantAgeB: '',
    
    // Show Fund and Pledging (combined solution)
    showFundAmount: '',
    pledgeAmount: '',
    
    // Existing commitments
    carLoanA: '',
    carLoanB: '',
    personalLoanA: '',
    personalLoanB: '',
    
    // Property loan for HDB MSR calculation
    propertyLoanA: '',
    propertyLoanB: ''
  });

  const [results, setResults] = useState(null);

  // Helper function to format number inputs
  const formatNumberInput = (value) => {
    if (value === '' || value === null || value === undefined) return '';
    const num = parseFloat(value.toString().replace(/,/g, ''));
    if (isNaN(num)) return '';
    return num.toLocaleString();
  };

  // Helper function to parse formatted input back to number
  const parseNumberInput = (value) => {
    if (value === '' || value === null || value === undefined) return '';
    const num = parseFloat(value.toString().replace(/,/g, ''));
    return isNaN(num) ? '' : num;
  };

  // Calculate average applicant age
  const calculateAverageAge = () => {
    const ageA = parseNumberInput(inputs.applicantAgeA) || 0;
    const ageB = parseNumberInput(inputs.applicantAgeB) || 0;
    
    if (ageA > 0 && ageB > 0) {
      return (ageA + ageB) / 2;
    } else if (ageA > 0) {
      return ageA;
    } else if (ageB > 0) {
      return ageB;
    }
    return 0;
  };

  // Calculate maximum loan tenor based on property type and loan percentage
  const calculateMaxLoanTenor = () => {
    const averageAge = calculateAverageAge();
    
    // Determine loan percentage
    let loanPercentage;
    if (inputs.useCustomAmount) {
      const purchasePrice = parseNumberInput(inputs.purchasePrice) || 0;
      const customAmount = parseNumberInput(inputs.customLoanAmount) || 0;
      loanPercentage = purchasePrice > 0 ? (customAmount / purchasePrice) * 100 : 75; // Default to 75%
    } else {
      loanPercentage = inputs.loanPercentage;
    }
    
    // If no age provided, return maximum possible tenor for the loan type
    if (averageAge === 0) {
      if (inputs.propertyType === 'hdb') {
        return loanPercentage >= 56 && loanPercentage <= 75 ? 25 : 30;
      } else {
        return loanPercentage >= 56 && loanPercentage <= 75 ? 30 : 35;
      }
    }
    
    if (inputs.propertyType === 'hdb') {
      if (loanPercentage >= 56 && loanPercentage <= 75) {
        // HDB 56%-75%: Max 25 years, age cap at 65
        return Math.min(25, Math.max(1, 65 - averageAge));
      } else if (loanPercentage <= 55) {
        // HDB 55% and below: Max 30 years, age cap at 75
        return Math.min(30, Math.max(1, 75 - averageAge));
      }
    } else {
      // Private property
      if (loanPercentage >= 56 && loanPercentage <= 75) {
        // Private 56%-75%: Max 30 years, age cap at 65
        return Math.min(30, Math.max(1, 65 - averageAge));
      } else if (loanPercentage <= 55) {
        // Private 55% and below: Max 35 years, age cap at 75
        return Math.min(35, Math.max(1, 75 - averageAge));
      }
    }
    
    return 30; // Default fallback
  };

  // PMT function calculation
  const calculatePMT = (rate, periods, principal) => {
    if (rate === 0) return principal / periods;
    const monthlyRate = rate / 100 / 12;
    const denominator = Math.pow(1 + monthlyRate, periods) - 1;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, periods)) / denominator;
  };

  // Helper function to calculate detailed yearly breakdown
  const calculateYearlyBreakdown = (loanAmount, rates, loanTenor) => {
    let balance = loanAmount;
    const yearlyBreakdown = [];
    
    // Calculate for each year (up to 5 years)
    for (let year = 0; year < 5; year++) {
      const rate = rates[year] || 0;
      const monthlyRate = rate / 100 / 12;
      const installment = calculatePMT(rate, loanTenor * 12, loanAmount);
      
      let yearInterest = 0;
      let yearPrincipal = 0;
      let monthlyInterest = 0;
      let monthlyPrincipal = 0;
      
      // Calculate for 12 months
      for (let month = 0; month < 12; month++) {
        if (balance <= 0) break;
        
        const interestPayment = balance * monthlyRate;
        const principalPayment = installment - interestPayment;
        
        yearInterest += interestPayment;
        yearPrincipal += principalPayment;
        balance -= principalPayment;
        
        if (balance < 0) {
          yearPrincipal += balance; // Adjust for final payment
          balance = 0;
        }
        
        // Store monthly amounts (average for the year)
        if (month === 0) {
          monthlyInterest = interestPayment;
          monthlyPrincipal = principalPayment;
        }
      }
      
      yearlyBreakdown.push({
        year: year + 1,
        monthlyInterest,
        monthlyPrincipal,
        totalInterest: yearInterest,
        totalPrincipal: yearPrincipal,
        monthlyInstallment: installment,
        rate
      });
    }
    
    return yearlyBreakdown;
  };

  // Main calculation function
  const calculateMortgage = useCallback(() => {
    const {
      propertyType, purchasePrice, loanPercentage, customLoanAmount, useCustomAmount,
      stressTestRate, interestRateY1, interestRateY2, interestRateY3, 
      interestRateY4, interestRateY5, interestRateThereafter, loanTenor,
      interestPeriodSelection,
      monthlySalaryA, annualSalaryA, applicantAgeA,
      monthlySalaryB, annualSalaryB, applicantAgeB,
      showFundAmount, pledgeAmount,
      carLoanA, carLoanB, personalLoanA, personalLoanB,
      propertyLoanA, propertyLoanB
    } = inputs;

    // Parse all numeric inputs
    const parsedInputs = {
      purchasePrice: parseNumberInput(purchasePrice) || 0,
      customLoanAmount: parseNumberInput(customLoanAmount) || 0,
      stressTestRate: parseNumberInput(stressTestRate) || 0,
      interestRateY1: parseNumberInput(interestRateY1) || 0,
      interestRateY2: parseNumberInput(interestRateY2) || 0,
      interestRateY3: parseNumberInput(interestRateY3) || 0,
      interestRateY4: parseNumberInput(interestRateY4) || 0,
      interestRateY5: parseNumberInput(interestRateY5) || 0,
      interestRateThereafter: parseNumberInput(interestRateThereafter) || 0,
      loanTenor: parseNumberInput(loanTenor) || 30,
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

    // Calculate average age
    const averageAge = calculateAverageAge();
    const maxLoanTenor = calculateMaxLoanTenor();

    // Calculate loan amount
    let loanAmount;
    if (useCustomAmount) {
      loanAmount = parsedInputs.customLoanAmount;
    } else {
      loanAmount = parsedInputs.purchasePrice * (loanPercentage / 100);
    }
    
    // Calculate loan amounts for reference
    const loanAmount75 = parsedInputs.purchasePrice * 0.75;
    const loanAmount55 = parsedInputs.purchasePrice * 0.55;
    
    // Interest rates array
    const yearlyRates = [
      parsedInputs.interestRateY1, 
      parsedInputs.interestRateY2, 
      parsedInputs.interestRateY3, 
      parsedInputs.interestRateY4, 
      parsedInputs.interestRateY5, 
      parsedInputs.interestRateThereafter
    ];
    
    // Calculate detailed yearly breakdown
    const yearlyBreakdown = calculateYearlyBreakdown(loanAmount, yearlyRates, parsedInputs.loanTenor);
    
    // Calculate total interest for selected period
    const selectedPeriodTotal = yearlyBreakdown.slice(0, interestPeriodSelection).reduce((sum, breakdown) => sum + breakdown.totalInterest, 0);
    
    // Calculate monthly installments for each year/period
    const monthlyInstallmentStressTest = calculatePMT(parsedInputs.stressTestRate, parsedInputs.loanTenor * 12, loanAmount);
    const monthlyInstallmentY1 = calculatePMT(parsedInputs.interestRateY1, parsedInputs.loanTenor * 12, loanAmount);
    const monthlyInstallmentY2 = calculatePMT(parsedInputs.interestRateY2, parsedInputs.loanTenor * 12, loanAmount);
    const monthlyInstallmentY3 = calculatePMT(parsedInputs.interestRateY3, parsedInputs.loanTenor * 12, loanAmount);
    const monthlyInstallmentY4 = calculatePMT(parsedInputs.interestRateY4, parsedInputs.loanTenor * 12, loanAmount);
    const monthlyInstallmentY5 = calculatePMT(parsedInputs.interestRateY5, parsedInputs.loanTenor * 12, loanAmount);
    const monthlyInstallmentThereafter = calculatePMT(parsedInputs.interestRateThereafter, parsedInputs.loanTenor * 12, loanAmount);
    
    // Use stress test installment for affordability calculation
    const monthlyInstallment = monthlyInstallmentStressTest;
    
    // Calculate bonus income (70% of excess annual salary over base)
    // Base salary is monthly salary * 12 (matching Excel R10/S10 calculation)
    const baseSalaryA = parsedInputs.monthlySalaryA * 12;
    const baseSalaryB = parsedInputs.monthlySalaryB * 12;
    const bonusIncomeA = Math.max(0, (parsedInputs.annualSalaryA - baseSalaryA) / 12) * 0.7;
    const bonusIncomeB = Math.max(0, (parsedInputs.annualSalaryB - baseSalaryB) / 12) * 0.7;
    
    // Calculate additional income from show fund and pledge
    const showFundIncomeA = parsedInputs.showFundAmount * 0.00625; // 0.625% monthly yield
    const showFundIncomeB = 0; // Assuming single applicant for show fund
    const pledgeIncomeA = 0; // Assign pledge to Applicant B
    const pledgeIncomeB = parsedInputs.pledgeAmount / 48; // Divide by 48 months - assigned to Applicant B
    
    // Total monthly income
    const totalMonthlyIncomeA = parsedInputs.monthlySalaryA + bonusIncomeA + showFundIncomeA + pledgeIncomeA;
    const totalMonthlyIncomeB = parsedInputs.monthlySalaryB + bonusIncomeB + showFundIncomeB + pledgeIncomeB;
    const combinedMonthlyIncome = totalMonthlyIncomeA + totalMonthlyIncomeB;
    
    // Total commitments (different for HDB vs Private)
    let totalCommitments;
    if (propertyType === 'hdb') {
      // For HDB: Include property loans only in MSR calculation, exclude personal and car loans
      totalCommitments = parsedInputs.propertyLoanA + parsedInputs.propertyLoanB;
    } else {
      // For Private: Include ALL commitments in TDSR calculation (car, personal, property loans)
      totalCommitments = parsedInputs.carLoanA + parsedInputs.carLoanB + parsedInputs.personalLoanA + parsedInputs.personalLoanB + parsedInputs.propertyLoanA + parsedInputs.propertyLoanB;
    }
    
    // TDSR and MSR calculations
    const tdsr55Available = (combinedMonthlyIncome * 0.55) - totalCommitments;
    const msr30Available = combinedMonthlyIncome * 0.3;
    
    // Required income calculations
    const requiredIncomeTDSR = (monthlyInstallment + totalCommitments) / 0.55;
    const requiredIncomeHDB = (monthlyInstallment + totalCommitments) / 0.3;
    
    // Deficit calculations
    const tdsrDeficit = combinedMonthlyIncome - requiredIncomeTDSR;
    const hdbDeficit = combinedMonthlyIncome - requiredIncomeHDB;
    
    // Pass/Fail determination
    const tdsrPass = tdsrDeficit >= 0;
    const hdbPass = hdbDeficit >= 0;
    
    // Cash requirements when failing
    const cashShowTDSR = tdsrPass ? 0 : Math.abs(tdsrDeficit) / 0.00625;
    const cashShowHDB = hdbPass ? 0 : Math.abs(hdbDeficit) / 0.00625;
    const cashPledgeTDSR = tdsrPass ? 0 : Math.abs(tdsrDeficit) * 48;
    const cashPledgeHDB = hdbPass ? 0 : Math.abs(hdbDeficit) * 48;

    return {
      propertyType,
      loanAmount,
      loanAmount75,
      loanAmount55,
      monthlyInstallment,
      monthlyInstallmentStressTest,
      monthlyInstallmentY1,
      monthlyInstallmentY2,
      monthlyInstallmentY3,
      monthlyInstallmentY4,
      monthlyInstallmentY5,
      monthlyInstallmentThereafter,
      yearlyBreakdown,
      selectedPeriodTotal,
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
      averageAge,
      maxLoanTenor
    };
  }, [inputs]);

  React.useEffect(() => {
    setResults(calculateMortgage());
  }, [calculateMortgage]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleInputChange = (field, value) => {
    // For numeric fields, handle formatting
    const numericFields = [
      'purchasePrice', 'customLoanAmount', 'monthlySalaryA', 'annualSalaryA', 
      'monthlySalaryB', 'annualSalaryB', 'showFundAmount', 'pledgeAmount',
      'carLoanA', 'carLoanB', 'personalLoanA', 'personalLoanB', 
      'propertyLoanA', 'propertyLoanB', 'applicantAgeA', 'applicantAgeB'
    ];
    
    if (numericFields.includes(field)) {
      const parsedValue = parseNumberInput(value);
      setInputs(prev => ({
        ...prev,
        [field]: parsedValue
      }));
    } else if (field === 'loanTenor') {
      const parsedValue = parseNumberInput(value);
      const maxTenor = calculateMaxLoanTenor();
      const cappedValue = Math.min(maxTenor, Math.max(1, parsedValue || 30));
      setInputs(prev => ({
        ...prev,
        [field]: cappedValue
      }));
    } else {
      setInputs(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // CLEAN PDF REPORT FUNCTION - PROPERLY INSIDE COMPONENT
  const generatePDFReport = () => {
    if (!results) {
      alert('Please calculate the mortgage first before generating a report.');
      return;
    }

    try {
      const propertyTypeText = inputs.propertyType === 'private' ? 'Private Property' : 'HDB Property';
      const currentDate = new Date().toLocaleDateString('en-SG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Generate professional HTML report
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mortgage Analysis Report - ${propertyTypeText}</title>
    <style>
        @media print {
            body { margin: 0; padding: 15px; }
            .page-break { page-break-before: always; }
            .no-break { page-break-inside: avoid; }
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.5;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #1d4ed8;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 8px;
        }
        
        .logo-section img {
            max-width: 200px;
            height: auto;
            display: block;
        }
        
        .company-tagline {
            color: #666;
            font-size: 14px;
            margin: 5px 0 0 0;
        }
        
        .report-info {
            margin-top: 8px;
            font-size: 12px;
            color: #666;
        }
        
        .property-type-banner {
            background: ${inputs.propertyType === 'private' ? '#1d4ed8' : '#059669'};
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .section {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #fafafa;
            page-break-inside: avoid;
        }
        
        .section h2 {
            color: #1d4ed8;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 8px;
            margin-bottom: 15px;
            font-size: 16px;
        }
        
        .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px dotted #ccc;
        }
        
        .info-label {
            font-weight: 600;
            color: #555;
        }
        
        .info-value {
            font-weight: bold;
            color: #333;
        }
        
        .highlight-box {
            background: #eff6ff;
            border: 1px solid #3b82f6;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
        }
        
        .installment-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin: 15px 0;
        }
        
        .installment-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px;
            text-align: center;
        }
        
        .funding-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 15px 0;
        }
        
        .funding-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 15px;
            text-align: center;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 11px;
            page-break-inside: avoid;
        }
        
        .disclaimer {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            font-size: 10px;
            color: #555;
            page-break-inside: avoid;
        }
        
        @media (max-width: 600px) {
            .two-column, .installment-grid, .funding-grid { 
                grid-template-columns: 1fr; 
            }
        }
    </style>
</head>
<body>
    <div class="header no-break">
        <div class="logo-section">
            <img src="https://ik.imagekit.io/hst9jooux/KeyQuest%20Logo.jpeg?updatedAt=1748073687798" alt="KeyQuest Mortgage Logo">
        </div>
        
        <div class="property-type-banner">
            ${propertyTypeText} Analysis
        </div>
        
        <div class="report-info">
            <strong>Mortgage Analysis Report</strong><br>
            Generated: ${currentDate} | Report ID: KQM-${Date.now()}
        </div>
    </div>

    <div class="section no-break">
        <h2>📋 LOAN SUMMARY</h2>
        <div class="highlight-box">
            <div class="two-column">
                <div>
                    <div class="info-row">
                        <span class="info-label">Property Type:</span>
                        <span class="info-value">${propertyTypeText}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Property Value:</span>
                        <span class="info-value">${formatCurrency(parseNumberInput(inputs.purchasePrice) || 0)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Loan Amount:</span>
                        <span class="info-value">${formatCurrency(results.loanAmount)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Loan-to-Value:</span>
                        <span class="info-value">${((results.loanAmount / (parseNumberInput(inputs.purchasePrice) || 1)) * 100).toFixed(1)}%</span>
                    </div>
                </div>
                <div>
                    <div class="info-row">
                        <span class="info-label">Combined Income:</span>
                        <span class="info-value">${formatCurrency(results.combinedMonthlyIncome)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Loan Tenure:</span>
                        <span class="info-value">${inputs.loanTenor} years</span>
                    </div>
                    ${results.averageAge > 0 ? `
                    <div class="info-row">
                        <span class="info-label">Average Age:</span>
                        <span class="info-value">${results.averageAge.toFixed(1)} years</span>
                    </div>` : ''}
                </div>
            </div>
        </div>
    </div>

    ${(inputs.propertyType === 'private' && !results.tdsrPass) || (inputs.propertyType === 'hdb' && !results.hdbPass) ? `
    <div class="section no-break">
        <h2>💡 FUNDING SOLUTIONS</h2>
        
        ${inputs.propertyType === 'private' && !results.tdsrPass ? `
        <div style="margin: 15px 0;">
            <h3 style="color: #dc2626; margin-bottom: 10px;">Private Property Options</h3>
            <div class="funding-grid">
                <div class="funding-card">
                    <strong>Show Fund Option</strong><br>
                    <span style="font-size: 16px; color: #dc2626; font-weight: bold;">${formatCurrency(results.cashShowTDSR)}</span>
                </div>
                <div class="funding-card">
                    <strong>Pledge Option</strong><br>
                    <span style="font-size: 16px; color: #dc2626; font-weight: bold;">${formatCurrency(results.cashPledgeTDSR)}</span>
                </div>
            </div>
        </div>
        ` : ''}
        
        ${inputs.propertyType === 'hdb' && !results.hdbPass ? `
        <div style="margin: 15px 0;">
            <h3 style="color: #dc2626; margin-bottom: 10px;">HDB Property Options</h3>
            <div class="funding-grid">
                <div class="funding-card">
                    <strong>Show Fund Option</strong><br>
                    <span style="font-size: 16px; color: #dc2626; font-weight: bold;">${formatCurrency(results.cashShowHDB)}</span>
                </div>
                <div class="funding-card">
                    <strong>Pledge Option</strong><br>
                    <span style="font-size: 16px; color: #dc2626; font-weight: bold;">${formatCurrency(results.cashPledgeHDB)}</span>
                </div>
            </div>
        </div>
        ` : ''}
        
        <p style="font-size: 12px; color: #666; text-align: center; margin-top: 15px;">
            <em>Choose either Show Fund OR Pledge option, not both</em>
        </p>
    </div>
    ` : ''}

    <div class="section no-break">
        <h2>📊 DETAILED PAYMENT BREAKDOWN</h2>
        
        <h3 style="color: #555; margin: 20px 0 15px 0;">Year-by-Year Payment Analysis</h3>
        
        ${results.yearlyBreakdown && results.yearlyBreakdown.map((breakdown, index) => `
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px;">
                <h4 style="margin: 0; color: #333; font-size: 16px;">Year ${breakdown.year}</h4>
                <span style="font-size: 16px; font-weight: bold; color: #3b82f6;">${breakdown.rate}% p.a.</span>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 15px;">
                <div style="text-align: center; background: #fef2f2; padding: 12px; border-radius: 6px;">
                    <div style="color: #666; font-size: 12px; margin-bottom: 5px;">Monthly Interest Payable</div>
                    <div style="font-weight: bold; color: #dc2626; font-size: 14px;">${formatCurrency(breakdown.monthlyInterest)}</div>
                </div>
                <div style="text-align: center; background: #eff6ff; padding: 12px; border-radius: 6px;">
                    <div style="color: #666; font-size: 12px; margin-bottom: 5px;">Monthly Principal Payable</div>
                    <div style="font-weight: bold; color: #2563eb; font-size: 14px;">${formatCurrency(breakdown.monthlyPrincipal)}</div>
                </div>
                <div style="text-align: center; background: #fef2f2; padding: 12px; border-radius: 6px;">
                    <div style="color: #666; font-size: 12px; margin-bottom: 5px;">Total Interest Payable</div>
                    <div style="font-weight: bold; color: #dc2626; font-size: 14px;">${formatCurrency(breakdown.totalInterest)}</div>
                </div>
                <div style="text-align: center; background: #eff6ff; padding: 12px; border-radius: 6px;">
                    <div style="color: #666; font-size: 12px; margin-bottom: 5px;">Total Principal Payable</div>
                    <div style="font-weight: bold; color: #2563eb; font-size: 14px;">${formatCurrency(breakdown.totalPrincipal)}</div>
                </div>
            </div>
            
            <div style="text-align: center; background: #f0fdf4; padding: 12px; border-radius: 6px; border-top: 1px solid #e0e0e0;">
                <div style="color: #666; font-size: 12px; margin-bottom: 5px;">Monthly Installment</div>
                <div style="font-weight: bold; color: #16a34a; font-size: 16px;">${formatCurrency(breakdown.monthlyInstallment)}</div>
            </div>
        </div>
        `).join('')}

        <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #3b82f6; margin-top: 15px; text-align: center;">
            <h4 style="margin: 0 0 8px 0; color: #3b82f6; font-size: 14px;">Total Interest (First ${inputs.interestPeriodSelection} Years)</h4>
            <div style="font-size: 18px; font-weight: bold; color: #3b82f6;">${formatCurrency(results.selectedPeriodTotal || 0)}</div>
        </div>
    </div>

    <div class="section page-break">
        <h2>👥 APPLICANT DETAILS</h2>
        
        <div class="two-column">
            <div>
                <h3 style="color: #555; font-size: 14px;">Primary Applicant</h3>
                <div class="info-row">
                    <span class="info-label">Monthly Salary:</span>
                    <span class="info-value">${formatCurrency(parseNumberInput(inputs.monthlySalaryA) || 0)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Annual Salary:</span>
                    <span class="info-value">${formatCurrency(parseNumberInput(inputs.annualSalaryA) || 0)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Age:</span>
                    <span class="info-value">${parseNumberInput(inputs.applicantAgeA) || 'N/A'} years</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total Income:</span>
                    <span class="info-value">${formatCurrency(results.totalMonthlyIncomeA)}</span>
                </div>
            </div>
            
            ${(parseNumberInput(inputs.monthlySalaryB) || 0) > 0 ? `
            <div>
                <h3 style="color: #555; font-size: 14px;">Co-Applicant</h3>
                <div class="info-row">
                    <span class="info-label">Monthly Salary:</span>
                    <span class="info-value">${formatCurrency(parseNumberInput(inputs.monthlySalaryB) || 0)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Annual Salary:</span>
                    <span class="info-value">${formatCurrency(parseNumberInput(inputs.annualSalaryB) || 0)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Age:</span>
                    <span class="info-value">${parseNumberInput(inputs.applicantAgeB) || 'N/A'} years</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total Income:</span>
                    <span class="info-value">${formatCurrency(results.totalMonthlyIncomeB)}</span>
                </div>
            </div>
            ` : '<div><p style="color: #666; font-style: italic; font-size: 12px;">Single applicant application</p></div>'}
        </div>
        
        <div style="background: #f0f9ff; padding: 12px; border-radius: 6px; margin-top: 15px; text-align: center;">
            <h4 style="margin: 0 0 8px 0; color: #0369a1; font-size: 14px;">Combined Household Income</h4>
            <div style="font-size: 20px; font-weight: bold; color: #0369a1;">${formatCurrency(results.combinedMonthlyIncome)}</div>
        </div>
        
        ${((parseNumberInput(inputs.showFundAmount) || 0) > 0 || (parseNumberInput(inputs.pledgeAmount) || 0) > 0) ? `
        <div style="margin-top: 15px;">
            <h4 style="color: #555; font-size: 14px;">Additional Funding</h4>
            ${(parseNumberInput(inputs.showFundAmount) || 0) > 0 ? `<div class="info-row"><span class="info-label">Show Fund:</span><span class="info-value">${formatCurrency(parseNumberInput(inputs.showFundAmount) || 0)}</span></div>` : ''}
            ${(parseNumberInput(inputs.pledgeAmount) || 0) > 0 ? `<div class="info-row"><span class="info-label">Pledge Amount:</span><span class="info-value">${formatCurrency(parseNumberInput(inputs.pledgeAmount) || 0)}</span></div>` : ''}
        </div>
        ` : ''}
        
        ${results.averageAge > 0 ? `
        <div style="margin-top: 15px;">
            <h4 style="color: #555; font-size: 14px;">Age & Tenor Information</h4>
            <div class="info-row">
                <span class="info-label">Average Age:</span>
                <span class="info-value">${results.averageAge.toFixed(1)} years</span>
            </div>
            <div class="info-row">
                <span class="info-label">Max Loan Tenor:</span>
                <span class="info-value">${results.maxLoanTenor} years</span>
            </div>
            <div style="background: #f0f9ff; padding: 8px; border-radius: 4px; margin-top: 8px;">
                <p style="font-size: 11px; color: #1e40af; margin: 0; line-height: 1.3;">
                    <strong>${inputs.propertyType === 'hdb' ? 'HDB' : 'Private'} Property Rules:</strong><br>
                    ${inputs.propertyType === 'hdb' 
                        ? '• 56%-75% loan: Max 25yr (age≤65)<br>• ≤55% loan: Max 30yr (age≤75)'
                        : '• 56%-75% loan: Max 30yr (age≤65)<br>• ≤55% loan: Max 35yr (age≤75)'
                    }
                </p>
            </div>
        </div>
        ` : ''}
        
        ${(results.totalCommitments > 0) ? `
        <div style="margin-top: 15px;">
            <h4 style="color: #555; font-size: 14px;">Monthly Commitments</h4>
            <div style="font-size: 16px; font-weight: bold; color: #dc2626;">${formatCurrency(results.totalCommitments)}</div>
            ${inputs.propertyType === 'hdb' ? `
                <p style="font-size: 12px; color: #666; margin-top: 5px;">
                    <strong>HDB MSR Calculation:</strong> Includes property loans only. Car loans and personal loans excluded from MSR.
                </p>
            ` : `
                <p style="font-size: 12px; color: #666; margin-top: 5px;">
                    <strong>Private Property TDSR Calculation:</strong> Includes all commitments (car loans, personal loans, and property loans).
                </p>
            `}
        </div>
        ` : ''}
    </div>

    <div class="disclaimer no-break">
        <h4 style="margin: 0 0 8px 0; color: #333; font-size: 12px;">Important Notes</h4>
        <p style="margin: 4px 0;">• This analysis is for preliminary evaluation and does not constitute loan approval.</p>
        <p style="margin: 4px 0;">• Actual terms are subject to lender assessment and market conditions.</p>
        <p style="margin: 4px 0;">• Additional fees (legal, valuation, insurance) are not included.</p>
        <p style="margin: 4px 0;">• Maximum loan tenor is based on borrower age and loan-to-value ratio as per prevailing regulations.</p>
        <p style="margin: 4px 0;">• Consult our specialists for detailed analysis tailored to your situation.</p>
        <p style="margin: 4px 0;">• Interest rates are estimates and may vary.</p>
    </div>

    <div class="footer no-break">        
        <div style="margin-bottom: 8px;">
            📧 info@keyquestmortgage.sg | 📞 +65 XXXX XXXX | 🌐 www.keyquestmortgage.sg
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 10px;">
            <p style="margin: 0; font-size: 9px;">This report is confidential and intended for the named applicant(s). 
            Your Trusted Mortgage Advisory Partner</p>
        </div>
    </div>
</body>
</html>
      `;

      // Create a new window with the HTML content
      const newWindow = window.open('', '_blank');
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      
      // Add a small delay to ensure content is loaded, then trigger print
      setTimeout(() => {
        newWindow.focus();
        newWindow.print();
      }, 500);

      alert('Clean professional report generated! Use your browser\'s print dialog to save as PDF.');

    } catch (error) {
      console.error('Error generating report:', error);
      alert('There was an error generating the report. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      {/* Header with Logo */}
      <div className="mb-8">
        <div className="flex justify-center mb-6">
          <img 
            src="https://ik.imagekit.io/hst9jooux/KeyQuest%20Logo.jpeg?updatedAt=1748073687798" 
            alt="KeyQuest Mortgage Logo" 
            className="h-32 w-auto"
          />
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Calculator className="text-blue-600" />
              Comprehensive Mortgage Calculator
            </h1>
            <p className="text-gray-600 mt-2">Calculate mortgage affordability for both HDB and Private properties</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Logged in as: <span className="font-medium">{currentUser}</span></p>
            <button
              onClick={onLogout}
              className="mt-1 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Property Type Selection */}
          <div className="bg-purple-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-purple-800">Property Type</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleInputChange('propertyType', 'private')}
                className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                  inputs.propertyType === 'private'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                }`}
              >
                <Building className="w-5 h-5" />
                <span className="font-medium">Private Property</span>
              </button>
              <button
                onClick={() => handleInputChange('propertyType', 'hdb')}
                className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                  inputs.propertyType === 'hdb'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
                }`}
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">HDB Property</span>
              </button>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">Loan Details</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Purchase Price (SGD)</label>
                <input
                  type="text"
                  value={formatNumberInput(inputs.purchasePrice)}
                  onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  placeholder="Enter purchase price"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Loan Amount Options</label>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="loanOption"
                      checked={!inputs.useCustomAmount && inputs.loanPercentage === 75}
                      onChange={() => {
                        handleInputChange('useCustomAmount', false);
                        handleInputChange('loanPercentage', 75);
                      }}
                      className="mr-2"
                    />
                    75% ({formatCurrency((parseNumberInput(inputs.purchasePrice) || 0) * 0.75)})
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="loanOption"
                      checked={!inputs.useCustomAmount && inputs.loanPercentage === 55}
                      onChange={() => {
                        handleInputChange('useCustomAmount', false);
                        handleInputChange('loanPercentage', 55);
                      }}
                      className="mr-2"
                    />
                    55% ({formatCurrency((parseNumberInput(inputs.purchasePrice) || 0) * 0.55)})
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="loanOption"
                      checked={inputs.useCustomAmount}
                      onChange={() => handleInputChange('useCustomAmount', true)}
                      className="mr-2"
                    />
                    Custom Amount
                  </label>
                </div>
                {inputs.useCustomAmount && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Custom Loan Amount (SGD)</label>
                    <input
                      type="text"
                      value={formatNumberInput(inputs.customLoanAmount)}
                      onChange={(e) => handleInputChange('customLoanAmount', e.target.value)}
                      className="w-full p-3 border rounded-lg"
                      placeholder="Enter custom loan amount"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-medium mb-3">Interest Rates</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Stress Test Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputs.stressTestRate}
                    onChange={(e) => handleInputChange('stressTestRate', Number(e.target.value))}
                    className="w-full p-3 border rounded-lg bg-red-50"
                  />
                  <p className="text-xs text-red-600 mt-1">Used for affordability calculation</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Loan Tenor (Years)</label>
                  <input
                    type="number"
                    value={inputs.loanTenor}
                    onChange={(e) => handleInputChange('loanTenor', e.target.value)}
                    max={results ? results.maxLoanTenor : "35"}
                    min="1"
                    className="w-full p-3 border rounded-lg"
                  />
                  {results && (
                    <div className="mt-1 text-xs text-gray-600">
                      <p><strong>Max tenor:</strong> {results.maxLoanTenor} years</p>
                      {results.averageAge > 0 && (
                        <p><strong>Average age:</strong> {results.averageAge.toFixed(1)} years</p>
                      )}
                      <p className="text-blue-600 font-medium">
                        {inputs.propertyType === 'hdb' ? 'HDB' : 'Private'} Property Rules:
                        {inputs.propertyType === 'hdb' 
                          ? ' 56%-75% loan: Max 25yr (age≤65), ≤55% loan: Max 30yr (age≤75)'
                          : ' 56%-75% loan: Max 30yr (age≤65), ≤55% loan: Max 35yr (age≤75)'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <h4 className="font-medium mb-3">Interest Rates by Year</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Year 1 (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputs.interestRateY1}
                    onChange={(e) => handleInputChange('interestRateY1', Number(e.target.value))}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Year 2 (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputs.interestRateY2}
                    onChange={(e) => handleInputChange('interestRateY2', Number(e.target.value))}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Year 3 (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputs.interestRateY3}
                    onChange={(e) => handleInputChange('interestRateY3', Number(e.target.value))}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Year 4 (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputs.interestRateY4}
                    onChange={(e) => handleInputChange('interestRateY4', Number(e.target.value))}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Year 5 (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputs.interestRateY5}
                    onChange={(e) => handleInputChange('interestRateY5', Number(e.target.value))}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Thereafter (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputs.interestRateThereafter}
                    onChange={(e) => handleInputChange('interestRateThereafter', Number(e.target.value))}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-green-800">Applicant Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3">Applicant A</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Monthly Salary</label>
                    <input
                      type="text"
                      value={formatNumberInput(inputs.monthlySalaryA)}
                      onChange={(e) => handleInputChange('monthlySalaryA', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Enter monthly salary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Annual Salary</label>
                    <input
                      type="text"
                      value={formatNumberInput(inputs.annualSalaryA)}
                      onChange={(e) => handleInputChange('annualSalaryA', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Enter annual salary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Age</label>
                    <input
                      type="text"
                      value={formatNumberInput(inputs.applicantAgeA)}
                      onChange={(e) => handleInputChange('applicantAgeA', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Enter age"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-3">Applicant B</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Monthly Salary</label>
                    <input
                      type="text"
                      value={formatNumberInput(inputs.monthlySalaryB)}
                      onChange={(e) => handleInputChange('monthlySalaryB', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Enter monthly salary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Annual Salary</label>
                    <input
                      type="text"
                      value={formatNumberInput(inputs.annualSalaryB)}
                      onChange={(e) => handleInputChange('annualSalaryB', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Enter annual salary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Age</label>
                    <input
                      type="text"
                      value={formatNumberInput(inputs.applicantAgeB)}
                      onChange={(e) => handleInputChange('applicantAgeB', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Enter age"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-yellow-800">Additional Funding Options</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Show Fund Amount</label>
                <input
                  type="text"
                  value={formatNumberInput(inputs.showFundAmount)}
                  onChange={(e) => handleInputChange('showFundAmount', e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  placeholder="Enter show fund amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Pledge Amount</label>
                <input
                  type="text"
                  value={formatNumberInput(inputs.pledgeAmount)}
                  onChange={(e) => handleInputChange('pledgeAmount', e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  placeholder="Enter pledge amount"
                />
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-red-800">Existing Commitments</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Car Loan (A)</label>
                <input
                  type="text"
                  value={formatNumberInput(inputs.carLoanA)}
                  onChange={(e) => handleInputChange('carLoanA', e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  placeholder="Enter car loan amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Car Loan (B)</label>
                <input
                  type="text"
                  value={formatNumberInput(inputs.carLoanB)}
                  onChange={(e) => handleInputChange('carLoanB', e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  placeholder="Enter car loan amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Personal Loan (A)</label>
                <input
                  type="text"
                  value={formatNumberInput(inputs.personalLoanA)}
                  onChange={(e) => handleInputChange('personalLoanA', e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  placeholder="Enter personal loan amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Personal Loan (B)</label>
                <input
                  type="text"
                  value={formatNumberInput(inputs.personalLoanB)}
                  onChange={(e) => handleInputChange('personalLoanB', e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  placeholder="Enter personal loan amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Property Loan (A)</label>
                <input
                  type="text"
                  value={formatNumberInput(inputs.propertyLoanA)}
                  onChange={(e) => handleInputChange('propertyLoanA', e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  placeholder="Enter property loan amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Property Loan (B)</label>
                <input
                  type="text"
                  value={formatNumberInput(inputs.propertyLoanB)}
                  onChange={(e) => handleInputChange('propertyLoanB', e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  placeholder="Enter property loan amount"
                />
              </div>
            </div>
            
            {inputs.propertyType === 'hdb' && (
              <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note for HDB (MSR Calculation):</strong> Only property loans are included in MSR calculation. 
                  Car loans and personal loans are excluded from MSR but may still affect overall affordability.
                </p>
              </div>
            )}
            
            {inputs.propertyType === 'private' && (
              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note for Private Property (TDSR Calculation):</strong> All commitments are included in TDSR calculation
                  (car loans, personal loans, AND property loans).
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Calculation Results</h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  inputs.propertyType === 'private' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {inputs.propertyType === 'private' ? 'Private Property' : 'HDB Property'}
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3">Loan Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Selected Loan Amount:</span>
                      <div className="font-semibold text-blue-600">{formatCurrency(results.loanAmount)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">75% Loan Option:</span>
                      <div className="font-medium">{formatCurrency(results.loanAmount75)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">55% Loan Option:</span>
                      <div className="font-medium">{formatCurrency(results.loanAmount55)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Loan-to-Value Ratio:</span>
                      <div className="font-medium">{((results.loanAmount / (parseNumberInput(inputs.purchasePrice) || 1)) * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Monthly Installments by Year</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-red-50 p-3 rounded">
                      <span className="text-sm text-gray-600">Stress Test ({inputs.stressTestRate}%):</span>
                      <div className="font-semibold text-red-600">{formatCurrency(results.monthlyInstallmentStressTest)}</div>
                      <p className="text-xs text-gray-500">Used for affordability</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-sm text-gray-600">Loan Tenor:</span>
                      <div className="font-semibold">{inputs.loanTenor} years</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 p-3 rounded">
                      <span className="text-sm text-gray-600">Year 1 ({inputs.interestRateY1}%):</span>
                      <div className="font-semibold text-green-600">{formatCurrency(results.monthlyInstallmentY1)}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded">
                      <span className="text-sm text-gray-600">Year 2 ({inputs.interestRateY2}%):</span>
                      <div className="font-semibold text-blue-600">{formatCurrency(results.monthlyInstallmentY2)}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <span className="text-sm text-gray-600">Year 3 ({inputs.interestRateY3}%):</span>
                      <div className="font-semibold text-purple-600">{formatCurrency(results.monthlyInstallmentY3)}</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded">
                      <span className="text-sm text-gray-600">Year 4 ({inputs.interestRateY4}%):</span>
                      <div className="font-semibold text-yellow-600">{formatCurrency(results.monthlyInstallmentY4)}</div>
                    </div>
                    <div className="bg-pink-50 p-3 rounded">
                      <span className="text-sm text-gray-600">Year 5 ({inputs.interestRateY5}%):</span>
                      <div className="font-semibold text-pink-600">{formatCurrency(results.monthlyInstallmentY5)}</div>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded">
                      <span className="text-sm text-gray-600">Thereafter ({inputs.interestRateThereafter}%):</span>
                      <div className="font-semibold text-indigo-600">{formatCurrency(results.monthlyInstallmentThereafter)}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Detailed Payment Breakdown by Year</h3>
                  {results.yearlyBreakdown && results.yearlyBreakdown.length > 0 && (
                    <div className="space-y-4">
                      {results.yearlyBreakdown.map((breakdown, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-lg">Year {breakdown.year}</h4>
                            <span className="text-sm text-gray-600">Rate: {breakdown.rate}%</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="text-center">
                              <span className="block text-gray-600">Monthly Interest</span>
                              <div className="font-semibold text-red-600">{formatCurrency(breakdown.monthlyInterest)}</div>
                            </div>
                            <div className="text-center">
                              <span className="block text-gray-600">Monthly Principal</span>
                              <div className="font-semibold text-blue-600">{formatCurrency(breakdown.monthlyPrincipal)}</div>
                            </div>
                            <div className="text-center">
                              <span className="block text-gray-600">Total Interest</span>
                              <div className="font-semibold text-red-600">{formatCurrency(breakdown.totalInterest)}</div>
                            </div>
                            <div className="text-center">
                              <span className="block text-gray-600">Total Principal</span>
                              <div className="font-semibold text-blue-600">{formatCurrency(breakdown.totalPrincipal)}</div>
                            </div>
                          </div>
                          <div className="mt-3 text-center border-t pt-3">
                            <span className="text-sm text-gray-600">Monthly Installment: </span>
                            <span className="font-semibold text-green-600">{formatCurrency(breakdown.monthlyInstallment)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-blue-800">
                        Total Interest Period:
                      </label>
                      <select
                        value={inputs.interestPeriodSelection}
                        onChange={(e) => handleInputChange('interestPeriodSelection', Number(e.target.value))}
                        className="ml-3 p-2 border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={2}>First 2 Years</option>
                        <option value={3}>First 3 Years</option>
                        <option value={5}>First 5 Years</option>
                      </select>
                    </div>
                    <div className="text-center">
                      <span className="text-sm text-blue-600">
                        Total Interest ({inputs.interestPeriodSelection === 2 ? 'First 2 Years' : 
                                       inputs.interestPeriodSelection === 3 ? 'First 3 Years' : 'First 5 Years'}):
                      </span>
                      <div className="font-bold text-xl text-blue-800">
                        {formatCurrency(results.selectedPeriodTotal || 0)}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Income Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Combined Monthly Income:</span>
                      <div className="font-semibold">{formatCurrency(results.combinedMonthlyIncome)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">
                        Total Commitments {inputs.propertyType === 'hdb' ? '(Property Only)' : '(All Loans)'}:
                      </span>
                      <div className="font-semibold">{formatCurrency(results.totalCommitments)}</div>
                      <div className="text-xs text-gray-500">
                        {inputs.propertyType === 'hdb' 
                          ? 'Includes: Property loans only' 
                          : 'Includes: Car, personal & property loans'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Property-specific Results */}
            {inputs.propertyType === 'private' && (
              <div className={`p-6 rounded-lg border-2 ${results.tdsrPass ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  {results.tdsrPass ? <CheckCircle className="text-green-600" /> : <XCircle className="text-red-600" />}
                  Private Property (TDSR 55%)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Required Income:</span>
                    <div className="font-semibold">{formatCurrency(results.requiredIncomeTDSR)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Deficit/Surplus:</span>
                    <div className={`font-semibold ${results.tdsrDeficit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(results.tdsrDeficit)}
                    </div>
                  </div>
                </div>
                {!results.tdsrPass && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium mb-2">Cash Requirements (Choose One):</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <span className="text-sm text-gray-600">Cash to Show:</span>
                        <div className="font-semibold text-red-600">{formatCurrency(results.cashShowTDSR)}</div>
                      </div>
                      <div className="text-center">
                        <span className="text-sm text-gray-600">Cash to Pledge:</span>
                        <div className="font-semibold text-red-600">{formatCurrency(results.cashPledgeTDSR)}</div>
                      </div>
                    </div>
                    <div className="text-center mt-2">
                      <span className="text-sm font-medium text-gray-700 bg-yellow-100 px-3 py-1 rounded-full">OR</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {inputs.propertyType === 'hdb' && (
              <div className={`p-6 rounded-lg border-2 ${results.hdbPass ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  {results.hdbPass ? <CheckCircle className="text-green-600" /> : <XCircle className="text-red-600" />}
                  HDB Property (MSR 30%)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Required Income:</span>
                    <div className="font-semibold">{formatCurrency(results.requiredIncomeHDB)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Deficit/Surplus:</span>
                    <div className={`font-semibold ${results.hdbDeficit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(results.hdbDeficit)}
                    </div>
                  </div>
                </div>
                {!results.hdbPass && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium mb-2">Cash Requirements (Choose One):</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <span className="text-sm text-gray-600">Cash to Show:</span>
                        <div className="font-semibold text-red-600">{formatCurrency(results.cashShowHDB)}</div>
                      </div>
                      <div className="text-center">
                        <span className="text-sm text-gray-600">Cash to Pledge:</span>
                        <div className="font-semibold text-red-600">{formatCurrency(results.cashPledgeHDB)}</div>
                      </div>
                    </div>
                    <div className="text-center mt-2">
                      <span className="text-sm font-medium text-gray-700 bg-yellow-100 px-3 py-1 rounded-full">OR</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Generate Report Button */}
            <button
              onClick={generatePDFReport}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Generate Clean Professional Report (PDF)
            </button>
            <p className="text-sm text-gray-500 text-center">
              Clean, client-ready report for {inputs.propertyType === 'private' ? 'Private Property' : 'HDB Property'} analysis
            </p>

            {/* Formula Information */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Info className="text-blue-600" />
                Key Formulas Used
              </h3>
              <div className="text-sm space-y-2 text-gray-700">
                <p><strong>Maximum Loan Tenor Rules:</strong></p>
                <p className="ml-4"><strong>HDB Property:</strong></p>
                <p className="ml-6">• 56%-75% loan: Max 25 years, borrower age capped at 65 years</p>
                <p className="ml-6">• ≤55% loan: Max 30 years, borrower age capped at 75 years</p>
                <p className="ml-4"><strong>Private Property:</strong></p>
                <p className="ml-6">• 56%-75% loan: Max 30 years, borrower age capped at 65 years</p>
                <p className="ml-6">• ≤55% loan: Max 35 years, borrower age capped at 75 years</p>
                <p className="ml-4">• <strong>Calculation:</strong> Min(Max_Tenor_Years, Age_Cap - Average_Age)</p>
                <p className="ml-4">• <strong>Example:</strong> HDB 75% loan, average age 55 → Min(25, 65-55) = 10 years</p>
                
                <p><strong>Commitment Inclusions by Property Type:</strong></p>
                <p className="ml-4"><strong>Private Property (TDSR):</strong> Car loans + Personal loans + Property loans</p>
                <p className="ml-4"><strong>HDB Property (MSR):</strong> Property loans only (car & personal loans excluded)</p>
                
                <p><strong>Loan Amount Options:</strong></p>
                <p className="ml-4">• 75% Option = Purchase Price × 0.75</p>
                <p className="ml-4">• 55% Option = Purchase Price × 0.55</p>
                <p className="ml-4">• Custom Amount = User input</p>
                
                <p><strong>Monthly Installments:</strong></p>
                <p className="ml-4">• Stress Test: PMT(Stress Test Rate/12, Loan Tenor×12, Loan Amount)</p>
                <p className="ml-4">• Year 1: PMT(Year 1 Rate/12, Loan Tenor×12, Loan Amount)</p>
                <p className="ml-4">• Year 2: PMT(Year 2 Rate/12, Loan Tenor×12, Loan Amount)</p>
                <p className="ml-4">• Year 3: PMT(Year 3 Rate/12, Loan Tenor×12, Loan Amount)</p>
                <p className="ml-4">• Year 4: PMT(Year 4 Rate/12, Loan Tenor×12, Loan Amount)</p>
                <p className="ml-4">• Year 5: PMT(Year 5 Rate/12, Loan Tenor×12, Loan Amount)</p>
                <p className="ml-4">• Thereafter: PMT(Thereafter Rate/12, Loan Tenor×12, Loan Amount)</p>
                <p className="ml-4">• <em>Note: Stress test installment used for affordability assessment</em></p>
                
                <p><strong>Yearly Interest Calculations:</strong></p>
                <p className="ml-4">• Uses declining balance method with respective yearly rates</p>
                <p className="ml-4">• Interest Payment = Outstanding Balance × (Annual Rate ÷ 12)</p>
                <p className="ml-4">• Principal Payment = Monthly Installment - Interest Payment</p>
                <p className="ml-4">• New Balance = Previous Balance - Principal Payment</p>
                <p className="ml-4">• Total Interest Period: Selectable for 2, 3, or 5 years</p>
                
                <p><strong>Income Calculations:</strong></p>
                <p className="ml-4">• Bonus Income = (Annual Salary - Monthly Salary×12) ÷ 12 × 0.7</p>
                <p className="ml-4">• Show Fund Income = Show Fund Amount × 0.00625 (0.625% monthly yield)</p>
                <p className="ml-4">• Pledge Income = Pledge Amount ÷ 48 (48-month distribution)</p>
                <p className="ml-4">• Combined Income = Sum of all income sources from both applicants</p>
                
                <p><strong>Affordability Ratios:</strong></p>
                <p className="ml-4">• <strong>TDSR 55% (Private):</strong> Combined Monthly Income × 0.55 - All Commitments</p>
                <p className="ml-4">• <strong>MSR 30% (HDB):</strong> Combined Monthly Income × 0.3 - Property Loans Only</p>
                <p className="ml-4">• Required Income TDSR = (Stress Test Installment + All Commitments) ÷ 0.55</p>
                <p className="ml-4">• Required Income HDB = (Stress Test Installment + Property Loans Only) ÷ 0.3</p>
                
                <p><strong>Cash Requirements (when deficit exists):</strong></p>
                <p className="ml-4">• Cash to Show = |Deficit| ÷ 0.00625</p>
                <p className="ml-4">• Cash to Pledge = |Deficit| × 48</p>
                
                <p><strong>Constants:</strong></p>
                <p className="ml-4">• 0.00625 = 0.75% ÷ 12 (monthly yield assumption for show funds)</p>
                <p className="ml-4">• 48 = Multiplier for pledging calculation (4 years)</p>
                <p className="ml-4">• 0.7 = 70% recognition factor for bonus income</p>
                <p className="ml-4">• 0.55 = TDSR limit for private property</p>
                <p className="ml-4">• 0.3 = MSR limit for HDB property</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (username) => {
    setCurrentUser(username);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <MortgageCalculator currentUser={currentUser} onLogout={handleLogout} />;
};

export default App;
