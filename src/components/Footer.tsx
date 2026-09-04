import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export const Footer: React.FC = () => {
    const t = useTranslations('footer');
    return (
        <footer className="w-full bg-card border-t border-border">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <img src="/logo.png" alt="INSA" className="h-6 w-6 object-contain" />
                        <span className="font-bold text-foreground">INSA Cyber Awareness</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                        {t('description')}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-6">
                        {/* Facebook */}
                        <a href="https://web.facebook.com/INSA.ETHIOPIA?_rdc=1&_rdr#" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors duration-200 transition-all duration-200">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                            </svg>
                        </a>
                        {/* Twitter/X */}
                        <a href="https://x.com/INSAEthio" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors duration-200 transition-all duration-200">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                        </a>
                        {/* LinkedIn */}
                        <a href="https://linkedin.com/company/information-network-security-agency/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors duration-200 transition-all duration-200">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                        </a>
                        {/* YouTube */}
                        <a href="https://www.youtube.com/channel/UCTc5kO3p6xAQSObDdx_Eg3w" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors duration-200 transition-all duration-200">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                        </a>
                        {/* Telegram */}
                        <a href="https://t.me/insagovet" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors duration-200 transition-all duration-200">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.686c.223-.195-.054-.304-.346-.108l-6.4 4.024-2.76-.86c-.6-.188-.61-.595.126-.884l10.78-4.152c.498-.19.925.108.78.821z" />
                            </svg>
                        </a>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">{t('platform')}</h4>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                        <li><Link href="/" className="hover:text-primary">{t('home')}</Link></li>
                        <li><Link href="/resources" className="hover:text-primary">{t('trainingResources')}</Link></li>
                        <li><Link href="/resources" className="hover:text-primary">{t('resources')}</Link></li>
                        <li><Link href="/alerts" className="hover:text-primary">{t('newsAndAlerts')}</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">{t('support')}</h4>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                        <li><Link href="/tools" className="hover:text-primary">{t('tools')}</Link></li>
                        <li><Link href="/contact" className="hover:text-primary">{t('contactUs')}</Link></li>
                        <li><Link href="/contact" className="hover:text-primary">{t('reportIncident')}</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">{t('legal')}</h4>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                        <li><Link href="/privacy" className="hover:text-primary">{t('privacyPolicy')}</Link></li>
                        <li><Link href="/terms" className="hover:text-primary">{t('termsOfService')}</Link></li>
                        <li><Link href="/accessibility" className="hover:text-primary">{t('accessibility')}</Link></li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-border mx-6 lg:mx-12 py-6 flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
                <p>{t('copyright')}</p>
                <div className="mt-4 md:mt-0">
                    <span className="text-green-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                        {t('systemOperational')}
                    </span>
                </div>
            </div>
        </footer>
    );
};
