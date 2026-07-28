import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { AboutSection } from '@/components/sections/AboutSection';
import { ContactSection } from '@/components/sections/ContactSection';
import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('landing');
  const tCommon = useTranslations('common');
  return (
    <div className="w-full flex-col flex bg-card">
      {/* Hero Section */}
      <section className="relative overflow-hidden w-full px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center flex flex-col items-center"
        style={{ backgroundImage: "url('/background.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* Dark overlay for text legibility */}
        <div className="absolute inset-0 bg-black/60 z-0" />

        <span className="relative z-10 text-primary text-xs font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
          {t('officialPortal')}
        </span>

        <h1 className="relative z-10 mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-6xl max-w-3xl">
          {t.rich('heroTitle', {
            highlight: (chunks) => <span className="text-primary">{chunks}</span>
          })}
        </h1>

        <p className="relative z-10 mt-6 text-lg leading-8 text-gray-300 max-w-2xl">
          {t('heroSubtitle')}
        </p>

        <div className="relative z-10 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/courses" aria-label="Explore Courses">
            <Button variant="primary" size="lg">{tCommon('exploreCourses')} &rarr;</Button>
          </Link>
          <Link href="/login" aria-label="Sign In to your account">
            <Button variant="outline" size="lg" className="border-border text-white hover:bg-white/10">{tCommon('signIn')}</Button>
          </Link>
        </div>

        <div className="relative z-10 mt-16 pt-8 border-t border-white/20 flex flex-wrap justify-center gap-x-12 gap-y-4 text-xs font-semibold text-gray-300 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <svg className="w-3 h-3 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            {t('citizenHub')}
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-3 h-3 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {t('latestAlerts')}
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-3 h-3 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {t('reportIncident')}
          </div>
        </div>
      </section>

      {/* Strategic Pillars */}
      <section className="py-24 bg-muted px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t('strategicPillars')}</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            {t('strategicPillarsDesc')}
          </p>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Pillar 1 */}
            <div className="bg-card rounded-2xl p-8 shadow-sm shadow-black/5 dark:shadow-none border border-border text-left hover:shadow-md shadow-black/10 dark:shadow-none transition-shadow cursor-pointer hover:-translate-y-1 transition-all duration-200 ease-in-out">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-primary flex items-center justify-center mb-6">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground">{t('pillar1Title')}</h3>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed mb-6">
                {t('pillar1Desc')}
              </p>
              <Link href="/courses" className="text-primary font-semibold text-sm hover:underline flex items-center gap-1" aria-label="Explore educational modules">
                {tCommon('exploreModules')} &rarr;
              </Link>
            </div>

            {/* Pillar 2 */}
            <div className="bg-card rounded-2xl p-8 shadow-sm shadow-black/5 dark:shadow-none border border-border text-left hover:shadow-md shadow-black/10 dark:shadow-none transition-shadow cursor-pointer hover:-translate-y-1 transition-all duration-200 ease-in-out">
              <div className="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center mb-6">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground">{t('pillar2Title')}</h3>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed mb-6">
                {t('pillar2Desc')}
              </p>
              <Link href="/dashboard" className="text-yellow-600 font-semibold text-sm hover:underline flex items-center gap-1" aria-label="View latest security alerts">
                {tCommon('viewLatestAlerts')} &rarr;
              </Link>
            </div>

            {/* Pillar 3 */}
            <div className="bg-card rounded-2xl p-8 shadow-sm shadow-black/5 dark:shadow-none border border-border text-left hover:shadow-md shadow-black/10 dark:shadow-none transition-shadow cursor-pointer hover:-translate-y-1 transition-all duration-200 ease-in-out">
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-6">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground">{t('pillar3Title')}</h3>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed mb-6">
                {t('pillar3Desc')}
              </p>
              <Link href="/tools" className="text-green-600 font-semibold text-sm hover:underline flex items-center gap-1" aria-label="Explore security tools">
                {tCommon('exploreTools')} &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tailored Guidance */}
      <section className="py-24 bg-card px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          <div className="lg:col-span-1">
            <span className="text-primary text-xs font-bold tracking-widest uppercase mb-4 block">{t('sectorSpecific')}</span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t('tailoredGuidance')}</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {t('tailoredGuidanceDesc')}
            </p>
            <Link href="/resources" aria-label="View all resource categories">
              <Button variant="outline" className="mt-8">{tCommon('viewAllCategories')}</Button>
            </Link>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div className="bg-muted rounded-2xl p-6 border border-border hover:shadow-md shadow-black/10 dark:shadow-none hover:border-primary/30 transition-all group cursor-pointer">
              <h4 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{t('incidentPlaybooks')}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">{t('incidentPlaybooksDesc')}</p>
            </div>
            <div className="bg-muted rounded-2xl p-6 border border-border hover:shadow-md shadow-black/10 dark:shadow-none hover:border-primary/30 transition-all group cursor-pointer">
              <h4 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{t('complianceFrameworks')}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">{t('complianceFrameworksDesc')}</p>
            </div>
            <div className="bg-muted rounded-2xl p-6 border border-border hover:shadow-md shadow-black/10 dark:shadow-none hover:border-primary/30 transition-all group cursor-pointer">
              <h4 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{t('threatModeling')}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">{t('threatModelingDesc')}</p>
            </div>
            <div className="bg-muted rounded-2xl p-6 border border-border hover:shadow-md shadow-black/10 dark:shadow-none hover:border-primary/30 transition-all group cursor-pointer">
              <h4 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{t('securityKits')}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">{t('securityKitsDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Threat Alerts */}
      <section className="py-24 bg-muted px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span> {t('recentThreatAlerts')}
            </h2>
            <Link href="/dashboard" className="text-sm font-semibold text-muted-foreground hover:text-foreground" aria-label="View all threat alerts">
              {t('viewAllAlerts')} &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card p-6 border-t-4 border-red-500 rounded-b-xl shadow-sm shadow-black/5 dark:shadow-none hover:shadow-md shadow-black/10 dark:shadow-none hover:scale-[1.01] transition-all duration-300 group cursor-pointer hover:-translate-y-1 transition-all duration-200 ease-in-out">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-red-500 uppercase tracking-wider bg-red-50 px-2 py-1 rounded">{t('criticalAlert')}</span>
                <span className="text-xs text-muted-foreground">{t('timeHourAgo')}</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{t('alertRansomware')}</h4>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{t('alertRansomwareDesc')}</p>
              <Link href="/dashboard" className="text-xs font-semibold text-foreground underline group-hover:text-primary transition-colors" aria-label="Read details about Global Ransomware Campaign alert">
                {t('readDetails')} &rarr;
              </Link>
            </div>

            <div className="bg-card p-6 border-t-4 border-yellow-500 rounded-b-xl shadow-sm shadow-black/5 dark:shadow-none hover:shadow-md shadow-black/10 dark:shadow-none hover:scale-[1.01] transition-all duration-300 group cursor-pointer hover:-translate-y-1 transition-all duration-200 ease-in-out">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider bg-yellow-50 px-2 py-1 rounded">{t('highAlert')}</span>
                <span className="text-xs text-muted-foreground">{t('timeHoursAgo')}</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">{t('alertPhishing')}</h4>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{t('alertPhishingDesc')}</p>
              <Link href="/dashboard" className="text-xs font-semibold text-foreground underline" aria-label="Read details about Tax Season Phishing alert">
                {t('readDetails')} &rarr;
              </Link>
            </div>

            <div className="bg-card p-6 border-t-4 border-blue-500 rounded-b-xl shadow-sm shadow-black/5 dark:shadow-none">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded">{t('updateAlert')}</span>
                <span className="text-xs text-muted-foreground">{t('timeDayAgo')}</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">{t('alertBrowserPatch')}</h4>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{t('alertBrowserPatchDesc')}</p>
              <Link href="/dashboard" className="text-xs font-semibold text-foreground underline" aria-label="Read details about Browser Security Patch update">
                {t('readDetails')} &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      <AboutSection variant="home" />
      <ContactSection variant="home" />

      {/* CTA Footer Section */}
      <section className="relative py-24 bg-secondary px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
        {/* Subtle gradient overlay to ensure contrast against background */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60 pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl drop-shadow-md">
            {t('ctaTitle')}
          </h2>
          <p className="mt-6 text-xl text-gray-100 max-w-2xl mx-auto drop-shadow-sm font-medium leading-relaxed">
            {t('ctaDesc')}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" aria-label="Create a free account">
              <Button variant="primary" size="lg" className="w-full sm:w-auto font-bold shadow-lg shadow-black/10 dark:shadow-none hover:shadow-xl hover:-translate-y-0.5 transition-all">
                {tCommon('createFreeAccount')}
              </Button>
            </Link>
            <Link href="/resources" aria-label="Explore cybersecurity resources">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-white bg-white/10 border-white/30 hover:bg-white/25 hover:border-white/60 font-bold shadow-lg shadow-black/10 dark:shadow-none hover:shadow-xl hover:-translate-y-0.5 transition-all backdrop-blur-sm">
                Explore Resources
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
