'use client';
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { useTranslations } from 'next-intl';
import { GraduationCap, Building2, Landmark, CheckCircle2, ArrowRight, ShieldCheck, BookOpen, AlertTriangle } from 'lucide-react';

interface AboutSectionProps {
    variant?: 'full' | 'home';
}

export function AboutSection({ variant = 'full' }: AboutSectionProps) {
    const t = useTranslations('landing');
    const tCommon = useTranslations('common');

    if (variant === 'home') {
        return (
            <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted border-t border-border">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8 sm:mb-12">
                        <span className="text-primary text-xs font-bold tracking-widest uppercase mb-3 sm:mb-4 inline-block">
                            {t('nationalInitiative')}
                        </span>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                            {t('aboutTitle')}
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                            {t('aboutDesc')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 max-w-4xl mx-auto mb-8 sm:mb-12">
                        <div className="bg-card rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-border shadow-sm shadow-black/5 dark:shadow-none text-center">
                            <span className="text-3xl sm:text-4xl font-bold text-primary mb-1 sm:mb-2 block">24/7</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('threatMonitoring')}</span>
                        </div>
                        <div className="bg-card rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-border shadow-sm shadow-black/5 dark:shadow-none text-center">
                            <span className="text-3xl sm:text-4xl font-bold text-primary mb-1 sm:mb-2 block">12M+</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('citizensEmpowered')}</span>
                        </div>
                        <div className="bg-card rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-border shadow-sm shadow-black/5 dark:shadow-none text-center">
                            <span className="text-3xl sm:text-4xl font-bold text-primary mb-1 sm:mb-2 block">98%</span>
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
            <section className="relative px-4 sm:px-6 py-14 sm:py-28 lg:px-8 text-center bg-muted border-b border-border overflow-hidden">
                <div className="absolute top-0 right-1/4 -z-10 w-[500px] h-[500px] bg-red-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

                <span className="text-primary text-xs font-bold tracking-widest uppercase mb-4 inline-block">
                    {t('nationalInitiative')}
                </span>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl max-w-3xl mx-auto leading-tight">
                    {t.rich('digitalSovereignty', {
                        span: (chunks) => <span className="text-primary">{chunks}</span>,
                        br: () => <br />
                    })}
                </h1>
                <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-muted-foreground max-w-2xl mx-auto">
                    {t('aboutDesc')}
                </p>

                {/* Stats Grid */}
                <div className="mt-10 sm:mt-16 bg-card rounded-xl sm:rounded-2xl shadow-sm shadow-black/5 dark:shadow-none border border-border max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border py-6 sm:py-8">
                    <div className="px-4 sm:px-6 flex flex-col items-center pb-4 sm:pb-0">
                        <span className="text-3xl sm:text-4xl font-bold text-primary mb-1">24/7</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('threatMonitoring')}</span>
                    </div>
                    <div className="px-4 sm:px-6 flex flex-col items-center py-4 sm:py-0">
                        <span className="text-3xl sm:text-4xl font-bold text-primary mb-1">12M+</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('citizensEmpowered')}</span>
                    </div>
                    <div className="px-4 sm:px-6 flex flex-col items-center pt-4 sm:pt-0">
                        <span className="text-3xl sm:text-4xl font-bold text-primary mb-1">98%</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('uptimeGuarantee')}</span>
                    </div>
                </div>
            </section>

            {/* Core Mission */}
            {/* Core Mission */}
            <section className="py-12 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 items-center">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground border-l-4 border-primary pl-4 mb-4 sm:mb-6">{t('coreMission')}</h2>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4 sm:mb-6">
                        {t('coreMissionDesc1')}
                    </p>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        {t('coreMissionDesc2')}
                    </p>
                </div>

                <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 text-primary flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground mb-1">{t('proactiveDefense')}</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground">{t('proactiveDefenseDesc')}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-muted border border-border">
                        <div className="w-10 h-10 rounded-full bg-muted-foreground/10 text-muted-foreground flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground mb-1">{t('nationalEducation')}</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground">{t('nationalEducationDesc')}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 text-primary flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground mb-1">{t('unifiedResponse')}</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground">{t('unifiedResponseDesc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Who We Serve */}
            <section className="py-12 sm:py-24 bg-muted px-4 sm:px-6 lg:px-8 border-t border-border">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-10 sm:mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            {t('whoWeServeBadge')}
                        </div>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground mb-3 sm:mb-4">
                            {t('whoWeServe')}
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            {t('whoWeServeDesc')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
                        {/* 1. Citizens, Students & Families */}
                        <div className="bg-card rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-border hover:border-blue-500/40 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full group text-left">
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
                                </div>
                                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                                    {t('citizensFamiliesBadge')}
                                </span>
                            </div>

                            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3 group-hover:text-primary transition-colors">
                                {t('citizensFamilies')}
                            </h3>
                            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-6">
                                {t('citizensFamiliesDesc')}
                            </p>

                            <div className="space-y-2.5 pt-4 border-t border-border/60 mb-6 sm:mb-8 flex-1">
                                <div className="flex items-start gap-2 text-xs font-medium text-foreground/80">
                                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                    <span>{t('citizensPill1')}</span>
                                </div>
                                <div className="flex items-start gap-2 text-xs font-medium text-foreground/80">
                                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                    <span>{t('citizensPill2')}</span>
                                </div>
                                <div className="flex items-start gap-2 text-xs font-medium text-foreground/80">
                                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                    <span>{t('citizensPill3')}</span>
                                </div>
                            </div>

                            <Link href="/courses" className="mt-auto group/btn inline-flex items-center justify-center gap-2 w-full py-2.5 sm:py-3 px-4 rounded-xl bg-blue-500/10 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 text-xs sm:text-sm font-semibold border border-blue-500/20 transition-all duration-200">
                                <span>{t('viewCitizenPortal')}</span>
                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        {/* 2. Enterprises & Organizations */}
                        <div className="bg-card rounded-xl sm:rounded-2xl p-5 sm:p-8 border-2 border-primary shadow-lg shadow-primary/10 hover:shadow-2xl hover:shadow-primary/15 hover:-translate-y-2 transition-all duration-300 flex flex-col h-full relative group text-left">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-extrabold uppercase tracking-widest px-3.5 py-1 rounded-full shadow-md shadow-primary/30">
                                {t('primaryFocus')}
                            </div>

                            <div className="flex items-center justify-between mb-6 mt-1">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-primary/10 text-primary border border-primary/25 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
                                </div>
                                <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                                    {t('smallBusinessesBadge')}
                                </span>
                            </div>

                            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3 group-hover:text-primary transition-colors">
                                {t('smallBusinesses')}
                            </h3>
                            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-6">
                                {t('smallBusinessesDesc')}
                            </p>

                            <div className="space-y-2.5 pt-4 border-t border-border/60 mb-6 sm:mb-8 flex-1">
                                <div className="flex items-start gap-2 text-xs font-medium text-foreground/80">
                                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <span>{t('businessPill1')}</span>
                                </div>
                                <div className="flex items-start gap-2 text-xs font-medium text-foreground/80">
                                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <span>{t('businessPill2')}</span>
                                </div>
                                <div className="flex items-start gap-2 text-xs font-medium text-foreground/80">
                                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <span>{t('businessPill3')}</span>
                                </div>
                            </div>

                            <Link href="/resources" className="mt-auto group/btn inline-flex items-center justify-center gap-2 w-full py-2.5 sm:py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-semibold shadow-md shadow-primary/25 hover:shadow-lg transition-all duration-200">
                                <span>{t('exploreToolkits')}</span>
                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        {/* 3. Government & Critical Infrastructure */}
                        <div className="bg-card rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-border hover:border-emerald-500/40 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full group text-left">
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Landmark className="w-6 h-6 sm:w-7 sm:h-7" />
                                </div>
                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                    {t('governmentAgenciesBadge')}
                                </span>
                            </div>

                            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3 group-hover:text-primary transition-colors">
                                {t('governmentAgencies')}
                            </h3>
                            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-6">
                                {t('governmentAgenciesDesc')}
                            </p>

                            <div className="space-y-2.5 pt-4 border-t border-border/60 mb-6 sm:mb-8 flex-1">
                                <div className="flex items-start gap-2 text-xs font-medium text-foreground/80">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>{t('govPill1')}</span>
                                </div>
                                <div className="flex items-start gap-2 text-xs font-medium text-foreground/80">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>{t('govPill2')}</span>
                                </div>
                                <div className="flex items-start gap-2 text-xs font-medium text-foreground/80">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>{t('govPill3')}</span>
                                </div>
                            </div>

                            <Link href="/alerts" className="mt-auto group/btn inline-flex items-center justify-center gap-2 w-full py-2.5 sm:py-3 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 hover:text-white dark:text-emerald-400 text-xs sm:text-sm font-semibold border border-emerald-500/20 transition-all duration-200">
                                <span>{t('agencyLogin')}</span>
                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="relative mt-12 sm:mt-20 py-12 sm:py-20 px-4 sm:px-10 lg:px-14 rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white shadow-2xl border border-slate-800 text-center">
                {/* Luminous atmospheric accents */}
                <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 max-w-3xl mx-auto">
                    <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
                        {t('ctaReadyTitle')}
                    </h2>
                    <p className="mt-4 text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        {t('ctaReadyDesc')}
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
                        <Link href="/signup" aria-label="Create a free account" className="w-full sm:w-auto">
                            <Button variant="primary" size="lg" className="w-full sm:w-auto font-bold px-8 shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                                {tCommon('createFreeAccount')}
                            </Button>
                        </Link>
                        <Link href="/courses" aria-label="Explore cybersecurity resources" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-auto font-bold px-8 text-white bg-white/10 border border-white/25 hover:bg-white/20 hover:border-white/50 shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-0.5 transition-all backdrop-blur-md">
                                {tCommon('exploreCourses')}
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
