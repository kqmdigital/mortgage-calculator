import React, { useState, useCallback } from 'react';
import { Calculator, Download, FileText, CheckCircle, XCircle, Info, Lock, LogOut } from 'lucide-react';
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
  const [inputs, setInputs] = useState({
    purchasePrice: 2000000,  // Updated to match Excel
    loanPercentage: 75, // 55, 75, or custom
    customLoanAmount: 1500000,  // Updated to match Excel
    useCustomAmount: false,
    
    // Stress test rate (separate field for calculations)
    stressTestRate: 4.0,
    
    // Interest rates for each year
    interestRateY1: 2.3,      // Year 1
    interestRateY2: 1.3,      // Year 2
    interestRateY3: 1.3,      // Year 3
    interestRateY4: 1.3,      // Year 4
    interestRateY5: 1.28,     // Year 5
    interestRateThereafter: 1.28, // Thereafter
    
    // Total interest period selection
    interestPeriodSelection: 5, // Default to 5 years
    
    loanTenor: 29,  // Updated to match Excel
    
    // Applicant A - Updated to match Excel
    monthlySalaryA: 4500,
    annualSalaryA: 60000,
    applicantAgeA: 34,
    
    // Applicant B - Updated to match Excel
    monthlySalaryB: 5500,
    annualSalaryB: 70000,
    applicantAgeB: 0,
    
    // Show Fund and Pledging (combined solution)
    showFundAmount: 0,
    pledgeAmount: 60000,  // Updated to match Excel - Applicant B has $60,000 pledge
    
    // Existing commitments - Updated to match Excel
    carLoanA: 2000,
    carLoanB: 1000,
    personalLoanA: 0,
    personalLoanB: 0
  });

  const [results, setResults] = useState(null);

  // PMT function calculation
  const calculatePMT = (rate, periods, principal) => {
    if (rate === 0) return principal / periods;
    const monthlyRate = rate / 100 / 12;
    const denominator = Math.pow(1 + monthlyRate, periods) - 1;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, periods)) / denominator;
  };

  // Helper function to calculate interest payments for each year
  const calculateYearlyInterest = (loanAmount, rates, loanTenor) => {
    let balance = loanAmount;
    const yearlyInterest = [];
    const monthlyInstallments = [];
    
    // Calculate monthly installment for each year
    rates.forEach(rate => {
      const installment = calculatePMT(rate, loanTenor * 12, loanAmount);
      monthlyInstallments.push(installment);
    });
    
    // Calculate interest for each year
    for (let year = 0; year < 5; year++) {
      let yearInterest = 0;
      const rate = rates[year];
      const monthlyRate = rate / 100 / 12;
      const installment = monthlyInstallments[year];
      
      for (let month = 0; month < 12; month++) {
        if (balance <= 0) break;
        
        const interestPayment = balance * monthlyRate;
        const principalPayment = installment - interestPayment;
        
        yearInterest += interestPayment;
        balance -= principalPayment;
        
        if (balance < 0) balance = 0;
      }
      
      yearlyInterest.push(yearInterest);
    }
    
    return { yearlyInterest, monthlyInstallments };
  };

  // Main calculation function
  const calculateMortgage = useCallback(() => {
    const {
      purchasePrice, loanPercentage, customLoanAmount, useCustomAmount,
      stressTestRate, interestRateY1, interestRateY2, interestRateY3, 
      interestRateY4, interestRateY5, interestRateThereafter, loanTenor,
      interestPeriodSelection,
      monthlySalaryA, annualSalaryA, applicantAgeA,
      monthlySalaryB, annualSalaryB, applicantAgeB,
      showFundAmount, pledgeAmount,
      carLoanA, carLoanB, personalLoanA, personalLoanB
    } = inputs;

    // Calculate loan amount
    let loanAmount;
    if (useCustomAmount) {
      loanAmount = customLoanAmount;
    } else {
      loanAmount = purchasePrice * (loanPercentage / 100);
    }
    
    // Calculate loan amounts for reference
    const loanAmount75 = purchasePrice * 0.75;
    const loanAmount55 = purchasePrice * 0.55;
    
    // Interest rates array
    const yearlyRates = [
      interestRateY1, 
      interestRateY2, 
      interestRateY3, 
      interestRateY4, 
      interestRateY5, 
      interestRateThereafter
    ];
    
    // Calculate yearly interest and installments
    const { yearlyInterest, monthlyInstallments } = calculateYearlyInterest(loanAmount, yearlyRates, loanTenor);
    
    // Calculate total interest for selected period
    const selectedPeriodTotal = (yearlyInterest || []).slice(0, interestPeriodSelection).reduce((sum, interest) => sum + interest, 0);
    
    // Calculate monthly installments for each year/period
    const monthlyInstallmentStressTest = calculatePMT(stressTestRate, loanTenor * 12, loanAmount);
    const monthlyInstallmentY1 = calculatePMT(interestRateY1, loanTenor * 12, loanAmount);
    const monthlyInstallmentY2 = calculatePMT(interestRateY2, loanTenor * 12, loanAmount);
    const monthlyInstallmentY3 = calculatePMT(interestRateY3, loanTenor * 12, loanAmount);
    const monthlyInstallmentY4 = calculatePMT(interestRateY4, loanTenor * 12, loanAmount);
    const monthlyInstallmentY5 = calculatePMT(interestRateY5, loanTenor * 12, loanAmount);
    const monthlyInstallmentThereafter = calculatePMT(interestRateThereafter, loanTenor * 12, loanAmount);
    
    // Use stress test installment for affordability calculation
    const monthlyInstallment = monthlyInstallmentStressTest;
    
    // Calculate bonus income (70% of excess annual salary over base)
    // Base salary is monthly salary * 12 (matching Excel R10/S10 calculation)
    const baseSalaryA = monthlySalaryA * 12;
    const baseSalaryB = monthlySalaryB * 12;
    const bonusIncomeA = Math.max(0, (annualSalaryA - baseSalaryA) / 12) * 0.7;
    const bonusIncomeB = Math.max(0, (annualSalaryB - baseSalaryB) / 12) * 0.7;
    
    // Calculate additional income from show fund and pledge
    const showFundIncomeA = showFundAmount * 0.00625; // 0.625% monthly yield
    const showFundIncomeB = 0; // Assuming single applicant for show fund
    const pledgeIncomeA = 0; // Assign pledge to Applicant B
    const pledgeIncomeB = pledgeAmount / 48; // Divide by 48 months - assigned to Applicant B
    
    // Total monthly income
    const totalMonthlyIncomeA = monthlySalaryA + bonusIncomeA + showFundIncomeA + pledgeIncomeA;
    const totalMonthlyIncomeB = monthlySalaryB + bonusIncomeB + showFundIncomeB + pledgeIncomeB;
    const combinedMonthlyIncome = totalMonthlyIncomeA + totalMonthlyIncomeB;
    
    // Total commitments
    const totalCommitments = carLoanA + carLoanB + personalLoanA + personalLoanB;
    
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
      yearlyInterest,
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
      totalCommitments
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
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generatePDFReport = () => {
    if (!results) {
      alert('Please calculate the mortgage first before generating a report.');
      return;
    }

    try {
      const loanAmountSource = inputs.useCustomAmount ? 'Custom Amount' : `${inputs.loanPercentage}% of Purchase Price`;
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
    <title>Mortgage Affordability Report - KeyQuest Mortgage</title>
    <style>
        @media print {
            body { margin: 0; }
            .page-break { page-break-before: always; }
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #dc2626;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .logo-placeholder {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #dc2626, #1d4ed8);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 24px;
        }
        
        .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #1d4ed8;
            margin: 0;
        }
        
        .company-tagline {
            color: #666;
            font-size: 14px;
            margin: 5px 0 0 0;
        }
        
        .report-title {
            font-size: 24px;
            font-weight: bold;
            color: #dc2626;
            margin: 20px 0 10px 0;
        }
        
        .report-subtitle {
            color: #666;
            font-size: 16px;
            margin-bottom: 20px;
        }
        
        .section {
            margin: 25px 0;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #f9fafb;
        }
        
        .section h2 {
            color: #1d4ed8;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-bottom: 15px;
            font-size: 18px;
        }
        
        .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
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
        
        .status-approved {
            background: #dcfce7;
            color: #166534;
            padding: 10px;
            border-radius: 6px;
            border-left: 4px solid #22c55e;
            font-weight: bold;
        }
        
        .status-rejected {
            background: #fef2f2;
            color: #dc2626;
            padding: 10px;
            border-radius: 6px;
            border-left: 4px solid #ef4444;
            font-weight: bold;
        }
        
        .highlight-box {
            background: #eff6ff;
            border: 1px solid #3b82f6;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
        }
        
        .installment-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin: 15px 0;
        }
        
        .installment-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px;
            text-align: center;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        
        .disclaimer {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            font-size: 11px;
            color: #555;
        }
        
        @media (max-width: 600px) {
            .two-column { grid-template-columns: 1fr; }
            .installment-grid { grid-template-columns: 1fr; }
            .logo-section { flex-direction: column; gap: 10px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-section">
            <div class="logo-placeholder">KQ</div>
            <div>
                <h1 class="company-name">KEYQUEST MORTGAGE</h1>
                <p class="company-tagline">Your Trusted Mortgage Advisory Partner</p>
            </div>
        </div>
        
        <div class="report-title">MORTGAGE AFFORDABILITY ASSESSMENT</div>
        <div class="report-subtitle">Professional Analysis Report</div>
        
        <div style="margin-top: 20px; font-size: 14px; color: #666;">
            <strong>Report Generated:</strong> ${currentDate} | 
            <strong>Prepared by:</strong> ${currentUser} | 
            <strong>Report ID:</strong> KQM-${Date.now()}
        </div>
    </div>

    <div class="section">
        <h2>📋 EXECUTIVE SUMMARY</h2>
        <div class="highlight-box">
            <div class="two-column">
                <div>
                    <div class="info-row">
                        <span class="info-label">Property Value:</span>
                        <span class="info-value">${formatCurrency(inputs.purchasePrice)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Loan Amount:</span>
                        <span class="info-value">${formatCurrency(results.loanAmount)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Loan-to-Value:</span>
                        <span class="info-value">${((results.loanAmount / inputs.purchasePrice) * 100).toFixed(1)}%</span>
                    </div>
                </div>
                <div>
                    <div class="info-row">
                        <span class="info-label">Monthly Income:</span>
                        <span class="info-value">${formatCurrency(results.combinedMonthlyIncome)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Monthly Installment:</span>
                        <span class="info-value">${formatCurrency(results.monthlyInstallmentStressTest)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Loan Tenure:</span>
                        <span class="info-value">${inputs.loanTenor} years</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>💰 AFFORDABILITY ANALYSIS</h2>
        
        <div style="margin: 20px 0;">
            <h3 style="color: #555; margin-bottom: 15px;">Private Property Assessment (TDSR 55%)</h3>
            <div class="${results.tdsrPass ? 'status-approved' : 'status-rejected'}">
                <strong>Status: ${results.tdsrPass ? '✅ APPROVED' : '❌ ADDITIONAL FUNDING REQUIRED'}</strong>
                <div style="margin-top: 10px; font-size: 14px;">
                    Required Income: ${formatCurrency(results.requiredIncomeTDSR)} | 
                    Available Income: ${formatCurrency(results.combinedMonthlyIncome)} | 
                    ${results.tdsrPass ? 'Surplus' : 'Deficit'}: ${formatCurrency(Math.abs(results.tdsrDeficit))}
                </div>
            </div>
        </div>

        <div style="margin: 20px 0;">
            <h3 style="color: #555; margin-bottom: 15px;">HDB Property Assessment (MSR 30%)</h3>
            <div class="${results.hdbPass ? 'status-approved' : 'status-rejected'}">
                <strong>Status: ${results.hdbPass ? '✅ APPROVED' : '❌ ADDITIONAL FUNDING REQUIRED'}</strong>
                <div style="margin-top: 10px; font-size: 14px;">
                    Required Income: ${formatCurrency(results.requiredIncomeHDB)} | 
                    Available Income: ${formatCurrency(results.combinedMonthlyIncome)} | 
                    ${results.hdbPass ? 'Surplus' : 'Deficit'}: ${formatCurrency(Math.abs(results.hdbDeficit))}
                </div>
            </div>
        </div>
    </div>

    ${(!results.tdsrPass || !results.hdbPass) ? `
    <div class="section">
        <h2>💡 FUNDING SOLUTIONS</h2>
        ${!results.tdsrPass ? `
        <div style="margin: 15px 0;">
            <h3 style="color: #dc2626;">Private Property Funding Options</h3>
            <div class="two-column">
                <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
                    <strong>Option A: Show Fund</strong><br>
                    <span style="font-size: 18px; color: #dc2626; font-weight: bold;">${formatCurrency(results.cashShowTDSR)}</span>
                </div>
                <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
                    <strong>Option B: Pledge Fund</strong><br>
                    <span style="font-size: 18px; color: #dc2626; font-weight: bold;">${formatCurrency(results.cashPledgeTDSR)}</span>
                </div>
            </div>
        </div>
        ` : ''}
        
        ${!results.hdbPass ? `
        <div style="margin: 15px 0;">
            <h3 style="color: #dc2626;">HDB Property Funding Options</h3>
            <div class="two-column">
                <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
                    <strong>Option A: Show Fund</strong><br>
                    <span style="font-size: 18px; color: #dc2626; font-weight: bold;">${formatCurrency(results.cashShowHDB)}</span>
                </div>
                <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
                    <strong>Option B: Pledge Fund</strong><br>
                    <span style="font-size: 18px; color: #dc2626; font-weight: bold;">${formatCurrency(results.cashPledgeHDB)}</span>
                </div>
            </div>
        </div>
        ` : ''}
    </div>
    ` : ''}

    <div class="section">
        <h2>📊 PAYMENT SCHEDULE OVERVIEW</h2>
        
        <div class="highlight-box">
            <h3 style="margin-top: 0; color: #dc2626;">Stress Test Rate: ${inputs.stressTestRate}%</h3>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">Monthly installment used for affordability assessment</p>
            <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${formatCurrency(results.monthlyInstallmentStressTest)}</div>
        </div>

        <h3 style="color: #555; margin: 25px 0 15px 0;">Projected Monthly Installments by Year</h3>
        <div class="installment-grid">
            <div class="installment-card">
                <div style="color: #666; font-size: 12px;">Year 1</div>
                <div style="font-weight: bold; color: #22c55e;">${formatCurrency(results.monthlyInstallmentY1)}</div>
                <div style="font-size: 11px; color: #666;">${inputs.interestRateY1}% p.a.</div>
            </div>
            <div class="installment-card">
                <div style="color: #666; font-size: 12px;">Year 2</div>
                <div style="font-weight: bold; color: #3b82f6;">${formatCurrency(results.monthlyInstallmentY2)}</div>
                <div style="font-size: 11px; color: #666;">${inputs.interestRateY2}% p.a.</div>
            </div>
            <div class="installment-card">
                <div style="color: #666; font-size: 12px;">Year 3</div>
                <div style="font-weight: bold; color: #8b5cf6;">${formatCurrency(results.monthlyInstallmentY3)}</div>
                <div style="font-size: 11px; color: #666;">${inputs.interestRateY3}% p.a.</div>
            </div>
            <div class="installment-card">
                <div style="color: #666; font-size: 12px;">Year 4</div>
                <div style="font-weight: bold; color: #f59e0b;">${formatCurrency(results.monthlyInstallmentY4)}</div>
                <div style="font-size: 11px; color: #666;">${inputs.interestRateY4}% p.a.</div>
            </div>
            <div class="installment-card">
                <div style="color: #666; font-size: 12px;">Year 5</div>
                <div style="font-weight: bold; color: #ec4899;">${formatCurrency(results.monthlyInstallmentY5)}</div>
                <div style="font-size: 11px; color: #666;">${inputs.interestRateY5}% p.a.</div>
            </div>
            <div class="installment-card">
                <div style="color: #666; font-size: 12px;">Thereafter</div>
                <div style="font-weight: bold; color: #6366f1;">${formatCurrency(results.monthlyInstallmentThereafter)}</div>
                <div style="font-size: 11px; color: #666;">${inputs.interestRateThereafter}% p.a.</div>
            </div>
        </div>

        <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #3b82f6; margin-top: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #3b82f6;">Total Interest (First ${inputs.interestPeriodSelection} Years)</h4>
            <div style="font-size: 20px; font-weight: bold; color: #3b82f6;">${formatCurrency(results.selectedPeriodTotal || 0)}</div>
        </div>
    </div>

    <div class="section page-break">
        <h2>👥 APPLICANT INFORMATION</h2>
        
        <div class="two-column">
            <div>
                <h3 style="color: #555;">Primary Applicant</h3>
                <div class="info-row">
                    <span class="info-label">Monthly Salary:</span>
                    <span class="info-value">${formatCurrency(inputs.monthlySalaryA)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Annual Salary:</span>
                    <span class="info-value">${formatCurrency(inputs.annualSalaryA)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Age:</span>
                    <span class="info-value">${inputs.applicantAgeA} years</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total Monthly Income:</span>
                    <span class="info-value">${formatCurrency(results.totalMonthlyIncomeA)}</span>
                </div>
            </div>
            
            ${inputs.monthlySalaryB > 0 ? `
            <div>
                <h3 style="color: #555;">Co-Applicant</h3>
                <div class="info-row">
                    <span class="info-label">Monthly Salary:</span>
                    <span class="info-value">${formatCurrency(inputs.monthlySalaryB)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Annual Salary:</span>
                    <span class="info-value">${formatCurrency(inputs.annualSalaryB)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Age:</span>
                    <span class="info-value">${inputs.applicantAgeB || 'N/A'} years</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total Monthly Income:</span>
                    <span class="info-value">${formatCurrency(results.totalMonthlyIncomeB)}</span>
                </div>
            </div>
            ` : '<div><p style="color: #666; font-style: italic;">Single applicant application</p></div>'}
        </div>
        
        <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; margin-top: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #0369a1;">Combined Household Income</h4>
            <div style="font-size: 24px; font-weight: bold; color: #0369a1;">${formatCurrency(results.combinedMonthlyIncome)}</div>
        </div>
        
        ${(inputs.showFundAmount > 0 || inputs.pledgeAmount > 0) ? `
        <div style="margin-top: 20px;">
            <h4 style="color: #555;">Additional Funding Applied</h4>
            ${inputs.showFundAmount > 0 ? `<div class="info-row"><span class="info-label">Show Fund:</span><span class="info-value">${formatCurrency(inputs.showFundAmount)}</span></div>` : ''}
            ${inputs.pledgeAmount > 0 ? `<div class="info-row"><span class="info-label">Pledge Amount:</span><span class="info-value">${formatCurrency(inputs.pledgeAmount)}</span></div>` : ''}
        </div>
        ` : ''}
        
        ${(results.totalCommitments > 0) ? `
        <div style="margin-top: 20px;">
            <h4 style="color: #555;">Existing Monthly Commitments</h4>
            <div style="font-size: 18px; font-weight: bold; color: #dc2626;">${formatCurrency(results.totalCommitments)}</div>
        </div>
        ` : ''}
    </div>

    <div class="disclaimer">
        <h4 style="margin: 0 0 10px 0; color: #333;">Important Disclaimer</h4>
        <p style="margin: 5px 0;">• This assessment is for preliminary evaluation purposes only and does not constitute a loan approval or commitment.</p>
        <p style="margin: 5px 0;">• Actual loan terms, interest rates, and approval are subject to the lender's credit assessment, current market conditions, and regulatory requirements.</p>
        <p style="margin: 5px 0;">• Additional costs such as legal fees, valuation fees, and insurance premiums are not included in this assessment.</p>
        <p style="margin: 5px 0;">• We recommend consulting with our mortgage specialists for a detailed analysis tailored to your specific circumstances.</p>
        <p style="margin: 5px 0;">• Interest rates and payment projections are estimates based on current market conditions and may vary.</p>
    </div>

    <div class="footer">
        <div style="margin-bottom: 15px;">
            <strong style="color: #1d4ed8; font-size: 16px;">KEYQUEST MORTGAGE</strong><br>
            Your Trusted Mortgage Advisory Partner
        </div>
        
        <div style="margin-bottom: 10px;">
            <strong>Contact Information:</strong><br>
            📧 Email: info@keyquestmortgage.sg | 📞 Phone: +65 XXXX XXXX<br>
            🌐 Website: www.keyquestmortgage.sg
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 15px;">
            <p style="margin: 0; font-size: 10px;">This report is confidential and intended solely for the named applicant(s). 
            KeyQuest Mortgage is committed to providing professional mortgage advisory services in Singapore.</p>
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

      alert('Professional report generated! Use your browser\'s print dialog to save as PDF or print the document.');

    } catch (error) {
      console.error('Error generating report:', error);
      alert('There was an error generating the report. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      <div className="mb-8 flex justify-between items-center">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">Loan Details</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Purchase Price (SGD)</label>
                <input
                  type="number"
                  value={inputs.purchasePrice}
                  onChange={(e) => handleInputChange('purchasePrice', Number(e.target.value))}
                  className="w-full p-3 border rounded-lg"
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
                    75% ({formatCurrency(inputs.purchasePrice * 0.75)})
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
                    55% ({formatCurrency(inputs.purchasePrice * 0.55)})
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
                      type="number"
                      value={inputs.customLoanAmount}
                      onChange={(e) => handleInputChange('customLoanAmount', Number(e.target.value))}
                      className="w-full p-3 border rounded-lg"
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
                    onChange={(e) => handleInputChange('loanTenor', Number(e.target.value))}
                    className="w-full p-3 border rounded-lg"
                  />
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
                      type="number"
                      value={inputs.monthlySalaryA}
                      onChange={(e) => handleInputChange('monthlySalaryA', Number(e.target.value))}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Annual Salary</label>
                    <input
                      type="number"
                      value={inputs.annualSalaryA}
                      onChange={(e) => handleInputChange('annualSalaryA', Number(e.target.value))}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Age</label>
                    <input
                      type="number"
                      value={inputs.applicantAgeA}
                      onChange={(e) => handleInputChange('applicantAgeA', Number(e.target.value))}
                      className="w-full p-2 border rounded"
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
                      type="number"
                      value={inputs.monthlySalaryB}
                      onChange={(e) => handleInputChange('monthlySalaryB', Number(e.target.value))}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Annual Salary</label>
                    <input
                      type="number"
                      value={inputs.annualSalaryB}
                      onChange={(e) => handleInputChange('annualSalaryB', Number(e.target.value))}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Age</label>
                    <input
                      type="number"
                      value={inputs.applicantAgeB}
                      onChange={(e) => handleInputChange('applicantAgeB', Number(e.target.value))}
                      className="w-full p-2 border rounded"
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
                  type="number"
                  value={inputs.showFundAmount}
                  onChange={(e) => handleInputChange('showFundAmount', Number(e.target.value))}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Pledge Amount</label>
                <input
                  type="number"
                  value={inputs.pledgeAmount}
                  onChange={(e) => handleInputChange('pledgeAmount', Number(e.target.value))}
                  className="w-full p-3 border rounded-lg"
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
                  type="number"
                  value={inputs.carLoanA}
                  onChange={(e) => handleInputChange('carLoanA', Number(e.target.value))}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Car Loan (B)</label>
                <input
                  type="number"
                  value={inputs.carLoanB}
                  onChange={(e) => handleInputChange('carLoanB', Number(e.target.value))}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Personal Loan (A)</label>
                <input
                  type="number"
                  value={inputs.personalLoanA}
                  onChange={(e) => handleInputChange('personalLoanA', Number(e.target.value))}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Personal Loan (B)</label>
                <input
                  type="number"
                  value={inputs.personalLoanB}
                  onChange={(e) => handleInputChange('personalLoanB', Number(e.target.value))}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Calculation Results</h2>
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
                      <div className="font-medium">{((results.loanAmount / inputs.purchasePrice) * 100).toFixed(1)}%</div>
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
                  <h3 className="font-medium mb-3">Total Interest by Year</h3>
                  <div className="grid grid-cols-5 gap-3">
                    <div className="bg-red-50 p-3 rounded text-center">
                      <span className="text-sm text-gray-600">Year 1:</span>
                      <div className="font-semibold text-red-600">{formatCurrency(results.yearlyInterest[0] || 0)}</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded text-center">
                      <span className="text-sm text-gray-600">Year 2:</span>
                      <div className="font-semibold text-orange-600">{formatCurrency(results.yearlyInterest[1] || 0)}</div>
                    </div>
                    <div className="bg-amber-50 p-3 rounded text-center">
                      <span className="text-sm text-gray-600">Year 3:</span>
                      <div className="font-semibold text-amber-600">{formatCurrency(results.yearlyInterest[2] || 0)}</div>
                    </div>
                    <div className="bg-lime-50 p-3 rounded text-center">
                      <span className="text-sm text-gray-600">Year 4:</span>
                      <div className="font-semibold text-lime-600">{formatCurrency(results.yearlyInterest[3] || 0)}</div>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded text-center">
                      <span className="text-sm text-gray-600">Year 5:</span>
                      <div className="font-semibold text-emerald-600">{formatCurrency(results.yearlyInterest[4] || 0)}</div>
                    </div>
                  </div>
                  
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
                      <span className="text-sm text-gray-600">Total Commitments:</span>
                      <div className="font-semibold">{formatCurrency(results.totalCommitments)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Private Property Results */}
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

            {/* HDB Results */}
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

            {/* Generate Report Button */}
            <button
              onClick={generatePDFReport}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Generate Professional Report (PDF)
            </button>
            <p className="text-sm text-gray-500 text-center">
              Generates a professional, client-ready report with KeyQuest Mortgage branding
            </p>

            {/* Formula Information */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Info className="text-blue-600" />
                Key Formulas Used
              </h3>
              <div className="text-sm space-y-2 text-gray-700">
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
                <p className="ml-4">• TDSR 55% = Combined Monthly Income × 0.55 - Total Commitments</p>
                <p className="ml-4">• MSR 30% = Combined Monthly Income × 0.3</p>
                <p className="ml-4">• Required Income TDSR = (Year 1 Installment + Commitments) ÷ 0.55</p>
                <p className="ml-4">• Required Income HDB = (Year 1 Installment + Commitments) ÷ 0.3</p>
                
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
