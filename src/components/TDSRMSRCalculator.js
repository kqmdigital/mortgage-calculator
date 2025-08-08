import React, { useState, useCallback } from 'react';
import { Calculator, Download, CheckCircle, XCircle, Info } from 'lucide-react';
import useDebounce from '../hooks/useDebounce';
import {
  formatCurrencyInput,
  parseNumberInput,
  getDefaultStressTestRate,
  getPropertyTypeText,
  calculateAverageAge,
  calculateMaxLoanTenor
} from '../utils/mortgageHelpers';
import { generatePDFTemplate } from '../utils/pdfTemplate';

const TDSRMSRCalculator = ({ currentUser, onLogout }) => {
  const [inputs, setInputs] = useState({
    propertyType: 'private',
    purchasePrice: '',
    loanPercentage: 75,
    customLoanAmount: '',
    useCustomAmount: false,
    stressTestRate: 4,
    loanTenor: '',
    monthlySalaryA: '',
    annualSalaryA: '',
    applicantAgeA: '',
    monthlySalaryB: '',
    annualSalaryB: '',
    applicantAgeB: '',
    showFundAmount: '',
    pledgeAmount: '',
    carLoanA: '',
    carLoanB: '',
    personalLoanA: '',
    personalLoanB: '',
    propertyLoanA: '',
    propertyLoanB: ''
  });

  const [results, setResults] = useState(null);
  const [loanTenorManuallyEdited, setLoanTenorManuallyEdited] = useState(false);
  const [annualSalaryAManuallyEdited, setAnnualSalaryAManuallyEdited] = useState(false);
  const [annualSalaryBManuallyEdited, setAnnualSalaryBManuallyEdited] = useState(false);

  // Calculate average age using helper function
  const avgAge = useCallback(() => {
    return calculateAverageAge(inputs.applicantAgeA, inputs.applicantAgeB);
  }, [inputs.applicantAgeA, inputs.applicantAgeB]);

  // Calculate max loan tenor using helper function
  const maxLoanTenor = useCallback(() => {
    const averageAge = avgAge();
    
    let loanPercentage;
    if (inputs.useCustomAmount) {
      const purchasePrice = parseNumberInput(inputs.purchasePrice) || 0;
      const customAmount = parseNumberInput(inputs.customLoanAmount) || 0;
      loanPercentage = purchasePrice > 0 ? (customAmount / purchasePrice) * 100 : 75;
    } else {
      loanPercentage = inputs.loanPercentage;
    }
    
    if (averageAge === 0) {
      if (inputs.propertyType === 'hdb') {
        return loanPercentage >= 56 && loanPercentage <= 75 ? 25 : 30;
      } else if (inputs.propertyType === 'commercial') {
        return 30;
      } else {
        return loanPercentage >= 56 && loanPercentage <= 75 ? 30 : 35;
      }
    }
    
    return calculateMaxLoanTenor(averageAge, loanPercentage, inputs.propertyType);
  }, [inputs, avgAge]);

  // Debounced inputs for automatic calculations
  const debouncedInputs = useDebounce(inputs, 500);

  // Auto-update loan tenor when age changes (if not manually edited)
  React.useEffect(() => {
    if (!loanTenorManuallyEdited) {
      const maxTenor = maxLoanTenor();
      if (maxTenor > 0) {
        setInputs(prev => ({ ...prev, loanTenor: maxTenor.toString() }));
      }
    }
  }, [debouncedInputs.applicantAgeA, debouncedInputs.applicantAgeB, debouncedInputs.propertyType, debouncedInputs.loanPercentage, debouncedInputs.purchasePrice, debouncedInputs.customLoanAmount, debouncedInputs.useCustomAmount, loanTenorManuallyEdited, maxLoanTenor]);

  // Auto-update annual salary when monthly salary changes (if not manually edited)
  React.useEffect(() => {
    if (!annualSalaryAManuallyEdited && inputs.monthlySalaryA) {
      const monthlyA = parseNumberInput(inputs.monthlySalaryA) || 0;
      setInputs(prev => ({ ...prev, annualSalaryA: (monthlyA * 12).toString() }));
    }
  }, [debouncedInputs.monthlySalaryA, annualSalaryAManuallyEdited]);

  React.useEffect(() => {
    if (!annualSalaryBManuallyEdited && inputs.monthlySalaryB) {
      const monthlyB = parseNumberInput(inputs.monthlySalaryB) || 0;
      setInputs(prev => ({ ...prev, annualSalaryB: (monthlyB * 12).toString() }));
    }
  }, [debouncedInputs.monthlySalaryB, annualSalaryBManuallyEdited]);

  // Update stress test rate when property type changes
  React.useEffect(() => {
    const defaultRate = getDefaultStressTestRate(inputs.propertyType);
    setInputs(prev => ({ ...prev, stressTestRate: defaultRate }));
  }, [inputs.propertyType]);

  const handleInputChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    
    // Track manual edits
    if (field === 'loanTenor') {
      setLoanTenorManuallyEdited(true);
    } else if (field === 'annualSalaryA') {
      setAnnualSalaryAManuallyEdited(true);
    } else if (field === 'annualSalaryB') {
      setAnnualSalaryBManuallyEdited(true);
    }
  };

  // Reset manual edit flags when monthly salaries are cleared
  React.useEffect(() => {
    if (!inputs.monthlySalaryA) {
      setAnnualSalaryAManuallyEdited(false);
    }
    if (!inputs.monthlySalaryB) {
      setAnnualSalaryBManuallyEdited(false);
    }
  }, [inputs.monthlySalaryA, inputs.monthlySalaryB]);

  const calculateTDSRMSR = () => {
    try {
      // Parse all inputs
      const purchasePrice = parseNumberInput(inputs.purchasePrice) || 0;
      const customAmount = parseNumberInput(inputs.customLoanAmount) || 0;
      const loanAmount = inputs.useCustomAmount ? customAmount : (purchasePrice * (inputs.loanPercentage / 100));
      const loanTenor = parseNumberInput(inputs.loanTenor) || 0;
      const stressTestRate = parseNumberInput(inputs.stressTestRate) || 0;
      
      // Salary calculations
      const monthlySalaryA = parseNumberInput(inputs.monthlySalaryA) || 0;
      const monthlySalaryB = parseNumberInput(inputs.monthlySalaryB) || 0;
      const totalMonthlyIncome = monthlySalaryA + monthlySalaryB;
      
      // Ages
      const applicantAgeA = parseNumberInput(inputs.applicantAgeA) || 0;
      const applicantAgeB = parseNumberInput(inputs.applicantAgeB) || 0;
      const averageAge = avgAge();
      
      // Debt obligations
      const carLoanA = parseNumberInput(inputs.carLoanA) || 0;
      const carLoanB = parseNumberInput(inputs.carLoanB) || 0;
      const personalLoanA = parseNumberInput(inputs.personalLoanA) || 0;
      const personalLoanB = parseNumberInput(inputs.personalLoanB) || 0;
      const propertyLoanA = parseNumberInput(inputs.propertyLoanA) || 0;
      const propertyLoanB = parseNumberInput(inputs.propertyLoanB) || 0;
      
      const totalDebtObligations = carLoanA + carLoanB + personalLoanA + personalLoanB + propertyLoanA + propertyLoanB;
      
      // Show fund and pledge amounts
      const showFundAmount = parseNumberInput(inputs.showFundAmount) || 0;
      const pledgeAmount = parseNumberInput(inputs.pledgeAmount) || 0;

      if (loanAmount <= 0 || loanTenor <= 0 || totalMonthlyIncome <= 0) {
        alert('Please ensure all required fields are filled with valid values.');
        return;
      }

      // Calculate monthly installment using stress test rate
      const monthlyRate = (stressTestRate / 100) / 12;
      const numberOfPayments = loanTenor * 12;
      const monthlyInstallment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

      // Calculate TDSR
      const totalMonthlyDebt = monthlyInstallment + totalDebtObligations;
      const tdsr = (totalMonthlyDebt / totalMonthlyIncome) * 100;

      // TDSR limits based on property type
      let tdsrLimit;
      switch (inputs.propertyType) {
        case 'private':
        case 'ec':
          tdsrLimit = 55;
          break;
        case 'hdb':
        case 'commercial':
          tdsrLimit = 60;
          break;
        default:
          tdsrLimit = 55;
      }

      const tdsrStatus = tdsr <= tdsrLimit ? 'Pass' : 'Fail';

      // Calculate MSR (only for HDB and EC properties)
      let msr = null;
      let msrStatus = null;
      let msrApplicable = false;
      
      if (inputs.propertyType === 'hdb' || inputs.propertyType === 'ec') {
        msr = (monthlyInstallment / totalMonthlyIncome) * 100;
        msrStatus = msr <= 30 ? 'Pass' : 'Fail';
        msrApplicable = true;
      }

      // Overall status
      let overallStatus = 'APPROVED';
      if (tdsrStatus === 'Fail' || (msrApplicable && msrStatus === 'Fail')) {
        overallStatus = 'REJECTED';
      }

      // Calculate loan percentage for display
      const actualLoanPercentage = inputs.useCustomAmount ? 
        (purchasePrice > 0 ? (customAmount / purchasePrice) * 100 : 0) : 
        inputs.loanPercentage;

      const calculationResults = {
        purchasePrice,
        loanAmount,
        loanPercentage: actualLoanPercentage,
        loanTenor,
        stressTestRate,
        monthlyInstallment,
        totalMonthlyIncome,
        totalDebtObligations,
        tdsr,
        tdsrLimit,
        tdsrStatus,
        msr,
        msrStatus,
        msrApplicable,
        overallStatus,
        averageAge,
        applicantAgeA,
        applicantAgeB,
        monthlySalaryA,
        monthlySalaryB,
        carLoanA,
        carLoanB,
        personalLoanA,
        personalLoanB,
        propertyLoanA,
        propertyLoanB,
        showFundAmount,
        pledgeAmount
      };

      setResults(calculationResults);

    } catch (error) {
      console.error('Calculation error:', error);
      alert('An error occurred during calculation. Please check your inputs.');
    }
  };

  const generatePDFReport = () => {
    if (!results) {
      alert('Please calculate the mortgage first before generating a report.');
      return;
    }

    try {
      const propertyTypeText = getPropertyTypeText(inputs.propertyType);
      const htmlContent = generatePDFTemplate(inputs, results, propertyTypeText);
      
      // Create a new window/tab for the PDF
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Trigger print dialog
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('An error occurred while generating the PDF report.');
    }
  };

  const clearForm = () => {
    setInputs({
      propertyType: 'private',
      purchasePrice: '',
      loanPercentage: 75,
      customLoanAmount: '',
      useCustomAmount: false,
      stressTestRate: 4,
      loanTenor: '',
      monthlySalaryA: '',
      annualSalaryA: '',
      applicantAgeA: '',
      monthlySalaryB: '',
      annualSalaryB: '',
      applicantAgeB: '',
      showFundAmount: '',
      pledgeAmount: '',
      carLoanA: '',
      carLoanB: '',
      personalLoanA: '',
      personalLoanB: '',
      propertyLoanA: '',
      propertyLoanB: ''
    });
    setResults(null);
    setLoanTenorManuallyEdited(false);
    setAnnualSalaryAManuallyEdited(false);
    setAnnualSalaryBManuallyEdited(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calculator className="text-blue-600 w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">TDSR/MSR Calculator</h1>
                <p className="text-gray-600">Calculate Total Debt Service Ratio and Mortgage Servicing Ratio</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Welcome, <span className="font-semibold">{currentUser?.firstName || 'User'}</span></p>
              <button 
                onClick={onLogout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Loan Details</h2>
            
            {/* Property Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
              <select
                value={inputs.propertyType}
                onChange={(e) => handleInputChange('propertyType', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="private">Private Property</option>
                <option value="hdb">HDB Property</option>
                <option value="ec">EC Property</option>
                <option value="commercial">Commercial/Industrial Property</option>
              </select>
            </div>

            {/* Purchase Price */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Price ($)</label>
              <input
                type="text"
                value={formatCurrencyInput(inputs.purchasePrice)}
                onChange={(e) => handleInputChange('purchasePrice', e.target.value.replace(/,/g, ''))}
                placeholder="Enter purchase price"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Loan Amount Selection */}
            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!inputs.useCustomAmount}
                    onChange={() => handleInputChange('useCustomAmount', false)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Use Loan Percentage</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={inputs.useCustomAmount}
                    onChange={() => handleInputChange('useCustomAmount', true)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Custom Loan Amount</span>
                </label>
              </div>

              {!inputs.useCustomAmount ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loan Percentage (%)</label>
                  <input
                    type="range"
                    min="5"
                    max="95"
                    step="5"
                    value={inputs.loanPercentage}
                    onChange={(e) => handleInputChange('loanPercentage', parseInt(e.target.value))}
                    className="w-full mb-2"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>5%</span>
                    <span className="font-semibold">{inputs.loanPercentage}%</span>
                    <span>95%</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Custom Loan Amount ($)</label>
                  <input
                    type="text"
                    value={formatCurrencyInput(inputs.customLoanAmount)}
                    onChange={(e) => handleInputChange('customLoanAmount', e.target.value.replace(/,/g, ''))}
                    placeholder="Enter custom loan amount"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Stress Test Rate */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Stress Test Rate (%)</label>
              <input
                type="number"
                value={inputs.stressTestRate}
                onChange={(e) => handleInputChange('stressTestRate', parseFloat(e.target.value) || 0)}
                step="0.1"
                min="0"
                max="15"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Loan Tenor */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Tenor (Years)
                {maxLoanTenor() > 0 && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Max: {maxLoanTenor()} years)
                  </span>
                )}
              </label>
              <input
                type="number"
                value={inputs.loanTenor}
                onChange={(e) => handleInputChange('loanTenor', e.target.value)}
                min="1"
                max={maxLoanTenor() > 0 ? maxLoanTenor() : 35}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Applicant Information */}
            <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-8">Applicant Information</h3>

            {/* Applicant A */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age (A)</label>
                <input
                  type="number"
                  value={inputs.applicantAgeA}
                  onChange={(e) => handleInputChange('applicantAgeA', e.target.value)}
                  min="18"
                  max="100"
                  placeholder="Age"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Salary (A) ($)</label>
                <input
                  type="text"
                  value={formatCurrencyInput(inputs.monthlySalaryA)}
                  onChange={(e) => handleInputChange('monthlySalaryA', e.target.value.replace(/,/g, ''))}
                  placeholder="Monthly salary"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Annual Salary (A) ($)</label>
                <input
                  type="text"
                  value={formatCurrencyInput(inputs.annualSalaryA)}
                  onChange={(e) => handleInputChange('annualSalaryA', e.target.value.replace(/,/g, ''))}
                  placeholder="Annual salary"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Applicant B */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age (B)</label>
                <input
                  type="number"
                  value={inputs.applicantAgeB}
                  onChange={(e) => handleInputChange('applicantAgeB', e.target.value)}
                  min="18"
                  max="100"
                  placeholder="Age (optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Salary (B) ($)</label>
                <input
                  type="text"
                  value={formatCurrencyInput(inputs.monthlySalaryB)}
                  onChange={(e) => handleInputChange('monthlySalaryB', e.target.value.replace(/,/g, ''))}
                  placeholder="Monthly salary (optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Annual Salary (B) ($)</label>
                <input
                  type="text"
                  value={formatCurrencyInput(inputs.annualSalaryB)}
                  onChange={(e) => handleInputChange('annualSalaryB', e.target.value.replace(/,/g, ''))}
                  placeholder="Annual salary (optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Additional Financial Information */}
            <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-8">Additional Financial Information</h3>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Show Fund Amount ($)</label>
                <input
                  type="text"
                  value={formatCurrencyInput(inputs.showFundAmount)}
                  onChange={(e) => handleInputChange('showFundAmount', e.target.value.replace(/,/g, ''))}
                  placeholder="Show fund (optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pledge Amount ($)</label>
                <input
                  type="text"
                  value={formatCurrencyInput(inputs.pledgeAmount)}
                  onChange={(e) => handleInputChange('pledgeAmount', e.target.value.replace(/,/g, ''))}
                  placeholder="Pledge amount (optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Existing Debt Obligations */}
            <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-8">Existing Debt Obligations (Monthly)</h3>

            {/* Car Loans */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Car Loan (A) ($)</label>
                <input
                  type="text"
                  value={formatCurrencyInput(inputs.carLoanA)}
                  onChange={(e) => handleInputChange('carLoanA', e.target.value.replace(/,/g, ''))}
                  placeholder="Monthly car loan payment"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Car Loan (B) ($)</label>
                <input
                  type="text"
                  value={formatCurrencyInput(inputs.carLoanB)}
                  onChange={(e) => handleInputChange('carLoanB', e.target.value.replace(/,/g, ''))}
                  placeholder="Monthly car loan payment"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Personal Loans */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Personal Loan (A) ($)</label>
                <input
                  type="text"
                  value={formatCurrencyInput(inputs.personalLoanA)}
                  onChange={(e) => handleInputChange('personalLoanA', e.target.value.replace(/,/g, ''))}
                  placeholder="Monthly personal loan payment"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Personal Loan (B) ($)</label>
                <input
                  type="text"
                  value={formatCurrencyInput(inputs.personalLoanB)}
                  onChange={(e) => handleInputChange('personalLoanB', e.target.value.replace(/,/g, ''))}
                  placeholder="Monthly personal loan payment"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Property Loans */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Loan (A) ($)</label>
                <input
                  type="text"
                  value={formatCurrencyInput(inputs.propertyLoanA)}
                  onChange={(e) => handleInputChange('propertyLoanA', e.target.value.replace(/,/g, ''))}
                  placeholder="Monthly property loan payment"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Loan (B) ($)</label>
                <input
                  type="text"
                  value={formatCurrencyInput(inputs.propertyLoanB)}
                  onChange={(e) => handleInputChange('propertyLoanB', e.target.value.replace(/,/g, ''))}
                  placeholder="Monthly property loan payment"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 mt-8">
              <button
                onClick={calculateTDSRMSR}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold"
              >
                <Calculator className="w-5 h-5 inline mr-2" />
                Calculate TDSR/MSR
              </button>
              <button
                onClick={clearForm}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Calculation Results</h2>
              {results && (
                <button
                  onClick={generatePDFReport}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200"
                >
                  <Download className="w-4 h-4" />
                  <span>Export PDF</span>
                </button>
              )}
            </div>

            {results ? (
              <div className="space-y-6">
                {/* Property Information Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Property Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Property Type:</span>
                      <p className="font-medium">{getPropertyTypeText(inputs.propertyType)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Purchase Price:</span>
                      <p className="font-medium">${results.purchasePrice?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Loan Amount:</span>
                      <p className="font-medium">${results.loanAmount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Loan Percentage:</span>
                      <p className="font-medium">{results.loanPercentage?.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                {/* TDSR Results */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Total Debt Service Ratio (TDSR)</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700">TDSR:</span>
                    <span className={`font-bold text-lg ${results.tdsrStatus === 'Pass' ? 'text-green-600' : 'text-red-600'}`}>
                      {results.tdsr?.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700">TDSR Limit:</span>
                    <span className="font-medium">{results.tdsrLimit}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Status:</span>
                    <div className={`flex items-center space-x-1 ${results.tdsrStatus === 'Pass' ? 'text-green-600' : 'text-red-600'}`}>
                      {results.tdsrStatus === 'Pass' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      <span className="font-semibold">{results.tdsrStatus}</span>
                    </div>
                  </div>
                </div>

                {/* MSR Results */}
                {results.msrApplicable && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Mortgage Servicing Ratio (MSR)</h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700">MSR:</span>
                      <span className={`font-bold text-lg ${results.msrStatus === 'Pass' ? 'text-green-600' : 'text-red-600'}`}>
                        {results.msr?.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700">MSR Limit:</span>
                      <span className="font-medium">30%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Status:</span>
                      <div className={`flex items-center space-x-1 ${results.msrStatus === 'Pass' ? 'text-green-600' : 'text-red-600'}`}>
                        {results.msrStatus === 'Pass' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        <span className="font-semibold">{results.msrStatus}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Overall Status */}
                <div className={`border-2 rounded-lg p-4 ${results.overallStatus === 'APPROVED' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Overall Assessment</h3>
                    <div className={`flex items-center space-x-2 ${results.overallStatus === 'APPROVED' ? 'text-green-600' : 'text-red-600'}`}>
                      {results.overallStatus === 'APPROVED' ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                      <span className="font-bold text-lg">{results.overallStatus}</span>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Financial Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Monthly Installment (Stress Test):</span>
                      <span className="font-medium">${results.monthlyInstallment?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Total Monthly Income:</span>
                      <span className="font-medium">${results.totalMonthlyIncome?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Total Debt Obligations:</span>
                      <span className="font-medium">${results.totalDebtObligations?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Loan Tenor:</span>
                      <span className="font-medium">{results.loanTenor} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Stress Test Rate:</span>
                      <span className="font-medium">{results.stressTestRate?.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Important Notes */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-1">Important Notes:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>This calculation is for reference only and should not be considered as financial advice.</li>
                        <li>Actual loan approval depends on additional factors not included in this calculation.</li>
                        <li>Banks may have different stress test rates and assessment criteria.</li>
                        <li>Please consult with financial advisors and banks for accurate assessment.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Enter your loan details and click "Calculate TDSR/MSR" to see the results.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TDSRMSRCalculator;