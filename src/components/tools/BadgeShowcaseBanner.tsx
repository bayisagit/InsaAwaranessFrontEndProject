'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Target,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
  X,
  CheckCircle2,
  Lock,
  ChevronRight,
  Zap,
} from 'lucide-react';

export interface BadgeItem {
  id: string;
  name: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Mastery';
  xp: number;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeBg: string;
  glowColor: string;
  tagline: string;
  description: string;
  requirement: string;
  actionText: string;
  targetToolSlug: string;
}

const BADGES: BadgeItem[] = [
  {
    id: 'phishing-hunter',
    name: 'Phishing Hunter',
    tier: 'Silver',
    xp: 150,
    icon: Target,
    accentColor: 'text-amber-400',
    badgeBg: 'bg-amber-400/15 border-amber-400/30 text-amber-300',
    glowColor: 'shadow-amber-500/20',
    tagline: 'Email & Link Threat Detection',
    description:
      'Awarded to defenders who identify deceptive emails, suspicious senders, and spear-phishing cues in real time.',
    requirement:
      'Launch the Phishing Simulator tool, examine incoming test emails, and accurately flag phishing indicators.',
    actionText: 'Launch Phishing Simulator',
    targetToolSlug: 'phishing',
  },
  {
    id: 'password-shield',
    name: 'Password Shield',
    tier: 'Bronze',
    xp: 100,
    icon: ShieldCheck,
    accentColor: 'text-cyan-400',
    badgeBg: 'bg-cyan-400/15 border-cyan-400/30 text-cyan-300',
    glowColor: 'shadow-cyan-500/20',
    tagline: 'Entropy & Passphrase Defense',
    description:
      'Awarded for mastering credential resilience, entropy principles, and robust multi-factor defense practices.',
    requirement:
      'Use the Password Strength Tester to analyze credentials and formulate a 16+ character high-entropy passphrase.',
    actionText: 'Test Password Strength',
    targetToolSlug: 'password-strength',
  },
  {
    id: 'awareness-graduate',
    name: 'Awareness Graduate',
    tier: 'Gold',
    xp: 250,
    icon: GraduationCap,
    accentColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-400/15 border-emerald-400/30 text-emerald-300',
    glowColor: 'shadow-emerald-500/20',
    tagline: 'Cyber Hygiene Assessment Mastery',
    description:
      'Awarded to users who demonstrate comprehensive cyber hygiene proficiency across multiple security domains.',
    requirement:
      'Complete the official Cyber Hygiene Self-Assessment questionnaire and achieve a passing score of 80% or higher.',
    actionText: 'Take Self-Assessment',
    targetToolSlug: 'self-assessment',
  },
  {
    id: 'cyber-sentinel',
    name: 'Cyber Sentinel',
    tier: 'Mastery',
    xp: 300,
    icon: Sparkles,
    accentColor: 'text-purple-400',
    badgeBg: 'bg-purple-400/15 border-purple-400/30 text-purple-300',
    glowColor: 'shadow-purple-500/20',
    tagline: 'Continuous Defense & Vigilance',
    description:
      'Recognized as an active cyber defender who continuously hones defenses through structured awareness courses.',
    requirement:
      'Enroll in and complete certified awareness training courses in the National Cybersecurity curriculum.',
    actionText: 'Explore Security Courses',
    targetToolSlug: 'courses',
  },
];

interface BadgeShowcaseBannerProps {
  isDashboard?: boolean;
}

