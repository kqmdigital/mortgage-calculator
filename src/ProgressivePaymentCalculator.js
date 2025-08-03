import React, { useState, useMemo, useCallback } from 'react';
import { Download, BarChart3, Calendar, TrendingUp, DollarSign, Building, Info, ChevronDown, ChevronUp, Home, Building2 } from 'lucide-react';
import useDebounce from './hooks/useDebounce';

// Progressive Payment Calculator - Enhanced UI Version
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
  const [expandedMonthlySchedule, setExpandedMonthlySchedule] = useState(false);

  // ✅ OPTIMIZED: Debounce inputs to prevent excessive recalculations
  const debouncedInputs = useDebounce(inputs, 300); // Wait 300ms after user stops typing

  // Time calculation chain
  const calculateExcelTimeChain = (otpDate, topDate) => {
    if (!otpDate || !topDate) {
      return {
        I4: null,
        J4: null, 
        K4: 37,
        timelineCalculated: false
      };
    }
    
    const otpDateObj = new Date(otpDate);
    const topDateObj = new Date(topDate);
    
    const I4 = (topDateObj - otpDateObj) / (1000 * 60 * 60 * 24);
    const J4 = Math.floor((I4 / 365) * 12);
    const E8 = 1;
    const E9 = 2;
    const K4 = J4 - E8 - E9;
    
    return {
      I4,
      J4, 
      K4,
      timelineCalculated: true
    };
  };

  // Construction stage timing calculations
  const calculateExcelConstructionTimings = (K4) => {
    const constructionWeights = [
      { stage: 'Completion of foundation work', percentage: 10, weight: 0.1 },
      { stage: 'Completion of reinforced concrete framework of unit', percentage: 10, weight: 0.1 },
      { stage: 'Completion of partition walls of unit', percentage: 5, weight: 0.05 },
      { stage: 'Completion of roofing/ceiling of unit', percentage: 5, weight: 0.05 },
      { stage: 'Completion of door sub-frames/ door frames, window frames, electrical wiring, internal plastering and plumbing of unit', percentage: 5, weight: 0.05 },
      { stage: 'Completion of car park, roads and drains serving the housing project', percentage: 5, weight: 0.05 }
    ];
    
    const totalWeight = 0.4;
    
    return constructionWeights.map((stage, index) => ({
      ...stage,
      estimatedTime: Math.ceil(K4 * (stage.weight / totalWeight)),
      excelRow: 10 + index
    }));
  };

  // Bank loan allocation logic
  const calculateExcelBankLoanAllocation = (allStages, loanAmount, totalCashCPFRequired, purchasePrice) => {
    return allStages.map((stage, index) => {
      if (stage.isCashCPFOnly) {
        return {
          ...stage,
          bankLoanAmount: 0,
          cashCPFAmount: stage.stageAmount
        };
      }

      const bankLoanStages = allStages.filter(s => !s.isCashCPFOnly);
      const currentStageIndex = bankLoanStages.findIndex(s => s.stage === stage.stage);
      
      if (currentStageIndex === -1) {
        return { ...stage, bankLoanAmount: 0, cashCPFAmount: stage.stageAmount };
      }
      
      const remainingStagesFromCurrent = bankLoanStages.slice(currentStageIndex);
      const sumRemainingStages = remainingStagesFromCurrent.reduce((sum, s) => sum + s.stageAmount, 0);
      
      const cumulativeToCurrentIndex = allStages.findIndex(s => s.stage === stage.stage);
      const cumulativeToCurrent = allStages.slice(0, cumulativeToCurrentIndex + 1)
        .reduce((sum, s) => sum + s.stageAmount, 0);
      
      let bankLoanAmount = 0;
      
      if (sumRemainingStages <= loanAmount) {
        bankLoanAmount = stage.stageAmount;
      } else if (cumulativeToCurrent > totalCashCPFRequired) {
        bankLoanAmount = cumulativeToCurrent - totalCashCPFRequired;
        bankLoanAmount = Math.min(bankLoanAmount, stage.stageAmount);
        bankLoanAmount = Math.max(0, bankLoanAmount);
      }
      
      if (bankLoanAmount < 0.01) {
        bankLoanAmount = 0;
      }
      
      const cashCPFAmount = stage.stageAmount - bankLoanAmount;
      
      return {
        ...stage,
        bankLoanAmount,
        cashCPFAmount
      };
    });
  };

  // Bank loan month calculations
  const calculateExcelBankLoanMonths = (stagesWithBankAllocation, purchasePrice) => {
    const excelStages = stagesWithBankAllocation.filter(stage => !stage.isCashCPFOnly);
    const nValues = [];
    
    excelStages.forEach((stage, index) => {
      const currentG = stage.bankLoanAmount;
      const currentGIsZero = currentG <= 0.01;
      
      let nValue = null;
      
      if (index === 0) {
        nValue = currentGIsZero ? null : 1;
      } else {
        const prevStage = excelStages[index - 1];
        const prevG = prevStage.bankLoanAmount;
        const prevGIsZero = prevG <= 0.01;
        const prevNValue = nValues[index - 1]?.nValue;
        
        if (prevGIsZero && currentGIsZero) {
          nValue = null;
        } else if (prevGIsZero && !currentGIsZero) {
          nValue = 1;
        } else if (!prevGIsZero) {
          if (prevNValue !== null) {
            let prevEstimatedTime;
            
            if (prevStage.excelRow === 8) {
              prevEstimatedTime = 1;
            } else if (prevStage.excelRow === 9) {
              prevEstimatedTime = 2;
            } else if (prevStage.excelRow >= 10 && prevStage.excelRow <= 15) {
              prevEstimatedTime = prevStage.estimatedTime;
            } else if (prevStage.excelRow === 16) {
              prevEstimatedTime = 0;
            } else if (prevStage.excelRow === 17) {
              prevEstimatedTime = 12;
            }
            
            // Special case for CSC: always add 12 months to TOP
            if (stage.excelRow === 17 && stage.isCSC) {
              const topStageIndex = excelStages.findIndex(s => s.isTOP);
              if (topStageIndex >= 0 && topStageIndex < index) {
                const topNValue = nValues[topStageIndex]?.nValue;
                if (topNValue !== null) {
                  nValue = topNValue + 12;
                }
              }
            } else {
              nValue = prevNValue + prevEstimatedTime;
            }
          }
        }
      }
      
      nValues.push({
        ...stage,
        nValue: nValue,
        hasBankLoan: !currentGIsZero,
        originalIndex: stagesWithBankAllocation.findIndex(s => s.stage === stage.stage),
        excelRow: stage.excelRow
      });
    });
    
    const bankLoanSchedule = nValues
      .filter(stage => stage.hasBankLoan && stage.nValue !== null)
      .map(stage => ({
        stage: stage.stage,
        bankLoanMonth: stage.nValue,
        bankLoanAmount: stage.bankLoanAmount,
        estimatedTime: stage.estimatedTime,
        percentage: (stage.bankLoanAmount / purchasePrice) * 100,
        originalIndex: stage.originalIndex,
        isTOP: stage.isTOP || false,
        isCSC: stage.isCSC || false,
        projectMonth: stage.month || stage.nValue,
        excelRow: stage.excelRow
      }));
    
    return bankLoanSchedule;
  };

  // ✅ OPTIMIZED: Complete calculation with inputs parameter
  const calculateCompleteExcelSchedule = (inputsToUse = inputs) => {
    const purchasePrice = parseNumberInput(inputsToUse.purchasePrice) || 0;
    
    let selectedLoanAmount;
    if (inputsToUse.useCustomAmount) {
      selectedLoanAmount = parseNumberInput(inputsToUse.customLoanAmount) || 0;
    } else {
      selectedLoanAmount = purchasePrice * (inputsToUse.loanPercentage / 100);
    }

    if (purchasePrice <= 0 || selectedLoanAmount <= 0) return null;

    const totalCashCPFRequired = purchasePrice - selectedLoanAmount;
    const timeChain = calculateExcelTimeChain(inputsToUse.otpDate, inputsToUse.topDate);
    const { K4, timelineCalculated } = timeChain;
    const constructionStages = calculateExcelConstructionTimings(K4);

    const allStages = [];
    
    allStages.push({
      stage: 'Upon grant of Option to Purchase', 
      percentage: 5, 
      estimatedTime: 1,
      isCashCPFOnly: true,
      stageAmount: purchasePrice * 0.05,
      month: 1,
      excelRow: 8
    });
    
    allStages.push({
      stage: 'Upon signing S&P Agreement (within 8 weeks from OTP)', 
      percentage: 15, 
      estimatedTime: 2,
      isCashCPFOnly: true,
      stageAmount: purchasePrice * 0.15,
      month: 2,
      excelRow: 9
    });

    let cumulativeMonth = 3;
    constructionStages.forEach((stage, index) => {
      allStages.push({
        stage: stage.stage,
        percentage: stage.percentage,
        estimatedTime: stage.estimatedTime,
        isCashCPFOnly: false,
        stageAmount: purchasePrice * (stage.percentage / 100),
        month: cumulativeMonth,
        excelRow: 10 + index
      });
      cumulativeMonth += stage.estimatedTime;
    });

    const topMonth = cumulativeMonth;
    allStages.push({
      stage: 'Temporary Occupation Permit (TOP)',
      percentage: 25,
      estimatedTime: undefined,
      isCashCPFOnly: false,
      isTOP: true,
      stageAmount: purchasePrice * 0.25,
      month: topMonth,
      excelRow: 16
    });

    allStages.push({
      stage: 'Certificate of Statutory Completion',
      percentage: 15,
      estimatedTime: 12,
      isCashCPFOnly: false,
      isCSC: true,
      stageAmount: purchasePrice * 0.15,
      month: topMonth + 12,
      excelRow: 17
    });

    const stagesWithBankLoan = calculateExcelBankLoanAllocation(allStages, selectedLoanAmount, totalCashCPFRequired, purchasePrice);
    const bankLoanTimeline = calculateExcelBankLoanMonths(stagesWithBankLoan, purchasePrice);

    return {
      stages: stagesWithBankLoan,
      bankLoanTimeline,
      selectedLoanAmount,
      purchasePrice,
      totalCashCPFRequired,
      totalCashCPF: totalCashCPFRequired,
      totalBankLoan: selectedLoanAmount,
      timeChain,
      constructionTime: K4,
      timelineCalculated
    };
  };

  // ✅ OPTIMIZED: Monthly payment schedule generation with inputs parameter
  const generateMonthlyPaymentSchedule = (bankLoanTimeline, inputsToUse = inputs) => {
    if (!bankLoanTimeline || bankLoanTimeline.length === 0) return [];
    
    const monthlySchedule = [];
    const totalMonths = (parseInt(inputsToUse.tenure) || 20) * 12;
    let outstandingBalance = 0;
    
    const drawdownMap = new Map();
    bankLoanTimeline.forEach(item => {
      drawdownMap.set(item.bankLoanMonth, item.bankLoanAmount);
    });
    
    const meaningfulDrawdowns = bankLoanTimeline.filter(item => item.bankLoanAmount > 1);
    const firstDrawdownMonth = meaningfulDrawdowns.length > 0 ? Math.min(...meaningfulDrawdowns.map(item => item.bankLoanMonth)) : null;
    
    if (!firstDrawdownMonth) return [];
    
    for (let month = 1; month <= totalMonths; month++) {
      const drawdownAmount = drawdownMap.get(month) || 0;
      
      if (drawdownAmount > 0) {
        outstandingBalance += drawdownAmount;
      }
      
      const openingBalance = outstandingBalance;
      
      let monthlyPayment = 0;
      let interestPayment = 0;
      let principalPayment = 0;
      
      if (month >= firstDrawdownMonth && outstandingBalance > 0) {
        const currentRate = getInterestRateForMonth(month, inputsToUse);
        const monthlyRate = currentRate / 100 / 12;
        
        interestPayment = outstandingBalance * monthlyRate;
        
        const remainingMonths = totalMonths - month + 1;
        monthlyPayment = calculatePMT(currentRate, remainingMonths, outstandingBalance);
        
        principalPayment = Math.min(monthlyPayment - interestPayment, outstandingBalance);
        outstandingBalance -= principalPayment;
      }
      
      monthlySchedule.push({
        month,
        year: Math.ceil(month / 12),
        openingBalance,
        drawdownAmount,
        cumulativeDrawdown: bankLoanTimeline
          .filter(item => item.bankLoanMonth <= month)
          .reduce((sum, item) => sum + item.bankLoanAmount, 0),
        monthlyPayment,
        interestPayment,
        principalPayment,
        endingBalance: outstandingBalance,
        interestRate: (month >= firstDrawdownMonth) ? getInterestRateForMonth(month, inputsToUse) : 0,
        hasBankDrawdown: drawdownAmount > 0
      });
      
      if (outstandingBalance <= 0.01 && month >= firstDrawdownMonth) {
        break;
      }
    }
    
    return monthlySchedule;
  };

  // ✅ OPTIMIZED: Main calculation function with inputs parameter
  const calculateProgressivePayments = (inputsToUse = inputs) => {
    const completeSchedule = calculateCompleteExcelSchedule(inputsToUse);
    if (!completeSchedule) return null;

    const monthlySchedule = generateMonthlyPaymentSchedule(completeSchedule.bankLoanTimeline, inputsToUse);
    
    if (completeSchedule.bankLoanTimeline.length === 0) {
      return {
        ...completeSchedule,
        monthlySchedule: [],
        totalInterest: 0,
        totalPrincipal: 0,
        totalPayable: completeSchedule.totalCashCPF,
        firstBankDrawdownMonth: null,
        yearlyInterest: { year1: 0, year2: 0, year3: 0 }
      };
    }

    const totalInterest = monthlySchedule.reduce((sum, month) => sum + (month.interestPayment || 0), 0);
    const totalPrincipal = monthlySchedule.reduce((sum, month) => sum + (month.principalPayment || 0), 0);
    
    // Calculate yearly interest breakdown for first 3 years
    const yearlyInterest = {
      year1: monthlySchedule.filter(m => m.year === 1).reduce((sum, month) => sum + (month.interestPayment || 0), 0),
      year2: monthlySchedule.filter(m => m.year === 2).reduce((sum, month) => sum + (month.interestPayment || 0), 0),
      year3: monthlySchedule.filter(m => m.year === 3).reduce((sum, month) => sum + (month.interestPayment || 0), 0)
    };
    
    const displayStages = completeSchedule.stages.map(stage => {
      const cashCPFPercentage = (stage.cashCPFAmount / completeSchedule.purchasePrice) * 100;
      const bankLoanPercentage = (stage.bankLoanAmount / completeSchedule.purchasePrice) * 100;
      
      const roundedCashCPFPercentage = Math.round(cashCPFPercentage * 10) / 10;
      const roundedBankLoanPercentage = Math.round(bankLoanPercentage * 10) / 10;
      
      let paymentMode;
      
      // Special case for OTP - Cash only
      if (stage.stage === 'Upon grant of Option to Purchase') {
        paymentMode = `Cash (${roundedCashCPFPercentage.toFixed(1)}%)`;
      } else if (roundedCashCPFPercentage > 0 && roundedBankLoanPercentage > 0) {
        paymentMode = `Cash/CPF (${roundedCashCPFPercentage.toFixed(1)}%) + Bank Loan (${roundedBankLoanPercentage.toFixed(1)}%)`;
      } else if (roundedCashCPFPercentage > 0 && roundedBankLoanPercentage <= 0) {
        paymentMode = `Cash/CPF (${roundedCashCPFPercentage.toFixed(1)}%)`;
      } else if (roundedBankLoanPercentage > 0 && roundedCashCPFPercentage <= 0) {
        paymentMode = `Bank Loan (${roundedBankLoanPercentage.toFixed(1)}%)`;
      } else {
        paymentMode = 'No Payment Required';
      }
      
      return {
        stage: stage.stage,
        percentage: stage.percentage,
        stageAmount: stage.stageAmount,
        bankLoanAmount: stage.bankLoanAmount,
        cashCPFAmount: stage.cashCPFAmount,
        paymentMode,
        month: stage.month,
        isInitial: stage.isCashCPFOnly || false,
        isTOP: stage.isTOP || false,
        isCSC: stage.isCSC || false
      };
    });

    return {
      stages: displayStages,
      monthlySchedule,
      bankDrawdownSchedule: completeSchedule.bankLoanTimeline,
      purchasePrice: completeSchedule.purchasePrice,
      loanAmount: completeSchedule.selectedLoanAmount,
      totalCashCPF: completeSchedule.totalCashCPF,
      totalBankLoan: completeSchedule.totalBankLoan,
      totalInterest,
      totalPrincipal,
      totalPayable: totalInterest + totalPrincipal + completeSchedule.totalCashCPF,
      loanToValueRatio: (completeSchedule.selectedLoanAmount / completeSchedule.purchasePrice) * 100,
      firstBankDrawdownMonth: (() => {
        const meaningfulDrawdowns = completeSchedule.bankLoanTimeline.filter(item => item.bankLoanAmount > 1);
        return meaningfulDrawdowns.length > 0 ? Math.min(...meaningfulDrawdowns.map(item => item.bankLoanMonth)) : null;
      })(),
      timelineCalculated: completeSchedule.timelineCalculated,
      yearlyInterest,
      constructionTime: completeSchedule.constructionTime,
      timeChain: completeSchedule.timeChain
    };
  };

  // ✅ OPTIMIZED: Memoized helper functions
  const formatNumberInput = useCallback((value) => {
    if (value === '' || value === null || value === undefined) return '';
    const num = parseFloat(value.toString().replace(/,/g, ''));
    if (isNaN(num)) return '';
    return num.toLocaleString();
  }, []);

  const parseNumberInput = useCallback((value) => {
    if (value === '' || value === null || value === undefined) return '';
    const num = parseFloat(value.toString().replace(/,/g, ''));
    return isNaN(num) ? '' : num;
  }, []);

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  const calculatePMT = (rate, periods, principal) => {
    if (rate === 0 || !rate) return principal / periods;
    const monthlyRate = rate / 100 / 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, periods)) / (Math.pow(1 + monthlyRate, periods) - 1);
  };

  const getInterestRateForMonth = (month, inputsToUse = inputs) => {
    const year = Math.ceil(month / 12);
    if (year <= 5) {
      const rateInfo = inputsToUse.rates.find(r => r.year === year);
      return rateInfo ? parseFloat(rateInfo.rate) || 0 : parseFloat(inputsToUse.rates[0].rate) || 0;
    } else {
      const thereafterRate = inputsToUse.rates.find(r => r.year === 'thereafter');
      return thereafterRate ? parseFloat(thereafterRate.rate) || 0 : parseFloat(inputsToUse.rates[inputsToUse.rates.length - 1].rate) || 0;
    }
  };

  const handleInputChange = (field, value) => {
    if (['purchasePrice', 'customLoanAmount'].includes(field)) {
      // ✅ FIXED: Store raw value, don't parse immediately
      // This allows empty fields to stay empty instead of showing "0"
      setInputs(prev => ({
        ...prev,
        [field]: value  // Store raw input value
      }));
    } else if (field === 'rates') {
      setInputs(prev => ({ ...prev, rates: value }));
    } else {
      setInputs(prev => ({ ...prev, [field]: value }));
    }
  };

  // ✅ OPTIMIZED: Memoize expensive calculations with debounced inputs
  const memoizedResults = useMemo(() => {
    return calculateProgressivePayments(debouncedInputs);
  }, [
    debouncedInputs.purchasePrice,
    debouncedInputs.loanPercentage, 
    debouncedInputs.useCustomAmount,
    debouncedInputs.customLoanAmount,
    debouncedInputs.tenure,
    debouncedInputs.otpDate,
    debouncedInputs.topDate,
    debouncedInputs.numOutstandingMortgages,
    JSON.stringify(debouncedInputs.rates), // For deep comparison of rates array
    debouncedInputs.currentSora
  ]);

  React.useEffect(() => {
    setResults(memoizedResults);
  }, [memoizedResults]);

