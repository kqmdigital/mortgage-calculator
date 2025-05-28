import React, { useState, useCallback } from 'react';
import { Calculator, Download, FileText, CheckCircle, XCircle, Info, Lock, LogOut, Home, Building, TrendingUp, DollarSign } from 'lucide-react';
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

// Monthly Repayment Calculator Component
const MonthlyRepaymentCalculator = () => {
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'existing'
  
  // New Loan State
  const [newLoan, setNewLoan] = useState({
    loanAmount: '',
    interestRate: '',
    loanPeriodYears: 25,
    loanPeriodMonths: 0,
    showSubsequentRates: false,
    subsequentRates: [
      { year: 2, rate: '' },
      { year: 3, rate: '' },
      { year: 4, rate: '' },
      { year: 5, rate: '' },
      { year: 'thereafter', rate: '' }
    ]
  });

  // Existing Loan State (Refinancing)
  const [existingLoan, setExistingLoan] = useState({
    outstandingAmount: '',
    currentRate: '',
    remainingYears: 10,
    remainingMonths: 0,
    // New package details
    newRate: '',
    newLoanYears: 10,
    newLoanMonths: 0,
    showNewSubsequentRates: false,
    newSubsequentRates: [
      { year: 2, rate: '' },
      { year: 3, rate: '' },
      { year: 4, rate: '' },
      { year: 5, rate: '' },
      { year: 'thereafter', rate: '' }
    ]
  });

  // PMT function
  const calculatePMT = (rate, periods, principal) => {
    if (rate === 0 || !rate) return principal / periods;
    const monthlyRate = rate / 100 / 12;
    const denominator = Math.pow(1 + monthlyRate, periods) - 1;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, periods)) / denominator;
  };

  // Calculate repayment schedule with proper handling of rate changes (Excel method)
 const calculateRepaymentSchedule = (principal, rates, years, months, startDate = new Date()) => {
  const totalMonths = years * 12 + months;
  let balance = principal;
  const monthlyData = [];
  const yearlyData = [];
  
  // Pre-calculate monthly payments for each rate period (Excel method)
  const getMonthlyPaymentForPeriod = (ratePercent, fullTenorYears) => {
    if (!ratePercent || ratePercent === 0) return principal / (fullTenorYears * 12);
    const monthlyRate = ratePercent / 100 / 12;
    const totalPayments = fullTenorYears * 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);
  };
  
  // Get rate and payment for a specific month
  const getRateAndPaymentForMonth = (monthIndex) => {
    const yearIndex = Math.floor(monthIndex / 12);
    
    if (!rates || (typeof rates === 'number')) {
      const rate = parseFloat(rates) || 0;
      return {
        rate: rate,
        payment: getMonthlyPaymentForPeriod(rate, years + months/12)
      };
    }
    
    // For subsequent rates structure
    if (Array.isArray(rates)) {
      let currentRate = 0;
      
      if (yearIndex === 0) {
        // First year uses the base rate (first rate in array or separate base rate)
        currentRate = parseFloat(rates[0]?.rate || 0);
      } else {
        // Find the rate for this year
        const yearRate = rates.find(r => r.year === yearIndex + 1);
        if (yearRate && yearRate.rate) {
          currentRate = parseFloat(yearRate.rate);
        } else if (yearIndex >= 5) {
          // If beyond year 5, use 'thereafter' rate
          const thereafterRate = rates.find(r => r.year === 'thereafter');
          if (thereafterRate && thereafterRate.rate) {
            currentRate = parseFloat(thereafterRate.rate);
          }
        }
      }
      
      return {
        rate: currentRate,
        payment: getMonthlyPaymentForPeriod(currentRate, years + months/12)
      };
    }
    
    return { rate: 0, payment: 0 };
  };

  // Calculate monthly schedule
  for (let monthIndex = 0; monthIndex < totalMonths && balance > 0.01; monthIndex++) {
    const { rate: currentRate, payment: monthlyPayment } = getRateAndPaymentForMonth(monthIndex);
    const monthlyRate = currentRate / 100 / 12;
    const interestPayment = balance * monthlyRate;
    const principalPayment = Math.min(monthlyPayment - interestPayment, balance);
    
    // Calculate which month this is (0-11 for Jan-Dec) - FIXED HERE
    const monthInYear = monthIndex % 12;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    monthlyData.push({
      month: monthIndex + 1,
      year: Math.floor(monthIndex / 12) + 1, // Which year (1, 2, 3, etc.)
      monthName: monthNames[monthInYear], // FIXED: Now always starts with Jan
      rate: currentRate,
      beginningBalance: balance,
      monthlyPayment,
      interestPayment,
      principalPayment,
      endingBalance: Math.max(0, balance - principalPayment)
    });
    
    balance = Math.max(0, balance - principalPayment);
  }
  
  // Aggregate into yearly data - UPDATED
  let currentYear = null;
  let yearData = null;
  let yearCounter = 1;
  
  monthlyData.forEach((month, index) => {
    if (month.year !== currentYear) { // FIXED: Use month.year instead of calculated year
      if (yearData) {
        yearlyData.push(yearData);
      }
      currentYear = month.year;
      yearData = {
        year: `Year ${yearCounter}`,
        yearNumber: yearCounter,
        rate: month.rate,
        beginningPrincipal: month.beginningBalance,
        monthlyInstalment: month.monthlyPayment,
        interestPaid: 0,
        principalPaid: 0,
        endingPrincipal: month.endingBalance,
        months: []
      };
      yearCounter++;
    }
    
    yearData.interestPaid += month.interestPayment;
    yearData.principalPaid += month.principalPayment;
    yearData.endingPrincipal = month.endingBalance;
    yearData.months.push(month);
    
    // Handle rate changes within the year
    if (month.rate !== yearData.rate && index > 0) {
      yearData.rate = month.rate; // Use the latest rate for display
    }
  });
  
  if (yearData) {
    yearlyData.push(yearData);
  }
  
  // Calculate totals
  const totalInterest = monthlyData.reduce((sum, month) => sum + month.interestPayment, 0);
  const totalPrincipal = monthlyData.reduce((sum, month) => sum + month.principalPayment, 0);
  const totalPayable = totalInterest + totalPrincipal;
  
  return {
    monthlyData,
    yearlyData,
    totalInterest,
    totalPrincipal,
    totalPayable,
    monthlyPayment: monthlyData[0]?.monthlyPayment || 0
  };
};

  // Format currency with 2 decimal places
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'SGD 0.00';
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format number input
  const formatNumberInput = (value) => {
    if (value === '' || value === null || value === undefined) return '';
    const num = parseFloat(value.toString().replace(/,/g, ''));
    if (isNaN(num)) return '';
    return num.toLocaleString();
  };

  // Parse number input
  const parseNumberInput = (value) => {
    if (value === '' || value === null || value === undefined) return '';
    const num = parseFloat(value.toString().replace(/,/g, ''));
    return isNaN(num) ? '' : num;
  };

  // Handle input changes for new loan
  const handleExistingLoanChange = (field, value) => {
  if (field === 'newSubsequentRates') {
    setExistingLoan(prev => ({ ...prev, [field]: value }));
  } else if (['outstandingAmount'].includes(field)) {
    setExistingLoan(prev => ({ ...prev, [field]: parseNumberInput(value) }));
  } else if (['remainingYears', 'remainingMonths', 'newLoanYears', 'newLoanMonths'].includes(field)) {
    // Parse years and months as numbers to fix year calculation
    setExistingLoan(prev => ({ ...prev, [field]: parseInt(value) || 0 }));
  } else {
    setExistingLoan(prev => ({ ...prev, [field]: value }));
  }
};

  // Calculate new loan results
  const calculateNewLoan = () => {
    const amount = parseNumberInput(newLoan.loanAmount) || 0;
    const rate = parseFloat(newLoan.interestRate) || 0;
    const years = parseInt(newLoan.loanPeriodYears) || 0;
    const months = parseInt(newLoan.loanPeriodMonths) || 0;
    
    if (amount <= 0 || years + months/12 <= 0) return null;
    
    // Use subsequent rates if enabled
    let rates;
    if (newLoan.showSubsequentRates) {
      rates = [
        { year: 1, rate: newLoan.interestRate },
        ...newLoan.subsequentRates
      ];
    } else {
      rates = rate;
    }
    
    return calculateRepaymentSchedule(amount, rates, years, months);
  };

  // Calculate existing loan refinancing
  const calculateRefinancing = () => {
    const amount = parseNumberInput(existingLoan.outstandingAmount) || 0;
    
    if (amount <= 0) return null;
    
    // Current loan calculation (simple single rate)
    const currentRate = parseFloat(existingLoan.currentRate) || 0;
    const currentSchedule = calculateRepaymentSchedule(
      amount,
      currentRate,
      parseInt(existingLoan.remainingYears) || 0,
      parseInt(existingLoan.remainingMonths) || 0
    );
    
    // New loan calculation
    let newRates;
    if (existingLoan.showNewSubsequentRates) {
      newRates = [
        { year: 1, rate: existingLoan.newRate },
        ...existingLoan.newSubsequentRates
      ];
    } else {
      newRates = parseFloat(existingLoan.newRate) || 0;
    }
    
    const newSchedule = calculateRepaymentSchedule(
      amount,
      newRates,
      parseInt(existingLoan.newLoanYears) || 0,
      parseInt(existingLoan.newLoanMonths) || 0
    );
    
    // Calculate savings
    const monthlySavings = currentSchedule.monthlyPayment - newSchedule.monthlyPayment;
    const firstYearSavings = monthlySavings * 12;
    const totalInterestSavings = currentSchedule.totalInterest - newSchedule.totalInterest;
    
    return {
      current: currentSchedule,
      new: newSchedule,
      monthlySavings,
      firstYearSavings,
      totalInterestSavings
    };
  };

  const newLoanResults = calculateNewLoan();
  const refinancingResults = calculateRefinancing();

  // State for showing monthly breakdown
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState({});

  // PDF Report generation for Monthly Repayment Calculator
  // PDF Report generation for Monthly Repayment Calculator (UPDATED VERSION)
