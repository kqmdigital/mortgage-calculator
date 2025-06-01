import React, { useState } from 'react';
import { Download, BarChart3, Calendar, TrendingUp, DollarSign, Building, Info } from 'lucide-react';

// Progressive Payment Calculator - COMPLETE EXCEL DEPENDENCY CHAIN IMPLEMENTATION
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

  // EXCEL I4/J4/K4 LOGIC: Complete time calculation chain
  const calculateExcelTimeChain = (otpDate, topDate) => {
    if (!otpDate || !topDate) {
      // Default construction time when dates not provided
      return {
        I4: null, // Days difference
        J4: null, // Total project months  
        K4: 37,   // Default construction time
        timelineCalculated: false
      };
    }
    
    const otpDateObj = new Date(otpDate);
    const topDateObj = new Date(topDate);
    
    // Excel I4: H4-G4 (days difference)
    const I4 = (topDateObj - otpDateObj) / (1000 * 60 * 60 * 24);
    
    // Excel J4: ROUNDDOWN((I4/365)*12,0) (total project months)
    const J4 = Math.floor((I4 / 365) * 12);
    
    // Excel K4: J4-E8-E9 (construction time = total - OTP time - S&P time)
    const E8 = 1; // OTP time
    const E9 = 2; // S&P time
    const K4 = J4 - E8 - E9;
    
    return {
      I4,
      J4, 
      K4,
      timelineCalculated: true
    };
  };

  // EXCEL E10-E15 LOGIC: ROUNDUP formulas dependent on K4
  const calculateExcelConstructionTimings = (K4) => {
    // Excel construction stage weights (C10-C15)
    const constructionWeights = [
      { stage: 'Completion of foundation work', percentage: 10, weight: 0.1 },
      { stage: 'Completion of reinforced concrete framework of unit', percentage: 10, weight: 0.1 },
      { stage: 'Completion of partition walls of unit', percentage: 5, weight: 0.05 },
      { stage: 'Completion of roofing/ceiling of unit', percentage: 5, weight: 0.05 },
      { stage: 'Completion of door sub-frames/ door frames, window frames, electrical wiring, internal plastering and plumbing of unit', percentage: 5, weight: 0.05 },
      { stage: 'Completion of car park, roads and drains serving the housing project', percentage: 5, weight: 0.05 }
    ];
    
    // Excel SUM($C$10:$C$15) = 0.4
    const totalWeight = 0.4;
    
    return constructionWeights.map((stage, index) => ({
      ...stage,
      // Excel ROUNDUP($K$4*(Crow/SUM($C$10:$C$15)),0)
      estimatedTime: Math.ceil(K4 * (stage.weight / totalWeight)),
      excelRow: 10 + index
    }));
  };

  // EXCEL COLUMN G LOGIC: Bank loan allocation with exact formulas
  const calculateExcelBankLoanAllocation = (allStages, loanAmount, totalCashCPFRequired, purchasePrice) => {
    return allStages.map((stage, index) => {
      // OTP and S&P are always cash/CPF only (Excel G8=0, G9=0)
      if (stage.isCashCPFOnly) {
        return {
          ...stage,
          bankLoanAmount: 0,
          cashCPFAmount: stage.stageAmount
        };
      }

      // Excel G10-G17 formulas: IF(SUM($D10:D$17)<=$D$5,D10,IF(SUM($D$8:D10)>$E$5,(SUM($D$8:D10)-$E$5),0))
      
      // Get all stages that can receive bank loan (exclude OTP/S&P)
      const bankLoanStages = allStages.filter(s => !s.isCashCPFOnly);
      const currentStageIndex = bankLoanStages.findIndex(s => s.stage === stage.stage);
      
      if (currentStageIndex === -1) {
        return { ...stage, bankLoanAmount: 0, cashCPFAmount: stage.stageAmount };
      }
      
      // Calculate SUM($D10:D$17) - sum of remaining stages from current onwards
      const remainingStagesFromCurrent = bankLoanStages.slice(currentStageIndex);
      const sumRemainingStages = remainingStagesFromCurrent.reduce((sum, s) => sum + s.stageAmount, 0);
      
      // Calculate SUM($D$8:Dcurrent) - cumulative sum from OTP to current stage
      const cumulativeToCurrentIndex = allStages.findIndex(s => s.stage === stage.stage);
      const cumulativeToCurrent = allStages.slice(0, cumulativeToCurrentIndex + 1)
        .reduce((sum, s) => sum + s.stageAmount, 0);
      
      let bankLoanAmount = 0;
      
      // Excel logic: IF(SUM($D10:D$17)<=$D$5, D10, IF(SUM($D$8:D10)>$E$5, (SUM($D$8:D10)-$E$5), 0))
      if (sumRemainingStages <= loanAmount) {
        // If remaining stages sum <= total loan amount: allocate full stage amount to bank
        bankLoanAmount = stage.stageAmount;
      } else if (cumulativeToCurrent > totalCashCPFRequired) {
        // If cumulative > cash/CPF requirement: allocate excess to bank
        bankLoanAmount = cumulativeToCurrent - totalCashCPFRequired;
        // Ensure bank loan doesn't exceed current stage amount
        bankLoanAmount = Math.min(bankLoanAmount, stage.stageAmount);
        // Ensure bank loan is not negative
        bankLoanAmount = Math.max(0, bankLoanAmount);
      }
      
      // Round very small amounts to 0 (Excel behavior)
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

  // EXCEL COLUMN N LOGIC: Bank loan month with complete E-value dependency
  const calculateExcelBankLoanMonths = (stagesWithBankAllocation, purchasePrice) => {
    // Create array mapping to Excel rows 10-17 (construction stages + TOP + CSC)
    const excelStages = stagesWithBankAllocation.filter(stage => !stage.isCashCPFOnly);
    
    // Step 1: Calculate N values using EXACT Excel Column N formulas with K4-derived E values
    const nValues = [];
    
    excelStages.forEach((stage, index) => {
      const currentG = stage.bankLoanAmount;
      const currentGIsZero = currentG <= 0.01; // Excel treats very small numbers as 0
      
      let nValue = null;
      
      if (index === 0) {
        // Excel N10: IF(G10=0,"",1)
        nValue = currentGIsZero ? null : 1;
      } else {
        // Get previous stage info
        const prevStage = excelStages[index - 1];
        const prevG = prevStage.bankLoanAmount;
        const prevGIsZero = prevG <= 0.01;
        const prevNValue = nValues[index - 1]?.nValue;
        
        // Excel N11-N17 pattern: IF(AND(G(prev)=0,G(current)=0),"",IF(G(prev)=0,1,N(prev)+E(prev)))
        if (prevGIsZero && currentGIsZero) {
          // Both previous and current G are 0 -> empty ("")
          nValue = null;
        } else if (prevGIsZero && !currentGIsZero) {
          // Previous G is 0, current G is not 0 -> 1
          nValue = 1;
        } else if (!prevGIsZero) {
          // Previous G is not 0 -> N(prev) + E(prev)
          if (prevNValue !== null) {
            // Use EXACT E value from previous stage based on Excel row
            let prevEstimatedTime;
            
            if (prevStage.excelRow === 8) {
              prevEstimatedTime = 1; // E8 = 1 (hardcoded)
            } else if (prevStage.excelRow === 9) {
              prevEstimatedTime = 2; // E9 = 2 (hardcoded)
            } else if (prevStage.excelRow >= 10 && prevStage.excelRow <= 15) {
              prevEstimatedTime = prevStage.estimatedTime; // E10-E15: K4-derived ROUNDUP results
            } else if (prevStage.excelRow === 16) {
              prevEstimatedTime = 0; // E16 = undefined/empty (treat as 0)
            } else if (prevStage.excelRow === 17) {
              prevEstimatedTime = 12; // E17 = 12 (hardcoded)
            }
            
            nValue = prevNValue + prevEstimatedTime;
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
    
    // Step 2: Filter and create final bank loan schedule
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

  // COMPLETE EXCEL CALCULATION: All dependencies integrated
  const calculateCompleteExcelSchedule = () => {
    const purchasePrice = parseNumberInput(inputs.purchasePrice) || 0;
    
    // Calculate selected loan amount
    let selectedLoanAmount;
    if (inputs.useCustomAmount) {
      selectedLoanAmount = parseNumberInput(inputs.customLoanAmount) || 0;
    } else {
      selectedLoanAmount = purchasePrice * (inputs.loanPercentage / 100);
    }

    if (purchasePrice <= 0 || selectedLoanAmount <= 0) return null;

    const totalCashCPFRequired = purchasePrice - selectedLoanAmount;
    
    // Step 1: Calculate complete time chain (I4/J4/K4)
    const timeChain = calculateExcelTimeChain(inputs.otpDate, inputs.topDate);
    const { K4, timelineCalculated } = timeChain;
    
    // Step 2: Calculate construction timings using K4-dependent ROUNDUP formulas
    const constructionStages = calculateExcelConstructionTimings(K4);

    // Step 3: Build complete stage array with EXACT Excel row mapping
    const allStages = [];
    
    // Row 8: OTP (E8 = 1, hardcoded)
    allStages.push({
      stage: 'Upon grant of Option to Purchase', 
      percentage: 5, 
      estimatedTime: 1, // E8 = 1 (hardcoded)
      isCashCPFOnly: true,
      stageAmount: purchasePrice * 0.05,
      month: 1,
      excelRow: 8
    });
    
    // Row 9: S&P (E9 = 2, hardcoded)
    allStages.push({
      stage: 'Upon signing S&P Agreement (within 8 weeks from OTP)', 
      percentage: 15, 
      estimatedTime: 2, // E9 = 2 (hardcoded)
      isCashCPFOnly: true,
      stageAmount: purchasePrice * 0.15,
      month: 2,
      excelRow: 9
    });

    // Rows 10-15: Construction stages with K4-derived ROUNDUP timing
    let cumulativeMonth = 3; // Start after OTP (1) and S&P (2)
    constructionStages.forEach((stage, index) => {
      allStages.push({
        stage: stage.stage,
        percentage: stage.percentage,
        estimatedTime: stage.estimatedTime, // K4-derived ROUNDUP result
        isCashCPFOnly: false,
        stageAmount: purchasePrice * (stage.percentage / 100),
        month: cumulativeMonth,
        excelRow: 10 + index
      });
      cumulativeMonth += stage.estimatedTime;
    });

    // Row 16: TOP (E16 = undefined/empty)
    const topMonth = cumulativeMonth;
    allStages.push({
      stage: 'Temporary Occupation Permit (TOP)',
      percentage: 25,
      estimatedTime: undefined, // E16 = undefined/empty (exactly as in Excel)
      isCashCPFOnly: false,
      isTOP: true,
      stageAmount: purchasePrice * 0.25,
      month: topMonth,
      excelRow: 16
    });

    // Row 17: CSC (E17 = 12, hardcoded)
    allStages.push({
      stage: 'Certificate of Statutory Completion',
      percentage: 15,
      estimatedTime: 12, // E17 = 12 (hardcoded, exactly as in Excel)
      isCashCPFOnly: false,
      isCSC: true,
      stageAmount: purchasePrice * 0.15,
      month: topMonth + 12,
      excelRow: 17
    });

    // Step 4: Apply Excel bank loan allocation logic (Column G)
    const stagesWithBankLoan = calculateExcelBankLoanAllocation(allStages, selectedLoanAmount, totalCashCPFRequired, purchasePrice);

    // Step 5: Calculate bank loan months using K4-affected E values (Column N)
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

  // EXCEL DRAWDOWN LOGIC: Progressive payment calculation
  const generateMonthlyPaymentSchedule = (bankLoanTimeline) => {
    if (!bankLoanTimeline || bankLoanTimeline.length === 0) return [];
    
    const monthlySchedule = [];
    const totalMonths = inputs.tenure * 12;
    let outstandingBalance = 0;
    
    // Create drawdown lookup map (Excel Column N → Column O mapping)
    const drawdownMap = new Map();
    bankLoanTimeline.forEach(item => {
      drawdownMap.set(item.bankLoanMonth, item.bankLoanAmount);
    });
    
    // Find the first month with actual bank drawdown
    const meaningfulDrawdowns = bankLoanTimeline.filter(item => item.bankLoanAmount > 1);
    const firstDrawdownMonth = meaningfulDrawdowns.length > 0 ? Math.min(...meaningfulDrawdowns.map(item => item.bankLoanMonth)) : null;
    
    if (!firstDrawdownMonth) return [];
    
    // Generate monthly schedule (Excel Drawdown sheet logic)
    for (let month = 1; month <= totalMonths; month++) {
      const drawdownAmount = drawdownMap.get(month) || 0;
      
      // Add drawdown to balance (this happens first)
      if (drawdownAmount > 0) {
        outstandingBalance += drawdownAmount;
      }
      
      const openingBalance = outstandingBalance;
      
      // Calculate payments (only if we've reached first drawdown month and have outstanding balance)
      let monthlyPayment = 0;
      let interestPayment = 0;
      let principalPayment = 0;
      
      if (month >= firstDrawdownMonth && outstandingBalance > 0) {
        const currentRate = getInterestRateForMonth(month);
        const monthlyRate = currentRate / 100 / 12;
        
        interestPayment = outstandingBalance * monthlyRate;
        
        // Recalculate payment using PMT function (Excel logic)
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
        interestRate: (month >= firstDrawdownMonth) ? getInterestRateForMonth(month) : 0,
        hasBankDrawdown: drawdownAmount > 0
      });
      
      // Stop if loan is fully paid
      if (outstandingBalance <= 0.01 && month >= firstDrawdownMonth) {
        break;
      }
    }
    
    return monthlySchedule;
  };

  // Main calculation function integrating all Excel dependencies
  const calculateProgressivePayments = () => {
    const completeSchedule = calculateCompleteExcelSchedule();
    if (!completeSchedule) return null;

    const monthlySchedule = generateMonthlyPaymentSchedule(completeSchedule.bankLoanTimeline);
    
    if (completeSchedule.bankLoanTimeline.length === 0) {
      // No bank loan drawdowns (100% cash/CPF)
      return {
        ...completeSchedule,
        monthlySchedule: [],
        totalInterest: 0,
        totalPrincipal: 0,
        totalPayable: completeSchedule.totalCashCPF,
        firstBankDrawdownMonth: null,
        yearlyInterest: { year1: 0, year2: 0, year3: 0, year4: 0 }
      };
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
      const cashCPFPercentage = (stage.cashCPFAmount / completeSchedule.purchasePrice) * 100;
      const bankLoanPercentage = (stage.bankLoanAmount / completeSchedule.purchasePrice) * 100;
      
      const roundedCashCPFPercentage = Math.round(cashCPFPercentage * 10) / 10;
      const roundedBankLoanPercentage = Math.round(bankLoanPercentage * 10) / 10;
      
      let paymentMode;
      
      if (roundedCashCPFPercentage > 0 && roundedBankLoanPercentage > 0) {
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

  // Get interest rate for specific month
  const getInterestRateForMonth = (month) => {
    const year = Math.ceil(month / 12);
    if (year <= 5) {
      const rateInfo = inputs.rates.find(r => r.year === year);
      return rateInfo ? rateInfo.rate : inputs.rates[0].rate;
    } else {
      const thereafterRate = inputs.rates.find(r => r.year === 'thereafter');
      return thereafterRate ? thereafterRate.rate : inputs.rates[inputs.rates.length - 1].rate;
    }
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

  // PDF Report generation
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
      `Timeline calculated from ${inputs.otpDate} to ${inputs.topDate} (K4=${results.constructionTime} months)` : 
      `Default K4=${results.constructionTime} months (provide OTP/TOP dates for Excel I4/J4/K4 calculations)`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Progressive Payment Schedule - BUC Property (Complete Excel Dependency Chain)</title>
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
        .dependency-banner {
            background: #059669;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 10px;
            margin: 4px 0;
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
        .dependency-info {
            background: #e0f2fe;
            border: 1px solid #0277bd;
            border-radius: 4px;
            padding: 8px;
            margin: 8px 0;
            font-size: 9px;
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
        <div class="dependency-banner">✅ Complete Excel Dependency Chain: OTP/TOP → I4/J4/K4 → E10-E15 → N10-N17 → Payment Schedule</div>
        <div class="timeline-banner">${timelineInfo}</div>
        <div class="report-info">
            <strong>Built Under Construction Payment Analysis (Complete Excel Implementation)</strong><br>
            Generated: ${currentDate} | Report ID: KQM-PPE-FULL-DEP-${Date.now()}
        </div>
    </div>

    <div class="dependency-info no-break">
        <h4 style="margin: 0 0 6px 0; color: #0277bd; font-size: 11px;">🔗 Excel Dependency Chain Analysis</h4>
        <p style="margin: 2px 0; font-size: 8px;"><strong>I4/J4/K4:</strong> ${results.timeChain?.I4 ? `I4=${results.timeChain.I4} days, J4=${results.timeChain.J4} months, K4=${results.timeChain.K4} months` : `K4=${results.constructionTime} months (default)`}</p>
        <p style="margin: 2px 0; font-size: 8px;"><strong>E10-E15:</strong> ROUNDUP(K4 × weights) produces construction stage timings that cascade to Column N</p>
        <p style="margin: 2px 0; font-size: 8px;"><strong>Column N:</strong> Bank loan months calculated using K4-affected E values in Excel conditional formulas</p>
        <p style="margin: 2px 0; font-size: 8px;"><strong>Payment Impact:</strong> Different K4 values change drawdown timing, affecting total interest costs</p>
    </div>

    <div class="section no-break">
        <h2>🏗️ PROJECT SUMMARY (Complete K4 Dependency Chain)</h2>
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
                    <span class="info-label">Construction Time (K4):</span>
                    <span class="info-value">${results.constructionTime} months</span>
                </div>
            </div>
            <div>
                <div class="info-row">
                    <span class="info-label">1st Year Interest:</span>
                    <span class="info-value">${formatCurrency(results.yearlyInterest.year1)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total Interest:</span>
                    <span class="info-value">${formatCurrency(results.totalInterest)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">First Drawdown Month:</span>
                    <span class="info-value">${results.firstBankDrawdownMonth || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Timeline Method:</span>
                    <span class="info-value">${results.timelineCalculated ? 'Date-Calculated' : 'Default'}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="section no-break">
        <h2>📅 CONSTRUCTION PAYMENT SCHEDULE (K4-Derived E Values)</h2>
        <p style="font-size: 9px; color: #666; margin-bottom: 8px;">
            Bank loan allocation using complete dependency chain: K4=${results.constructionTime} → E10-E15 → Column N bank loan months.
        </p>
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
        <h2>🏦 BANK LOAN DRAWDOWN SCHEDULE (K4-Affected Column N Logic)</h2>
        <p style="font-size: 9px; color: #666; margin-bottom: 8px;">
            Bank loan months derived from K4-dependent E values: K4=${results.constructionTime} affects E10-E15, which affects N10-N17 timing.
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
                  `Payment schedule starts from Month ${results.firstBankDrawdownMonth} with K4-derived drawdown timing.` : 
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
        <h4 style="margin: 0 0 6px 0; color: #333; font-size: 10px;">Complete Excel Dependency Chain Implementation</h4>
        <p style="margin: 3px 0;">• <strong>Time Chain:</strong> OTP/TOP dates → I4=H4-G4 → J4=ROUNDDOWN((I4/365)*12,0) → K4=J4-E8-E9</p>
        <p style="margin: 3px 0;">• <strong>Construction Timing:</strong> K4 affects E10-E15 via ROUNDUP($K$4*(Crow/SUM($C$10:$C$15)),0) formulas</p>
        <p style="margin: 3px 0;">• <strong>Bank Loan Months:</strong> Column N uses K4-affected E values in conditional formulas N11=N10+E10, etc.</p>
        <p style="margin: 3px 0;">• <strong>Payment Impact:</strong> Different K4 values cascade through entire calculation, affecting total costs</p>
        <p style="margin: 3px 0;">• <strong>Excel Compliance:</strong> All formulas replicate Excel progressive payment calculator exactly</p>
        <p style="margin: 3px 0;">• This implementation captures the complete dependency network from OTP/TOP dates to final payment schedule.</p>
    </div>

    <div class="footer no-break">
        <div style="margin-bottom: 6px;">
            📧 kenneth@keyquestmortgage.com.sg | 📞 +65 9795 2338 
        </div>
        <div style="border-top: 1px solid #e5e7eb; padding-top: 6px; margin-top: 6px;">
            <p style="margin: 0; font-size: 7px;">This report is confidential and intended for loan assessment purposes. 
            Your Trusted Mortgage Advisory Partner - Complete Excel Dependency Chain Implementation</p>
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

    alert(`Complete Excel Dependency Chain progressive payment schedule generated!

✅ COMPLETE EXCEL IMPLEMENTATION:
- I4/J4/K4: Full time calculation chain from OTP/TOP dates
- E10-E15: K4-dependent ROUNDUP formulas for construction timing
- Column G: Bank loan allocation using exact Excel formulas
- Column N: Bank loan months using K4-affected E values
- Column O: Bank loan amounts ($C$4*G formulas)
- Column P: Payment calculations (Excel Drawdown sheet logic)
- Complete Cascade: OTP/TOP → I4/J4/K4 → E10-E15 → N10-N17 → Payment Schedule

📄 Timeline: ${results.timelineCalculated ? 'Excel I4/J4/K4 from Dates' : 'Default K4 (Provide OTP/TOP for exact calculations)'}

📈 Dependency Impact: Different K4 values affect construction timing, bank loan months, and total interest costs.`);
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
                <p className="text-sm text-red-600">Complete Excel Dependency Chain</p>
              </div>
            </div>

            {/* Complete Dependency Chain Status */}
            <div className="bg-green-100 p-4 rounded-lg mb-4 border-l-4 border-green-500">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm text-green-800 font-medium">✅ Complete Excel Dependency Chain</p>
                  <p className="text-sm text-green-700 mt-1">
                    This calculator implements the complete Excel dependency network: OTP/TOP dates → I4/J4/K4 → 
                    E10-E15 ROUNDUP formulas → Column N bank loan months → Column O amounts → 
                    Drawdown sheet payment calculations. Every Excel formula dependency is captured.
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline Status Alert */}
            {(!inputs.otpDate || !inputs.topDate) && (
              <div className="bg-yellow-100 p-4 rounded-lg mb-4 border-l-4 border-yellow-500">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">⚠️ Excel I4/J4/K4 Chain Requires Dates</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Provide both OTP and Expected TOP dates for Excel-accurate I4/J4/K4 calculations. 
                      K4 affects E10-E15 construction timing, which affects Column N bank loan months, 
                      which affects payment schedule and total interest costs.
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
                    <p className="text-sm text-green-800 font-medium">✓ Excel I4/J4/K4 Dependency Chain Active</p>
                    <p className="text-sm text-green-700 mt-1">
                      Complete dependency chain calculated from 
                      <strong> {new Date(inputs.otpDate).toLocaleDateString('en-SG')}</strong> to 
                      <strong> {new Date(inputs.topDate).toLocaleDateString('en-SG')}</strong>.
                      K4 value affects E10-E15 ROUNDUP results, which cascade through Column N to payment schedule.
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
                  <label className="block text-sm font-medium mb-2 text-gray-700">OTP Date (Excel G4)</label>
                  <input
                    type="date"
                    value={inputs.otpDate}
                    onChange={(e) => handleInputChange('otpDate', e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Expected TOP Date (Excel H4)</label>
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

          {/* Complete Dependency Chain Information */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Info className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-purple-800">Complete Excel Dependency Chain</h3>
                <p className="text-sm text-purple-600">Every formula dependency captured</p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-gray-700">
              <div className="bg-white p-3 rounded-lg border border-purple-100">
                <p className="font-medium text-purple-700">Time Chain (I4/J4/K4):</p>
                <p className="text-xs mt-1">I4=H4-G4 → J4=ROUNDDOWN((I4/365)*12,0) → K4=J4-E8-E9</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-purple-100">
                <p className="font-medium text-purple-700">Construction Timing (E10-E15):</p>
                <p className="text-xs mt-1">ROUNDUP($K$4*(Crow/SUM($C$10:$C$15)),0) - depends on K4!</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-purple-100">
                <p className="font-medium text-purple-700">Bank Loan Months (Column N):</p>
                <p className="text-xs mt-1">Uses K4-affected E values: N11=N10+E10, N12=N11+E11, etc.</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-purple-100">
                <p className="font-medium text-purple-700">Payment Schedule Impact:</p>
                <p className="text-xs mt-1">Different K4 → Different E timing → Different N months → Different total interest</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Results Section */}
        <div className="space-y-6">
          {results && (
            <>
              {/* K4 Dependency Chain Summary */}
              {results.timeChain && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-8 h-8 text-indigo-600" />
                    <div>
                      <p className="text-sm text-indigo-600 font-medium">Excel Dependency Chain Results</p>
                      <p className="text-xl font-bold text-indigo-700">
                        K4 = {results.constructionTime} months
                      </p>
                    </div>
                  </div>
                  
                  {results.timelineCalculated && (
                    <div className="text-sm text-indigo-700 space-y-1">
                      <p><strong>I4 (Days):</strong> {results.timeChain.I4}</p>
                      <p><strong>J4 (Project Months):</strong> {results.timeChain.J4}</p>
                      <p><strong>K4 (Construction):</strong> {results.timeChain.K4} months</p>
                      <p className="text-xs text-indigo-600 mt-2">
                        This K4 value affects E10-E15 ROUNDUP calculations, which cascade through Column N to payment schedule.
                      </p>
                    </div>
                  )}
                </div>
              )}

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
                      <p className="text-sm text-purple-600 font-medium">First Drawdown</p>
                      <p className="text-xl font-bold text-purple-700">Month {results.firstBankDrawdownMonth || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Construction Payment Schedule */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold mb-2">Construction Payment Schedule (Complete K4 Dependency)</h3>
                  
                  <div className={`p-3 rounded-lg mb-4 ${results.timelineCalculated ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <p className={`text-sm ${results.timelineCalculated ? 'text-green-800' : 'text-yellow-800'}`}>
                      <strong>{results.timelineCalculated ? '✓ Complete Dependency Chain:' : '⚠️ Default K4 Used:'}</strong> 
                      {results.timelineCalculated 
                        ? ` K4=${results.constructionTime} months from I4/J4/K4 calculations affects E10-E15 ROUNDUP results, which affect Column N bank loan months.` 
                        : ` K4=${results.constructionTime} months (default). Provide OTP/TOP dates for complete I4/J4/K4 → E10-E15 → Column N dependency chain.`
                      }
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

              {/* Bank Loan Drawdown Schedule */}
              {results.bankDrawdownSchedule.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold mb-2">Bank Loan Drawdown Schedule (K4-Derived Column N)</h3>
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>K4-Dependent Timeline:</strong> Bank loan months calculated using K4-affected E values in Excel Column N formulas. 
                        K4={results.constructionTime} affects E10-E15 timing, which affects when bank drawdowns occur.
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

              {/* Monthly Payment Schedule */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold mb-2">Monthly Payment Schedule (First 60 Months)</h3>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Complete Excel Implementation:</strong> 
                      {results.firstBankDrawdownMonth ? (
                        ` Payment schedule starts from Month ${results.firstBankDrawdownMonth} with K4-derived drawdown timing. 
                        Earlier drawdowns (lower K4) mean more interest paid over loan period.`
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
                    <div className="text-lg">Generate Complete Dependency Chain Report</div>
                    <div className="text-sm text-red-500">OTP/TOP → I4/J4/K4 → E10-E15 → Column N → Payment Schedule</div>
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