// Updated generateProgressivePaymentReport function

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
            grid-template-columns: 1fr 1fr 1fr;
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
            </div>
            <div>
                <div class="info-row">
                    <span class="info-label">Total Interest:</span>
                    <span class="info-value">${formatCurrency(results.totalInterest)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Construction Time:</span>
                    <span class="info-value">${results.constructionTime} months</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Timeline Method:</span>
                    <span class="info-value">${results.timelineCalculated ? 'Date-Calculated' : 'Default'}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="section no-break">
        <h2>🏗️ CONSTRUCTION PAYMENT SCHEDULE</h2>
        <table class="payment-table">
            <thead>
                <tr>
                    <th>Month</th>
                    <th>Construction Stage</th>
                    <th>%</th>
                    <th>Total Amount</th>
                    <th>Cash/CPF</th>
                    <th>Bank Loan</th>
                    <th>Payment Mode</th>
                </tr>
            </thead>
            <tbody>
                ${results.stages.map(stage => `
                <tr class="${
                  stage.isInitial ? 'cash-highlight' : 
                  stage.isTOP ? 'top-highlight' : 
                  stage.isCSC ? 'csc-highlight' : 
                  stage.bankLoanAmount > 0 ? 'drawdown-highlight' : ''
                }">
                    <td>${stage.month}</td>
                    <td style="text-align: left;">${stage.stage}</td>
                    <td>${stage.percentage.toFixed(1)}%</td>
                    <td>${formatCurrency(stage.stageAmount)}</td>
                    <td>${stage.cashCPFAmount > 0 ? formatCurrency(stage.cashCPFAmount) : '-'}</td>
                    <td>${stage.bankLoanAmount > 0 ? formatCurrency(stage.bankLoanAmount) : '-'}</td>
                    <td style="font-size: 6px;">${stage.paymentMode}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    ${results.bankDrawdownSchedule.length > 0 ? `
    <div class="section no-break">
        <h2>💰 BANK LOAN DRAWDOWN SCHEDULE</h2>
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
                ${results.bankDrawdownSchedule.map(drawdown => `
                <tr class="${
                  drawdown.stage.includes('Certificate of Statutory Completion') ? 'csc-highlight' : 
                  drawdown.stage.includes('TOP') ? 'top-highlight' : 'drawdown-highlight'
                }">
                    <td>${drawdown.projectMonth}</td>
                    <td>${drawdown.bankLoanMonth}</td>
                    <td style="text-align: left;">${drawdown.stage}</td>
                    <td>${formatCurrency(drawdown.bankLoanAmount)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${results.monthlySchedule.length > 0 ? `
    <div class="page-break">
        <div class="section">
            <h2>📅 MONTHLY PAYMENT SCHEDULE (First 5 Years)</h2>
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
                    ${results.monthlySchedule.slice(0, 60).map(month => `
                    <tr class="${month.drawdownAmount > 0 ? 'drawdown-highlight' : ''}">
                        <td>${month.month}</td>
                        <td>${formatCurrency(month.openingBalance)}</td>
                        <td>${month.drawdownAmount > 0 ? formatCurrency(month.drawdownAmount) : '-'}</td>
                        <td>${month.monthlyPayment > 0 ? formatCurrency(month.monthlyPayment) : '-'}</td>
                        <td>${month.interestPayment > 0 ? formatCurrency(month.interestPayment) : '-'}</td>
                        <td>${month.principalPayment > 0 ? formatCurrency(month.principalPayment) : '-'}</td>
                        <td>${formatCurrency(month.endingBalance)}</td>
                        <td>${month.interestRate > 0 ? month.interestRate.toFixed(2) + '%' : '-'}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
    ` : ''}

    <div class="disclaimer no-break">
        <h4 style="margin: 0 0 6px 0; color: #333; font-size: 10px;">Important Notes</h4>
        <p style="margin: 3px 0;">• This progressive payment schedule is based on standard BUC property development milestones.</p>
        <p style="margin: 3px 0;">• Bank loan drawdowns occur at specific construction stages as approved by the bank.</p>
        <p style="margin: 3px 0;">• Interest calculations are based on variable rates and actual drawdown amounts.</p>
        <p style="margin: 3px 0;">• Actual timeline may vary based on construction progress and developer schedules.</p>
        <p style="margin: 3px 0;">• Cash/CPF payments are required upfront for initial stages (OTP in Cash only, S&P in Cash/CPF).</p>
        <p style="margin: 3px 0;">• <strong>Color Legend:</strong> Blue = Cash/CPF Only, Yellow = Bank Drawdown, Green = TOP, Purple = CSC</p>
        <p style="margin: 3px 0;">• Consult our specialists for detailed analysis tailored to your specific project.</p>
    </div>

    <div class="footer no-break">
        <div style="margin-bottom: 6px;">
            📧 kenneth@keyquestmortgage.com.sg | 📞 +65 9795 2338 
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

  alert(`Progressive payment schedule generated successfully! 

📄 FOR BEST PDF RESULTS:
• Use Chrome or Edge browser for printing
• In print dialog, select "More settings"
• Set margins to "Minimum" or "Custom" (0.4 inch)
• Choose "A4" paper size
• Enable "Background graphics"
• Set scale to "100%" or "Fit to page width"
• Select "Portrait" orientation
• Ensure all content fits properly without being cut off`);
};

  return (
    <div className="space-y-8">
      <div className="grid-responsive cols-2">
        {/* Enhanced Input Section */}
        <div className="space-y-6">
          {/* Property Information Card */}
          <div className="standard-card card-gradient-red">
            <div className="section-header">
              <div className="icon-container red">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div className="text-content">
                <h2>BUC Property Details</h2>
                <p>Built Under Construction Payment Calculator</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Purchase Price (SGD)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={inputs.purchasePrice}
                    onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                    className="standard-input currency-input"
                    placeholder="2,300,000.00"
                  />
                  <span className="currency-symbol">SGD</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 text-gray-700">Loan Amount Options</label>
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
                      <div className="radio-card-subtitle">
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
                      <div className="radio-card-subtitle">
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
                  <div className="mt-3 fade-in">
                    <label className="block text-sm font-medium mb-1 text-gray-700">Custom Loan Amount</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={inputs.customLoanAmount}
                        onChange={(e) => handleInputChange('customLoanAmount', e.target.value)}
                        className="standard-input currency-input"
                        placeholder="1,725,000.00"
                      />
                      <span className="currency-symbol">SGD</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid-responsive cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Loan Tenure</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={inputs.tenure}
                      onChange={(e) => handleInputChange('tenure', e.target.value)}
                      className="standard-input"
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
                    onChange={(e) => handleInputChange('numOutstandingMortgages', e.target.value)}
                    className="standard-input"
                    min="0"
                    max="5"
                  />
                </div>
              </div>

              <div className="grid-responsive cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">OTP Date</label>
                  <input
                    type="date"
                    value={inputs.otpDate}
                    onChange={(e) => handleInputChange('otpDate', e.target.value)}
                    className="standard-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Expected TOP Date</label>
                  <input
                    type="date"
                    value={inputs.topDate}
                    onChange={(e) => handleInputChange('topDate', e.target.value)}
                    className="standard-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Interest Rate Configuration */}
          <div className="standard-card card-gradient-blue">
            <div className="section-header">
              <div className="icon-container blue">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="text-content">
                <h2>Variable Interest Rate Package</h2>
                <p>Progressive rate structure</p>
              </div>
            </div>
                      
            <div className="standard-card">
              <h4 className="font-medium mb-3 text-gray-700">Interest Rate Structure</h4>
              <div className="space-y-3">
                {inputs.rates.map((rate, index) => (
                  <div key={index} className="grid-responsive cols-3">
                    <div className="text-sm font-medium text-gray-600 flex items-center">
                      {rate.year === 'thereafter' ? 'Year 6 onwards' : `Year ${rate.year}`}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={rate.rate}
                        onChange={(e) => {
                          const newRates = [...inputs.rates];
                          newRates[index].rate = e.target.value;
                          handleInputChange('rates', newRates);
                        }}
                        className="standard-input"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">%</span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">{rate.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Results Section */}
        <div className="space-y-6">
          {results && (
            <>
              {/* Summary Cards */}
              <div className="grid-responsive cols-2">
                <div className="result-card success">
                  <div className="result-header">
                    <div className="result-icon bg-green-100">
                      <DollarSign className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <div className="result-title">Cash/CPF Required</div>
                      <div className="result-value success">{formatCurrency(results.totalCashCPF)}</div>
                    </div>
                  </div>
                </div>
                <div className="result-card">
                  <div className="result-header">
                    <div className="result-icon bg-blue-100">
                      <TrendingUp className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <div className="result-title">Total Bank Loan</div>
                      <div className="result-value text-blue-600">{formatCurrency(results.totalBankLoan)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Yearly Interest Breakdown */}
              <div className="grid-responsive cols-3">
                <div className="result-card warning">
                  <div className="result-header">
                    <div className="result-icon bg-orange-100">
                      <BarChart3 className="w-8 h-8 text-orange-600" />
                    </div>
                    <div>
                      <div className="result-title">1st Yr Interest</div>
                      <div className="result-value warning">{formatCurrency(results.yearlyInterest.year1)}</div>
                    </div>
                  </div>
                </div>
                <div className="result-card">
                  <div className="result-header">
                    <div className="result-icon bg-purple-100">
                      <BarChart3 className="w-8 h-8 text-purple-600" />
                    </div>
                    <div>
                      <div className="result-title">2nd Yr Interest</div>
                      <div className="result-value text-purple-600">{formatCurrency(results.yearlyInterest.year2)}</div>
                    </div>
                  </div>
                </div>
                <div className="result-card">
                  <div className="result-header">
                    <div className="result-icon bg-pink-100">
                      <BarChart3 className="w-8 h-8 text-pink-600" />
                    </div>
                    <div>
                      <div className="result-title">3rd Yr Interest</div>
                      <div className="result-value text-pink-600">{formatCurrency(results.yearlyInterest.year3)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Construction Payment Schedule */}
              <div className="standard-card">
                <div className="section-header">
                  <div className="icon-container blue">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-content">
                    <h2>Construction Payment Schedule</h2>
                    <p>Progressive payment breakdown based on construction milestones
                      {results.timelineCalculated && (
                        <span className="text-green-600 font-medium ml-2">
                          • Timeline calculated from project dates
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-center py-3 font-medium text-gray-700 min-w-[80px]">Month</th>
                          <th className="text-left py-3 font-medium text-gray-700 min-w-[200px]">Construction Stage</th>
                          <th className="text-center py-3 font-medium text-gray-700 min-w-[60px]">%</th>
                          <th className="text-center py-3 font-medium text-gray-700 min-w-[120px]">Total Amount</th>
                          <th className="text-center py-3 font-medium text-gray-700 min-w-[100px]">Cash/CPF</th>
                          <th className="text-center py-3 font-medium text-gray-700 min-w-[100px]">Bank Loan</th>
                          <th className="text-center py-3 font-medium text-gray-700 min-w-[120px]">Payment Mode</th>
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

                {/* Mobile Card View */}
                <div className="lg:hidden">
                  <div className="space-y-4">
                    {results.stages.map((stage, index) => (
                      <div key={index} className={`standard-card ${
                        stage.isInitial ? 'card-gradient-blue' : 
                        stage.isTOP ? 'card-gradient-green' : 
                        stage.isCSC ? 'card-gradient-purple' : 
                        stage.bankLoanAmount > 0 ? 'card-gradient-yellow' : ''
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-semibold text-gray-700">Month {stage.month}</span>
                          <span className="text-sm font-medium text-gray-600">{stage.percentage.toFixed(1)}%</span>
                        </div>
                        <h4 className="font-medium text-gray-800 mb-3 leading-snug">{stage.stage}</h4>
                        <div className="grid-responsive cols-2 text-sm">
                          <div>
                            <span className="text-gray-600">Total Amount:</span>
                            <div className="font-semibold">{formatCurrency(stage.stageAmount)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Cash/CPF:</span>
                            <div className="font-semibold">
                              {stage.cashCPFAmount > 0 ? formatCurrency(stage.cashCPFAmount) : '-'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Bank Loan:</span>
                            <div className="font-semibold text-green-600">
                              {stage.bankLoanAmount > 0 ? formatCurrency(stage.bankLoanAmount) : '-'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Payment Mode:</span>
                            <div className="text-xs mt-1">
                              <span className={`px-2 py-1 rounded-full font-medium ${
                                stage.isInitial ? 'bg-blue-100 text-blue-800' : 
                                stage.isTOP ? 'bg-green-100 text-green-800' :
                                stage.isCSC ? 'bg-purple-100 text-purple-800' :
                                stage.bankLoanAmount > 0 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {stage.paymentMode}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bank Loan Drawdown Schedule */}
              {results.bankDrawdownSchedule.length > 0 && (
                <div className="standard-card">
                  <div className="section-header">
                    <div className="icon-container yellow">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-content">
                      <h2>Bank Loan Drawdown Schedule</h2>
                      <p>Bank loan disbursement timing based on construction progress</p>
                    </div>
                  </div>
                  
                  {/* Desktop Table View */}
                  <div className="hidden lg:block">
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

                  {/* Mobile Card View */}
                  <div className="lg:hidden">
                    <div className="space-y-4">
                      {results.bankDrawdownSchedule.map((drawdown, index) => (
                        <div key={index} className={`standard-card ${
                          drawdown.stage.includes('Certificate of Statutory Completion') ? 'card-gradient-purple' : 
                          drawdown.stage.includes('TOP') ? 'card-gradient-green' : 
                          'card-gradient-yellow'
                        }`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-gray-700">Project Month {drawdown.projectMonth}</span>
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold text-sm">
                              Bank Month {drawdown.bankLoanMonth}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-800 mb-2 leading-snug">{drawdown.stage}</h4>
                          <div className="text-right">
                            <span className="text-sm text-gray-600">Bank Loan Amount:</span>
                            <div className="text-lg font-bold text-green-600">{formatCurrency(drawdown.bankLoanAmount)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Monthly Payment Schedule */}
              <div className="standard-card">
                <div className="section-header">
                  <div className="icon-container green">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-content">
                    <h2>Monthly Payment Schedule</h2>
                    <p>
                      {results.firstBankDrawdownMonth ? (
                        `Payment schedule starts from Month ${results.firstBankDrawdownMonth} with progressive loan drawdowns`
                      ) : (
                        '100% Cash/CPF payment - No bank loan servicing required'
                      )}
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => setExpandedMonthlySchedule(!expandedMonthlySchedule)}
                      className="btn-standard btn-secondary btn-sm"
                    >
                      <span className="text-sm font-medium">
                        {expandedMonthlySchedule ? 'Show Less' : 'Show More'}
                      </span>
                      {expandedMonthlySchedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {results.monthlySchedule.length > 0 && (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden lg:block">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-gray-200">
                              <th className="text-center py-3 font-medium text-gray-700 min-w-[60px]">Month</th>
                              <th className="text-center py-3 font-medium text-gray-700 min-w-[120px]">Opening Balance</th>
                              <th className="text-center py-3 font-medium text-gray-700 min-w-[120px]">Bank Drawdown</th>
                              <th className="text-center py-3 font-medium text-gray-700 min-w-[120px]">Monthly Payment</th>
                              <th className="text-center py-3 font-medium text-gray-700 min-w-[100px]">Interest</th>
                              <th className="text-center py-3 font-medium text-gray-700 min-w-[100px]">Principal</th>
                              <th className="text-center py-3 font-medium text-gray-700 min-w-[120px]">Ending Balance</th>
                              <th className="text-center py-3 font-medium text-gray-700 min-w-[60px]">Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.monthlySchedule.slice(0, expandedMonthlySchedule ? 120 : 60).map((month, index) => (
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

                    {/* Mobile Card View */}
                    <div className="lg:hidden">
                      <div className="space-y-4">
                        {results.monthlySchedule.slice(0, expandedMonthlySchedule ? 120 : 24).map((month, index) => (
                          <div key={index} className={`standard-card ${
                            month.drawdownAmount > 0 ? 'card-gradient-yellow' : ''
                          }`}>
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-lg font-semibold text-gray-800">Month {month.month}</span>
                              {month.interestRate > 0 && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                                  {month.interestRate.toFixed(2)}%
                                </span>
                              )}
                            </div>
                            
                            <div className="grid-responsive cols-2 text-sm">
                              <div>
                                <span className="text-gray-600">Opening Balance:</span>
                                <div className="font-semibold">{formatCurrency(month.openingBalance)}</div>
                              </div>
                              {month.drawdownAmount > 0 && (
                                <div>
                                  <span className="text-gray-600">Bank Drawdown:</span>
                                  <div className="font-semibold text-green-600">{formatCurrency(month.drawdownAmount)}</div>
                                </div>
                              )}
                              {month.monthlyPayment > 0 && (
                                <div>
                                  <span className="text-gray-600">Monthly Payment:</span>
                                  <div className="font-semibold text-blue-600">{formatCurrency(month.monthlyPayment)}</div>
                                </div>
                              )}
                              {month.interestPayment > 0 && (
                                <div>
                                  <span className="text-gray-600">Interest:</span>
                                  <div className="font-semibold">{formatCurrency(month.interestPayment)}</div>
                                </div>
                              )}
                              {month.principalPayment > 0 && (
                                <div>
                                  <span className="text-gray-600">Principal:</span>
                                  <div className="font-semibold">{formatCurrency(month.principalPayment)}</div>
                                </div>
                              )}
                              <div>
                                <span className="text-gray-600">Ending Balance:</span>
                                <div className="font-semibold">{formatCurrency(month.endingBalance)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Generate Report Button */}
              <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-1 shadow-lg">
                <button
                  onClick={generateProgressivePaymentReport}
                  className="btn-standard btn-lg w-full bg-white text-red-600 hover:bg-gray-50"
                >
                  <Download className="w-6 h-6" />
                  <div className="text-left">
                    <div>Generate Progressive Payment Report</div>
                    <div className="text-sm opacity-75">Complete BUC property payment schedule</div>
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
