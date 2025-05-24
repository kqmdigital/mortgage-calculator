// Replace your generatePDFReport function with this improved version:

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
    <title>Mortgage Analysis Report - KeyQuest Mortgage</title>
    <style>
        @media print {
            body { margin: 0; padding: 15px; }
            .page-break { page-break-before: always; }
            .no-break { page-break-inside: avoid; }
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.5;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #1d4ed8;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .logo-placeholder {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #dc2626, #1d4ed8);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 20px;
        }
        
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1d4ed8;
            margin: 0;
        }
        
        .company-tagline {
            color: #666;
            font-size: 12px;
            margin: 5px 0 0 0;
        }
        
        .report-info {
            margin-top: 15px;
            font-size: 12px;
            color: #666;
        }
        
        .section {
            margin: 30px 0;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #fafafa;
            page-break-inside: avoid;
        }
        
        .section h2 {
            color: #1d4ed8;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 8px;
            margin-bottom: 15px;
            font-size: 16px;
        }
        
        .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
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
        
        .highlight-box {
            background: #eff6ff;
            border: 1px solid #3b82f6;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
        }
        
        .installment-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin: 15px 0;
        }
        
        .installment-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px;
            text-align: center;
        }
        
        .funding-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 15px 0;
        }
        
        .funding-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 15px;
            text-align: center;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 11px;
            page-break-inside: avoid;
        }
        
        .disclaimer {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            font-size: 10px;
            color: #555;
            page-break-inside: avoid;
        }
        
        @media (max-width: 600px) {
            .two-column, .installment-grid, .funding-grid { 
                grid-template-columns: 1fr; 
            }
            .logo-section { 
                flex-direction: column; 
                gap: 8px; 
            }
        }
    </style>
