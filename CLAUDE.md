# CLAUDE.md - Mortgage Calculator Project Context

## Project Overview
**Mortgage Calculator Application** - A comprehensive React-based mortgage package recommendation system with advanced filtering, detailed package analysis, and professional PDF report generation.

## Recent Work Completed (2025-08-09)

### Major Enhancements Completed ✅

#### 1. Critical Filter Bug Fixes
- **Fixed Loan Amount Filter Bug** 🔥 
  - **Issue**: 400K loan amounts were showing 1M+ packages
  - **Root Cause**: Missing `minimum_loan_size` comparison in filter logic
  - **Solution**: Added proper minimum loan amount validation
  - **Location**: `src/components/RecommendedPackages.js:197-206`
  
- **Fixed Rate Type & Lock Period Filters**
  - **Issue**: Filter field names didn't match HTML version exactly
  - **Solution**: Updated to match HTML field names precisely
  - **Changes**: `rateTypeFilter` → `rateType`, `lockPeriodFilter` → `lockPeriod`

- **Enhanced Bank Filtering**
  - **Issue**: Complex filtering logic with multiple bank name sources
  - **Solution**: Simplified to use only `pkg.bank_name` for consistency
  - **Location**: `src/components/RecommendedPackages.js:226-228`

#### 2. Complete PDF Generation Overhaul
- **Replaced Simple jsPDF with Comprehensive HTML-to-Print Solution**
  - **Before**: Basic table-based PDF with limited information
  - **After**: Sophisticated multi-page report matching HTML version functionality
  - **Location**: `src/components/RecommendedPackages.js:689-1154`

- **Added Advanced Financial Calculations**
  - PMT formula for accurate monthly installments
  - Year-by-year interest rate calculations with reference rates (SORA/SIBOR)
  - Savings analysis for refinancing loans over lock-in periods
  - Average first 2 years rate calculations

- **Professional Styling & Layout**
  - KeyQuest company branding with logo
  - Professional blue theme matching company colors
  - Comprehensive legal disclaimers
  - Print-optimized A4 layout with proper page breaks

- **Enhanced Package Comparison**
  - Detailed 5-year + thereafter rate schedules
  - Package features with visual checkmarks
  - Monthly installment comparisons
  - Total savings calculations for refinancing

#### 3. Performance & User Experience Improvements
- **Automatic Filtering**: Removed search button requirement, added 300ms debounce
- **Lazy Loading**: Packages only load when filters are applied (prevents lag with 500+ packages)
- **Enhanced Error Handling**: Comprehensive validation throughout
- **React Optimization**: Memoization, useCallback, useMemo for better performance

## Technical Architecture

### Key Files & Components
- **Main Component**: `src/components/RecommendedPackages.js` (1,500+ lines)
- **Database Service**: `src/services/AuthService.js` (Supabase integration)
- **Reference Implementation**: `public/recommended-packages.html` (original HTML version)
- **PDF Generation Logic**: `public/js/recommended-packages-pdf.js` (reference implementation)

### Database Schema (Supabase)
- **Table**: `mortgage_packages`
- **Key Fields**: 
  - Bank info: `bank_name`, `banks.name`
  - Rates: `year1_rate_type`, `year1_value`, `thereafter_rate_type`, etc.
  - Features: `legal_fee_subsidy`, `cash_rebate`, `valuation_subsidy`, etc.
  - Constraints: `minimum_loan_size`, `lock_period`, `rate_type_category`

### Filter Logic Implementation
```javascript
// Critical loan amount filter - exclude packages with higher minimum loan requirements
if (loanAmount > 0) {
  filtered = filtered.filter(pkg => {
    if (pkg.minimum_loan_size && loanAmount < pkg.minimum_loan_size) {
      return false; // Exclude if user's loan amount is below package minimum
    }
    return true;
  });
}
```

### PDF Generation Architecture
- **Method**: HTML-to-Print (window.open + print)
- **Styling**: Comprehensive CSS with !important overrides for print
- **Features**: Multi-page layout, professional branding, financial calculations
- **Calculations**: PMT formulas, rate calculations, savings analysis

## Current State & Quality

### ✅ Working Features
1. **Advanced Filtering System**
   - Property type, status, buy under filters
   - Loan amount with minimum loan size validation
   - Bank selection with existing bank exclusion for refinancing
   - Rate type and lock-in period filtering
   - Package features multi-select filtering

2. **Comprehensive PDF Generation**
   - Professional multi-page reports
   - Detailed financial calculations and rate schedules
   - Savings analysis for refinancing scenarios
   - Company branding and legal disclaimers

3. **Performance Optimizations**
   - Automatic filtering with debounce
   - Lazy loading of packages
   - React memoization and optimization
   - Efficient database queries

4. **User Experience Enhancements**
   - Real-time filter status indicators
   - Loading states and skeleton components
   - Editable package features and remarks
   - Professional UI with Tailwind CSS styling

### 🔧 Known Technical Debt
- Remove unused imports and optimize bundle size
- Add unit tests for complex filter logic
- Implement error boundaries for better error handling
- Add TypeScript for better type safety

### 🚨 Critical Success Factors
- **Filter Logic**: Must match HTML version exactly to ensure accurate results
- **PDF Generation**: Must include all calculations and professional formatting
- **Performance**: Must handle 500+ packages without lag through lazy loading
- **Data Accuracy**: Financial calculations must be precise for professional use

## Development Commands

### Testing & Validation
```bash
# Run the application
npm start

# Test filtering with various loan amounts
# Test PDF generation with different loan types
# Verify calculations match HTML version

# Build for production
npm run build

# Run linting (if configured)
npm run lint
```

### Git Workflow
```bash
# Current branch: main
# Last commit: b7e5962 - Enhanced PDF generation and filter fixes
# Status: All major features implemented and tested
```

## Next Steps & Recommendations

### Immediate Priorities
1. **User Acceptance Testing**: Test with real mortgage data and user workflows
2. **Cross-Browser Testing**: Ensure PDF generation works across browsers
3. **Performance Monitoring**: Monitor with 500+ packages in production
4. **Error Monitoring**: Implement comprehensive error tracking

### Future Enhancements
1. **Advanced Analytics**: Track user filter preferences and popular packages
2. **Export Options**: Excel export, email sharing capabilities
3. **Package Comparison**: Side-by-side detailed comparison tool
4. **Mobile Optimization**: Enhanced mobile experience for the filtering UI

### Code Quality Improvements
1. **TypeScript Migration**: Add type safety for better maintainability
2. **Unit Testing**: Add comprehensive tests for filter logic and calculations
3. **Documentation**: Add JSDoc comments for complex financial functions
4. **Accessibility**: Ensure WCAG compliance throughout the application

## Key Learning & Insights

### Critical Debugging Approach
- **Always compare with reference implementation** (HTML version)
- **Log filter steps** to understand data flow and identify issues
- **Test with real data volumes** to catch performance issues
- **Validate financial calculations** against known formulas

### Best Practices Established
- **Lazy Loading**: Essential for large datasets (500+ records)
- **Debounced Filtering**: Improves UX and reduces API calls
- **Comprehensive Error Handling**: Critical for production reliability
- **Professional PDF Styling**: Use print-specific CSS with !important overrides

## Contact & Handoff Notes
- **Project Location**: `C:\Users\keyqu\mortgage-calculator`
- **GitHub Repository**: `kqmdigital/mortgage-calculator`
- **Database**: Supabase integration via AuthService
- **Deployment**: Ready for production deployment
- **Documentation**: This file serves as comprehensive project context

---
*Last Updated: 2025-08-09*
*Created by: Claude Code Assistant*