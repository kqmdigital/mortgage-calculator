import logger from './logger';

// Helper function to get property type display text
const getPropertyTypeText = (type) => {
  switch (type) {
    case 'private': return 'Private Property';
    case 'hdb': return 'HDB Property';
    case 'ec': return 'EC Property';
    case 'commercial': return 'Commercial/Industrial Property';
    default: return 'Property';
  }
};

export const generatePDFReport = (inputs, results) => {
  if (!results) {
    alert('Please calculate the mortgage first before generating a report.');
    return;
  }

  try {
    const propertyTypeText = getPropertyTypeText(inputs.propertyType);
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
    <title>TDSR/MSR Analysis Report - ${propertyTypeText}</title>
    <style>
        @page {
            size: A4;
            margin: 0.5in;
        }
        
        @media print {
            * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            
            body { 
                margin: 0; 
                padding: 0;
                font-size: 11px;
                line-height: 1.3;
            }
            
            .page-break { 
                page-break-before: always; 
            }
            
            .no-break { 
                page-break-inside: avoid; 
                break-inside: avoid;
            }
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.4;
            color: #2d3748;
            background-color: white;
            margin: 0;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #264A82;
        }
        
        .header h1 {
            margin: 0 0 10px 0;
            color: #264A82;
            font-size: 28px;
            font-weight: 700;
        }
        
        .header .subtitle {
            color: #6B7280;
            font-size: 16px;
            margin: 5px 0;
            font-weight: 500;
        }
        
        .header .date {
            color: #9CA3AF;
            font-size: 14px;
            margin: 10px 0 0 0;
        }
        
        .section {
            margin-bottom: 25px;
            background: #F9FAFB;
            border-radius: 8px;
            padding: 20px;
            border-left: 4px solid #264A82;
            break-inside: avoid;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #264A82;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #E5E7EB;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 10px;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            background: white;
            border-radius: 6px;
            border: 1px solid #E5E7EB;
        }
        
        .info-label {
            font-weight: 500;
            color: #6B7280;
            font-size: 13px;
        }
        
        .info-value {
            font-weight: 600;
            color: #111827;
            font-size: 13px;
        }
        
        .result-highlight {
            background: #EEF2FF;
            border: 2px solid #264A82;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        
        .result-highlight h3 {
            color: #264A82;
            margin: 0 0 15px 0;
            font-size: 20px;
        }
        
        .status-pass { color: #059669; }
        .status-fail { color: #DC2626; }
        .status-warning { color: #D97706; }
        
        .large-number {
            font-size: 28px;
            font-weight: 700;
            margin: 10px 0;
        }
        
        .disclaimer {
            background: #FFFBEB;
            border: 1px solid #F59E0B;
            border-radius: 6px;
            padding: 15px;
            margin: 30px 0;
            font-size: 11px;
            color: #92400E;
        }
        
        .disclaimer h4 {
            margin-top: 0;
            color: #B45309;
            font-size: 14px;
        }
        
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #E5E7EB;
            text-align: center;
            font-size: 10px;
            color: #9CA3AF;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            background: white;
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid #E5E7EB;
        }
        
        .table th {
            background: #F3F4F6;
            color: #374151;
            font-weight: 600;
            padding: 12px;
            text-align: left;
            font-size: 12px;
            border-bottom: 1px solid #E5E7EB;
        }
        
        .table td {
            padding: 10px 12px;
            border-bottom: 1px solid #F9FAFB;
            font-size: 12px;
            color: #6B7280;
        }
        
        .table tr:last-child td {
            border-bottom: none;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>TDSR/MSR Analysis Report</h1>
        <div class="subtitle">${propertyTypeText} - Financial Assessment</div>
        <div class="date">Generated on ${currentDate}</div>
    </div>

    <div class="section">
        <div class="section-title">🏠 Property Summary</div>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Property Type:</span>
                <span class="info-value">${propertyTypeText}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Purchase Price:</span>
                <span class="info-value">$${(results.purchasePrice || 0).toLocaleString()}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Loan Amount:</span>
                <span class="info-value">$${(results.loanAmount || 0).toLocaleString()}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Loan Percentage:</span>
                <span class="info-value">${((results.loanAmount / results.purchasePrice) * 100).toFixed(1)}%</span>
            </div>
            <div class="info-item">
                <span class="info-label">Loan Tenor:</span>
                <span class="info-value">${inputs.loanTenor || 0} years</span>
            </div>
            <div class="info-item">
                <span class="info-label">Stress Test Rate:</span>
                <span class="info-value">${inputs.stressTestRate || 0}%</span>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">💰 Monthly Payment Analysis</div>
        <div class="result-highlight">
            <h3>Monthly Installment</h3>
            <div class="large-number">$${(results.monthlyInstallment || 0).toLocaleString()}</div>
            <div>Based on ${inputs.stressTestRate || 0}% stress test rate</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">📊 Income & Debt Analysis</div>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Combined Monthly Income:</span>
                <span class="info-value">$${(results.combinedMonthlyIncome || 0).toLocaleString()}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Total Monthly Commitments:</span>
                <span class="info-value">$${(results.totalCommitmentsTDSR || 0).toLocaleString()}</span>
            </div>
            ${results.averageAge > 0 ? `
            <div class="info-item">
                <span class="info-label">Income Weighted Average Age:</span>
                <span class="info-value">${results.averageAge.toFixed(1)} years</span>
            </div>
            <div class="info-item">
                <span class="info-label">Maximum Loan Tenor:</span>
                <span class="info-value">${results.maxLoanTenor || 0} years</span>
            </div>
            ` : ''}
        </div>
    </div>

    <div class="section">
        <div class="section-title">🎯 TDSR Assessment</div>
        <div class="result-highlight">
            <h3>Total Debt Service Ratio</h3>
            <div class="large-number ${results.actualTDSRPercentage > (inputs.propertyType === 'private' ? 55 : 60) ? 'status-fail' : 'status-pass'}">
                ${(results.actualTDSRPercentage || 0).toFixed(2)}%
            </div>
            <div>Limit: ${inputs.propertyType === 'private' ? '55%' : '60%'} | Status: 
                <span class="${results.actualTDSRPercentage > (inputs.propertyType === 'private' ? 55 : 60) ? 'status-fail' : 'status-pass'}">
                    ${results.actualTDSRPercentage > (inputs.propertyType === 'private' ? 55 : 60) ? 'EXCEEDED' : 'WITHIN LIMIT'}
                </span>
            </div>
        </div>
    </div>

    ${(inputs.propertyType === 'hdb' || inputs.propertyType === 'ec') ? `
    <div class="section">
        <div class="section-title">🏘️ MSR Assessment</div>
        <div class="result-highlight">
            <h3>Mortgage Servicing Ratio</h3>
            <div class="large-number ${results.actualMSRPercentage > 30 ? 'status-fail' : 'status-pass'}">
                ${(results.actualMSRPercentage || 0).toFixed(2)}%
            </div>
            <div>Limit: 30% | Status: 
                <span class="${results.actualMSRPercentage > 30 ? 'status-fail' : 'status-pass'}">
                    ${results.actualMSRPercentage > 30 ? 'EXCEEDED' : 'WITHIN LIMIT'}
                </span>
            </div>
        </div>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">💳 Financial Requirements</div>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Cash Required:</span>
                <span class="info-value status-fail">$${(results.downPayment?.cashRequired || 0).toLocaleString()}</span>
            </div>
            <div class="info-item">
                <span class="info-label">CPF Allowed:</span>
                <span class="info-value">${inputs.propertyType === 'commercial' ? 'Not Allowed' : '$' + (results.downPayment?.cpfAllowed || 0).toLocaleString()}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Total Downpayment:</span>
                <span class="info-value">$${(results.downPayment?.totalDownPayment || 0).toLocaleString()}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Stamp Duty:</span>
                <span class="info-value">$${(results.stampDuty || 0).toLocaleString()}</span>
            </div>
        </div>
    </div>

    ${results.actualTDSRPercentage > (inputs.propertyType === 'private' ? 55 : 60) || (results.actualMSRPercentage && results.actualMSRPercentage > 30) ? `
    <div class="section">
        <div class="section-title">⚠️ Assessment Summary</div>
        <div style="background: #FEE2E2; border: 2px solid #F87171; border-radius: 8px; padding: 15px;">
            <h3 style="color: #DC2626; margin-top: 0;">Loan May Not Be Approved</h3>
            <ul style="margin: 10px 0; padding-left: 20px; color: #991B1B;">
                ${results.actualTDSRPercentage > (inputs.propertyType === 'private' ? 55 : 60) ? `<li>TDSR of ${(results.actualTDSRPercentage || 0).toFixed(2)}% exceeds the ${inputs.propertyType === 'private' ? '55%' : '60%'} limit</li>` : ''}
                ${results.actualMSRPercentage && results.actualMSRPercentage > 30 ? `<li>MSR of ${(results.actualMSRPercentage || 0).toFixed(2)}% exceeds the 30% limit</li>` : ''}
            </ul>
            <p style="margin: 15px 0 0 0; font-weight: 600; color: #991B1B;">Recommendations:</p>
            <ul style="margin: 5px 0; padding-left: 20px; font-size: 11px; color: #991B1B;">
                <li>Consider reducing the loan amount or property price</li>
                <li>Extend the loan tenure if age permits</li>
                <li>Reduce existing debt obligations</li>
                <li>Consider increasing household income</li>
                <li>Consult with mortgage specialists for alternatives</li>
            </ul>
        </div>
    </div>
    ` : `
    <div class="section">
        <div class="section-title">✅ Assessment Summary</div>
        <div style="background: #ECFDF5; border: 2px solid #34D399; border-radius: 8px; padding: 15px;">
            <h3 style="color: #059669; margin-top: 0;">Loan Appears Feasible</h3>
            <p style="margin: 10px 0 0 0; color: #047857;">Based on the current financial profile, the loan application appears to meet the regulatory requirements.</p>
        </div>
    </div>
    `}

    <div class="disclaimer">
        <h4>⚠️ Important Disclaimer</h4>
        <p><strong>This analysis is for reference purposes only</strong> and should not be considered as financial advice or a guarantee of loan approval.</p>
        <p style="margin-top: 8px;">Actual loan terms, interest rates, and approval decisions may vary significantly based on:</p>
        <ul style="margin: 8px 0; padding-left: 20px;">
            <li>Individual credit history and financial circumstances</li>
            <li>Bank-specific policies and risk assessment criteria</li>
            <li>Current market conditions and regulatory changes</li>
            <li>Property valuation and additional documentation requirements</li>
        </ul>
        <p style="margin-top: 8px;"><strong>Always consult with qualified mortgage specialists and financial advisors</strong> for personalized guidance and accurate assessment of your loan application prospects.</p>
    </div>

    <div class="footer">
        <p><strong>KeyQuest Mortgage Calculator</strong></p>
        <p>Report generated on ${currentDate} | For Reference Only</p>
        <p>📧 kenneth@keyquestmortgage.com.sg | 📞 +65 9795 2338</p>
    </div>
</body>
</html>
`;

    // Create a new window for the PDF
    const newWindow = window.open('', '_blank');
    newWindow.document.write(htmlContent);
    newWindow.document.close();
    
    // Add instructions for the user
    setTimeout(() => {
      newWindow.focus();
      alert(`📄 Report generated successfully!

To save as PDF:
• Press Ctrl+P (or Cmd+P on Mac)
• Choose "Save as PDF" as the destination
• Select "More settings" for layout options
• Use "A4" paper size
• Select "Portrait" orientation

This ensures all content fits properly without being cut off.`);
    }, 1000);

    logger.info('PDF report generated successfully', {
      propertyType: inputs.propertyType,
      loanAmount: results.loanAmount
    });

  } catch (error) {
    logger.error('Error generating report:', error);
    alert('There was an error generating the report. Please try again.');
  }
};