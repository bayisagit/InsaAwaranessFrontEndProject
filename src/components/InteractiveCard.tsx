'use client';

import React from 'react';

interface InteractiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    href?: string;
}

export function InteractiveCard({ children, className = "", onClick, ...props }: InteractiveCardProps) {
    const isInteractive = !!onClick || !!props.href;
    
    const baseClasses = "bg-card border border-border rounded-xl shadow-sm shadow-black/5 dark:shadow-none overflow-hidden";
    const interactiveClasses = isInteractive 
        ? "cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/40 hover:border-primary/40 active:scale-[0.98]" 
        : "";

    return (
        <div 
            className={`${baseClasses} ${interactiveClasses} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </div>
    );
}