</head>
<body>
    <div class="header no-break">
        <div class="logo-section">
            <div class="logo-placeholder">KQ</div>
            <div>
                <h1 class="company-name">KEYQUEST MORTGAGE</h1>
                <p class="company-tagline">Your Trusted Mortgage Advisory Partner</p>
            </div>
        </div>
        
        <div class="report-info">
            <strong>Mortgage Analysis Report</strong><br>
            Generated: ${currentDate} | Prepared by: ${currentUser} | Report ID: KQM-${Date.now()}
        </div>
    </div>

    <div class="section no-break">
        <h2>📋 LOAN SUMMARY</h2>
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
                        <span class="info-label">Combined Income:</span>
                        <span class="info-value">${formatCurrency(results.combinedMonthlyIncome)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Loan Tenure:</span>
                        <span class="info-value">${inputs.loanTenor} years</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Loan Source:</span>
                        <span class="info-value">${loanAmountSource}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    ${(!results.tdsrPass || !results.hdbPass) ? `
    <div class="section no-break">
        <h2>💡 FUNDING SOLUTIONS</h2>
        
        ${!results.tdsrPass ? `
        <div style="margin: 15px 0;">
            <h3 style="color: #dc2626; margin-bottom: 10px;">Private Property Options</h3>
            <div class="funding-grid">
                <div class="funding-card">
                    <strong>Show Fund Option</strong><br>
                    <span style="font-size: 16px; color: #dc2626; font-weight: bold;">${formatCurrency(results.cashShowTDSR)}</span>
                </div>
                <div class="funding-card">
                    <strong>Pledge Option</strong><br>
                    <span style="font-size: 16px; color: #dc2626; font-weight: bold;">${formatCurrency(results.cashPledgeTDSR)}</span>
                </div>
            </div>
        </div>
        ` : ''}
        
        ${!results.hdbPass ? `
        <div style="margin: 15px 0;">
            <h3 style="color: #dc2626; margin-bottom: 10px;">HDB Property Options</h3>
            <div class="funding-grid">
                <div class="funding-card">
                    <strong>Show Fund Option</strong><br>
                    <span style="font-size: 16px; color: #dc2626; font-weight: bold;">${formatCurrency(results.cashShowHDB)}</span>
                </div>
                <div class="funding-card">
                    <strong>Pledge Option</strong><br>
                    <span style="font-size: 16px; color: #dc2626; font-weight: bold;">${formatCurrency(results.cashPledgeHDB)}</span>
                </div>
            </div>
        </div>
        ` : ''}
        
        <p style="font-size: 12px; color: #666; text-align: center; margin-top: 15px;">
            <em>Choose either Show Fund OR Pledge option, not both</em>
        </p>
    </div>
    ` : ''}

    <div class="section no-break">
        <h2>📊 MONTHLY PAYMENT SCHEDULE</h2>
        
        <h3 style="color: #555; margin: 20px 0 15px 0;">Projected Monthly Installments by Year</h3>
        <div class="installment-grid">
            <div class="installment-card">
                <div style="color: #666; font-size: 11px;">Year 1</div>
                <div style="font-weight: bold; color: #22c55e; font-size: 14px;">${formatCurrency(results.monthlyInstallmentY1)}</div>
                <div style="font-size: 10px; color: #666;">${inputs.interestRateY1}% p.a.</div>
            </div>
            <div class="installment-card">
                <div style="color: #666; font-size: 11px;">Year 2</div>
                <div style="font-weight: bold; color: #3b82f6; font-size: 14px;">${formatCurrency(results.monthlyInstallmentY2)}</div>
                <div style="font-size: 10px; color: #666;">${inputs.interestRateY2}% p.a.</div>
            </div>
            <div class="installment-card">
                <div style="color: #666; font-size: 11px;">Year 3</div>
                <div style="font-weight: bold; color: #8b5cf6; font-size: 14px;">${formatCurrency(results.monthlyInstallmentY3)}</div>
                <div style="font-size: 10px; color: #666;">${inputs.interestRateY3}% p.a.</div>
            </div>
            <div class="installment-card">
                <div style="color: #666; font-size: 11px;">Year 4</div>
                <div style="font-weight: bold; color: #f59e0b; font-size: 14px;">${formatCurrency(results.monthlyInstallmentY4)}</div>
                <div style="font-size: 10px; color: #666;">${inputs.interestRateY4}% p.a.</div>
            </div>
            <div class="installment-card">
                <div style="color: #666; font-size: 11px;">Year 5</div>
                <div style="font-weight: bold; color: #ec4899; font-size: 14px;">${formatCurrency(results.monthlyInstallmentY5)}</div>
                <div style="font-size: 10px; color: #666;">${inputs.interestRateY5}% p.a.</div>
            </div>
            <div class="installment-card">
                <div style="color: #666; font-size: 11px;">Year 6+</div>
                <div style="font-weight: bold; color: #6366f1; font-size: 14px;">${formatCurrency(results.monthlyInstallmentThereafter)}</div>
                <div style="font-size: 10px; color: #666;">${inputs.interestRateThereafter}% p.a.</div>
            </div>
        </div>

        <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #3b82f6; margin-top: 15px; text-align: center;">
            <h4 style="margin: 0 0 8px 0; color: #3b82f6; font-size: 14px;">Total Interest (First ${inputs.interestPeriodSelection} Years)</h4>
            <div style="font-size: 18px; font-weight: bold; color: #3b82f6;">${formatCurrency(results.selectedPeriodTotal || 0)}</div>
        </div>
    </div>

    <div class="section page-break">
        <h2>👥 APPLICANT DETAILS</h2>
        
        <div class="two-column">
            <div>
                <h3 style="color: #555; font-size: 14px;">Primary Applicant</h3>
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
                    <span class="info-label">Total Income:</span>
                    <span class="info-value">${formatCurrency(results.totalMonthlyIncomeA)}</span>
                </div>
            </div>
            
            ${inputs.monthlySalaryB > 0 ? `
            <div>
                <h3 style="color: #555; font-size: 14px;">Co-Applicant</h3>
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
                    <span class="info-label">Total Income:</span>
                    <span class="info-value">${formatCurrency(results.totalMonthlyIncomeB)}</span>
                </div>
            </div>
            ` : '<div><p style="color: #666; font-style: italic; font-size: 12px;">Single applicant application</p></div>'}
        </div>
        
        <div style="background: #f0f9ff; padding: 12px; border-radius: 6px; margin-top: 15px; text-align: center;">
            <h4 style="margin: 0 0 8px 0; color: #0369a1; font-size: 14px;">Combined Household Income</h4>
            <div style="font-size: 20px; font-weight: bold; color: #0369a1;">${formatCurrency(results.combinedMonthlyIncome)}</div>
        </div>
        
        ${(inputs.showFundAmount > 0 || inputs.pledgeAmount > 0) ? `
        <div style="margin-top: 15px;">
            <h4 style="color: #555; font-size: 14px;">Additional Funding</h4>
            ${inputs.showFundAmount > 0 ? `<div class="info-row"><span class="info-label">Show Fund:</span><span class="info-value">${formatCurrency(inputs.showFundAmount)}</span></div>` : ''}
            ${inputs.pledgeAmount > 0 ? `<div class="info-row"><span class="info-label">Pledge Amount:</span><span class="info-value">${formatCurrency(inputs.pledgeAmount)}</span></div>` : ''}
        </div>
        ` : ''}
        
        ${(results.totalCommitments > 0) ? `
        <div style="margin-top: 15px;">
            <h4 style="color: #555; font-size: 14px;">Monthly Commitments</h4>
            <div style="font-size: 16px; font-weight: bold; color: #dc2626;">${formatCurrency(results.totalCommitments)}</div>
        </div>
        ` : ''}
    </div>

    <div class="disclaimer no-break">
        <h4 style="margin: 0 0 8px 0; color: #333; font-size: 12px;">Important Notes</h4>
        <p style="margin: 4px 0;">• This analysis is for preliminary evaluation and does not constitute loan approval.</p>
        <p style="margin: 4px 0;">• Actual terms are subject to lender assessment and market conditions.</p>
        <p style="margin: 4px 0;">• Additional fees (legal, valuation, insurance) are not included.</p>
        <p style="margin: 4px 0;">• Consult our specialists for detailed analysis tailored to your situation.</p>
        <p style="margin: 4px 0;">• Interest rates are estimates and may vary.</p>
    </div>

    <div class="footer no-break">
        <div style="margin-bottom: 10px;">
            <strong style="color: #1d4ed8; font-size: 14px;">KEYQUEST MORTGAGE</strong><br>
            Your Trusted Mortgage Advisory Partner
        </div>
        
        <div style="margin-bottom: 8px;">
            📧 info@keyquestmortgage.sg | 📞 +65 XXXX XXXX | 🌐 www.keyquestmortgage.sg
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 10px;">
            <p style="margin: 0; font-size: 9px;">This report is confidential and intended for the named applicant(s). 
            KeyQuest Mortgage provides professional mortgage advisory services in Singapore.</p>
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

    alert('Clean professional report generated! Use your browser\'s print dialog to save as PDF.');

  } catch (error) {
    console.error('Error generating report:', error);
    alert('There was an error generating the report. Please try again.');
  }
};
