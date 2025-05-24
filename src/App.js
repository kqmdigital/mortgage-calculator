// Replace the generatePDFReport function in your App.js with this updated version:

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

    // Generate professional HTML report
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mortgage Affordability Report - KeyQuest Mortgage</title>
    <style>
        @media print {
            body { margin: 0; }
            .page-break { page-break-before: always; }
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #dc2626;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .logo-placeholder {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #dc2626, #1d4ed8);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 24px;
        }
        
        .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #1d4ed8;
            margin: 0;
        }
        
        .company-tagline {
            color: #666;
            font-size: 14px;
            margin: 5px 0 0 0;
        }
        
        .report-title {
            font-size: 24px;
            font-weight: bold;
            color: #dc2626;
            margin: 20px 0 10px 0;
        }
        
        .report-subtitle {
            color: #666;
            font-size: 16px;
            margin-bottom: 20px;
        }
        
        .section {
            margin: 25px 0;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #f9fafb;
        }
        
        .section h2 {
            color: #1d4ed8;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-bottom: 15px;
            font-size: 18px;
        }
        
        .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dotted #ccc;
        }
        
        .info-label {
            font-weight: 600;
            color: #555;
        }
        
        .info-value {
            font-weight: bold;
            color: #333;
        }
        
        .status-approved {
            background: #dcfce7;
            color: #166534;
            padding: 10px;
            border-radius: 6px;
            border-left: 4px solid #22c55e;
            font-weight: bold;
        }
        
        .status-rejected {
            background: #fef2f2;
            color: #dc2626;
            padding: 10px;
            border-radius: 6px;
            border-left: 4px solid #ef4444;
            font-weight: bold;
        }
        
        .highlight-box {
            background: #eff6ff;
            border: 1px solid #3b82f6;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
        }
        
        .installment-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin: 15px 0;
        }
        
        .installment-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px;
            text-align: center;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        
        .disclaimer {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            font-size: 11px;
            color: #555;
        }
        
        @media (max-width: 600px) {
            .two-column { grid-template-columns: 1fr; }
            .installment-grid { grid-template-columns: 1fr; }
            .logo-section { flex-direction: column; gap: 10px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-section">
            <img src="data:image/svg+xml;base64,YOUR_LOGO_BASE64" alt="KeyQuest Logo" style="width: 80px; height: 80px;">
            <div>
                <h1 class="company-name">KEYQUEST MORTGAGE</h1>
                <p class="company-tagline">Your Trusted Mortgage Advisory Partner</p>
            </div>
        </div>
        
        <div class="report-title">MORTGAGE AFFORDABILITY ASSESSMENT</div>
        <div class="report-subtitle">Professional Analysis Report</div>
        
        <div style="margin-top: 20px; font-size: 14px; color: #666;">
            <strong>Report Generated:</strong> ${currentDate} | 
            <strong>Prepared by:</strong> ${currentUser} | 
            <strong>Report ID:</strong> KQM-${Date.now()}
        </div>
    </div>

    <div class="section">
        <h2>📋 EXECUTIVE SUMMARY</h2>
        <div class="highlight-box">
            <div class="two-column">
                <div>
                    <div class="info-row">
                        <span class="info-label">Property Value:</span>
                        <span class="info-value">${formatCurrency(inputs.purchasePrice)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Loan Amount:</span>
                        <span class="info-value">${formatCurrency(results.loanAmount)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Loan-to-Value:</span>
                        <span class="info-value">${((results.loanAmount / inputs.purchasePrice) * 100).toFixed(1)}%</span>
                    </div>
                </div>
                <div>
                    <div class="info-row">
                        <span class="info-label">Monthly Income:</span>
                        <span class="info-value">${formatCurrency(results.combinedMonthlyIncome)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Monthly Installment:</span>
                        <span class="info-value">${formatCurrency(results.monthlyInstallmentStressTest)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Loan Tenure:</span>
                        <span class="info-value">${inputs.loanTenor} years</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>💰 AFFORDABILITY ANALYSIS</h2>
        
        <div style="margin: 20px 0;">
            <h3 style="color: #555; margin-bottom: 15px;">Private Property Assessment (TDSR 55%)</h3>
            <div class="${results.tdsrPass ? 'status-approved' : 'status-rejected'}">
                <strong>Status: ${results.tdsrPass ? '✅ APPROVED' : '❌ ADDITIONAL FUNDING REQUIRED'}</strong>
                <div style="margin-top: 10px; font-size: 14px;">
                    Required Income: ${formatCurrency(results.requiredIncomeTDSR)} | 
                    Available Income: ${formatCurrency(results.combinedMonthlyIncome)} | 
                    ${results.tdsrPass ? 'Surplus' : 'Deficit'}: ${formatCurrency(Math.abs(results.tdsrDeficit))}
                </div>
            </div>
        </div>

        <div style="margin: 20px 0;">
            <h3 style="color: #555; margin-bottom: 15px;">HDB Property Assessment (MSR 30%)</h3>
            <div class="${results.hdbPass ? 'status-approved' : 'status-rejected'}">
                <strong>Status: ${results.hdbPass ? '✅ APPROVED' : '❌ ADDITIONAL FUNDING REQUIRED'}</strong>
                <div style="margin-top: 10px; font-size: 14px;">
                    Required Income: ${formatCurrency(results.requiredIncomeHDB)} | 
                    Available Income: ${formatCurrency(results.combinedMonthlyIncome)} | 
                    ${results.hdbPass ? 'Surplus' : 'Deficit'}: ${formatCurrency(Math.abs(results.hdbDeficit))}
                </div>
            </div>
        </div>
    </div>

    ${(!results.tdsrPass || !results.hdbPass) ? `
    <div class="section">
        <h2>💡 FUNDING SOLUTIONS</h2>
        ${!results.tdsrPass ? `
        <div style="margin: 15px 0;">
            <h3 style="color: #dc2626;">Private Property Funding Options</h3>
            <div class="two-column">
                <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
                    <strong>Option A: Show Fund</strong><br>
                    <span style="font-size: 18px; color: #dc2626; font-weight: bold;">${formatCurrency(results.cashShowTDSR)}</span>
                </div>
                <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
                    <strong>Option B: Pledge Fund</strong><br>
                    <span style="font-size: 18px; color: #dc2626; font-weight: bold;">${formatCurrency(results.cashPledgeTDSR)}</span>
                </div>
            </div>
        </div>
        ` : ''}
        
        ${!results.hdbPass ? `
        <div style="margin: 15px 0;">
            <h3 style="color: #dc2626;">HDB Property Funding Options</h3>
            <div class="two-column">
                <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
                    <strong>Option A: Show Fund</strong><br>
                    <span style="font-size: 18px; color: #dc2626; font-weight: bold;">${formatCurrency(results.cashShowHDB)}</span>
                </div>
                <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
                    <strong>Option B: Pledge Fund</strong><br>
                    <span style="font-size: 18px; color: #dc2626; font-weight: bold;">${formatCurrency(results.cashPledgeHDB)}</span>
                </div>
            </div>
        </div>
        ` : ''}
    </div>
    ` : ''}

    <div class="section">
        <h2>📊 PAYMENT SCHEDULE OVERVIEW</h2>
        
        <div class="highlight-box">
            <h3 style="margin-top: 0; color: #dc2626;">Stress Test Rate: ${inputs.stressTestRate}%</h3>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">Monthly installment used for affordability assessment</p>
            <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${formatCurrency(results.monthlyInstallmentStressTest)}</div>
        </div>

        <h3 style="color: #555; margin: 25px 0 15px 0;">Projected Monthly Installments by Year</h3>
        <div class="installment-grid">
            <div class="installment-card">
                <div style="color: #666; font-size: 12px;">Year 1</div>
                <div style="font-weight: bold; color: #22c55e;">${formatCurrency(results.monthlyInstallmentY1)}</div>
                <div style="font-size: 11px; color: #666;">${inputs.interestRateY1}% p.a.</div>
            </div>
            <div class="installment-card">
                <div style="color: #666; font-size: 12px;">Year 2</div>
                <div style="font-weight: bold; color: #3b82f6;">${formatCurrency(results.monthlyInstallmentY2)}</div>
                <div style="font-size: 11px; color: #666;">${inputs.interestRateY2}% p.a.</div>
            </div>
            <div class="installment-card">
                <div style="color: #666; font-size: 12px;">Year 3</div>
                <div style="font-weight: bold; color: #8b5cf6;">${formatCurrency(results.monthlyInstallmentY3)}</div>
                <div style="font-size: 11px; color: #666;">${inputs.interestRateY3}% p.a.</div>
            </div>
            <div class="installment-card">
                <div style="color: #666; font-size: 12px;">Year 4</div>
                <div style="font-weight: bold; color: #f59e0b;">${formatCurrency(results.monthlyInstallmentY4)}</div>
                <div style="font-size: 11px; color: #666;">${inputs.interestRateY4}% p.a.</div>
            </div>
            <div class="installment-card">
                <div style="color: #666; font-size: 12px;">Year 5</div>
                <div style="font-weight: bold; color: #ec4899;">${formatCurrency(results.monthlyInstallmentY5)}</div>
                <div style="font-size: 11px; color: #666;">${inputs.interestRateY5}% p.a.</div>
            </div>
            <div class="installment-card">
                <div style="color: #666; font-size: 12px;">Thereafter</div>
                <div style="font-weight: bold; color: #6366f1;">${formatCurrency(results.monthlyInstallmentThereafter)}</div>
                <div style="font-size: 11px; color: #666;">${inputs.interestRateThereafter}% p.a.</div>
            </div>
        </div>

        <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #3b82f6; margin-top: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #3b82f6;">Total Interest (First ${inputs.interestPeriodSelection} Years)</h4>
            <div style="font-size: 20px; font-weight: bold; color: #3b82f6;">${formatCurrency(results.selectedPeriodTotal || 0)}</div>
        </div>
    </div>

    <div class="section page-break">
        <h2>👥 APPLICANT INFORMATION</h2>
        
        <div class="two-column">
            <div>
                <h3 style="color: #555;">Primary Applicant</h3>
                <div class="info-row">
                    <span class="info-label">Monthly Salary:</span>
                    <span class="info-value">${formatCurrency(inputs.monthlySalaryA)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Annual Salary:</span>
                    <span class="info-value">${formatCurrency(inputs.annualSalaryA)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Age:</span>
                    <span class="info-value">${inputs.applicantAgeA} years</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total Monthly Income:</span>
                    <span class="info-value">${formatCurrency(results.totalMonthlyIncomeA)}</span>
                </div>
            </div>
            
            ${inputs.monthlySalaryB > 0 ? `
            <div>
                <h3 style="color: #555;">Co-Applicant</h3>
                <div class="info-row">
                    <span class="info-label">Monthly Salary:</span>
                    <span class="info-value">${formatCurrency(inputs.monthlySalaryB)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Annual Salary:</span>
                    <span class="info-value">${formatCurrency(inputs.annualSalaryB)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Age:</span>
                    <span class="info-value">${inputs.applicantAgeB || 'N/A'} years</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total Monthly Income:</span>
                    <span class="info-value">${formatCurrency(results.totalMonthlyIncomeB)}</span>
                </div>
            </div>
            ` : '<div><p style="color: #666; font-style: italic;">Single applicant application</p></div>'}
        </div>
        
        <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; margin-top: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #0369a1;">Combined Household Income</h4>
            <div style="font-size: 24px; font-weight: bold; color: #0369a1;">${formatCurrency(results.combinedMonthlyIncome)}</div>
        </div>
        
        ${(inputs.showFundAmount > 0 || inputs.pledgeAmount > 0) ? `
        <div style="margin-top: 20px;">
            <h4 style="color: #555;">Additional Funding Applied</h4>
            ${inputs.showFundAmount > 0 ? `<div class="info-row"><span class="info-label">Show Fund:</span><span class="info-value">${formatCurrency(inputs.showFundAmount)}</span></div>` : ''}
            ${inputs.pledgeAmount > 0 ? `<div class="info-row"><span class="info-label">Pledge Amount:</span><span class="info-value">${formatCurrency(inputs.pledgeAmount)}</span></div>` : ''}
        </div>
        ` : ''}
        
        ${(results.totalCommitments > 0) ? `
        <div style="margin-top: 20px;">
            <h4 style="color: #555;">Existing Monthly Commitments</h4>
            <div style="font-size: 18px; font-weight: bold; color: #dc2626;">${formatCurrency(results.totalCommitments)}</div>
        </div>
        ` : ''}
    </div>

    <div class="disclaimer">
        <h4 style="margin: 0 0 10px 0; color: #333;">Important Disclaimer</h4>
        <p style="margin: 5px 0;">• This assessment is for preliminary evaluation purposes only and does not constitute a loan approval or commitment.</p>
        <p style="margin: 5px 0;">• Actual loan terms, interest rates, and approval are subject to the lender's credit assessment, current market conditions, and regulatory requirements.</p>
        <p style="margin: 5px 0;">• Additional costs such as legal fees, valuation fees, and insurance premiums are not included in this assessment.</p>
        <p style="margin: 5px 0;">• We recommend consulting with our mortgage specialists for a detailed analysis tailored to your specific circumstances.</p>
        <p style="margin: 5px 0;">• Interest rates and payment projections are estimates based on current market conditions and may vary.</p>
    </div>

    <div class="footer">
        <div style="margin-bottom: 15px;">
            <strong style="color: #1d4ed8; font-size: 16px;">KEYQUEST MORTGAGE</strong><br>
            Your Trusted Mortgage Advisory Partner
        </div>
        
        <div style="margin-bottom: 10px;">
            <strong>Contact Information:</strong><br>
            📧 Email: kenneth@keyquestmortgage.sg | 📞 Phone: +65 9795 2338<br>
            🌐 Website: https://keyquestmortgage.com.sg
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 15px;">
            <p style="margin: 0; font-size: 10px;">This report is confidential and intended solely for the named applicant(s). 
            KeyQuest Mortgage is committed to providing professional mortgage advisory services in Singapore.</p>
        </div>
    </div>
</body>
</html>
    `;

    // Create a new window with the HTML content
    const newWindow = window.open('', '_blank');
    newWindow.document.write(htmlContent);
    newWindow.document.close();
    
    // Add a small delay to ensure content is loaded, then trigger print
    setTimeout(() => {
      newWindow.focus();
      newWindow.print();
    }, 500);

    alert('Professional report generated! Use your browser\'s print dialog to save as PDF or print the document.');

  } catch (error) {
    console.error('Error generating report:', error);
    alert('There was an error generating the report. Please try again.');
  }
};
