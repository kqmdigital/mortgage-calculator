import React, { useState } from 'react';
import { Download } from 'lucide-react';

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
  const handleNewLoanChange = (field, value) => {
  if (field === 'subsequentRates') {
    setNewLoan(prev => ({ ...prev, subsequentRates: value }));
  } else if (['loanAmount'].includes(field)) {
    setNewLoan(prev => ({ ...prev, [field]: parseNumberInput(value) }));
  } else if (['loanPeriodYears', 'loanPeriodMonths'].includes(field)) {
    // Parse years and months as numbers to fix year calculation
    setNewLoan(prev => ({ ...prev, [field]: parseInt(value) || 0 }));
  } else {
    setNewLoan(prev => ({ ...prev, [field]: value }));
  }
};

  // Handle input changes for existing loan
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
// PDF Report generation for Monthly Repayment Calculator (STANDARDIZED VERSION)
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
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', 'Arial', sans-serif;
            font-size: 10px;
            line-height: 1.2;
            color: #333;
            background: white;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
        }
        
        .header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #1d4ed8;
        }
        
        .logo-section {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .logo-section img {
    width: 100px !important;
    height: auto !important;
    display: block;
    margin: 0 auto;
}
        
        .loan-type-banner {
            background: #1d4ed8;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            margin: 8px 0;
        }
        
        .report-info {
            font-size: 9px;
            color: #666;
            text-align: center;
            margin-top: 6px;
        }
        
        .section {
            margin-bottom: 15px;
            break-inside: avoid;
        }
        
        .section-title {
            color: #1d4ed8;
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .loan-details-header {
            background: #eff6ff;
            border: 1px solid #3b82f6;
            border-radius: 4px;
            padding: 8px;
            margin-bottom: 10px;
            text-align: center;
            font-size: 11px;
            font-weight: bold;
        }
        
        .table-container {
            width: 100%;
            overflow-x: auto;
        }
        
        .repayment-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
            margin: 0;
        }
        
        .repayment-table th,
        .repayment-table td {
            border: 1px solid #ccc;
            padding: 4px 2px;
            text-align: center;
            vertical-align: middle;
        }
        
        .repayment-table th {
            background: #f8f9fa;
            font-weight: bold;
            color: #374151;
            font-size: 8px;
        }
        
        .repayment-table td {
            font-size: 7px;
        }

        .monthly-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7px;
            margin: 0;
        }
        
        .monthly-table th,
        .monthly-table td {
            border: 1px solid #ccc;
            padding: 3px 2px;
            text-align: center;
            vertical-align: middle;
        }
        
        .monthly-table th {
            background: #f8f9fa;
            font-weight: bold;
            color: #374151;
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
        
        .page-break {
            page-break-before: always;
            break-before: page;
        }
        
        .no-page-break {
            page-break-inside: avoid;
            break-inside: avoid;
        }
        
        .disclaimer {
            background: #f8f9fa;
            padding: 8px;
            border-radius: 4px;
            margin: 10px 0;
            font-size: 8px;
            color: #555;
            break-inside: avoid;
        }

        .footer {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 8px;
            break-inside: avoid;
        }
        
        /* Print-specific styles */
        @media print {
            body { 
                font-size: 10px !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            
            .header {
                margin-bottom: 10px !important;
            }
            
            .section {
                margin-bottom: 10px !important;
            }
            
            .logo-section img {
    width: 100px !important;
    height: auto !important;
    display: block !important;
    margin: 0 auto !important;
}
            
            .repayment-table {
                font-size: 8px !important;
            }
            
            .repayment-table th,
            .repayment-table td {
                padding: 3px 2px !important;
                font-size: 7px !important;
            }
            
            .monthly-table {
                font-size: 7px !important;
            }
            
            .monthly-table th,
            .monthly-table td {
                padding: 2px 1px !important;
                font-size: 6px !important;
            }
        }
        
        /* Ensure consistent rendering across browsers */
        @media screen and (max-width: 21cm) {
            body {
                max-width: 21cm;
                margin: 0 auto;
            }
        }
    </style>
</head>
<body>
    <div class="header no-page-break">
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

    <div class="section no-page-break">
        <div class="section-title">📅 YEARLY REPAYMENT SCHEDULE</div>
        <div class="loan-details-header">
            Loan Amount: ${formatCurrency(loanDetails.amount)} | Loan Period: ${loanDetails.years} years${loanDetails.months > 0 ? ' ' + loanDetails.months + ' months' : ''}
        </div>
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

    <!-- PAGE BREAK: Monthly Breakdown on Page 2 -->
    <div class="page-break">
        <div class="section">
            <div class="section-title">📅 MONTHLY REPAYMENT BREAKDOWN (First 5 Years)</div>
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
    </div>

    <div class="disclaimer no-page-break">
        <h4 style="margin: 0 0 4px 0; color: #333; font-size: 9px;">Important Notes</h4>
        <p style="margin: 2px 0;">• This schedule is based on fixed interest rates and regular monthly payments.</p>
        <p style="margin: 2px 0;">• Actual payments may vary based on rate changes and payment timing.</p>
        <p style="margin: 2px 0;">• Early payments can significantly reduce total interest paid.</p>
        <p style="margin: 2px 0;">• Consult our specialists for personalized advice and current market rates.</p>
    </div>

    <div class="footer no-page-break">        
        <div style="margin-bottom: 6px;">
            📧 info@keyquestmortgage.sg | 📞 +65 XXXX XXXX | 🌐 www.keyquestmortgage.sg
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 6px; margin-top: 6px;">
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
    }, 1000);

    alert(`Repayment schedule report generated successfully! 

📄 FOR BEST PDF RESULTS:
• Use Chrome or Edge browser for printing
• In print dialog, select "More settings"
• Set margins to "Default" or "Minimum"
• Choose "A4" paper size
• Enable "Background graphics"
• Set scale to "100%"
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

export default MonthlyRepaymentCalculator;
