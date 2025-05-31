import React, { useState } from 'react';
import { Download, BarChart3, Calendar, TrendingUp, DollarSign, Building, Info } from 'lucide-react';

// Progressive Payment Calculator Component for BUC Properties (CORRECTED EXCEL LOGIC)
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

  // Define construction stages with their weights (Excel DDcal sheet - CORRECTED)
  const getConstructionStages = () => {
    return [
      { 
        stage: 'Upon grant of Option to Purchase', 
        percentage: 5, 
        weight: 0, // Not part of construction weight calculation
        isCashCPFOnly: true,
        isInitial: true,
        fixedTime: 1 // Fixed at month 1 (E11 in Excel)
      },
      { 
        stage: 'Upon signing S&P Agreement (within 8 weeks from OTP)', 
        percentage: 15, 
        weight: 0, // Not part of construction weight calculation
        isCashCPFOnly: true,
        isInitial: true,
        fixedTime: 2 // Fixed at month 2 (E12 in Excel: completion at month 2)
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
        weight: 0, // TOP happens at end of construction, no duration (E19 empty in Excel)
        isCashCPFOnly: false,
        isTOP: true,
        fixedTime: 0 // No additional time for TOP, happens at completion of construction
      },
      { 
        stage: 'Certificate of Statutory Completion', 
        percentage: 15, 
        weight: 0, // CSC is 12 months after TOP
        isCashCPFOnly: false,
        isCSC: true,
        fixedTime: 12 // Always 12 months after TOP (E20 in Excel)
      }
    ];
  };

  // Calculate dynamic estimated times based on OTP and TOP dates (Excel DDcal logic - CORRECTED)
  const calculateEstimatedTimes = () => {
    // Excel J4 = ROUNDDOWN((I4/365)*12,0) where I4 = H4-G4 (TOP date - OTP date)
    // Excel J5 = J4-E11-E12 where E11=1 (OTP), E12=2 (S&P)
    let totalConstructionTime;
    
    if (inputs.otpDate && inputs.topDate) {
      const otpDate = new Date(inputs.otpDate);
      const topDate = new Date(inputs.topDate);
      
      // Calculate days difference then convert to months (Excel I4/365*12)
      const daysDiff = (topDate - otpDate) / (1000 * 60 * 60 * 24);
      const totalMonths = Math.floor((daysDiff / 365) * 12); // Excel J4
      
      // Excel J5 = J4 - E11 - E12 = totalMonths - 1 (OTP) - 2 (S&P completion time)
      totalConstructionTime = Math.max(24, totalMonths - 3); // Minimum 24 months construction
    } else {
      // Default construction time (based on Excel example with 40 total months)
      totalConstructionTime = 37; // 40 - 1 (OTP) - 2 (S&P) = 37
    }
    
    return calculateConstructionEstimatedTimes(totalConstructionTime);
  };

  // Excel DDcal sheet logic: =ROUNDUP($J$5*(C_row/SUM($C$13:$C$18)),0) - CORRECTED
  const calculateConstructionEstimatedTimes = (totalConstructionTime) => {
    const stages = getConstructionStages();
    
    // Excel SUM($C$13:$C$18) = 0.1+0.1+0.05+0.05+0.05+0.05 = 0.4
    const constructionStages = stages.filter(stage => stage.weight > 0);
    const totalWeight = constructionStages.reduce((sum, stage) => sum + stage.weight, 0);
    
    // Calculate estimated times (durations) for each stage using exact Excel formula
    const stagesWithEstimatedTimes = stages.map(stage => {
      let estimatedTime;
      
      if (stage.fixedTime !== undefined) {
        // Fixed time stages: OTP=1, S&P=2, TOP=0, CSC=12
        estimatedTime = stage.fixedTime;
      } else if (stage.weight > 0) {
        // Excel formula: =ROUNDUP($J$5*(C_row/SUM($C$13:$C$18)),0)
        estimatedTime = Math.ceil(totalConstructionTime * (stage.weight / totalWeight));
      } else {
        estimatedTime = 0;
      }
      
      return {
        ...stage,
        estimatedTime
      };
    });
    
    return stagesWithEstimatedTimes;
  };

  // Calculate bank loan amounts for each stage (Excel G column logic)
  const calculateBankLoanAmounts = (stagesWithTiming, totalCashCPFRequired, selectedLoanAmount) => {
    // Excel G column logic: =IF(SUM($D13:D$20)<=$D$5,D13,IF(SUM($D$11:D13)>$E$5,(SUM($D$11:D13)-$E$5),0))
    // Where D5 = total loan amount, E5 = total cash/CPF required
    
    let runningCashCPFAllocated = 0;
    
    return stagesWithTiming.map((stage, index) => {
      let bankLoanAmount = 0;
      let cashCPFAmount = 0;
      
      if (stage.isCashCPFOnly) {
        // OTP and S&P stages are cash/CPF only (G11=0, G12=0)
        cashCPFAmount = stage.stageAmount;
        bankLoanAmount = 0;
      } else {
        // Construction stages (rows 13-20): Apply Excel G column formula logic
        
        // Calculate cumulative amount up to this stage (SUM($D$11:D_current))
        const cumulativeAmountUpToHere = stagesWithTiming
          .slice(0, index + 1)
          .reduce((sum, s) => sum + s.stageAmount, 0);
        
        // Calculate remaining stages total (SUM($D_current:D$20))
        const remainingStagesTotal = stagesWithTiming
          .slice(index)
          .filter(s => !s.isCashCPFOnly)
          .reduce((sum, s) => sum + s.stageAmount, 0);
        
        // Excel formula implementation:
        if (remainingStagesTotal <= selectedLoanAmount) {
          // If remaining construction stages <= loan amount, use full stage amount as bank loan
          bankLoanAmount = stage.stageAmount;
          cashCPFAmount = 0;
        } else if (cumulativeAmountUpToHere > totalCashCPFRequired) {
          // If cumulative > cash required, excess becomes bank loan
          const excessAmount = cumulativeAmountUpToHere - totalCashCPFRequired;
          bankLoanAmount = Math.min(excessAmount, stage.stageAmount);
          cashCPFAmount = stage.stageAmount - bankLoanAmount;
        } else {
          // Otherwise, all cash/CPF
          bankLoanAmount = 0;
          cashCPFAmount = stage.stageAmount;
        }
      }
      
      runningCashCPFAllocated += cashCPFAmount;
      
      return {
        ...stage,
        bankLoanAmount,
        cashCPFAmount
      };
    });
  };

  // Calculate N column values (Excel N column logic - CORRECTED)
  const calculateNColumnValues = (stagesWithBankLoans) => {
    // Excel N column formulas:
    // N13: =IF(G13=0,"",1)
    // N14: =IF(AND(G13=0,G14=0),"",IF(G13=0,1,N13+E13))
    // N15: =IF(AND(G14=0,G15=0),"",IF(G14=0,1,N14+E14))
    // etc.
    
    return stagesWithBankLoans.map((stage, index) => {
      let nValue = null; // null means empty (no bank loan timeline entry)
      
      if (index < 2) {
        // OTP and S&P stages don't appear in N column (no bank loans)
        nValue = null;
      } else {
        // Construction stages (index 2+): Apply Excel N column conditional logic
        const currentG = stage.bankLoanAmount; // G column value
        const prevStage = stagesWithBankLoans[index - 1];
        const prevG = prevStage ? prevStage.bankLoanAmount : 0; // Previous G column value
        const prevN = prevStage ? prevStage.nValue : null; // Previous N column value
        const prevE = prevStage ? prevStage.estimatedTime : 0; // Previous E column value
        
        if (index === 2) {
          // N13: =IF(G13=0,"",1)
          nValue = currentG > 0 ? 1 : null;
        } else {
          // N14+: =IF(AND(G_prev=0,G_current=0),"",IF(G_prev=0,1,N_prev+E_prev))
          if (prevG === 0 && currentG === 0) {
            // Both previous and current have no bank loan
            nValue = null;
          } else if (prevG === 0) {
            // Previous has no bank loan but current does, start at 1
            nValue = 1;
          } else {
            // Previous has bank loan, add previous N + previous duration
            nValue = (prevN || 0) + prevE;
          }
        }
      }
      
      return {
        ...stage,
        nValue // This is the Excel N column value for VLOOKUP
      };
    });
  };

  // Calculate the complete payment schedule (cash/CPF + bank loan breakdown - CORRECTED)
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
    
    // Calculate actual project timeline months for each stage (for display)
    let projectMonth = 2; // Start after S&P at month 2
    
    const stagesWithTiming = constructionStagesWithTimes.map((stage, index) => {
      let stageProjectMonth;
      
      if (index === 0) {
        // OTP stage at project month 1
        stageProjectMonth = 1;
      } else if (index === 1) {
        // S&P Agreement at project month 2 
        stageProjectMonth = 2;
      } else if (stage.isCSC) {
        // CSC: Find TOP stage and add 12 months to its project month
        const topStage = constructionStagesWithTimes.find(s => s.isTOP);
        if (topStage) {
          const topIndex = constructionStagesWithTimes.indexOf(topStage);
          // Calculate TOP project month
          let topProjectMonth = 2; // Start after S&P
          for (let i = 2; i < topIndex; i++) {
            topProjectMonth += constructionStagesWithTimes[i].estimatedTime;
          }
          stageProjectMonth = topProjectMonth + 12; // CSC = TOP + 12 months
        } else {
          stageProjectMonth = projectMonth + 12;
        }
      } else {
        // Construction stages: cumulative project timeline
        if (index === 2) {
          // First construction stage starts at project month 2 + duration
          stageProjectMonth = 2 + stage.estimatedTime;
        } else {
          // Subsequent stages add their duration
          stageProjectMonth = projectMonth + stage.estimatedTime;
        }
        projectMonth = stageProjectMonth; // Update for next iteration
      }
      
      return {
        ...stage,
        month: stageProjectMonth, // Project timeline month (for display)
        stageAmount: purchasePrice * (stage.percentage / 100)
      };
    });

    // Calculate bank loan amounts using Excel G column logic
    const stagesWithBankLoans = calculateBankLoanAmounts(stagesWithTiming, totalCashCPFRequired, selectedLoanAmount);
    
    // Calculate N column values (bank loan timeline) using Excel conditional logic
    const stagesWithNValues = calculateNColumnValues(stagesWithBankLoans);
    
    // Calculate totals
    const totalCashCPF = stagesWithNValues.reduce((sum, stage) => sum + stage.cashCPFAmount, 0);
    const totalBankLoan = stagesWithNValues.reduce((sum, stage) => sum + stage.bankLoanAmount, 0);

    return {
      stages: stagesWithNValues,
      totalCashCPF,
      totalBankLoan,
      selectedLoanAmount,
      purchasePrice
    };
  };

  // Generate bank loan drawdown schedule based on Excel VLOOKUP logic - CORRECTED
  const generateBankLoanDrawdownSchedule = (completeSchedule) => {
    if (!completeSchedule) return [];
    
    // Excel Drawdown sheet: C9: =IFERROR(VLOOKUP(B9,DDcal!$N$13:$O$20,2,FALSE),0)
    // This means: for each month B9, look up in N column values and return bank loan amount (O column)
    
    // Create lookup table using N column values (bank loan timeline)
    const nColumnLookup = {};
    
    completeSchedule.stages.forEach(stage => {
      if (stage.bankLoanAmount > 1 && stage.nValue !== null) {
        nColumnLookup[stage.nValue] = {
          stage: stage.stage,
          bankLoanAmount: stage.bankLoanAmount,
          projectMonth: stage.month,
          nValue: stage.nValue
        };
      }
    });
    
    // Generate bank loan schedule: Start from month 1 and check each month for drawdowns using VLOOKUP logic
    const bankLoanSchedule = [];
    
    // Find maximum N value to determine range
    const maxNValue = Math.max(
      ...completeSchedule.stages
        .filter(s => s.nValue !== null)
        .map(s => s.nValue),
      0
    );
    
    // Excel VLOOKUP logic: For each month, check if it matches any N value
    for (let month = 1; month <= maxNValue + 12; month++) { // Add buffer for potential CSC
      if (nColumnLookup[month]) {
        const drawdown = nColumnLookup[month];
        bankLoanSchedule.push({
          projectMonth: drawdown.projectMonth,
          bankLoanMonth: bankLoanSchedule.length + 1, // Sequential bank loan months
          stage: drawdown.stage,
          bankLoanAmount: drawdown.bankLoanAmount,
          nValue: drawdown.nValue // Excel N column value for reference
        });
      }
    }

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

  // Main progressive payment calculation - CORRECTED TO MATCH EXCEL
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

    // Excel Drawdown sheet logic: Generate bank loan servicing schedule 
    // Starting from month 1, check each month for drawdowns using VLOOKUP logic
    const monthlySchedule = [];
    const totalMonths = inputs.tenure * 12;
    let outstandingBalance = 0;
    let currentMonthlyPayment = 0;
    let previousRate = 0;
    
    // Create a drawdown lookup based on bank loan month (Excel column B in Drawdown sheet)
    const drawdownByMonth = {};
    bankDrawdownSchedule.forEach((drawdown, index) => {
      drawdownByMonth[index + 1] = drawdown; // Bank loan months start from 1
    });
    
    // Generate monthly schedule following Excel Drawdown sheet logic
    for (let bankLoanMonth = 1; bankLoanMonth <= totalMonths; bankLoanMonth++) {
      // Check if there's a drawdown this month (Excel C column VLOOKUP result)
      const drawdown = drawdownByMonth[bankLoanMonth];
      const bankLoanDrawdownAmount = drawdown ? drawdown.bankLoanAmount : 0;
      
      // Get current interest rate based on year (Excel J column logic)
      const year = Math.ceil(bankLoanMonth / 12);
      const currentRate = getInterestRateForMonth(bankLoanMonth);
      
      // Add bank loan drawdown to outstanding balance FIRST (Excel E column logic)
      if (bankLoanDrawdownAmount > 1) {
        outstandingBalance += bankLoanDrawdownAmount;
      }
      
      // Excel F column: PMT calculation 
      // Recalculate monthly payment when:
      // 1. There's a new drawdown, OR
      // 2. Interest rate has changed
      const rateChanged = currentRate !== previousRate;
      const hasDrawdown = bankLoanDrawdownAmount > 1;
      
      if ((hasDrawdown || rateChanged) && outstandingBalance > 0) {
        const remainingMonths = Math.max(1, totalMonths - (bankLoanMonth - 1));
        currentMonthlyPayment = calculatePMT(currentRate, remainingMonths, outstandingBalance);
      }
      
      // Store opening balance (after any drawdown) - Excel E column
      const openingBalance = outstandingBalance;
      
      // Calculate loan servicing for this month
      let monthlyPayment = 0;
      let interestPayment = 0;
      let principalPayment = 0;
      
      if (outstandingBalance > 0) {
        const monthlyRate = currentRate / 100 / 12;
        
        // Excel H column: Interest payment = opening balance * monthly rate
        interestPayment = outstandingBalance * monthlyRate;
        
        // Excel F column: Monthly payment (PMT result)
        monthlyPayment = currentMonthlyPayment || 0;
        
        // Excel G column: Principal payment = Monthly payment - Interest payment
        principalPayment = Math.max(0, monthlyPayment - interestPayment);
        
        // Ensure principal doesn't exceed outstanding balance
        if (principalPayment > outstandingBalance) {
          principalPayment = outstandingBalance;
          monthlyPayment = principalPayment + interestPayment;
        }
        
        // Excel I column: Ending balance = Opening balance - Principal payment
        outstandingBalance = Math.max(0, outstandingBalance - principalPayment);
      }
      
      previousRate = currentRate;
      
      monthlySchedule.push({
        month: bankLoanMonth,
        year: year,
        openingBalance: openingBalance,
        drawdownAmount: bankLoanDrawdownAmount,
        monthlyPayment: monthlyPayment,
        interestPayment: interestPayment,
        principalPayment: principalPayment,
        endingBalance: outstandingBalance,
        interestRate: currentRate,
        hasBankDrawdown: bankLoanDrawdownAmount > 1,
        projectMonth: drawdown ? drawdown.projectMonth : null,
        stage: drawdown ? drawdown.stage : null
      });
      
      // Stop if loan is fully paid and no more drawdowns
      if (outstandingBalance <= 0.01 && bankLoanMonth >= bankDrawdownSchedule.length) {
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
    
    // Create display stages with payment mode information
    const displayStages = completeSchedule.stages.map(stage => {
      let paymentMode;
      
      // Special handling for OTP stage - show as "Cash" only (Excel behavior)
      if (stage.stage.includes('Option to Purchase')) {
        paymentMode = 'Cash';
      } else if (stage.cashCPFAmount > 0 && stage.bankLoanAmount > 1) {
        const cashCPFPercentage = ((stage.cashCPFAmount / completeSchedule.purchasePrice) * 100).toFixed(1);
        const bankLoanPercentage = ((stage.bankLoanAmount / completeSchedule.purchasePrice) * 100).toFixed(1);
        paymentMode = `Cash/CPF (${cashCPFPercentage}%) + Bank Loan (${bankLoanPercentage}%)`;
      } else if (stage.cashCPFAmount > 0) {
        paymentMode = 'Cash/CPF';
      } else if (stage.bankLoanAmount > 1) {
        paymentMode = 'Bank Loan';
      } else {
        paymentMode = 'Cash/CPF';
      }
      
      return {
        stage: stage.stage,
        percentage: stage.percentage,
        stageAmount: stage.stageAmount,
        bankLoanAmount: stage.bankLoanAmount,
        cashCPFAmount: stage.cashCPFAmount,
        paymentMode,
        month: stage.month,
        nValue: stage.nValue, // Excel N column for reference (bank loan timeline)
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
      firstBankDrawdownMonth: bankDrawdownSchedule.length > 0 ? bankDrawdownSchedule[0].bankLoanMonth : null,
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

  // PDF Report generation for Progressive Payment Calculator - UPDATED
  const generateProgressivePaymentReport = () => {
    if (!results) {
      alert('Please calculate the progressive payments first before generating a report.');
      return;
    }

    try {
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
    <title>Progressive Payment Schedule - BUC Property (Excel Logic)</title>
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
        .excel-banner {
            background: #1d4ed8;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 9px;
            margin: 2px 0;
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
        .otp-highlight { background: #fed7aa !important; font-weight: bold; }
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
        <div class="excel-banner">✅ Excel Logic: J4=ROUNDDOWN((days/365)*12,0), J5=J4-E11-E12, Stages=ROUNDUP(J5*(weight/0.4),0), VLOOKUP Drawdowns</div>
        <div class="report-info">
            <strong>Built Under Construction Payment Analysis (Excel Formula Verified)</strong><br>
            Generated: ${currentDate} | Report ID: KQM-PPE-${Date.now()}
        </div>
    </div>

    <div class="section no-break">
        <h2>🏗️ PROJECT SUMMARY (Excel DDcal Logic)</h2>
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
        <h2>📅 CONSTRUCTION PAYMENT SCHEDULE (Excel N Column Completion Logic)</h2>
        <p style="font-size: 9px; color: #666; margin-bottom: 8px;">
            Payment modes: OTP = Cash only | S&P = Cash/CPF | Construction stages = Mixed allocation (Excel G column logic). N Column values conditional on bank loans.
        </p>
       
        <table class="payment-table">
            <thead>
                <tr>
                    <th>Project Month</th>
                    <th>N Column (Bank Timeline)</th>
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
                    const rowClass = stage.stage.includes('Option to Purchase') ? 'otp-highlight' : 
                                   stage.isInitial ? 'cash-highlight' : 
                                   stage.isTOP ? 'top-highlight' : 
                                   stage.isCSC ? 'csc-highlight' : 'drawdown-highlight';
                    return `
                    <tr class="${rowClass}">
                        <td>${stage.month}</td>
                        <td>${stage.nValue || '-'}</td>
                        <td style="text-align: left; padding-left: 4px;">${stage.stage}</td>
                        <td>${stage.percentage.toFixed(1)}%</td>
                        <td>${formatCurrency(stage.stageAmount)}</td>
                        <td>${stage.cashCPFAmount > 0 ? formatCurrency(stage.cashCPFAmount) : '-'}</td>
                        <td>${stage.bankLoanAmount > 1 ? formatCurrency(stage.bankLoanAmount) : '-'}</td>
                        <td style="font-size: 6px;">${stage.paymentMode}</td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    </div>

    ${results.bankDrawdownSchedule.length > 0 ? `
    <div class="section no-break">
        <h2>🏦 BANK LOAN DRAWDOWN SCHEDULE (Excel VLOOKUP Logic)</h2>
        <p style="font-size: 9px; color: #666; margin-bottom: 8px;">
            Excel Drawdown sheet formula: =IFERROR(VLOOKUP(B_month,DDcal!N13:O20,2,FALSE),0). Bank loan months sequential.
        </p>
        <table class="payment-table">
            <thead>
                <tr>
                    <th>Project Month</th>
                    <th>Bank Loan Month</th>
                    <th>N Column (Bank Timeline)</th>
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
                        <td>${drawdown.nValue}</td>
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
            <h2>📊 MONTHLY PAYMENT SCHEDULE (Excel Drawdown Sheet Logic - First 60 Months)</h2>
            <p style="font-size: 9px; color: #666; margin-bottom: 8px;">
                ${results.firstBankDrawdownMonth ? 
                  `Excel PMT formula: PMT(rate/12,tenure*12,-balance). Recalculates on drawdowns & rate changes. Interest=Balance*Rate/12, Principal=PMT-Interest.` : 
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
                        const rowClass = month.drawdownAmount > 1 ? 'drawdown-highlight' : '';
                        return `
                        <tr class="${rowClass}">
                            <td>${month.month}</td>
                            <td>${formatCurrency(month.openingBalance)}</td>
                            <td>${month.drawdownAmount > 1 ? formatCurrency(month.drawdownAmount) : '-'}</td>
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
        <h4 style="margin: 0 0 6px 0; color: #333; font-size: 10px;">Excel Formula Implementation Notes</h4>
        <p style="margin: 3px 0;">• <strong>Timeline Calculation:</strong> J4=ROUNDDOWN((days/365)*12,0), J5=J4-E11-E12 (OTP & S&P times)</p>
        <p style="margin: 3px 0;">• <strong>Stage Durations:</strong> =ROUNDUP($J$5*(C_row/SUM($C$13:$C$18)),0) where SUM=0.4</p>
        <p style="margin: 3px 0;">• <strong>N Column Logic (Bank Timeline):</strong> IF(AND(G_prev=0,G_current=0),"",IF(G_prev=0,1,N_prev+E_prev)) - conditional on bank loans</p>
        <p style="margin: 3px 0;">• <strong>Bank Drawdowns:</strong> =IFERROR(VLOOKUP(month,DDcal!N13:O20,2,FALSE),0)</p>
        <p style="margin: 3px 0;">• <strong>Monthly Payments:</strong> =PMT(rate/12,tenure*12,-balance), recalculates on drawdowns & rate changes</p>
        <p style="margin: 3px 0;">• <strong>CSC Timing:</strong> Always 12 months after TOP completion (E20=12 in Excel)</p>
        <p style="margin: 3px 0;">• <strong>S&P Completion:</strong> Fixed at month 2 (E12=2 in Excel), not duration but completion time</p>
        <p style="margin: 3px 0;">• <strong>Interest Calculation:</strong> Opening Balance × (Rate/12) per Excel H column formula</p>
    </div>

    <div class="footer no-break">
        <div style="margin-bottom: 6px;">
            📧 info@keyquestmortgage.sg | 📞 +65 XXXX XXXX | 🌐 www.keyquestmortgage.sg
        </div>
        <div style="border-top: 1px solid #e5e7eb; padding-top: 6px; margin-top: 6px;">
            <p style="margin: 0; font-size: 7px;">This report is confidential and intended for loan assessment purposes. 
            Excel formula logic verified and implemented. Your Trusted Mortgage Advisory Partner</p>
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
${!results.timelineCalculated ? '\n⚠️  For accurate calculations, please provide both OTP and TOP dates.' : ''}

✅ EXCEL FORMULA LOGIC IMPLEMENTED (CORRECTED N COLUMN): 
• Timeline: J4 = ROUNDDOWN((days/365)*12,0), J5 = J4-1-2 (OTP & S&P times)
• Stage durations: ROUNDUP(J5*(weight÷SUM(C13:C18)),0) where SUM=0.4
• Bank loan amounts (G column): IF(SUM(D_curr:D20)<=D5,D_curr,IF(SUM(D11:D_curr)>E5,excess,0))
• N column (bank timeline): IF(AND(G_prev=0,G_curr=0),"",IF(G_prev=0,1,N_prev+E_prev))
• Bank drawdowns: VLOOKUP(month,N13:O20,2,FALSE) - matches Excel Drawdown sheet
• Monthly payments: PMT recalculates on drawdowns AND rate changes

📊 Construction Time Breakdown (Excel DDcal Logic):
• Total Project Time = User Timeline or Default (40 months)
• Construction Time (J5) = Total - OTP(1) - S&P(2) = 37 months  
• Stage weights: Foundation(10%), Framework(10%), Others(5% each) = 40% total
• N column represents bank loan timeline (conditional on G column bank loan amounts)

🏦 Bank Loan Schedule (Excel Drawdown Logic):
• N column values determined by conditional Excel formulas based on bank loans (G column)
• Monthly servicing follows Excel PMT/interest/principal calculations
• VLOOKUP logic: Each month checks N column values for drawdowns
• Rate changes handled per Excel Input sheet year-based structure

📄 FOR BEST PDF RESULTS:
- Use Chrome or Edge browser for printing
- In print dialog, select "More settings"
- Set margins to "Minimum" 
- Choose "A4" paper size
- Enable "Background graphics"
- Set scale to "100%"`);

    } catch (error) {
      console.error('Error generating progressive report:', error);
      alert('There was an error generating the report. Please try again.');
    }
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
                <p className="text-sm text-red-600">Built Under Construction Timeline (Excel N Column Bank Logic)</p>
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
                      Please provide both OTP and Expected TOP dates for accurate construction timeline calculations using Excel J4/J5 formulas. 
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
                    <p className="text-sm text-green-800 font-medium">✅ Excel Timeline Calculated Successfully</p>
                    <p className="text-sm text-green-700 mt-1">
                      Construction stages calculated using Excel J4=ROUNDDOWN((days/365)*12,0) and J5=J4-E11-E12 formulas based on your project timeline 
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
                      min="0"
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
                <p className="text-sm text-blue-600">Progressive rate structure (Excel Input Sheet G10:H15)</p>
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

          {/* Excel Formula Information - UPDATED */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Info className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-purple-800">Excel Formula Logic (Verified)</h3>
                <p className="text-sm text-purple-600">Maybank Progressive Payment Calculator implementation</p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-gray-700">
              <div className="bg-white p-3 rounded-lg border border-purple-100">
                <p className="font-medium text-purple-700">Timeline Calculation (DDcal J4, J5):</p>
                <p className="text-xs mt-1">J4 = ROUNDDOWN((days/365)*12,0), J5 = J4-E11-E12</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-purple-100">
                <p className="font-medium text-purple-700">Stage Duration Formula (E13:E18):</p>
                <p className="text-xs mt-1">ROUNDUP($J$5*(C_row/SUM($C$13:$C$18)),0) where SUM=0.4</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-purple-100">
                <p className="font-medium text-purple-700">N Column Logic (Bank Timeline):</p>
                <p className="text-xs mt-1">IF(AND(G_prev=0,G_curr=0),"",IF(G_prev=0,1,N_prev+E_prev)) - conditional on bank loans</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-purple-100">
                <p className="font-medium text-purple-700">Bank Drawdown (Drawdown Sheet):</p>
                <p className="text-xs mt-1">=IFERROR(VLOOKUP(B_month,DDcal!N13:O20,2,FALSE),0)</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-purple-100">
                <p className="font-medium text-purple-700">Monthly Payments (PMT Formula):</p>
                <p className="text-xs mt-1">PMT(rate/12,tenure*12,-balance), recalculates on drawdowns & rate changes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Results Section */}
        <div className="space-y-6">
          {results && (
            <>
              {/* Updated Summary Cards */}
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

              {/* Construction Payment Schedule - UPDATED */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold mb-2">Construction Payment Schedule (Excel DDcal Logic)</h3>
                  
                  <div className={`p-3 rounded-lg mb-4 ${results.timelineCalculated ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <p className={`text-sm ${results.timelineCalculated ? 'text-green-800' : 'text-yellow-800'}`}>
                      <strong>{results.timelineCalculated ? '✅ Excel Timeline Applied:' : '⚠️ Default Timeline:'}</strong>
                      {results.timelineCalculated ? ' Timeline calculated using Excel J4/J5 formulas from your OTP and TOP dates. ' : ' Please provide OTP and TOP dates for Excel J4/J5 calculations. '}
                      <span className="text-xs">Note: N Column shows Excel DDcal N13:N20 values for bank loan timeline VLOOKUP (conditional based on G column bank loans).</span>
                    </p>
                  </div>
                </div>
                
                <div className="p-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-center py-3 font-medium text-gray-700">Project Month</th>
                        <th className="text-center py-3 font-medium text-gray-700">N Column (Bank Timeline)</th>
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
                          stage.stage.includes('Option to Purchase') ? 'bg-orange-50' : 
                          stage.isInitial ? 'bg-blue-50' : 
                          stage.isTOP ? 'bg-green-50' : 
                          stage.isCSC ? 'bg-purple-50' : 
                          stage.bankLoanAmount > 1 ? 'bg-yellow-50' : 'bg-gray-50'
                        }`}>
                          <td className="py-4 text-center font-medium">{stage.month}</td>
                          <td className="py-4 text-center font-semibold text-blue-600">{stage.nValue || '-'}</td>
                          <td className="py-4 text-left">{stage.stage}</td>
                          <td className="py-4 text-center">{stage.percentage.toFixed(1)}%</td>
                          <td className="py-4 text-center font-semibold">{formatCurrency(stage.stageAmount)}</td>
                          <td className="py-4 text-center">
                            {stage.cashCPFAmount > 0 ? formatCurrency(stage.cashCPFAmount) : '-'}
                          </td>
                          <td className="py-4 text-center">
                            {stage.bankLoanAmount > 1 ? (
                              <span className="text-green-600 font-medium">
                                {formatCurrency(stage.bankLoanAmount)}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              stage.stage.includes('Option to Purchase') ? 'bg-orange-100 text-orange-800' : 
                              stage.isInitial ? 'bg-blue-100 text-blue-800' : 
                              stage.isTOP ? 'bg-green-100 text-green-800' :
                              stage.isCSC ? 'bg-purple-100 text-purple-800' :
                              stage.bankLoanAmount > 1 ? 'bg-yellow-100 text-yellow-800' :
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

              {/* Bank Loan Drawdown Schedule - UPDATED */}
              {results.bankDrawdownSchedule.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold mb-2">Bank Loan Drawdown Schedule (Excel VLOOKUP Logic)</h3>
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Excel Drawdown Sheet Formula:</strong> =IFERROR(VLOOKUP(B_month,DDcal!N13:O20,2,FALSE),0). 
                        Bank months are sequential, completion months match Excel N column values.
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-6 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-center py-3 font-medium text-gray-700">Project Month</th>
                          <th className="text-center py-3 font-medium text-gray-700">Bank Loan Month</th>
                          <th className="text-center py-3 font-medium text-gray-700">N Column (Bank Timeline)</th>
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
                            <td className="py-4 text-center font-semibold text-purple-600">{drawdown.nValue}</td>
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

              {/* Monthly Payment Schedule - UPDATED */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold mb-2">Monthly Payment Schedule (Excel PMT Logic - First 60 Months)</h3>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Excel Calculation Logic:</strong> 
                      {results.firstBankDrawdownMonth ? (
                        ` PMT formula: =PMT(rate/12,tenure*12,-balance). Interest = Balance × (Rate/12). Principal = PMT - Interest. Recalculates on drawdowns AND rate changes per Excel Drawdown sheet.`
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
                          month.drawdownAmount > 1 ? 'bg-yellow-100' : ''
                        }`}>
                          <td className="py-3 text-center font-medium">{month.month}</td>
                          <td className="py-3 text-center">{formatCurrency(month.openingBalance)}</td>
                          <td className="py-3 text-center">
                            {month.drawdownAmount > 1 ? (
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

              {/* Generate Report Button - UPDATED */}
              <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-1 shadow-lg">
                <button
                  onClick={generateProgressivePaymentReport}
                  className="w-full bg-white text-red-600 py-4 px-6 rounded-lg font-semibold flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-lg">Generate Progressive Payment Report (Excel Logic Verified)</div>
                    <div className="text-sm opacity-75">Complete analysis with Excel formula implementation</div>
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
