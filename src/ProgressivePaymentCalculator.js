import React, { useState } from 'react';
import { Download, BarChart3, Calendar, TrendingUp, DollarSign, Building, Info } from 'lucide-react';

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

  // Define construction stages with their weights (from Excel DDcal sheet)
  const getConstructionStages = () => {
    return [
      { 
        stage: 'Upon grant of Option to Purchase', 
        percentage: 5, 
        weight: 0, // Not part of construction weight calculation
        isCashCPFOnly: true,
        isInitial: true,
        fixedTime: 1 // Fixed at month 1
      },
      { 
        stage: 'Upon signing S&P Agreement (within 8 weeks from OTP)', 
        percentage: 15, 
        weight: 0, // Not part of construction weight calculation
        isCashCPFOnly: true,
        isInitial: true,
        fixedTime: 1 // Fixed 1 month after OTP (month 2)
      },
      { 
        stage: 'Completion of foundation work', 
        percentage: 10, 
        weight: 0.1, // 10% weight in construction (C13 in Excel)
        isCashCPFOnly: false 
      },
      { 
        stage: 'Completion of reinforced concrete framework of unit', 
        percentage: 10, 
        weight: 0.1, // 10% weight in construction (C14 in Excel)
        isCashCPFOnly: false 
      },
      { 
        stage: 'Completion of partition walls of unit', 
        percentage: 5, 
        weight: 0.05, // 5% weight in construction (C15 in Excel)
        isCashCPFOnly: false 
      },
      { 
        stage: 'Completion of roofing/ceiling of unit', 
        percentage: 5, 
        weight: 0.05, // 5% weight in construction (C16 in Excel)
        isCashCPFOnly: false 
      },
      { 
        stage: 'Completion of door sub-frames/ door frames, window frames, electrical wiring, internal plastering and plumbing of unit', 
        percentage: 5, 
        weight: 0.05, // 5% weight in construction (C17 in Excel)
        isCashCPFOnly: false 
      },
      { 
        stage: 'Completion of car park, roads and drains serving the housing project', 
        percentage: 5, 
        weight: 0.05, // 5% weight in construction (C18 in Excel)
        isCashCPFOnly: false 
      },
      { 
        stage: 'Temporary Occupation Permit (TOP)', 
        percentage: 25, 
        weight: 0, // TOP happens at end of construction
        isCashCPFOnly: false,
        isTOP: true,
        fixedTime: 0 // No additional time for TOP
      },
      { 
        stage: 'Certificate of Statutory Completion', 
        percentage: 15, 
        weight: 0, // CSC is 12 months after TOP
        isCashCPFOnly: false,
        isCSC: true,
        fixedTime: 12 // Always 12 months after TOP
      }
    ];
  };

  // Calculate dynamic estimated times based on OTP and TOP dates (Excel logic)
  const calculateEstimatedTimes = () => {
    // If user provides both OTP and TOP dates, calculate based on timeline
    if (inputs.otpDate && inputs.topDate) {
      const otpDate = new Date(inputs.otpDate);
      const topDate = new Date(inputs.topDate);
      
      // Calculate months between OTP and TOP
      const monthsDiff = (topDate.getFullYear() - otpDate.getFullYear()) * 12 + 
                         (topDate.getMonth() - otpDate.getMonth());
      
      // Total construction time = TOP_date - OTP_time - S&P_time
      // Following Excel formula: J5 = monthsDiff - 1 - 1 (subtract OTP and S&P times)
      const totalConstructionTime = Math.max(24, monthsDiff - 2); // At least 24 months construction
      
      return calculateConstructionEstimatedTimes(totalConstructionTime);
    } else {
      // Use default construction time (37 months as in Excel example)
      const defaultConstructionTime = 37;
      return calculateConstructionEstimatedTimes(defaultConstructionTime);
    }
  };

  // Calculate individual stage estimated times using Excel formula logic
  const calculateConstructionEstimatedTimes = (totalConstructionTime) => {
    const stages = getConstructionStages();
    
    // Calculate total weight for construction stages only (SUM(C13:C18) in Excel)
    const constructionStages = stages.filter(stage => stage.weight > 0);
    const totalWeight = constructionStages.reduce((sum, stage) => sum + stage.weight, 0);
    
    return stages.map(stage => {
      let estimatedTime;
      
      if (stage.fixedTime !== undefined) {
        // Fixed time stages (OTP, S&P, TOP, CSC)
        estimatedTime = stage.fixedTime;
      } else if (stage.weight > 0) {
        // Construction stages use Excel formula: ROUNDUP(totalTime * (weight/totalWeight), 0)
        estimatedTime = Math.ceil(totalConstructionTime * (stage.weight / totalWeight));
      } else {
        estimatedTime = 0;
      }
      
      return {
        ...stage,
        estimatedTime
      };
    });
  };

  // Calculate the complete payment schedule (cash/CPF + bank loan breakdown)
  const calculateCompletePaymentSchedule = () => {
    const purchasePrice = parseNumberInput(inputs.purchasePrice) || 0;
    
    // Calculate selected loan amount
    let selectedLoanAmount;
    if (inputs.useCustomAmount) {
      selectedLoanAmount = parseNumberInput(inputs.customLoanAmount) || 0;
    } else {
      selectedLoanAmount = purchasePrice * (inputs.loanPercentage / 100);
    }

    if (purchasePrice <= 0 || selectedLoanAmount <= 0) return null;

    // Get construction stages with dynamic estimated times
    const constructionStagesWithTimes = calculateEstimatedTimes();
    const totalCashCPFRequired = purchasePrice - selectedLoanAmount;
    
    // Calculate actual months for each stage using cumulative logic
    let cumulativeMonth = 1;
    let topMonth = 1; // Track TOP month for CSC calculation
    
    const stagesWithTiming = constructionStagesWithTimes.map((stage, index) => {
      if (index === 0) {
        // OTP stage starts at month 1
        cumulativeMonth = 1;
      } else if (index === 1) {
        // S&P Agreement at month 2 (fixed)
        cumulativeMonth = 2;
      } else if (stage.isTOP) {
        // TOP happens at current cumulative month (don't add time)
        topMonth = cumulativeMonth; // Store TOP month for CSC calculation
      } else if (stage.isCSC) {
        // CSC is always 12 months after TOP
        cumulativeMonth = topMonth + 12;
      } else {
        // Construction stages: add estimated time to get next stage month
        cumulativeMonth += stage.estimatedTime;
      }
      
      return {
        ...stage,
        month: cumulativeMonth,
        stageAmount: purchasePrice * (stage.percentage / 100)
      };
    });

    // Calculate cash/CPF vs bank loan allocation for each stage
    let runningCashCPFAllocated = 0;
    let totalCashCPF = 0;
    let totalBankLoan = 0;
    
    const completeSchedule = stagesWithTiming.map(stage => {
      let cashCPFAmount = 0;
      let bankLoanAmount = 0;
      
      if (stage.isCashCPFOnly) {
        // OTP and S&P stages are cash/CPF only
        cashCPFAmount = stage.stageAmount;
        bankLoanAmount = 0;
      } else {
        // For construction stages, allocate remaining cash/CPF first, then bank loan
        const remainingCashCPFNeeded = Math.max(0, totalCashCPFRequired - runningCashCPFAllocated);
        
        if (remainingCashCPFNeeded > 0) {
          cashCPFAmount = Math.min(stage.stageAmount, remainingCashCPFNeeded);
          bankLoanAmount = stage.stageAmount - cashCPFAmount;
        } else {
          cashCPFAmount = 0;
          bankLoanAmount = stage.stageAmount;
        }
      }
      
      runningCashCPFAllocated += cashCPFAmount;
      totalCashCPF += cashCPFAmount;
      totalBankLoan += bankLoanAmount;
      
      return {
        ...stage,
        cashCPFAmount,
        bankLoanAmount
      };
    });

    return {
      stages: completeSchedule,
      totalCashCPF,
      totalBankLoan,
      selectedLoanAmount,
      purchasePrice
    };
  };

  // Generate bank loan drawdown schedule (ONLY bank loan portions with actual amounts)
  const generateBankLoanDrawdownSchedule = (completeSchedule) => {
    if (!completeSchedule) return [];
    
    // Filter only stages that have ACTUAL bank loan components (amount > 0)
    const bankDrawdownStages = completeSchedule.stages
      .filter(stage => stage.bankLoanAmount > 0);

    if (bankDrawdownStages.length === 0) return [];

    // Create bank loan drawdown schedule with separate bank loan month numbering
    const bankLoanSchedule = [];
    let bankLoanMonth = 1; // Bank loan month starts from 1

    bankDrawdownStages.forEach((stage, index) => {
      if (index === 0) {
        // First bank loan drawdown is always Bank Loan Month 1
        bankLoanSchedule.push({
          projectMonth: stage.month,
          bankLoanMonth: bankLoanMonth,
          stage: stage.stage,
          bankLoanAmount: stage.bankLoanAmount,
          estimatedTime: stage.estimatedTime
        });
      } else {
        // For subsequent drawdowns, increment bank loan month based on estimated time
        bankLoanMonth += bankDrawdownStages[index - 1].estimatedTime || 1;
        
        // Special handling for CSC - it should be 12 months after TOP in bank loan timeline
        if (stage.isCSC) {
          const topStage = bankDrawdownStages.find(s => s.isTOP);
          if (topStage) {
            const topBankLoanMonth = bankLoanSchedule.find(s => s.stage === topStage.stage)?.bankLoanMonth || 1;
            bankLoanMonth = topBankLoanMonth + 12;
          }
        }
        
        bankLoanSchedule.push({
          projectMonth: stage.month,
          bankLoanMonth: bankLoanMonth,
          stage: stage.stage,
          bankLoanAmount: stage.bankLoanAmount,
          estimatedTime: stage.estimatedTime
        });
      }
    });

    return bankLoanSchedule;
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

  // Get interest rate for specific month (from loan start)
  const getInterestRateForMonth = (monthsFromLoanStart) => {
    const yearIndex = Math.ceil(monthsFromLoanStart / 12);
    
    if (yearIndex <= 5) {
      const rateInfo = inputs.rates.find(r => r.year === yearIndex);
      return rateInfo ? rateInfo.rate : inputs.rates[0].rate;
    } else {
      const thereafterRate = inputs.rates.find(r => r.year === 'thereafter');
      return thereafterRate ? thereafterRate.rate : inputs.rates[inputs.rates.length - 1].rate;
    }
  };

  // Main progressive payment calculation
  const calculateProgressivePayments = () => {
    const completeSchedule = calculateCompletePaymentSchedule();
    if (!completeSchedule) return null;

    const bankDrawdownSchedule = generateBankLoanDrawdownSchedule(completeSchedule);
    
    if (bankDrawdownSchedule.length === 0) {
      // No bank loan drawdowns (100% cash/CPF)
      return {
        ...completeSchedule,
        bankDrawdownSchedule: [],
        monthlySchedule: [],
        totalInterest: 0,
        totalPrincipal: 0,
        totalPayable: completeSchedule.totalCashCPF,
        firstBankDrawdownMonth: null,
        timelineCalculated: !!(inputs.otpDate && inputs.topDate),
        yearlyInterest: { year1: 0, year2: 0, year3: 0, year4: 0 }
      };
    }

    // Generate bank loan servicing schedule (separate from project timeline)
    const monthlySchedule = [];
    const totalMonths = inputs.tenure * 12;
    let outstandingBalance = 0;
    let cumulativeBankLoanDrawdown = 0;
    let currentMonthlyPayment = 0;
    
    // Find the maximum bank loan month to determine schedule length
    const maxBankLoanMonth = Math.max(...bankDrawdownSchedule.map(d => d.bankLoanMonth));
    const scheduleLength = Math.max(totalMonths, maxBankLoanMonth);

    // Generate bank loan servicing schedule (starts from month 1)
    let previousRate = 0;
    
    for (let bankLoanMonth = 1; bankLoanMonth <= scheduleLength; bankLoanMonth++) {
      // Check if there's a bank loan drawdown this month
      const drawdown = bankDrawdownSchedule.find(d => d.bankLoanMonth === bankLoanMonth);
      const bankLoanDrawdownAmount = drawdown ? drawdown.bankLoanAmount : 0;
      
      // Get current interest rate
      const currentRate = getInterestRateForMonth(bankLoanMonth);
      
      // Add bank loan drawdown to outstanding balance FIRST (happens at start of month)
      if (bankLoanDrawdownAmount > 0) {
        outstandingBalance += bankLoanDrawdownAmount;
        cumulativeBankLoanDrawdown += bankLoanDrawdownAmount;
      }
      
      // Recalculate monthly payment if:
      // 1. There's a new drawdown, OR
      // 2. Interest rate has changed from previous month, OR
      // 3. This is the first month with outstanding balance
      const rateChanged = currentRate !== previousRate;
      const shouldRecalculate = bankLoanDrawdownAmount > 0 || rateChanged || (bankLoanMonth === 1 && outstandingBalance > 0);
      
      if (shouldRecalculate && outstandingBalance > 0) {
        const remainingMonths = Math.max(1, totalMonths - bankLoanMonth + 1);
        currentMonthlyPayment = calculatePMT(currentRate, remainingMonths, outstandingBalance);
      }
      
      // Store opening balance (after any drawdown)
      const openingBalance = outstandingBalance;
      
      // Calculate loan servicing for this month
      let monthlyPayment = 0;
      let interestPayment = 0;
      let principalPayment = 0;
      
      if (outstandingBalance > 0) {
        const monthlyRate = currentRate / 100 / 12;
        
        // Interest payment on outstanding balance (including any drawdown for this month)
        interestPayment = outstandingBalance * monthlyRate;
        
        // Use current monthly payment
        monthlyPayment = currentMonthlyPayment || 0;
        
        // Principal payment
        principalPayment = Math.max(0, monthlyPayment - interestPayment);
        
        // Ensure principal doesn't exceed outstanding balance
        if (principalPayment > outstandingBalance) {
          principalPayment = outstandingBalance;
          monthlyPayment = principalPayment + interestPayment;
        }
        
        // Update outstanding balance AFTER payment
        outstandingBalance = Math.max(0, outstandingBalance - principalPayment);
      }
      
      // Update previous rate for next iteration
      previousRate = currentRate;
      
      // Calculate year for interest rate display
      const year = Math.ceil(bankLoanMonth / 12);
      
      monthlySchedule.push({
        month: bankLoanMonth,
        year: year,
        openingBalance: openingBalance,
        drawdownAmount: bankLoanDrawdownAmount,
        cumulativeDrawdown: cumulativeBankLoanDrawdown,
        monthlyPayment: monthlyPayment,
        interestPayment: interestPayment,
        principalPayment: principalPayment,
        endingBalance: outstandingBalance,
        interestRate: currentRate,
        hasBankDrawdown: bankLoanDrawdownAmount > 0
      });
      
      // Stop if loan is fully paid and all drawdowns completed
      if (outstandingBalance <= 0.01 && cumulativeBankLoanDrawdown >= completeSchedule.totalBankLoan) {
        break;
      }
    }

    // Calculate totals
    const totalInterest = monthlySchedule.reduce((sum, month) => sum + (month.interestPayment || 0), 0);
    const totalPrincipal = monthlySchedule.reduce((sum, month) => sum + (month.principalPayment || 0), 0);
    
    // Calculate yearly interest breakdown
    const yearlyInterest = {
      year1: monthlySchedule.filter(m => m.year === 1).reduce((sum, month) => sum + (month.interestPayment || 0), 0),
      year2: monthlySchedule.filter(m => m.year === 2).reduce((sum, month) => sum + (month.interestPayment || 0), 0),
      year3: monthlySchedule.filter(m => m.year === 3).reduce((sum, month) => sum + (month.interestPayment || 0), 0),
      year4: monthlySchedule.filter(m => m.year === 4).reduce((sum, month) => sum + (month.interestPayment || 0), 0)
    };
    
    // Create display stages with payment mode information (for project timeline)
    const displayStages = completeSchedule.stages.map(stage => {
      let paymentMode;
      if (stage.cashCPFAmount > 0 && stage.bankLoanAmount > 0) {
        const cashCPFPercentage = ((stage.cashCPFAmount / completeSchedule.purchasePrice) * 100).toFixed(1);
        const bankLoanPercentage = ((stage.bankLoanAmount / completeSchedule.purchasePrice) * 100).toFixed(1);
        paymentMode = `Cash/CPF (${cashCPFPercentage}%) + Bank Loan (${bankLoanPercentage}%)`;
      } else if (stage.cashCPFAmount > 0) {
        paymentMode = 'Cash/CPF';
      } else {
        paymentMode = 'Bank Loan';
      }
      
      return {
        stage: stage.stage,
        percentage: stage.percentage,
        stageAmount: stage.stageAmount,
        bankLoanAmount: stage.bankLoanAmount,
        cashCPFAmount: stage.cashCPFAmount,
        paymentMode,
        month: stage.month, // Project timeline month
        isInitial: stage.isInitial || false,
        isTOP: stage.isTOP || false,
        isCSC: stage.isCSC || false
      };
    });

    return {
      stages: displayStages,
      monthlySchedule,
      bankDrawdownSchedule,
      purchasePrice: completeSchedule.purchasePrice,
      loanAmount: completeSchedule.selectedLoanAmount,
      totalCashCPF: completeSchedule.totalCashCPF,
      totalBankLoan: completeSchedule.totalBankLoan,
      totalInterest,
      totalPrincipal,
      totalPayable: totalInterest + totalPrincipal + completeSchedule.totalCashCPF,
      loanToValueRatio: (completeSchedule.selectedLoanAmount / completeSchedule.purchasePrice) * 100,
      firstBankDrawdownMonth: bankDrawdownSchedule.length > 0 ? 1 : null,
      timelineCalculated: !!(inputs.otpDate && inputs.topDate),
      yearlyInterest
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
            width: 80px !important; 
            height: auto !important; 
            margin: 0 auto 6px; 
            display: block; 
        }
        .property-banner {
            background: #dc2626;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: bold;
            margin: 6px 0;
        }
        .timeline-banner {
            background: ${results.timelineCalculated ? '#059669' : '#d97706'};
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 10px;
            margin: 4px 0;
        }
        .report-info { font-size: 9px; color: #666; margin-top: 6px; }
        .section {
            margin: 10px 0;
            padding: 10px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            background: #fafafa;
            break-inside: avoid;
        }
        .section h2 {
            color: #1d4ed8;
            font-size: 13px;
            margin-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 4px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin: 8px 0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            border-bottom: 1px dotted #ccc;
            font-size: 9px;
        }
        .info-label { font-weight: 600; color: #555; }
        .info-value { font-weight: bold; color: #333; }
        .payment-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
            margin: 8px 0;
        }
        .payment-table th,
        .payment-table td {
            border: 1px solid #ccc;
            padding: 4px 3px;
            text-align: center;
            vertical-align: middle;
        }
        .payment-table th {
            background: #f8f9fa;
            font-weight: bold;
            color: #374151;
            font-size: 8px;
        }
        .payment-table td {
            font-size: 7px;
        }
        .cash-highlight { background: #dbeafe !important; font-weight: bold; }
        .drawdown-highlight { background: #fef3c7 !important; font-weight: bold; }
        .top-highlight { background: #dcfce7 !important; font-weight: bold; }
        .csc-highlight { background: #f3e8ff !important; font-weight: bold; }
        .page-break { page-break-before: always; }
        .no-break { page-break-inside: avoid; break-inside: avoid; }
        .disclaimer {
            background: #f8f9fa;
            padding: 8px;
            border-radius: 4px;
            margin: 8px 0;
            font-size: 8px;
            color: #555;
        }
        .footer {
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 8px;
        }
        @media print {
            body { font-size: 9px !important; }
            .payment-table { font-size: 7px !important; }
            .payment-table th, .payment-table td { padding: 3px 2px !important; font-size: 7px !important; }
            .logo-section img { width: 80px !important; height: auto !important; }
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

    <div class="section no-break">
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
                    <span class="info-label">1st Year Interest:</span>
                    <span class="info-value">${formatCurrency(results.yearlyInterest.year1)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">2nd Year Interest:</span>
                    <span class="info-value">${formatCurrency(results.yearlyInterest.year2)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">3rd Year Interest:</span>
                    <span class="info-value">${formatCurrency(results.yearlyInterest.year3)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">4th Year Interest:</span>
                    <span class="info-value">${formatCurrency(results.yearlyInterest.year4)}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="section no-break">
        <h2>📅 CONSTRUCTION PAYMENT SCHEDULE</h2>
       
        <table class="payment-table">
            <thead>
                <tr>
                    <th>Project Month</th>
                    <th>Construction Stage</th>
                    <th>%</th>
                    <th>Total Amount</th>
                    <th>Cash/CPF</th>
                    <th>Bank Loan</th>
                    <th>Payment Mode</th>
                </tr>
            </thead>
            <tbody>
                ${results.stages.map((stage) => {
                    const rowClass = stage.isInitial ? 'cash-highlight' : 
                                   stage.isTOP ? 'top-highlight' : 
                                   stage.isCSC ? 'csc-highlight' : 'drawdown-highlight';
                    return `
                    <tr class="${rowClass}">
                        <td>${stage.month}</td>
                        <td style="text-align: left; padding-left: 4px;">${stage.stage}</td>
                        <td>${stage.percentage.toFixed(1)}%</td>
                        <td>${formatCurrency(stage.stageAmount)}</td>
                        <td>${stage.cashCPFAmount > 0 ? formatCurrency(stage.cashCPFAmount) : '-'}</td>
                        <td>${stage.bankLoanAmount > 0 ? formatCurrency(stage.bankLoanAmount) : '-'}</td>
                        <td style="font-size: 6px;">${stage.paymentMode}</td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    </div>

    ${results.bankDrawdownSchedule.length > 0 ? `
    <div class="section no-break">
        <h2>🏦 BANK LOAN DRAWDOWN SCHEDULE</h2>
        <p style="font-size: 9px; color: #666; margin-bottom: 8px;">
            Bank loan servicing timeline (separate from project timeline). CSC is 12 months after TOP in bank loan schedule.
        </p>
        <table class="payment-table">
            <thead>
                <tr>
                    <th>Project Month</th>
                    <th>Bank Loan Month</th>
                    <th>Construction Stage</th>
                    <th>Bank Loan Amount</th>
                </tr>
            </thead>
            <tbody>
                ${results.bankDrawdownSchedule.map((drawdown, index) => {
                    const rowClass = drawdown.stage.includes('Certificate of Statutory Completion') ? 'csc-highlight' : 
                                   drawdown.stage.includes('TOP') ? 'top-highlight' : 'drawdown-highlight';
                    return `
                    <tr class="${rowClass}">
                        <td>${drawdown.projectMonth}</td>
                        <td><strong>${drawdown.bankLoanMonth}</strong></td>
                        <td style="text-align: left; padding-left: 4px;">${drawdown.stage}</td>
                        <td>${formatCurrency(drawdown.bankLoanAmount)}</td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    <div class="page-break">
        <div class="section">
            <h2>📊 MONTHLY PAYMENT SCHEDULE (First 60 Months)</h2>
            <p style="font-size: 9px; color: #666; margin-bottom: 8px;">
                ${results.firstBankDrawdownMonth ? 
                  `Bank loan servicing starts from Month ${results.firstBankDrawdownMonth}. Monthly installment recalculates after each drawdown AND when interest rates change.` : 
                  'No bank loan drawdowns - 100% Cash/CPF payment.'}
            </p>
            <table class="payment-table">
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>Opening Balance</th>
                        <th>Bank Drawdown</th>
                        <th>Monthly Payment</th>
                        <th>Interest</th>
                        <th>Principal</th>
                        <th>Ending Balance</th>
                        <th>Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.monthlySchedule.slice(0, 60).map(month => {
                        const rowClass = month.drawdownAmount > 0 ? 'drawdown-highlight' : '';
                        return `
                        <tr class="${rowClass}">
                            <td>${month.month}</td>
                            <td>${formatCurrency(month.openingBalance)}</td>
                            <td>${month.drawdownAmount > 0 ? formatCurrency(month.drawdownAmount) : '-'}</td>
                            <td>${month.monthlyPayment > 0 ? formatCurrency(month.monthlyPayment) : '-'}</td>
                            <td>${month.interestPayment > 0 ? formatCurrency(month.interestPayment) : '-'}</td>
                            <td>${month.principalPayment > 0 ? formatCurrency(month.principalPayment) : '-'}</td>
                            <td>${formatCurrency(month.endingBalance)}</td>
                            <td>${month.interestRate > 0 ? month.interestRate.toFixed(1) + '%' : '-'}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    </div>

    <div class="disclaimer no-break">
        <h4 style="margin: 0 0 6px 0; color: #333; font-size: 10px;">Important Notes</h4>
        <p style="margin: 3px 0;">• Bank loan drawdown schedule uses separate timeline from project construction schedule.</p>
        <p style="margin: 3px 0;">• Certificate of Statutory Completion (CSC) is always 12 months after TOP in bank loan timeline.</p>
        <p style="margin: 3px 0;">• Monthly payments recalculate automatically after each bank loan drawdown AND when interest rates change.</p>
        <p style="margin: 3px 0;">• Construction stage timing calculated using Excel formula: ROUNDUP(TotalTime × (Weight/SumWeights), 0).</p>
        <p style="margin: 3px 0;">• Initial payments (OTP + S&P) are Cash/CPF only before bank loan activation.</p>
        <p style="margin: 3px 0;">• Interest rates may vary based on market conditions and bank packages.</p>
    </div>

    <div class="footer no-break">
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

✅ Updated Features:
• Yearly interest breakdown (1st-4th year) included
• Date columns removed from all tables
• Streamlined Bank Loan Drawdown Schedule
• Month 1 opening balance correctly set to first drawdown amount
• Legends removed from all tables

📄 FOR BEST PDF RESULTS:
- Use Chrome or Edge browser for printing
- In print dialog, select "More settings"
- Set margins to "Minimum" 
- Choose "A4" paper size
- Enable "Background graphics"
- Set scale to "100%"`);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enhanced Input Section */}
        <div className="space-y-6">
          {/* Project Information Card */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-xl border border-red-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-800">BUC Property Details</h3>
                <p className="text-sm text-red-600">Built Under Construction Timeline</p>
              </div>
            </div>

            {/* Timeline Status Alert */}
            {(!inputs.otpDate || !inputs.topDate) && (
              <div className="bg-yellow-100 p-4 rounded-lg mb-4 border-l-4 border-yellow-500">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">⚠️ Timeline Configuration Required</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Please provide both OTP and Expected TOP dates for accurate construction timeline calculations. 
                      Without these dates, default timing estimates will be used.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(inputs.otpDate && inputs.topDate) && (
              <div className="bg-green-100 p-4 rounded-lg mb-4 border-l-4 border-green-500">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-800 font-medium">✓ Timeline Calculated Successfully</p>
                    <p className="text-sm text-green-700 mt-1">
                      Construction stages and estimated times calculated using Excel formula logic based on your project timeline 
                      from <strong>{new Date(inputs.otpDate).toLocaleDateString('en-SG')}</strong> to <strong>{new Date(inputs.topDate).toLocaleDateString('en-SG')}</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Purchase Price (SGD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                  <input
                    type="text"
                    value={formatNumberInput(inputs.purchasePrice)}
                    onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                    className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="2,300,000.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 text-gray-700">Loan Amount Options</label>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
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
                      <div className="text-center w-full">
                        <div className="font-medium">75%</div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency((parseNumberInput(inputs.purchasePrice) || 0) * 0.75)}
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
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
                      <div className="text-center w-full">
                        <div className="font-medium">55%</div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency((parseNumberInput(inputs.purchasePrice) || 0) * 0.55)}
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="loanOption"
                        checked={inputs.useCustomAmount}
                        onChange={() => handleInputChange('useCustomAmount', true)}
                        className="mr-2"
                      />
                      <div className="text-center w-full">
                        <div className="font-medium">Custom</div>
                        <div className="text-xs text-gray-500">Amount</div>
                      </div>
                    </label>
                  </div>
                  
                  {inputs.useCustomAmount && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium mb-1 text-gray-700">Custom Loan Amount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SGD</span>
                        <input
                          type="text"
                          value={formatNumberInput(inputs.customLoanAmount)}
                          onChange={(e) => handleInputChange('customLoanAmount', e.target.value)}
                          className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="1,725,000.00"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Loan Tenure</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={inputs.tenure}
                      onChange={(e) => handleInputChange('tenure', parseInt(e.target.value) || 20)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      min="5"
                      max="35"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">years</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Outstanding Mortgages</label>
                  <input
                    type="number"
                    value={inputs.numOutstandingMortgages}
                    onChange={(e) => handleInputChange('numOutstandingMortgages', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    min="0"
                    max="5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">OTP Date</label>
                  <input
                    type="date"
                    value={inputs.otpDate}
                    onChange={(e) => handleInputChange('otpDate', e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Expected TOP Date</label>
                  <input
                    type="date"
                    value={inputs.topDate}
                    onChange={(e) => handleInputChange('topDate', e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Interest Rate Configuration */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-800">Variable Interest Rate Package</h3>
                <p className="text-sm text-blue-600">Progressive rate structure</p>
              </div>
            </div>
                      
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <h4 className="font-medium mb-3 text-gray-700">Interest Rate Structure</h4>
              <div className="space-y-3">
                {inputs.rates.map((rate, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 items-center">
                    <div className="text-sm font-medium text-gray-600">
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
                        className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">%</span>
                    </div>
                    <div className="text-xs text-gray-500">{rate.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Excel Formula Information */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Info className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-purple-800">Calculation Logic</h3>
                <p className="text-sm text-purple-600">Excel-based formula implementation</p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-gray-700">
              <div className="bg-white p-3 rounded-lg border border-purple-100">
                <p className="font-medium text-purple-700">Construction Stage Timing:</p>
                <p className="text-xs mt-1">ROUNDUP(TotalTime × (StageWeight ÷ SumAllWeights), 0)</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-purple-100">
                <p className="font-medium text-purple-700">CSC Timing:</p>
                <p className="text-xs mt-1">Always 12 months after TOP in bank loan timeline</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-purple-100">
                <p className="font-medium text-purple-700">Bank Loan Schedule:</p>
                <p className="text-xs mt-1">Separate timeline from project construction schedule</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Results Section */}
        <div className="space-y-6">
          {results && (
            <>
              {/* Updated Summary Cards - Replace Interest Payable & Total Payable with Yearly Interest */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600 font-medium">Cash/CPF Required</p>
                      <p className="text-xl font-bold text-green-700">{formatCurrency(results.totalCashCPF)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Bank Loan</p>
                      <p className="text-xl font-bold text-blue-700">{formatCurrency(results.totalBankLoan)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-8 h-8 text-orange-600" />
                    <div>
                      <p className="text-sm text-orange-600 font-medium">1st Yr Interest</p>
                      <p className="text-xl font-bold text-orange-700">{formatCurrency(results.yearlyInterest.year1)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Building className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-purple-600 font-medium">2nd Yr Interest</p>
                      <p className="text-xl font-bold text-purple-700">{formatCurrency(results.yearlyInterest.year2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Yearly Interest Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-xl border border-pink-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-pink-600" />
                    <div>
                      <p className="text-sm text-pink-600 font-medium">3rd Yr Interest</p>
                      <p className="text-xl font-bold text-pink-700">{formatCurrency(results.yearlyInterest.year3)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-indigo-600" />
                    <div>
                      <p className="text-sm text-indigo-600 font-medium">4th Yr Interest</p>
                      <p className="text-xl font-bold text-indigo-700">{formatCurrency(results.yearlyInterest.year4)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Construction Payment Schedule - Remove Date Column */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold mb-2">Construction Payment Schedule</h3>
                  
                  <div className={`p-3 rounded-lg mb-4 ${results.timelineCalculated ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <p className={`text-sm ${results.timelineCalculated ? 'text-green-800' : 'text-yellow-800'}`}>
                      <strong>{results.timelineCalculated ? '✓ Excel Formula Implementation:' : '⚠️ Default Timeline:'}</strong> Construction stage timing calculated using ROUNDUP formula with proportional weight distribution.
                      {results.timelineCalculated ? ' Timeline based on your OTP and TOP dates.' : ' Please provide OTP and TOP dates for accurate calculations.'}
                    </p>
                  </div>
                </div>
                
                <div className="p-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-center py-3 font-medium text-gray-700">Project Month</th>
                        <th className="text-left py-3 font-medium text-gray-700">Construction Stage</th>
                        <th className="text-center py-3 font-medium text-gray-700">%</th>
                        <th className="text-center py-3 font-medium text-gray-700">Total Amount</th>
                        <th className="text-center py-3 font-medium text-gray-700">Cash/CPF</th>
                        <th className="text-center py-3 font-medium text-gray-700">Bank Loan</th>
                        <th className="text-center py-3 font-medium text-gray-700">Payment Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.stages.map((stage, index) => (
                        <tr key={index} className={`border-b hover:bg-gray-50 transition-colors ${
                          stage.isInitial ? 'bg-blue-50' : 
                          stage.isTOP ? 'bg-green-50' : 
                          stage.isCSC ? 'bg-purple-50' : 
                          stage.bankLoanAmount > 0 ? 'bg-yellow-50' : 'bg-gray-50'
                        }`}>
                          <td className="py-4 text-center font-medium">{stage.month}</td>
                          <td className="py-4 text-left">{stage.stage}</td>
                          <td className="py-4 text-center">{stage.percentage.toFixed(1)}%</td>
                          <td className="py-4 text-center font-semibold">{formatCurrency(stage.stageAmount)}</td>
                          <td className="py-4 text-center">
                            {stage.cashCPFAmount > 0 ? formatCurrency(stage.cashCPFAmount) : '-'}
                          </td>
                          <td className="py-4 text-center">
                            {stage.bankLoanAmount > 0 ? (
                              <span className="text-green-600 font-medium">
                                {formatCurrency(stage.bankLoanAmount)}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              stage.isInitial ? 'bg-blue-100 text-blue-800' : 
                              stage.isTOP ? 'bg-green-100 text-green-800' :
                              stage.isCSC ? 'bg-purple-100 text-purple-800' :
                              stage.bankLoanAmount > 0 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {stage.paymentMode}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bank Loan Drawdown Schedule - Remove Columns */}
              {results.bankDrawdownSchedule.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold mb-2">Bank Loan Drawdown Schedule</h3>
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Separate Bank Loan Timeline:</strong> Shows only stages with actual bank loan amounts. 
                        Certificate of Statutory Completion (CSC) correctly positioned 12 months after TOP in bank loan schedule.
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-6 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-center py-3 font-medium text-gray-700">Project Month</th>
                          <th className="text-center py-3 font-medium text-gray-700">Bank Loan Month</th>
                          <th className="text-left py-3 font-medium text-gray-700">Construction Stage</th>
                          <th className="text-center py-3 font-medium text-gray-700">Bank Loan Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.bankDrawdownSchedule.map((drawdown, index) => (
                          <tr key={index} className={`border-b hover:bg-gray-50 transition-colors ${
                            drawdown.stage.includes('Certificate of Statutory Completion') ? 'bg-purple-50' : 
                            drawdown.stage.includes('TOP') ? 'bg-green-50' : 'bg-yellow-50'
                          }`}>
                            <td className="py-4 text-center">{drawdown.projectMonth}</td>
                            <td className="py-4 text-center">
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
                                {drawdown.bankLoanMonth}
                              </span>
                            </td>
                            <td className="py-4 text-left">{drawdown.stage}</td>
                            <td className="py-4 text-center font-semibold text-green-600">
                              {formatCurrency(drawdown.bankLoanAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Monthly Payment Schedule - Remove Date Column */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold mb-2">Monthly Payment Schedule (First 60 Months)</h3>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Bank Loan Servicing:</strong> 
                      {results.firstBankDrawdownMonth ? (
                        ` Starts from Month ${results.firstBankDrawdownMonth}. Monthly payments recalculate after each drawdown AND when interest rates change. Month 1 opening balance equals first drawdown amount.`
                      ) : (
                        ' 100% Cash/CPF payment - No bank loan servicing required.'
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="p-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-center py-3 font-medium text-gray-700">Month</th>
                        <th className="text-center py-3 font-medium text-gray-700">Opening Balance</th>
                        <th className="text-center py-3 font-medium text-gray-700">Bank Drawdown</th>
                        <th className="text-center py-3 font-medium text-gray-700">Monthly Payment</th>
                        <th className="text-center py-3 font-medium text-gray-700">Interest</th>
                        <th className="text-center py-3 font-medium text-gray-700">Principal</th>
                        <th className="text-center py-3 font-medium text-gray-700">Ending Balance</th>
                        <th className="text-center py-3 font-medium text-gray-700">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.monthlySchedule.slice(0, 60).map((month, index) => (
                        <tr key={index} className={`border-b hover:bg-gray-50 transition-colors ${
                          month.drawdownAmount > 0 ? 'bg-yellow-100' : ''
                        }`}>
                          <td className="py-3 text-center font-medium">{month.month}</td>
                          <td className="py-3 text-center">{formatCurrency(month.openingBalance)}</td>
                          <td className="py-3 text-center">
                            {month.drawdownAmount > 0 ? (
                              <span className="text-green-600 font-medium">
                                {formatCurrency(month.drawdownAmount)}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-3 text-center font-semibold text-blue-600">
                            {month.monthlyPayment > 0 ? formatCurrency(month.monthlyPayment) : '-'}
                          </td>
                          <td className="py-3 text-center">
                            {month.interestPayment > 0 ? formatCurrency(month.interestPayment) : '-'}
                          </td>
                          <td className="py-3 text-center">
                            {month.principalPayment > 0 ? formatCurrency(month.principalPayment) : '-'}
                          </td>
                          <td className="py-3 text-center">{formatCurrency(month.endingBalance)}</td>
                          <td className="py-3 text-center">
                            {month.interestRate > 0 ? `${month.interestRate.toFixed(2)}%` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Generate Report Button */}
              <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-1 shadow-lg">
                <button
                  onClick={generateProgressivePaymentReport}
                  className="w-full bg-white text-red-600 py-4 px-6 rounded-lg font-semibold flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-lg">Generate Progressive Payment Report</div>
                    <div className="text-sm text-red-500">Professional PDF with yearly interest breakdown</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressivePaymentCalculator;
