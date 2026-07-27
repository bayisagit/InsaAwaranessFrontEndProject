import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-card border-t border-border">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <img src="/logo.png" alt="INSA" className="h-6 w-6 object-contain" />
                        <span className="font-bold text-foreground">INSA Cyber Awareness</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                        A government initiative dedicated to empowering citizens with the knowledge and tools to stay safe online. Together, we build a resilient digital nation.
                    </p>
                    <div className="flex gap-4 mt-6">
                        <a href="#" className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors duration-200 transition-all duration-200">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                            </svg>
                        </a>
                        <a href="#" className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors duration-200 transition-all duration-200">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                        </a>
                        <a href="#" className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors duration-200 transition-all duration-200">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                        </a>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Platform</h4>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                        <li><Link href="/" className="hover:text-primary">Home</Link></li>
                        <li><Link href="/resources" className="hover:text-primary">Training Resources</Link></li>
                        <li><Link href="/resources" className="hover:text-primary">Resources</Link></li>
                        <li><Link href="/alerts" className="hover:text-primary">News & Alerts</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Support</h4>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                        <li><Link href="/tools" className="hover:text-primary">Tools</Link></li>
                        <li><Link href="/contact" className="hover:text-primary">Contact Us</Link></li>
                        <li><Link href="/contact" className="hover:text-primary">Report an Incident</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Legal</h4>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                        <li><Link href="/about" className="hover:text-primary">Privacy Policy</Link></li>
                        <li><Link href="/about" className="hover:text-primary">Terms of Service</Link></li>
                        <li><Link href="/about" className="hover:text-primary">Accessibility</Link></li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-border mx-6 lg:mx-12 py-6 flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
                <p>© 2025 INSA Cyber Awareness. All rights reserved. Official Government Website.</p>
                <div className="mt-4 md:mt-0">
                    <span className="text-green-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                        System Operational
                    </span>
                </div>
            </div>
        </footer>
    );
};
