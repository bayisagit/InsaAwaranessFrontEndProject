export interface AwarenessSection {
    title: string;
    description: string;
    icon: string;
    bullets: string[];
}

export interface AwarenessTopic {
    slug: string;
    title: string;
    description: string;
    icon: string;
    accentColor: string;
    sections: AwarenessSection[];
}

export const awarenessTopics: AwarenessTopic[] = [
    {
        slug: "phishing-protection",
        title: "Phishing Protection",
        description: "Learn to identify and avoid phishing attempts that target your personal and professional information through deceptive emails, messages, and websites.",
        icon: "🎣",
        accentColor: "red",
        sections: [
            {
                title: "Spotting Suspicious Emails",
                description: "Recognize the common signs of phishing emails before you click.",
                icon: "📧",
                bullets: [
                    "Check sender addresses for misspellings or odd domains",
                    "Hover over links before clicking to preview the destination",
                    "Watch for urgent language demanding immediate action",
                    "Be wary of unsolicited attachments or download prompts",
                ],
            },
            {
                title: "Safe Link Practices",
                description: "Build habits that protect you from malicious links wherever they appear.",
                icon: "🔗",
                bullets: [
                    "Navigate directly to websites rather than using email links",
                    "Verify shortened URLs before visiting them",
                    "Look for HTTPS and correct domain names in the address bar",
                    "Use link scanners on suspicious URLs before opening",
                ],
            },
            {
                title: "Reporting Phishing",
                description: "Know how and where to report phishing attempts to protect yourself and others.",
                icon: "🚨",
                bullets: [
                    "Forward suspicious emails to your security team or report@cybersafenation.gov",
                    "Use built-in phishing reporting tools in your email client",
                    "Report smishing (SMS phishing) to your mobile provider",
                    "Document and report any credentials you may have accidentally disclosed",
                ],
            },
            {
                title: "Two-Factor Authentication",
                description: "Add an extra layer of security to your accounts beyond just a password.",
                icon: "🔐",
                bullets: [
                    "Enable 2FA on all accounts that support it",
                    "Prefer authenticator apps over SMS-based codes",
                    "Use hardware security keys for critical accounts",
                    "Never share your 2FA codes with anyone, even if they ask",
                ],
            },
        ],
    },
    {
        slug: "password-hygiene",
        title: "Password Hygiene",
        description: "Master the fundamentals of strong password practices to keep your accounts secure from breaches and unauthorized access.",
        icon: "🔑",
        accentColor: "blue",
        sections: [
            {
                title: "Strong Password Creation",
                description: "Create passwords that are easy to remember but hard to crack.",
                icon: "💪",
                bullets: [
                    "Use at least 12-16 characters with a mix of letters, numbers, and symbols",
                    "Avoid dictionary words, personal info, or common patterns",
                    "Create passphrases from random word combinations",
                    "Never reuse passwords across multiple accounts",
                ],
            },
            {
                title: "Password Managers",
                description: "Let a password manager generate and store complex passwords for you.",
                icon: "🗄️",
                bullets: [
                    "Choose a reputable password manager with strong encryption",
                    "Use auto-fill features to avoid typing credentials manually",
                    "Enable biometric unlock for your password vault",
                    "Regularly audit your vault for weak or reused passwords",
                ],
            },
            {
                title: "Multi-Factor Authentication",
                description: "Combine passwords with additional verification methods for stronger security.",
                icon: "🛡️",
                bullets: [
                    "Layer MFA on top of strong passwords for critical accounts",
                    "Understand the difference between 2FA and MFA",
                    "Use backup codes in case you lose access to your MFA device",
                    "Periodically review which accounts have MFA enabled",
                ],
            },
            {
                title: "Regular Rotation",
                description: "Know when and how often to change your passwords for optimal security.",
                icon: "🔄",
                bullets: [
                    "Change passwords immediately after a known or suspected breach",
                    "Rotate shared or service account passwords quarterly",
                    "Avoid changing passwords too frequently unless required",
                    "Use the password checker tool to test your password strength",
                ],
            },
        ],
    },
    {
        slug: "secure-browsing",
        title: "Secure Browsing",
        description: "Adopt safe browsing habits and configure your browser to protect your privacy and security while navigating the web.",
        icon: "🌐",
        accentColor: "emerald",
        sections: [
            {
                title: "HTTPS & Safe Connections",
                description: "Ensure your connections are encrypted and your data stays private.",
                icon: "🔒",
                bullets: [
                    "Always look for the padlock icon and HTTPS in the address bar",
                    "Avoid entering sensitive data on pages without HTTPS",
                    "Use browser extensions that force HTTPS connections",
                    "Be cautious when using public Wi-Fi without a VPN",
                ],
            },
            {
                title: "Browser Security Settings",
                description: "Configure your browser for maximum security without breaking functionality.",
                icon: "⚙️",
                bullets: [
                    "Keep your browser updated to the latest version",
                    "Enable pop-up blocking and automatic security checks",
                    "Review and restrict site permissions (location, camera, microphone)",
                    "Clear cookies and cache regularly",
                ],
            },
            {
                title: "Avoiding Malicious Sites",
                description: "Recognize and steer clear of websites designed to compromise your security.",
                icon: "⚠️",
                bullets: [
                    "Use search results cautiously — ads can lead to malicious sites",
                    "Check for poor grammar, design quality, or unusual URLs",
                    "Avoid downloading software from unverified sources",
                    "Use safe browsing tools provided by major browsers",
                ],
            },
            {
                title: "Public Wi-Fi Safety",
                description: "Stay secure when connecting to networks outside your home or office.",
                icon: "📶",
                bullets: [
                    "Avoid accessing sensitive accounts on public Wi-Fi",
                    "Use a VPN to encrypt your traffic on untrusted networks",
                    "Turn off file sharing and AirDrop when in public",
                    "Forget the network after use to prevent auto-reconnection",
                ],
            },
        ],
    },
    {
        slug: "data-privacy",
        title: "Data Privacy",
        description: "Take control of your personal information online and understand how to protect your digital footprint from unwanted exposure.",
        icon: "🕵️",
        accentColor: "purple",
        sections: [
            {
                title: "Personal Info Protection",
                description: "Guard your personally identifiable information (PII) from exposure.",
                icon: "🛡️",
                bullets: [
                    "Limit the personal information you share on public profiles",
                    "Use aliases or email aliases for non-essential services",
                    "Never share your national ID, SSN, or passport details online",
                    "Shred physical documents containing personal information",
                ],
            },
            {
                title: "Social Media Privacy",
                description: "Manage what you share and who can see it on social platforms.",
                icon: "📱",
                bullets: [
                    "Review privacy settings on all social media accounts",
                    "Limit past posts visibility to friends or trusted contacts",
                    "Disable location tagging on posts and photos",
                    "Be selective about accepting connection requests",
                ],
            },
            {
                title: "Data Sharing Awareness",
                description: "Understand how your data is collected and used by services you interact with.",
                icon: "📊",
                bullets: [
                    "Read privacy policies before signing up for new services",
                    "Opt out of data collection where options are available",
                    "Review app permissions regularly and revoke unnecessary access",
                    "Understand the difference between free services and data monetization",
                ],
            },
            {
                title: "Privacy Settings",
                description: "Configure tools and platforms to minimize your digital exposure.",
                icon: "🔧",
                bullets: [
                    "Use private or incognito browsing for sensitive searches",
                    "Enable Do Not Track and tracker blocking in your browser",
                    "Use search engines that don't track your history",
                    "Regularly audit third-party access to your accounts",
                ],
            },
        ],
    },
    {
        slug: "incident-response",
        title: "Incident Response",
        description: "Know exactly what steps to take when you suspect a security breach, compromised account, or cyber incident.",
        icon: "🚓",
        accentColor: "orange",
        sections: [
            {
                title: "Identify the Breach",
                description: "Recognize the signs that your account or device may be compromised.",
                icon: "🔍",
                bullets: [
                    "Look for unexpected password reset emails or 2FA prompts",
                    "Check for unrecognized logins in your account activity logs",
                    "Watch for unusual device behavior like slow performance or pop-ups",
                    "Monitor for unauthorized transactions or changes to your accounts",
                ],
            },
            {
                title: "Contain & Isolate",
                description: "Take immediate action to prevent further damage.",
                icon: "⛔",
                bullets: [
                    "Disconnect the affected device from the internet immediately",
                    "Change passwords for compromised accounts from a clean device",
                    "Enable or re-enable 2FA on any accounts that were accessed",
                    "Remove unknown devices from your trusted device list",
                ],
            },
            {
                title: "Report & Escalate",
                description: "Notify the right people and authorities about the incident.",
                icon: "📞",
                bullets: [
                    "Report the incident to your organization's IT security team",
                    "Contact your bank or financial institutions if financial data is involved",
                    "File a report with local law enforcement or cyber crime unit",
                    "Report phishing or scams to relevant national reporting centers",
                ],
            },
            {
                title: "Recovery Steps",
                description: "Restore your systems and prevent future incidents.",
                icon: "🔁",
                bullets: [
                    "Run full antivirus and anti-malware scans on affected devices",
                    "Restore data from clean, verified backups",
                    "Review and tighten all security settings across accounts",
                    "Document the incident and lessons learned for future prevention",
                ],
            },
        ],
    },
    {
        slug: "cyber-hygiene-basics",
        title: "Cyber Hygiene Basics",
        description: "Build a strong foundation of everyday security practices that protect you from the most common cyber threats.",
        icon: "🧹",
        accentColor: "teal",
        sections: [
            {
                title: "Software Updates",
                description: "Keep your devices and applications up to date to patch known vulnerabilities.",
                icon: "📲",
                bullets: [
                    "Enable automatic updates for your operating system and apps",
                    "Restart devices promptly after updates are installed",
                    "Don't delay security patches — they fix active vulnerabilities",
                    "Remove outdated software that no longer receives updates",
                ],
            },
            {
                title: "Antivirus Protection",
                description: "Use reliable security software to detect and block malware.",
                icon: "🦠",
                bullets: [
                    "Install reputable antivirus software on all devices",
                    "Keep virus definitions updated for the latest threat detection",
                    "Schedule regular full system scans",
                    "Enable real-time protection features",
                ],
            },
            {
                title: "Backup Strategy",
                description: "Protect your data with a reliable backup plan so you never lose what matters.",
                icon: "💾",
                bullets: [
                    "Follow the 3-2-1 rule: 3 copies, 2 media types, 1 off-site",
                    "Automate regular backups so you don't have to remember",
                    "Test your backups periodically to ensure they can be restored",
                    "Encrypt backup files for sensitive data",
                ],
            },
            {
                title: "Device Locking",
                description: "Secure physical access to your devices at all times.",
                icon: "🔏",
                bullets: [
                    "Use strong PINs, passwords, or biometric locks on all devices",
                    "Configure auto-lock after a short period of inactivity",
                    "Enable remote wipe capabilities for lost or stolen devices",
                    "Never leave devices unattended in public or shared spaces",
                ],
            },
        ],
    },
];