// PDF Report generation for Monthly Repayment Calculator (FINAL UPDATED VERSION)
const generateRepaymentPDFReport = (results, loanType = 'new') => {
  if (!results) {
    alert('Please calculate the loan first before generating a report.');
    return;
  }

  try {
    const currentDate = new Date().toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const loanDetails = loanType === 'new' ? {
      type: 'New Loan',
      amount: parseNumberInput(newLoan.loanAmount) || 0,
      rate: newLoan.interestRate,
      years: newLoan.loanPeriodYears,
      months: newLoan.loanPeriodMonths
    } : {
      type: 'Refinancing Package',
      amount: parseNumberInput(existingLoan.outstandingAmount) || 0,
      rate: existingLoan.newRate,
      years: existingLoan.newLoanYears,
      months: existingLoan.newLoanMonths
    };

    // Generate first 5 years monthly breakdown
    const first5YearsMonthly = results.yearlyData.slice(0, 5).map(year => year.months).flat();

    // Generate professional HTML report
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monthly Repayment Schedule - ${loanDetails.type}</title>
    <style>
        @page {
            size: A4;
            margin: 0.4in 0.6in;
        }
        
        @media print {
            * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            
            body { 
                margin: 0; 
                padding: 0;
                font-size: 10px;
                line-height: 1.1;
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
            line-height: 1.2;
            color: #333;
            max-width: 100%;
            margin: 0;
            padding: 8px;
            background: white;
            font-size: 10px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 8px;
            padding-bottom: 6px;
            border-bottom: 2px solid #1d4ed8;
        }
        
        .logo-section img {
            max-width: 120px;
            height: auto;
            display: block;
        }
        
        .report-info {
            margin-top: 4px;
            font-size: 9px;
            color: #666;
        }
        
        .loan-type-banner {
            background: #1d4ed8;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            margin: 6px 0;
        }
        
        .section {
            margin: 8px 0;
            padding: 8px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            background: #fafafa;
            page-break-inside: avoid;
        }
        
        .section h2 {
            color: #1d4ed8;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 4px;
            margin-bottom: 8px;
            font-size: 12px;
            margin-top: 0;
            text-align: center;
        }
        
        .loan-details-header {
            background: #eff6ff;
            border: 1px solid #3b82f6;
            border-radius: 4px;
            padding: 6px;
            margin-bottom: 8px;
            text-align: center;
            font-size: 10px;
        }
        
        .repayment-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
            margin: 6px 0;
        }
        
        .repayment-table th,
        .repayment-table td {
            border: 1px solid #e5e7eb;
            padding: 4px 2px;
            text-align: center;
        }
        
        .repayment-table th {
            background: #f3f4f6;
            font-weight: bold;
            color: #374151;
        }

        .monthly-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7px;
            margin: 6px 0;
        }
        
        .monthly-table th,
        .monthly-table td {
            border: 1px solid #e5e7eb;
            padding: 3px 2px;
            text-align: center;
        }
        
        .monthly-table th {
            background: #f3f4f6;
            font-weight: bold;
            color: #374151;
        }
        
        .footer {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 8px;
            page-break-inside: avoid;
        }
        
        .disclaimer {
            background: #f3f4f6;
            padding: 6px;
            border-radius: 3px;
            margin: 8px 0;
            font-size: 8px;
            color: #555;
            page-break-inside: avoid;
        }

        .refinancing-section {
            margin: 8px 0;
            padding: 8px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            background: #fafafa;
            font-size: 9px;
        }

        .refinancing-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin: 6px 0;
        }

        .refinancing-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 3px;
            padding: 6px;
            text-align: center;
        }

        .savings-row {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
            font-size: 9px;
        }
    </style>
