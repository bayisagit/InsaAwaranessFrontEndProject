import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

interface ContactSectionProps {
    variant?: 'full' | 'home';
}

export function ContactSection({ variant = 'full' }: ContactSectionProps) {

    if (variant === 'home') {
        return (
            <section className="py-20 px-6 lg:px-8 bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
                            Get in Touch
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Have questions about our cybersecurity training, need technical support, or want to report suspicious activity? Our team is ready to assist.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
                        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 text-center hover:shadow-md transition-shadow">
                            <div className="text-orange-500 text-3xl mb-4">&#9993;</div>
                            <h4 className="font-semibold text-gray-900 mb-2">Email Support</h4>
                            <p className="text-sm text-gray-500 mb-3">For general inquiries and account help.</p>
                            <a href="mailto:support@cybersafenation.gov" className="text-primary font-medium text-sm hover:underline">
                                support@cybersafenation.gov
                            </a>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-8 border border-orange-100 text-center hover:shadow-md transition-shadow">
                            <div className="text-orange-600 text-3xl mb-4">&#9742;</div>
                            <h4 className="font-semibold text-gray-900 mb-2">Emergency Hotline</h4>
                            <p className="text-sm text-gray-600 mb-3">24/7 support for critical incidents.</p>
                            <a href="tel:+18005550199" className="text-orange-600 font-bold hover:underline tracking-wider">
                                1 (800) 555-0199
                            </a>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 text-center hover:shadow-md transition-shadow">
                            <div className="text-gray-400 text-3xl mb-4">&#127970;</div>
                            <h4 className="font-semibold text-gray-900 mb-2">Headquarters</h4>
                            <p className="text-sm text-gray-500">
                                Information Security Directorate<br />
                                100 Cyber Defense Ave, Suite 400<br />
                                Metropolis District
                            </p>
                        </div>
                    </div>

                    <div className="text-center">
                        <Link href="/contact">
                            <Button variant="primary">Contact Us &rarr;</Button>
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <div className="flex flex-col bg-white min-h-screen">
            {/* Header */}
            <section className="py-20 px-6 text-center bg-gray-50 border-b border-gray-100">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
                    How can we help you?
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Whether you have questions about our cybersecurity training, need technical support, or want to report a suspicious activity, our team is ready to assist.
                </p>
            </section>

            <section className="py-16 px-6 lg:px-8 max-w-6xl mx-auto w-full flex flex-col md:flex-row gap-16">
                {/* Left Side - Info */}
                <div className="w-full md:w-[350px] shrink-0 space-y-12">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 pb-2 border-b border-gray-200">
                            Direct Support
                        </h3>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="text-orange-500 mt-1">&#9993;</div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">Email Support</h4>
                                    <p className="text-sm text-gray-500 mb-1">For general inquiries and account help.</p>
                                    <a href="mailto:support@cybersafenation.gov" className="text-primary font-medium text-sm hover:underline">
                                        support@cybersafenation.gov
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                                <div className="text-orange-600 mt-1">&#9742;</div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">Emergency Hotline</h4>
                                    <p className="text-sm text-gray-600 mb-1">24/7 support for critical incidents.</p>
                                    <a href="tel:+18005550199" className="text-orange-600 font-bold hover:underline tracking-wider">
                                        1 (800) 555-0199
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="text-gray-400 mt-1">&#127970;</div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">Headquarters</h4>
                                    <p className="text-sm text-gray-500">
                                        Information Security Directorate<br />
                                        100 Cyber Defense Ave, Suite 400<br />
                                        Metropolis District
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 pb-2 border-b border-gray-200">
                            Common Questions
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100 cursor-pointer group">
                                <span className="text-sm font-medium text-gray-700 group-hover:text-primary">How do I verify a government email?</span>
                                <span className="text-gray-400">&#11163;</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100 cursor-pointer group">
                                <span className="text-sm font-medium text-gray-700 group-hover:text-primary">Is the cybersecurity training mandatory?</span>
                                <span className="text-gray-400">&#11163;</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="flex-1">
                    <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Send a Message</h2>
                        <p className="text-gray-500 text-sm mb-8">Please fill out the form below details. We typically respond within 1 business day.</p>

                        <form className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <Input label="First Name" placeholder="Jane" required />
                                <Input label="Last Name" placeholder="Doe" required />
                            </div>

                            <Input label="Work Email" type="email" placeholder="jane.doe@organization.com" required />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Category <span className="text-primary">*</span></label>
                                <div className="relative">
                                    <select className="block w-full rounded-md border border-gray-300 py-3 pl-3 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none bg-white">
                                        <option>General Inquiry</option>
                                        <option>Report Incident</option>
                                        <option>Training Support</option>
                                        <option>Technical Issue</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        &#11163;
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message <span className="text-primary">*</span></label>
                                <textarea
                                    rows={5}
                                    required
                                    placeholder="How can we help you? Please do not include sensitive personal information like SSN or passwords."
                                    className="block w-full rounded-md border border-gray-300 py-3 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                ></textarea>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="flex items-center h-5">
                                    <input id="consent" type="checkbox" className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary focus:ring-2" required />
                                </div>
                                <label htmlFor="consent" className="text-xs text-gray-500 leading-relaxed">
                                    I consent to having this website store my submitted information so they can respond to my inquiry. See our <Link href="/about" className="text-primary hover:underline">Privacy Policy</Link>.
                                </label>
                            </div>

                            <Button type="button" className="bg-orange-500 hover:bg-orange-600 text-white px-8">
                                Send Message
                            </Button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
}
