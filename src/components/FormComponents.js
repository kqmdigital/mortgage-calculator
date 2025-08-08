import React from 'react';
import { formatCurrencyInput } from '../utils/mortgageHelpers';

// Reusable Currency Input Component
export const CurrencyInput = ({ 
  label, 
  value, 
  onChange, 
  placeholder = '', 
  className = '',
  required = false 
}) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="text"
      value={formatCurrencyInput(value)}
      onChange={(e) => onChange(e.target.value.replace(/,/g, ''))}
      placeholder={placeholder}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
);

// Reusable Number Input Component
export const NumberInput = ({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  step = 1, 
  placeholder = '', 
  className = '',
  required = false,
  helpText = ''
}) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
      {helpText && <span className="text-xs text-gray-500 ml-2">({helpText})</span>}
    </label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
);

// Reusable Select Component
export const SelectInput = ({ 
  label, 
  value, 
  onChange, 
  options, 
  className = '',
  required = false 
}) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

// Reusable Range Slider Component
export const RangeSlider = ({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  step, 
  className = '',
  showValue = true 
}) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full mb-2"
    />
    {showValue && (
      <div className="flex justify-between text-sm text-gray-600">
        <span>{min}%</span>
        <span className="font-semibold">{value}%</span>
        <span>{max}%</span>
      </div>
    )}
  </div>
);

// Reusable Radio Group Component
export const RadioGroup = ({ 
  label, 
  options, 
  value, 
  onChange, 
  className = '' 
}) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium text-gray-700 mb-3">{label}</label>}
    <div className="flex items-center space-x-4">
      {options.map((option) => (
        <label key={option.value} className="flex items-center">
          <input
            type="radio"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="mr-2"
          />
          <span className="text-sm font-medium">{option.label}</span>
        </label>
      ))}
    </div>
  </div>
);

// Form Section Component
export const FormSection = ({ title, children, className = '' }) => (
  <div className={`mb-8 ${className}`}>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    {children}
  </div>
);

// Info Box Component
export const InfoBox = ({ type = 'info', title, children, className = '' }) => {
  const getStyles = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStyles()} ${className}`}>
      {title && <h4 className="font-semibold mb-2">{title}</h4>}
      <div className="text-sm">{children}</div>
    </div>
  );
};