'use client';

import React from 'react';

interface FeatureCardProps {
    icon: string;
    title: string;
    description: string;
    bullets: string[];
    accentColor: string;
}

const colorMap: Record<string, { border: string; bg: string; iconBg: string }> = {
    red: { border: 'border-red-500', bg: 'bg-red-50', iconBg: 'bg-red-100' },
    blue: { border: 'border-blue-500', bg: 'bg-blue-50', iconBg: 'bg-blue-100' },
    emerald: { border: 'border-emerald-500', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100' },
    purple: { border: 'border-purple-500', bg: 'bg-purple-50', iconBg: 'bg-purple-100' },
    orange: { border: 'border-orange-500', bg: 'bg-orange-50', iconBg: 'bg-orange-100' },
    teal: { border: 'border-teal-500', bg: 'bg-teal-50', iconBg: 'bg-teal-100' },
};

export function FeatureCard({ icon, title, description, bullets, accentColor }: FeatureCardProps) {
    const colors = colorMap[accentColor] || colorMap.blue;

    return (
        <div
            className={`relative bg-white rounded-2xl shadow-sm border border-gray-100 border-b-4 ${colors.border} p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl group overflow-hidden`}
        >
            {/* Decorative quarter-circle */}
            <div className={`absolute -top-6 -right-6 w-16 h-16 rounded-bl-full ${colors.bg} opacity-50`} />

            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center text-xl mb-5 group-hover:scale-110 transition-transform duration-300`}>
                {icon}
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>

            {/* Description */}
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">{description}</p>

            {/* Bullets */}
            <ul className="space-y-2">
                {bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${colors.border.replace('border-', 'bg-')}`} />
                        {bullet}
                    </li>
                ))}
            </ul>
        </div>
    );
}
