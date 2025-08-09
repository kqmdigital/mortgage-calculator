// ===================================
// MONTHLY INSTALLMENT CALCULATION FUNCTIONS
// ===================================

// Enhanced rate display with reference rate values for PDF
function formatDetailedRateDisplay(pkg, year) {
    let rateType, operator, value;
    
    if (year === 'thereafter') {
        rateType = pkg.thereafter_rate_type;
        operator = pkg.thereafter_operator;
        value = pkg.thereafter_value;
    } else {
        rateType = pkg[`year${year}_rate_type`];
        operator = pkg[`year${year}_operator`];
        value = pkg[`year${year}_value`];
    }

    // Auto-populate with thereafter rate if no specific year data
    if (!rateType || value === null || value === undefined) {
        if (pkg.thereafter_rate_type && pkg.thereafter_value !== null && pkg.thereafter_value !== undefined) {
            return formatDetailedRateDisplay(pkg, 'thereafter');
        }
        return '-';
    }

    if (rateType === 'FIXED') {
        const rate = calculateInterestRate(pkg, year);
        return `${rate.toFixed(2)}%<br><small>FIXED</small>`;
    } else {
        // Find the reference rate from rateTypes (assuming rateTypes is available)
        const referenceRateValue = rateType.includes('SORA') ? 3.50 : 3.25; // Default SORA rate
        const spreadValue = parseFloat(value) || 0;
        const totalRate = calculateInterestRate(pkg, year);
        
        const operatorSymbol = operator === '+' ? '+' : '-';
        return `${totalRate.toFixed(2)}%<br><small>${rateType}(${referenceRateValue.toFixed(2)}%) ${operatorSymbol} ${spreadValue.toFixed(2)}%</small>`;
    }
}

// Format savings for PDF with line breaks
function formatPDFSavings(savings, lockInPeriod = null) {
    if (savings === 0) return 'No savings';
    
    const lockInYears = lockInPeriod ? (lockInPeriod.includes('Year') ? parseInt(lockInPeriod) : parseInt(lockInPeriod)) : null;
    const periodText = lockInYears ? `Over ${lockInYears} Year${lockInYears > 1 ? 's' : ''} Lock-in` : '';
    
    if (savings > 0) {
        return `Save ${formatCurrency(Math.abs(savings))}<br><small>${periodText}</small>`;
    } else {
        return `Higher by ${formatCurrency(Math.abs(savings))}<br><small>${periodText}</small>`;
    }
}

// PMT function for calculating monthly payments
const calculatePMT = (rate, periods, principal) => {
    if (rate === 0 || !rate) return principal / periods;
    const monthlyRate = rate / 100 / 12;
    const denominator = Math.pow(1 + monthlyRate, periods) - 1;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, periods)) / denominator;
};

// Calculate detailed repayment schedule with year-by-year breakdown
const calculateDetailedRepaymentSchedule = (pkg, loanAmount, tenureYears) => {
    if (!pkg || !loanAmount || !tenureYears) return null;
    
    const totalMonths = tenureYears * 12;
    let balance = loanAmount;
    const yearlyData = [];
    
    // Calculate year-by-year data
    for (let year = 1; year <= tenureYears; year++) {
        const yearStartBalance = balance;
        let yearInterestPaid = 0;
        let yearPrincipalPaid = 0;
        
        // Get rate for this year
        const currentRate = calculateInterestRate(pkg, year <= 5 ? year : 'thereafter');
        
        // Calculate monthly payment for this rate (but using full tenure for calculation)
        const monthlyPayment = calculatePMT(currentRate, totalMonths, loanAmount);
        
        // Calculate monthly breakdown for this year
        for (let month = 1; month <= 12 && balance > 0.01; month++) {
            const monthlyRate = currentRate / 100 / 12;
            const interestPayment = balance * monthlyRate;
            const principalPayment = Math.min(monthlyPayment - interestPayment, balance);
            
            yearInterestPaid += interestPayment;
            yearPrincipalPaid += principalPayment;
            balance = Math.max(0, balance - principalPayment);
            
            if (balance <= 0.01) break;
        }
        
        yearlyData.push({
            year: year,
            rate: currentRate,
            beginningPrincipal: yearStartBalance,
            monthlyInstalment: monthlyPayment,
            interestPaid: yearInterestPaid,
            principalPaid: yearPrincipalPaid,
            endingPrincipal: balance
        });
        
        if (balance <= 0.01) break;
    }
    
    // Calculate totals
    const totalInterest = yearlyData.reduce((sum, year) => sum + year.interestPaid, 0);
    const totalPrincipal = yearlyData.reduce((sum, year) => sum + year.principalPaid, 0);
    
    return {
        yearlyData,
        totalInterest,
        totalPrincipal,
        totalPayable: totalInterest + totalPrincipal
    };
};

// Calculate monthly installment comparison data for multiple packages
const calculateMonthlyInstallmentComparison = (packages, loanAmount, tenureYears, existingRate = null) => {
    if (!packages || !loanAmount || !tenureYears) return null;
    
    const comparisonData = {
        packages: [],
        currentPackage: null,
        yearlyComparison: []
    };
    
    // Add current package data for refinancing
    if (existingRate && existingRate > 0) {
        const currentMonthlyPayment = calculateMonthlyInstallment(loanAmount, tenureYears, existingRate);
        comparisonData.currentPackage = {
            name: 'Current Package',
            rate: existingRate,
            monthlyPayment: currentMonthlyPayment,
            yearlyData: []
        };
        
        // Calculate year-by-year for current package
        for (let year = 1; year <= Math.min(5, tenureYears); year++) {
            comparisonData.currentPackage.yearlyData.push({
                year,
                monthlyInstalment: currentMonthlyPayment,
                totalPrincipal: 0, // Would need full calculation
                totalInterest: 0   // Would need full calculation
            });
        }
    }
    
    // Calculate data for each recommended package
    packages.forEach((pkg, index) => {
        const schedule = calculateDetailedRepaymentSchedule(pkg, loanAmount, tenureYears);
        if (schedule) {
            comparisonData.packages.push({
                name: `PKG(${index + 1})`,
                bankName: pkg.bank_name,
                pkg: pkg,
                schedule: schedule
            });
        }
    });
    
    // Create year-by-year comparison (Years 1-5)
    for (let year = 1; year <= Math.min(5, tenureYears); year++) {
        const yearComparison = {
            year: year,
            current: null,
            packages: []
        };
        
        // Add current package data
        if (comparisonData.currentPackage) {
            const currentYearData = comparisonData.currentPackage.yearlyData.find(y => y.year === year);
            if (currentYearData) {
                yearComparison.current = {
                    monthlyInstalment: currentYearData.monthlyInstalment,
                    totalPrincipal: currentYearData.totalPrincipal,
                    totalInterest: currentYearData.totalInterest
                };
            }
        }
        
        // Add package data
        comparisonData.packages.forEach(pkgData => {
            const yearData = pkgData.schedule.yearlyData.find(y => y.year === year);
            if (yearData) {
                yearComparison.packages.push({
                    name: pkgData.name,
                    bankName: pkgData.bankName,
                    rate: yearData.rate,
                    monthlyInstalment: yearData.monthlyInstalment,
                    totalPrincipal: yearData.principalPaid,
                    totalInterest: yearData.interestPaid,
                    totalSavings: yearComparison.current ? 
                        (yearComparison.current.monthlyInstalment - yearData.monthlyInstalment) * 12 : 0
                });
            }
        });
        
        comparisonData.yearlyComparison.push(yearComparison);
    }
    
    return comparisonData;
};