</head>
<body>
    <div class="header no-break">
        <div class="logo-section">
            <img src="https://ik.imagekit.io/hst9jooux/KeyQuest%20Logo.jpeg?updatedAt=1748073687798" alt="KeyQuest Mortgage Logo">
        </div>
        
        <div class="loan-type-banner">
            ${loanDetails.type} - Monthly Repayment Schedule
        </div>
        
        <div class="report-info">
            <strong>Comprehensive Loan Repayment Analysis</strong><br>
            Generated: ${currentDate} | Report ID: KQM-REP-${Date.now()}
        </div>
    </div>

    <div class="section">
        <h2>📅 YEARLY REPAYMENT SCHEDULE</h2>
        <div class="loan-details-header">
            <strong>Loan Amount: ${formatCurrency(loanDetails.amount)} | Loan Period: ${loanDetails.years} years ${loanDetails.months > 0 ? loanDetails.months + ' months' : ''}</strong>
        </div>
        <table class="repayment-table">
            <thead>
                <tr>
                    <th>Year</th>
                    <th>Interest Rate</th>
                    <th>Beginning Principal</th>
                    <th>Monthly Installment</th>
                    <th>Interest Paid</th>
                    <th>Principal Paid</th>
                    <th>Ending Principal</th>
                </tr>
            </thead>
            <tbody>
                ${results.yearlyData.map(year => `
                <tr>
                    <td>${year.year}</td>
                    <td>${typeof year.rate === 'string' ? year.rate : year.rate.toFixed(2) + '%'}</td>
                    <td>${formatCurrency(year.beginningPrincipal)}</td>
                    <td>${formatCurrency(year.monthlyInstalment)}</td>
                    <td>${formatCurrency(year.interestPaid)}</td>
                    <td>${formatCurrency(year.principalPaid)}</td>
                    <td>${formatCurrency(year.endingPrincipal)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    ${loanType === 'refinancing' && refinancingResults ? `
    <div class="refinancing-section">
        <h2 style="color: #1d4ed8; font-size: 12px; margin: 0 0 8px 0; text-align: center;">💰 REFINANCING COMPARISON</h2>
        <div class="refinancing-grid">
            <div class="refinancing-card">
                <h4 style="color: #666; margin: 0 0 6px 0; font-size: 10px;">Current Loan</h4>
                <div class="savings-row">
                    <span>Monthly Payment:</span>
                    <span><strong>${formatCurrency(refinancingResults.current.monthlyPayment)}</strong></span>
                </div>
                <div class="savings-row">
                    <span>Total Interest:</span>
                    <span><strong>${formatCurrency(refinancingResults.current.totalInterest)}</strong></span>
                </div>
            </div>
            <div class="refinancing-card">
                <h4 style="color: #666; margin: 0 0 6px 0; font-size: 10px;">New Package</h4>
                <div class="savings-row">
                    <span>Monthly Payment:</span>
                    <span><strong>${formatCurrency(refinancingResults.new.monthlyPayment)}</strong></span>
                </div>
                <div class="savings-row">
                    <span>Total Interest:</span>
                    <span><strong>${formatCurrency(refinancingResults.new.totalInterest)}</strong></span>
                </div>
            </div>
        </div>
        <div style="text-align: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <div class="savings-row" style="justify-content: center; font-size: 10px;">
                <span>Monthly Savings:</span>
                <span style="color: #16a34a; margin-left: 8px; font-weight: bold;">${formatCurrency(Math.abs(refinancingResults.monthlySavings))}</span>
            </div>
            <div class="savings-row" style="justify-content: center; font-size: 10px;">
                <span>Total Interest Savings:</span>
                <span style="color: #16a34a; margin-left: 8px; font-weight: bold;">${formatCurrency(Math.abs(refinancingResults.totalInterestSavings))}</span>
            </div>
        </div>
    </div>
    ` : ''}

    <!-- PAGE 2: Monthly Breakdown for First 5 Years -->
    <div class="page-break">
        <div class="section">
            <h2>📅 MONTHLY REPAYMENT BREAKDOWN (First 5 Years)</h2>
            <table class="monthly-table">
                <thead>
                    <tr>
                        <th>Year</th>
                        <th>Month</th>
                        <th>Monthly Payment</th>
                        <th>Interest Paid</th>
                        <th>Principal Paid</th>
                        <th>Ending Balance</th>
                    </tr>
                </thead>
                <tbody>
                    ${first5YearsMonthly.map(month => `
                    <tr>
                        <td>Year ${month.year}</td>
                        <td>${month.monthName}</td>
                        <td>${formatCurrency(month.monthlyPayment)}</td>
                        <td>${formatCurrency(month.interestPayment)}</td>
                        <td>${formatCurrency(month.principalPayment)}</td>
                        <td>${formatCurrency(month.endingBalance)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>

    <div class="disclaimer no-break">
        <h4 style="margin: 0 0 4px 0; color: #333; font-size: 9px;">Important Notes</h4>
        <p style="margin: 2px 0;">• This schedule is based on fixed interest rates and regular monthly payments.</p>
        <p style="margin: 2px 0;">• Actual payments may vary based on rate changes and payment timing.</p>
        <p style="margin: 2px 0;">• Early payments can significantly reduce total interest paid.</p>
        <p style="margin: 2px 0;">• Consult our specialists for personalized advice and current market rates.</p>
    </div>

    <div class="footer no-break">        
        <div style="margin-bottom: 6px;">
            📧 info@keyquestmortgage.sg | 📞 +65 XXXX XXXX | 🌐 www.keyquestmortgage.sg
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 6px; margin-top: 8px;">
            <p style="margin: 0; font-size: 7px;">This report is confidential and intended for loan assessment purposes. 
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

    alert(`Repayment schedule report generated successfully! 

📄 FOR BEST PDF RESULTS:
• Use Chrome or Edge browser for printing
• In print dialog, select "More settings"
• Set margins to "Minimum" or "Custom" (0.4 inch)
• Choose "A4" paper size
• Enable "Background graphics"
• Set scale to "100%" or "Fit to page width"
• Select "Portrait" orientation`);

  } catch (error) {
    console.error('Error generating repayment report:', error);
    alert('There was an error generating the report. Please try again.');
  }
};

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('new')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'new'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          New Loan
        </button>
        <button
          onClick={() => setActiveTab('existing')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'existing'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Existing Loan
        </button>
      </div>

      {/* New Loan Tab */}
      {activeTab === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Loan details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Loan amount (SGD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                    <input
                      type="text"
                      value={formatNumberInput(newLoan.loanAmount)}
                      onChange={(e) => handleNewLoanChange('loanAmount', e.target.value)}
                      className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="750,000.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Interest rate (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={newLoan.interestRate}
                        onChange={(e) => handleNewLoanChange('interestRate', e.target.value)}
                        className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="3.75"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Loan period</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={newLoan.loanPeriodYears}
                        onChange={(e) => handleNewLoanChange('loanPeriodYears', e.target.value)}
                        className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max="35"
                      />
                      <span className="flex items-center text-gray-500">yrs</span>
                      <input
                        type="number"
                        value={newLoan.loanPeriodMonths}
                        onChange={(e) => handleNewLoanChange('loanPeriodMonths', e.target.value)}
                        className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max="11"
                      />
                      <span className="flex items-center text-gray-500">mths</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    id="showSubsequentRates"
                    checked={newLoan.showSubsequentRates}
                    onChange={(e) => handleNewLoanChange('showSubsequentRates', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="showSubsequentRates" className="text-sm text-gray-600">
                    Add interest rates for subsequent years
                  </label>
                </div>

                {newLoan.showSubsequentRates && (
                  <div className="mt-4 p-4 bg-white rounded-lg space-y-3">
                    <h4 className="font-medium text-sm mb-3">Subsequent year rates</h4>
                    {newLoan.subsequentRates.map((rate, index) => (
                      <div key={index} className="grid grid-cols-2 gap-4">
                        <div className="text-sm text-gray-600 flex items-center">
                          {rate.year === 'thereafter' ? 'Thereafter' : `${rate.year}${['st', 'nd', 'rd', 'th', 'th'][rate.year - 2] || 'th'} year`}
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={rate.rate}
                            onChange={(e) => {
                              const newRates = [...newLoan.subsequentRates];
                              newRates[index].rate = e.target.value;
                              handleNewLoanChange('subsequentRates', newRates);
                            }}
                            className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="3.75"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {newLoanResults && (
              <>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Loan repayment summary</h3>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Home className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-gray-700">
                        You will pay off your home loan by year{' '}
                        <span className="font-semibold">
                         {new Date().getFullYear() + parseInt(newLoan.loanPeriodYears || 0) + Math.ceil(parseInt(newLoan.loanPeriodMonths || 0) / 12)}
                        </span>
                        , with a total of{' '}
                        <span className="font-semibold text-red-600">
                          {formatCurrency(newLoanResults.totalInterest)}
                        </span>{' '}
                        in interest and{' '}
                        <span className="font-semibold">
                          {formatCurrency(newLoanResults.totalPrincipal)}
                        </span>{' '}
                        in principal.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Your Repayment Schedule</h3>

                  <div className="grid grid-cols-3 gap-4 mb-6 text-right">
                    <div>
                      <p className="text-sm text-gray-600">Total interest payable</p>
                      <p className="font-semibold">{formatCurrency(newLoanResults.totalInterest)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total principal</p>
                      <p className="font-semibold">{formatCurrency(newLoanResults.totalPrincipal)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total payable</p>
                      <p className="font-semibold">{formatCurrency(newLoanResults.totalPayable)}</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-center py-2">Year</th>
                          <th className="text-center py-2">Interest rate</th>
                          <th className="text-center py-2">Monthly instalment</th>
                          <th className="text-center py-2">Interest paid</th>
                          <th className="text-center py-2">Principal paid</th>
                          <th className="text-center py-2">Ending principal</th>
                          <th className="text-center py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {newLoanResults.yearlyData.map((year, index) => (
                          <React.Fragment key={index}>
                            <tr className="border-b hover:bg-gray-50">
                              <td className="text-center py-3">{year.year}</td>
                              <td className="text-center py-3">{typeof year.rate === 'string' ? year.rate : `${year.rate.toFixed(2)}%`}</td>
                              <td className="text-center py-3">{formatCurrency(year.monthlyInstalment)}</td>
                              <td className="text-center py-3">{formatCurrency(year.interestPaid)}</td>
                              <td className="text-center py-3">{formatCurrency(year.principalPaid)}</td>
                              <td className="text-center py-3">{formatCurrency(year.endingPrincipal)}</td>
                              <td className="text-center py-3">
                                <button
                                  onClick={() => setShowMonthlyBreakdown(prev => ({
                                    ...prev,
                                    [year.yearNumber]: !prev[year.yearNumber]
                                  }))}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  {showMonthlyBreakdown[year.yearNumber] ? '−' : '+'}
                                </button>
                              </td>
                            </tr>
                            {showMonthlyBreakdown[year.yearNumber] && (
                              <tr>
                                <td colSpan="7" className="p-0">
                                  <div className="bg-gray-50 p-4">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="text-gray-600">
                                          <th className="text-center py-1">Month</th>
                                          <th className="text-center py-1">Monthly instalment</th>
                                          <th className="text-center py-1">Interest paid</th>
                                          <th className="text-center py-1">Principal paid</th>
                                          <th className="text-center py-1">Ending principal</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {year.months.map((month, mIndex) => (
                                          <tr key={mIndex} className="border-t border-gray-200">
                                            <td className="text-center py-1">{month.monthName}</td>
                                            <td className="text-center py-1">{formatCurrency(month.monthlyPayment)}</td>
                                            <td className="text-center py-1">{formatCurrency(month.interestPayment)}</td>
                                            <td className="text-center py-1">{formatCurrency(month.principalPayment)}</td>
                                            <td className="text-center py-1">{formatCurrency(month.endingBalance)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Generate Report Button for New Loan */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => generateRepaymentPDFReport(newLoanResults, 'new')}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                      Generate Repayment Schedule Report (PDF)
                    </button>
                    <p className="text-sm text-gray-500 text-center mt-2">
                      Professional report with detailed repayment schedule
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Existing Loan Tab (Refinancing) */}
      {activeTab === 'existing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Loan details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Outstanding loan amount (SGD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                    <input
                      type="text"
                      value={formatNumberInput(existingLoan.outstandingAmount)}
                      onChange={(e) => handleExistingLoanChange('outstandingAmount', e.target.value)}
                      className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="500,000.00"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">• Current</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Existing interest rate (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={existingLoan.currentRate}
                          onChange={(e) => handleExistingLoanChange('currentRate', e.target.value)}
                          className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="4.25"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Loan period</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={existingLoan.remainingYears}
                          onChange={(e) => handleExistingLoanChange('remainingYears', e.target.value)}
                          className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                          max="35"
                        />
                        <span className="flex items-center text-gray-500">yrs</span>
                        <input
                          type="number"
                          value={existingLoan.remainingMonths}
                          onChange={(e) => handleExistingLoanChange('remainingMonths', e.target.value)}
                          className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                          max="11"
                        />
                        <span className="flex items-center text-gray-500">mths</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 text-orange-600">• New package details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Interest rate (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={existingLoan.newRate}
                          onChange={(e) => handleExistingLoanChange('newRate', e.target.value)}
                          className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="3.75"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Loan period</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={existingLoan.newLoanYears}
                          onChange={(e) => handleExistingLoanChange('newLoanYears', e.target.value)}
                          className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                          max="35"
                        />
                        <span className="flex items-center text-gray-500">yrs</span>
                        <input
                          type="number"
                          value={existingLoan.newLoanMonths}
                          onChange={(e) => handleExistingLoanChange('newLoanMonths', e.target.value)}
                          className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                          max="11"
                        />
                        <span className="flex items-center text-gray-500">mths</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      id="newSubsequentRates"
                      checked={existingLoan.showNewSubsequentRates}
                      onChange={(e) => handleExistingLoanChange('showNewSubsequentRates', e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="newSubsequentRates" className="text-sm font-medium">
                      Add interest rates for subsequent years
                    </label>
                  </div>

                  {existingLoan.showNewSubsequentRates && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                      <h4 className="font-medium text-sm mb-3">Subsequent year rates</h4>
                      {existingLoan.newSubsequentRates.map((rate, index) => (
                        <div key={index} className="grid grid-cols-2 gap-4">
                          <div className="text-sm text-gray-600 flex items-center">
                            {rate.year === 'thereafter' ? 'Thereafter' : `${rate.year}${['st', 'nd', 'rd', 'th', 'th'][rate.year - 2] || 'th'} year`}
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              value={rate.rate}
                              onChange={(e) => {
                                const newRates = [...existingLoan.newSubsequentRates];
                                newRates[index].rate = e.target.value;
                                handleExistingLoanChange('newSubsequentRates', newRates);
                              }}
                              className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="3.75"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {refinancingResults && (
              <>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">How much could I save if I switch packages?</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">• Current Monthly Instalment</span>
                      <span className="font-semibold text-lg">
                        {formatCurrency(refinancingResults.current.monthlyPayment)}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-gray-400 h-full" style={{ width: '100%' }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-orange-600">• New Monthly Instalment</span>
                      <span className="font-semibold text-lg text-orange-600">
                        {formatCurrency(refinancingResults.new.monthlyPayment)}
                      </span>
                    </div>
                    
                    <div className="w-full bg-orange-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-orange-400 h-full" 
                        style={{ 
                          width: `${Math.min(100, (refinancingResults.new.monthlyPayment / refinancingResults.current.monthlyPayment * 100).toFixed(0))}%` 
                        }}
                      ></div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Reduction in instalment</span>
                        <span className="font-bold text-xl text-green-600">
                          {formatCurrency(Math.abs(refinancingResults.monthlySavings))}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700">
                        You potentially save{' '}
                        <span className="font-semibold">{formatCurrency(Math.abs(refinancingResults.firstYearSavings))}</span>{' '}
                        in interest for the first year and{' '}
                        <span className="font-semibold">{formatCurrency(Math.abs(refinancingResults.totalInterestSavings))}</span>{' '}
                        for the entire loan period, if you switch to this new loan package.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Your Repayment Schedule (New Package)</h3>

                  <div className="grid grid-cols-3 gap-4 mb-6 text-right">
                    <div>
                      <p className="text-sm text-gray-600">Total interest payable</p>
                      <p className="font-semibold">{formatCurrency(refinancingResults.new.totalInterest)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total principal</p>
                      <p className="font-semibold">{formatCurrency(refinancingResults.new.totalPrincipal)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total payable</p>
                      <p className="font-semibold">{formatCurrency(refinancingResults.new.totalPayable)}</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-center py-2">Year</th>
                          <th className="text-center py-2">Interest rate</th>
                          <th className="text-center py-2">Monthly instalment</th>
                          <th className="text-center py-2">Interest paid</th>
                          <th className="text-center py-2">Principal paid</th>
                          <th className="text-center py-2">Ending principal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {refinancingResults.new.yearlyData.map((year, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="text-center py-3">{year.year}</td>
                            <td className="text-center py-3">{typeof year.rate === 'string' ? year.rate : `${year.rate.toFixed(2)}%`}</td>
                            <td className="text-center py-3">{formatCurrency(year.monthlyInstalment)}</td>
                            <td className="text-center py-3">{formatCurrency(year.interestPaid)}</td>
                            <td className="text-center py-3">{formatCurrency(year.principalPaid)}</td>
                            <td className="text-center py-3">{formatCurrency(year.endingPrincipal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Generate Report Button for Refinancing */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => generateRepaymentPDFReport(refinancingResults.new, 'refinancing')}
                      className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                      Generate Refinancing Report (PDF)
                    </button>
                    <p className="text-sm text-gray-500 text-center mt-2">
                      Comprehensive comparison and new repayment schedule
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
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
            max-width: 150px;
            height: auto;
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
    <div className="space-y-6">
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
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                  <input
                    type="text"
                    value={formatNumberInput(inputs.purchasePrice)}
                    onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                    className="w-full pl-12 pr-3 p-3 border rounded-lg"
                    placeholder="1,000,000.00"
                  />
                </div>
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
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                      <input
                        type="text"
                        value={formatNumberInput(inputs.customLoanAmount)}
                        onChange={(e) => handleInputChange('customLoanAmount', e.target.value)}
                        className="w-full pl-12 pr-3 p-3 border rounded-lg"
                        placeholder="750,000.00"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-medium mb-3">Loan Parameters</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Stress Test Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={inputs.stressTestRate}
                      onChange={(e) => handleInputChange('stressTestRate', Number(e.target.value))}
                      className="w-full pr-8 pl-3 p-3 border rounded-lg bg-red-50"
                      placeholder="4.00"
                      style={{
                        MozAppearance: 'textfield',
                        WebkitAppearance: 'none',
                        appearance: 'none'
                      }}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                  </div>
                  <p className="text-xs text-red-600 mt-1">Used for affordability calculation</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Loan Tenor (Years)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={inputs.loanTenor}
                      onChange={(e) => handleInputChange('loanTenor', Number(e.target.value))}
                      max={results ? results.maxLoanTenor : "35"}
                      min="1"
                      className="w-full pr-12 pl-3 p-3 border rounded-lg"
                      placeholder="30"
                      style={{
                        MozAppearance: 'textfield',
                        WebkitAppearance: 'none',
                        appearance: 'none'
                      }}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">years</span>
                  </div>
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
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-green-800">Applicant Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3">Applicant A</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Monthly Salary (SGD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                      <input
                        type="text"
                        value={formatNumberInput(inputs.monthlySalaryA)}
                        onChange={(e) => handleInputChange('monthlySalaryA', e.target.value)}
                        className="w-full pl-12 pr-3 p-2 border rounded"
                        placeholder="8,000.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Annual Salary (SGD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                      <input
                        type="text"
                        value={formatNumberInput(inputs.annualSalaryA)}
                        onChange={(e) => handleInputChange('annualSalaryA', e.target.value)}
                        className="w-full pl-12 pr-3 p-2 border rounded"
                        placeholder="120,000.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Age (Years)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatNumberInput(inputs.applicantAgeA)}
                        onChange={(e) => handleInputChange('applicantAgeA', e.target.value)}
                        className="w-full pr-12 pl-3 p-2 border rounded"
                        placeholder="35"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">years</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-3">Applicant B</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Monthly Salary (SGD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                      <input
                        type="text"
                        value={formatNumberInput(inputs.monthlySalaryB)}
                        onChange={(e) => handleInputChange('monthlySalaryB', e.target.value)}
                        className="w-full pl-12 pr-3 p-2 border rounded"
                        placeholder="6,000.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Annual Salary (SGD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                      <input
                        type="text"
                        value={formatNumberInput(inputs.annualSalaryB)}
                        onChange={(e) => handleInputChange('annualSalaryB', e.target.value)}
                        className="w-full pl-12 pr-3 p-2 border rounded"
                        placeholder="90,000.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Age (Years)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatNumberInput(inputs.applicantAgeB)}
                        onChange={(e) => handleInputChange('applicantAgeB', e.target.value)}
                        className="w-full pr-12 pl-3 p-2 border rounded"
                        placeholder="32"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">years</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-yellow-800">Additional Funding Options</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Show Fund Amount (SGD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                  <input
                    type="text"
                    value={formatNumberInput(inputs.showFundAmount)}
                    onChange={(e) => handleInputChange('showFundAmount', e.target.value)}
                    className="w-full pl-12 pr-3 p-3 border rounded-lg"
                    placeholder="500,000.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Pledge Amount (SGD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                  <input
                    type="text"
                    value={formatNumberInput(inputs.pledgeAmount)}
                    onChange={(e) => handleInputChange('pledgeAmount', e.target.value)}
                    className="w-full pl-12 pr-3 p-3 border rounded-lg"
                    placeholder="300,000.00"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-red-800">Existing Commitments</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Car Loan (A) - Monthly Payment (SGD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                  <input
                    type="text"
                    value={formatNumberInput(inputs.carLoanA)}
                    onChange={(e) => handleInputChange('carLoanA', e.target.value)}
                    className="w-full pl-12 pr-3 p-3 border rounded-lg"
                    placeholder="800.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Car Loan (B) - Monthly Payment (SGD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                  <input
                    type="text"
                    value={formatNumberInput(inputs.carLoanB)}
                    onChange={(e) => handleInputChange('carLoanB', e.target.value)}
                    className="w-full pl-12 pr-3 p-3 border rounded-lg"
                    placeholder="600.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Personal Loan (A) - Monthly Payment (SGD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                  <input
                    type="text"
                    value={formatNumberInput(inputs.personalLoanA)}
                    onChange={(e) => handleInputChange('personalLoanA', e.target.value)}
                    className="w-full pl-12 pr-3 p-3 border rounded-lg"
                    placeholder="500.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Personal Loan (B) - Monthly Payment (SGD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                  <input
                    type="text"
                    value={formatNumberInput(inputs.personalLoanB)}
                    onChange={(e) => handleInputChange('personalLoanB', e.target.value)}
                    className="w-full pl-12 pr-3 p-3 border rounded-lg"
                    placeholder="300.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Property Loan (A) - Monthly Payment (SGD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                  <input
                    type="text"
                    value={formatNumberInput(inputs.propertyLoanA)}
                    onChange={(e) => handleInputChange('propertyLoanA', e.target.value)}
                    className="w-full pl-12 pr-3 p-3 border rounded-lg"
                    placeholder="2,000.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Property Loan (B) - Monthly Payment (SGD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                  <input
                    type="text"
                    value={formatNumberInput(inputs.propertyLoanB)}
                    onChange={(e) => handleInputChange('propertyLoanB', e.target.value)}
                    className="w-full pl-12 pr-3 p-3 border rounded-lg"
                    placeholder="1,500.00"
                  />
                </div>
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
                  <h3 className="font-medium mb-3">Affordability Assessment</h3>
                  <div className="bg-red-50 p-4 rounded-lg mb-4">
                    <div className="text-sm text-gray-600 mb-1">Monthly Installment (Stress Test {inputs.stressTestRate}%):</div>
                    <div className="font-semibold text-xl text-red-600">{formatCurrency(results.monthlyInstallmentStressTest)}</div>
                    <p className="text-xs text-gray-500 mt-1">This amount is used for TDSR/MSR calculation</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Combined Monthly Income:</span>
                      <div className="font-semibold">{formatCurrency(results.combinedMonthlyIncome)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">
                        {inputs.propertyType === 'hdb' ? 'MSR Commitments (Property Only):' : 'Total Commitments (All Loans):'}
                      </span>
                      <div className="font-semibold">{formatCurrency(results.totalCommitments)}</div>
                      <div className="text-xs text-gray-500">
                        {inputs.propertyType === 'hdb' 
                          ? 'MSR: Property loans only' 
                          : 'TDSR: Car, personal & property loans'
                        }
                      </div>
                      {inputs.propertyType === 'hdb' && results.totalCommitmentsTDSR > 0 && (
                        <div className="mt-2">
                          <span className="text-sm text-gray-600">TDSR Commitments (All Loans):</span>
                          <div className="font-semibold">{formatCurrency(results.totalCommitmentsTDSR)}</div>
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
              <div className="space-y-4">
                {/* MSR 30% Assessment */}
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
                      <h4 className="font-medium mb-2">MSR Cash Requirements (Choose One):</h4>
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

                {/* TDSR 55% Assessment for HDB */}
                <div className={`p-6 rounded-lg border-2 ${results.tdsrPass ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    {results.tdsrPass ? <CheckCircle className="text-green-600" /> : <XCircle className="text-red-600" />}
                    HDB Property (TDSR 55%)
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
                      <h4 className="font-medium mb-2">TDSR Cash Requirements (Choose One):</h4>
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

                {/* Overall HDB Assessment */}
                <div className={`p-4 rounded-lg border-2 text-center ${(results.hdbPass && results.tdsrPass) ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                  <h4 className="font-bold text-lg">
                    Overall HDB Assessment: {(results.hdbPass && results.tdsrPass) ? 
                      <span className="text-green-700">PASS ✓</span> : 
                      <span className="text-red-700">FAIL ✗</span>
                    }
                  </h4>
                  <p className="text-sm mt-2 text-gray-600">
                    {(results.hdbPass && results.tdsrPass) ? 
                      'You meet both MSR (30%) and TDSR (55%) requirements.' :
                      'You must pass BOTH MSR (30%) AND TDSR (55%) tests for HDB loan approval.'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Generate Report Button */}
            <button
              onClick={generatePDFReport}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Generate TDSR/MSR Report (PDF)
            </button>
            <p className="text-sm text-gray-500 text-center">
              Clean, client-ready report for {inputs.propertyType === 'private' ? 'Private Property' : 'HDB Property'} affordability analysis
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
                
                <p><strong>Commitment Inclusions by Property Type:</strong></p>
                <p className="ml-4"><strong>Private Property (TDSR):</strong> Car loans + Personal loans + Property loans</p>
                <p className="ml-4"><strong>HDB Property (MSR):</strong> Property loans only (car & personal loans excluded)</p>
                <p className="ml-4"><strong>HDB Property (TDSR):</strong> Car loans + Personal loans + Property loans</p>
                <p className="ml-4"><em>Note: HDB properties must pass BOTH MSR (30%) AND TDSR (55%) tests</em></p>
                
                <p><strong>Monthly Installment Calculation:</strong></p>
                <p className="ml-4">• PMT(Stress Test Rate/12, Loan Tenor×12, Loan Amount)</p>
                <p className="ml-4">• <em>Note: Stress test installment used for affordability assessment only</em></p>
                
                <p><strong>Income Calculations:</strong></p>
                <p className="ml-4">• Bonus Income = (Annual Salary - Monthly Salary×12) ÷ 12 × 0.7</p>
                <p className="ml-4">• Show Fund Income = Show Fund Amount × 0.00625 (0.625% monthly yield)</p>
                <p className="ml-4">• Pledge Income = Pledge Amount ÷ 48 (48-month distribution)</p>
                <p className="ml-4">• Combined Income = Sum of all income sources from both applicants</p>
                
                <p><strong>Affordability Ratios:</strong></p>
                <p className="ml-4">• <strong>TDSR 55% (Private):</strong> Combined Monthly Income × 0.55 - All Commitments</p>
                <p className="ml-4">• <strong>MSR 30% (HDB):</strong> Combined Monthly Income × 0.3 - Property Loans Only</p>
                <p className="ml-4">• <strong>TDSR 55% (HDB):</strong> Combined Monthly Income × 0.55 - All Commitments</p>
                <p className="ml-4">• Required Income TDSR = (Stress Test Installment + All Commitments) ÷ 0.55</p>
                <p className="ml-4">• Required Income HDB MSR = (Stress Test Installment + Property Loans Only) ÷ 0.3</p>
                
                <p><strong>Cash Requirements (when deficit exists):</strong></p>
                <p className="ml-4">• Cash to Show = |Deficit| ÷ 0.00625</p>
                <p className="ml-4">• Cash to Pledge = |Deficit| × 48</p>
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
  const [calculatorType, setCalculatorType] = useState('tdsr'); // 'tdsr' or 'repayment'

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
            <p className="text-gray-600 mt-2">Professional mortgage analysis and planning tools</p>
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

      {/* Calculator Type Selection */}
      <div className="mb-8">
        <div className="bg-gray-100 p-2 rounded-lg inline-flex">
          <button
            onClick={() => setCalculatorType('tdsr')}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              calculatorType === 'tdsr'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            TDSR/MSR Calculator
          </button>
          <button
            onClick={() => setCalculatorType('repayment')}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              calculatorType === 'repayment'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            Monthly Repayment Calculator
          </button>
        </div>
      </div>

      {/* Calculator Content */}
      {calculatorType === 'tdsr' ? (
        <TDSRMSRCalculator currentUser={currentUser} onLogout={onLogout} />
      ) : (
        <MonthlyRepaymentCalculator />
      )}
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
