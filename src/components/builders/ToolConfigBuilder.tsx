'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    ShieldCheck,
    Fish,
    HelpCircle,
    Sliders,
    Plus,
    Trash2,
    Code,
    CheckCircle2,
    AlertTriangle,
    Eye,
    EyeOff,
    Copy,
    Check
} from 'lucide-react';

export type ToolType = 'password_security' | 'phishing_simulation' | 'self_assessment' | 'custom_tool';

export interface PasswordConfig {
    min_length: number;
    max_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_special: boolean;
    check_common_passwords: boolean;
    check_breached_database: boolean;
    show_entropy_meter: boolean;
    show_crack_time: boolean;
    weak_feedback: string;
    strong_feedback: string;
}

export interface PhishingScenario {
    id: string;
    sender: string;
    subject: string;
    date: string;
    content: string;
    cta: string;
    is_phishing: boolean;
    reason: string;
    hints: string[];
}

export interface PhishingConfig {
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'adaptive';
    simulation_type: 'email' | 'sms' | 'qr' | 'mixed';
    passing_score: number;
    show_instant_explanation: boolean;
    enable_hints: boolean;
    scenarios: PhishingScenario[];
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
}

export interface AssessmentConfig {
    category: string;
    passing_score: number;
    time_limit_minutes: number;
    randomize_questions: boolean;
    show_explanations: boolean;
    questions: QuizQuestion[];
}

export interface CustomToolConfig {
    category: string;
    external_url: string;
    feature_flags: Record<string, boolean>;
    custom_settings: Record<string, string>;
}

interface ToolConfigBuilderProps {
    initialConfig?: Record<string, any> | string;
    onChange: (config: Record<string, any>) => void;
    toolName?: string;
}

const DEFAULT_PASSWORD_CONFIG: PasswordConfig = {
    min_length: 12,
    max_length: 64,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_special: true,
    check_common_passwords: true,
    check_breached_database: true,
    show_entropy_meter: true,
    show_crack_time: true,
    weak_feedback: 'Your password is too weak or predictable. Add more variety and length.',
    strong_feedback: 'Great job! This password demonstrates strong resistance against brute-force attacks.'
};

const DEFAULT_PHISHING_CONFIG: PhishingConfig = {
    difficulty: 'intermediate',
    simulation_type: 'email',
    passing_score: 80,
    show_instant_explanation: true,
    enable_hints: true,
    scenarios: [
        {
            id: '1',
            sender: 'IT Security Desk <security@internal-portal-notice.com>',
            subject: 'Urgent: Verify Your Corporate Password',
            date: 'Today, 10:45 AM',
            content: 'We detected unauthorized attempts to access your account. Click below immediately to prevent temporary suspension.',
            cta: 'Verify Credentials Now',
            is_phishing: true,
            reason: 'Notice the external domain "internal-portal-notice.com" and artificial sense of urgency to click a link.',
            hints: ['Check the sender email domain closely', 'Legitimate security alerts do not threaten urgent suspension via direct link']
        },
        {
            id: '2',
            sender: 'Human Resources <hr@insa.gov.et>',
            subject: 'Q4 Annual Leave Calendar & Guidelines',
            date: 'Yesterday, 2:15 PM',
            content: 'Hello Team, the annual leave calendar for Q4 is now available on the internal portal under /documents/hr/leave_2026.pdf.',
            cta: 'View Internal Portal',
            is_phishing: false,
            reason: 'The email originates from the official insa.gov.et domain and refers to an internal directory path without suspicious external tracking links.',
            hints: ['Official government domain', 'Professional non-urgent tone']
        }
    ]
};

const DEFAULT_ASSESSMENT_CONFIG: AssessmentConfig = {
    category: 'Cyber Hygiene Basics',
    passing_score: 75,
    time_limit_minutes: 15,
    randomize_questions: true,
    show_explanations: true,
    questions: [
        {
            id: '1',
            question: 'What is the most secure practice when receiving an unexpected link via SMS or email?',
            options: [
                'Click it right away to see if it is important',
                'Verify the sender via an independent communication channel before clicking',
                'Forward the link to all colleagues to ask if they received it',
                'Reply to the message asking if it is authentic'
            ],
            correct_index: 1,
            explanation: 'Always verify unexpected communications through a separate, trusted channel (such as directly visiting official portals or phone calls).'
        }
    ]
};