// ===================================
// PDF REPORT GENERATION FUNCTIONS
// ===================================

function generateProfessionalReport() {
    if (!currentResults.length) {
        showNotification('No results to generate report. Please search for packages first.', 'error');
        return;
    }

    // Debug: Check searchCriteria content
    console.log('🔍 searchCriteria in generateProfessionalReport:', searchCriteria);
    console.log('💰 Loan Amount:', searchCriteria.loanAmount);
    console.log('📅 Loan Tenure:', searchCriteria.loanTenure);
    console.log('🏠 Loan Type:', searchCriteria.loanType);
    console.log('📊 Existing Rate:', searchCriteria.existingInterestRate);

    // Safeguard: If searchCriteria is empty or missing data, rebuild it from form
    if (!searchCriteria || Object.keys(searchCriteria).length === 0 || !searchCriteria.loanAmount || !searchCriteria.loanTenure) {
        console.warn('⚠️ searchCriteria missing data, rebuilding from form...');
        searchCriteria = {
            ...searchCriteria,
            loanAmount: parseFloat(document.getElementById('loanAmount').value) || 0,
            loanTenure: parseInt(document.getElementById('loanTenure').value) || 25,
            propertyType: document.getElementById('propertyType').value,
            propertyStatus: document.getElementById('propertyStatus').value,
            loanType: currentLoanType || 'New Home Loan',
            existingInterestRate: parseFloat(document.getElementById('existingInterestRate').value) || 0
        };
        console.log('🔧 Rebuilt searchCriteria:', searchCriteria);
    }
    
    // Ensure existingInterestRate is always captured for refinancing
    if (!searchCriteria.existingInterestRate && searchCriteria.loanType === 'Refinancing Home Loan') {
        searchCriteria.existingInterestRate = parseFloat(document.getElementById('existingInterestRate').value) || 0;
        console.log('🔄 Added missing existingInterestRate:', searchCriteria.existingInterestRate);
    }

    // Get report options
    const clientName = document.getElementById('clientName').value.trim();
    const hideBankNames = document.getElementById('hideBankNames').checked;

    // Get selected packages or default to top 3
    let selectedPackages = currentResults.filter(pkg => pkg.selected !== false);
    if (selectedPackages.length === 0) {
        selectedPackages = currentResults.slice(0, 3);
    } else {
        selectedPackages = selectedPackages.slice(0, 3); // Limit to top 3
    }
    
    // Calculate monthly installment comparison data
    const installmentComparison = calculateMonthlyInstallmentComparison(
        selectedPackages, 
        searchCriteria.loanAmount, 
        searchCriteria.loanTenure, 
        searchCriteria.existingInterestRate
    );
    
    // Debug: Check selected packages
    console.log('📦 Selected Packages:', selectedPackages.map(pkg => ({
        bank: pkg.bank_name,
        totalSavings: pkg.totalSavings,
        lockPeriod: pkg.lock_period
    })));

    // Recalculate savings for PDF generation if refinancing
    if (searchCriteria.loanType === 'Refinancing Home Loan' && searchCriteria.existingInterestRate > 0) {
        selectedPackages = selectedPackages.map(pkg => {
            const avgFirst2Years = pkg.avgFirst2Years || calculateAverageFirst2Years(pkg);
            const monthlySavings = calculateMonthlySavings(
                searchCriteria.loanAmount, 
                searchCriteria.loanTenure, 
                searchCriteria.existingInterestRate, 
                avgFirst2Years
            );
            const totalSavings = calculateTotalSavings(monthlySavings, pkg.lock_period);
            
            console.log(`💰 Recalculated savings for ${pkg.bank_name}:`, {
                monthlySavings,
                totalSavings,
                lockPeriod: pkg.lock_period,
                avgRate: avgFirst2Years,
                existingRate: searchCriteria.existingInterestRate
            });
            
            return {
                ...pkg,
                totalSavings,
                monthlySavings
            };
        });
    }

    if (selectedPackages.length === 0) {
        showNotification('Please select at least one package for the report.', 'error');
        return;
    }

    console.log('📄 Generating professional report for', selectedPackages.length, 'packages');

    const reportDate = new Date().toLocaleDateString('en-SG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    // FIXED: Always show all 5 years + thereafter (remove duplicate declaration)
    const yearsToShow = [1, 2, 3, 4, 5];
    const hasThereafterData = true; // Always show thereafter row

    const reportContent = `
        <div class="pdf-report-container">
            <!-- Professional Header -->
            <div class="pdf-header">
                <div class="logo-section">
                    <img src="https://ik.imagekit.io/hst9jooux/KEYQUEST%20LOGO%20(Black%20Text%20Horizontal).png?updatedAt=1753262438682" 
                         alt="KeyQuest Mortgage Logo" 
                         onerror="this.style.display='none';" />
                </div>
                <div class="title-section">
                    <h1>Mortgage Package Analysis</h1>
                    ${clientName ? `<div class="client-name">Prepared for: ${clientName}</div>` : ''}
                </div>
            </div>

            <!-- Key Information Cards -->
            <div class="pdf-key-info">
                <div class="pdf-info-grid">
                    <div class="pdf-info-item">
                        <div class="pdf-info-icon">💰</div>
                        <div class="pdf-info-label">Loan Amount</div>
                        <div class="pdf-info-value">${formatCurrency(searchCriteria.loanAmount || 0)}</div>
                    </div>
                    <div class="pdf-info-item">
                        <div class="pdf-info-icon">📅</div>
                        <div class="pdf-info-label">Loan Tenure</div>
                        <div class="pdf-info-value">${searchCriteria.loanTenure || 'N/A'} Years</div>
                    </div>
                    <div class="pdf-info-item">
                        <div class="pdf-info-icon">🏠</div>
                        <div class="pdf-info-label">Property Type</div>
                        <div class="pdf-info-value property-type">${searchCriteria.propertyType || 'Private Property'}</div>
                    </div>
                    <div class="pdf-info-item">
                        <div class="pdf-info-icon">📋</div>
                        <div class="pdf-info-label">Property Status</div>
                        <div class="pdf-info-value property-status">${searchCriteria.propertyStatus || 'Completed'}</div>
                    </div>
                    ${searchCriteria.loanType === 'Refinancing Home Loan' && searchCriteria.existingInterestRate ? `
                    <div class="pdf-info-item">
                        <div class="pdf-info-icon">📊</div>
                        <div class="pdf-info-label">Current Rate</div>
                        <div class="pdf-info-value current-rate">${parseFloat(searchCriteria.existingInterestRate).toFixed(2)}%</div>
                    </div>
                    ` : `
                    <div class="pdf-info-item">
                        <div class="pdf-info-icon">⭐</div>
                        <div class="pdf-info-label">Best Rate</div>
                        <div class="pdf-info-value best-rate">${selectedPackages[0]?.avgFirst2Years?.toFixed(2) || 'N/A'}%</div>
                    </div>
                    `}
                </div>
            </div>


            <!-- Package Comparison Table -->
            <div class="pdf-comparison-section">
                <div class="pdf-comparison-title">Package Comparison</div>
                
                <table class="pdf-comparison-table">
                    <thead>
                        <tr>
                            <th>Details</th>
                            ${selectedPackages.map((pkg, index) => `
                                <th class="${index === 0 ? 'recommended' : ''}">
                                    ${hideBankNames ? `PKG(${index + 1})` : pkg.bank_name}
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Rate Type</td>
                            ${selectedPackages.map((pkg, index) => `
                                <td class="${index === 0 ? 'recommended' : ''}">
                                    ${pkg.rate_type_category || 'Rate Package'}
                                </td>
                            `).join('')}
                        </tr>
                        <tr>
                            <td>Min Loan Amount</td>
                            ${selectedPackages.map((pkg, index) => `
                                <td class="${index === 0 ? 'recommended amount' : 'amount'}">
                                    ${formatCurrency(pkg.minimum_loan_size || 0)}
                                </td>
                            `).join('')}
                        </tr>
                        
                        ${yearsToShow.map((year, yearIndex) => `
                            <tr>
                                <td>Year ${year}</td>
                                ${selectedPackages.map((pkg, index) => {
                                    const rateDisplay = formatDetailedRateDisplay(pkg, year);
                                    return `
                                    <td class="${index === 0 ? 'recommended rate-value' : 'rate-value'}">
                                        ${rateDisplay}
                                    </td>
                                `;
                                }).join('')}
                            </tr>
                        `).join('')}
                        
                        <tr>
                            <td>Thereafter</td>
                            ${selectedPackages.map((pkg, index) => {
                                const rateDisplay = formatDetailedRateDisplay(pkg, 'thereafter');
                                return `
                                <td class="${index === 0 ? 'recommended rate-value' : 'rate-value'}">
                                    ${rateDisplay}
                                </td>
                            `;
                            }).join('')}
                        </tr>
                        
                        <tr>
                            <td>Lock-in Period</td>
                            ${selectedPackages.map((pkg, index) => `
                                <td class="${index === 0 ? 'recommended period' : 'period'}">
                                    ${parseLockInPeriod(pkg.lock_period) || 0} Years
                                </td>
                            `).join('')}
                        </tr>
                        
                        
                        ${searchCriteria.loanType === 'Refinancing Home Loan' && searchCriteria.existingInterestRate ? `
                        <tr>
                            <td>Monthly Installment</td>
                            ${selectedPackages.map((pkg, index) => `
                                <td class="${index === 0 ? 'recommended' : ''}">
                                    ${formatCurrency(pkg.monthlyInstallment || 0)}
                                </td>
                            `).join('')}
                        </tr>
                        <tr>
                            <td>Total Savings</td>
                            ${selectedPackages.map((pkg, index) => `
                                <td class="${index === 0 ? 'recommended savings-cell' : 'savings-cell'}">
                                    ${formatPDFSavings(pkg.totalSavings || 0, pkg.lock_period)}
                                </td>
                            `).join('')}
                        </tr>
                        ` : `
                        <tr>
                            <td>Monthly Installment</td>
                            ${selectedPackages.map((pkg, index) => `
                                <td class="${index === 0 ? 'recommended' : ''}">
                                    ${formatCurrency(pkg.monthlyInstallment || 0)}
                                </td>
                            `).join('')}
                        </tr>
                        `}
                        
                        <tr>
                            <td>Package Features</td>
                            ${selectedPackages.map((pkg, index) => `
                                <td class="${index === 0 ? 'recommended features-cell' : 'features-cell'}">
                                    ${pkg.legal_fee_subsidy === 'true' || pkg.legal_fee_subsidy === true ? 
                                        '<div style="color: #2563eb; margin-bottom: 3px;">✓ Legal Fee Subsidy</div>' : ''}
                                    ${pkg.cash_rebate === 'true' || pkg.cash_rebate === true ? 
                                        '<div style="color: #2563eb; margin-bottom: 3px;">✓ Cash Rebate</div>' : ''}
                                    ${pkg.free_package_conversion_12m === 'true' || pkg.free_package_conversion_12m === true ? 
                                        '<div style="color: #2563eb; margin-bottom: 3px;">✓ Free Conversion (12M)</div>' : ''}
                                    ${pkg.free_package_conversion_24m === 'true' || pkg.free_package_conversion_24m === true ? 
                                        '<div style="color: #2563eb; margin-bottom: 3px;">✓ Free Conversion (24M)</div>' : ''}
                                    ${pkg.valuation_subsidy === 'true' || pkg.valuation_subsidy === true ? 
                                        '<div style="color: #2563eb; margin-bottom: 3px;">✓ Valuation Subsidy</div>' : ''}
                                    ${pkg.partial_repayment === 'true' || pkg.partial_repayment === true ? 
                                        '<div style="color: #2563eb; margin-bottom: 3px;">✓ Partial Repayment</div>' : ''}
                                    ${pkg.waiver_due_to_sales === 'true' || pkg.waiver_due_to_sales === true ? 
                                        '<div style="color: #2563eb; margin-bottom: 3px;">✓ Waiver Due to Sales</div>' : ''}
                                    ${(!pkg.legal_fee_subsidy || pkg.legal_fee_subsidy === 'false') && 
                                      (!pkg.cash_rebate || pkg.cash_rebate === 'false') && 
                                      (!pkg.free_package_conversion_12m || pkg.free_package_conversion_12m === 'false') &&
                                      (!pkg.free_package_conversion_24m || pkg.free_package_conversion_24m === 'false') &&
                                      (!pkg.valuation_subsidy || pkg.valuation_subsidy === 'false') &&
                                      (!pkg.partial_repayment || pkg.partial_repayment === 'false') &&
                                      (!pkg.waiver_due_to_sales || pkg.waiver_due_to_sales === 'false') ? 
                                        '<div style="color: #6b7280;">Not Specified</div>' : ''}
                                </td>
                            `).join('')}
                        </tr>
                        
                        <tr>
                            <td>Remarks</td>
                            ${selectedPackages.map((pkg, index) => `
                                <td class="${index === 0 ? 'recommended features-cell' : 'features-cell'}">
                                    ${(pkg.custom_remarks || pkg.remarks || 'All packages are structured with fixed rates followed by floating rates based on 3M SORA.').replace(/\n/g, '<br>').substring(0, 200)}${(pkg.custom_remarks || pkg.remarks || '').length > 200 ? '...' : ''}
                                </td>
                            `).join('')}
                        </tr>
                    </tbody>
                </table>
            </div>


            <!-- Monthly Installment Comparison Table -->
            ${installmentComparison ? `
            <div class="pdf-monthly-installment-section">
                <div class="pdf-section-title">Monthly Repayment Comparison</div>
                
                <table class="pdf-monthly-installment-table">
                    <thead>
                        <tr>
                            <th class="row-header"></th>
                            ${selectedPackages.map((pkg, index) => `
                                <th class="${index === 0 ? 'recommended-package-header' : 'package-header'}">
                                    ${hideBankNames ? `PKG(${index + 1})` : pkg.bank_name}
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="rate-row">
                            <td class="year-label">Rate</td>
                            ${selectedPackages.map((pkg, index) => `
                                <td class="package-value ${index === 0 ? 'recommended' : ''}">${pkg.avgFirst2Years?.toFixed(2)}%</td>
                            `).join('')}
                        </tr>
                        ${installmentComparison.yearlyComparison.map(yearData => `
                            <tr class="year-row">
                                <td class="year-label">Year ${yearData.year} - MI</td>
                                ${yearData.packages.map((pkgData, index) => `
                                    <td class="package-value ${index === 0 ? 'recommended' : ''}">${formatCurrency(pkgData.monthlyInstalment)}</td>
                                `).join('')}
                            </tr>
                            ${yearData.packages.length > 0 && yearData.packages[0].totalPrincipal ? `
                            <tr class="detail-row">
                                <td class="detail-label">Total Principal</td>
                                ${yearData.packages.map((pkgData, index) => `
                                    <td class="package-detail ${index === 0 ? 'recommended' : ''}">${formatCurrency(pkgData.totalPrincipal)}</td>
                                `).join('')}
                            </tr>
                            <tr class="detail-row">
                                <td class="detail-label">Total Interest</td>
                                ${yearData.packages.map((pkgData, index) => `
                                    <td class="package-detail ${index === 0 ? 'recommended' : ''}">${formatCurrency(pkgData.totalInterest)}</td>
                                `).join('')}
                            </tr>
                            ${searchCriteria.loanType === 'Refinancing Home Loan' && searchCriteria.existingInterestRate && installmentComparison.currentPackage ? `
                            <tr class="detail-row">
                                <td class="detail-label">Total Saving</td>
                                ${yearData.packages.map((pkgData, index) => {
                                    // Use the current package's monthly payment (fixed for all years in refinancing)
                                    const currentMonthlyPayment = installmentComparison.currentPackage.monthlyPayment;
                                    const packageMonthlyPayment = pkgData.monthlyInstalment;
                                    const monthlySavings = currentMonthlyPayment - packageMonthlyPayment;
                                    const yearSavings = monthlySavings * 12; // Yearly savings
                                    return `<td class="package-detail ${index === 0 ? 'recommended' : ''}">${formatCurrency(yearSavings)}</td>`;
                                }).join('')}
                            </tr>
                            ` : ''}
                            ` : ''}
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Monthly Installment Bar Chart -->
            <div class="pdf-chart-section">
                <div class="pdf-section-title">Monthly Repayment Breakdown</div>
                
                <div class="pdf-bar-chart">
                    ${installmentComparison.currentPackage ? `
                        <div class="pdf-bar-item current-package">
                            <div class="pdf-bar-rate">${searchCriteria.existingInterestRate?.toFixed(2)}%</div>
                            <div class="pdf-bar-container">
                                <div class="pdf-bar-stack current">
                                    <div class="pdf-bar-segment interest current" style="height: ${(() => {
                                        const currentMonthly = installmentComparison.currentPackage.monthlyPayment;
                                        const currentInterest = currentMonthly * 0.7; // Approximate interest portion
                                        const currentPrincipal = currentMonthly * 0.3; // Approximate principal portion
                                        const maxPayment = Math.max(currentMonthly, ...selectedPackages.map((p, i) => installmentComparison.yearlyComparison[0].packages[i].monthlyInstalment));
                                        const barHeight = (currentMonthly / maxPayment) * 200;
                                        return (currentInterest / currentMonthly) * barHeight;
                                    })()}px;">
                                        <span class="pdf-bar-text">Interest<br>${formatCurrency(installmentComparison.currentPackage.monthlyPayment * 0.7)}</span>
                                    </div>
                                    <div class="pdf-bar-segment principal current" style="height: ${(() => {
                                        const currentMonthly = installmentComparison.currentPackage.monthlyPayment;
                                        const currentPrincipal = currentMonthly * 0.3;
                                        const maxPayment = Math.max(currentMonthly, ...selectedPackages.map((p, i) => installmentComparison.yearlyComparison[0].packages[i].monthlyInstalment));
                                        const barHeight = (currentMonthly / maxPayment) * 200;
                                        return (currentPrincipal / currentMonthly) * barHeight;
                                    })()}px;">
                                        <span class="pdf-bar-text">Principal<br>${formatCurrency(installmentComparison.currentPackage.monthlyPayment * 0.3)}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="pdf-bar-label">Current Package</div>
                            <div class="pdf-bar-amount">${formatCurrency(installmentComparison.currentPackage.monthlyPayment)}</div>
                        </div>
                    ` : ''}
                    ${selectedPackages.map((pkg, index) => {
                        const yearData = installmentComparison.yearlyComparison[0]; // Year 1 data
                        const pkgData = yearData.packages[index];
                        const monthlyPayment = pkgData.monthlyInstalment;
                        const totalInterest = pkgData.totalInterest / 12; // Monthly interest portion
                        const totalPrincipal = pkgData.totalPrincipal / 12; // Monthly principal portion
                        const rate = pkg.avgFirst2Years?.toFixed(2);
                        const allPayments = installmentComparison.currentPackage ? 
                            [installmentComparison.currentPackage.monthlyPayment, ...selectedPackages.map((p, i) => yearData.packages[i].monthlyInstalment)] :
                            selectedPackages.map((p, i) => yearData.packages[i].monthlyInstalment);
                        const maxPayment = Math.max(...allPayments);
                        const barHeight = (monthlyPayment / maxPayment) * 200; // Scale to 200px max height
                        const principalHeight = (totalPrincipal / monthlyPayment) * barHeight;
                        const interestHeight = (totalInterest / monthlyPayment) * barHeight;
                        
                        return `
                        <div class="pdf-bar-item">
                            <div class="pdf-bar-rate">${rate}%</div>
                            <div class="pdf-bar-container">
                                <div class="pdf-bar-stack">
                                    <div class="pdf-bar-segment interest" style="height: ${interestHeight}px;">
                                        <span class="pdf-bar-text">Interest<br>${formatCurrency(totalInterest)}</span>
                                    </div>
                                    <div class="pdf-bar-segment principal" style="height: ${principalHeight}px;">
                                        <span class="pdf-bar-text">Principal<br>${formatCurrency(totalPrincipal)}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="pdf-bar-label">${hideBankNames ? `PKG(${index + 1})` : pkg.bank_name}</div>
                            <div class="pdf-bar-amount">${formatCurrency(monthlyPayment)}</div>
                        </div>`;
                    }).join('')}
                </div>
                
                <div class="pdf-chart-legend">
                    <div class="pdf-legend-item">
                        <div class="pdf-legend-color principal"></div>
                        <span>Principal</span>
                    </div>
                    <div class="pdf-legend-item">
                        <div class="pdf-legend-color interest"></div>
                        <span>Interest</span>
                    </div>
                </div>
            </div>
            ` : ''}

            ${searchCriteria.loanType === 'Refinancing Home Loan' && searchCriteria.existingInterestRate ? `
            <!-- Potential Savings Section -->
            <div class="pdf-savings-section">
                <div class="pdf-savings-title">Potential Savings with Our Recommended Package</div>
                <div class="pdf-savings-grid">
                    <div class="pdf-savings-item">
                        <div class="label">Current Monthly Payment</div>
                        <div class="value current">${formatCurrency(calculateMonthlyInstallment(searchCriteria.loanAmount, searchCriteria.loanTenure, searchCriteria.existingInterestRate))}</div>
                        <div class="sub-label">at ${parseFloat(searchCriteria.existingInterestRate).toFixed(2)}%</div>
                    </div>
                    <div class="pdf-savings-item">
                        <div class="label">New Monthly Payment</div>
                        <div class="value new">${formatCurrency(selectedPackages[0]?.monthlyInstallment || 0)}</div>
                        <div class="sub-label">at ${selectedPackages[0]?.avgFirst2Years?.toFixed(2) || 'N/A'}%</div>
                    </div>
                    <div class="pdf-savings-item">
                        <div class="label">Total Savings</div>
                        <div class="value savings">${formatSavings(selectedPackages[0]?.totalSavings || 0, selectedPackages[0]?.lock_period)}</div>
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Professional Disclaimer -->
            <div class="pdf-disclaimer">
                <div class="pdf-disclaimer-title">Disclaimer – Keyquest Ventures Private Limited</div>
                <div class="pdf-disclaimer-text">
                    This report is for general information and personal reference only. It does not constitute financial, investment, or professional advice, and does not take into account individual goals or financial situations.<br><br>
                    Users should not rely solely on this information when making financial or investment decisions. While we aim to use reliable data, Keyquest Ventures Private Limited does not guarantee its accuracy or completeness.<br><br>
                    Before refinancing, please check with your bank for any penalties, clawbacks, or fees that may apply.<br><br>
                    Use of our reports, consultancy services, or advice—whether by the recipient directly or through our consultants, affiliates, or partners—is undertaken entirely at the user's own risk. Keyquest Ventures Private Limited, including its affiliates and employees, bears no responsibility or liability for any decisions made or actions taken based on the information provided.
                </div>
            </div>
        </div>
    `;

    // Skip modal preview and go directly to print/PDF
    openDirectPrintReport(reportContent);
}

