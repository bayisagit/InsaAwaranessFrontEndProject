import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';

interface AboutSectionProps {
    variant?: 'full' | 'home';
}

export function AboutSection({ variant = 'full' }: AboutSectionProps) {

    if (variant === 'home') {
        return (
            <section className="py-20 px-6 lg:px-8 bg-gray-50 border-t border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="text-primary text-xs font-bold tracking-widest uppercase mb-4 inline-block">
                            NATIONAL INITIATIVE
                        </span>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
                            About INSA Cyber Awareness
                        </h2>
                        <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            The National Cyber Security Awareness Portal is the central authority dedicated to building
                            a resilient, secure, and informed digital society for all citizens. Through proactive education,
                            threat intelligence sharing, and public-private partnerships, we empower every citizen to
                            defend against cyber threats.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
                            <span className="text-4xl font-bold text-primary mb-2 block">24/7</span>
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Threat Monitoring</span>
                        </div>
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
                            <span className="text-4xl font-bold text-primary mb-2 block">12M+</span>
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Citizens Empowered</span>
                        </div>
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
                            <span className="text-4xl font-bold text-primary mb-2 block">98%</span>
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Uptime Guarantee</span>
                        </div>
                    </div>

                    <div className="text-center">
                        <Link href="/about">
                            <Button variant="outline">Learn More About Us &rarr;</Button>
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <div className="flex flex-col bg-white">
            {/* Hero Section */}
            <section className="relative px-6 py-24 sm:py-32 lg:px-8 text-center bg-gray-50 border-b border-gray-100 overflow-hidden">
                <div className="absolute top-0 right-1/4 -z-10 w-[500px] h-[500px] bg-red-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

                <span className="text-primary text-xs font-bold tracking-widest uppercase mb-4 inline-block">
                    NATIONAL INITIATIVE
                </span>
                <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl max-w-3xl mx-auto">
                    Defending <span className="text-primary">Our</span><br />Digital Sovereignty
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
                    The National Cyber Security Awareness Portal is the central authority dedicated to building a resilient, secure, and informed digital society for all citizens.
                </p>

                {/* Stats Grid */}
                <div className="mt-16 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 py-8">
                    <div className="px-6 flex flex-col items-center">
                        <span className="text-4xl font-bold text-primary mb-1">24/7</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Threat Monitoring</span>
                    </div>
                    <div className="px-6 flex flex-col items-center py-6 sm:py-0">
                        <span className="text-4xl font-bold text-primary mb-1">12M+</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Citizens Empowered</span>
                    </div>
                    <div className="px-6 flex flex-col items-center">
                        <span className="text-4xl font-bold text-primary mb-1">98%</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Uptime Guarantee</span>
                    </div>
                </div>
            </section>

            {/* Core Mission */}
            <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 border-l-4 border-primary pl-4 mb-6">Our Core Mission</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Cyber threats don&apos;t stop when you log off. Neither do we. Our single goal is to ensure that the internet remains a secure environment where innovation can flourish, data is protected, and everyday communication remains safe from bad actors.
                    </p>
                    <p className="text-gray-600 leading-relaxed">
                        Through proactive education, open-source threat intelligence sharing, and public-private partnerships, we&apos;re building a digital shield for every citizen.
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="flex items-start gap-4 p-6 rounded-2xl bg-red-50/50 border border-red-100">
                        <div className="w-10 h-10 rounded-full bg-red-100 text-primary flex items-center justify-center shrink-0">
                            &#128737;
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-1">Proactive Defense</h4>
                            <p className="text-sm text-gray-600">Developing capabilities to detect and neutralize threats before they impact users.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-6 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center shrink-0">
                            &#128218;
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-1">National Education</h4>
                            <p className="text-sm text-gray-600">Standardizing cybersecurity curriculum for schools, businesses, and government.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-6 rounded-2xl bg-red-50/50 border border-red-100">
                        <div className="w-10 h-10 rounded-full bg-red-100 text-primary flex items-center justify-center shrink-0">
                            &#9888;
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-1">Unified Response</h4>
                            <p className="text-sm text-gray-600">Coordinating rapid incident response models across public and private sectors.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Who We Serve */}
            <section className="py-24 bg-gray-50 px-6 lg:px-8 border-t border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">Who We Serve</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Cybersecurity is everyone&apos;s responsibility. Our portal provides tailored resources for distinct sectors of our digital society.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center flex flex-col h-full">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-6">
                                &#128106;
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Citizens &amp; Families</h3>
                            <p className="text-gray-500 text-sm flex-1 mb-8">
                                Clear guidance on securing devices, protecting children online, and avoiding phishing scams that target personal accounts.
                            </p>
                            <Link href="/courses" className="text-primary font-semibold text-sm hover:underline mt-auto">
                                View Citizen Portal &rarr;
                            </Link>
                        </div>

                        <div className="bg-white rounded-2xl p-8 border-2 border-primary shadow-md text-center flex flex-col h-full relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                Primary Focus
                            </div>
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-primary flex items-center justify-center mb-6 mt-2">
                                &#128188;
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Small Businesses</h3>
                            <p className="text-gray-500 text-sm flex-1 mb-8">
                                Scalable frameworks to protect IP, secure customer data, and recover from ransomware without large IT budgets.
                            </p>
                            <Link href="/resources" className="text-primary font-semibold text-sm hover:underline mt-auto">
                                Explore Toolkits &rarr;
                            </Link>
                        </div>

                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center flex flex-col h-full">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-green-50 text-green-500 flex items-center justify-center mb-6">
                                &#127963;
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Government Agencies</h3>
                            <p className="text-gray-500 text-sm flex-1 mb-8">
                                Compliance frameworks, classified handling protocols, and multi-layered defense strategies for national infrastructure.
                            </p>
                            <Link href="/resources" className="text-primary font-semibold text-sm hover:underline mt-auto">
                                Agency Login &rarr;
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
                    Ready to secure your digital life?
                </h2>
                <p className="mt-6 text-xl text-gray-100 max-w-2xl mx-auto drop-shadow-sm font-medium leading-relaxed">
                    Join millions of other citizens who have taken the pledge to practice safe online behavior.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/signup" aria-label="Create a free account">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                        Create Free Account
                    </Button>
                    </Link>
                    <Link href="/courses" aria-label="Explore cybersecurity resources">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto text-white bg-white/10 border-white/30 hover:bg-white/25 hover:border-white/60 font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all backdrop-blur-sm">
                        Explore Courses
                    </Button>
                    </Link>
                </div>
                </div>
            </section>
        </div>
    );
}
