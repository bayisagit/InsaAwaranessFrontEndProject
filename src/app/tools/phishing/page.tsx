'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { PageHero } from '@/components/PageHero';

const scenarios = [
 {
 id: 1,
 sender: 'Security Team <security@it-support-portal.com>',
 subject: 'Urgent: Unauthorized Login Attempt',
 date: 'Today, 10:42 AM',
 content: 'We detected a suspicious login attempt on your account from an unrecognized device in Moscow, Russia. If this was not you, please click the button below to secure your account immediately.',
 cta: 'Secure My Account Now',
 isPhishing: true,
 reason: 'The sender address "it-support-portal.com" is suspicious and not our official domain. Also, the urgent tone and request to click a link are common phishing indicators.',
 hints: ['Check the sender domain carefully.', 'Look for generic greetings.', 'Is there a sense of artificial urgency?']
 },
 {
 id: 2,
 sender: 'Internal Communications <internal@company.gov.et>',
 subject: 'Reminder: New HR Policy Document',
 date: 'Yesterday, 2:15 PM',
 content: 'Hello Team, this is a reminder to review the updated HR policy regarding remote work for the next quarter. You can find the document in the internal portal under /documents/hr/policies_2024.pdf.',
 cta: 'View Internal Portal',
 isPhishing: false,
 reason: 'The sender domain "company.gov.et" is official. It directs you to browse an internal portal path rather than a clickable external link.',
 hints: ['Internal portals are usually safe.', 'The tone is professional and non-urgent.']
 },
 {
 id: 3,
 sender: 'Tax Authority <refunds@tax-gov-et.net>',
 subject: 'Notice of Tax Refund',
 date: '2 days ago',
 content: 'Congratulations! You are eligible for a tax refund of 4,500 ETB. To process your payment, please provide your bank details by clicking below. This offer expires in 24 hours.',
 cta: 'Claim Refund',
 isPhishing: true,
 reason: 'Government agencies typically do not use .net domains. Asking for bank details via email link and a 24-hour deadline are major red flags.',
 hints: ['Check the domain extension (.net vs .gov).', 'Government agencies rarely email about refunds this way.']
 }
];

