// Helper functions for mortgage calculations

// Format currency input with commas
export const formatCurrencyInput = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = parseFloat(value.toString().replace(/,/g, ''));
  if (isNaN(num)) return '';
  return num.toLocaleString();
};

// Parse number input removing commas
export const parseNumberInput = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = parseFloat(value.toString().replace(/,/g, ''));
  return isNaN(num) ? '' : num;
};

// Get default stress test rate based on property type
export const getDefaultStressTestRate = (propertyType) => {
  switch (propertyType) {
    case 'commercial':
      return 5;
    default:
      return 4;
  }
};

// Get property type display text
export const getPropertyTypeText = (type) => {
  switch (type) {
    case 'private': return 'Private Property';
    case 'hdb': return 'HDB Property';
    case 'ec': return 'EC Property';
    case 'commercial': return 'Commercial/Industrial Property';
    default: return 'Property';
  }
};

// Calculate average age of applicants
export const calculateAverageAge = (ageA, ageB) => {
  const parsedAgeA = parseNumberInput(ageA) || 0;
  const parsedAgeB = parseNumberInput(ageB) || 0;
  
  if (parsedAgeA > 0 && parsedAgeB > 0) {
    return (parsedAgeA + parsedAgeB) / 2;
  } else if (parsedAgeA > 0) {
    return parsedAgeA;
  } else if (parsedAgeB > 0) {
    return parsedAgeB;
  }
  return 0;
};

// Calculate maximum loan tenor based on age and loan percentage
export const calculateMaxLoanTenor = (averageAge, loanPercentage, propertyType) => {
  if (averageAge <= 0) return 35;
  
  let maxTenor;
  
  if (loanPercentage <= 75) {
    maxTenor = Math.min(65 - averageAge, 35);
  } else if (loanPercentage <= 80) {
    maxTenor = Math.min(65 - averageAge, 30);
  } else {
    maxTenor = Math.min(65 - averageAge, 25);
  }
  
  // Adjust for commercial properties
  if (propertyType === 'commercial') {
    maxTenor = Math.min(maxTenor, 20); // Max 20 years for commercial
  }
  
  return Math.max(maxTenor, 5); // Minimum 5 years
};