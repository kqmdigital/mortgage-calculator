import React, { useState, useMemo, useCallback } from 'react';
import { Download, BarChart3, Calendar, TrendingUp, DollarSign, Building, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import useDebounce from './hooks/useDebounce';

// Progressive Payment Calculator - Enhanced UI Version
const ProgressivePaymentCalculator = ({ currentUser }) => {
  const [inputs, setInputs] = useState({
    clientName: '',
    purchasePrice: '',
    loanPercentage: 75,
    useCustomAmount: false,
    customLoanAmount: '',
    tenure: 20,
    otpDate: '',
    topDate: '',
    
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
        hasBankDrawdown: drawdownAmount > 0,
        bankLoanMonth: drawdownAmount > 0 ? month : null
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
        paymentMode = 'Cash';
      } else if (roundedCashCPFPercentage > 0 && roundedBankLoanPercentage > 0) {
        paymentMode = 'Cash/CPF + Bank Loan';
      } else if (roundedCashCPFPercentage > 0 && roundedBankLoanPercentage <= 0) {
        paymentMode = 'Cash/CPF';
      } else if (roundedBankLoanPercentage > 0 && roundedCashCPFPercentage <= 0) {
        paymentMode = 'Bank Loan';
      } else {
        paymentMode = 'No Payment Required';
      }
      
      // Find corresponding bank loan month from drawdown schedule
      const drawdownEntry = completeSchedule.bankLoanTimeline.find(
        drawdown => drawdown.projectMonth === stage.month
      );
      const bankLoanMonth = drawdownEntry ? drawdownEntry.bankLoanMonth : null;
      
      // Get cumulative monthly installment from monthly schedule
      let monthlyInstallment = null;
      if (bankLoanMonth && monthlySchedule.length > 0) {
        // Find the monthly payment for this bank loan month
        const monthlyEntry = monthlySchedule.find(month => 
          month.bankLoanMonth && month.bankLoanMonth === bankLoanMonth
        );
        monthlyInstallment = monthlyEntry ? monthlyEntry.monthlyPayment : null;
      }
      
      return {
        stage: stage.stage,
        percentage: stage.percentage,
        stageAmount: stage.stageAmount,
        bankLoanAmount: stage.bankLoanAmount,
        cashCPFAmount: stage.cashCPFAmount,
        paymentMode,
        month: stage.month,
        bankLoanMonth,
        monthlyInstallment,
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

  // Extract complex expression for dependency array
  const ratesStringified = JSON.stringify(debouncedInputs.rates);
  
  // ✅ OPTIMIZED: Memoize expensive calculations with debounced inputs
  const memoizedResults = useMemo(() => {
    return calculateProgressivePayments(debouncedInputs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedInputs.purchasePrice,
    debouncedInputs.loanPercentage, 
    debouncedInputs.useCustomAmount,
    debouncedInputs.customLoanAmount,
    debouncedInputs.tenure,
    debouncedInputs.otpDate,
    debouncedInputs.topDate,
    ratesStringified, // For deep comparison of rates array
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
        @page { 
            size: A4; 
            margin: 0.4in;
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
                margin: 0.4in;
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
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
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
            width: 120px !important; 
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
        /* Monthly Payment Schedule table with fixed column widths */
        .monthly-payment-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
            margin: 8px 0;
            table-layout: fixed;
        }
        .monthly-payment-table th,
        .monthly-payment-table td {
            border: 1px solid #ccc;
            padding: 4px 3px;
            text-align: center;
            vertical-align: middle;
        }
        /* Specific column widths for Monthly Payment Schedule only */
        .monthly-payment-table th:nth-child(1),
        .monthly-payment-table td:nth-child(1) { width: 8%; } /* Month */
        .monthly-payment-table th:nth-child(2),
        .monthly-payment-table td:nth-child(2) { width: 14%; } /* Opening Balance */
        .monthly-payment-table th:nth-child(3),
        .monthly-payment-table td:nth-child(3) { width: 14%; } /* Bank Drawdown */
        .monthly-payment-table th:nth-child(4),
        .monthly-payment-table td:nth-child(4) { width: 14%; } /* Monthly Payment */
        .monthly-payment-table th:nth-child(5),
        .monthly-payment-table td:nth-child(5) { width: 12%; } /* Interest */
        .monthly-payment-table th:nth-child(6),
        .monthly-payment-table td:nth-child(6) { width: 12%; } /* Principal */
        .monthly-payment-table th:nth-child(7),
        .monthly-payment-table td:nth-child(7) { width: 14%; } /* Ending Balance */
        .monthly-payment-table th:nth-child(8),
        .monthly-payment-table td:nth-child(8) { width: 12%; } /* Rate */
        .payment-table th,
        .monthly-payment-table th {
            background: #f8f9fa;
            font-weight: bold;
            color: #374151;
            font-size: 8px;
        }
        .payment-table td,
        .monthly-payment-table td {
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
            body { font-size: 11px !important; }
            .payment-table { font-size: 8px !important; }
            .payment-table th, .payment-table td { padding: 3px 2px !important; font-size: 8px !important; }
            .logo-section img { width: 100px !important; height: auto !important; }
            
            /* Enhanced Mobile PDF Support */
            .section,
            .disclaimer { 
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
            
            /* Prevent table splitting on mobile */
            .payment-table {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                -webkit-column-break-inside: avoid !important;
                display: table !important;
                width: 100% !important;
                margin-bottom: 20px !important;
            }
            
            /* Mobile WebKit specific fixes */
            @supports (-webkit-appearance: none) {
                .section {
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
    <div class="header no-break">
        <div class="logo-section">
            <img src="https://ik.imagekit.io/hst9jooux/KeyQuest%20Logo1.JPG?updatedAt=1753157996192" alt="KeyQuest Mortgage Logo">
        </div>
        <div class="property-banner">BUC Property - Progressive Payment Schedule</div>
        <div class="report-info">
            <strong>Built Under Construction Payment Analysis</strong><br>
            Generated: ${currentDate} | Report ID: KQM-PPE-${Date.now()}
        </div>
    </div>

    <div class="section no-break">
        <h2>🏗️ PROJECT SUMMARY</h2>
        <div class="info-grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
                ${inputs.clientName ? `
                <div class="info-row">
                    <span class="info-label">Client Name:</span>
                    <span class="info-value">${inputs.clientName}</span>
                </div>` : ''}
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
                    <span class="info-label">Loan Tenor:</span>
                    <span class="info-value">${inputs.tenure} years</span>
                </div>
            </div>
            <div>
                <div class="info-row">
                    <span class="info-label">Interest Rate Structure:</span>
                </div>
                ${inputs.rates.map(rate => `
                <div class="info-row" style="margin-left: 8px;">
                    <span class="info-label" style="font-size: 8px;">${rate.year === 'thereafter' ? 'Year 6+' : `Year ${rate.year}`}:</span>
                    <span class="info-value" style="font-size: 8px;">${rate.rate}%</span>
                </div>
                `).join('')}
            </div>
        </div>
    </div>

    <div class="section no-break">
        <h2>🏗️ SCHEDULE SUMMARY</h2>
        <table class="payment-table">
            <thead>
                <tr>
                    <th>Project Month</th>
                    <th>Bank Loan Month</th>
                    <th>Construction Stage</th>
                    <th>%</th>
                    <th>Total Amount</th>
                    <th>Cash/CPF</th>
                    <th>Bank Loan</th>
                    <th>Monthly Installment</th>
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
                    <td>${stage.bankLoanMonth || '-'}</td>
                    <td style="text-align: left;">${stage.stage}</td>
                    <td>${stage.percentage.toFixed(1)}%</td>
                    <td>${formatCurrency(stage.stageAmount)}</td>
                    <td>${stage.cashCPFAmount > 0 ? formatCurrency(stage.cashCPFAmount) : '-'}</td>
                    <td>${stage.bankLoanAmount > 0 ? formatCurrency(stage.bankLoanAmount) : '-'}</td>
                    <td>${stage.monthlyInstallment ? formatCurrency(stage.monthlyInstallment) : '-'}</td>
                    <td style="font-size: 6px;">${stage.paymentMode.replace(/\s*\([^)]*\)/g, '')}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    ${results.monthlySchedule.length > 0 ? `
    <div class="page-break">
        <div class="section">
            <h2>📅 MONTHLY PAYMENT SCHEDULE (First 5 Years)</h2>
            <table class="monthly-payment-table">
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
        <h4 style="margin: 0 0 6px 0; color: #333; font-size: 10px;">Disclaimer – Keyquest Ventures Private Limited</h4>
        <p style="margin: 4px 0;">This report is for general information and personal reference only. It does not constitute financial, investment, or professional advice, and does not take into account individual goals or financial situations.</p>
        <p style="margin: 4px 0;">Users should not rely solely on this information when making financial or investment decisions. While we aim to use reliable data, Keyquest Ventures Private Limited does not guarantee its accuracy or completeness.</p>
        <p style="margin: 4px 0;">Use of our reports, consultancy services, or advice—whether by the recipient directly or through our consultants, affiliates, or partners—is undertaken entirely at the user's own risk. Keyquest Ventures Private Limited, including its affiliates and employees, bears no responsibility or liability for any decisions made or actions taken based on the information provided.</p>
    </div>

    <div class="footer no-break">
        <div style="font-size: 8px; color: #6b7280;">
            ${currentUser?.name || 'User'} | ${currentUser?.email || 'email@example.com'} | contactus@keyquestmortgage.com.sg<br>
            <strong style="color: #264A82; margin-top: 3px; display: block;">Your Trusted Mortgage Advisory Partner</strong>
        </div>
    </div>
</body>
</html>
  `;

  // Open PDF in new window with enhanced download functionality
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
        // Set print media styles and trigger print with standardized filename
        const currentDate = new Date();
        const dateStr = currentDate.getFullYear() + 
                      String(currentDate.getMonth() + 1).padStart(2, '0') + 
                      String(currentDate.getDate()).padStart(2, '0');
        const fileName = `KeyQuest-Progressive-Report-${dateStr}`;
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
};

  return (
    <div className="space-y-10">
      {/* Input Sections - Side by Side */}
      <div className="grid-responsive cols-2">
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
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Client Name</label>
              <input
                type="text"
                value={inputs.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                className="standard-input"
                placeholder="Enter client name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Purchase Price (SGD)</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatNumberInput(inputs.purchasePrice)}
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
                      inputMode="numeric"
                      value={formatNumberInput(inputs.customLoanAmount)}
                      onChange={(e) => handleInputChange('customLoanAmount', e.target.value)}
                      className="standard-input currency-input"
                      placeholder="1,725,000.00"
                    />
                    <span className="currency-symbol">SGD</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Loan Tenure</label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  value={inputs.tenure}
                  onChange={(e) => handleInputChange('tenure', e.target.value)}
                  className="standard-input"
                  min="5"
                  max="35"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">years</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="space-y-4">
              {inputs.rates.map((rate, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="text-sm font-medium text-gray-600">
                    {rate.year === 'thereafter' ? 'Year 6 onwards' : `Year ${rate.year}`}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
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
                  <div className="text-xs text-gray-500">{rate.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Section - Full Width Below */}
      {results && (
        <div className="space-y-8">
          {/* Summary Cards - Main Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <div className="result-card">
              <div className="result-header">
                <div className="result-icon bg-purple-100">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <div className="result-title">Total Interest</div>
                  <div className="result-value text-purple-600">{formatCurrency(results.totalInterest)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Yearly Interest Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <h2>Schedule Summary</h2>
                    <p>Comprehensive payment breakdown with monthly installments
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
                          <th className="text-center py-3 font-medium text-gray-700 min-w-[80px]">Project Month</th>
                          <th className="text-center py-3 font-medium text-gray-700 min-w-[80px]">Bank Loan Month</th>
                          <th className="text-left py-3 font-medium text-gray-700 min-w-[200px]">Construction Stage</th>
                          <th className="text-center py-3 font-medium text-gray-700 min-w-[60px]">%</th>
                          <th className="text-center py-3 font-medium text-gray-700 min-w-[120px]">Total Amount</th>
                          <th className="text-center py-3 font-medium text-gray-700 min-w-[100px]">Cash/CPF</th>
                          <th className="text-center py-3 font-medium text-gray-700 min-w-[100px]">Bank Loan</th>
                          <th className="text-center py-3 font-medium text-gray-700 min-w-[120px]">Monthly Installment</th>
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
                            <td className="py-4 text-center font-medium">{stage.bankLoanMonth || '-'}</td>
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
                              {stage.monthlyInstallment ? (
                                <span className="text-blue-600 font-medium">
                                  {formatCurrency(stage.monthlyInstallment)}
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
                  <div className="space-y-6">
                    {results.stages.map((stage, index) => (
                      <div key={index} className={`standard-card ${
                        stage.isInitial ? 'card-gradient-blue' : 
                        stage.isTOP ? 'card-gradient-green' : 
                        stage.isCSC ? 'card-gradient-purple' : 
                        stage.bankLoanAmount > 0 ? 'card-gradient-yellow' : ''
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm font-semibold text-gray-700">
                            <div>Project Month {stage.month}</div>
                            {stage.bankLoanMonth && (
                              <div className="text-xs text-gray-500">Bank Loan Month {stage.bankLoanMonth}</div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-600">{stage.percentage.toFixed(1)}%</span>
                        </div>
                        <h4 className="font-medium text-gray-800 mb-3 leading-snug">{stage.stage}</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
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
                            <span className="text-gray-600">Monthly Installment:</span>
                            <div className="font-semibold text-blue-600">
                              {stage.monthlyInstallment ? formatCurrency(stage.monthlyInstallment) : '-'}
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
                      <div className="space-y-6">
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
                            
                            <div className="grid grid-cols-2 gap-3 text-sm">
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
        </div>
      )}
    </div>
  );
};

export default ProgressivePaymentCalculator;
