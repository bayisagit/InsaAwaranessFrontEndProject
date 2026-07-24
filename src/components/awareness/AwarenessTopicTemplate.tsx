import React from 'react';
import Link from 'next/link';
import { FeatureCard } from './FeatureCard';
import type { AwarenessTopic } from '@/lib/awarenessData';
import { Button } from '@/components/Button';

interface AwarenessTopicTemplateProps {
    topic: AwarenessTopic;
}

export function AwarenessTopicTemplate({ topic }: AwarenessTopicTemplateProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero */}
            <section className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 sm:py-24">
                    <Link href="/awareness" className="text-xs font-bold text-gray-400 hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-2 mb-6">
                        ← Back to All Topics
                    </Link>
                    <div className="flex items-start gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl shrink-0">
                            {topic.icon}
                        </div>
                        <div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-4">{topic.title}</h1>
                            <p className="text-lg text-gray-600 max-w-3xl leading-relaxed">{topic.description}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Cards Grid */}
            <section className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {topic.sections.map((section, i) => (
                        <FeatureCard
                            key={i}
                            icon={section.icon}
                            title={section.title}
                            description={section.description}
                            bullets={section.bullets}
                            accentColor={topic.accentColor}
                        />
                    ))}
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="bg-white border-t border-gray-100 py-16 px-6 lg:px-12">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Want to test your knowledge?</h2>
                    <p className="text-gray-500 mb-8 max-w-xl mx-auto">
                        Take our self-assessment tool to evaluate your understanding of {topic.title.toLowerCase()} and identify areas for improvement.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link href="/tools/self-assessment">
                            <Button variant="primary">Take Self-Assessment</Button>
                        </Link>
                        <Link href="/awareness">
                            <Button variant="outline">Explore Other Topics</Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