function openDirectPrintReport(reportContent) {
    // Set document title for the PDF export
    const originalTitle = document.title;
    document.title = `Keyquest_Mortgage_Report_${new Date().toISOString().split('T')[0]}`;
    
    // Open new window and directly write the report content
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Keyquest Mortgage Report</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                @page {
                    margin: 0.4in 0.3in;
                    size: A4;
                }
                
                @media print {
                    @page {
                        margin: 0.4in 0.3in;
                        size: A4;
                    }
                    
                    /* Hide browser-generated headers and footers */
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    /* Remove any browser-generated content */
                    .no-print,
                    header,
                    footer {
                        display: none !important;
                    }
                }
                
                * {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                    margin: 0;
                    padding: 0;
                    background: white !important;
                    color: #1a1a1a !important;
                }
                
                /* Use the same print styles as before but ensure they match our new theme */
                .pdf-report-container {
                    padding: 20px !important;
                    background: white !important;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                    line-height: 1.4 !important;
                    color: #1f2937 !important;
                    max-width: none !important;
                    margin: 0 auto !important;
                    overflow: visible !important;
                }

                /* Apply professional blue theme to match TDSR report */
                * {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif !important;
                }
                .pdf-header {
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    margin: 0 0 15px 0 !important;
                    padding: 5px 0 10px 0 !important;
                    border-bottom: 2px solid #264A82 !important;
                    height: 85px !important;
                    overflow: visible !important;
                }

                .pdf-key-info {
                    background: transparent !important;
                    border: none !important;
                    border-radius: 16px !important;
                    padding: 8px !important;
                    margin-top: 8px !important;
                    margin-bottom: 8px !important;
                }

                .pdf-info-label {
                    color: white !important;
                    margin-bottom: 4px !important;
                    font-weight: 600 !important;
                    font-size: 9px !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.3px !important;
                    line-height: 1.1 !important;
                }

                .pdf-info-value {
                    font-size: 12px !important;
                    font-weight: 600 !important;
                    color: white !important;
                    line-height: 1.2 !important;
                    margin: 0 !important;
                }

                .pdf-info-value.current-rate {
                    color: white !important;
                }

                .pdf-comparison-title {
                    font-size: 16px !important;
                    font-weight: 700 !important;
                    color: #264A82 !important;
                    margin-bottom: 15px !important;
                    text-align: left !important;
                }

                .pdf-comparison-table thead {
                    background: linear-gradient(135deg, #264A82 0%, #1e3a6f 100%) !important;
                }

                .pdf-comparison-table th:first-child {
                    background: #1e3a6f !important;
                }

                .pdf-comparison-table td.recommended {
                    background: rgba(38, 74, 130, 0.15) !important;
                    font-weight: 600 !important;
                    color: #264A82 !important;
                }

                .pdf-comparison-table th.recommended {
                    background: #1e3a6f !important;
                    position: relative !important;
                }

                .pdf-savings-item .value.new {
                    color: #264A82 !important;
                }

                /* Complete PDF Report Styles */
                .pdf-header .logo-section {
                    flex: 0 0 auto !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    line-height: 0 !important;
                }

                .pdf-header .logo-section {
                    height: 85px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: flex-start !important;
                    overflow: visible !important;
                    flex-shrink: 0 !important;
                    margin-left: -10px !important;
                }

                .pdf-header .logo-section img {
                    height: 200px !important;
                    width: auto !important;
                    object-fit: contain !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    border: 0 !important;
                    vertical-align: middle !important;
                    display: block !important;
                    max-width: 280px !important;
                }

                .pdf-header .title-section {
                    text-align: right !important;
                    flex: 1 !important;
                    margin-left: 30px !important;
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: center !important;
                    align-items: flex-end !important;
                }

                .pdf-header h1 {
                    margin: 0 !important;
                    font-size: 24px !important;
                    font-weight: 800 !important;
                    color: #1f2937 !important;
                    letter-spacing: -0.5px !important;
                    line-height: 1.2 !important;
                }

                .pdf-header .client-name {
                    font-size: 16px !important;
                    color: #6b7280 !important;
                    margin: 2px 0 !important;
                    font-weight: 500 !important;
                    line-height: 1.2 !important;
                }

                .pdf-header .report-date {
                    font-size: 13px !important;
                    color: #9ca3af !important;
                    margin: 0 !important;
                    line-height: 1.2 !important;
                }

                .pdf-info-grid {
                    display: grid !important;
                    grid-template-columns: repeat(5, 1fr) !important;
                    gap: 12px !important;
                    align-items: stretch !important;
                    padding: 6px !important;
                }

                .pdf-info-item {
                    text-align: center !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    justify-content: center !important;
                    min-height: 65px !important;
                    padding: 8px 6px !important;
                    background: linear-gradient(135deg, #264A82 0%, #1e3a6f 100%) !important;
                    border-radius: 8px !important;
                    box-shadow: 0 2px 8px rgba(38, 74, 130, 0.25) !important;
                    margin: 0 !important;
                }

                .pdf-info-value.best-rate,
                .pdf-info-value.savings {
                    color: white !important;
                }

                .pdf-info-value.property-type {
                    font-size: 12px !important;
                    font-weight: 600 !important;
                    line-height: 1.2 !important;
                }

                .pdf-info-value.savings {
                    font-size: 11px !important;
                    line-height: 1.2 !important;
                }

                .pdf-info-value .sub-text {
                    font-size: 12px !important;
                    display: block !important;
                    margin-top: 2px !important;
                }

                /* Potential Savings Section */
                .pdf-savings-section {
                    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%) !important;
                    border: 2px solid #264A82 !important;
                    border-radius: 16px !important;
                    padding: 20px !important;
                    margin-bottom: 20px !important;
                    margin-top: 15px !important;
                    position: relative !important;
                }

                .pdf-savings-section::before {
                    content: '💰' !important;
                    position: absolute !important;
                    top: 15px !important;
                    left: 15px !important;
                    font-size: 20px !important;
                }

                .pdf-savings-title {
                    font-size: 16px !important;
                    font-weight: 700 !important;
                    color: #264A82 !important;
                    margin-bottom: 15px !important;
                    margin-left: 30px !important;
                }

                .pdf-savings-grid {
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: stretch !important;
                    gap: 30px !important;
                    flex-wrap: wrap !important;
                    padding: 10px 20px !important;
                }

                .pdf-savings-item {
                    text-align: center !important;
                    flex: 1 !important;
                    min-width: 140px !important;
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: center !important;
                    align-items: center !important;
                }

                .pdf-savings-item .label {
                    color: #6b7280 !important;
                    font-size: 12px !important;
                    margin-bottom: 6px !important;
                }

                .pdf-savings-item .value {
                    font-size: 18px !important;
                    font-weight: 700 !important;
                }

                .pdf-savings-item .value.current {
                    color: #1d4ed8 !important;
                }

                .pdf-savings-item .value.new {
                    color: #2563eb !important;
                }

                .pdf-savings-item .value.savings {
                    color: #264A82 !important;
                    font-size: 18px !important;
                    font-weight: 800 !important;
                    line-height: 1.3 !important;
                }

                .pdf-savings-item .sub-label {
                    font-size: 11px !important;
                    color: #6b7280 !important;
                    margin-top: 4px !important;
                }

                /* Package Comparison Table */
                .pdf-comparison-section {
                    margin-bottom: 25px !important;
                }

                /* Monthly Installment Comparison Table */
                .pdf-monthly-installment-section {
                    margin: 25px 0 !important;
                    page-break-inside: avoid !important;
                }

                .pdf-section-title {
                    font-size: 16px !important;
                    font-weight: 700 !important;
                    color: #264A82 !important;
                    margin-bottom: 15px !important;
                    text-align: left !important;
                }

                .pdf-monthly-installment-table {
                    width: 100% !important;
                    border-collapse: collapse !important;
                    background: white !important;
                    border-radius: 12px !important;
                    overflow: hidden !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
                    table-layout: fixed !important;
                }

                .pdf-monthly-installment-table th {
                    background: linear-gradient(135deg, #264A82 0%, #1e3a6f 100%) !important;
                    padding: 10px 6px !important;
                    text-align: center !important;
                    font-weight: 600 !important;
                    font-size: 12px !important;
                    color: white !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.3px !important;
                    word-wrap: break-word !important;
                    vertical-align: middle !important;
                }

                .pdf-monthly-installment-table .row-header {
                    background: #1e3a6f !important;
                    width: 25% !important;
                    text-align: left !important;
                    padding-left: 12px !important;
                }

                .pdf-monthly-installment-table .rate-header-label {
                    background: #1e3a6f !important;
                    width: 25% !important;
                    text-align: left !important;
                    padding-left: 12px !important;
                    font-size: 12px !important;
                    font-weight: 600 !important;
                    color: white !important;
                }

                .pdf-monthly-installment-table .recommended-package-header {
                    background: #1e40af !important;
                    position: relative !important;
                    width: 25% !important;
                }

                .pdf-monthly-installment-table .recommended-package-header::after {
                    content: 'RECOMMENDED' !important;
                    position: absolute !important;
                    bottom: -8px !important;
                    left: 50% !important;
                    transform: translateX(-50%) !important;
                    background: #3b82f6 !important;
                    color: white !important;
                    font-size: 6px !important;
                    padding: 2px 6px !important;
                    border-radius: 3px !important;
                    font-weight: 700 !important;
                    white-space: nowrap !important;
                    z-index: 10 !important;
                }

                .pdf-monthly-installment-table .rate-subheader {
                    background: rgba(38, 74, 130, 0.8) !important;
                    padding: 6px !important;
                    text-align: center !important;
                    vertical-align: middle !important;
                    font-size: 12px !important;
                    font-weight: 700 !important;
                    color: white !important;
                    line-height: 1.2 !important;
                }

                .pdf-monthly-installment-table .rate-subheader.recommended {
                    background: rgba(30, 58, 111, 0.9) !important;
                }

                .pdf-monthly-installment-table .rate-label-text {
                    font-size: 8px !important;
                    font-weight: 500 !important;
                    color: rgba(255, 255, 255, 0.9) !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.3px !important;
                    display: inline !important;
                }

                .pdf-monthly-installment-table td {
                    padding: 8px 6px !important;
                    text-align: center !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                    font-size: 11px !important;
                    line-height: 1.4 !important;
                    word-wrap: break-word !important;
                    vertical-align: top !important;
                    max-width: 0 !important;
                }

                .pdf-monthly-installment-table .year-label {
                    background: #f3f4f6 !important;
                    font-weight: 600 !important;
                    color: #374151 !important;
                    text-align: left !important;
                    padding-left: 8px !important;
                }

                .pdf-monthly-installment-table .detail-label {
                    color: #6b7280 !important;
                    font-weight: 500 !important;
                    text-align: left !important;
                    padding-left: 16px !important;
                    font-style: italic !important;
                    font-size: 9px !important;
                }


                .pdf-monthly-installment-table .current-value {
                    background: #fef2f2 !important;
                    color: #dc2626 !important;
                    font-weight: 600 !important;
                }

                .pdf-monthly-installment-table .package-value {
                    color: #1d4ed8 !important;
                    font-weight: 600 !important;
                }


                .pdf-monthly-installment-table .current-detail {
                    background: #fef2f2 !important;
                    color: #9ca3af !important;
                }

                .pdf-monthly-installment-table .package-detail {
                    color: #6b7280 !important;
                    font-size: 11px !important;
                }



                .pdf-monthly-installment-table tbody tr:nth-child(even) {
                    background: #f8fafc !important;
                }

                .pdf-monthly-installment-table td.package-value.recommended,
                .pdf-monthly-installment-table td.package-detail.recommended {
                    background: rgba(38, 74, 130, 0.15) !important;
                    font-weight: 600 !important;
                    color: #264A82 !important;
                }

                .pdf-monthly-installment-table .package-header {
                    background: linear-gradient(135deg, #264A82 0%, #1e3a6f 100%) !important;
                    width: 25% !important;
                }

                .pdf-monthly-installment-table td:first-child {
                    text-align: left !important;
                    font-weight: 600 !important;
                    color: #374151 !important;
                    padding-left: 12px !important;
                    white-space: nowrap !important;
                }

                .pdf-monthly-installment-table td:not(:first-child) {
                    width: 25% !important;
                }

                /* Bar Chart Styles */
                .pdf-chart-section {
                    margin: 20px 0 !important;
                    page-break-inside: avoid !important;
                }

                .pdf-bar-chart {
                    display: flex !important;
                    justify-content: space-around !important;
                    align-items: flex-end !important;
                    height: 280px !important;
                    padding: 20px !important;
                    background: #f8fafc !important;
                    border-radius: 12px !important;
                    margin: 15px 0 !important;
                    border: 1px solid #e2e8f0 !important;
                }

                .pdf-bar-item {
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    position: relative !important;
                    margin: 0 10px !important;
                }

                .pdf-bar-rate {
                    font-size: 12px !important;
                    font-weight: 600 !important;
                    color: #264A82 !important;
                    margin-bottom: 8px !important;
                    text-align: center !important;
                }

                .pdf-bar-container {
                    height: 200px !important;
                    display: flex !important;
                    align-items: flex-end !important;
                    margin-bottom: 8px !important;
                }

                .pdf-bar-stack {
                    width: 80px !important;
                    display: flex !important;
                    flex-direction: column-reverse !important;
                    border-radius: 6px 6px 0 0 !important;
                    overflow: hidden !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
                }

                .pdf-bar-segment.principal {
                    background: #264A82 !important;
                    width: 100% !important;
                    min-height: 40px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    position: relative !important;
                }

                .pdf-bar-segment.interest {
                    background: #93c5fd !important;
                    width: 100% !important;
                    min-height: 30px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    position: relative !important;
                }

                .pdf-bar-label {
                    font-size: 11px !important;
                    font-weight: 600 !important;
                    color: #374151 !important;
                    text-align: center !important;
                    margin-bottom: 4px !important;
                    white-space: nowrap !important;
                }

                .pdf-bar-amount {
                    font-size: 12px !important;
                    font-weight: 500 !important;
                    color: #264A82 !important;
                    text-align: center !important;
                }

                .pdf-chart-legend {
                    display: flex !important;
                    justify-content: center !important;
                    gap: 20px !important;
                    margin-top: 15px !important;
                }

                .pdf-legend-item {
                    display: flex !important;
                    align-items: center !important;
                    gap: 6px !important;
                    font-size: 11px !important;
                    color: #374151 !important;
                }

                .pdf-legend-color {
                    width: 16px !important;
                    height: 16px !important;
                    border-radius: 3px !important;
                }

                .pdf-legend-color.principal {
                    background: #264A82 !important;
                }

                .pdf-legend-color.interest {
                    background: #93c5fd !important;
                }

                .pdf-bar-text {
                    font-size: 9px !important;
                    font-weight: 500 !important;
                    color: white !important;
                    text-align: center !important;
                    line-height: 1.2 !important;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
                    white-space: nowrap !important;
                    display: block !important;
                }

                .pdf-bar-item.current-package .pdf-bar-segment.principal {
                    background: #6b7280 !important;
                }

                .pdf-bar-item.current-package .pdf-bar-segment.interest {
                    background: #d1d5db !important;
                }

                .pdf-bar-item.current-package .pdf-bar-rate {
                    color: #6b7280 !important;
                }

                .pdf-bar-item.current-package .pdf-bar-label {
                    color: #6b7280 !important;
                }

                .pdf-bar-item.current-package .pdf-bar-amount {
                    color: #6b7280 !important;
                }

                .pdf-comparison-table {
                    width: 100% !important;
                    border-collapse: collapse !important;
                    background: white !important;
                    border-radius: 12px !important;
                    overflow: hidden !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
                    table-layout: fixed !important;
                }

                .pdf-comparison-table th {
                    padding: 10px 6px !important;
                    text-align: center !important;
                    font-weight: 600 !important;
                    font-size: 12px !important;
                    color: white !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.3px !important;
                    word-wrap: break-word !important;
                    vertical-align: middle !important;
                }

                .pdf-comparison-table th:first-child {
                    width: 25% !important;
                    text-align: left !important;
                    padding-left: 12px !important;
                }

                .pdf-comparison-table th:not(:first-child) {
                    width: 25% !important;
                }

                .pdf-comparison-table th.recommended {
                    background: #1e40af !important;
                    position: relative !important;
                }

                .pdf-comparison-table th.recommended::after {
                    content: 'RECOMMENDED' !important;
                    position: absolute !important;
                    bottom: -8px !important;
                    left: 50% !important;
                    transform: translateX(-50%) !important;
                    background: #3b82f6 !important;
                    color: white !important;
                    font-size: 6px !important;
                    padding: 2px 6px !important;
                    border-radius: 3px !important;
                    font-weight: 700 !important;
                    white-space: nowrap !important;
                    z-index: 10 !important;
                }

                .pdf-comparison-table tbody tr:nth-child(even) {
                    background: #f8fafc !important;
                }

                .pdf-comparison-table td {
                    padding: 8px 6px !important;
                    text-align: center !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                    font-size: 11px !important;
                    line-height: 1.4 !important;
                    word-wrap: break-word !important;
                    vertical-align: top !important;
                    max-width: 0 !important;
                }

                .pdf-comparison-table td:first-child {
                    text-align: left !important;
                    font-weight: 600 !important;
                    color: #374151 !important;
                    padding-left: 12px !important;
                    white-space: nowrap !important;
                }

                .pdf-comparison-table td.rate-value {
                    font-weight: 600 !important;
                    color: #1d4ed8 !important;
                }

                .pdf-comparison-table td.rate-value small {
                    display: block !important;
                    font-size: 8px !important;
                    color: #6b7280 !important;
                    font-weight: 400 !important;
                    line-height: 1.2 !important;
                    margin-top: 2px !important;
                }

                .pdf-comparison-table td.savings-cell small {
                    display: block !important;
                    font-size: 8px !important;
                    color: #6b7280 !important;
                    font-weight: 400 !important;
                    line-height: 1.2 !important;
                    margin-top: 2px !important;
                }

                .pdf-comparison-table td.amount {
                    color: #3b82f6 !important;
                    font-weight: 600 !important;
                }

                .pdf-comparison-table td.period {
                    color: #3b82f6 !important;
                    font-weight: 600 !important;
                }

                .pdf-comparison-table td.features-cell {
                    text-align: left !important;
                    vertical-align: middle !important;
                    font-size: 11px !important;
                    line-height: 1.3 !important;
                    padding: 8px 4px !important;
                    word-wrap: break-word !important;
                    overflow-wrap: break-word !important;
                    hyphens: auto !important;
                }

                .pdf-comparison-table td.remarks-cell {
                    text-align: left !important;
                    vertical-align: top !important;
                    font-size: 9px !important;
                    line-height: 1.3 !important;
                    padding: 8px 6px !important;
                    padding-left: 12px !important;
                    word-wrap: break-word !important;
                    overflow-wrap: break-word !important;
                    hyphens: auto !important;
                }

                .pdf-comparison-table td.features-cell div,
                .pdf-comparison-table td.remarks-cell div {
                    margin-bottom: 2px !important;
                    word-break: break-word !important;
                }

                .pdf-comparison-table td.amount,
                .pdf-comparison-table td.period {
                    font-size: 11px !important;
                    font-weight: 600 !important;
                }

                /* Specific improvements for better table layout */
                .pdf-comparison-table td.rate-value {
                    font-size: 11px !important;
                    line-height: 1.2 !important;
                }

                .pdf-comparison-table .savings-cell {
                    font-size: 11px !important;
                    line-height: 1.2 !important;
                    text-align: center !important;
                    vertical-align: middle !important;
                }

                /* Ensure consistent row heights */
                .pdf-comparison-table tr {
                    height: auto !important;
                    min-height: 30px !important;
                }

                /* Better spacing for package comparison section */
                .pdf-comparison-section {
                    margin-bottom: 20px !important;
                    page-break-inside: avoid !important;
                }

                /* Page break controls for better PDF layout */
                .pdf-header {
                    page-break-after: avoid !important;
                }

                .pdf-key-info {
                    page-break-inside: avoid !important;
                    page-break-after: avoid !important;
                }

                .pdf-savings-section {
                    page-break-inside: avoid !important;
                }

                .pdf-comparison-table {
                    page-break-inside: auto !important;
                }

                .pdf-comparison-table thead {
                    page-break-after: avoid !important;
                }

                .pdf-comparison-table tr {
                    page-break-inside: avoid !important;
                }

                .pdf-disclaimer {
                    page-break-inside: avoid !important;
                }

                /* Disclaimer Section */
                .pdf-disclaimer {
                    background: #f9fafb !important;
                    border: 1px solid #e5e7eb !important;
                    border-radius: 8px !important;
                    padding: 12px !important;
                    margin-top: 20px !important;
                }

                .pdf-disclaimer-title {
                    font-weight: 700 !important;
                    color: #374151 !important;
                    margin-bottom: 6px !important;
                    font-size: 12px !important;
                }

                .pdf-disclaimer-text {
                    font-size: 10px !important;
                    color: #6b7280 !important;
                    line-height: 1.5 !important;
                }
            </style>
        </head>
        <body>
            ${reportContent}
        </body>
        </html>
    `);
    printWindow.document.close();
    
    // Automatically trigger print dialog after a short delay to ensure content loads
    setTimeout(() => {
        printWindow.print();
    }, 500);
    
    // Restore original title
    document.title = originalTitle;
}