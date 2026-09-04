import React from 'react';

export default function AccessibilityPage() {
    return (
        <div className="min-h-screen bg-muted py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-card rounded-3xl shadow-sm shadow-black/5 dark:shadow-none border border-border overflow-hidden">
                <div className="bg-primary/5 border-b border-border p-8 text-center">
                    <h1 className="text-3xl font-extrabold text-foreground mb-4">Accessibility Statement</h1>
                    <p className="text-muted-foreground">Information Network Security Administration (INSA)</p>
                </div>
                
                <div className="p-8 space-y-8 text-foreground/80 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">Our Commitment</h2>
                        <p>
                            At the Information Network Security Administration (INSA), we are committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply the relevant accessibility standards to our Cybersecurity Awareness Platform to ensure an inclusive educational environment.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">Conformance Status</h2>
                        <p>
                            The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA. The INSA Cybersecurity Awareness Platform is partially conformant with WCAG 2.1 level AA. Partially conformant means that some parts of the content may not fully conform to the accessibility standard yet, but we are actively working on improvements.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">Accessibility Features</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Keyboard Navigation:</strong> Core components and navigation menus are designed to be fully navigable using a keyboard.</li>
                            <li><strong>Dark Mode Support:</strong> High contrast dark mode is available for users with visual impairments or light sensitivity.</li>
                            <li><strong>Screen Reader Compatibility:</strong> We strive to use semantic HTML and ARIA labels to ensure compatibility with screen readers.</li>
                            <li><strong>Text Resizing:</strong> The platform supports native browser text resizing without breaking the page layout.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">Known Limitations</h2>
                        <p className="mb-3">Despite our best efforts to ensure accessibility of the platform, there may be some limitations. Below is a description of known limitations:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Some older uploaded PDF documents or resources may not be fully accessible to screen readers.</li>
                            <li>Certain complex interactive cybersecurity diagrams may lack complete alternative text descriptions.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">Feedback and Contact</h2>
                        <p>
                            We welcome your feedback on the accessibility of the INSA Cybersecurity Awareness Platform. Please let us know if you encounter accessibility barriers:
                        </p>
                        <div className="mt-4 bg-muted p-4 rounded-xl border border-border">
                            <p><strong>Email:</strong> accessibility@insa.gov.et</p>
                            <p><strong>Phone:</strong> Contact our central support desk</p>
                            <p>We try to respond to feedback within 5 business days.</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
