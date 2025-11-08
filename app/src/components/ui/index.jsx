import React, { forwardRef } from 'react';

// Button (forwardRef로 수정)
export const Button = forwardRef(function Button(
  { variant = 'primary', children, loading = false, ...props },
  ref
) {
  const className = variant === 'primary' ? 'btn-primary' : 'btn-text';
  return (
    <button ref={ref} className={className} {...props}>
      {loading && <span className="loading-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
});

// Select
export const Select = ({ label, helper, options = [], value, onChange, id, ...props }) => {
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      <select id={id} value={value} onChange={onChange} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helper && <p className="helper">{helper}</p>}
    </div>
  );
};

// SegmentedControl
export const SegmentedControl = ({
  label,
  options = [],
  value,
  onChange,
  helper,
  ariaLabel
}) => {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div className="segmented" role="tablist" aria-label={ariaLabel}>
        {options.map((option) => (
          <button
            key={option.value}
            role="tab"
            aria-selected={value === option.value}
            className={value === option.value ? 'active' : ''}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
      {helper && <p className="helper">{helper}</p>}
    </div>
  );
};

// Card (forwardRef로 유지)
export const Card = forwardRef(function Card({ children, className = '', ...props }, ref) {
  return (
    <div ref={ref} className={`card ${className}`} {...props}>
      {children}
    </div>
  );
});

// Info
export const InfoBox = ({ children }) => <div className="info-box">{children}</div>;

export const InfoRow = ({ label, value, isLast = false }) => (
  <div className={`info-row ${isLast ? 'last' : ''}`}>
    <span className="info-label">{label}:</span>
    <span className="info-value">{value}</span>
  </div>
);