export function BadgeShowcaseBanner({ isDashboard = false }: BadgeShowcaseBannerProps) {
  const router = useRouter();
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  // Check locally completed tools / badges
  useEffect(() => {
    try {
      const stored = localStorage.getItem('insa_completed_tools');
      if (stored) {
        const completedTools: string[] = JSON.parse(stored);
        const earned: string[] = [];
        if (completedTools.includes('phishing')) earned.push('phishing-hunter');
        if (completedTools.includes('password-strength')) earned.push('password-shield');
        if (completedTools.includes('self-assessment')) earned.push('awareness-graduate');
        setUnlockedIds(earned);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const getToolHref = (slug: string) => {
    if (slug === 'courses') return isDashboard ? '/dashboard/catalog' : '/courses';
    const prefix = isDashboard ? '/dashboard/tools' : '/tools';
    return `${prefix}/${slug}`;
  };

  const handleLaunchChallenge = (badge: BadgeItem) => {
    const href = getToolHref(badge.targetToolSlug);
    setSelectedBadge(null);
    router.push(href);
  };

  return (
    <>
      <div className="mt-20 bg-gradient-to-br from-primary via-blue-700 to-indigo-900 rounded-[2.5rem] p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl shadow-primary/20 border border-white/10">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-28 -mt-28 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-400/10 rounded-full -ml-28 -mb-28 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Top Pill & Stats */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-xs">
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              Gamified Cyber Awareness & Badges
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-blue-100 bg-black/20 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/10">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{unlockedIds.length} of {BADGES.length} Badges Unlocked</span>
            </div>
          </div>

          {/* Heading and Description */}
          <div className="max-w-2xl mb-8">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3 text-white">
              Earn Verified Badges While You Learn
            </h3>
            <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed">
              Completing practical awareness tools, phishing simulations, and quizzes awards points and auditable badges to your profile. Click any badge below to see how to earn it!
            </p>
          </div>

          {/* Interactive Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
            {BADGES.map((badge) => {
              const Icon = badge.icon;
              const isUnlocked = unlockedIds.includes(badge.id);

              return (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`group relative text-left p-4 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 hover:border-white/30 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${badge.glowColor} cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${badge.badgeBg} group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${badge.accentColor}`} />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/10">
                        +{badge.xp} XP
                      </span>
                      {isUnlocked ? (
                        <span title="Unlocked"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></span>
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-white/40 group-hover:text-white/70 transition-colors" />
                      )}
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1 group-hover:text-amber-200 transition-colors">
                    {badge.name}
                  </h4>
                  <p className="text-xs text-blue-100/80 line-clamp-1 mb-2">
                    {badge.tagline}
                  </p>

                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/70 group-hover:text-white group-hover:underline">
                    <span>Inspect Criteria</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer CTA & Direct Navigation */}
          <div className="pt-6 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-blue-100/80 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Badges are automatically awarded upon test or simulation completion.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setSelectedBadge(BADGES[0])}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-primary hover:bg-blue-50 shadow-md shadow-black/10 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
              >
                <span>Explore All Badges</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <Link
                href={isDashboard ? '/dashboard' : '/profile'}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
              >
                <span>My Security Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Badge Detail Modal */}
      {selectedBadge && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="relative w-full max-w-lg bg-card text-foreground rounded-3xl p-6 sm:p-8 border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Medallion Display */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-4">
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center ${selectedBadge.badgeBg} shadow-xl ${selectedBadge.glowColor}`}>
                  {React.createElement(selectedBadge.icon, {
                    className: `w-10 h-10 sm:w-12 sm:h-12 ${selectedBadge.accentColor}`,
                  })}
                </div>
                {unlockedIds.includes(selectedBadge.id) ? (
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-md">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="absolute -bottom-2 -right-2 bg-muted text-muted-foreground p-1 rounded-full border border-border shadow-md">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                  {selectedBadge.tier} Tier
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  +{selectedBadge.xp} XP Reward
                </span>
              </div>

              <h3 className="text-2xl font-extrabold text-foreground mb-1">
                {selectedBadge.name}
              </h3>
              <p className="text-sm text-primary font-medium">
                {selectedBadge.tagline}
              </p>
            </div>

            {/* Lore & Criteria */}
            <div className="space-y-4 mb-6 text-sm">
              <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Badge Lore
                </h4>
                <p className="text-foreground leading-relaxed">
                  {selectedBadge.description}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  How to Unlock This Badge
                </h4>
                <p className="text-foreground text-xs sm:text-sm leading-relaxed">
                  {selectedBadge.requirement}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => handleLaunchChallenge(selectedBadge)}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <span>{selectedBadge.actionText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
