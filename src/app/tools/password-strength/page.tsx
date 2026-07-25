'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';

export default function PasswordStrengthPage() {
    const [password, setPassword] = useState('');
    const [strength, setStrength] = useState({
        score: 0,
        label: 'Too Weak',
        color: 'bg-gray-200',
        textColor: 'text-gray-400',
        feedback: 'Enter a password to check its strength.'
    });

    const checkStrength = (p: string) => {
        let s = 0;
        if (p.length > 8) s++;
        if (p.length > 12) s++;
        if (/[A-Z]/.test(p)) s++;
        if (/[0-9]/.test(p)) s++;
        if (/[^A-Za-z0-9]/.test(p)) s++;

        const labels = ['Too Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        const colors = ['bg-red-500', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400', 'bg-green-500'];
        const textColors = ['text-red-500', 'text-red-400', 'text-yellow-600', 'text-blue-500', 'text-green-500', 'text-green-600'];

        const feedbacks = [
            'Extremely vulnerable. Use at least 8 characters.',
            'Still vulnerable. Add numbers and symbols.',
            'Better, but could be stronger. Use more variety.',
            'Good password, but longer is always better.',
            'Strong password! Use this for important accounts.',
            'Excellent! This password is very hard to crack.'
        ];

        setStrength({
            score: s,
            label: labels[s] || labels[0],
            color: colors[s] || colors[0],
            textColor: textColors[s] || textColors[0],
            feedback: feedbacks[s] || feedbacks[0]
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const p = e.target.value;
        setPassword(p);
        checkStrength(p);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-6 lg:px-12 py-10 text-center">
                    <Link href="/dashboard" className="text-sm text-gray-500 hover:text-primary mb-4 inline-flex items-center gap-1 transition-colors">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-extrabold text-gray-900 mt-2">Password Strength Checker</h1>
                    <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
                        High-strength passwords are your first line of defense. Test your password resilience against modern brute-force techniques.
                    </p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 mt-12">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Check your password</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl text-lg focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
                                    placeholder="Type a password..."
                                    value={password}
                                    onChange={handleChange}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">
                                    {password ? (strength.score >= 4 ? '🛡️' : strength.score >= 2 ? '⚠️' : '❌') : '⌨️'}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Strength Rank</span>
                                <span className={`text-sm font-bold uppercase tracking-widest ${strength.textColor}`}>{strength.label}</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        className={`flex-1 h-full transition-all duration-500 ${i <= strength.score ? strength.color : 'bg-gray-100'}`}
                                    />
                                ))}
                            </div>
                            <p className="mt-3 text-sm text-gray-700 text-center font-medium">{strength.feedback}</p>
                        </div>

                        <div className="pt-6 border-t border-gray-50 grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border ${password.length >= 12 ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-600">Length &gt; 12</span>
                                    {password.length >= 12 && <span className="text-green-600 font-bold text-base">✓</span>}
                                </div>
                            </div>
                            <div className={`p-4 rounded-xl border ${/[A-Z]/.test(password) ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-600">Uppercase</span>
                                    {/[A-Z]/.test(password) && <span className="text-green-600 font-bold text-base">✓</span>}
                                </div>
                            </div>
                            <div className={`p-4 rounded-xl border ${/[0-9]/.test(password) ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-600">Numbers</span>
                                    {/[0-9]/.test(password) && <span className="text-green-600 font-bold text-base">✓</span>}
                                </div>
                            </div>
                            <div className={`p-4 rounded-xl border ${/[^A-Za-z0-9]/.test(password) ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-600">Symbols</span>
                                    {/[^A-Za-z0-9]/.test(password) && <span className="text-green-600 font-bold text-base">✓</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 bg-secondary rounded-2xl p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm italic">i</span>
                            Best Practices
                        </h3>
                        <ul className="space-y-3 text-gray-300 text-sm">
                            <li className="flex gap-3">
                                <span className="text-primary font-bold">01</span>
                                Use a passphrase rather than a single word (e.g., "Mym0useEat5Ch33se!").
                            </li>
                            <li className="flex gap-3">
                                <span className="text-primary font-bold">02</span>
                                Avoid using personal information like birthdays or pet names.
                            </li>
                            <li className="flex gap-3">
                                <span className="text-primary font-bold">03</span>
                                Use a unique password for every single account you own.
                            </li>
                            <li className="flex gap-3">
                                <span className="text-primary font-bold">04</span>
                                Enable Multi-Factor Authentication (MFA) whenever possible.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
