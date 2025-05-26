// Reset all values to empty when component mounts (fresh login)
  const [inputs, setInputs] = useState({
    // Property Type Selection
    propertyType: 'private', // 'private' or 'hdb'
    
    purchasePrice: '',
    loanPercentage: 75, // 55, 75, or custom
    customLoanAmount: '',
    useCustomAmount: false,
    
    // Stress test rate (separate field for calculations)
    stressTestRate: 4,
    
    // Interest rates for each year
    interestRateY1: '',      // Year 1
    interestRateY2: '',      // Year 2
    interestRateY3: '',      // Year 3
    interestRateY4: '',      // Year 4
    interestRateY5: '',      // Year 5
    interestRateThereafter: '', // Thereafter
    
    // Total interest period selection
    interestPeriodSelection: 5, // Default to 5 years
    
    loanTenor: 30, // Default to 30 years
    
    // Applicant A
    monthlySalaryA: '',
    annualSalaryA: '',
    applicantAgeA: '',
    
    // Applicant B
    monthlySalaryB: '',
    annualSalaryB: '',
    applicantAgeB: '',
    
    // Show Fund and Pledging (combined solution)
    showFundAmount: '',
    pledgeAmount: '',
    
    // Existing commitments
    carLoanA: '',
    carLoanB: '',
    personalLoanA: '',
    personalLoanB: '',
    
    // Property loan for HDB MSR calculation
    propertyLoanA: '',
    propertyLoanB: ''
  });
