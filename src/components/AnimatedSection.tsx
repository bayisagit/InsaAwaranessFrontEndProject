'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface AnimatedSectionProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    duration?: number;
    yOffset?: number;
}

export function AnimatedSection({ 
    children, 
    className = "", 
    delay = 0, 
    duration = 0.5,
    yOffset = 20
}: AnimatedSectionProps) {
    const shouldReduceMotion = useReducedMotion();

    if (shouldReduceMotion) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: yOffset }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ 
                duration, 
                delay, 
                ease: [0.25, 0.1, 0.25, 1], // Custom cubic-bezier for smooth SaaS feel
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
