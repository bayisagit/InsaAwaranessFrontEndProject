'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { PageHero } from '@/components/PageHero';
import { useTranslations } from 'next-intl';
import { Turnstile } from '@marsidev/react-turnstile';
import { createContactMessage } from '@/lib/api';

interface ContactSectionProps {
    variant?: 'full' | 'home';
}

export function ContactSection({ variant = 'full' }: ContactSectionProps) {
    const t = useTranslations('common');
    
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [workEmail, setWorkEmail] = useState('');
    const [subjectCategory, setSubjectCategory] = useState(t('subjectGeneral'));
    const [message, setMessage] = useState('');
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!captchaToken) {
            setErrorMsg("Please complete the CAPTCHA verification.");
            return;
        }

        setIsSubmitting(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            await createContactMessage({
                first_name: firstName,
                last_name: lastName,
                work_email: workEmail,
                subject_category: subjectCategory,
                message,
                cf_turnstile_response: captchaToken
            });
            setSuccessMsg("Your message has been sent successfully. We will get back to you shortly.");
            // Reset form
            setFirstName('');
            setLastName('');
            setWorkEmail('');
            setMessage('');
            // Reset turnstile is handled by re-rendering or user action if necessary
        } catch (error: any) {
            setErrorMsg(error.message || "Failed to send message. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

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
                            {/* FAQ 1 */}
                            <div className="border-b border-border pb-2">
                                <div 
                                    className="flex justify-between items-center cursor-pointer group"
                                    onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
                                >
                                    <span className="text-sm font-medium text-foreground group-hover:text-primary">{t('faqVerifyEmail')}</span>
                                    <span className={`text-muted-foreground transition-transform duration-200 ${openFaq === 1 ? 'rotate-180' : ''}`}>&#11163;</span>
                                </div>
                                {openFaq === 1 && (
                                    <div className="mt-3 text-sm text-muted-foreground leading-relaxed">
                                        You can verify a government email by ensuring it ends with the official ".gov.et" domain. If you are unsure, you can contact the IT support desk or refer to our directory.
                                    </div>
                                )}
                            </div>

                            {/* FAQ 2 */}
                            <div className="border-b border-border pb-2">
                                <div 
                                    className="flex justify-between items-center cursor-pointer group"
                                    onClick={() => setOpenFaq(openFaq === 2 ? null : 2)}
                                >
                                    <span className="text-sm font-medium text-foreground group-hover:text-primary">{t('faqTrainingMandatory')}</span>
                                    <span className={`text-muted-foreground transition-transform duration-200 ${openFaq === 2 ? 'rotate-180' : ''}`}>&#11163;</span>
                                </div>
                                {openFaq === 2 && (
                                    <div className="mt-3 text-sm text-muted-foreground leading-relaxed">
                                        Yes, basic cybersecurity awareness training is mandatory for all active employees. Please log into your dashboard to check your progress and complete pending modules.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="flex-1">
                    <div className="bg-card border border-border rounded-2xl p-8 shadow-sm shadow-black/5 dark:shadow-none">
                        <h2 className="text-2xl font-bold text-foreground mb-2">{t('sendMessage')}</h2>
                        <p className="text-muted-foreground text-sm mb-8">{t('sendMessageDesc')}</p>

                        {successMsg && (
                            <div className="mb-6 p-4 bg-green-50/50 border border-green-200 text-green-700 rounded-lg text-sm flex items-start gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 mt-0.5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>{successMsg}</span>
                            </div>
                        )}

                        {errorMsg && (
                            <div className="mb-6 p-4 bg-red-50/50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 mt-0.5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <Input label={t('firstName')} placeholder="Jane" required value={firstName} onChange={e => setFirstName(e.target.value)} disabled={isSubmitting} />
                                <Input label={t('lastName')} placeholder="Doe" required value={lastName} onChange={e => setLastName(e.target.value)} disabled={isSubmitting} />
                            </div>

                            <Input label={t('workEmail')} type="email" placeholder="jane.doe@organization.com" required value={workEmail} onChange={e => setWorkEmail(e.target.value)} disabled={isSubmitting} />

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">{t('subjectCategory')} <span className="text-primary">*</span></label>
                                <div className="relative">
                                    <select 
                                        className="block w-full rounded-lg border border-border py-3 pl-3 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none bg-card"
                                        value={subjectCategory}
                                        onChange={e => setSubjectCategory(e.target.value)}
                                        disabled={isSubmitting}
                                    >
                                        <option value={t('subjectGeneral')}>{t('subjectGeneral')}</option>
                                        <option value={t('subjectReport')}>{t('subjectReport')}</option>
                                        <option value={t('subjectTraining')}>{t('subjectTraining')}</option>
                                        <option value={t('subjectTechnical')}>{t('subjectTechnical')}</option>
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
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    disabled={isSubmitting}
                                ></textarea>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="flex items-center h-5">
                                    <input id="consent" type="checkbox" className="w-4 h-4 text-primary bg-card border-border rounded focus:ring-primary focus:ring-2" required disabled={isSubmitting} />
                                </div>
                                <label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed">
                                    {t.rich('privacyConsent', {
                                        privacyLink: (chunks) => <Link href="/about" className="text-primary hover:underline">{chunks}</Link>
                                    })}
                                </label>
                            </div>

                            <div className="flex justify-center sm:justify-start">
                                <Turnstile
                                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                                    onSuccess={(token) => setCaptchaToken(token)}
                                    onError={() => setCaptchaToken(null)}
                                    onExpire={() => setCaptchaToken(null)}
                                />
                            </div>

                            <Button type="submit" disabled={isSubmitting || !captchaToken} className="bg-orange-500 hover:bg-orange-600 text-white px-8">
                                {isSubmitting ? 'Sending...' : t('sendMessage')}
                            </Button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
}
