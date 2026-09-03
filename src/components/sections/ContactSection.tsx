import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { PageHero } from '@/components/PageHero';
import { useTranslations } from 'next-intl';

interface ContactSectionProps {
    variant?: 'full' | 'home';
}

export function ContactSection({ variant = 'full' }: ContactSectionProps) {
    const t = useTranslations('common');

    if (variant === 'home') {
        return (
            <section className="py-20 px-6 lg:px-8 bg-card border-t border-border">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
                            {t('getInTouch')}
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            {t('getInTouchDesc')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
                        <div className="bg-muted rounded-2xl p-8 border border-border text-center hover:shadow-md shadow-black/10 dark:shadow-none transition-shadow">
                            <div className="text-orange-500 text-3xl mb-4">&#9993;</div>
                            <h4 className="font-semibold text-foreground mb-2">{t('emailSupport')}</h4>
                            <p className="text-sm text-muted-foreground mb-3">{t('emailSupportDesc')}</p>
                            <a href="mailto:support@cybersafenation.gov" className="text-primary font-medium text-sm hover:underline">
                                support@cybersafenation.gov
                            </a>
                        </div>

                        <div className="bg-muted rounded-2xl p-8 border border-orange-100 text-center hover:shadow-md shadow-black/10 dark:shadow-none transition-shadow">
                            <div className="text-orange-600 text-3xl mb-4">&#9742;</div>
                            <h4 className="font-semibold text-foreground mb-2">{t('emergencyHotline')}</h4>
                            <p className="text-sm text-muted-foreground mb-3">{t('emergencyHotlineDesc')}</p>
                            <a href="tel:+18005550199" className="text-orange-600 font-bold hover:underline tracking-wider">
                                1 (800) 555-0199
                            </a>
                        </div>

                        <div className="bg-muted rounded-2xl p-8 border border-border text-center hover:shadow-md shadow-black/10 dark:shadow-none transition-shadow">
                            <div className="text-muted-foreground text-3xl mb-4">&#127970;</div>
                            <h4 className="font-semibold text-foreground mb-2">{t('headquarters')}</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                                {t('headquartersAddress')}
                            </p>
                        </div>
                    </div>

                    <div className="text-center">
                        <Link href="/contact">
                            <Button variant="primary">{t('contactUs')} &rarr;</Button>
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <div className="flex flex-col bg-card min-h-screen">
            <PageHero
                title={t('howCanWeHelp')}
                description={t('howCanWeHelpDesc')}
                center
            />

            <section className="py-16 px-6 lg:px-8 max-w-6xl mx-auto w-full flex flex-col md:flex-row gap-16">
                {/* Left Side - Info */}
                <div className="w-full md:w-[350px] shrink-0 space-y-12">
                    <div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-6 pb-2 border-b border-border">
                            {t('directSupport')}
                        </h3>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="text-orange-500 mt-1">&#9993;</div>
                                <div>
                                    <h4 className="font-semibold text-foreground">{t('emailSupport')}</h4>
                                    <p className="text-sm text-muted-foreground mb-1">{t('emailSupportDesc')}</p>
                                    <a href="mailto:support@cybersafenation.gov" className="text-primary font-medium text-sm hover:underline">
                                        support@cybersafenation.gov
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                                <div className="text-orange-600 mt-1">&#9742;</div>
                                <div>
                                    <h4 className="font-semibold text-foreground">{t('emergencyHotline')}</h4>
                                    <p className="text-sm text-muted-foreground mb-1">{t('emergencyHotlineDesc')}</p>
                                    <a href="tel:+18005550199" className="text-orange-600 font-bold hover:underline tracking-wider">
                                        1 (800) 555-0199
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="text-muted-foreground mt-1">&#127970;</div>
                                <div>
                                    <h4 className="font-semibold text-foreground">{t('headquarters')}</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                                        {t('headquartersAddress')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-6 pb-2 border-b border-border">
                            {t('commonQuestions')}
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-border cursor-pointer group">
                                <span className="text-sm font-medium text-foreground group-hover:text-primary">{t('faqVerifyEmail')}</span>
                                <span className="text-muted-foreground">&#11163;</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border cursor-pointer group">
                                <span className="text-sm font-medium text-foreground group-hover:text-primary">{t('faqTrainingMandatory')}</span>
                                <span className="text-muted-foreground">&#11163;</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="flex-1">
                    <div className="bg-card border border-border rounded-2xl p-8 shadow-sm shadow-black/5 dark:shadow-none">
                        <h2 className="text-2xl font-bold text-foreground mb-2">{t('sendMessage')}</h2>
                        <p className="text-muted-foreground text-sm mb-8">{t('sendMessageDesc')}</p>

                        <form className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <Input label={t('firstName')} placeholder="Jane" required />
                                <Input label={t('lastName')} placeholder="Doe" required />
                            </div>

                            <Input label={t('workEmail')} type="email" placeholder="jane.doe@organization.com" required />

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">{t('subjectCategory')} <span className="text-primary">*</span></label>
                                <div className="relative">
                                    <select className="block w-full rounded-lg border border-border py-3 pl-3 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none bg-card">
                                        <option>{t('subjectGeneral')}</option>
                                        <option>{t('subjectReport')}</option>
                                        <option>{t('subjectTraining')}</option>
                                        <option>{t('subjectTechnical')}</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                                        &#11163;
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">{t('message')} <span className="text-primary">*</span></label>
                                <textarea
                                    rows={5}
                                    required
                                    placeholder={t('messagePlaceholder')}
                                    className="block w-full rounded-lg border border-border py-3 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                ></textarea>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="flex items-center h-5">
                                    <input id="consent" type="checkbox" className="w-4 h-4 text-primary bg-card border-border rounded focus:ring-primary focus:ring-2" required />
                                </div>
                                <label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed">
                                    {t.rich('privacyConsent', {
                                        privacyLink: <Link href="/about" className="text-primary hover:underline">{t('privacyPolicy')}</Link>
                                    })}
                                </label>
                            </div>

                            <Button type="button" className="bg-orange-500 hover:bg-orange-600 text-white px-8">
                                {t('sendMessage')}
                            </Button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
}
