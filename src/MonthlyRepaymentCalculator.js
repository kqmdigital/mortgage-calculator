import React, { useState } from 'react';
import { Download, Home, Calculator, DollarSign, TrendingUp, BarChart3, Clock, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import logger from './utils/logger';

// Enhanced Monthly Repayment Calculator Component
const MonthlyRepaymentCalculator = ({ currentUser }) => {
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

  // State for showing monthly breakdown
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState({});

  // PMT function
  const calculatePMT = (rate, periods, principal) => {
    if (rate === 0 || !rate) return principal / periods;
    const monthlyRate = rate / 100 / 12;
    const denominator = Math.pow(1 + monthlyRate, periods) - 1;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, periods)) / denominator;
  };

  // Calculate repayment schedule with proper handling of rate changes
  const calculateRepaymentSchedule = (principal, rates, years, months, startDate = new Date()) => {
    const totalMonths = years * 12 + months;
    let balance = principal;
    const monthlyData = [];
    const yearlyData = [];
    
    // Pre-calculate monthly payments for each rate period
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
      
      // Calculate which month this is (0-11 for Jan-Dec)
      const monthInYear = monthIndex % 12;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      monthlyData.push({
        month: monthIndex + 1,
        year: Math.floor(monthIndex / 12) + 1,
        monthName: monthNames[monthInYear],
        rate: currentRate,
        beginningBalance: balance,
        monthlyPayment,
        interestPayment,
        principalPayment,
        endingBalance: Math.max(0, balance - principalPayment)
      });
      
      balance = Math.max(0, balance - principalPayment);
    }
    
    // Aggregate into yearly data
    let currentYear = null;
    let yearData = null;
    let yearCounter = 1;
    
    monthlyData.forEach((month, index) => {
      if (month.year !== currentYear) {
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
  const handleNewLoanChange = (field, value) => {
    if (field === 'subsequentRates') {
      setNewLoan(prev => ({ ...prev, subsequentRates: value }));
    } else if (['loanAmount'].includes(field)) {
      setNewLoan(prev => ({ ...prev, [field]: value }));
    } else if (['loanPeriodYears', 'loanPeriodMonths'].includes(field)) {
      setNewLoan(prev => ({ ...prev, [field]: value }));
    } else {
      setNewLoan(prev => ({ ...prev, [field]: value }));
    }
  };

  // Handle input changes for existing loan
  const handleExistingLoanChange = (field, value) => {
    if (field === 'newSubsequentRates') {
      setExistingLoan(prev => ({ ...prev, [field]: value }));
    } else if (['outstandingAmount'].includes(field)) {
      setExistingLoan(prev => ({ ...prev, [field]: value }));
    } else if (['remainingYears', 'remainingMonths', 'newLoanYears', 'newLoanMonths'].includes(field)) {
      setExistingLoan(prev => ({ ...prev, [field]: value }));
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

  // PDF Report generation
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
            body { margin: 0 !important; padding: 0 !important; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', 'Arial', sans-serif;
            font-size: 10px;
            line-height: 1.2;
            color: #333;
            background: white;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
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
            justify-content: center;
            align-items: center;
            margin-bottom: 10px;
        }
        .logo-section img {
            width: 96px !important;
            height: auto !important;
            display: block;
            margin: 0 auto;
        }
        .report-title {
            color: #DC2626;
            font-size: 24px;
            font-weight: bold;
            margin: 15px 0;
        }
        .loan-type-banner {
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
            font-size: 10px;
            color: #666;
            text-align: center;
            margin-top: 8px;
        }
        .section {
            margin: 20px 0;
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
            padding: 15px;
        }
        .loan-details-header {
            background: #F3F4F6;
            border: 1px solid #E5E7EB;
            border-radius: 4px;
            padding: 10px;
            margin-bottom: 15px;
            text-align: center;
            font-size: 11px;
            font-weight: bold;
            color: #374151;
        }
        .table-container { width: 100%; }
        .repayment-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
            margin: 0;
        }
        .repayment-table th,
        .repayment-table td {
            border: 1px solid #E5E7EB;
            padding: 6px 4px;
            text-align: center;
            vertical-align: middle;
        }
        .repayment-table th {
            background: #264A82;
            color: white;
            font-weight: bold;
            font-size: 8px;
        }
        .repayment-table tbody tr:nth-child(even) {
            background: #F3F4F6;
        }
        .repayment-table tbody tr:nth-child(odd) {
            background: white;
        }
        .repayment-table td { font-size: 7px; }
        .monthly-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7px;
            margin: 0;
        }
        .monthly-table th,
        .monthly-table td {
            border: 1px solid #E5E7EB;
            padding: 4px 3px;
            text-align: center;
            vertical-align: middle;
        }
        .monthly-table th {
            background: #264A82;
            color: white;
            font-weight: bold;
        }
        .monthly-table tbody tr:nth-child(even) {
            background: #F3F4F6;
        }
        .monthly-table tbody tr:nth-child(odd) {
            background: white;
        }
        .refinancing-section {
            margin: 10px 0;
            padding: 8px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            background: #fafafa;
            font-size: 9px;
            break-inside: avoid;
        }
        .refinancing-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
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
            font-size: 8px;
        }
        .no-page-break { page-break-inside: avoid; break-inside: avoid; }
        .disclaimer {
            background: #F9FAFB;
            border: 1px solid #E5E7EB;
            padding: 12px;
            border-radius: 4px;
            margin: 20px 0;
            font-size: 9px;
            color: #555;
            break-inside: avoid;
            position: relative;
            z-index: 1;
        }
        .disclaimer h4 {
            margin: 0 0 8px 0;
            color: #333;
            font-size: 11px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 10px;
            break-inside: avoid;
            position: relative;
            z-index: 1;
        }
        @media print {
            body { 
                font-size: 10px !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .logo-section img {
                width: 80px !important;
                height: auto !important;
                display: block !important;
                margin: 0 auto !important;
            }
            
            /* Enhanced Mobile PDF Support */
            .section,
            .refinancing-section,
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
                margin-bottom: 30px !important;
                padding-bottom: 15px !important;
            }
            
            /* Prevent table splitting and fix layout */
            .repayment-table,
            .monthly-table {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                -webkit-column-break-inside: avoid !important;
                display: table !important;
                width: 100% !important;
                margin-bottom: 20px !important;
                table-layout: fixed !important;
            }
            
            /* Ensure table containers don't create scrolling */
            .table-container {
                width: 100% !important;
                overflow: visible !important;
                margin-bottom: 20px !important;
            }
            
            /* Better spacing for titles */
            h2 {
                page-break-after: avoid !important;
                margin-bottom: 10px !important;
            }
            
            /* Mobile WebKit specific fixes */
            @supports (-webkit-appearance: none) {
                .section,
                .refinancing-section {
                    -webkit-column-break-inside: avoid !important;
                    -webkit-region-break-inside: avoid !important;
                    orphans: 3 !important;
                    widows: 3 !important;
                }
            }
        }
    </style>
</head>
<body>
    <div class="header no-page-break">
        <div class="logo-section">
            <img src="https://ik.imagekit.io/hst9jooux/KeyQuest%20Logo1.JPG?updatedAt=1753157996192" alt="KeyQuest Mortgage Logo">
        </div>
        
        <div class="report-title">
            Monthly Repayment Schedule
        </div>
        
        <div class="report-info">
            Generated: ${currentDate} | Report ID: KQM-REP-${Date.now()}
        </div>
    </div>

    <div class="section no-page-break">
        <div class="section-header">Loan Details</div>
        <div class="section-content">
            <div class="loan-details-header">
                ${loanDetails.type}: ${formatCurrency(loanDetails.amount)} | Period: ${loanDetails.years} years${loanDetails.months > 0 ? ' ' + loanDetails.months + ' months' : ''} | Rate: ${loanDetails.rate}%
            </div>
        </div>
    </div>

    ${loanType === 'refinancing' && refinancingResults ? `
    <div class="refinancing-section no-page-break">
        <div class="section-title">💰 REFINANCING COMPARISON</div>
        <div class="refinancing-grid">
            <div class="refinancing-card">
                <h4 style="color: #666; margin: 0 0 4px 0; font-size: 9px;">Current Loan</h4>
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
                <h4 style="color: #666; margin: 0 0 4px 0; font-size: 9px;">New Package</h4>
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
        <div style="text-align: center; margin-top: 6px; padding-top: 6px; border-top: 1px solid #e5e7eb;">
            <div class="savings-row" style="justify-content: center; font-size: 9px;">
                <span>Monthly Savings:</span>
                <span style="color: #16a34a; margin-left: 8px; font-weight: bold;">${formatCurrency(Math.abs(refinancingResults.monthlySavings))}</span>
            </div>
            <div class="savings-row" style="justify-content: center; font-size: 9px;">
                <span>Total Interest Savings:</span>
                <span style="color: #16a34a; margin-left: 8px; font-weight: bold;">${formatCurrency(Math.abs(refinancingResults.totalInterestSavings))}</span>
            </div>
        </div>
    </div>
    ` : ''}

    <h2 style="font-size: 16px; font-weight: 700; color: #264A82; margin: 20px 0 10px 0; text-align: left;">Yearly Repayment Schedule</h2>
    
    <div class="table-container">
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
                            <td>${year.yearNumber}</td>
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

    <div style="page-break-before: always; break-before: page;">
        <h2 style="font-size: 16px; font-weight: 700; color: #264A82; margin: 20px 0 10px 0; text-align: left;">Monthly Repayment Breakdown (First 5 Years)</h2>
        
        <div class="table-container">
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
                                <td>${month.year}</td>
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

    <div class="disclaimer no-page-break">
        <h4>Disclaimer</h4>
        <p style="margin: 2px 0;">1. This schedule is based on the specified interest rates and regular monthly payments.</p>
        <p style="margin: 2px 0;">2. Actual payments may vary based on rate changes and payment timing.</p>
        <p style="margin: 2px 0;">3. Early payments can significantly reduce total interest paid.</p>
        <p style="margin: 8px 0 0 0; font-style: italic;">* This report is for indicative purpose only. ${currentDate}</p>
    </div>

    <div class="footer no-page-break">        
        <div style="font-size: 10px; color: #6b7280;">
            ${currentUser?.name || 'User'} | ${currentUser?.email || 'email@example.com'} | contactus@keyquestmortgage.com.sg<br>
            <strong style="color: #264A82; margin-top: 5px; display: block;">Your Trusted Mortgage Advisory Partner</strong>
        </div>
    </div>
</body>
</html>
      `;

      // Create a new window with the HTML content
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Add enhanced download functionality matching RecommendedPackages
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
            // Set print media styles and trigger print with filename
            const fileName = `repayment-schedule-${loanDetails.type.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`;
            printWindow.document.title = fileName;
            printWindow.print();
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

      logger.info('Enhanced repayment schedule PDF report generated successfully');

    } catch (error) {
      logger.error('Error generating repayment report:', error);
      alert('There was an error generating the report. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Tab Navigation */}
      <div className="tab-navigation">
        <button
          onClick={() => setActiveTab('new')}
          className={`tab-button ${activeTab === 'new' ? 'active' : ''}`}
        >
          <Calculator className="w-5 h-5" />
          <div className="tab-text">
            <div>New Loan</div>
            <div className="text-xs opacity-75">Calculate new mortgage</div>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('existing')}
          className={`tab-button ${activeTab === 'existing' ? 'active' : ''}`}
        >
          <TrendingUp className="w-5 h-5" />
          <div className="tab-text">
            <div>Refinancing</div>
            <div className="text-xs opacity-75">Compare existing loan</div>
          </div>
        </button>
      </div>

      {/* New Loan Tab */}
      {activeTab === 'new' && (
        <div className="space-y-8">
          {/* Top Row: Loan Configuration and Loan Repayment Summary Side by Side */}
          <div className="grid-responsive cols-2">
            {/* Left: Loan Configuration */}
            <div className="space-y-6">
              <div className="standard-card card-gradient-green">
              <div className="section-header">
                <div className="icon-container green">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="text-content">
                  <h2>Loan Configuration</h2>
                  <p>Set your loan parameters</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Loan Amount (SGD)</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatNumberInput(newLoan.loanAmount)}
                      onChange={(e) => handleNewLoanChange('loanAmount', e.target.value)}
                      className="standard-input currency-input"
                      placeholder="750,000.00"
                    />
                    <span className="currency-symbol">SGD</span>
                  </div>
                </div>

                <div className="grid-responsive cols-2">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Interest rate (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={newLoan.interestRate}
                        onChange={(e) => handleNewLoanChange('interestRate', e.target.value)}
                        className="standard-input"
                        placeholder="3.75"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Loan period</label>
                    <div className="grid-responsive cols-2">
                      <div className="relative">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={newLoan.loanPeriodYears}
                          onChange={(e) => handleNewLoanChange('loanPeriodYears', e.target.value)}
                          className="standard-input"
                          min="0"
                          max="35"
                        />
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">yrs</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={newLoan.loanPeriodMonths}
                          onChange={(e) => handleNewLoanChange('loanPeriodMonths', e.target.value)}
                          className="standard-input"
                          min="0"
                          max="11"
                        />
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">mths</span>
                      </div>
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
                  <div className="standard-card fade-in">
                    <h4 className="font-medium text-sm mb-3 text-green-700">Subsequent year rates</h4>
                    {newLoan.subsequentRates.map((rate, index) => (
                      <div key={index} className="grid-responsive cols-2 mb-3">
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
                            className="standard-input"
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

            {/* Right: Loan Repayment Summary (with integrated Loan Completion) */}
            <div className="space-y-6">
              {newLoanResults && (
              <>
                <div className="standard-card card-gradient-blue">
                  <div className="section-header">
                    <div className="icon-container blue">
                      <Home className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-content">
                      <h2>Loan Repayment Summary</h2>
                      <p>Complete loan breakdown and timeline</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">
                    You will pay off your home loan by year{' '}
                    <span className="font-semibold text-blue-600">
                      {new Date().getFullYear() + parseInt(newLoan.loanPeriodYears || 0) + Math.ceil(parseInt(newLoan.loanPeriodMonths || 0) / 12)}
                    </span>
                    , with a total of{' '}
                    <span className="font-semibold text-red-600">
                      {formatCurrency(newLoanResults.totalInterest)}
                    </span>{' '}
                    in interest and{' '}
                    <span className="font-semibold text-green-600">
                      {formatCurrency(newLoanResults.totalPrincipal)}
                    </span>{' '}
                    in principal.
                  </p>
                  
                  <div className="grid-responsive cols-3">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-xs text-red-600 mb-1">Total Interest</div>
                      <div className="font-bold text-lg text-red-600">{formatCurrency(newLoanResults.totalInterest)}</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-xs text-green-600 mb-1">Total Principal</div>
                      <div className="font-bold text-lg text-green-600">{formatCurrency(newLoanResults.totalPrincipal)}</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-xs text-blue-600 mb-1">Total Payable</div>
                      <div className="font-bold text-lg text-blue-600">{formatCurrency(newLoanResults.totalPayable)}</div>
                    </div>
                  </div>
                </div>
              </>
              )}
            </div>
          </div>
          
          {/* Full Width Repayment Schedule Section - Below Both Columns */}
          {newLoanResults && (
                <div className="standard-card">
                  <div className="section-header">
                    <div className="icon-container green">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-content">
                      <h2>Your Repayment Schedule</h2>
                      <p>Yearly breakdown with expandable monthly details</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {newLoanResults.yearlyData.map((year, index) => (
                      <div key={index} className="expandable-section">
                        <div className="expandable-header" style={{ display: 'block', padding: 0, background: 'transparent' }}>
                          {/* Desktop Layout */}
                          <div className="w-full p-4 bg-gray-50 rounded-lg desktop-yearly-grid hidden md:block">
                            <div className="grid grid-cols-8 gap-3 items-center text-sm lg:grid-cols-8 md:grid-cols-4 sm:grid-cols-2">
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Year</div>
                                <div className="font-medium">{year.year}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Rate</div>
                                <div className="font-medium">{typeof year.rate === 'string' ? year.rate : `${year.rate.toFixed(2)}%`}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Beginning Balance</div>
                                <div className="font-medium text-gray-800 text-sm">{formatCurrency(year.beginningPrincipal)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Monthly Payment</div>
                                <div className="font-semibold text-blue-600 text-sm">{formatCurrency(year.monthlyInstalment)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Interest</div>
                                <div className="font-medium text-red-600 text-sm">{formatCurrency(year.interestPaid)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Principal</div>
                                <div className="font-medium text-green-600 text-sm">{formatCurrency(year.principalPaid)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Ending Balance</div>
                                <div className="font-medium text-purple-600 text-sm">{formatCurrency(year.endingPrincipal)}</div>
                              </div>
                              <div className="text-center">
                                <button
                                  onClick={() => setShowMonthlyBreakdown(prev => ({
                                    ...prev,
                                    [year.yearNumber]: !prev[year.yearNumber]
                                  }))}
                                  className="btn-standard btn-secondary btn-sm"
                                >
                                  {showMonthlyBreakdown[year.yearNumber] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Mobile Layout */}
                          <div className="mobile-yearly-summary md:hidden">
                            <div className="mobile-table-card">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="font-semibold text-lg text-gray-800">{year.year}</h4>
                                <button
                                  onClick={() => setShowMonthlyBreakdown(prev => ({
                                    ...prev,
                                    [year.yearNumber]: !prev[year.yearNumber]
                                  }))}
                                  className="btn-standard btn-secondary btn-sm"
                                >
                                  {showMonthlyBreakdown[year.yearNumber] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </div>
                              <div className="space-y-2">
                                <div className="mobile-table-row">
                                  <span className="mobile-table-label">Interest Rate</span>
                                  <span className="mobile-table-value">{typeof year.rate === 'string' ? year.rate : `${year.rate.toFixed(2)}%`}</span>
                                </div>
                                <div className="mobile-table-row">
                                  <span className="mobile-table-label">Monthly Payment</span>
                                  <span className="mobile-table-value text-blue-600">{formatCurrency(year.monthlyInstalment)}</span>
                                </div>
                                <div className="mobile-table-row">
                                  <span className="mobile-table-label">Interest Paid</span>
                                  <span className="mobile-table-value text-red-600">{formatCurrency(year.interestPaid)}</span>
                                </div>
                                <div className="mobile-table-row">
                                  <span className="mobile-table-label">Principal Paid</span>
                                  <span className="mobile-table-value text-green-600">{formatCurrency(year.principalPaid)}</span>
                                </div>
                                <div className="mobile-table-row">
                                  <span className="mobile-table-label">Ending Balance</span>
                                  <span className="mobile-table-value text-purple-600">{formatCurrency(year.endingPrincipal)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {showMonthlyBreakdown[year.yearNumber] && (
                          <div className="expandable-content fade-in">
                            <h5 className="font-medium text-gray-700 mb-3">Monthly Breakdown</h5>
                            
                            {/* Desktop Monthly Breakdown */}
                            <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
                              {year.months.map((month, mIndex) => (
                                <div key={mIndex} className="bg-white border border-gray-200 rounded-lg p-2">
                                  <div className="text-center">
                                    <div className="font-medium text-gray-800 mb-2 text-xs">{month.monthName}</div>
                                    <div className="space-y-1 text-xs">
                                      <div className="text-center">
                                        <div className="text-gray-500 text-xs">Payment</div>
                                        <div className="font-medium text-blue-600 text-xs">{formatCurrency(month.monthlyPayment)}</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-gray-500 text-xs">Interest</div>
                                        <div className="text-red-600 text-xs">{formatCurrency(month.interestPayment)}</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-gray-500 text-xs">Principal</div>
                                        <div className="text-green-600 text-xs">{formatCurrency(month.principalPayment)}</div>
                                      </div>
                                      <div className="text-center border-t pt-1 mt-1">
                                        <div className="text-gray-500 text-xs">Balance</div>
                                        <div className="font-medium text-xs">{formatCurrency(month.endingBalance)}</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Mobile Monthly Breakdown */}
                            <div className="sm:hidden space-y-3">
                              {year.months.map((month, mIndex) => (
                                <div key={mIndex} className="mobile-monthly-card">
                                  <div className="mobile-monthly-header">{month.monthName}</div>
                                  <div className="mobile-monthly-details">
                                    <div className="mobile-monthly-item">
                                      <div className="mobile-monthly-label">Payment</div>
                                      <div className="mobile-monthly-value text-blue-600">{formatCurrency(month.monthlyPayment)}</div>
                                    </div>
                                    <div className="mobile-monthly-item">
                                      <div className="mobile-monthly-label">Interest</div>
                                      <div className="mobile-monthly-value text-red-600">{formatCurrency(month.interestPayment)}</div>
                                    </div>
                                    <div className="mobile-monthly-item">
                                      <div className="mobile-monthly-label">Principal</div>
                                      <div className="mobile-monthly-value text-green-600">{formatCurrency(month.principalPayment)}</div>
                                    </div>
                                    <div className="mobile-monthly-item">
                                      <div className="mobile-monthly-label">Balance</div>
                                      <div className="mobile-monthly-value text-purple-600">{formatCurrency(month.endingBalance)}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Generate Report Button for New Loan */}
                  <div className="mt-6">
                    <button
                      onClick={() => generateRepaymentPDFReport(newLoanResults, 'new')}
                      className="btn-standard btn-success btn-lg w-full"
                    >
                      <Download className="w-5 h-5" />
                      <div className="text-left">
                        <div>Generate Repayment Schedule Report</div>
                        <div className="text-sm opacity-90">Complete payment breakdown</div>
                      </div>
                    </button>
                  </div>
                </div>
          )}
        </div>
      )}

      {/* Existing Loan Tab (Refinancing) */}
      {activeTab === 'existing' && (
        <div className="space-y-8">
          {/* Top Row: Refinancing Configuration and Savings Summary Side by Side */}
          <div className="grid-responsive cols-2">
            {/* Left: Refinancing Configuration */}
            <div className="space-y-6">
              <div className="standard-card card-gradient-blue">
              <div className="section-header">
                <div className="icon-container blue">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="text-content">
                  <h2>Refinancing Analysis</h2>
                  <p>Compare your current loan with new packages</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Outstanding loan amount (SGD)</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatNumberInput(existingLoan.outstandingAmount)}
                      onChange={(e) => handleExistingLoanChange('outstandingAmount', e.target.value)}
                      className="standard-input currency-input"
                      placeholder="500,000.00"
                    />
                    <span className="currency-symbol">SGD</span>
                  </div>
                </div>

                <div className="standard-card card-gradient-yellow">
                  <div className="section-header">
                    <div className="icon-container yellow">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-content">
                      <h3 className="text-base">Current Loan Details</h3>
                    </div>
                  </div>
                  <div className="grid-responsive cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Existing interest rate (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          inputMode="decimal"
                          value={existingLoan.currentRate}
                          onChange={(e) => handleExistingLoanChange('currentRate', e.target.value)}
                          className="standard-input"
                          placeholder="4.25"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Remaining period</label>
                      <div className="grid-responsive cols-2">
                        <div className="relative">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={existingLoan.remainingYears}
                            onChange={(e) => handleExistingLoanChange('remainingYears', e.target.value)}
                            className="standard-input"
                            min="0"
                            max="35"
                          />
                          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">yrs</span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={existingLoan.remainingMonths}
                            onChange={(e) => handleExistingLoanChange('remainingMonths', e.target.value)}
                            className="standard-input"
                            min="0"
                            max="11"
                          />
                          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">mths</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="standard-card card-gradient-green">
                  <div className="section-header">
                    <div className="icon-container green">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-content">
                      <h3 className="text-base">New Package Details</h3>
                    </div>
                  </div>
                  <div className="grid-responsive cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Interest rate (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          inputMode="decimal"
                          value={existingLoan.newRate}
                          onChange={(e) => handleExistingLoanChange('newRate', e.target.value)}
                          className="standard-input"
                          placeholder="3.75"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">New loan period</label>
                      <div className="grid-responsive cols-2">
                        <div className="relative">
                          <input
                            type="number"
                            value={existingLoan.newLoanYears}
                            onChange={(e) => handleExistingLoanChange('newLoanYears', e.target.value)}
                            className="standard-input"
                            min="0"
                            max="35"
                          />
                          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">yrs</span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            value={existingLoan.newLoanMonths}
                            onChange={(e) => handleExistingLoanChange('newLoanMonths', e.target.value)}
                            className="standard-input"
                            min="0"
                            max="11"
                          />
                          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">mths</span>
                        </div>
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
                    <div className="standard-card fade-in mt-4">
                      <h4 className="font-medium text-sm mb-3 text-green-700">Subsequent year rates</h4>
                      {existingLoan.newSubsequentRates.map((rate, index) => (
                        <div key={index} className="grid-responsive cols-2 mb-3">
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
                              className="standard-input"
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

            {/* Right: Refinancing Savings Summary */}
            <div className="space-y-6">
              {refinancingResults && (
              <>
                {/* Savings Summary */}
                <div className="standard-card card-gradient-green">
                  <div className="section-header">
                    <div className="icon-container green">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-content">
                      <h2>Potential Savings Analysis</h2>
                      <p>Compare current vs new loan package</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-600 font-medium">Current Monthly Payment</span>
                      <span className="font-bold text-lg text-red-600">
                        {formatCurrency(refinancingResults.current.monthlyPayment)}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                      <div className="bg-red-400 h-full" style={{ width: '100%' }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-green-200">
                      <span className="text-green-600 font-medium">New Monthly Payment</span>
                      <span className="font-bold text-lg text-green-600">
                        {formatCurrency(refinancingResults.new.monthlyPayment)}
                      </span>
                    </div>
                    
                    <div className="w-full bg-green-100 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-green-400 h-full" 
                        style={{ 
                          width: `${Math.min(100, (refinancingResults.new.monthlyPayment / refinancingResults.current.monthlyPayment * 100).toFixed(0))}%` 
                        }}
                      ></div>
                    </div>
                    
                    <div className="result-card success text-center">
                      <div className="result-header justify-center">
                        <div className="result-icon bg-blue-100">
                          <DollarSign className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                          <div className="result-title">Monthly Savings</div>
                          <div className="result-value text-blue-600">
                            {formatCurrency(Math.abs(refinancingResults.monthlySavings))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="standard-card card-gradient-blue mt-4">
                    <p className="text-sm text-gray-700">
                      You potentially save{' '}
                      <span className="font-semibold text-green-600">{formatCurrency(Math.abs(refinancingResults.firstYearSavings))}</span>{' '}
                      in the first year and{' '}
                      <span className="font-semibold text-green-600">{formatCurrency(Math.abs(refinancingResults.totalInterestSavings))}</span>{' '}
                      in total interest over the entire loan period.
                    </p>
                  </div>
                </div>
              </>
            )}
            </div>
          </div>
          
          {/* Bottom Row: Full Width Repayment Schedule */}
          {refinancingResults && (
            <div className="w-full">
              <div className="standard-card">
                <div className="section-header">
                  <div className="icon-container blue">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-content">
                    <h2>Your New Repayment Schedule</h2>
                    <p>Refinanced loan payment breakdown</p>
                  </div>
                </div>

                <div className="grid-responsive cols-3 mb-6">
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-xs text-red-600 mb-1">Total Interest</div>
                    <div className="font-bold text-lg text-red-600">{formatCurrency(refinancingResults.new.totalInterest)}</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-xs text-green-600 mb-1">Total Principal</div>
                    <div className="font-bold text-lg text-green-600">{formatCurrency(refinancingResults.new.totalPrincipal)}</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-xs text-blue-600 mb-1">Total Payable</div>
                    <div className="font-bold text-lg text-blue-600">{formatCurrency(refinancingResults.new.totalPayable)}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {refinancingResults.new.yearlyData.map((year, index) => (
                    <div key={index} className="expandable-section">
                      <div className="expandable-header" style={{ display: 'block', padding: 0, background: 'transparent' }}>
                        {/* Desktop Layout */}
                        <div className="w-full p-4 bg-gray-50 rounded-lg desktop-yearly-grid hidden md:block">
                          <div className="grid grid-cols-8 gap-3 items-center text-sm">
                            <div className="text-center">
                              <div className="text-xs text-gray-500 mb-1">Year</div>
                              <div className="font-medium">{year.year}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500 mb-1">Rate</div>
                              <div className="font-medium">{typeof year.rate === 'string' ? year.rate : `${year.rate.toFixed(2)}%`}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500 mb-1">Beginning Balance</div>
                              <div className="font-medium text-gray-800 text-sm">{formatCurrency(year.beginningPrincipal)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500 mb-1">Monthly Payment</div>
                              <div className="font-semibold text-blue-600 text-sm">{formatCurrency(year.monthlyInstalment)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500 mb-1">Interest</div>
                              <div className="font-medium text-red-600 text-sm">{formatCurrency(year.interestPaid)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500 mb-1">Principal</div>
                              <div className="font-medium text-green-600 text-sm">{formatCurrency(year.principalPaid)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500 mb-1">Ending Balance</div>
                              <div className="font-medium text-purple-600 text-sm">{formatCurrency(year.endingPrincipal)}</div>
                            </div>
                            <div className="text-center">
                              <div className="flex justify-center items-center">
                                <button
                                  onClick={() => setShowMonthlyBreakdown(prev => ({
                                    ...prev,
                                    [`refinancing_${year.yearNumber}`]: !prev[`refinancing_${year.yearNumber}`]
                                  }))}
                                  className="btn-standard btn-secondary btn-sm"
                                >
                                  {showMonthlyBreakdown[`refinancing_${year.yearNumber}`] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Mobile Layout */}
                        <div className="mobile-yearly-summary md:hidden">
                          <div className="mobile-table-card">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-semibold text-lg text-gray-800">{year.year}</h4>
                              <button
                                onClick={() => setShowMonthlyBreakdown(prev => ({
                                  ...prev,
                                  [`refinancing_${year.yearNumber}`]: !prev[`refinancing_${year.yearNumber}`]
                                }))}
                                className="btn-standard btn-secondary btn-sm"
                              >
                                {showMonthlyBreakdown[`refinancing_${year.yearNumber}`] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                            <div className="space-y-2">
                              <div className="mobile-table-row">
                                <span className="mobile-table-label">Interest Rate</span>
                                <span className="mobile-table-value">{typeof year.rate === 'string' ? year.rate : `${year.rate.toFixed(2)}%`}</span>
                              </div>
                              <div className="mobile-table-row">
                                <span className="mobile-table-label">Monthly Payment</span>
                                <span className="mobile-table-value text-blue-600">{formatCurrency(year.monthlyInstalment)}</span>
                              </div>
                              <div className="mobile-table-row">
                                <span className="mobile-table-label">Interest Paid</span>
                                <span className="mobile-table-value text-red-600">{formatCurrency(year.interestPaid)}</span>
                              </div>
                              <div className="mobile-table-row">
                                <span className="mobile-table-label">Principal Paid</span>
                                <span className="mobile-table-value text-green-600">{formatCurrency(year.principalPaid)}</span>
                              </div>
                              <div className="mobile-table-row">
                                <span className="mobile-table-label">Ending Balance</span>
                                <span className="mobile-table-value text-purple-600">{formatCurrency(year.endingPrincipal)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {showMonthlyBreakdown[`refinancing_${year.yearNumber}`] && (
                        <div className="expandable-content fade-in">
                          <h5 className="font-medium text-gray-700 mb-3">Monthly Breakdown</h5>
                          
                          {/* Desktop Monthly Breakdown */}
                          <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
                            {year.months.map((month, mIndex) => (
                              <div key={mIndex} className="bg-white border border-gray-200 rounded-lg p-2">
                                <div className="text-center">
                                  <div className="font-medium text-gray-800 mb-2 text-xs">{month.monthName}</div>
                                  <div className="space-y-1">
                                    <div className="text-xs">
                                      <span className="text-gray-500">Payment:</span>
                                      <div className="font-semibold text-blue-600">{formatCurrency(month.monthlyPayment)}</div>
                                    </div>
                                    <div className="text-xs">
                                      <span className="text-gray-500">Interest:</span>
                                      <div className="font-medium text-red-600">{formatCurrency(month.interestPayment)}</div>
                                    </div>
                                    <div className="text-xs">
                                      <span className="text-gray-500">Principal:</span>
                                      <div className="font-medium text-green-600">{formatCurrency(month.principalPayment)}</div>
                                    </div>
                                    <div className="text-xs">
                                      <span className="text-gray-500">Balance:</span>
                                      <div className="font-medium text-purple-600">{formatCurrency(month.endingBalance)}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Mobile Monthly Breakdown */}
                          <div className="sm:hidden space-y-3">
                            {year.months.map((month, mIndex) => (
                              <div key={mIndex} className="mobile-monthly-card">
                                <div className="mobile-monthly-header">{month.monthName}</div>
                                <div className="mobile-monthly-details">
                                  <div className="mobile-monthly-item">
                                    <div className="mobile-monthly-label">Payment</div>
                                    <div className="mobile-monthly-value text-blue-600">{formatCurrency(month.monthlyPayment)}</div>
                                  </div>
                                  <div className="mobile-monthly-item">
                                    <div className="mobile-monthly-label">Interest</div>
                                    <div className="mobile-monthly-value text-red-600">{formatCurrency(month.interestPayment)}</div>
                                  </div>
                                  <div className="mobile-monthly-item">
                                    <div className="mobile-monthly-label">Principal</div>
                                    <div className="mobile-monthly-value text-green-600">{formatCurrency(month.principalPayment)}</div>
                                  </div>
                                  <div className="mobile-monthly-item">
                                    <div className="mobile-monthly-label">Balance</div>
                                    <div className="mobile-monthly-value text-purple-600">{formatCurrency(month.endingBalance)}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Generate Report Button for Refinancing */}
                <div className="mt-6">
                  <button
                    onClick={() => generateRepaymentPDFReport(refinancingResults.new, 'refinancing')}
                    className="btn-standard btn-primary btn-lg w-full"
                  >
                    <Download className="w-5 h-5" />
                    <div className="text-left">
                      <div>Generate Refinancing Report (PDF)</div>
                      <div className="text-sm opacity-90">Comprehensive comparison and schedule</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MonthlyRepaymentCalculator;
