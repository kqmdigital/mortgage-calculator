// PDF Report Template for TDSR/MSR Analysis

export const generatePDFTemplate = (inputs, results, propertyTypeText) => {
  const currentDate = new Date().toLocaleDateString('en-SG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
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
            border-bottom: 3px solid #4299e1;
        }
        
        .header h1 {
            margin: 0;
            color: #2b6cb0;
            font-size: 24px;
            font-weight: 700;
        }
        
        .header p {
            margin: 5px 0 0 0;
            color: #4a5568;
            font-size: 14px;
        }
        
        .section {
            margin-bottom: 25px;
            background: #f7fafc;
            border-radius: 8px;
            padding: 20px;
            border-left: 4px solid #4299e1;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #2b6cb0;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }
        
        .info-label {
            font-weight: 500;
            color: #4a5568;
            font-size: 12px;
        }
        
        .info-value {
            font-weight: 600;
            color: #2d3748;
            font-size: 12px;
        }
        
        .result-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            margin-bottom: 8px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }
        
        .result-label {
            font-weight: 500;
            color: #4a5568;
            font-size: 13px;
        }
        
        .result-value {
            font-weight: 700;
            font-size: 13px;
        }
        
        .status-pass { color: #48bb78; }
        .status-fail { color: #f56565; }
        .status-warning { color: #ed8936; }
        
        .highlight-box {
            background: #bee3f8;
            border: 2px solid #4299e1;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
        }
        
        .key-findings {
            background: #fed7d7;
            border: 2px solid #fc8181;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
        }
        
        .key-findings h3 {
            color: #c53030;
            margin-top: 0;
            font-size: 14px;
        }
        
        .breakdown-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            background: white;
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }
        
        .breakdown-table th {
            background: #edf2f7;
            color: #2d3748;
            font-weight: 600;
            padding: 10px 12px;
            text-align: left;
            font-size: 12px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .breakdown-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #f7fafc;
            font-size: 11px;
            color: #4a5568;
        }
        
        .breakdown-table tr:last-child td {
            border-bottom: none;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            font-size: 10px;
            color: #718096;
        }
        
        .disclaimer {
            background: #fffbeb;
            border: 1px solid #f6e05e;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 11px;
            color: #744210;
        }
        
        .disclaimer h4 {
            margin-top: 0;
            color: #b7791f;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>TDSR/MSR Analysis Report</h1>
        <p>Property Type: ${propertyTypeText}</p>
        <p>Report Generated: ${currentDate}</p>
    </div>

    <div class="section no-break">
        <div class="section-title">Property Information</div>
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
                <span class="info-value">${(results.loanPercentage || 0).toFixed(1)}%</span>
            </div>
            <div class="info-item">
                <span class="info-label">Loan Tenor:</span>
                <span class="info-value">${results.loanTenor || 0} years</span>
            </div>
            <div class="info-item">
                <span class="info-label">Stress Test Rate:</span>
                <span class="info-value">${(results.stressTestRate || 0).toFixed(1)}%</span>
            </div>
        </div>
    </div>

    <div class="section no-break">
        <div class="section-title">Applicant Information</div>
        <div class="info-grid">
            ${results.applicantAgeA > 0 ? `
            <div class="info-item">
                <span class="info-label">Applicant A Age:</span>
                <span class="info-value">${results.applicantAgeA} years</span>
            </div>
            <div class="info-item">
                <span class="info-label">Applicant A Monthly Salary:</span>
                <span class="info-value">$${(results.monthlySalaryA || 0).toLocaleString()}</span>
            </div>
            ` : ''}
            ${results.applicantAgeB > 0 ? `
            <div class="info-item">
                <span class="info-label">Applicant B Age:</span>
                <span class="info-value">${results.applicantAgeB} years</span>
            </div>
            <div class="info-item">
                <span class="info-label">Applicant B Monthly Salary:</span>
                <span class="info-value">$${(results.monthlySalaryB || 0).toLocaleString()}</span>
            </div>
            ` : ''}
            <div class="info-item">
                <span class="info-label">Total Monthly Income:</span>
                <span class="info-value">$${(results.totalMonthlyIncome || 0).toLocaleString()}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Average Age:</span>
                <span class="info-value">${results.averageAge ? results.averageAge.toFixed(1) : '0'} years</span>
            </div>
        </div>
    </div>

    <div class="section no-break">
        <div class="section-title">Financial Obligations</div>
        <table class="breakdown-table">
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Applicant A</th>
                    <th>Applicant B</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Car Loan</td>
                    <td>$${(results.carLoanA || 0).toLocaleString()}</td>
                    <td>$${(results.carLoanB || 0).toLocaleString()}</td>
                    <td>$${((results.carLoanA || 0) + (results.carLoanB || 0)).toLocaleString()}</td>
                </tr>
                <tr>
                    <td>Personal Loan</td>
                    <td>$${(results.personalLoanA || 0).toLocaleString()}</td>
                    <td>$${(results.personalLoanB || 0).toLocaleString()}</td>
                    <td>$${((results.personalLoanA || 0) + (results.personalLoanB || 0)).toLocaleString()}</td>
                </tr>
                <tr>
                    <td>Property Loan</td>
                    <td>$${(results.propertyLoanA || 0).toLocaleString()}</td>
                    <td>$${(results.propertyLoanB || 0).toLocaleString()}</td>
                    <td>$${((results.propertyLoanA || 0) + (results.propertyLoanB || 0)).toLocaleString()}</td>
                </tr>
                <tr style="background-color: #edf2f7; font-weight: 600;">
                    <td>Total Obligations</td>
                    <td>$${((results.carLoanA || 0) + (results.personalLoanA || 0) + (results.propertyLoanA || 0)).toLocaleString()}</td>
                    <td>$${((results.carLoanB || 0) + (results.personalLoanB || 0) + (results.propertyLoanB || 0)).toLocaleString()}</td>
                    <td>$${(results.totalDebtObligations || 0).toLocaleString()}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="page-break"></div>

    <div class="section no-break">
        <div class="section-title">TDSR/MSR Analysis Results</div>
        
        <div class="highlight-box">
            <div class="result-item">
                <span class="result-label">Monthly Installment (Stress Test Rate):</span>
                <span class="result-value">$${(results.monthlyInstallment || 0).toLocaleString()}</span>
            </div>
        </div>
        
        <div class="result-item">
            <span class="result-label">Total Debt Service Ratio (TDSR):</span>
            <span class="result-value ${results.tdsrStatus === 'Pass' ? 'status-pass' : results.tdsrStatus === 'Fail' ? 'status-fail' : 'status-warning'}">${(results.tdsr || 0).toFixed(2)}%</span>
        </div>
        
        <div class="result-item">
            <span class="result-label">TDSR Status:</span>
            <span class="result-value ${results.tdsrStatus === 'Pass' ? 'status-pass' : results.tdsrStatus === 'Fail' ? 'status-fail' : 'status-warning'}">${results.tdsrStatus || 'Unknown'}</span>
        </div>
        
        ${results.msrApplicable ? `
        <div class="result-item">
            <span class="result-label">Mortgage Servicing Ratio (MSR):</span>
            <span class="result-value ${results.msrStatus === 'Pass' ? 'status-pass' : results.msrStatus === 'Fail' ? 'status-fail' : 'status-warning'}">${(results.msr || 0).toFixed(2)}%</span>
        </div>
        
        <div class="result-item">
            <span class="result-label">MSR Status:</span>
            <span class="result-value ${results.msrStatus === 'Pass' ? 'status-pass' : results.msrStatus === 'Fail' ? 'status-fail' : 'status-warning'}">${results.msrStatus || 'Unknown'}</span>
        </div>
        ` : `
        <div class="result-item">
            <span class="result-label">MSR Requirement:</span>
            <span class="result-value">Not Applicable for ${propertyTypeText}</span>
        </div>
        `}
        
        <div class="result-item">
            <span class="result-label">Overall Status:</span>
            <span class="result-value ${results.overallStatus === 'APPROVED' ? 'status-pass' : results.overallStatus === 'REJECTED' ? 'status-fail' : 'status-warning'}">${results.overallStatus || 'Unknown'}</span>
        </div>
    </div>

    <div class="section no-break">
        <div class="section-title">Financial Requirements</div>
        <div class="info-grid">
            ${results.showFundAmount > 0 ? `
            <div class="info-item">
                <span class="info-label">Show Fund Required:</span>
                <span class="info-value">$${(results.showFundAmount || 0).toLocaleString()}</span>
            </div>
            ` : ''}
            ${results.pledgeAmount > 0 ? `
            <div class="info-item">
                <span class="info-label">Pledge Amount:</span>
                <span class="info-value">$${(results.pledgeAmount || 0).toLocaleString()}</span>
            </div>
            ` : ''}
            <div class="info-item">
                <span class="info-label">Down Payment:</span>
                <span class="info-value">$${((results.purchasePrice || 0) - (results.loanAmount || 0)).toLocaleString()}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Down Payment %:</span>
                <span class="info-value">${(100 - (results.loanPercentage || 0)).toFixed(1)}%</span>
            </div>
        </div>
    </div>

    ${results.overallStatus === 'REJECTED' || results.tdsrStatus === 'Fail' || results.msrStatus === 'Fail' ? `
    <div class="key-findings">
        <h3>⚠️ Key Findings</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
            ${results.tdsrStatus === 'Fail' ? `<li>TDSR of ${(results.tdsr || 0).toFixed(2)}% exceeds the ${inputs.propertyType === 'private' ? '55%' : '60%'} limit</li>` : ''}
            ${results.msrStatus === 'Fail' ? `<li>MSR of ${(results.msr || 0).toFixed(2)}% exceeds the 30% limit</li>` : ''}
            ${results.overallStatus === 'REJECTED' ? `<li>Loan application may be rejected based on current financial profile</li>` : ''}
        </ul>
        <p style="margin: 10px 0 0 0; font-size: 11px;"><strong>Recommendations:</strong></p>
        <ul style="margin: 5px 0; padding-left: 20px; font-size: 11px;">
            <li>Consider reducing the loan amount or extending the loan tenor</li>
            <li>Pay down existing debt obligations to improve ratios</li>
            <li>Consider increasing income or adding a co-applicant</li>
            <li>Consult with a financial advisor for personalized guidance</li>
        </ul>
    </div>
    ` : `
    <div class="highlight-box">
        <h3 style="color: #48bb78; margin-top: 0; font-size: 14px;">✅ Assessment Summary</h3>
        <p style="margin: 10px 0 0 0; font-size: 12px;">Based on the current financial profile, the loan application appears to meet the TDSR${results.msrApplicable ? '/MSR' : ''} requirements.</p>
    </div>
    `}

    <div class="disclaimer">
        <h4>⚠️ Important Disclaimer</h4>
        <p>This calculation is for reference only and should not be considered as financial advice or a guarantee of loan approval. Actual loan terms, interest rates, and approval decisions may vary based on individual circumstances, bank policies, and market conditions. Please consult with qualified financial advisors and mortgage specialists for personalized guidance.</p>
        <p style="margin-top: 10px;">All figures are estimates based on the information provided and current regulatory guidelines. Banks may have additional criteria and requirements not reflected in this analysis.</p>
    </div>

    <div class="footer">
        <p>Report generated on ${currentDate}</p>
        <p>Mortgage Calculator Tool - For Reference Only</p>
    </div>
</body>
</html>
  `.trim();
};