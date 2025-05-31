import React, { useState, useCallback } from 'react';
import './App.css';
import { Calculator, Download, FileText, CheckCircle, XCircle, Info, Lock, LogOut, Home, Building, TrendingUp, DollarSign, BarChart3, Sparkles, Shield, Users, Award } from 'lucide-react';
import ProgressivePaymentCalculator from './ProgressivePaymentCalculator';
import MonthlyRepaymentCalculator from './MonthlyRepaymentCalculator';

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
    await new Promise(resolve => setTimeout(resolve, 800));

    if (EMPLOYEE_CREDENTIALS[username] === password) {
      onLogin(username);
    } else {
      setError('Invalid credentials. Please check your username and password.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 transform hover:scale-105 transition-all duration-300">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Employee Portal
            </h1>
            <p className="text-gray-600 mt-2 font-medium">KeyQuest Mortgage Calculator Suite</p>
            <div className="flex items-center justify-center gap-2 mt-3">
            
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 placeholder-gray-400"
                  placeholder="Enter your username"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
                <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 placeholder-gray-400"
                  placeholder="Enter your password"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span>Access Portal</span>
                </div>
              )}
            </button>
          </div>

        
          
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/70 text-sm">
            © 2025 KeyQuest Mortgage
          </p>
        </div>
      </div>
    </div>
  );
};

