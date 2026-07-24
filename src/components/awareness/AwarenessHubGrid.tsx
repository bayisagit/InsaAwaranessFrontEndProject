import React from 'react';
import Link from 'next/link';
import { awarenessTopics } from '@/lib/awarenessData';

const colorMap: Record<string, { border: string; bg: string; iconBg: string; text: string }> = {
    red: { border: 'border-red-500', bg: 'bg-red-50', iconBg: 'bg-red-100', text: 'text-red-600' },
    blue: { border: 'border-blue-500', bg: 'bg-blue-50', iconBg: 'bg-blue-100', text: 'text-blue-600' },
    emerald: { border: 'border-emerald-500', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', text: 'text-emerald-600' },
    purple: { border: 'border-purple-500', bg: 'bg-purple-50', iconBg: 'bg-purple-100', text: 'text-purple-600' },
    orange: { border: 'border-orange-500', bg: 'bg-orange-50', iconBg: 'bg-orange-100', text: 'text-orange-600' },
    teal: { border: 'border-teal-500', bg: 'bg-teal-50', iconBg: 'bg-teal-100', text: 'text-teal-600' },
};

export function AwarenessHubGrid() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <section className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 sm:py-24 text-center">
                    <span className="text-primary text-xs font-bold tracking-widest uppercase mb-4 inline-block">
                        KNOWLEDGE HUB
                    </span>
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl mb-4">
                        Awareness Topics
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Explore practical guides and actionable steps to protect yourself and your organization from the most common cyber threats.
                    </p>
                </div>
            </section>

            {/* Grid */}
            <section className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {awarenessTopics.map((topic) => {
                        const colors = colorMap[topic.accentColor] || colorMap.blue;
                        return (
                            <Link key={topic.slug} href={`/awareness/${topic.slug}`} className="group block">
                                <div
                                    className={`relative bg-white rounded-2xl shadow-sm border border-gray-100 border-b-4 ${colors.border} p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl overflow-hidden h-full`}
                                >
                                    {/* Decorative quarter-circle */}
                                    <div className={`absolute -top-6 -right-6 w-16 h-16 rounded-bl-full ${colors.bg} opacity-50`} />

                                    <div className="flex items-start gap-5 mb-5">
                                        <div className={`w-14 h-14 rounded-xl ${colors.iconBg} flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                            {topic.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors mb-1">
                                                {topic.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                                                {topic.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm">
                                        <span className={`text-xs font-semibold ${colors.text}`}>
                                            {topic.sections.length} guides
                                        </span>
                                        <span className="text-xs text-gray-400 font-medium group-hover:text-primary transition-colors flex items-center gap-1 ml-auto">
                                            Explore Topic &rarr;
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
