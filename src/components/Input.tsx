'use client';

import React, { useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
 label?: string;
 error?: string;
 helperText?: string;
 icon?: React.ReactNode;
 showPasswordToggle?: boolean;
 success?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
 ({ className = '', label, error, helperText, icon, id, type, showPasswordToggle, success, ...props }, ref) => {
 const [showPassword, setShowPassword] = useState(false);
 const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

 const isPassword = type === 'password';
 const inputType = isPassword && showPasswordToggle && showPassword ? 'text' : type;

 const borderColor = error
 ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
 : success
 ? 'border-green-400 focus:border-green-500 focus:ring-green-500/20'
 : 'border-border focus:border-primary focus:ring-primary/20';

 return (
 <div className="w-full">
 {label && (
 <label htmlFor={inputId} className="block text-sm font-medium text-foreground mb-1.5">
 {label}
 {props.required && <span className="text-red-500 ml-1">*</span>}
 </label>
 )}
 <div className="relative">
 {icon && (
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
 {icon}
 </div>
 )}
 <input
 id={inputId}
 ref={ref}
 type={inputType}
 className={`
 block w-full rounded-xl border transition-all duration-150
 ${borderColor}
 ${icon ? 'pl-10' : 'pl-3.5'}
 ${isPassword && showPasswordToggle ? 'pr-11' : success && !icon && !showPasswordToggle ? 'pr-11' : 'pr-3.5'}
 py-2.5 text-sm shadow-sm shadow-black/5 dark:shadow-none
 bg-card text-foreground placeholder:text-muted-foreground
 focus:outline-none focus:ring-2
 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:border-border
 ${className}
 `}
 aria-invalid={error ? 'true' : undefined}
 aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
 {...props}
 />
 {success && !error && (
 <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-green-500">
 <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 </div>
 )}
 {isPassword && showPasswordToggle && (
 <button
 type="button"
 className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-muted-foreground focus-visible:outline-none focus-visible:text-foreground transition-colors cursor-pointer"
 onClick={() => setShowPassword(!showPassword)}
 tabIndex={-1}
 aria-label={showPassword ? 'Hide password' : 'Show password'}
 >
 {showPassword ? (
 <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
 </svg>
 ) : (
 <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
 </svg>
 )}
 </button>
 )}
 </div>
 {error && (
 <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-600 flex items-center gap-1.5" role="alert">
 <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 <span>{error}</span>
 </p>
 )}
 {helperText && !error && (
 <p id={`${inputId}-helper`} className="mt-1.5 text-xs text-muted-foreground">{helperText}</p>
 )}
 </div>
 );
 }
);
Input.displayName = 'Input';
