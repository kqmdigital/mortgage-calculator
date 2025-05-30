import React, { useState } from 'react';
import { Download, BarChart3 } from 'lucide-react';

// Progressive Payment Calculator Component for BUC Properties
const ProgressivePaymentCalculator = () => {
  const [inputs, setInputs] = useState({
    purchasePrice: '',
    loanPercentage: 75,
    useCustomAmount: false,
    customLoanAmount: '',
    tenure: 20,
    otpDate: '',
    topDate: '',
    numOutstandingMortgages: 0,
    
    rates: [
      { year: 1, rate: 2.6, description: '' },
      { year: 2, rate: 2.9, description: '' },
      { year: 3, rate: 2.9, description: '' },
      { year: 4, rate: 2.9, description: '' },
      { year: 5, rate: 3.3, description: '' },
      { year: 'thereafter', rate: 3.3, description: '' }
    ],
    
    currentSora: 3.2
  });

  const [results, setResults] = useState(null);

  // Calculate drawdown schedule based on OTP and TOP dates
  const calculateDrawdownSchedule = () => {
    if (!inputs.otpDate || !inputs.topDate) {
      // Return default schedule if dates not provided
      return [
        { month: 1, percentage: 5, amount: null, stage: 'Upon grant of Option to Purchase', isInitial: true },
        { month: 2, percentage: 15, amount: null, stage: 'Upon signing S&P Agreement (within 8 weeks from OTP)', isInitial: true },
        { month: 12, percentage: 10, amount: null, stage: 'Completion of foundation work' },
        { month: 20, percentage: 10, amount: null, stage: 'Completion of reinforced concrete framework of unit' },
        { month: 28, percentage: 5, amount: null, stage: 'Completion of partition walls of unit' },
        { month: 32, percentage: 5, amount: null, stage: 'Completion of roofing/ceiling of unit' },
        { month: 36, percentage: 5, amount: null, stage: 'Completion of door sub-frames/ door frames, window frames, electrical wiring, internal plastering and plumbing of unit' },
        { month: 40, percentage: 5, amount: null, stage: 'Completion of car park, roads and drains serving the housing project' },
        { month: 44, percentage: 25, amount: null, stage: 'Temporary Occupation Permit (TOP)' },
        { month: 56, percentage: 15, amount: null, stage: 'Certificate of Statutory Completion' }
      ];
    }

    const otpDate = new Date(inputs.otpDate);
    const topDate = new Date(inputs.topDate);
    
    // Calculate months between OTP and TOP
    const monthsDiff = (topDate.getFullYear() - otpDate.getFullYear()) * 12 + 
                       (topDate.getMonth() - otpDate.getMonth());
    
    // Calculate drawdown schedule based on actual timeline
    const schedule = [
      { 
        month: 1, 
        percentage: 5, 
        amount: null, 
        stage: 'Upon grant of Option to Purchase', 
        isInitial: true,
        actualDate: otpDate
      },
      { 
        month: 2, 
        percentage: 15, 
        amount: null, 
        stage: 'Upon signing S&P Agreement (within 8 weeks from OTP)', 
        isInitial: true,
        actualDate: new Date(otpDate.getTime() + (8 * 7 * 24 * 60 * 60 * 1000)) // 8 weeks after OTP
      }
    ];

    // Construction phases based on timeline between S&P and TOP
    const constructionStartMonth = 3; // After S&P Agreement
    const constructionPeriod = Math.max(monthsDiff - 2, 24); // At least 24 months construction
    
    // Calculate construction milestones
    const foundationMonth = constructionStartMonth + Math.round(constructionPeriod * 0.2);
    const frameworkMonth = constructionStartMonth + Math.round(constructionPeriod * 0.4);
    const partitionMonth = constructionStartMonth + Math.round(constructionPeriod * 0.6);
    const roofingMonth = constructionStartMonth + Math.round(constructionPeriod * 0.7);
    const fittingMonth = constructionStartMonth + Math.round(constructionPeriod * 0.8);
    const infrastructureMonth = constructionStartMonth + Math.round(constructionPeriod * 0.9);
    const topMonth = monthsDiff;
    const cscMonth = topMonth + 12; // CSC typically 12 months after TOP

    // Add construction phases
    schedule.push(
      { 
        month: foundationMonth, 
        percentage: 10, 
        amount: null, 
        stage: 'Completion of foundation work',
        actualDate: new Date(otpDate.getTime() + (foundationMonth - 1) * 30 * 24 * 60 * 60 * 1000)
      },
      { 
        month: frameworkMonth, 
        percentage: 10, 
        amount: null, 
        stage: 'Completion of reinforced concrete framework of unit',
        actualDate: new Date(otpDate.getTime() + (frameworkMonth - 1) * 30 * 24 * 60 * 60 * 1000)
      },
      { 
        month: partitionMonth, 
        percentage: 5, 
        amount: null, 
        stage: 'Completion of partition walls of unit',
        actualDate: new Date(otpDate.getTime() + (partitionMonth - 1) * 30 * 24 * 60 * 60 * 1000)
      },
      { 
        month: roofingMonth, 
        percentage: 5, 
        amount: null, 
        stage: 'Completion of roofing/ceiling of unit',
        actualDate: new Date(otpDate.getTime() + (roofingMonth - 1) * 30 * 24 * 60 * 60 * 1000)
      },
      { 
        month: fittingMonth, 
        percentage: 5, 
        amount: null, 
        stage: 'Completion of door sub-frames/ door frames, window frames, electrical wiring, internal plastering and plumbing of unit',
        actualDate: new Date(otpDate.getTime() + (fittingMonth - 1) * 30 * 24 * 60 * 60 * 1000)
      },
      { 
        month: infrastructureMonth, 
        percentage: 5, 
        amount: null, 
        stage: 'Completion of car park, roads and drains serving the housing project',
        actualDate: new Date(otpDate.getTime() + (infrastructureMonth - 1) * 30 * 24 * 60 * 60 * 1000)
      },
      { 
        month: topMonth, 
        percentage: 25, 
        amount: null, 
        stage: 'Temporary Occupation Permit (TOP)',
        isTOP: true,
        actualDate: topDate
      },
      { 
        month: cscMonth, 
        percentage: 15, 
        amount: null, 
        stage: 'Certificate of Statutory Completion',
        actualDate: new Date(topDate.getTime() + (12 * 30 * 24 * 60 * 60 * 1000))
      }
    );

    return schedule.sort((a, b) => a.month - b.month);
  };

  // Helper functions
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // PMT function for calculating monthly installments
  const calculatePMT = (rate, periods, principal) => {
    if (rate === 0 || !rate) return principal / periods;
    const monthlyRate = rate / 100 / 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, periods)) / (Math.pow(1 + monthlyRate, periods) - 1);
  };

  // Progressive Payment Calculation Function - Bank Loan at Construction Stage Months
  const calculateProgressivePayments = () => {
    const purchasePrice = parseNumberInput(inputs.purchasePrice) || 0;
    
    // Calculate selected loan amount
    let selectedLoanAmount;
    if (inputs.useCustomAmount) {
      selectedLoanAmount = parseNumberInput(inputs.customLoanAmount) || 0;
    } else {
      selectedLoanAmount = purchasePrice * (inputs.loanPercentage / 100);
    }

    if (purchasePrice <= 0 || selectedLoanAmount <= 0) return null;

    // Get the construction stage drawdown schedule
    const constructionSchedule = calculateDrawdownSchedule();
    
    // Calculate total Cash/CPF requirement (Purchase Price - Loan Amount)
    const totalCashCPFRequired = purchasePrice - selectedLoanAmount;
    let runningCashCPFAllocated = 0;
    let totalCashCPF = 0;
    let totalBankLoanDrawdowns = 0;
    
    // Calculate Cash/CPF vs Bank Loan split for each construction stage
    const calculatedDrawdownSchedule = constructionSchedule.map(item => {
      const stageAmount = purchasePrice * (item.percentage / 100);
      let cashCPFAmount = 0;
      let bankLoanAmount = 0;
      
      // Calculate how much Cash/CPF is still needed
      const remainingCashCPFNeeded = Math.max(0, totalCashCPFRequired - runningCashCPFAllocated);
      
      if (remainingCashCPFNeeded > 0) {
        // Still need Cash/CPF - allocate as much as needed from this stage
        cashCPFAmount = Math.min(stageAmount, remainingCashCPFNeeded);
        bankLoanAmount = stageAmount - cashCPFAmount;
      } else {
        // Cash/CPF requirement already fulfilled - all bank loan
        cashCPFAmount = 0;
        bankLoanAmount = stageAmount;
      }
      
      runningCashCPFAllocated += cashCPFAmount;
      totalCashCPF += cashCPFAmount;
      totalBankLoanDrawdowns += bankLoanAmount;
      
      return {
        ...item,
        amount: stageAmount,
        cashCPFAmount,
        bankLoanAmount
      };
    });

    // Find the first month where bank loan drawdown occurs
    const firstBankLoanStage = calculatedDrawdownSchedule.find(stage => stage.bankLoanAmount > 0);
    const firstBankDrawdownMonth = firstBankLoanStage ? firstBankLoanStage.month : null;

    // Generate monthly payment schedule
    const monthlySchedule = [];
    const totalMonths = inputs.tenure * 12;
    let outstandingBalance = 0;
    let cumulativeBankLoanDrawdown = 0;
    let currentMonthlyPayment = 0;
    let loanServicingStarted = false;
    
    // Get interest rate for specific month
    const getInterestRateForMonth = (month) => {
      if (!firstBankDrawdownMonth) return inputs.rates[0].rate;
      
      const monthsFromLoanStart = Math.max(0, month - firstBankDrawdownMonth + 1);
      const yearIndex = Math.ceil(monthsFromLoanStart / 12);
      
      if (yearIndex <= 5) {
        const rateInfo = inputs.rates.find(r => r.year === yearIndex);
        return rateInfo ? rateInfo.rate : inputs.rates[0].rate;
      } else {
        const thereafterRate = inputs.rates.find(r => r.year === 'thereafter');
        return thereafterRate ? thereafterRate.rate : inputs.rates[inputs.rates.length - 1].rate;
      }
    };

    // Calculate maximum month needed for schedule
    const maxMonth = Math.max(
      totalMonths,
      calculatedDrawdownSchedule[calculatedDrawdownSchedule.length - 1]?.month || 0
    );

    // Generate monthly schedule
    for (let month = 1; month <= maxMonth; month++) {
      const currentRate = getInterestRateForMonth(month);
      const monthlyRate = currentRate / 100 / 12;
      
      // Check for construction stage this month (this is where bank loan drawdowns happen)
      const stageInfo = calculatedDrawdownSchedule.find(stage => stage.month === month);
      const bankLoanDrawdownAmount = stageInfo ? stageInfo.bankLoanAmount : 0;
      const cashCPFDrawdown = stageInfo ? stageInfo.cashCPFAmount : 0;
      
      // Store opening balance before any changes
      const openingBalance = outstandingBalance;
      
      // Add bank loan drawdown to outstanding balance (happens at construction stage months)
      if (bankLoanDrawdownAmount > 0) {
        outstandingBalance += bankLoanDrawdownAmount;
        cumulativeBankLoanDrawdown += bankLoanDrawdownAmount;
        
        if (!loanServicingStarted) {
          loanServicingStarted = true;
        }
        
        // Recalculate monthly payment after drawdown using remaining months
        const remainingMonths = Math.max(1, totalMonths - (month - firstBankDrawdownMonth));
        currentMonthlyPayment = calculatePMT(currentRate, remainingMonths, outstandingBalance);
      }
      
      // Calculate payments for this month
      let monthlyPayment = 0;
      let interestPayment = 0;
      let principalPayment = 0;
      
      // Calculate loan payments if loan servicing has started and there's outstanding balance
      if (loanServicingStarted && outstandingBalance > 0 && month >= firstBankDrawdownMonth) {
        // Interest payment on opening balance (before drawdown)
        interestPayment = openingBalance * monthlyRate;
        
        // Monthly payment (use current calculated payment)
        monthlyPayment = currentMonthlyPayment || 0;
        
        // Principal payment
        principalPayment = Math.max(0, monthlyPayment - interestPayment);
        
        // Ensure principal doesn't exceed outstanding balance
        if (principalPayment > outstandingBalance) {
          principalPayment = outstandingBalance;
          monthlyPayment = principalPayment + interestPayment;
        }
        
        // Update outstanding balance
        outstandingBalance = Math.max(0, outstandingBalance - principalPayment);
      }
      
      const monthInYear = ((month - 1) % 12) + 1;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Calculate actual date for this month
      let actualDate = null;
      if (inputs.otpDate) {
        const otpDate = new Date(inputs.otpDate);
        actualDate = new Date(otpDate.getTime() + (month - 1) * 30 * 24 * 60 * 60 * 1000);
      }
      
      monthlySchedule.push({
        month,
        year: Math.ceil(month / 12),
        monthInYear,
        monthName: monthNames[monthInYear - 1],
        actualDate: actualDate ? actualDate.toLocaleDateString('en-SG', { 
          year: 'numeric', month: 'short', day: 'numeric' 
        }) : null,
        openingBalance: openingBalance,
        drawdownAmount: bankLoanDrawdownAmount,
        totalDrawdownAmount: stageInfo?.amount || 0,
        cashCPFDrawdown: cashCPFDrawdown,
        cumulativeDrawdown: cumulativeBankLoanDrawdown,
        monthlyPayment: monthlyPayment,
        interestPayment: interestPayment,
        principalPayment: principalPayment,
        endingBalance: outstandingBalance,
        interestRate: currentRate,
        stage: stageInfo ? stageInfo.stage : null,
        isInitialPayment: stageInfo?.isInitial || false,
        hasConstructionStage: !!stageInfo,
        hasBankDrawdown: bankLoanDrawdownAmount > 0,
        paymentMode: !stageInfo ? 'Servicing' :
                    (stageInfo.isInitial ? 'Cash/CPF' : 
                    (bankLoanDrawdownAmount > 0 ? 'Drawdown' : 'Construction'))
      });
      
      // Stop if loan is fully paid
      if (outstandingBalance <= 0.01 && cumulativeBankLoanDrawdown >= totalBankLoanDrawdowns) {
        break;
      }
    }

    // Calculate totals
    const totalInterest = monthlySchedule.reduce((sum, month) => sum + (month.interestPayment || 0), 0);
    const totalPrincipal = monthlySchedule.reduce((sum, month) => sum + (month.principalPayment || 0), 0);
    
    // Create display stages for the drawdown table
    const displayStages = calculatedDrawdownSchedule.map(item => {
      let paymentMode;
      if (item.cashCPFAmount > 0 && item.bankLoanAmount > 0) {
        const cashCPFPercentage = ((item.cashCPFAmount / purchasePrice) * 100).toFixed(1);
        const bankLoanPercentage = ((item.bankLoanAmount / purchasePrice) * 100).toFixed(1);
        paymentMode = `Cash/CPF (${cashCPFPercentage}%) + Bank Loan (${bankLoanPercentage}%)`;
      } else if (item.cashCPFAmount > 0) {
        paymentMode = 'Cash/CPF';
      } else {
        paymentMode = 'Bank Loan';
      }
      
      return {
        stage: item.stage,
        percentage: item.percentage,
        stageAmount: item.amount,
        bankLoanAmount: item.bankLoanAmount,
        cashCPFAmount: item.cashCPFAmount,
        paymentMode,
        month: item.month,
        actualDate: item.actualDate ? item.actualDate.toLocaleDateString('en-SG', { 
          year: 'numeric', month: 'short', day: 'numeric' 
        }) : null,
        isInitial: item.isInitial || false,
        isTOP: item.isTOP || false
      };
    });

    return {
      stages: displayStages,
      monthlySchedule,
      purchasePrice,
      loanAmount: selectedLoanAmount,
      totalCashCPF,
      totalBankLoan: totalBankLoanDrawdowns,
      totalCashCPFRequired,
      totalInterest,
      totalPrincipal,
      totalPayable: totalInterest + totalPrincipal + totalCashCPF,
      loanToValueRatio: (selectedLoanAmount / purchasePrice) * 100,
      drawdownSchedule: calculatedDrawdownSchedule,
      firstBankDrawdownMonth,
      timelineCalculated: !!(inputs.otpDate && inputs.topDate)
    };
  };
  
  const handleInputChange = (field, value) => {
    if (['purchasePrice', 'customLoanAmount'].includes(field)) {
      setInputs(prev => ({
        ...prev,
        [field]: parseNumberInput(value)
      }));
    } else if (field === 'rates') {
      setInputs(prev => ({ ...prev, rates: value }));
    } else {
      setInputs(prev => ({ ...prev, [field]: value }));
    }
  };

  React.useEffect(() => {
    setResults(calculateProgressivePayments());
  }, [inputs]);

  // PDF Report generation for Progressive Payment Calculator
  const generateProgressivePaymentReport = () => {
    if (!results) {
      alert('Please calculate the progressive payments first before generating a report.');
      return;
    }

    const currentDate = new Date().toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const timelineInfo = results.timelineCalculated ? 
      `Timeline calculated from ${inputs.otpDate} to ${inputs.topDate}` : 
      'Default timeline estimates used (please provide OTP and TOP dates for accuracy)';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Progressive Payment Schedule - BUC Property</title>
    <style>
        @page { size: A4; margin: 0.4in; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 10px;
            line-height: 1.2;
            color: #333;
            background: white;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
        }
        .header {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 6px;
            border-bottom: 2px solid #1d4ed8;
        }
        .logo-section img { 
            width: 60px !important; 
            height: auto !important; 
            margin: 0 auto 4px; 
            display: block; 
        }
        .property-banner {
            background: #dc2626;
            color: white;
            padding: 6px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            margin: 4px 0;
        }
        .timeline-banner {
            background: ${results.timelineCalculated ? '#059669' : '#d97706'};
            color: white;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 9px;
            margin: 2px 0;
        }
        .report-info { font-size: 8px; color: #666; margin-top: 4px; }
        .section {
            margin: 8px 0;
            padding: 8px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            background: #fafafa;
            break-inside: avoid;
        }
        .section h2 {
            color: #1d4ed8;
            font-size: 12px;
            margin-bottom: 6px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 3px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            margin: 6px 0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
            border-bottom: 1px dotted #ccc;
            font-size: 9px;
        }
        .info-label { font-weight: 600; color: #555; }
        .info-value { font-weight: bold; color: #333; }
        .payment-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7px;
            margin: 6px 0;
        }
        .payment-table th,
        .payment-table td {
            border: 1px solid #ccc;
            padding: 3px 2px;
            text-align: center;
            vertical-align: middle;
        }
        .payment-table th {
            background: #f8f9fa;
            font-weight: bold;
            color: #374151;
            font-size: 7px;
        }
        .payment-table td {
            font-size: 6px;
        }
        .cash-highlight { background: #dbeafe !important; font-weight: bold; }
        .drawdown-highlight { background: #fef3c7 !important; font-weight: bold; }
        .top-highlight { background: #dcfce7 !important; font-weight: bold; }
        .page-break { page-break-before: always; }
        .no-break { page-break-inside: avoid; break-inside: avoid; }
        .compact-section {
            margin: 6px 0;
            padding: 6px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            background: #fafafa;
            break-inside: avoid;
        }
        .disclaimer {
            background: #f8f9fa;
            padding: 6px;
            border-radius: 4px;
            margin: 6px 0;
            font-size: 7px;
            color: #555;
        }
        .footer {
            margin-top: 10px;
            padding-top: 6px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 7px;
        }
        @media print {
            body { font-size: 9px !important; }
            .payment-table { font-size: 6px !important; }
            .payment-table th, .payment-table td { padding: 2px 1px !important; font-size: 6px !important; }
            .logo-section img { width: 60px !important; height: auto !important; }
        }
    </style>
</head>
<body>
    <div class="header no-break">
        <div class="logo-section">
            <img src="https://ik.imagekit.io/hst9jooux/KeyQuest%20Logo.jpeg?updatedAt=1748073687798" alt="KeyQuest Mortgage Logo">
        </div>
        <div class="property-banner">BUC Property - Progressive Payment Schedule</div>
        <div class="timeline-banner">${timelineInfo}</div>
        <div class="report-info">
            <strong>Built Under Construction Payment Analysis</strong><br>
            Generated: ${currentDate} | Report ID: KQM-PPE-${Date.now()}
        </div>
    </div>

    <div class="compact-section no-break">
        <h2>🏗️ PROJECT SUMMARY</h2>
        <div class="info-grid">
            <div>
                <div class="info-row">
                    <span class="info-label">Purchase Price:</span>
                    <span class="info-value">${formatCurrency(results.purchasePrice)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Bank Loan Amount:</span>
                    <span class="info-value">${formatCurrency(results.loanAmount)} (${((results.loanAmount/results.purchasePrice)*100).toFixed(1)}%)</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Cash/CPF Required:</span>
                    <span class="info-value">${formatCurrency(results.totalCashCPF)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Loan Tenure:</span>
                    <span class="info-value">${inputs.tenure} years</span>
                </div>
            </div>
            <div>
                <div class="info-row">
                    <span class="info-label">Total Interest Payable:</span>
                    <span class="info-value">${formatCurrency(results.totalInterest)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total Principal:</span>
                    <span class="info-value">${formatCurrency(results.totalPrincipal)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total Amount Payable:</span>
                    <span class="info-value">${formatCurrency(results.totalPayable)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Timeline Source:</span>
                    <span class="info-value">${results.timelineCalculated ? 'Date-Based' : 'Estimated'}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="compact-section no-break">
        <h2>📅 DRAWDOWN SCHEDULE</h2>
       
        <table class="payment-table">
            <thead>
                <tr>
                    <th>Month</th>
                    <th>Date</th>
                    <th>Construction Stage</th>
                    <th>%</th>
                    <th>Amount</th>
                    <th>Payment Mode</th>
                    <th>Cumulative</th>
                </tr>
            </thead>
            <tbody>
                ${results.stages.map((stage, index) => {
                    const cumulative = results.stages.slice(0, index + 1).reduce((sum, s) => sum + s.stageAmount, 0);
                    const rowClass = stage.isInitial ? 'cash-highlight' : 
                                   stage.isTOP ? 'top-highlight' : 'drawdown-highlight';
                    return `
                    <tr class="${rowClass}">
                        <td>${stage.month}</td>
                        <td style="font-size: 5px;">${stage.actualDate || 'Est.'}</td>
                        <td style="text-align: left; padding-left: 4px;">${stage.stage}</td>
                        <td>${stage.percentage.toFixed(1)}%</td>
                        <td>${formatCurrency(stage.stageAmount)}</td>
                        <td>${stage.paymentMode}</td>
                        <td>${formatCurrency(cumulative)}</td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        
        <div style="margin-top: 4px; font-size: 6px; color: #666;">
            <strong>Legend:</strong> Blue = Cash/CPF | Yellow = Bank Loan Drawdown | Green = TOP Completion
        </div>
    </div>

    <div class="page-break">
        <div class="section">
            <h2>📊 MONTHLY PAYMENT SCHEDULE (First 60 Months)</h2>
            <p style="font-size: 8px; color: #666; margin-bottom: 6px;">
                Bank loan servicing starts from Month ${results.firstBankDrawdownMonth}. 
                Monthly installment recalculated after each drawdown.
            </p>
            <table class="payment-table">
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>Date</th>
                        <th>Opening Balance</th>
                        <th>Drawdown</th>
                        <th>Monthly Payment</th>
                        <th>Interest</th>
                        <th>Principal</th>
                        <th>Ending Balance</th>
                        <th>Rate</th>
                        <th>Mode</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.monthlySchedule.slice(0, 60).map(month => {
                        const rowClass = month.isInitialPayment ? 'cash-highlight' :
                                       month.drawdownAmount > 0 ? 'drawdown-highlight' : '';
                        return `
                        <tr class="${rowClass}">
                            <td>${month.month}</td>
                            <td style="font-size: 5px;">${month.actualDate || 'Est.'}</td>
                            <td>${formatCurrency(month.openingBalance)}</td>
                            <td>${month.drawdownAmount > 0 ? formatCurrency(month.drawdownAmount) : '-'}</td>
                            <td>${month.monthlyPayment > 0 ? formatCurrency(month.monthlyPayment) : '-'}</td>
                            <td>${month.interestPayment > 0 ? formatCurrency(month.interestPayment) : '-'}</td>
                            <td>${month.principalPayment > 0 ? formatCurrency(month.principalPayment) : '-'}</td>
                            <td>${formatCurrency(month.endingBalance)}</td>
                            <td>${month.interestRate.toFixed(1)}%</td>
                            <td style="font-size: 5px;">${month.isInitialPayment ? 'Cash/CPF' :
                                           month.drawdownAmount > 0 ? 'Drawdown' : 'Servicing'}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    </div>

    <div class="disclaimer no-break">
        <h4 style="margin: 0 0 4px 0; color: #333; font-size: 9px;">Important Notes</h4>
        <p style="margin: 2px 0;">• ${results.timelineCalculated ? 
            'Timeline calculated based on actual OTP and TOP dates provided.' : 
            'Default timeline used - provide OTP and TOP dates for accurate calculations.'}</p>
        <p style="margin: 2px 0;">• Monthly payments recalculate automatically after each bank loan drawdown.</p>
        <p style="margin: 2px 0;">• Initial payments (5% + 15%) are typically Cash/CPF before bank loan activation.</p>
        <p style="margin: 2px 0;">• Interest rates may vary based on market conditions and bank packages.</p>
        <p style="margin: 2px 0;">• Consult our specialists for personalized advice and current market rates.</p>
    </div>

    <div class="footer no-break">
        <div style="margin-bottom: 4px;">
            📧 info@keyquestmortgage.sg | 📞 +65 XXXX XXXX | 🌐 www.keyquestmortgage.sg
        </div>
        <div style="border-top: 1px solid #e5e7eb; padding-top: 4px; margin-top: 4px;">
            <p style="margin: 0; font-size: 7px;">This report is confidential and intended for loan assessment purposes. 
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
    }, 1000);

    alert(`Progressive payment schedule report generated successfully!

📄 Timeline Source: ${results.timelineCalculated ? 'Date-Based Calculations' : 'Default Estimates'}
${!results.timelineCalculated ? '\n⚠️  For accurate calculations, please provide both OTP and Expected TOP dates.' : ''}

📄 FOR BEST PDF RESULTS:
- Use Chrome or Edge browser for printing
- In print dialog, select "More settings"
- Set margins to "Minimum" 
- Choose "A4" paper size
- Enable "Background graphics"
- Set scale to "100%"`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-red-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-red-800">BUC Property Details</h3>
            {(!inputs.otpDate || !inputs.topDate) && (
              <div className="bg-yellow-100 p-3 rounded-lg mb-4 border-l-4 border-yellow-500">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Important:</strong> Please provide both OTP and Expected TOP dates for accurate timeline calculations. 
                  Without these dates, default timing estimates will be used.
                </p>
              </div>
            )}

            {(inputs.otpDate && inputs.topDate) && (
              <div className="bg-green-100 p-3 rounded-lg mb-4 border-l-4 border-green-500">
                <p className="text-sm text-green-800">
                  <strong>✓ Timeline Calculated:</strong> Drawdown schedule automatically calculated based on your project timeline 
                  from {new Date(inputs.otpDate).toLocaleDateString('en-SG')} to {new Date(inputs.topDate).toLocaleDateString('en-SG')}.
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Purchase Price (SGD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                  <input
                    type="text"
                    value={formatNumberInput(inputs.purchasePrice)}
                    onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                    className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="2,300,000.00"
                  />
                </div>
              </div>

              <div>
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
                      Custom
                    </label>
                  </div>
                  {inputs.useCustomAmount && (
                    <div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                        <input
                          type="text"
                          value={formatNumberInput(inputs.customLoanAmount)}
                          onChange={(e) => handleInputChange('customLoanAmount', e.target.value)}
                          className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                          placeholder="1,725,000.00"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Loan Tenure (Years)</label>
                  <input
                    type="number"
                    value={inputs.tenure}
                    onChange={(e) => handleInputChange('tenure', parseInt(e.target.value) || 20)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    min="5"
                    max="35"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Outstanding Mortgages</label>
                  <input
                    type="number"
                    value={inputs.numOutstandingMortgages}
                    onChange={(e) => handleInputChange('numOutstandingMortgages', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    min="0"
                    max="5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">OTP Date</label>
                  <input
                    type="date"
                    value={inputs.otpDate}
                    onChange={(e) => handleInputChange('otpDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Expected TOP Date</label>
                  <input
                    type="date"
                    value={inputs.topDate}
                    onChange={(e) => handleInputChange('topDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-blue-800">Variable Interest Rate Package</h3>
                      
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-medium mb-3">Interest Rate Structure</h4>
              <div className="space-y-2">
                {inputs.rates.map((rate, index) => (
                  <div key={index} className="grid grid-cols-3 gap-3 items-center">
                    <div className="text-sm">
                      {rate.year === 'thereafter' ? 'Year 6 onwards' : `Year ${rate.year}`}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={rate.rate}
                        onChange={(e) => {
                          const newRates = [...inputs.rates];
                          newRates[index].rate = parseFloat(e.target.value) || 0;
                          handleInputChange('rates', newRates);
                        }}
                        className="w-full pr-8 pl-3 py-1 border border-gray-300 rounded"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">%</span>
                    </div>
                    <div className="text-xs text-gray-600">{rate.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {results && (
            <>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Cash/CPF Required</p>
                    <p className="font-semibold text-lg">{formatCurrency(results.totalCashCPF)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Bank Loan</p>
                    <p className="font-semibold text-lg">{formatCurrency(results.totalBankLoan)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Interest Payable</p>
                    <p className="font-semibold text-lg text-red-600">{formatCurrency(results.totalInterest)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount Payable</p>
                    <p className="font-semibold text-lg">{formatCurrency(results.totalPayable)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Drawdown Schedule</h3>
                
                {results.timelineCalculated ? (
                  <div className="bg-green-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-green-800">
                      <strong>✓ Date-Based Schedule:</strong> Timeline calculated from OTP to TOP with construction milestones.
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>⚠️ Default Schedule:</strong> Using estimated timeline. Provide OTP and TOP dates for accurate calculations.
                    </p>
                  </div>
                )}
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-center py-2">Month</th>
                        <th className="text-center py-2">Date</th>
                        <th className="text-left py-2">Construction Stage</th>
                        <th className="text-center py-2">%</th>
                        <th className="text-center py-2">Amount</th>
                        <th className="text-center py-2">Payment Mode</th>
                        <th className="text-center py-2">Cumulative</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.stages.map((stage, index) => {
                        const cumulative = results.stages.slice(0, index + 1).reduce((sum, s) => sum + s.stageAmount, 0);
                        return (
                          <tr key={index} className={`border-b hover:bg-gray-50 ${stage.isInitial ? 'bg-blue-50' : stage.isTOP ? 'bg-yellow-50' : 'bg-green-50'}`}>
                            <td className="py-3 text-center font-medium">{stage.month}</td>
                            <td className="py-3 text-center text-xs">{stage.actualDate || 'Est.'}</td>
                            <td className="py-3 text-left">{stage.stage}</td>
                            <td className="py-3 text-center">{stage.percentage.toFixed(1)}%</td>
                            <td className="py-3 text-center font-semibold">{formatCurrency(stage.stageAmount)}</td>
                            <td className="py-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                stage.isInitial ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {stage.paymentMode}
                              </span>
                            </td>
                            <td className="py-3 text-center text-blue-600 font-medium">{formatCurrency(cumulative)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 text-xs text-gray-600">
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-100 rounded"></div>
                      <span>Cash/CPF Payment</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-100 rounded"></div>
                      <span>Bank Loan Drawdown</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-100 rounded"></div>
                      <span>TOP Completion</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Monthly Payment Schedule (First 48 Months)</h3>
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Key Features:</strong> 
                    • Bank loan servicing starts after first drawdown (Month {results.firstBankDrawdownMonth})
                    • Monthly payments recalculate after each subsequent drawdown
                    • Initial payments (blue rows) are Cash/CPF only
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-center py-2">Month</th>
                        <th className="text-center py-2">Date</th>
                        <th className="text-center py-2">Opening Balance</th>
                        <th className="text-center py-2">Drawdown</th>
                        <th className="text-center py-2">Monthly Payment</th>
                        <th className="text-center py-2">Interest</th>
                        <th className="text-center py-2">Principal</th>
                        <th className="text-center py-2">Ending Balance</th>
                        <th className="text-center py-2">Rate</th>
                        <th className="text-center py-2">Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.monthlySchedule.slice(0, 48).map((month, index) => (
                        <tr key={index} className={`border-b hover:bg-gray-50 ${
                          month.isInitialPayment ? 'bg-blue-50' : 
                          month.drawdownAmount > 0 ? 'bg-yellow-100' : ''
                        }`}>
                          <td className="py-2 text-center font-medium">{month.month}</td>
                          <td className="py-2 text-center text-xs">{month.actualDate || 'Est.'}</td>
                          <td className="py-2 text-center">{formatCurrency(month.openingBalance)}</td>
                          <td className="py-2 text-center">
                            {month.drawdownAmount > 0 ? (
                              <span className="text-green-600 font-medium">
                                {formatCurrency(month.drawdownAmount)}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-2 text-center font-semibold text-blue-600">
                            {month.monthlyPayment > 0 ? formatCurrency(month.monthlyPayment) : '-'}
                          </td>
                          <td className="py-2 text-center">
                            {month.interestPayment > 0 ? formatCurrency(month.interestPayment) : '-'}
                          </td>
                          <td className="py-2 text-center">
                            {month.principalPayment > 0 ? formatCurrency(month.principalPayment) : '-'}
                          </td>
                          <td className="py-2 text-center">{formatCurrency(month.endingBalance)}</td>
                          <td className="py-2 text-center">{month.interestRate.toFixed(2)}%</td>
                          <td className="py-2 text-center">
                            <span className={`px-1 py-0.5 rounded text-xs ${
                              month.isInitialPayment ? 'bg-blue-100 text-blue-800' :
                              month.drawdownAmount > 0 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {month.isInitialPayment ? 'Cash/CPF' :
                               month.drawdownAmount > 0 ? 'Drawdown' : 'Servicing'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 text-xs text-gray-600">
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-100 rounded"></div>
                      <span>Cash/CPF Month</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-100 rounded"></div>
                      <span>Drawdown Month</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-gray-100 rounded"></div>
                      <span>Regular Servicing</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={generateProgressivePaymentReport}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                Generate Progressive Payment Report (PDF)
              </button>
              <p className="text-sm text-gray-500 text-center">
                Detailed BUC property payment schedule
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressivePaymentCalculator;
