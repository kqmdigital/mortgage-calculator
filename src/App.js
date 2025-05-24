import React, { useState, useCallback } from 'react';
import { Calculator, Download, FileText, CheckCircle, XCircle, Info, Lock, LogOut } from 'lucide-react';
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
          <p className="text-gray-600 mt-2">Mortgage Calculator Portal</p>
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

const MortgageCalculator = ({ currentUser, onLogout }) => {
  const [inputs, setInputs] = useState({
    purchasePrice: 2000000,
    loanPercentage: 75,
    customLoanAmount: 1500000,
    useCustomAmount: false,
    stressTestRate: 4.0,
    interestRateY1: 2.3,
    interestRateY2: 1.3,
    interestRateY3: 1.3,
    interestRateY4: 1.3,
    interestRateY5: 1.28,
    interestRateThereafter: 1.28,
    interestPeriodSelection: 5,
    loanTenor: 29,
    monthlySalaryA: 4500,
    annualSalaryA: 60000,
    applicantAgeA: 34,
    monthlySalaryB: 5500,
    annualSalaryB: 70000,
    applicantAgeB: 0,
    showFundAmount: 0,
    pledgeAmount: 60000,
    carLoanA: 2000,
    carLoanB: 1000,
    personalLoanA: 0,
    personalLoanB: 0
  });

  const [results, setResults] = useState(null);

  const calculatePMT = (rate, periods, principal) => {
    if (rate === 0) return principal / periods;
    const monthlyRate = rate / 100 / 12;
    const denominator = Math.pow(1 + monthlyRate, periods) - 1;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, periods)) / denominator;
  };

  const calculateYearlyInterest = (loanAmount, rates, loanTenor) => {
    let balance = loanAmount;
    const yearlyInterest = [];
    const monthlyInstallments = [];
    
    rates.forEach(rate => {
      const installment = calculatePMT(rate, loanTenor * 12, loanAmount);
      monthlyInstallments.push(installment);
    });
    
    for (let year = 0; year < 5; year++) {
      let yearInterest = 0;
      const rate = rates[year];
      const monthlyRate = rate / 100 / 12;
      const installment = monthlyInstallments[year];
      
      for (let month = 0; month < 12; month++) {
        if (balance <= 0) break;
        
        const interestPayment = balance * monthlyRate;
        const principalPayment = installment - interestPayment;
        
        yearInterest += interestPayment;
        balance -= principalPayment;
        
        if (balance < 0) balance = 0;
      }
      
      yearlyInterest.push(yearInterest);
    }
    
    return { yearlyInterest, monthlyInstallments };
  };

  const calculateMortgage = useCallback(() => {
    const {
      purchasePrice, loanPercentage, customLoanAmount, useCustomAmount,
      stressTestRate, interestRateY1, interestRateY2, interestRateY3, 
      interestRateY4, interestRateY5, interestRateThereafter, loanTenor,
      interestPeriodSelection,
      monthlySalaryA, annualSalaryA, applicantAgeA,
      monthlySalaryB, annualSalaryB, applicantAgeB,
      showFundAmount, pledgeAmount,
      carLoanA, carLoanB, personalLoanA, personalLoanB
    } = inputs;

    let loanAmount;
    if (useCustomAmount) {
      loanAmount = customLoanAmount;
    } else {
      loanAmount = purchasePrice * (loanPercentage / 100);
    }
    
    const loanAmount75 = purchasePrice * 0.75;
    const loanAmount55 = purchasePrice * 0.55;
    
    const yearlyRates = [
      interestRateY1, 
      interestRateY2, 
      interestRateY3, 
      interestRateY4, 
      interestRateY5, 
      interestRateThereafter
    ];
    
    const { yearlyInterest, monthlyInstallments } = calculateYearlyInterest(loanAmount, yearlyRates, loanTenor);
    
    const selectedPeriodTotal = (yearlyInterest || []).slice(0, interestPeriodSelection).reduce((sum, interest) => sum + interest, 0);
    
    const monthlyInstallmentStressTest = calculatePMT(stressTestRate, loanTenor * 12, loanAmount);
    const monthlyInstallmentY1 = calculatePMT(interestRateY1, loanTenor * 12, loanAmount);
    const monthlyInstallmentY2 = calculatePMT(interestRateY2, loanTenor * 12, loanAmount);
    const monthlyInstallmentY3 = calculatePMT(interestRateY3, loanTenor * 12, loanAmount);
    const monthlyInstallmentY4 = calculatePMT(interestRateY4, loanTenor * 12, loanAmount);
    const monthlyInstallmentY5 = calculatePMT(interestRateY5, loanTenor * 12, loanAmount);
    const monthlyInstallmentThereafter = calculatePMT(interestRateThereafter, loanTenor * 12, loanAmount);
    
    const monthlyInstallment = monthlyInstallmentStressTest;
    
    const baseSalaryA = monthlySalaryA * 12;
    const baseSalaryB = monthlySalaryB * 12;
    const bonusIncomeA = Math.max(0, (annualSalaryA - baseSalaryA) / 12) * 0.7;
    const bonusIncomeB = Math.max(0, (annualSalaryB - baseSalaryB) / 12) * 0.7;
    
    const showFundIncomeA = showFundAmount * 0.00625;
    const showFundIncomeB = 0;
    const pledgeIncomeA = 0;
    const pledgeIncomeB = pledgeAmount / 48;
    
    const totalMonthlyIncomeA = monthlySalaryA + bonusIncomeA + showFundIncomeA + pledgeIncomeA;
    const totalMonthlyIncomeB = monthlySalaryB + bonusIncomeB + showFundIncomeB + pledgeIncomeB;
    const combinedMonthlyIncome = totalMonthlyIncomeA + totalMonthlyIncomeB;
    
    const totalCommitments = carLoanA + carLoanB + personalLoanA + personalLoanB;
    
    const tdsr55Available = (combinedMonthlyIncome * 0.55) - totalCommitments;
    const msr30Available = combinedMonthlyIncome * 0.3;
    
    const requiredIncomeTDSR = (monthlyInstallment + totalCommitments) / 0.55;
    const requiredIncomeHDB = (monthlyInstallment + totalCommitments) / 0.3;
    
    const tdsrDeficit = combinedMonthlyIncome - requiredIncomeTDSR;
    const hdbDeficit = combinedMonthlyIncome - requiredIncomeHDB;
    
    const tdsrPass = tdsrDeficit >= 0;
    const hdbPass = hdbDeficit >= 0;
    
    const cashShowTDSR = tdsrPass ? 0 : Math.abs(tdsrDeficit) / 0.00625;
    const cashShowHDB = hdbPass ? 0 : Math.abs(hdbDeficit) / 0.00625;
    const cashPledgeTDSR = tdsrPass ? 0 : Math.abs(tdsrDeficit) * 48;
    const cashPledgeHDB = hdbPass ? 0 : Math.abs(hdbDeficit) * 48;

    return {
      loanAmount,
      loanAmount75,
      loanAmount55,
      monthlyInstallment,
      monthlyInstallmentStressTest,
      monthlyInstallmentY1,
      monthlyInstallmentY2,
      monthlyInstallmentY3,
      monthlyInstallmentY4,
      monthlyInstallmentY5,
      monthlyInstallmentThereafter,
      yearlyInterest,
      selectedPeriodTotal,
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
      totalCommitments
    };
  }, [inputs]);

  React.useEffect(() => {
    setResults(calculateMortgage());
  }, [calculateMortgage]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generatePDFReport = () => {
    if (!results) {
      alert('Please calculate the mortgage first before generating a report.');
      return;
    }

    try {
      const loanAmountSource = inputs.useCustomAmount ? 'Custom Amount' : `${inputs.loanPercentage}% of Purchase Price`;
      const currentDate = new Date().toLocaleDateString('en-SG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const reportContent = `
================================================================================
                        MORTGAGE AFFORDABILITY REPORT
================================================================================
Generated on: ${currentDate}
Generated by: ${currentUser}
Report ID: MR-${Date.now()}

================================================================================
PROPERTY & LOAN DETAILS
================================================================================
Purchase Price:                 ${formatCurrency(inputs.purchasePrice)}
Loan Amount:                    ${formatCurrency(results.loanAmount)} (${loanAmountSource})
Loan-to-Value Ratio:            ${((results.loanAmount / inputs.purchasePrice) * 100).toFixed(1)}%
Loan Tenor:                     ${inputs.loanTenor} years

================================================================================
AFFORDABILITY ANALYSIS
================================================================================

PRIVATE PROPERTY (TDSR 55%):
Required Monthly Income:        ${formatCurrency(results.requiredIncomeTDSR)}
Available Monthly Income:       ${formatCurrency(results.combinedMonthlyIncome)}
Surplus/Deficit:               ${formatCurrency(results.tdsrDeficit)}
Status:                        ${results.tdsrPass ? '✓ PASS - APPROVED' : '✗ FAIL - ADDITIONAL FUNDING REQUIRED'}

HDB PROPERTY (MSR 30%):
Required Monthly Income:        ${formatCurrency(results.requiredIncomeHDB)}
Available Monthly Income:       ${formatCurrency(results.combinedMonthlyIncome)}
Surplus/Deficit:               ${formatCurrency(results.hdbDeficit)}
Status:                        ${results.hdbPass ? '✓ PASS - APPROVED' : '✗ FAIL - ADDITIONAL FUNDING REQUIRED'}

================================================================================
Report Generated by: ${currentUser}
Timestamp: ${new Date().toISOString()}
================================================================================
`;

      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      
      downloadLink.href = url;
      downloadLink.download = `Mortgage_Report_${new Date().toISOString().split('T')[0]}_${currentUser}.txt`;
      downloadLink.style.display = 'none';
      
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
      
      alert('Report downloaded successfully!');
      
    } catch (error) {
      console.error('Error generating report:', error);
      alert('There was an error generating the report. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Calculator className="text-blue-600" />
            Mortgage Calculator
          </h1>
          <p className="text-gray-600 mt-2">Employee Portal - Calculate mortgage affordability</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">Loan Details</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Purchase Price (SGD)</label>
                <input
                  type="number"
                  value={inputs.purchasePrice}
                  onChange={(e) => handleInputChange('purchasePrice', Number(e.target.value))}
                  className="w-full p-3 border rounded-lg"
                />
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
                    75% ({formatCurrency(inputs.purchasePrice * 0.75)})
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
                    55% ({formatCurrency(inputs.purchasePrice * 0.55)})
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
                    <input
                      type="number"
                      value={inputs.customLoanAmount}
                      onChange={(e) => handleInputChange('customLoanAmount', Number(e.target.value))}
                      className="w-full p-3 border rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Stress Test Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.stressTestRate}
                  onChange={(e) => handleInputChange('stressTestRate', Number(e.target.value))}
                  className="w-full p-3 border rounded-lg bg-red-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Loan Tenor (Years)</label>
                <input
                  type="number"
                  value={inputs.loanTenor}
                  onChange={(e) => handleInputChange('loanTenor', Number(e.target.value))}
                  className="w-full p-3 border rounded-lg"
                />
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
                    <label className="block text-sm font-medium mb-1">Monthly Salary</label>
                    <input
                      type="number"
                      value={inputs.monthlySalaryA}
                      onChange={(e) => handleInputChange('monthlySalaryA', Number(e.target.value))}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Annual Salary</label>
                    <input
                      type="number"
                      value={inputs.annualSalaryA}
                      onChange={(e) => handleInputChange('annualSalaryA', Number(e.target.value))}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-3">Applicant B</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Monthly Salary</label>
                    <input
                      type="number"
                      value={inputs.monthlySalaryB}
                      onChange={(e) => handleInputChange('monthlySalaryB', Number(e.target.value))}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Annual Salary</label>
                    <input
                      type="number"
                      value={inputs.annualSalaryB}
                      onChange={(e) => handleInputChange('annualSalaryB', Number(e.target.value))}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-yellow-800">Additional Funding</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Show Fund Amount</label>
                <input
                  type="number"
                  value={inputs.showFundAmount}
                  onChange={(e) => handleInputChange('showFundAmount', Number(e.target.value))}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Pledge Amount</label>
                <input
                  type="number"
                  value={inputs.pledgeAmount}
                  onChange={(e) => handleInputChange('pledgeAmount', Number(e.target.value))}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Calculation Results</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Loan Amount:</span>
                    <div className="font-semibold text-blue-600">{formatCurrency(results.loanAmount)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Monthly Installment:</span>
                    <div className="font-semibold text-red-600">{formatCurrency(results.monthlyInstallmentStressTest)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Combined Income:</span>
                    <div className="font-semibold">{formatCurrency(results.combinedMonthlyIncome)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">LTV Ratio:</span>
                    <div className="font-semibold">{((results.loanAmount / inputs.purchasePrice) * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            </div>

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
                  <span className="text-sm text-gray-600">Status:</span>
                  <div className={`font-semibold ${results.tdsrPass ? 'text-green-600' : 'text-red-600'}`}>
                    {results.tdsrPass ? 'APPROVED' : 'NEEDS FUNDING'}
                  </div>
                </div>
              </div>
            </div>

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
                  <span className="text-sm text-gray-600">Status:</span>
                  <div className={`font-semibold ${results.hdbPass ? 'text-green-600' : 'text-red-600'}`}>
                    {results.hdbPass ? 'APPROVED' : 'NEEDS FUNDING'}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={generatePDFReport}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Generate Report
            </button>
          </div>
        )}
      </div>
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
