/**
 * Button.tsx — Reusable Button Component
 *
 * Props:
 *  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
 *  size:    'sm' | 'md' | 'lg'
 *  isLoading: shows spinner, disables button
 *  fullWidth: expands to container width
 *  icon: optional React node prepended to children
 *
 * Uses Framer Motion whileTap for a subtle press effect.
 * Extends standard HTML button attributes so all native props work.
 */
import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
  {
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading,
    fullWidth,
    icon,
    children,
    disabled,
    ...props
  },
  ref) =>
  {
    const baseStyles =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-highlight focus:ring-offset-2 focus:ring-offset-brand-dark disabled:opacity-50 disabled:pointer-events-none';
    const variants = {
      primary:
      'bg-brand-accent text-white hover:bg-brand-secondary shadow-lg shadow-brand-accent/20',
      secondary:
      'bg-brand-surface text-brand-text border border-brand-border hover:bg-brand-border',
      outline:
      'border-2 border-brand-accent text-brand-highlight hover:bg-brand-accent/10',
      ghost: 'text-brand-muted hover:text-brand-text hover:bg-brand-surface',
      danger:
      'bg-brand-danger/10 text-brand-danger hover:bg-brand-danger hover:text-white border border-brand-danger/20'
    };
    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2 text-sm',
      lg: 'h-12 px-8 text-base'
    };
    const widthClass = fullWidth ? 'w-full' : '';
    return (
      <motion.button
        ref={ref}
        whileTap={{
          scale: disabled || isLoading ? 1 : 0.98
        }}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
        disabled={disabled || isLoading}
        {...(props as any)}>
        
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isLoading && icon && <span className="mr-2">{icon}</span>}
        {children}
      </motion.button>);

  }
);
Button.displayName = 'Button';