export default function PhishingSimulationPage() {
 const [currentStep, setCurrentStep] = useState(0);
 const [score, setScore] = useState(0);
 const [showResult, setShowResult] = useState(false);
 const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
 const [isFinished, setIsFinished] = useState(false);

 const handleAnswer = (answer: boolean) => {
 if (selectedAnswer !== null) return;
 setSelectedAnswer(answer);
 if (answer === scenarios[currentStep].isPhishing) {
 setScore(s => s + 1);
 }
 setShowResult(true);
 };

 const nextStep = () => {
 if (currentStep < scenarios.length - 1) {
 setCurrentStep(c => c + 1);
 setSelectedAnswer(null);
 setShowResult(false);
 } else {
 setIsFinished(true);
 }
 };

 if (isFinished) {
 return (
 <div className="min-h-screen bg-muted flex items-center justify-center p-6">
 <div className="max-w-md w-full bg-card rounded-3xl shadow-xl border border-border p-10 text-center">
 <div className="text-6xl mb-6">{score === scenarios.length ? '🏆' : '📊'}</div>
 <h2 className="text-3xl font-extrabold text-foreground mb-2">Simulation Complete</h2>
 <p className="text-muted-foreground mb-8">You identified {score} out of {scenarios.length} threats correctly.</p>
 <div className="space-y-4">
 <Link href="/dashboard"><Button variant="primary" className="w-full py-4">Return to Dashboard</Button></Link>
 <button onClick={() => { setCurrentStep(0); setScore(0); setIsFinished(false); setSelectedAnswer(null); setShowResult(false); }} className="text-sm font-semibold text-primary hover:underline cursor-pointer">Try Again</button>
 </div>
 </div>
 </div>
 );
 }

 const current = scenarios[currentStep];

 return (
 <div className="min-h-screen bg-muted pb-20">
 <PageHero
 title="Phishing Simulation"
 description="Test your ability to spot malicious emails."
 actions={
 <div className="flex items-center gap-4">
 <div className="text-right">
 <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest block">Progress</span>
 <span className="font-bold text-white">{currentStep + 1} / {scenarios.length}</span>
 </div>
 <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
 <div className="h-full bg-primary transition-all duration-500" style={{ width: `${((currentStep + 1) / scenarios.length) * 100}%` }}></div>
 </div>
 </div>
 }
 />

 <div className="max-w-4xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Email Interface */}
 <div className="lg:col-span-2">
 <div className="bg-card rounded-2xl shadow-lg shadow-black/10 dark:shadow-none border border-border overflow-hidden">
 <div className="bg-muted px-6 py-4 border-b border-border flex items-center gap-2">
 <div className="flex gap-1.5">
 <div className="w-3 h-3 rounded-full bg-red-400"></div>
 <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
 <div className="w-3 h-3 rounded-full bg-green-400"></div>
 </div>
 <span className="text-xs font-semibold text-muted-foreground ml-2">Inbox — {current.sender.split('<')[0]}</span>
 </div>

 <div className="p-8">
 <div className="mb-8">
 <h2 className="text-xl font-bold text-foreground mb-4">{current.subject}</h2>
 <div className="flex items-start gap-4 text-sm">
 <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
 {current.sender[0]}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex justify-between items-center mb-1">
 <span className="font-bold text-foreground truncate">{current.sender}</span>
 <span className="text-xs text-muted-foreground shrink-0">{current.date}</span>
 </div>
 <span className="text-xs text-muted-foreground">To: You &lt;citizen@nation.et&gt;</span>
 </div>
 </div>
 </div>

 <div className="text-foreground leading-relaxed mb-10 whitespace-pre-wrap">
 {current.content}
 </div>

 <div className="inline-block px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md shadow-black/10 dark:shadow-none cursor-pointer hover:bg-blue-700 transition-colors">
 {current.cta}
 </div>
 </div>

 {/* Analysis / Result */}
 {showResult && (
 <div className={`p-8 border-t-4 ${selectedAnswer === current.isPhishing ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
 <div className="flex items-center gap-3 mb-3">
 <span className="text-2xl">{selectedAnswer === current.isPhishing ? '✅' : '❌'}</span>
 <h4 className="font-bold text-foreground">
 {selectedAnswer === current.isPhishing ? 'Correct! You spotted it.' : 'Oops! This was a threat.'}
 </h4>
 </div>
 <p className="text-sm text-foreground leading-relaxed mb-6">
 {current.reason}
 </p>
 <Button onClick={nextStep} variant="primary">
 {currentStep === scenarios.length - 1 ? 'Finish Simulation' : 'Next Scenario →'}
 </Button>
 </div>
 )}
 </div>

 {!showResult && (
 <div className="mt-8 flex justify-center gap-4">
 <button
 onClick={() => handleAnswer(true)}
 className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-black/10 dark:shadow-none transition-all scale-100 hover:scale-105 active:scale-95 cursor-pointer"
 >
 This is Phishing 🚩
 </button>
 <button
 onClick={() => handleAnswer(false)}
 className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl shadow-lg shadow-black/10 dark:shadow-none transition-all scale-100 hover:scale-105 active:scale-95 cursor-pointer"
 >
 This is Legitimate ✅
 </button>
 </div>
 )}
 </div>

 {/* Sidebar - Hints */}
 <div className="lg:col-span-1">
 <div className="bg-card rounded-2xl p-6 border border-border shadow-sm shadow-black/5 dark:shadow-none sticky top-24">
 <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
 <span className="text-yellow-500 text-xl">💡</span> Hints
 </h3>
 <ul className="space-y-4">
 {current.hints.map((hint, i) => (
 <li key={i} className="flex gap-3 text-sm text-muted-foreground italic">
 <span className="text-gray-300">•</span>
 {hint}
 </li>
 ))}
 </ul>
 <div className="mt-10 p-4 bg-blue-50 rounded-xl border border-blue-100">
 <p className="text-xs text-blue-700 leading-relaxed">
 <strong>Pro-tip:</strong> When in doubt, hover over links to see the real destination URL without clicking.
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