// Main TDSR/MSR Calculator Component
const TDSRMSRCalculator = ({ currentUser, onLogout }) => {
  // Reset all values with defaults when component mounts (fresh login)
  const [inputs, setInputs] = useState({
    // Property Type Selection
    propertyType: 'private', // 'private' or 'hdb'
    
    purchasePrice: '',
    loanPercentage: 75, // 55, 75, or custom
    customLoanAmount: '',
    useCustomAmount: false,
    
    // Stress test rate (separate field for calculations)
    stressTestRate: 4,
    
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

  // Main calculation function
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

    // Parse all numeric inputs
    const parsedInputs = {
      purchasePrice: parseNumberInput(purchasePrice) || 0,
      customLoanAmount: parseNumberInput(customLoanAmount) || 0,
      stressTestRate: parseNumberInput(stressTestRate) || 0,
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
    
    // Calculate monthly installment using stress test rate
    const monthlyInstallmentStressTest = calculatePMT(parsedInputs.stressTestRate, parsedInputs.loanTenor * 12, loanAmount);
    
    // Use stress test installment for affordability calculation
    const monthlyInstallment = monthlyInstallmentStressTest;
    
    // Calculate bonus income (70% of excess annual salary over base)
    
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
    let totalCommitmentsTDSR; // For TDSR calculation (always includes all commitments)
    
    if (propertyType === 'hdb') {
      // For HDB MSR: Include property loans only
      totalCommitments = parsedInputs.propertyLoanA + parsedInputs.propertyLoanB;
      // For HDB TDSR: Include ALL commitments (car, personal, property loans)
      totalCommitmentsTDSR = parsedInputs.carLoanA + parsedInputs.carLoanB + parsedInputs.personalLoanA + parsedInputs.personalLoanB + parsedInputs.propertyLoanA + parsedInputs.propertyLoanB;
    } else {
      // For Private: Include ALL commitments in TDSR calculation
      totalCommitments = parsedInputs.carLoanA + parsedInputs.carLoanB + parsedInputs.personalLoanA + parsedInputs.personalLoanB + parsedInputs.propertyLoanA + parsedInputs.propertyLoanB;
      totalCommitmentsTDSR = totalCommitments;
    }
    
    // TDSR and MSR calculations
    const tdsr55Available = (combinedMonthlyIncome * 0.55) - totalCommitmentsTDSR;
    const msr30Available = combinedMonthlyIncome * 0.3;
    
    // Required income calculations
    const requiredIncomeTDSR = (monthlyInstallment + totalCommitmentsTDSR) / 0.55;
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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
    } else if (field === 'stressTestRate') {
      // Handle stress test rate to allow empty values
      const parsedValue = value === '' ? '' : Number(value);
      setInputs(prev => ({
        ...prev,
        [field]: parsedValue
      }));
    } else if (field === 'loanTenor') {
      const parsedValue = parseNumberInput(value);
      const maxTenor = calculateMaxLoanTenor();
      // Handle empty values - don't set a default, just validate if there's a value
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
    <title>TDSR/MSR Analysis Report - ${propertyTypeText}</title>
    <style>
        @page {
            size: A4;
            margin: 0.5in 0.75in;
        }
        
        @media print {
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
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.4;
            color: #333;
            max-width: 100%;
            margin: 0;
            padding: 10px;
            background: white;
            font-size: 12px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #1d4ed8;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 6px;
        }
        
       .logo-section img {
    max-width: 100px !important;
    width: 100px !important;
    height: auto !important;
    display: block;
}
        
        .report-info {
            margin-top: 6px;
            font-size: 10px;
            color: #666;
        }
        
        .property-type-banner {
            background: ${inputs.propertyType === 'private' ? '#1d4ed8' : '#059669'};
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            margin: 8px 0;
        }
        
        .section {
            margin: 15px 0;
            padding: 12px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            background: #fafafa;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        
        .section h2 {
            color: #1d4ed8;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 6px;
            margin-bottom: 10px;
            font-size: 14px;
            margin-top: 0;
        }
        
        .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 1px dotted #ccc;
            font-size: 11px;
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
            border-radius: 4px;
            padding: 10px;
            margin: 10px 0;
        }
        
        .affordability-result {
            background: ${results.tdsrPass || results.hdbPass ? '#f0fdf4' : '#fef2f2'};
            border: 2px solid ${results.tdsrPass || results.hdbPass ? '#22c55e' : '#ef4444'};
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            text-align: center;
        }
        
        .affordability-title {
            font-size: 16px;
            font-weight: bold;
            color: ${results.tdsrPass || results.hdbPass ? '#16a34a' : '#dc2626'};
            margin-bottom: 10px;
        }
        
        .funding-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin: 10px 0;
        }
        
        .funding-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            padding: 10px;
            text-align: center;
            font-size: 11px;
        }
        
        .footer {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 9px;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        
        .disclaimer {
            background: #f3f4f6;
            padding: 10px;
            border-radius: 4px;
            margin: 15px 0;
            font-size: 9px;
            color: #555;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        
        @media print {
            .two-column, .funding-grid { 
                grid-template-columns: 1fr 1fr !important; 
            }
        }
        
        @media (max-width: 600px) {
            .two-column, .funding-grid { 
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
            ${propertyTypeText} TDSR/MSR Analysis
        </div>
        
        <div class="report-info">
            <strong>Mortgage Affordability Assessment Report</strong><br>
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
                    <div class="info-row">
                        <span class="info-label">Stress Test Rate:</span>
                        <span class="info-value">${inputs.stressTestRate}%</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Monthly Installment (Stress):</span>
                        <span class="info-value">${formatCurrency(results.monthlyInstallmentStressTest)}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="affordability-result">
        <div class="affordability-title">
            ${inputs.propertyType === 'private' 
                ? `TDSR Assessment: ${results.tdsrPass ? 'PASS ✓' : 'FAIL ✗'}`
                : `Overall HDB Assessment: ${(results.hdbPass && results.tdsrPass) ? 'PASS ✓' : 'FAIL ✗'}`
            }
        </div>
        <div style="font-size: 14px;">
            ${inputs.propertyType === 'private'
                ? `Required Income: ${formatCurrency(results.requiredIncomeTDSR)} | Deficit/Surplus: ${formatCurrency(results.tdsrDeficit)}`
                : `Must pass BOTH MSR (30%) AND TDSR (55%) tests`
            }
        </div>
    </div>

    ${inputs.propertyType === 'hdb' ? `
    <div class="section no-break">
        <h2>📊 HDB DUAL ASSESSMENT (MSR & TDSR)</h2>
        <div class="two-column">
            <div style="background: ${results.hdbPass ? '#f0fdf4' : '#fef2f2'}; border: 2px solid ${results.hdbPass ? '#22c55e' : '#ef4444'}; border-radius: 6px; padding: 12px;">
                <h3 style="color: ${results.hdbPass ? '#16a34a' : '#dc2626'}; font-size: 14px; margin: 0 0 10px 0;">MSR 30% Test</h3>
                <div class="info-row" style="border: none;">
                    <span class="info-label">Required Income:</span>
                    <span class="info-value">${formatCurrency(results.requiredIncomeHDB)}</span>
                </div>
                <div class="info-row" style="border: none;">
                    <span class="info-label">Deficit/Surplus:</span>
                    <span class="info-value" style="color: ${results.hdbDeficit >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrency(results.hdbDeficit)}</span>
                </div>
                <div style="text-align: center; margin-top: 10px; font-weight: bold; color: ${results.hdbPass ? '#16a34a' : '#dc2626'};">
                    ${results.hdbPass ? 'PASS ✓' : 'FAIL ✗'}
                </div>
            </div>
            
            <div style="background: ${results.tdsrPass ? '#f0fdf4' : '#fef2f2'}; border: 2px solid ${results.tdsrPass ? '#22c55e' : '#ef4444'}; border-radius: 6px; padding: 12px;">
                <h3 style="color: ${results.tdsrPass ? '#16a34a' : '#dc2626'}; font-size: 14px; margin: 0 0 10px 0;">TDSR 55% Test</h3>
                <div class="info-row" style="border: none;">
                    <span class="info-label">Required Income:</span>
                    <span class="info-value">${formatCurrency(results.requiredIncomeTDSR)}</span>
                </div>
                <div class="info-row" style="border: none;">
                    <span class="info-label">Deficit/Surplus:</span>
                    <span class="info-value" style="color: ${results.tdsrDeficit >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrency(results.tdsrDeficit)}</span>
                </div>
                <div style="text-align: center; margin-top: 10px; font-weight: bold; color: ${results.tdsrPass ? '#16a34a' : '#dc2626'};">
                    ${results.tdsrPass ? 'PASS ✓' : 'FAIL ✗'}
                </div>
            </div>
        </div>
        
        <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 6px; padding: 12px; margin-top: 15px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #1d4ed8;">
                <strong>Note:</strong> For HDB loans, banks assess both MSR (30%) for property-related debt and TDSR (55%) for total debt servicing.
                Both tests must be passed for loan approval.
            </p>
        </div>
    </div>
    ` : ''}

    ${(inputs.propertyType === 'private' && !results.tdsrPass) || (inputs.propertyType === 'hdb' && (!results.hdbPass || !results.tdsrPass)) ? `
    
    <div class="section no-break">
        <h2>💡 FUNDING SOLUTIONS</h2>
        <p style="text-align: center; margin-bottom: 15px;">To meet the ${inputs.propertyType === 'private' ? 'TDSR' : 'MSR and TDSR'} requirements, you need one of the following:</p>
        
        ${inputs.propertyType === 'hdb' ? `
        <div style="margin-bottom: 15px;">
            <h4 style="color: #555; font-size: 12px; margin-bottom: 8px;">For MSR (30%) Shortfall:</h4>
            <div class="funding-grid">
                <div class="funding-card">
                    <strong>Show Fund Option</strong><br>
                    <span style="font-size: 16px; color: #dc2626; font-weight: bold;">
                        ${formatCurrency(results.cashShowHDB)}
                    </span>
                </div>
                <div class="funding-card">
                    <strong>Pledge Option</strong><br>
                    <span style="font-size: 16px; color: #dc2626; font-weight: bold;">
                        ${formatCurrency(results.cashPledgeHDB)}
                    </span>
                </div>
            </div>
        </div>
        
        <div style="margin-bottom: 15px;">
            <h4 style="color: #555; font-size: 12px; margin-bottom: 8px;">For TDSR (55%) Shortfall:</h4>
            <div class="funding-grid">
                <div class="funding-card">
                    <strong>Show Fund Option</strong><br>
                    <span style="font-size: 16px; color: #dc2626; font-weight: bold;">
                        ${formatCurrency(results.cashShowTDSR)}
                    </span>
                </div>
                <div class="funding-card">
                    <strong>Pledge Option</strong><br>
                    <span style="font-size: 16px; color: #dc2626; font-weight: bold;">
                        ${formatCurrency(results.cashPledgeTDSR)}
                    </span>
                </div>
            </div>
        </div>
        ` : `
        <div class="funding-grid">
            <div class="funding-card">
                <strong>Show Fund Option</strong><br>
                <span style="font-size: 16px; color: #dc2626; font-weight: bold;">
                    ${formatCurrency(results.cashShowTDSR)}
                </span>
            </div>
            <div class="funding-card">
                <strong>Pledge Option</strong><br>
                <span style="font-size: 16px; color: #dc2626; font-weight: bold;">
                    ${formatCurrency(results.cashPledgeTDSR)}
                </span>
            </div>
        </div>
        `}
        
        <p style="font-size: 12px; color: #666; text-align: center; margin-top: 15px;">
            <em>Choose either Show Fund OR Pledge option, not both</em>
        </p>
    </div>
    ` : ''}

    <div class="section">
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
        </div>
        ` : ''}
        
        ${(parseNumberInput(inputs.showFundAmount) || 0) > 0 || (parseNumberInput(inputs.pledgeAmount) || 0) > 0 ? `
        <div style="margin-top: 15px;">
            <h4 style="color: #555; font-size: 14px;">Additional Funding Options</h4>
            ${(parseNumberInput(inputs.showFundAmount) || 0) > 0 ? `
            <div class="info-row">
                <span class="info-label">Show Fund Amount:</span>
                <span class="info-value">${formatCurrency(parseNumberInput(inputs.showFundAmount))}</span>
            </div>
            ` : ''}
            ${(parseNumberInput(inputs.pledgeAmount) || 0) > 0 ? `
            <div class="info-row">
                <span class="info-label">Pledge Amount:</span>
                <span class="info-value">${formatCurrency(parseNumberInput(inputs.pledgeAmount))}</span>
            </div>
            ` : ''}
        </div>
        ` : ''}
        
        ${(results.totalCommitments > 0 || (inputs.propertyType === 'hdb' && results.totalCommitmentsTDSR > 0)) ? `
        <div style="margin-top: 15px;">
            <h4 style="color: #555; font-size: 14px;">Monthly Commitments</h4>
            ${inputs.propertyType === 'hdb' ? `
                <div style="font-size: 16px; font-weight: bold; color: #dc2626;">
                    MSR Commitments: ${formatCurrency(results.totalCommitments)}
                </div>
                <p style="font-size: 11px; color: #666; margin-top: 5px;">
                    <strong>HDB MSR Calculation:</strong> Includes property loans only (${formatCurrency(parseNumberInput(inputs.propertyLoanA) + parseNumberInput(inputs.propertyLoanB))}). 
                    Car loans and personal loans are excluded from MSR.
                </p>
                ${results.totalCommitmentsTDSR > 0 ? `
                <div style="font-size: 16px; font-weight: bold; color: #dc2626; margin-top: 10px;">
                    TDSR Commitments: ${formatCurrency(results.totalCommitmentsTDSR)}
                </div>
                <p style="font-size: 11px; color: #666; margin-top: 5px;">
                    <strong>HDB TDSR Calculation:</strong> Includes all commitments:
                    <br>• Car loans: ${formatCurrency(parseNumberInput(inputs.carLoanA) + parseNumberInput(inputs.carLoanB))}
                    <br>• Personal loans: ${formatCurrency(parseNumberInput(inputs.personalLoanA) + parseNumberInput(inputs.personalLoanB))}
                    <br>• Property loans: ${formatCurrency(parseNumberInput(inputs.propertyLoanA) + parseNumberInput(inputs.propertyLoanB))}
                </p>
                ` : ''}
            ` : `
                <div style="font-size: 16px; font-weight: bold; color: #dc2626;">${formatCurrency(results.totalCommitments)}</div>
                <p style="font-size: 11px; color: #666; margin-top: 5px;">
                    <strong>Private Property TDSR Calculation:</strong> Includes all commitments:
                    <br>• Car loans: ${formatCurrency(parseNumberInput(inputs.carLoanA) + parseNumberInput(inputs.carLoanB))}
                    <br>• Personal loans: ${formatCurrency(parseNumberInput(inputs.personalLoanA) + parseNumberInput(inputs.personalLoanB))}
                    <br>• Property loans: ${formatCurrency(parseNumberInput(inputs.propertyLoanA) + parseNumberInput(inputs.propertyLoanB))}
                </p>
            `}
        </div>
        ` : ''}
    </div>

    <div class="disclaimer no-break">
        <h4 style="margin: 0 0 8px 0; color: #333; font-size: 12px;">Important Notes</h4>
        <p style="margin: 4px 0;">• This analysis is for preliminary evaluation and does not constitute loan approval.</p>
        <p style="margin: 4px 0;">• Actual terms are subject to lender assessment and market conditions.</p>
        <p style="margin: 4px 0;">• Maximum loan tenor is based on borrower age and loan-to-value ratio as per prevailing regulations.</p>
        <p style="margin: 4px 0;">• ${inputs.propertyType === 'private' ? 'TDSR limit: 55%' : 'MSR limit: 30% and TDSR limit: 55%'} of gross monthly income.</p>
        <p style="margin: 4px 0;">• Stress test rate of ${inputs.stressTestRate}% is used for affordability assessment.</p>
        <p style="margin: 4px 0;">• Consult our specialists for detailed analysis tailored to your situation.</p>
    </div>

    <div class="footer no-break">        
        <div style="margin-bottom: 8px;">
            📧 kenneth@keyquestmortgage.com.sg | 📞 +65 9795 2338 
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

      // Show detailed instructions for optimal PDF printing
      alert(`Professional report generated successfully! 

📄 FOR BEST PDF RESULTS:
• Use Chrome or Edge browser for printing
• In print dialog, select "More settings"
• Set margins to "Minimum" or "Custom" (0.5 inch)
• Choose "A4" paper size
• Enable "Background graphics"
• Set scale to "100%" or "Fit to page width"
• Select "Portrait" orientation

This ensures all content fits properly without being cut off.`);

    } catch (error) {
      console.error('Error generating report:', error);
      alert('There was an error generating the report. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enhanced Input Section */}
        <div className="space-y-6">
          {/* Property Type Selection */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-purple-800">Property Type Selection</h2>
                <p className="text-sm text-purple-600">Choose your property category</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleInputChange('propertyType', 'private')}
                className={`p-6 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-3 ${
                  inputs.propertyType === 'private'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg transform scale-105'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:shadow-md hover:scale-102'
                }`}
              >
                <Building className="w-8 h-8" />
                <div className="text-center">
                  <div className="font-semibold">Private Property</div>
                  <div className="text-xs opacity-75">TDSR Assessment</div>
                </div>
              </button>
              <button
                onClick={() => handleInputChange('propertyType', 'hdb')}
                className={`p-6 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-3 ${
                  inputs.propertyType === 'hdb'
                    ? 'border-green-500 bg-green-50 text-green-700 shadow-lg transform scale-105'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-green-300 hover:shadow-md hover:scale-102'
                }`}
              >
                <Home className="w-8 h-8" />
                <div className="text-center">
                  <div className="font-semibold">HDB Property</div>
                  <div className="text-xs opacity-75">MSR + TDSR Assessment</div>
                </div>
              </button>
            </div>
          </div>

          {/* Enhanced Loan Details */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-blue-800">Loan Configuration</h2>
                <p className="text-sm text-blue-600">Set your loan parameters</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Purchase Price (SGD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                  <input
                    type="text"
                    value={formatNumberInput(inputs.purchasePrice)}
                    onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                    className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                    placeholder="1,000,000.00"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-semibold mb-3 text-gray-700">Loan Amount Options</label>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <label className="group">
                    <input
                      type="radio"
                      name="loanOption"
                      checked={!inputs.useCustomAmount && inputs.loanPercentage === 75}
                      onChange={() => {
                        handleInputChange('useCustomAmount', false);
                        handleInputChange('loanPercentage', 75);
                      }}
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 text-center ${
                      !inputs.useCustomAmount && inputs.loanPercentage === 75
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    }`}>
                      <div className="font-semibold text-lg">75%</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {formatCurrency((parseNumberInput(inputs.purchasePrice) || 0) * 0.75)}
                      </div>
                    </div>
                  </label>
                  
                  <label className="group">
                    <input
                      type="radio"
                      name="loanOption"
                      checked={!inputs.useCustomAmount && inputs.loanPercentage === 55}
                      onChange={() => {
                        handleInputChange('useCustomAmount', false);
                        handleInputChange('loanPercentage', 55);
                      }}
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 text-center ${
                      !inputs.useCustomAmount && inputs.loanPercentage === 55
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    }`}>
                      <div className="font-semibold text-lg">55%</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {formatCurrency((parseNumberInput(inputs.purchasePrice) || 0) * 0.55)}
                      </div>
                    </div>
                  </label>
                  
                  <label className="group">
                    <input
                      type="radio"
                      name="loanOption"
                      checked={inputs.useCustomAmount}
                      onChange={() => handleInputChange('useCustomAmount', true)}
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 text-center ${
                      inputs.useCustomAmount
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    }`}>
                      <div className="font-semibold text-lg">Custom</div>
                      <div className="text-xs text-gray-600 mt-1">Amount</div>
                    </div>
                  </label>
                </div>
                
                {inputs.useCustomAmount && (
                  <div className="mt-4 animate-fadeIn">
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Custom Loan Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                      <input
                        type="text"
                        value={formatNumberInput(inputs.customLoanAmount)}
                        onChange={(e) => handleInputChange('customLoanAmount', e.target.value)}
                        className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                        placeholder="750,000.00"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Loan Parameters</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Stress Test Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={inputs.stressTestRate}
                      onChange={(e) => handleInputChange('stressTestRate', Number(e.target.value))}
                      className="w-full pr-8 pl-3 py-3 border border-gray-300 rounded-xl bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                      placeholder="4.00"
                      style={{
                        MozAppearance: 'textfield',
                        WebkitAppearance: 'none',
                        appearance: 'none'
                      }}
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
                      onChange={(e) => handleInputChange('loanTenor', Number(e.target.value))}
                      max={results ? results.maxLoanTenor : "35"}
                      min="0"
                      className="w-full pr-12 pl-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="30"
                      style={{
                        MozAppearance: 'textfield',
                        WebkitAppearance: 'none',
                        appearance: 'none'
                      }}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">years</span>
                  </div>
                  {results && (
                    <div className="mt-2 text-xs text-gray-600 space-y-1">
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
            </div>
          </div>

          {/* Enhanced Applicant Information */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-green-800">Applicant Details</h2>
                <p className="text-sm text-green-600">Income and demographic information</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 text-lg border-b border-green-200 pb-2">Primary Applicant</h3>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Monthly Salary (SGD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                    <input
                      type="text"
                      value={formatNumberInput(inputs.monthlySalaryA)}
                      onChange={(e) => handleInputChange('monthlySalaryA', e.target.value)}
                      className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="8,000.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Annual Salary (SGD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                    <input
                      type="text"
                      value={formatNumberInput(inputs.annualSalaryA)}
                      onChange={(e) => handleInputChange('annualSalaryA', e.target.value)}
                      className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="120,000.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Age (Years)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumberInput(inputs.applicantAgeA)}
                      onChange={(e) => handleInputChange('applicantAgeA', e.target.value)}
                      className="w-full pr-12 pl-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
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
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                    <input
                      type="text"
                      value={formatNumberInput(inputs.monthlySalaryB)}
                      onChange={(e) => handleInputChange('monthlySalaryB', e.target.value)}
                      className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="6,000.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Annual Salary (SGD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                    <input
                      type="text"
                      value={formatNumberInput(inputs.annualSalaryB)}
                      onChange={(e) => handleInputChange('annualSalaryB', e.target.value)}
                      className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="90,000.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Age (Years)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumberInput(inputs.applicantAgeB)}
                      onChange={(e) => handleInputChange('applicantAgeB', e.target.value)}
                      className="w-full pr-12 pl-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="32"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">years</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Additional Funding */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-yellow-800">Additional Funding Solutions</h2>
                <p className="text-sm text-yellow-600">Show fund and pledge amount options</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Show Fund (SGD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                  <input
                    type="text"
                    value={formatNumberInput(inputs.showFundAmount)}
                    onChange={(e) => handleInputChange('showFundAmount', e.target.value)}
                    className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 bg-white shadow-sm"
                    placeholder="500,000.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Pledging (SGD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                  <input
                    type="text"
                    value={formatNumberInput(inputs.pledgeAmount)}
                    onChange={(e) => handleInputChange('pledgeAmount', e.target.value)}
                    className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 bg-white shadow-sm"
                    placeholder="300,000.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Existing Commitments */}
          <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-xl border border-red-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-red-800">Existing Monthly Commitments</h2>
                <p className="text-sm text-red-600">Current loan obligations</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Monthly Car Loan (A) (SGD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                  <input
                    type="text"
                    value={formatNumberInput(inputs.carLoanA)}
                    onChange={(e) => handleInputChange('carLoanA', e.target.value)}
                    className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white shadow-sm"
                    placeholder="800.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Monthly Car Loan (B) (SGD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                  <input
                    type="text"
                    value={formatNumberInput(inputs.carLoanB)}
                    onChange={(e) => handleInputChange('carLoanB', e.target.value)}
                    className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white shadow-sm"
                    placeholder="600.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Monthly Personal Loan (A) (SGD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                  <input
                    type="text"
                    value={formatNumberInput(inputs.personalLoanA)}
                    onChange={(e) => handleInputChange('personalLoanA', e.target.value)}
                    className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white shadow-sm"
                    placeholder="500.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Monthly Personal Loan (B) (SGD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                  <input
                    type="text"
                    value={formatNumberInput(inputs.personalLoanB)}
                    onChange={(e) => handleInputChange('personalLoanB', e.target.value)}
                    className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white shadow-sm"
                    placeholder="300.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Monthly Property Loan (A) (SGD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                  <input
                    type="text"
                    value={formatNumberInput(inputs.propertyLoanA)}
                    onChange={(e) => handleInputChange('propertyLoanA', e.target.value)}
                    className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white shadow-sm"
                    placeholder="2,000.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Monthly Property Loan (B) (SGD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                  <input
                    type="text"
                    value={formatNumberInput(inputs.propertyLoanB)}
                    onChange={(e) => handleInputChange('propertyLoanB', e.target.value)}
                    className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white shadow-sm"
                    placeholder="1,500.00"
                  />
                </div>
              </div>
            </div>
            
            {inputs.propertyType === 'hdb' && (
              <div className="mt-4 p-4 bg-yellow-100 rounded-xl border border-yellow-300">
                <p className="text-sm text-yellow-800 font-medium">
                  <strong>Note for HDB (MSR Calculation):</strong> Only property loans are included in MSR calculation. 
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
        </div>

        {/* Enhanced Results Section */}
        {results && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-50 to-slate-100 p-6 rounded-xl border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Assessment Results</h2>
                <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  inputs.propertyType === 'private' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {inputs.propertyType === 'private' ? 'Private Property' : 'HDB Property'}
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4 text-gray-800">Loan Configuration</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <span className="text-sm text-gray-600">Selected Loan Amount:</span>
                      <div className="font-bold text-xl text-blue-600">{formatCurrency(results.loanAmount)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <span className="text-sm text-gray-600">75% Loan Option:</span>
                      <div className="font-semibold text-gray-700">{formatCurrency(results.loanAmount75)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <span className="text-sm text-gray-600">55% Loan Option:</span>
                      <div className="font-semibold text-gray-700">{formatCurrency(results.loanAmount55)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <span className="text-sm text-gray-600">Loan-to-Value Ratio:</span>
                      <div className="font-semibold text-gray-700">{((results.loanAmount / (parseNumberInput(inputs.purchasePrice) || 1)) * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4 text-gray-800">Affordability Assessment</h3>
                  <div className="bg-red-50 p-4 rounded-xl mb-4 border border-red-200">
                    <div className="text-sm text-gray-600 mb-1">Monthly Installment (Stress Test {inputs.stressTestRate}%):</div>
                    <div className="font-bold text-2xl text-red-600">{formatCurrency(results.monthlyInstallmentStressTest)}</div>
                    <p className="text-xs text-gray-500 mt-1">This amount is used for TDSR/MSR calculation</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <span className="text-sm text-gray-600">Combined Monthly Income:</span>
                      <div className="font-bold text-xl text-green-600">{formatCurrency(results.combinedMonthlyIncome)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <span className="text-sm text-gray-600">
                        {inputs.propertyType === 'hdb' ? 'MSR Commitments (Property Only):' : 'Total Commitments (All Loans):'}
                      </span>
                      <div className="font-bold text-xl text-red-600">{formatCurrency(results.totalCommitments)}</div>
                      <div className="text-xs text-gray-500">
                        {inputs.propertyType === 'hdb' 
                          ? 'MSR: Property loans only' 
                          : 'TDSR: Car, personal & property loans'
                        }
                      </div>
                      {inputs.propertyType === 'hdb' && results.totalCommitmentsTDSR > 0 && (
                        <div className="mt-2">
                          <span className="text-sm text-gray-600">TDSR Commitments (All Loans):</span>
                          <div className="font-bold text-lg text-red-600">{formatCurrency(results.totalCommitmentsTDSR)}</div>
                          <div className="text-xs text-gray-500">TDSR: Car, personal & property loans</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Property-specific Results */}
            {inputs.propertyType === 'private' && (
              <div className={`p-6 rounded-xl border-2 shadow-lg transition-all duration-300 ${results.tdsrPass ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                  {results.tdsrPass ? <CheckCircle className="text-green-600 w-8 h-8" /> : <XCircle className="text-red-600 w-8 h-8" />}
                  Private Property (TDSR 55%)
                </h3>
                <div className="grid grid-cols-2 gap-4">
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <span className="text-sm text-gray-600">Cash to Show:</span>
                        <div className="font-bold text-2xl text-red-600">{formatCurrency(results.cashShowTDSR)}</div>
                      </div>
                      <div className="text-center bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <span className="text-sm text-gray-600">Cash to Pledge:</span>
                        <div className="font-bold text-2xl text-red-600">{formatCurrency(results.cashPledgeTDSR)}</div>
                      </div>
                    </div>
                    <div className="text-center mt-4">
                      <span className="text-sm font-semibold text-gray-700 bg-yellow-200 px-4 py-2 rounded-full">OR</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {inputs.propertyType === 'hdb' && (
              <div className="space-y-6">
                {/* MSR 30% Assessment */}
                <div className={`p-6 rounded-xl border-2 shadow-lg transition-all duration-300 ${results.hdbPass ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                    {results.hdbPass ? <CheckCircle className="text-green-600 w-8 h-8" /> : <XCircle className="text-red-600 w-8 h-8" />}
                    HDB Property (MSR 30%)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
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
                      <h4 className="font-semibold mb-4">MSR Cash Requirements (Choose One):</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                          <span className="text-sm text-gray-600">Cash to Show:</span>
                          <div className="font-bold text-2xl text-red-600">{formatCurrency(results.cashShowHDB)}</div>
                        </div>
                        <div className="text-center bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                          <span className="text-sm text-gray-600">Cash to Pledge:</span>
                          <div className="font-bold text-2xl text-red-600">{formatCurrency(results.cashPledgeHDB)}</div>
                        </div>
                      </div>
                      <div className="text-center mt-4">
                        <span className="text-sm font-semibold text-gray-700 bg-yellow-200 px-4 py-2 rounded-full">OR</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* TDSR 55% Assessment for HDB */}
                <div className={`p-6 rounded-xl border-2 shadow-lg transition-all duration-300 ${results.tdsrPass ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                    {results.tdsrPass ? <CheckCircle className="text-green-600 w-8 h-8" /> : <XCircle className="text-red-600 w-8 h-8" />}
                    HDB Property (TDSR 55%)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
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
                      <h4 className="font-semibold mb-4">TDSR Cash Requirements (Choose One):</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                          <span className="text-sm text-gray-600">Cash to Show:</span>
                          <div className="font-bold text-2xl text-red-600">{formatCurrency(results.cashShowTDSR)}</div>
                        </div>
                        <div className="text-center bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                          <span className="text-sm text-gray-600">Cash to Pledge:</span>
                          <div className="font-bold text-2xl text-red-600">{formatCurrency(results.cashPledgeTDSR)}</div>
                        </div>
                      </div>
                      <div className="text-center mt-4">
                        <span className="text-sm font-semibold text-gray-700 bg-yellow-200 px-4 py-2 rounded-full">OR</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Overall HDB Assessment */}
                <div className={`p-6 rounded-xl border-2 text-center shadow-lg transition-all duration-300 ${(results.hdbPass && results.tdsrPass) ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'}`}>
                  <h4 className="font-bold text-2xl">
                    Overall HDB Assessment: {(results.hdbPass && results.tdsrPass) ? 
                      <span className="text-green-700">PASS ✓</span> : 
                      <span className="text-red-700">FAIL ✗</span>
                    }
                  </h4>
                  <p className="text-sm mt-3 text-gray-600">
                    {(results.hdbPass && results.tdsrPass) ? 
                      'You meet both MSR (30%) and TDSR (55%) requirements.' :
                      'You must pass BOTH MSR (30%) AND TDSR (55%) tests for HDB loan approval.'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Generate Report Button */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-1 shadow-lg">
              <button
                onClick={generatePDFReport}
                className="w-full bg-white text-blue-600 py-4 px-6 rounded-lg font-bold text-lg flex items-center justify-center gap-3 hover:bg-gray-50 transition-all duration-200 transform hover:scale-105"
              >
                <Download className="w-6 h-6" />
                <div className="text-left">
                  <div>Generate TDSR/MSR Analysis Report</div>
                 
                </div>
              </button>
            </div>

            {/* Formula Information */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-3 text-blue-800">
                <Info className="text-blue-600 w-6 h-6" />
                Key Calculation Formulas
              </h3>
              <div className="text-sm space-y-3 text-gray-700">
                <div className="bg-white p-3 rounded-lg border border-blue-100">
                  <p className="font-semibold text-blue-700">Maximum Loan Tenor Rules:</p>
                  <p className="ml-4 text-xs mt-1"><strong>HDB Property:</strong></p>
                  <p className="ml-6 text-xs">• 56%-75% loan: Max 25 years, borrower age capped at 65 years</p>
                  <p className="ml-6 text-xs">• ≤55% loan: Max 30 years, borrower age capped at 75 years</p>
                  <p className="ml-4 text-xs mt-1"><strong>Private Property:</strong></p>
                  <p className="ml-6 text-xs">• 56%-75% loan: Max 30 years, borrower age capped at 65 years</p>
                  <p className="ml-6 text-xs">• ≤55% loan: Max 35 years, borrower age capped at 75 years</p>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-blue-100">
                  <p className="font-semibold text-blue-700">Commitment Inclusions by Property Type:</p>
                  <p className="ml-4 text-xs"><strong>Private Property (TDSR):</strong> Car loans + Personal loans + Property loans</p>
                  <p className="ml-4 text-xs"><strong>HDB Property (MSR):</strong> Property loans only (car & personal loans excluded)</p>
                  <p className="ml-4 text-xs"><strong>HDB Property (TDSR):</strong> Car loans + Personal loans + Property loans</p>
                  <p className="ml-4 text-xs italic">Note: HDB properties must pass BOTH MSR (30%) AND TDSR (55%) tests</p>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-blue-100">
                  <p className="font-semibold text-blue-700">Affordability Ratios:</p>
                  <p className="ml-4 text-xs">• <strong>TDSR 55% (Private):</strong> Combined Monthly Income × 0.55 - All Commitments</p>
                  <p className="ml-4 text-xs">• <strong>MSR 30% (HDB):</strong> Combined Monthly Income × 0.3 - Property Loans Only</p>
                  <p className="ml-4 text-xs">• <strong>TDSR 55% (HDB):</strong> Combined Monthly Income × 0.55 - All Commitments</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Calculator Wrapper Component
const MortgageCalculator = ({ currentUser, onLogout }) => {
  const [calculatorType, setCalculatorType] = useState('tdsr'); // 'tdsr', 'repayment', or 'progressive'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img 
                src="https://ik.imagekit.io/hst9jooux/KeyQuest%20Logo.jpeg?updatedAt=1748073687798" 
                alt="KeyQuest Mortgage Logo" 
                className="h-32 w-auto rounded-2xl shadow-lg"
              />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                  <Calculator className="text-blue-600 w-10 h-10" />
                  Comprehensive Mortgage Calculator Suite
                </h1>
              
              </div>
              <div className="text-right">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
                  <p className="text-sm text-gray-600">Logged in as:</p>
                  <p className="font-bold text-gray-800 text-lg">{currentUser}</p>
                  <button
                    onClick={onLogout}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Calculator Type Selection */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-2 inline-flex border border-gray-200">
            <button
              onClick={() => setCalculatorType('tdsr')}
              className={`px-6 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                calculatorType === 'tdsr'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <div className="text-left">
                <div>TDSR/MSR Calculator</div>
                <div className="text-xs opacity-75">Affordability Assessment</div>
              </div>
            </button>
            <button
              onClick={() => setCalculatorType('repayment')}
              className={`px-6 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                calculatorType === 'repayment'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              <div className="text-left">
                <div>Monthly Repayment Calculator</div>
                <div className="text-xs opacity-75">Payment Schedules</div>
              </div>
            </button>
            <button
              onClick={() => setCalculatorType('progressive')}
              className={`px-6 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                calculatorType === 'progressive'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <div className="text-left">
                <div>Progressive Payment Calculator</div>
                <div className="text-xs opacity-75">BUC Properties</div>
              </div>
            </button>
          </div>
        </div>

        {/* Calculator Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-8">
            {calculatorType === 'tdsr' ? (
              <TDSRMSRCalculator currentUser={currentUser} onLogout={onLogout} />
            ) : calculatorType === 'repayment' ? (
              <MonthlyRepaymentCalculator />
            ) : (
              <ProgressivePaymentCalculator />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <p className="text-gray-600 text-sm">
              © 2025 KeyQuest Mortgage
            </p>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
              <span>📧 kenneth@keyquestmortgage.com.sg</span>
              <span>📞 +65 9795 2338</span>
              <span></span>
            </div>
          </div>
        </div>
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