const DEFAULT_CUSTOM_CONFIG: CustomToolConfig = {
    category: 'General Security',
    external_url: '',
    feature_flags: {
        'enable_logging': true,
        'allow_anonymous': true,
        'send_notification_on_fail': false
    },
    custom_settings: {
        'support_email': 'support@insa.gov.et',
        'version': '1.0'
    }
};

export function ToolConfigBuilder({ initialConfig, onChange, toolName = '' }: ToolConfigBuilderProps) {
    // Detect tool type from initialConfig or name
    const detectType = (cfg: any): ToolType => {
        let parsed = cfg;
        if (typeof cfg === 'string') {
            try {
                parsed = JSON.parse(cfg);
            } catch {
                parsed = {};
            }
        }
        if (!parsed || typeof parsed !== 'object') parsed = {};

        if (parsed.tool_type) return parsed.tool_type;
        if ('scenarios' in parsed || 'simulation_type' in parsed) return 'phishing_simulation';
        if ('min_length' in parsed || 'check_common_passwords' in parsed) return 'password_security';
        if ('questions' in parsed) return 'self_assessment';

        const nameLower = toolName.toLowerCase();
        if (nameLower.includes('phish')) return 'phishing_simulation';
        if (nameLower.includes('password')) return 'password_security';
        if (nameLower.includes('quiz') || nameLower.includes('assessment')) return 'self_assessment';

        return 'password_security';
    };

    const parsedInitial = useMemo(() => {
        if (!initialConfig) return {};
        if (typeof initialConfig === 'string') {
            try {
                return JSON.parse(initialConfig);
            } catch {
                return {};
            }
        }
        return initialConfig;
    }, [initialConfig]);

    const [toolType, setToolType] = useState<ToolType>(() => detectType(parsedInitial));
    const [showJsonPreview, setShowJsonPreview] = useState(false);
    const [copied, setCopied] = useState(false);

    // Sub-configs
    const [passwordConfig, setPasswordConfig] = useState<PasswordConfig>(() => ({
        ...DEFAULT_PASSWORD_CONFIG,
        ...(toolType === 'password_security' ? parsedInitial : {})
    }));

    const [phishingConfig, setPhishingConfig] = useState<PhishingConfig>(() => ({
        ...DEFAULT_PHISHING_CONFIG,
        ...(toolType === 'phishing_simulation' ? parsedInitial : {})
    }));

    const [assessmentConfig, setAssessmentConfig] = useState<AssessmentConfig>(() => ({
        ...DEFAULT_ASSESSMENT_CONFIG,
        ...(toolType === 'self_assessment' ? parsedInitial : {})
    }));

    const [customConfig, setCustomConfig] = useState<CustomToolConfig>(() => ({
        ...DEFAULT_CUSTOM_CONFIG,
        ...(toolType === 'custom_tool' ? parsedInitial : {})
    }));

    // Temporary input state for new custom flags
    const [newFlagKey, setNewFlagKey] = useState('');
    const [newSettingKey, setNewSettingKey] = useState('');
    const [newSettingVal, setNewSettingVal] = useState('');

    // Compile active configuration into JSON
    const activeConfig = useMemo(() => {
        let compiled: Record<string, any> = { tool_type: toolType };
        if (toolType === 'password_security') {
            compiled = { ...compiled, ...passwordConfig };
        } else if (toolType === 'phishing_simulation') {
            compiled = { ...compiled, ...phishingConfig };
        } else if (toolType === 'self_assessment') {
            compiled = { ...compiled, ...assessmentConfig };
        } else {
            compiled = { ...compiled, ...customConfig };
        }
        return compiled;
    }, [toolType, passwordConfig, phishingConfig, assessmentConfig, customConfig]);

    // Emit changes upstream
    useEffect(() => {
        onChange(activeConfig);
    }, [activeConfig, onChange]);

    const handleCopyJson = () => {
        navigator.clipboard.writeText(JSON.stringify(activeConfig, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            {/* 1. Tool Type Selector Cards */}
            <div>
                <label className="block text-sm font-bold text-foreground mb-2.5">
                    Tool Type & Configuration Template
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        {
                            type: 'password_security' as ToolType,
                            label: 'Password Security',
                            desc: 'Length, complexity, and crack metrics',
                            icon: <ShieldCheck className="size-5 text-blue-500" />
                        },
                        {
                            type: 'phishing_simulation' as ToolType,
                            label: 'Phishing Simulator',
                            desc: 'Interactive scenarios, indicators & hints',
                            icon: <Fish className="size-5 text-red-500" />
                        },
                        {
                            type: 'self_assessment' as ToolType,
                            label: 'Self-Assessment',
                            desc: 'Interactive quiz cards and scoring',
                            icon: <HelpCircle className="size-5 text-purple-500" />
                        },
                        {
                            type: 'custom_tool' as ToolType,
                            label: 'Custom Tool',
                            desc: 'External URL and dynamic feature toggles',
                            icon: <Sliders className="size-5 text-emerald-500" />
                        }
                    ].map(card => {
                        const isSelected = toolType === card.type;
                        return (
                            <button
                                key={card.type}
                                type="button"
                                onClick={() => setToolType(card.type)}
                                className={`flex flex-col text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                                    isSelected
                                        ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-xs ring-2 ring-primary/20'
                                        : 'border-border bg-card hover:border-border/80 hover:bg-muted/40'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="p-2 rounded-xl bg-card border border-border shadow-2xs">
                                        {card.icon}
                                    </div>
                                    {isSelected && <CheckCircle2 className="size-4 text-primary" />}
                                </div>
                                <span className="font-bold text-sm text-foreground">{card.label}</span>
                                <span className="text-xs text-muted-foreground mt-0.5 leading-snug">{card.desc}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. Dynamic Tool-Specific Visual Builder */}
            <div className="bg-muted/40 dark:bg-muted/20 border border-border rounded-2xl p-5 space-y-6">
                {/* ══════════════════════════════════════════════════════════
                    A. PASSWORD SECURITY ASSESSMENT BUILDER
                   ══════════════════════════════════════════════════════════ */}
                {toolType === 'password_security' && (
                    <div className="space-y-6">
                        <div className="border-b border-border pb-3">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                <ShieldCheck className="size-4 text-primary" />
                                Password Policy & Evaluation Settings
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Configure the complexity requirements, strength metrics, and guidance feedback.
                            </p>
                        </div>

                        {/* Length Settings */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">
                                    Minimum Password Length
                                </label>
                                <input
                                    type="number"
                                    min={6}
                                    max={32}
                                    value={passwordConfig.min_length}
                                    onChange={e => setPasswordConfig({ ...passwordConfig, min_length: parseInt(e.target.value) || 8 })}
                                    className="w-full px-3.5 py-2.5 bg-card border border-border rounded-xl text-foreground text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                                />
                                <span className="text-[11px] text-muted-foreground">Recommended: 12+ characters for cyber safety</span>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">
                                    Maximum Password Length
                                </label>
                                <input
                                    type="number"
                                    min={32}
                                    max={128}
                                    value={passwordConfig.max_length}
                                    onChange={e => setPasswordConfig({ ...passwordConfig, max_length: parseInt(e.target.value) || 64 })}
                                    className="w-full px-3.5 py-2.5 bg-card border border-border rounded-xl text-foreground text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                                />
                                <span className="text-[11px] text-muted-foreground">Maximum allowed character input</span>
                            </div>
                        </div>

                        {/* Character Complexity Rules */}
                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-2">
                                Character Complexity Requirements
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { key: 'require_uppercase', label: 'Require Uppercase Letter (A–Z)' },
                                    { key: 'require_lowercase', label: 'Require Lowercase Letter (a–z)' },
                                    { key: 'require_numbers', label: 'Require Numeric Digit (0–9)' },
                                    { key: 'require_special', label: 'Require Special Symbol (!@#$%)' },
                                ].map(item => {
                                    const val = (passwordConfig as any)[item.key];
                                    return (
                                        <label
                                            key={item.key}
                                            className="flex items-center justify-between p-3 bg-card border border-border rounded-xl cursor-pointer hover:bg-muted/40 transition-colors"
                                        >
                                            <span className="text-xs font-medium text-foreground">{item.label}</span>
                                            <input
                                                type="checkbox"
                                                checked={val}
                                                onChange={e => setPasswordConfig({ ...passwordConfig, [item.key]: e.target.checked })}
                                                className="w-4 h-4 rounded text-primary focus:ring-primary"
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Security Checks & Metrics */}
                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-2">
                                Advanced Analysis & Checks
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { key: 'check_common_passwords', label: 'Check Against Common Passwords Blacklist' },
                                    { key: 'check_breached_database', label: 'Breached Passwords Lookup Warning' },
                                    { key: 'show_entropy_meter', label: 'Display Real-Time Entropy Bar' },
                                    { key: 'show_crack_time', label: 'Display Estimated Brute-Force Crack Time' },
                                ].map(item => {
                                    const val = (passwordConfig as any)[item.key];
                                    return (
                                        <label
                                            key={item.key}
                                            className="flex items-center justify-between p-3 bg-card border border-border rounded-xl cursor-pointer hover:bg-muted/40 transition-colors"
                                        >
                                            <span className="text-xs font-medium text-foreground">{item.label}</span>
                                            <input
                                                type="checkbox"
                                                checked={val}
                                                onChange={e => setPasswordConfig({ ...passwordConfig, [item.key]: e.target.checked })}
                                                className="w-4 h-4 rounded text-primary focus:ring-primary"
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Custom Feedback Messages */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">
                                    Custom Guidance Message (Weak Password)
                                </label>
                                <input
                                    type="text"
                                    value={passwordConfig.weak_feedback}
                                    onChange={e => setPasswordConfig({ ...passwordConfig, weak_feedback: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-card border border-border rounded-xl text-foreground text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">
                                    Custom Congratulations Message (Strong Password)
                                </label>
                                <input
                                    type="text"
                                    value={passwordConfig.strong_feedback}
                                    onChange={e => setPasswordConfig({ ...passwordConfig, strong_feedback: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-card border border-border rounded-xl text-foreground text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    B. PHISHING SIMULATION BUILDER
                   ══════════════════════════════════════════════════════════ */}
                {toolType === 'phishing_simulation' && (
                    <div className="space-y-6">
                        <div className="border-b border-border pb-3">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                <Fish className="size-4 text-red-500" />
                                Phishing Simulation Scenarios & Settings
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Create interactive email scenarios to train learners on detecting phishing indicators.
                            </p>
                        </div>

                        {/* General Phishing Settings */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">
                                    Difficulty Level
                                </label>
                                <select
                                    value={phishingConfig.difficulty}
                                    onChange={e => setPhishingConfig({ ...phishingConfig, difficulty: e.target.value as any })}
                                    className="w-full px-3.5 py-2.5 bg-card border border-border rounded-xl text-foreground text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                                >
                                    <option value="beginner">Beginner (Obvious Signs)</option>
                                    <option value="intermediate">Intermediate (Subtle Spoofing)</option>
                                    <option value="advanced">Advanced (Spear Phishing)</option>
                                    <option value="adaptive">Adaptive</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">
                                    Simulation Type
                                </label>
                                <select
                                    value={phishingConfig.simulation_type}
                                    onChange={e => setPhishingConfig({ ...phishingConfig, simulation_type: e.target.value as any })}
                                    className="w-full px-3.5 py-2.5 bg-card border border-border rounded-xl text-foreground text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                                >
                                    <option value="email">Email Phishing</option>
                                    <option value="sms">SMS / Smishing</option>
                                    <option value="qr">QR Code / Quishing</option>
                                    <option value="mixed">Mixed Scenarios</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">
                                    Passing Score (%)
                                </label>
                                <input
                                    type="number"
                                    min={50}
                                    max={100}
                                    value={phishingConfig.passing_score}
                                    onChange={e => setPhishingConfig({ ...phishingConfig, passing_score: parseInt(e.target.value) || 80 })}
                                    className="w-full px-3.5 py-2.5 bg-card border border-border rounded-xl text-foreground text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
                                <input
                                    type="checkbox"
                                    checked={phishingConfig.show_instant_explanation}
                                    onChange={e => setPhishingConfig({ ...phishingConfig, show_instant_explanation: e.target.checked })}
                                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                                />
                                Show immediate explanation after learner choice
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
                                <input
                                    type="checkbox"
                                    checked={phishingConfig.enable_hints}
                                    onChange={e => setPhishingConfig({ ...phishingConfig, enable_hints: e.target.checked })}
                                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                                />
                                Enable educational clue hints
                            </label>
                        </div>

                        {/* Interactive Scenarios List */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Simulation Scenarios ({phishingConfig.scenarios.length})
                                </h4>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newScenario: PhishingScenario = {
                                            id: Date.now().toString(),
                                            sender: 'Support <support@service-portal.com>',
                                            subject: 'Urgent Action Required',
                                            date: 'Today, 09:30 AM',
                                            content: 'Please click the link below to verify your account credentials immediately.',
                                            cta: 'Verify Now',
                                            is_phishing: true,
                                            reason: 'Suspicious domain and urgent tone are classic signs.',
                                            hints: ['Check sender address', 'Beware of generic urgent requests']
                                        };
                                        setPhishingConfig({
                                            ...phishingConfig,
                                            scenarios: [...phishingConfig.scenarios, newScenario]
                                        });
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                    <Plus className="size-3.5" />
                                    Add Scenario
                                </button>
                            </div>

                            {phishingConfig.scenarios.map((scenario, sIndex) => (
                                <div key={scenario.id || sIndex} className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-2xs">
                                    <div className="flex items-center justify-between border-b border-border pb-2.5">
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center font-bold text-xs text-foreground">
                                                {sIndex + 1}
                                            </span>
                                            <span className="text-xs font-bold text-foreground">
                                                {scenario.subject || 'Untitled Scenario'}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                scenario.is_phishing
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                            }`}>
                                                {scenario.is_phishing ? 'Phishing' : 'Legitimate'}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const updated = phishingConfig.scenarios.filter((_, i) => i !== sIndex);
                                                setPhishingConfig({ ...phishingConfig, scenarios: updated });
                                            }}
                                            className="text-muted-foreground hover:text-red-600 transition-colors p-1 cursor-pointer"
                                            title="Delete Scenario"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-foreground mb-1">Sender Name & Email</label>
                                            <input
                                                type="text"
                                                value={scenario.sender}
                                                onChange={e => {
                                                    const updated = [...phishingConfig.scenarios];
                                                    updated[sIndex].sender = e.target.value;
                                                    setPhishingConfig({ ...phishingConfig, scenarios: updated });
                                                }}
                                                placeholder="e.g. IT Desk <support@it-desk.com>"
                                                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-foreground mb-1">Email Subject</label>
                                            <input
                                                type="text"
                                                value={scenario.subject}
                                                onChange={e => {
                                                    const updated = [...phishingConfig.scenarios];
                                                    updated[sIndex].subject = e.target.value;
                                                    setPhishingConfig({ ...phishingConfig, scenarios: updated });
                                                }}
                                                placeholder="e.g. Action Required: Account Notice"
                                                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-semibold text-foreground mb-1">Email Body Content</label>
                                        <textarea
                                            rows={3}
                                            value={scenario.content}
                                            onChange={e => {
                                                const updated = [...phishingConfig.scenarios];
                                                updated[sIndex].content = e.target.value;
                                                setPhishingConfig({ ...phishingConfig, scenarios: updated });
                                            }}
                                            placeholder="Write simulation message content..."
                                            className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-foreground mb-1">Call-To-Action Button Label</label>
                                            <input
                                                type="text"
                                                value={scenario.cta}
                                                onChange={e => {
                                                    const updated = [...phishingConfig.scenarios];
                                                    updated[sIndex].cta = e.target.value;
                                                    setPhishingConfig({ ...phishingConfig, scenarios: updated });
                                                }}
                                                placeholder="e.g. Claim Refund Now"
                                                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-foreground mb-1">Classification</label>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = [...phishingConfig.scenarios];
                                                        updated[sIndex].is_phishing = true;
                                                        setPhishingConfig({ ...phishingConfig, scenarios: updated });
                                                    }}
                                                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                                                        scenario.is_phishing
                                                            ? 'bg-red-500 text-white border-red-500'
                                                            : 'bg-card text-muted-foreground border-border hover:bg-muted'
                                                    }`}
                                                >
                                                    Phishing Email
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = [...phishingConfig.scenarios];
                                                        updated[sIndex].is_phishing = false;
                                                        setPhishingConfig({ ...phishingConfig, scenarios: updated });
                                                    }}
                                                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                                                        !scenario.is_phishing
                                                            ? 'bg-emerald-600 text-white border-emerald-600'
                                                            : 'bg-card text-muted-foreground border-border hover:bg-muted'
                                                    }`}
                                                >
                                                    Legitimate Email
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-semibold text-foreground mb-1">
                                            Educational Reason / Explanation
                                        </label>
                                        <input
                                            type="text"
                                            value={scenario.reason}
                                            onChange={e => {
                                                const updated = [...phishingConfig.scenarios];
                                                updated[sIndex].reason = e.target.value;
                                                setPhishingConfig({ ...phishingConfig, scenarios: updated });
                                            }}
                                            placeholder="Explain why this is phishing or legitimate..."
                                            className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    C. SELF-ASSESSMENT & QUIZ BUILDER
                   ══════════════════════════════════════════════════════════ */}
                {toolType === 'self_assessment' && (
                    <div className="space-y-6">
                        <div className="border-b border-border pb-3">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                <HelpCircle className="size-4 text-purple-500" />
                                Security Self-Assessment & Quiz Builder
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Build interactive questions with scoring and instant feedback.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Assessment Category</label>
                                <input
                                    type="text"
                                    value={assessmentConfig.category}
                                    onChange={e => setAssessmentConfig({ ...assessmentConfig, category: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-card border border-border rounded-xl text-foreground text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Passing Threshold (%)</label>
                                <input
                                    type="number"
                                    min={50}
                                    max={100}
                                    value={assessmentConfig.passing_score}
                                    onChange={e => setAssessmentConfig({ ...assessmentConfig, passing_score: parseInt(e.target.value) || 70 })}
                                    className="w-full px-3.5 py-2.5 bg-card border border-border rounded-xl text-foreground text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Time Limit (Minutes)</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={120}
                                    value={assessmentConfig.time_limit_minutes}
                                    onChange={e => setAssessmentConfig({ ...assessmentConfig, time_limit_minutes: parseInt(e.target.value) || 0 })}
                                    className="w-full px-3.5 py-2.5 bg-card border border-border rounded-xl text-foreground text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
                                <input
                                    type="checkbox"
                                    checked={assessmentConfig.randomize_questions}
                                    onChange={e => setAssessmentConfig({ ...assessmentConfig, randomize_questions: e.target.checked })}
                                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                                />
                                Randomize Question Order
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
                                <input
                                    type="checkbox"
                                    checked={assessmentConfig.show_explanations}
                                    onChange={e => setAssessmentConfig({ ...assessmentConfig, show_explanations: e.target.checked })}
                                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                                />
                                Show Explanations on Completion
                            </label>
                        </div>

                        {/* Questions list */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Assessment Questions ({assessmentConfig.questions.length})
                                </h4>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newQ: QuizQuestion = {
                                            id: Date.now().toString(),
                                            question: 'New Question Prompt',
                                            options: ['Option A', 'Option B', 'Option C', 'Option D'],
                                            correct_index: 0,
                                            explanation: 'Explanation for correct choice.'
                                        };
                                        setAssessmentConfig({
                                            ...assessmentConfig,
                                            questions: [...assessmentConfig.questions, newQ]
                                        });
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                    <Plus className="size-3.5" />
                                    Add Question
                                </button>
                            </div>

                            {assessmentConfig.questions.map((q, qIndex) => (
                                <div key={q.id || qIndex} className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-2xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-foreground">Question {qIndex + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const updated = assessmentConfig.questions.filter((_, i) => i !== qIndex);
                                                setAssessmentConfig({ ...assessmentConfig, questions: updated });
                                            }}
                                            className="text-muted-foreground hover:text-red-600 p-1 cursor-pointer"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>

                                    <input
                                        type="text"
                                        value={q.question}
                                        onChange={e => {
                                            const updated = [...assessmentConfig.questions];
                                            updated[qIndex].question = e.target.value;
                                            setAssessmentConfig({ ...assessmentConfig, questions: updated });
                                        }}
                                        placeholder="Enter the question text..."
                                        className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-xs font-semibold focus:ring-1 focus:ring-primary outline-none"
                                    />

                                    <div className="space-y-2">
                                        <span className="text-[11px] font-semibold text-muted-foreground block">
                                            Answer Options (select the radio for the correct answer)
                                        </span>
                                        {q.options.map((opt, optIndex) => (
                                            <div key={optIndex} className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name={`correct_${q.id || qIndex}`}
                                                    checked={q.correct_index === optIndex}
                                                    onChange={() => {
                                                        const updated = [...assessmentConfig.questions];
                                                        updated[qIndex].correct_index = optIndex;
                                                        setAssessmentConfig({ ...assessmentConfig, questions: updated });
                                                    }}
                                                    className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={opt}
                                                    onChange={e => {
                                                        const updated = [...assessmentConfig.questions];
                                                        updated[qIndex].options[optIndex] = e.target.value;
                                                        setAssessmentConfig({ ...assessmentConfig, questions: updated });
                                                    }}
                                                    className="flex-1 px-3 py-1.5 bg-muted/20 border border-border rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary outline-none"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-semibold text-foreground mb-1">Answer Explanation</label>
                                        <input
                                            type="text"
                                            value={q.explanation}
                                            onChange={e => {
                                                const updated = [...assessmentConfig.questions];
                                                updated[qIndex].explanation = e.target.value;
                                                setAssessmentConfig({ ...assessmentConfig, questions: updated });
                                            }}
                                            placeholder="Explain why this answer is correct..."
                                            className="w-full px-3 py-1.5 bg-muted/30 border border-border rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    D. CUSTOM TOOL BUILDER
                   ══════════════════════════════════════════════════════════ */}
                {toolType === 'custom_tool' && (
                    <div className="space-y-6">
                        <div className="border-b border-border pb-3">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                <Sliders className="size-4 text-emerald-500" />
                                Custom Tool Parameters & Feature Flags
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Configure external links, category tags, and custom boolean or text parameters.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Category Tag</label>
                                <input
                                    type="text"
                                    value={customConfig.category}
                                    onChange={e => setCustomConfig({ ...customConfig, category: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-card border border-border rounded-xl text-foreground text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">External Launch / Embed URL</label>
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={customConfig.external_url}
                                    onChange={e => setCustomConfig({ ...customConfig, external_url: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-card border border-border rounded-xl text-foreground text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                        </div>

                        {/* Feature Flags */}
                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-foreground">
                                Feature Toggles ({Object.keys(customConfig.feature_flags).length})
                            </label>
                            <div className="space-y-2">
                                {Object.entries(customConfig.feature_flags).map(([key, enabled]) => (
                                    <div key={key} className="flex items-center justify-between p-2.5 bg-card border border-border rounded-xl">
                                        <span className="text-xs font-mono font-medium text-foreground">{key}</span>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={enabled}
                                                onChange={e => {
                                                    setCustomConfig({
                                                        ...customConfig,
                                                        feature_flags: { ...customConfig.feature_flags, [key]: e.target.checked }
                                                    });
                                                }}
                                                className="w-4 h-4 rounded text-primary focus:ring-primary"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = { ...customConfig.feature_flags };
                                                    delete updated[key];
                                                    setCustomConfig({ ...customConfig, feature_flags: updated });
                                                }}
                                                className="text-muted-foreground hover:text-red-500 p-0.5 cursor-pointer"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="new_feature_key"
                                    value={newFlagKey}
                                    onChange={e => setNewFlagKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                                    className="flex-1 px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-mono outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (newFlagKey.trim()) {
                                            setCustomConfig({
                                                ...customConfig,
                                                feature_flags: { ...customConfig.feature_flags, [newFlagKey.trim()]: true }
                                            });
                                            setNewFlagKey('');
                                        }
                                    }}
                                    className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg cursor-pointer"
                                >
                                    Add Toggle
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Automatic JSON Sync & Preview Drawer */}
            <div className="pt-1 border-t border-border">
                <button
                    type="button"
                    onClick={() => setShowJsonPreview(!showJsonPreview)}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                    <Code className="size-3.5" />
                    {showJsonPreview ? 'Hide Generated JSON Configuration' : 'View Generated JSON Configuration (Auto-Generated)'}
                </button>

                {showJsonPreview && (
                    <div className="mt-3 relative bg-card border border-border rounded-xl p-4 font-mono text-xs text-foreground overflow-x-auto shadow-inner">
                        <div className="absolute right-3 top-3">
                            <button
                                type="button"
                                onClick={handleCopyJson}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted hover:bg-muted/80 text-foreground text-[11px] font-sans font-medium rounded-md border border-border cursor-pointer transition-colors"
                            >
                                {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                                {copied ? 'Copied' : 'Copy JSON'}
                            </button>
                        </div>
                        <pre className="pr-20">{JSON.stringify(activeConfig, null, 2)}</pre>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ToolConfigBuilder;

