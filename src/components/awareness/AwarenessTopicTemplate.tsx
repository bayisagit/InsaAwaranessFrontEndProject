import React from 'react';
import Link from 'next/link';
import { FeatureCard } from './FeatureCard';
import type { AwarenessTopic } from '@/lib/awarenessData';
import { Button } from '@/components/Button';
import { PageHero } from '@/components/PageHero';

interface AwarenessTopicTemplateProps {
    topic: AwarenessTopic;
}

export function AwarenessTopicTemplate({ topic }: AwarenessTopicTemplateProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            <PageHero
                breadcrumbBack={{ label: 'Back to All Topics', href: '/awareness' }}
                title={
                    <div className="flex items-start gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl shrink-0">
                            {topic.icon}
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">{topic.title}</h1>
                        </div>
                    </div>
                }
                description={topic.description}
            />

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
