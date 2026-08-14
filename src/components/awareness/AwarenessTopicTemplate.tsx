import React from 'react';
import Link from 'next/link';
import { FeatureCard } from './FeatureCard';
import type { AwarenessTopic } from '@/lib/awarenessData';
import { Button } from '@/components/Button';
import { PageHero } from '@/components/PageHero';
import { useTranslations } from 'next-intl';

interface AwarenessTopicTemplateProps {
    topic: AwarenessTopic;
}

export function AwarenessTopicTemplate({ topic }: AwarenessTopicTemplateProps) {
    const t = useTranslations('awarenessData');

    const toCamel = (s: string) => {
        const parts = s.split(/[^a-zA-Z0-9]+/);
        return parts[0].toLowerCase() + parts.slice(1).map(x => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase()).join('');
    };

    const prefix = toCamel(topic.slug);

    return (
        <div className="min-h-screen bg-muted">
            <PageHero
                breadcrumbBack={{ label: t('backToAllTopics'), href: '/awareness' }}
                title={
                    <div className="flex items-start gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl shrink-0">
                            {topic.icon}
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                                {(t as any)(`${prefix}Title`) || topic.title}
                            </h1>
                        </div>
                    </div>
                }
                description={(t as any)(`${prefix}Desc`) || topic.description}
            />

            {/* Feature Cards Grid */}
            <section className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {topic.sections.map((section, i) => {
                        const secPrefix = `${prefix}Sec${i + 1}`;
                        const bullets = section.bullets.map((b, j) => {
                            return (t as any)(`${secPrefix}Bul${j + 1}`) || b;
                        });

                        return (
                            <FeatureCard
                                key={i}
                                icon={section.icon}
                                title={(t as any)(`${secPrefix}Title`) || section.title}
                                description={(t as any)(`${secPrefix}Desc`) || section.description}
                                bullets={bullets}
                                accentColor={topic.accentColor}
                            />
                        );
                    })}
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="bg-card border-t border-border py-16 px-6 lg:px-12">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-foreground mb-3">{t('testKnowledgeTitle')}</h2>
                    <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                        {t('testKnowledgeDescPart1')}
                        <span className="font-semibold text-primary">{(t as any)(`${prefix}Title`)?.toLowerCase() || topic.title.toLowerCase()}</span>
                        {t('testKnowledgeDescPart2')}
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link href="/tools/self-assessment">
                            <Button variant="primary">{t('takeSelfAssessment')}</Button>
                        </Link>
                        <Link href="/awareness">
                            <Button variant="outline">{t('exploreOtherTopics')}</Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
