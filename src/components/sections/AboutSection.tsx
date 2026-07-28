import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { useTranslations } from 'next-intl';

interface AboutSectionProps {
    variant?: 'full' | 'home';
}

export function AboutSection({ variant = 'full' }: AboutSectionProps) {
    const t = useTranslations('landing');
    const tCommon = useTranslations('common');

    if (variant === 'home') {
        return (
            <section className="py-20 px-6 lg:px-8 bg-muted border-t border-border">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="text-primary text-xs font-bold tracking-widest uppercase mb-4 inline-block">
                            {t('nationalInitiative')}
                        </span>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
                            {t('aboutTitle')}
                        </h2>
                        <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                            {t('aboutDesc')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
                        <div className="bg-card rounded-2xl p-8 border border-border shadow-sm shadow-black/5 dark:shadow-none text-center">
                            <span className="text-4xl font-bold text-primary mb-2 block">24/7</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('threatMonitoring')}</span>
                        </div>
                        <div className="bg-card rounded-2xl p-8 border border-border shadow-sm shadow-black/5 dark:shadow-none text-center">
                            <span className="text-4xl font-bold text-primary mb-2 block">12M+</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('citizensEmpowered')}</span>
                        </div>
                        <div className="bg-card rounded-2xl p-8 border border-border shadow-sm shadow-black/5 dark:shadow-none text-center">
                            <span className="text-4xl font-bold text-primary mb-2 block">98%</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('uptimeGuarantee')}</span>
                        </div>
                    </div>

                    <div className="text-center">
                        <Link href="/about">
                            <Button variant="outline">{t('learnMoreAboutUs')} &rarr;</Button>
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <div className="flex flex-col bg-card">
            {/* Hero Section */}
            <section className="relative px-6 py-24 sm:py-32 lg:px-8 text-center bg-muted border-b border-border overflow-hidden">
                <div className="absolute top-0 right-1/4 -z-10 w-[500px] h-[500px] bg-red-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

                <span className="text-primary text-xs font-bold tracking-widest uppercase mb-4 inline-block">
                    {t('nationalInitiative')}
                </span>
                <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl max-w-3xl mx-auto">
                    {t.rich('digitalSovereignty', {
                        span: (chunks) => <span className="text-primary">{chunks}</span>,
                        br: () => <br />
                    })}
                </h1>
                <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
                    {t('aboutDesc')}
                </p>

                {/* Stats Grid */}
                <div className="mt-16 bg-card rounded-2xl shadow-sm shadow-black/5 dark:shadow-none border border-border max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border py-8">
                    <div className="px-6 flex flex-col items-center">
                        <span className="text-4xl font-bold text-primary mb-1">24/7</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('threatMonitoring')}</span>
                    </div>
                    <div className="px-6 flex flex-col items-center py-6 sm:py-0">
                        <span className="text-4xl font-bold text-primary mb-1">12M+</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('citizensEmpowered')}</span>
                    </div>
                    <div className="px-6 flex flex-col items-center">
                        <span className="text-4xl font-bold text-primary mb-1">98%</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('uptimeGuarantee')}</span>
                    </div>
                </div>
            </section>

            {/* Core Mission */}
            <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground border-l-4 border-primary pl-4 mb-6">{t('coreMission')}</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        {t('coreMissionDesc1')}
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                        {t('coreMissionDesc2')}
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="flex items-start gap-4 p-6 rounded-2xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 text-primary flex items-center justify-center shrink-0">
                            &#128737;
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground mb-1">{t('proactiveDefense')}</h4>
                            <p className="text-sm text-muted-foreground">{t('proactiveDefenseDesc')}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-6 rounded-2xl bg-muted border border-border">
                        <div className="w-10 h-10 rounded-full bg-muted-foreground/10 text-muted-foreground flex items-center justify-center shrink-0">
                            &#128218;
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground mb-1">{t('nationalEducation')}</h4>
                            <p className="text-sm text-muted-foreground">{t('nationalEducationDesc')}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-6 rounded-2xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 text-primary flex items-center justify-center shrink-0">
                            &#9888;
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground mb-1">{t('unifiedResponse')}</h4>
                            <p className="text-sm text-muted-foreground">{t('unifiedResponseDesc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Who We Serve */}
            <section className="py-24 bg-muted px-6 lg:px-8 border-t border-border">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">{t('whoWeServe')}</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            {t('whoWeServeDesc')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-card rounded-2xl p-8 border border-border shadow-sm shadow-black/5 dark:shadow-none text-center flex flex-col h-full">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-6">
                                &#128106;
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-3">{t('citizensFamilies')}</h3>
                            <p className="text-muted-foreground text-sm flex-1 mb-8">
                                {t('citizensFamiliesDesc')}
                            </p>
                            <Link href="/courses" className="text-primary font-semibold text-sm hover:underline mt-auto">
                                {t('viewCitizenPortal')} &rarr;
                            </Link>
                        </div>

                        <div className="bg-card rounded-2xl p-8 border-2 border-primary shadow-md shadow-black/10 dark:shadow-none text-center flex flex-col h-full relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                {t('primaryFocus')}
                            </div>
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-primary flex items-center justify-center mb-6 mt-2">
                                &#128188;
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-3">{t('smallBusinesses')}</h3>
                            <p className="text-muted-foreground text-sm flex-1 mb-8">
                                {t('smallBusinessesDesc')}
                            </p>
                            <Link href="/resources" className="text-primary font-semibold text-sm hover:underline mt-auto">
                                {t('exploreToolkits')} &rarr;
                            </Link>
                        </div>

                        <div className="bg-card rounded-2xl p-8 border border-border shadow-sm shadow-black/5 dark:shadow-none text-center flex flex-col h-full">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-green-50 text-green-500 flex items-center justify-center mb-6">
                                &#127963;
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-3">{t('governmentAgencies')}</h3>
                            <p className="text-muted-foreground text-sm flex-1 mb-8">
                                {t('governmentAgenciesDesc')}
                            </p>
                            <Link href="/resources" className="text-primary font-semibold text-sm hover:underline mt-auto">
                                {t('agencyLogin')} &rarr;
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="relative py-24 bg-secondary px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
                {/* Subtle gradient overlay to ensure contrast against background */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60 pointer-events-none" />
                
                <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl drop-shadow-md">
                    {t('ctaReadyTitle')}
                </h2>
                <p className="mt-6 text-xl text-gray-100 max-w-2xl mx-auto drop-shadow-sm font-medium leading-relaxed">
                    {t('ctaReadyDesc')}
                </p>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/signup" aria-label="Create a free account">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto font-bold shadow-lg shadow-black/10 dark:shadow-none hover:shadow-xl hover:-translate-y-0.5 transition-all">
                        {tCommon('createFreeAccount')}
                    </Button>
                    </Link>
                    <Link href="/courses" aria-label="Explore cybersecurity resources">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto text-white bg-white/10 border-white/30 hover:bg-white/25 hover:border-white/60 font-bold shadow-lg shadow-black/10 dark:shadow-none hover:shadow-xl hover:-translate-y-0.5 transition-all backdrop-blur-sm">
                        {tCommon('exploreCourses')}
                    </Button>
                    </Link>
                </div>
                </div>
            </section>
        </div>
    );
}
