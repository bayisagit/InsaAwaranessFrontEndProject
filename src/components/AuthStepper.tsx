'use client';

import React from 'react';

export interface StepItem {
    step: number;
    label: string;
}

interface AuthStepperProps {
    currentStep: number;
    steps?: StepItem[];
}

const defaultSteps: StepItem[] = [
    { step: 1, label: 'Email' },
    { step: 2, label: 'Code' },
    { step: 3, label: 'Password' },
];

export function AuthStepper({ currentStep, steps = defaultSteps }: AuthStepperProps) {
    return (
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 my-6">
            {steps.map((item, idx) => {
                const isCompleted = currentStep > item.step;
                const isActive = currentStep === item.step;

                return (
                    <React.Fragment key={item.step}>
                        {/* Step Pill */}
                        <div
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 select-none ${
                                isActive
                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                    : isCompleted
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            {isCompleted ? (
                                <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <span className="font-bold">{item.step}</span>
                            )}
                            <span>{item.label}</span>
                        </div>

                        {/* Connector Line */}
                        {idx < steps.length - 1 && (
                            <div
                                className={`h-0.5 w-4 sm:w-6 transition-colors duration-200 ${
                                    currentStep > item.step ? 'bg-emerald-400 dark:bg-emerald-600' : 'bg-border'
                                }`}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
