import React from 'react';

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-muted py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-card rounded-3xl shadow-sm shadow-black/5 dark:shadow-none border border-border overflow-hidden">
                <div className="bg-primary/5 border-b border-border p-8 text-center">
                    <h1 className="text-3xl font-extrabold text-foreground mb-4">Terms of Service</h1>
                    <p className="text-muted-foreground">Effective Date: {new Date().toLocaleDateString()}</p>
                </div>
                
                <div className="p-8 space-y-8 text-foreground/80 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using the Information Network Security Administration (INSA) Cybersecurity Awareness Platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">2. User Accounts and Responsibilities</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.</li>
                            <li><strong>Accurate Information:</strong> You agree to provide true, accurate, and complete information during registration and keep it updated.</li>
                            <li><strong>Prohibited Conduct:</strong> You agree not to misuse the platform, including attempting to gain unauthorized access to our systems, disseminating malicious software, or violating any applicable laws and regulations.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">3. Educational Content and Intellectual Property</h2>
                        <p>
                            All training modules, articles, assessments, and related materials provided on this platform are the intellectual property of INSA or its content partners. You are granted a limited, non-exclusive, non-transferable license to access and use the content for your personal educational and professional development purposes only. Unauthorized reproduction, distribution, or commercial use is strictly prohibited.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">4. Disclaimers</h2>
                        <p>
                            The information and training provided on this platform are for educational purposes to enhance cybersecurity awareness. While we strive to provide accurate and up-to-date information, INSA makes no warranties or representations regarding the completeness, reliability, or accuracy of the content. Applying the knowledge gained from this platform is at your own risk.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">5. Termination</h2>
                        <p>
                            INSA reserves the right to suspend or terminate your access to the platform at our sole discretion, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users of the platform, us, or third parties, or for any other reason.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">6. Changes to Terms</h2>
                        <p>
                            We reserve the right to modify these Terms of Service at any time. Any changes will be effective immediately upon posting on the platform. Your continued use of the platform after changes have been posted constitutes your acceptance of the revised Terms.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
