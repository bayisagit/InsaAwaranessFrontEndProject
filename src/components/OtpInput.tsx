'use client';

import React, { useRef, useEffect } from 'react';

interface OtpInputProps {
    value: string;
    onChange: (value: string) => void;
    onComplete?: (code: string) => void;
    disabled?: boolean;
    autoFocus?: boolean;
}

export function OtpInput({
    value,
    onChange,
    onComplete,
    disabled = false,
    autoFocus = true,
}: OtpInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Convert string value to array of 6 characters
    const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

    useEffect(() => {
        if (autoFocus && inputRefs.current[0] && !disabled) {
            inputRefs.current[0].focus();
        }
    }, [autoFocus, disabled]);

    const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const char = e.target.value.slice(-1); // Take latest typed char

        if (!/^\d*$/.test(char)) return; // Digits only

        const newDigits = [...digits];
        newDigits[index] = char;
        const newCode = newDigits.join('');
        onChange(newCode);

        // Advance focus if digit was entered
        if (char && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        if (newCode.length === 6 && onComplete) {
            onComplete(newCode);
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!digits[index] && index > 0) {
                // Current box is empty, jump to previous and clear it
                e.preventDefault();
                const newDigits = [...digits];
                newDigits[index - 1] = '';
                onChange(newDigits.join(''));
                inputRefs.current[index - 1]?.focus();
            } else if (digits[index]) {
                // Clear current
                const newDigits = [...digits];
                newDigits[index] = '';
                onChange(newDigits.join(''));
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            e.preventDefault();
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;

        onChange(pasted);
        const focusIndex = Math.min(pasted.length, 5);
        inputRefs.current[focusIndex]?.focus();

        if (pasted.length === 6 && onComplete) {
            onComplete(pasted);
        }
    };

    return (
        <div className="flex items-center justify-center gap-1.5 sm:gap-3 my-4 w-full" onPaste={handlePaste}>
            {/* First 3 Digits */}
            {digits.slice(0, 3).map((digit, i) => (
                <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    disabled={disabled}
                    onChange={(e) => handleChange(i, e)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-10 h-13 sm:w-13 sm:h-16 text-xl sm:text-2xl font-bold rounded-xl sm:rounded-2xl border-2 border-border bg-card text-foreground transition-all duration-150 focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed shadow-xs shrink-0"
                    autoComplete="one-time-code"
                />
            ))}

            {/* Middle Hyphen Separator (as in Screenshot 2) */}
            <span className="text-muted-foreground/60 font-semibold text-lg sm:text-2xl select-none px-0.5 sm:px-1 shrink-0">-</span>

            {/* Second 3 Digits */}
            {digits.slice(3, 6).map((digit, i) => {
                const actualIndex = i + 3;
                return (
                    <input
                        key={actualIndex}
                        ref={(el) => { inputRefs.current[actualIndex] = el; }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        disabled={disabled}
                        onChange={(e) => handleChange(actualIndex, e)}
                        onKeyDown={(e) => handleKeyDown(actualIndex, e)}
                        className="w-10 h-13 sm:w-13 sm:h-16 text-xl sm:text-2xl font-bold rounded-xl sm:rounded-2xl border-2 border-border bg-card text-foreground transition-all duration-150 focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed shadow-xs shrink-0"
                        autoComplete="one-time-code"
                    />
                );
            })}
        </div>
    );
}
