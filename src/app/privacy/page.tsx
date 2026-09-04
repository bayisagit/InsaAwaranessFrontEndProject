import React from 'react';

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-muted py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-card rounded-3xl shadow-sm shadow-black/5 dark:shadow-none border border-border overflow-hidden">
                <div className="bg-primary/5 border-b border-border p-8 text-center">
                    <h1 className="text-3xl font-extrabold text-foreground mb-4">Privacy Policy</h1>
                    <p className="text-muted-foreground">Effective Date: {new Date().toLocaleDateString()}</p>
                </div>
                
                <div className="p-8 space-y-8 text-foreground/80 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">1. Introduction</h2>
                        <p>
                            Welcome to the Information Network Security Administration (INSA) Cybersecurity Awareness Platform. 
                            We are committed to protecting your personal information and your right to privacy. 
                            This Privacy Policy explains how we collect, use, and safeguard your data when you visit or use our platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">2. Information We Collect</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Personal Information:</strong> Includes your name, email address, role, and organization details provided during registration or when contacting us.</li>
                            <li><strong>Usage Data:</strong> We automatically collect diagnostic data, IP addresses, and interaction metrics (e.g., course progress, assessment scores) to improve our services.</li>
                            <li><strong>Security Logs:</strong> To maintain the integrity of our systems, we monitor login attempts and security-related events.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">3. How We Use Your Information</h2>
                        <p className="mb-3">We process your information for purposes based on legitimate institutional interests, including:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Providing, operating, and maintaining the learning platform.</li>
                            <li>Tracking your progress in cybersecurity awareness training and issuing certificates.</li>
                            <li>Responding to your inquiries and providing support.</li>
                            <li>Sending you important security alerts and platform updates.</li>
                            <li>Preventing fraudulent activities and securing our infrastructure.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">4. Data Sharing and Disclosure</h2>
                        <p>
                            We do not sell, trade, or rent your personal information to third parties. We may share your data only with:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-3">
                            <li><strong>Your Organization:</strong> Your training progress and assessment results may be shared with designated administrators within your registered organization for compliance tracking.</li>
                            <li><strong>Legal Obligations:</strong> When required by law or in response to valid requests by public authorities.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">5. Data Security</h2>
                        <p>
                            We implement robust, industry-standard security measures to protect your data from unauthorized access, disclosure, alteration, or destruction. However, please be aware that no method of electronic transmission or storage is 100% secure.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">6. Your Rights</h2>
                        <p>
                            Depending on your jurisdiction, you may have the right to request access to, correction of, or deletion of your personal data. You may also have the right to object to or restrict certain processing activities. To exercise these rights, please contact our support team.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">7. Contact Us</h2>
                        <p>
                            If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
                        </p>
                        <div className="mt-4 bg-muted p-4 rounded-xl border border-border">
                            <p><strong>INSA Cyber Security Awareness</strong></p>
                            <p>Addis Ababa, China Road</p>
                            <p>Email: support@insa.gov.et</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
