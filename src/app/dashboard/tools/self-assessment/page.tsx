'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';

const questions = [
    {
        id: 1,
        question: 'How often do you update your software and operating systems?',
        options: [
            { text: 'As soon as an update is available', points: 3 },
            { text: 'Once a week', points: 2 },
            { text: 'Once a month', points: 1 },
            { text: 'Rarely or never', points: 0 }
        ]
    },
    {
        id: 2,
        question: 'Do you use different passwords for your main online accounts?',
        options: [
            { text: 'Yes, a unique password for every account', points: 3 },
            { text: 'For most important ones, yes', points: 2 },
            { text: 'I use a few variations of the same password', points: 1 },
            { text: 'I use the same password for everything', points: 0 }
        ]
    },
    {
        id: 3,
        question: 'Do you use Multi-Factor Authentication (MFA) on your accounts?',
        options: [
            { text: 'Yes, on every account that supports it', points: 3 },
            { text: 'Only on my banking and primary email', points: 2 },
            { text: 'I tried it once but found it inconvenient', points: 1 },
            { text: 'What is MFA?', points: 0 }
        ]
    },
    {
        id: 4,
        question: 'If you receive an email from a "Friend" asking for money urgently, what do you do?',
        options: [
            { text: 'Call them on a known number to verify', points: 3 },
            { text: 'Report the email as suspicious immediately', points: 2 },
            { text: 'Reply to the email to ask for more details', points: 1 },
            { text: 'Send the money if it seems like a real emergency', points: 0 }
        ]
    }
];

export default function DashboardSelfAssessmentPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    const handleAnswer = (points: number) => {
        const nextScore = score + points;
        if (currentStep < questions.length - 1) {
            setScore(nextScore);
            setCurrentStep(c => c + 1);
        } else {
            setScore(nextScore);
            setIsFinished(true);
        }
    };

    const getResult = () => {
        const maxScore = questions.length * 3;
        const percentage = (score / maxScore) * 100;

        if (percentage >= 90) return { title: 'Cyber Pro', desc: 'You have excellent security habits! Keep leading by example.', color: 'text-green-600', icon: '💎' };
        if (percentage >= 70) return { title: 'Security Conscious', desc: 'You are doing great, but there is still room for optimization.', color: 'text-blue-600', icon: '🛡️' };
        if (percentage >= 40) return { title: 'At Risk', desc: 'Your digital security needs immediate attention to better protect your data.', color: 'text-yellow-600', icon: '⚠️' };
        return { title: 'Highly Vulnerable', desc: 'Critical security gaps detected. Please review our basic training modules.', color: 'text-red-600', icon: '🚨' };
    };

    if (isFinished) {
        const result = getResult();
        return (
            <div className="min-h-screen bg-muted flex items-center justify-center p-6 text-center">
                <div className="max-w-xl w-full bg-card rounded-[3rem] shadow-2xl border border-border p-12 relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-primary via-secondary to-primary"></div>
                    <div className="text-6xl mb-6">{result.icon}</div>
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Your Assessment Result</h2>
                    <h3 className={`text-4xl font-extrabold mb-4 ${result.color}`}>{result.title}</h3>
                    <p className="text-muted-foreground mb-10 leading-relaxed text-lg">{result.desc}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                        <Link href="/dashboard/catalog" className="w-full">
                            <Button variant="primary" className="w-full py-4">View Recommended Modules</Button>
                        </Link>
                        <Link href="/dashboard" className="w-full">
                            <Button variant="outline" className="w-full py-4">Back to Dashboard</Button>
                        </Link>
                    </div>

                    <button
                        onClick={() => { setCurrentStep(0); setScore(0); setIsFinished(false); }}
                        className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
                    >
                        Retake Assessment
                    </button>
                </div>
            </div>
        );
    }

    const current = questions[currentStep];

    return (
        <div className="pb-20">
            <div className="bg-card border-b border-border rounded-2xl mb-8">
                <div className="max-w-4xl mx-auto px-6 lg:px-12 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground mb-1">Knowledge Assessment</h1>
                        <p className="text-sm text-muted-foreground">Benchmark your cybersecurity posture.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-primary font-mono">{((currentStep + 1) / questions.length * 100).toFixed(0)}%</span>
                        <div className="w-40 h-2 bg-muted/50 rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto mt-20">
                <div className="bg-card rounded-3xl shadow-sm shadow-black/5 dark:shadow-none border border-border p-10 md:p-16">
                    <span className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4 block">Question {currentStep + 1} of {questions.length}</span>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-12 leading-tight">
                        {current.question}
                    </h2>

                    <div className="space-y-4">
                        {current.options.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => handleAnswer(opt.points)}
                                className="w-full text-left p-6 rounded-2xl border border-border hover:border-primary/30 hover:bg-primary/[0.02] hover:shadow-md shadow-black/10 dark:shadow-none transition-all group flex items-center justify-between"
                            >
                                <span className="font-medium text-foreground group-hover:text-foreground">{opt.text}</span>
                                <span className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-[10px] group-hover:bg-primary group-hover:border-primary transition-colors text-transparent group-hover:text-white">✓</span>
                            </button>
                        ))}
                    </div>
                </div>

                <p className="mt-8 text-center text-xs text-muted-foreground italic">
                    All answers are confidential and used only to provide you with better learning recommendations.
                </p>
            </div>
        </div>
    );
}
