'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/Button';
import Link from 'next/link';

export interface NextStepAction {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: 'primary' | 'outline' | 'secondary' | 'danger';
    icon?: React.ReactNode;
}

interface ExpandableCreateSectionProps {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    
    // Success State Props
    isSuccess?: boolean;
    successTitle?: string;
    successDescription?: string;
    nextSteps?: NextStepAction[];
}

export function ExpandableCreateSection({ 
    title, 
    isOpen, 
    onToggle, 
    children,
    isSuccess = false,
    successTitle = "Created Successfully!",
    successDescription = "What would you like to do next?",
    nextSteps = []
}: ExpandableCreateSectionProps) {
    return (
        <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-6 mb-4">
            <div className={`bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border overflow-hidden transition-all duration-300 ${isOpen ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border'}`}>
                <button
                    onClick={onToggle}
                    className="w-full flex items-center px-6 py-4 bg-muted hover:bg-muted/50 transition-colors text-left font-semibold text-foreground focus:outline-none"
                    type="button"
                >
                    <span className="flex items-center gap-2">
                        {isOpen ? '▼' : '▸'} {title}
                    </span>
                </button>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                        >
                            <div className="border-t border-border bg-card p-6">
                                {isSuccess ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                            <span className="text-3xl text-green-600">✓</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground mb-2">{successTitle}</h3>
                                        <p className="text-muted-foreground mb-8">{successDescription}</p>
                                        
                                        <div className="flex flex-wrap gap-3 justify-center">
                                            {nextSteps.map((step, idx) => (
                                                step.href ? (
                                                    <Link key={idx} href={step.href}>
                                                        <Button variant={step.variant || 'primary'} className="flex items-center gap-2">
                                                            {step.icon && <span>{step.icon}</span>}
                                                            {step.label}
                                                        </Button>
                                                    </Link>
                                                ) : (
                                                    <Button key={idx} variant={step.variant || 'primary'} onClick={step.onClick} className="flex items-center gap-2">
                                                        {step.icon && <span>{step.icon}</span>}
                                                        {step.label}
                                                    </Button>
                                                )
                                            ))}
                                            <Button variant="outline" onClick={onToggle}>
                                                Close Workspace
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    children
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
