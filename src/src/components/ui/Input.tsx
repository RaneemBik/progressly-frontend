/**
 * Input.tsx — Reusable Form Input Component
 *
 * Props:
 *  label: text label rendered above the input
 *  icon: optional React node displayed inside the left edge
 *  error: error message displayed below in red; also adds red border
 *
 * Extends standard HTML input attributes — type, placeholder,
 * onChange, value, required, autoFocus, etc. all work natively.
 */
import React, { forwardRef } from 'react';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label &&
        <label className="block text-sm font-medium text-brand-muted mb-1.5">
            {label}
          </label>
        }
        <div className="relative">
          {icon &&
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
              {icon}
            </div>
          }
          <input
            ref={ref}
            className={`
              flex h-10 w-full rounded-md border border-brand-border bg-brand-surface/50 px-3 py-2 text-sm text-brand-text
              placeholder:text-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent
              disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-brand-danger focus:ring-brand-danger' : ''}
              ${className}
            `}
            {...props} />
          
        </div>
        {error && <p className="mt-1.5 text-sm text-brand-danger">{error}</p>}
      </div>);

  }
);
Input.displayName = 'Input';