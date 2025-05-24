# Employee Mortgage Calculator

A professional mortgage affordability calculator designed for employee access with authentication and comprehensive reporting features.

## Features

- 🔐 **Employee Authentication** - Secure login system for authorized personnel
- 🏠 **Property Types** - Support for both HDB and Private properties
- 📊 **TDSR & MSR Calculations** - Accurate debt servicing ratio calculations
- 💰 **Multiple Income Sources** - Salary, bonus, show fund, and pledge calculations
- 📈 **Yearly Interest Tracking** - Detailed interest calculations by year
- 📄 **Professional Reports** - Generate downloadable calculation reports
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices

## Technology Stack

- **Frontend**: React 18
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Create React App
- **Deployment**: Render.com

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mortgage-calculator.git
cd mortgage-calculator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Credentials

For testing purposes, use these credentials:

- **Admin**: `admin` / `admin123`
- **Manager**: `manager` / `manager456`
- **Analyst**: `analyst` / `analyst789`

## Deployment

### Deploy to Render

1. Push your code to GitHub
2. Connect your GitHub repository to Render
3. Set build command: `npm run build`
4. Set publish directory: `build`
5. Deploy!

### Environment Variables

For production, configure these environment variables in Render:

```
REACT_APP_COMPANY_NAME=Your Company Name
REACT_APP_VERSION=1.0.0
```

## Usage

### Login Process
1. Access the application URL
2. Enter your employee credentials
3. Click "Sign In" to access the calculator

### Mortgage Calculation
1. Enter property purchase price
2. Select loan amount option (75%, 55%, or custom)
3. Configure interest rates and loan tenor
4. Input applicant information
5. Add any additional funding sources
6. Review calculation results
7. Generate professional report if needed

### Key Calculations

- **TDSR (55%)**: Total Debt Servicing Ratio for private properties
- **MSR (30%)**: Mortgage Servicing Ratio for HDB properties
- **Stress Test**: Uses higher interest rate for affordability assessment
- **Yearly Interest**: Calculates interest payments year by year
- **Bonus Income**: 70% recognition of excess annual salary
- **Show Fund**: 0.625% monthly yield assumption
- **Pledge Income**: Distributed over 48 months

## Security Features

- Client-side authentication
- Session management
- Secure credential storage
- HTTPS enforcement (via Render)

## Project Structure

```
mortgage-calculator/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── App.js          # Main application component
│   ├── App.css         # Component styles
│   ├── index.js        # React entry point
│   └── index.css       # Global styles with Tailwind
├── package.json        # Dependencies and scripts
├── tailwind.config.js  # Tailwind configuration
├── .gitignore         # Git ignore rules
└── README.md          # Project documentation
```

## Customization

### Adding New Users

Edit the `EMPLOYEE_CREDENTIALS` object in `src/App.js`:

```javascript
const EMPLOYEE_CREDENTIALS = {
  'username': 'password',
  // Add more users here
};
```

### Modifying Calculations

Update the calculation logic in the `calculateMortgage` function within `src/App.js`.

### Styling Changes

Modify Tailwind classes directly in components or update `tailwind.config.js` for theme customization.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## Support

For technical support or feature requests, please create an issue in the GitHub repository.

## License

This project is proprietary software for internal company use only.

## Version History

- **v1.0.0** - Initial release with basic mortgage calculations
- **v1.1.0** - Added employee authentication
- **v1.2.0** - Enhanced reporting features
- **v1.3.0** - Mobile responsive design improvements

---

**Note**: This calculator is for preliminary assessment purposes only. Actual loan approval is subject to bank policies and credit assessment.