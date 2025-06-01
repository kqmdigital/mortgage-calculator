import React, { useState, useCallback } from 'react';
import './App.css';
import { Calculator, Download, FileText, CheckCircle, XCircle, Info, Lock, LogOut, Home, Building, TrendingUp, DollarSign, BarChart3, Sparkles, Shield, Users, Award, Menu, X } from 'lucide-react';
import ProgressivePaymentCalculator from './ProgressivePaymentCalculator';
import MonthlyRepaymentCalculator from './MonthlyRepaymentCalculator';

// Employee credentials (in production, store these securely)
const EMPLOYEE_CREDENTIALS = {
  'admin': 'admin123',
  'manager': 'manager456',
  'analyst': 'analyst789',
  'employee1': 'emp123',
  'employee2': 'emp456',
};

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');

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

      <div className="relative z-10 w-full max-w-md">
        {/* Login Card */}
        <div className="standard-card card-gradient-blue backdrop-blur-lg transform hover:scale-105 transition-all duration-300">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Employee Portal
            </h1>
            <p className="text-gray-600 mt-2 font-medium">KeyQuest Mortgage Calculator Suite</p>
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
                  className="standard-input"
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
                  className="standard-input"
                  placeholder="Enter your password"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {error && (
              <div className="result-card error">
                <div className="result-header">
                  <div className="result-icon">
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-red-700 text-sm font-medium m-0">{error}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="btn-standard btn-primary btn-lg w-full"
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Access Portal</span>
                </>
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
  const [inputs, setInputs] = useState({
    propertyType: 'private',
    purchasePrice: '',
    loanPercentage: 75,
    customLoanAmount: '',
    useCustomAmount: false,
    stressTestRate: 4,
    loanTenor: 30,
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

  // Helper functions (keeping the same logic as before)
  const formatNumberInput = (value) => {
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

  const calculateMaxLoanTenor = () => {
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
      } else {
        return loanPercentage >= 56 && loanPercentage <= 75 ? 30 : 35;
      }
    }
    
    if (inputs.propertyType === 'hdb') {
      if (loanPercentage >= 56 && loanPercentage <= 75) {
        return Math.min(25, Math.max(1, 65 - averageAge));
      } else if (loanPercentage <= 55) {
        return Math.min(30, Math.max(1, 75 - averageAge));
      }
    } else {
      if (loanPercentage >= 56 && loanPercentage <= 75) {
        return Math.min(30, Math.max(1, 65 - averageAge));
      } else if (loanPercentage <= 55) {
        return Math.min(35, Math.max(1, 75 - averageAge));
      }
    }
    
    return 30;
  };

  const calculatePMT = (rate, periods, principal) => {
    if (rate === 0) return principal / periods;
    const monthlyRate = rate / 100 / 12;
    const denominator = Math.pow(1 + monthlyRate, periods) - 1;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, periods)) / denominator;
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
    
    if (propertyType === 'hdb') {
      totalCommitments = parsedInputs.propertyLoanA + parsedInputs.propertyLoanB;
      totalCommitmentsTDSR = parsedInputs.carLoanA + parsedInputs.carLoanB + parsedInputs.personalLoanA + parsedInputs.personalLoanB + parsedInputs.propertyLoanA + parsedInputs.propertyLoanB;
    } else {
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
      const parsedValue = value === '' ? '' : Number(value);
      setInputs(prev => ({
        ...prev,
        [field]: parsedValue
      }));
    } else if (field === 'loanTenor') {
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
    } else {
      setInputs(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

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

      const newWindow = window.open('', '_blank');
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      
      setTimeout(() => {
        newWindow.focus();
        newWindow.print();
      }, 500);

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
      <div className="grid-responsive cols-2">
        {/* Enhanced Input Section */}
        <div className="space-y-6">
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
            
            <div className="radio-card-group">
              <label className="radio-card">
                <input
                  type="radio"
                  name="propertyType"
                  value="private"
                  checked={inputs.propertyType === 'private'}
                  onChange={(e) => handleInputChange('propertyType', e.target.value)}
                />
                <div className="radio-card-content">
                  <Building className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="radio-card-title">Private Property</div>
                  <div className="radio-card-subtitle">TDSR Assessment</div>
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
                  <Home className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <div className="radio-card-title">HDB Property</div>
                  <div className="radio-card-subtitle">MSR + TDSR Assessment</div>
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
                    value={formatNumberInput(inputs.purchasePrice)}
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
                      checked={!inputs.useCustomAmount && inputs.loanPercentage === 75}
                      onChange={() => {
                        handleInputChange('useCustomAmount', false);
                        handleInputChange('loanPercentage', 75);
                      }}
                    />
                    <div className="radio-card-content">
                      <div className="radio-card-title">75%</div>
                      <div className="radio-card-subtitle text-xs">
                        {formatCurrency((parseNumberInput(inputs.purchasePrice) || 0) * 0.75)}
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
                        value={formatNumberInput(inputs.customLoanAmount)}
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
                      onChange={(e) => handleInputChange('loanTenor', Number(e.target.value))}
                      max={results ? results.maxLoanTenor : "35"}
                      min="0"
                      className="standard-input"
                      placeholder="30"
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
                      value={formatNumberInput(inputs.monthlySalaryA)}
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
                      value={formatNumberInput(inputs.annualSalaryA)}
                      onChange={(e) => handleInputChange('annualSalaryA', e.target.value)}
                      className="standard-input currency-input"
                      placeholder="120,000.00"
                    />
                    <span className="currency-symbol">SGD</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Age (Years)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumberInput(inputs.applicantAgeA)}
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
                      value={formatNumberInput(inputs.monthlySalaryB)}
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
                      value={formatNumberInput(inputs.annualSalaryB)}
                      onChange={(e) => handleInputChange('annualSalaryB', e.target.value)}
                      className="standard-input currency-input"
                      placeholder="90,000.00"
                    />
                    <span className="currency-symbol">SGD</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Age (Years)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumberInput(inputs.applicantAgeB)}
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
                    value={formatNumberInput(inputs.showFundAmount)}
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
                    value={formatNumberInput(inputs.pledgeAmount)}
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
                    value={formatNumberInput(inputs.carLoanA)}
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
                    value={formatNumberInput(inputs.carLoanB)}
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
                    value={formatNumberInput(inputs.personalLoanA)}
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
                    value={formatNumberInput(inputs.personalLoanB)}
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
                    value={formatNumberInput(inputs.propertyLoanA)}
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
                    value={formatNumberInput(inputs.propertyLoanB)}
                    onChange={(e) => handleInputChange('propertyLoanB', e.target.value)}
                    className="standard-input currency-input"
                    placeholder="1,500.00"
                  />
                  <span className="currency-symbol">SGD</span>
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
            <div className="standard-card">
              <div className="section-header">
                <div className="icon-container blue">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <div className="text-content">
                  <h2>Assessment Results</h2>
                  <p>{inputs.propertyType === 'private' ? 'Private Property Analysis' : 'HDB Property Analysis'}</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4 text-gray-800">Loan Configuration</h3>
                  <div className="grid-responsive cols-2">
                    <div className="result-card">
                      <div className="result-header">
                        <div className="result-icon bg-blue-100">
                          <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="result-title">Selected Loan Amount</div>
                          <div className="result-value text-blue-600">{formatCurrency(results.loanAmount)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="result-card">
                      <div className="result-header">
                        <div className="result-icon bg-green-100">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="result-title">Combined Monthly Income</div>
                          <div className="result-value text-green-600">{formatCurrency(results.combinedMonthlyIncome)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="result-card">
                      <div className="result-header">
                        <div className="result-icon bg-red-100">
                          <BarChart3 className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <div className="result-title">Monthly Installment (Stress)</div>
                          <div className="result-value text-red-600">{formatCurrency(results.monthlyInstallmentStressTest)}</div>
                          <div className="result-subtitle">Using {inputs.stressTestRate}% stress test rate</div>
                        </div>
                      </div>
                    </div>
                    <div className="result-card">
                      <div className="result-header">
                        <div className="result-icon bg-gray-100">
                          <Info className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="result-title">Loan-to-Value Ratio</div>
                          <div className="result-value text-gray-700">{((results.loanAmount / (parseNumberInput(inputs.purchasePrice) || 1)) * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Property-specific Results */}
            {inputs.propertyType === 'private' && (
              <div className={`result-card ${results.tdsrPass ? 'success' : 'error'}`}>
                <div className="result-header">
                  <div className="result-icon">
                    {results.tdsrPass ? <CheckCircle className="w-8 h-8 text-green-600" /> : <XCircle className="w-8 h-8 text-red-600" />}
                  </div>
                  <div>
                    <div className="result-title">Private Property (TDSR 55%)</div>
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

            {inputs.propertyType === 'hdb' && (
              <div className="space-y-6">
                {/* MSR 30% Assessment */}
                <div className={`result-card ${results.hdbPass ? 'success' : 'error'}`}>
                  <div className="result-header">
                    <div className="result-icon">
                      {results.hdbPass ? <CheckCircle className="w-8 h-8 text-green-600" /> : <XCircle className="w-8 h-8 text-red-600" />}
                    </div>
                    <div>
                      <div className="result-title">HDB Property (MSR 30%)</div>
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
                </div>

                {/* TDSR 55% Assessment for HDB */}
                <div className={`result-card ${results.tdsrPass ? 'success' : 'error'}`}>
                  <div className="result-header">
                    <div className="result-icon">
                      {results.tdsrPass ? <CheckCircle className="w-8 h-8 text-green-600" /> : <XCircle className="w-8 h-8 text-red-600" />}
                    </div>
                    <div>
                      <div className="result-title">HDB Property (TDSR 55%)</div>
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
                </div>

                {/* Overall HDB Assessment */}
                <div className={`result-card text-center ${(results.hdbPass && results.tdsrPass) ? 'success' : 'error'}`}>
                  <div className="result-title text-2xl">
                    Overall HDB Assessment: {(results.hdbPass && results.tdsrPass) ? 
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
        )}
      </div>
    </div>
  );
};

// Main Calculator Wrapper Component
const MortgageCalculator = ({ currentUser, onLogout }) => {
  const [calculatorType, setCalculatorType] = useState('tdsr');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img 
                src="https://ik.imagekit.io/hst9jooux/KeyQuest%20Logo.jpeg?updatedAt=1748073687798" 
                alt="KeyQuest Mortgage Logo" 
                className="h-24 lg:h-32 w-auto rounded-2xl shadow-lg"
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
              <div className="text-left lg:text-right w-full lg:w-auto">
                <div className="standard-card card-gradient-blue">
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
            <TDSRMSRCalculator currentUser={currentUser} onLogout={onLogout} />
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
