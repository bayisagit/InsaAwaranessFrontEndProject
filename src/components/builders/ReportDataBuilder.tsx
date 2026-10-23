'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    FileText,
    ShieldAlert,
    CheckCircle2,
    BarChart3,
    Plus,
    Trash2,
    Code,
    Copy,
    Check,
    AlertTriangle,
    TrendingUp,
    Users,
    Calendar,
    Award,
    Shield,
    Sparkles
} from 'lucide-react';

export type ReportTemplateType = 'compliance_audit' | 'phishing_campaign' | 'training_analytics' | 'custom_report';

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type FindingStatus = 'open' | 'in_progress' | 'resolved' | 'accepted_risk';

export interface AuditFinding {
    id: string;
    title: string;
    severity: FindingSeverity;
    department: string;
    status: FindingStatus;
    remediation: string;
}

export interface ComplianceAuditData {
    framework: string;
    lead_auditor: string;
    audit_period_start: string;
    audit_period_end: string;
    compliance_score: number;
    executive_summary: string;
    target_resolution_date: string;
    findings: AuditFinding[];
}

export interface PhishingReportData {
    campaign_name: string;
    total_recipients: number;
    emails_delivered: number;
    emails_opened: number;
    links_clicked: number;
    credentials_submitted: number;
    reported_count: number;
    high_risk_departments: string[];
    summary: string;
    recommendations: string[];
}

export interface TrainingAnalyticsData {
    active_learners: number;
    course_completion_rate: number;
    average_quiz_score: number;
    total_hours_learned: number;
    top_departments: string[];
    needs_attention: string[];
    summary: string;
    recommended_focus_areas: string[];
}

export interface CustomMetricItem {
    id: string;
    label: string;
    value: string;
    status: 'good' | 'warning' | 'critical' | 'neutral';
}

export interface CustomReportData {
    executive_summary: string;
    primary_category: string;
    metrics: CustomMetricItem[];
    key_findings: string[];
    recommendations: string[];
    additional_notes: string;
}

interface ReportDataBuilderProps {
    initialData?: Record<string, any> | string;
    onChange: (data: Record<string, any>) => void;
    reportTitle?: string;
}

const DEFAULT_COMPLIANCE: ComplianceAuditData = {
    framework: 'INSA Cyber Security Framework & ISO 27001',
    lead_auditor: 'Cyber Security Operations & Compliance Unit',
    audit_period_start: '2026-09-01',
    audit_period_end: '2026-10-20',
    compliance_score: 87,
    executive_summary: 'Overall compliance is strong across core server infrastructure and access controls. High-priority remediation is required for endpoint multi-factor authentication and legacy service segmentation.',
    target_resolution_date: '2026-12-15',
    findings: [
        {
            id: '1',
            title: 'MFA Not Enforced on Select Secondary VPN Gateways',
            severity: 'high',
            department: 'Network Operations',
            status: 'in_progress',
            remediation: 'Mandate SAML-based MFA token challenge on secondary gateway cluster.'
        },
        {
            id: '2',
            title: 'Quarterly Password Rotation Exemption for Legacy Service Accounts',
            severity: 'medium',
            department: 'System Architecture',
            status: 'open',
            remediation: 'Migrate legacy accounts to Managed Service Accounts (gMSA) with automated key rotation.'
        },
        {
            id: '3',
            title: 'Annual Security Awareness Training Completion Rate Reached 94%',
            severity: 'info',
            department: 'Human Resources & All Staff',
            status: 'resolved',
            remediation: 'Continue rolling onboarding tracks for new hires within their first 14 days.'
        }
    ]
};

const DEFAULT_PHISHING: PhishingReportData = {
    campaign_name: 'Q3 Enterprise Simulated Spear-Phishing Drill',
    total_recipients: 450,
    emails_delivered: 448,
    emails_opened: 312,
    links_clicked: 41,
    credentials_submitted: 12,
    reported_count: 228,
    high_risk_departments: ['Procurement', 'Regional Facilities Support'],
    summary: 'Phishing click-through rate dropped from 14.2% to 9.1% compared to Q2. Employee reporting speed increased with 228 reports submitted to the SOC within the first 60 minutes.',
    recommendations: [
        'Assign refresher micro-modules to employees who submitted credentials in the drill',
        'Deploy in-client phishing report banner for high-risk external messages',
        'Conduct targeted smishing and QR code drills in Q4'
    ]
};

const DEFAULT_TRAINING: TrainingAnalyticsData = {
    active_learners: 1280,
    course_completion_rate: 91,
    average_quiz_score: 84,
    total_hours_learned: 3420,
    top_departments: ['IT Operations', 'Cyber Defense Center', 'Finance'],
    needs_attention: ['Logistics', 'Field Operations'],
    summary: 'Strong engagement observed across interactive phishing recognition and password hygiene modules. Mobile learner completion is up 38%.',
    recommended_focus_areas: [
        'Data classification & handling confidential information',
        'Social engineering tactics via phone (Vishing)',
        'Physical facility tailgating precautions'
    ]
};

const DEFAULT_CUSTOM: CustomReportData = {
    executive_summary: 'Comprehensive summary of organizational cyber hygiene and active threat posture.',
    primary_category: 'Executive Oversight',
    metrics: [
        { id: '1', label: 'Overall Security Index', value: '88/100', status: 'good' },
        { id: '2', label: 'Unresolved High Risks', value: '3', status: 'warning' },
        { id: '3', label: 'Staff Training Rate', value: '94.2%', status: 'good' }
    ],
    key_findings: [
        'All tier-1 domain controllers passed automated hardening benchmarks.',
        'External attack surface scans revealed 0 unpatched critical CVEs.'
    ],
    recommendations: [
        'Finalize endpoint isolation playbooks for regional sub-offices.',
        'Review privileged role assignments in identity directories.'
    ],
    additional_notes: 'Compiled for executive steering committee review.'
};

export function ReportDataBuilder({ initialData, onChange, reportTitle = '' }: ReportDataBuilderProps) {
    // Detect template type from initial data
    const detectedType = useMemo<ReportTemplateType>(() => {
        if (!initialData) return 'compliance_audit';
        let parsed: Record<string, any> = {};
        if (typeof initialData === 'string') {
            try {
                parsed = JSON.parse(initialData);
            } catch {
                return 'compliance_audit';
            }
        } else {
            parsed = initialData;
        }

        if (parsed.template_type) {
            return parsed.template_type as ReportTemplateType;
        }
        if (parsed.framework || parsed.compliance_score !== undefined || parsed.findings) {
            return 'compliance_audit';
        }
        if (parsed.campaign_name || parsed.emails_delivered !== undefined || parsed.credentials_submitted !== undefined) {
            return 'phishing_campaign';
        }
        if (parsed.course_completion_rate !== undefined || parsed.total_hours_learned !== undefined) {
            return 'training_analytics';
        }
        if (Object.keys(parsed).length > 0) {
            return 'custom_report';
        }
        return 'compliance_audit';
    }, [initialData]);

    const [activeTemplate, setActiveTemplate] = useState<ReportTemplateType>(detectedType);

    // Initial state setup
    const [complianceData, setComplianceData] = useState<ComplianceAuditData>(() => {
        let parsed: Record<string, any> = {};
        if (typeof initialData === 'string') {
            try { parsed = JSON.parse(initialData); } catch {}
        } else if (initialData && typeof initialData === 'object') {
            parsed = initialData;
        }
        return {
            ...DEFAULT_COMPLIANCE,
            ...(parsed.framework ? parsed : {})
        };
    });

    const [phishingData, setPhishingData] = useState<PhishingReportData>(() => {
        let parsed: Record<string, any> = {};
        if (typeof initialData === 'string') {
            try { parsed = JSON.parse(initialData); } catch {}
        } else if (initialData && typeof initialData === 'object') {
            parsed = initialData;
        }
        return {
            ...DEFAULT_PHISHING,
            ...(parsed.campaign_name ? parsed : {})
        };
    });

    const [trainingData, setTrainingData] = useState<TrainingAnalyticsData>(() => {
        let parsed: Record<string, any> = {};
        if (typeof initialData === 'string') {
            try { parsed = JSON.parse(initialData); } catch {}
        } else if (initialData && typeof initialData === 'object') {
            parsed = initialData;
        }
        return {
            ...DEFAULT_TRAINING,
            ...(parsed.active_learners ? parsed : {})
        };
    });

    const [customData, setCustomData] = useState<CustomReportData>(() => {
        let parsed: Record<string, any> = {};
        if (typeof initialData === 'string') {
            try { parsed = JSON.parse(initialData); } catch {}
        } else if (initialData && typeof initialData === 'object') {
            parsed = initialData;
        }
        return {
            ...DEFAULT_CUSTOM,
            ...(parsed.metrics ? parsed : {})
        };
    });

    const [showJsonPreview, setShowJsonPreview] = useState(false);
    const [copied, setCopied] = useState(false);

    // Active payload computation
    const activePayload = useMemo<Record<string, any>>(() => {
        switch (activeTemplate) {
            case 'compliance_audit':
                return {
                    template_type: 'compliance_audit',
                    ...complianceData
                };
            case 'phishing_campaign':
                return {
                    template_type: 'phishing_campaign',
                    ...phishingData
                };
            case 'training_analytics':
                return {
                    template_type: 'training_analytics',
                    ...trainingData
                };
            case 'custom_report':
                return {
                    template_type: 'custom_report',
                    ...customData
                };
        }
    }, [activeTemplate, complianceData, phishingData, trainingData, customData]);

    // Emit changes upstream
    useEffect(() => {
        onChange(activePayload);
    }, [activePayload, onChange]);

    const handleCopyJson = () => {
        navigator.clipboard.writeText(JSON.stringify(activePayload, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Handlers for Compliance Findings
    const addFinding = () => {
        const newFinding: AuditFinding = {
            id: Date.now().toString(),
            title: 'New Security Audit Finding',
            severity: 'medium',
            department: 'Operations',
            status: 'open',
            remediation: 'Specify remediation action and timeline.'
        };
        setComplianceData(prev => ({
            ...prev,
            findings: [...prev.findings, newFinding]
        }));
    };

    const updateFinding = (id: string, updates: Partial<AuditFinding>) => {
        setComplianceData(prev => ({
            ...prev,
            findings: prev.findings.map(f => f.id === id ? { ...f, ...updates } : f)
        }));
    };

    const deleteFinding = (id: string) => {
        setComplianceData(prev => ({
            ...prev,
            findings: prev.findings.filter(f => f.id !== id)
        }));
    };

    // Handlers for Phishing Recommendations
    const addPhishingRecommendation = () => {
        setPhishingData(prev => ({
            ...prev,
            recommendations: [...prev.recommendations, 'New action plan item']
        }));
    };

    const updatePhishingRecommendation = (index: number, val: string) => {
        setPhishingData(prev => {
            const updated = [...prev.recommendations];
            updated[index] = val;
            return { ...prev, recommendations: updated };
        });
    };

    const deletePhishingRecommendation = (index: number) => {
        setPhishingData(prev => ({
            ...prev,
            recommendations: prev.recommendations.filter((_, idx) => idx !== index)
        }));
    };

    // Handlers for Custom Metrics
    const addCustomMetric = () => {
        const newMetric: CustomMetricItem = {
            id: Date.now().toString(),
            label: 'New Metric',
            value: '100%',
            status: 'good'
        };
        setCustomData(prev => ({
            ...prev,
            metrics: [...prev.metrics, newMetric]
        }));
    };

    const updateCustomMetric = (id: string, updates: Partial<CustomMetricItem>) => {
        setCustomData(prev => ({
            ...prev,
            metrics: prev.metrics.map(m => m.id === id ? { ...m, ...updates } : m)
        }));
    };

    const deleteCustomMetric = (id: string) => {
        setCustomData(prev => ({
            ...prev,
            metrics: prev.metrics.filter(m => m.id !== id)
        }));
    };

    return (
        <div className="space-y-6">
            {/* Template Selector Ribbon */}
            <div className="bg-muted/40 p-1.5 rounded-2xl border border-border">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                    <button
                        type="button"
                        onClick={() => setActiveTemplate('compliance_audit')}
                        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                            activeTemplate === 'compliance_audit'
                                ? 'bg-card text-foreground shadow-sm border border-border font-bold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                        }`}
                    >
                        <Shield className={`size-4 shrink-0 ${activeTemplate === 'compliance_audit' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                            <div className="leading-tight">Compliance Audit</div>
                            <div className="text-[10px] text-muted-foreground font-normal">ISO/NIST Frameworks</div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTemplate('phishing_campaign')}
                        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                            activeTemplate === 'phishing_campaign'
                                ? 'bg-card text-foreground shadow-sm border border-border font-bold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                        }`}
                    >
                        <ShieldAlert className={`size-4 shrink-0 ${activeTemplate === 'phishing_campaign' ? 'text-amber-500' : 'text-muted-foreground'}`} />
                        <div>
                            <div className="leading-tight">Phishing Drill</div>
                            <div className="text-[10px] text-muted-foreground font-normal">Campaign Outcomes</div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTemplate('training_analytics')}
                        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                            activeTemplate === 'training_analytics'
                                ? 'bg-card text-foreground shadow-sm border border-border font-bold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                        }`}
                    >
                        <BarChart3 className={`size-4 shrink-0 ${activeTemplate === 'training_analytics' ? 'text-blue-500' : 'text-muted-foreground'}`} />
                        <div>
                            <div className="leading-tight">Training Analytics</div>
                            <div className="text-[10px] text-muted-foreground font-normal">Learner Engagement</div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTemplate('custom_report')}
                        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                            activeTemplate === 'custom_report'
                                ? 'bg-card text-foreground shadow-sm border border-border font-bold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                        }`}
                    >
                        <Sparkles className={`size-4 shrink-0 ${activeTemplate === 'custom_report' ? 'text-purple-500' : 'text-muted-foreground'}`} />
                        <div>
                            <div className="leading-tight">Custom Report</div>
                            <div className="text-[10px] text-muted-foreground font-normal">Flexible Metrics & Findings</div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Template 1: Compliance Audit Builder */}
            {activeTemplate === 'compliance_audit' && (
                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-border">
                            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                <Shield className="size-4 text-primary" />
                                <span>Audit Metadata & Framework</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground font-medium">Compliance Score:</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                    complianceData.compliance_score >= 85
                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                        : complianceData.compliance_score >= 70
                                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                                }`}>
                                    {complianceData.compliance_score}%
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">Compliance Standard / Framework</label>
                                <input
                                    type="text"
                                    value={complianceData.framework}
                                    onChange={e => setComplianceData({ ...complianceData, framework: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-muted/40 border border-border rounded-xl text-foreground text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                                    placeholder="e.g. INSA Cyber Security Standard / ISO 27001"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">Lead Auditor / Assessment Authority</label>
                                <input
                                    type="text"
                                    value={complianceData.lead_auditor}
                                    onChange={e => setComplianceData({ ...complianceData, lead_auditor: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-muted/40 border border-border rounded-xl text-foreground text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                                    placeholder="e.g. Security Assurance & Inspection Team"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">Audit Period (Start - End)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="date"
                                        value={complianceData.audit_period_start}
                                        onChange={e => setComplianceData({ ...complianceData, audit_period_start: e.target.value })}
                                        className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-foreground text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                    <input
                                        type="date"
                                        value={complianceData.audit_period_end}
                                        onChange={e => setComplianceData({ ...complianceData, audit_period_end: e.target.value })}
                                        className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-foreground text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">Overall Compliance Score (%)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={complianceData.compliance_score}
                                        onChange={e => setComplianceData({ ...complianceData, compliance_score: parseInt(e.target.value) || 0 })}
                                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={complianceData.compliance_score}
                                        onChange={e => setComplianceData({ ...complianceData, compliance_score: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                                        className="w-16 px-2.5 py-1.5 bg-muted/40 border border-border rounded-xl text-foreground text-xs text-center font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">Executive Summary</label>
                            <textarea
                                value={complianceData.executive_summary}
                                onChange={e => setComplianceData({ ...complianceData, executive_summary: e.target.value })}
                                rows={3}
                                className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-foreground text-xs focus:ring-2 focus:ring-primary/20 outline-none resize-y"
                                placeholder="High-level overview of compliance status, principal risks, and overall organizational posture..."
                            />
                        </div>
                    </div>

                    {/* Interactive Findings Table */}
                    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-border">
                            <div>
                                <div className="text-sm font-bold text-foreground">Audit Findings & Observations ({complianceData.findings.length})</div>
                                <div className="text-xs text-muted-foreground">Detailed vulnerability items, risk severity levels, and remediation instructions.</div>
                            </div>
                            <button
                                type="button"
                                onClick={addFinding}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                            >
                                <Plus className="size-3.5" />
                                Add Finding
                            </button>
                        </div>

                        <div className="space-y-3">
                            {complianceData.findings.length === 0 ? (
                                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                                    No findings recorded. Click &quot;Add Finding&quot; to log a security observation or vulnerability.
                                </div>
                            ) : (
                                complianceData.findings.map((f, idx) => (
                                    <div key={f.id} className="p-4 bg-muted/30 border border-border rounded-xl space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                                                <div className="md:col-span-6">
                                                    <label className="block text-[11px] font-semibold text-foreground mb-1">Finding Title #{idx + 1}</label>
                                                    <input
                                                        type="text"
                                                        value={f.title}
                                                        onChange={e => updateFinding(f.id, { title: e.target.value })}
                                                        className="w-full px-3 py-1.5 bg-card border border-border rounded-lg text-foreground text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                                                    />
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="block text-[11px] font-semibold text-foreground mb-1">Severity</label>
                                                    <select
                                                        value={f.severity}
                                                        onChange={e => updateFinding(f.id, { severity: e.target.value as FindingSeverity })}
                                                        className="w-full px-2.5 py-1.5 bg-card border border-border rounded-lg text-foreground text-xs focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                                                    >
                                                        <option value="critical">Critical</option>
                                                        <option value="high">High</option>
                                                        <option value="medium">Medium</option>
                                                        <option value="low">Low</option>
                                                        <option value="info">Info</option>
                                                    </select>
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="block text-[11px] font-semibold text-foreground mb-1">Status</label>
                                                    <select
                                                        value={f.status}
                                                        onChange={e => updateFinding(f.id, { status: e.target.value as FindingStatus })}
                                                        className="w-full px-2.5 py-1.5 bg-card border border-border rounded-lg text-foreground text-xs focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                                                    >
                                                        <option value="open">Open</option>
                                                        <option value="in_progress">In Progress</option>
                                                        <option value="resolved">Resolved</option>
                                                        <option value="accepted_risk">Accepted Risk</option>
                                                    </select>
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="block text-[11px] font-semibold text-foreground mb-1">Department</label>
                                                    <input
                                                        type="text"
                                                        value={f.department}
                                                        onChange={e => updateFinding(f.id, { department: e.target.value })}
                                                        className="w-full px-2.5 py-1.5 bg-card border border-border rounded-lg text-foreground text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => deleteFinding(f.id)}
                                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                                                title="Remove finding"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-semibold text-foreground mb-1">Remediation Action & Timeline</label>
                                            <input
                                                type="text"
                                                value={f.remediation}
                                                onChange={e => updateFinding(f.id, { remediation: e.target.value })}
                                                className="w-full px-3 py-1.5 bg-card border border-border rounded-lg text-foreground text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                                                placeholder="Recommended fix, patch, or policy change..."
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Template 2: Phishing Campaign Outcome Report */}
            {activeTemplate === 'phishing_campaign' && (
                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-border">
                            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                <ShieldAlert className="size-4 text-amber-500" />
                                <span>Phishing Simulation Campaign Scope</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">Simulation Campaign Name</label>
                            <input
                                type="text"
                                value={phishingData.campaign_name}
                                onChange={e => setPhishingData({ ...phishingData, campaign_name: e.target.value })}
                                className="w-full px-3.5 py-2 bg-muted/40 border border-border rounded-xl text-foreground text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                                placeholder="e.g. Q3 Phishing Drill - Urgent Invoice Lure"
                            />
                        </div>

                        {/* Metric Scorecards */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                            <div className="p-3 bg-muted/30 border border-border rounded-xl text-center">
                                <div className="text-[10px] text-muted-foreground font-semibold uppercase">Recipients</div>
                                <input
                                    type="number"
                                    value={phishingData.total_recipients}
                                    onChange={e => setPhishingData({ ...phishingData, total_recipients: parseInt(e.target.value) || 0 })}
                                    className="w-full mt-1 bg-transparent text-center font-bold text-base text-foreground outline-none"
                                />
                            </div>

                            <div className="p-3 bg-muted/30 border border-border rounded-xl text-center">
                                <div className="text-[10px] text-muted-foreground font-semibold uppercase">Delivered</div>
                                <input
                                    type="number"
                                    value={phishingData.emails_delivered}
                                    onChange={e => setPhishingData({ ...phishingData, emails_delivered: parseInt(e.target.value) || 0 })}
                                    className="w-full mt-1 bg-transparent text-center font-bold text-base text-foreground outline-none"
                                />
                            </div>

                            <div className="p-3 bg-muted/30 border border-border rounded-xl text-center">
                                <div className="text-[10px] text-muted-foreground font-semibold uppercase">Opened</div>
                                <input
                                    type="number"
                                    value={phishingData.emails_opened}
                                    onChange={e => setPhishingData({ ...phishingData, emails_opened: parseInt(e.target.value) || 0 })}
                                    className="w-full mt-1 bg-transparent text-center font-bold text-base text-foreground outline-none"
                                />
                            </div>

                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                                <div className="text-[10px] text-amber-500 font-semibold uppercase">Clicked Links</div>
                                <input
                                    type="number"
                                    value={phishingData.links_clicked}
                                    onChange={e => setPhishingData({ ...phishingData, links_clicked: parseInt(e.target.value) || 0 })}
                                    className="w-full mt-1 bg-transparent text-center font-bold text-base text-amber-500 outline-none"
                                />
                            </div>

                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                                <div className="text-[10px] text-red-500 font-semibold uppercase">Submitted Data</div>
                                <input
                                    type="number"
                                    value={phishingData.credentials_submitted}
                                    onChange={e => setPhishingData({ ...phishingData, credentials_submitted: parseInt(e.target.value) || 0 })}
                                    className="w-full mt-1 bg-transparent text-center font-bold text-base text-red-500 outline-none"
                                />
                            </div>

                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                                <div className="text-[10px] text-emerald-500 font-semibold uppercase">Reported</div>
                                <input
                                    type="number"
                                    value={phishingData.reported_count}
                                    onChange={e => setPhishingData({ ...phishingData, reported_count: parseInt(e.target.value) || 0 })}
                                    className="w-full mt-1 bg-transparent text-center font-bold text-base text-emerald-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">Executive Observations & Summary</label>
                            <textarea
                                value={phishingData.summary}
                                onChange={e => setPhishingData({ ...phishingData, summary: e.target.value })}
                                rows={3}
                                className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-foreground text-xs focus:ring-2 focus:ring-primary/20 outline-none resize-y"
                                placeholder="Summary of drill outcomes, behavioral improvements, and vulnerability hotspots..."
                            />
                        </div>

                        {/* Actionable Recommendations */}
                        <div className="pt-2">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold text-foreground">Follow-up Security Recommendations</label>
                                <button
                                    type="button"
                                    onClick={addPhishingRecommendation}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                                >
                                    <Plus className="size-3" /> Add Recommendation
                                </button>
                            </div>
                            <div className="space-y-2">
                                {phishingData.recommendations.map((rec, idx) => (
                                    <div key={idx} className="flex items-center gap-2 min-w-0">
                                        <input
                                            type="text"
                                            value={rec}
                                            onChange={e => updatePhishingRecommendation(idx, e.target.value)}
                                            className="min-w-0 flex-1 px-3 py-1.5 bg-muted/40 border border-border rounded-lg text-foreground text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => deletePhishingRecommendation(idx)}
                                            className="p-1.5 text-muted-foreground hover:text-destructive shrink-0 transition-colors cursor-pointer"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Template 3: Training & Learner Analytics */}
            {activeTemplate === 'training_analytics' && (
                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-border">
                            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                <BarChart3 className="size-4 text-blue-500" />
                                <span>Training Engagement & Progress Overview</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3.5 bg-muted/30 border border-border rounded-xl">
                                <label className="block text-[11px] font-semibold text-muted-foreground uppercase">Active Learners</label>
                                <input
                                    type="number"
                                    value={trainingData.active_learners}
                                    onChange={e => setTrainingData({ ...trainingData, active_learners: parseInt(e.target.value) || 0 })}
                                    className="w-full mt-1 bg-transparent font-bold text-lg text-foreground outline-none"
                                />
                            </div>

                            <div className="p-3.5 bg-muted/30 border border-border rounded-xl">
                                <label className="block text-[11px] font-semibold text-muted-foreground uppercase">Completion Rate (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={trainingData.course_completion_rate}
                                    onChange={e => setTrainingData({ ...trainingData, course_completion_rate: parseInt(e.target.value) || 0 })}
                                    className="w-full mt-1 bg-transparent font-bold text-lg text-emerald-500 outline-none"
                                />
                            </div>

                            <div className="p-3.5 bg-muted/30 border border-border rounded-xl">
                                <label className="block text-[11px] font-semibold text-muted-foreground uppercase">Avg Quiz Score (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={trainingData.average_quiz_score}
                                    onChange={e => setTrainingData({ ...trainingData, average_quiz_score: parseInt(e.target.value) || 0 })}
                                    className="w-full mt-1 bg-transparent font-bold text-lg text-primary outline-none"
                                />
                            </div>

                            <div className="p-3.5 bg-muted/30 border border-border rounded-xl">
                                <label className="block text-[11px] font-semibold text-muted-foreground uppercase">Total Hours Logged</label>
                                <input
                                    type="number"
                                    value={trainingData.total_hours_learned}
                                    onChange={e => setTrainingData({ ...trainingData, total_hours_learned: parseInt(e.target.value) || 0 })}
                                    className="w-full mt-1 bg-transparent font-bold text-lg text-foreground outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">Executive Summary of Learning Performance</label>
                            <textarea
                                value={trainingData.summary}
                                onChange={e => setTrainingData({ ...trainingData, summary: e.target.value })}
                                rows={3}
                                className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-foreground text-xs focus:ring-2 focus:ring-primary/20 outline-none resize-y"
                                placeholder="Summary of employee completion milestones, top certifications, and identified knowledge gaps..."
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Template 4: Custom Structured Report */}
            {activeTemplate === 'custom_report' && (
                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-border">
                            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                <Sparkles className="size-4 text-purple-500" />
                                <span>Custom Report Metrics & Key Performance Indicators</span>
                            </div>
                            <button
                                type="button"
                                onClick={addCustomMetric}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                            >
                                <Plus className="size-3.5" />
                                Add Metric
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {customData.metrics.map(metric => (
                                <div key={metric.id} className="p-3.5 bg-muted/30 border border-border rounded-xl space-y-2.5 min-w-0 overflow-hidden shadow-sm">
                                    <div className="flex items-center justify-between gap-2 min-w-0">
                                        <input
                                            type="text"
                                            value={metric.label}
                                            onChange={e => updateCustomMetric(metric.id, { label: e.target.value })}
                                            className="min-w-0 flex-1 font-semibold text-xs text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none truncate"
                                            placeholder="Metric Name"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => deleteCustomMetric(metric.id)}
                                            className="p-1 text-muted-foreground hover:text-destructive shrink-0 cursor-pointer rounded transition-colors"
                                            title="Delete metric"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 min-w-0">
                                        <input
                                            type="text"
                                            value={metric.value}
                                            onChange={e => updateCustomMetric(metric.id, { value: e.target.value })}
                                            className="min-w-0 flex-1 font-bold text-base text-foreground bg-transparent outline-none"
                                            placeholder="Value"
                                        />
                                        <select
                                            value={metric.status}
                                            onChange={e => updateCustomMetric(metric.id, { status: e.target.value as any })}
                                            className={`shrink-0 text-[11px] font-semibold px-2 py-1 rounded-md border outline-none cursor-pointer transition-colors ${
                                                metric.status === 'good'
                                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                    : metric.status === 'warning'
                                                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                    : metric.status === 'critical'
                                                    ? 'bg-red-500/10 text-red-600 border-red-500/20'
                                                    : 'bg-card text-foreground border-border'
                                            }`}
                                        >
                                            <option value="good" className="bg-card text-foreground">Good</option>
                                            <option value="warning" className="bg-card text-foreground">Warning</option>
                                            <option value="critical" className="bg-card text-foreground">Critical</option>
                                            <option value="neutral" className="bg-card text-foreground">Neutral</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">Executive Summary</label>
                            <textarea
                                value={customData.executive_summary}
                                onChange={e => setCustomData({ ...customData, executive_summary: e.target.value })}
                                rows={3}
                                className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-foreground text-xs focus:ring-2 focus:ring-primary/20 outline-none resize-y"
                                placeholder="Write the executive report narrative..."
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Optional Collapsible JSON Inspector Drawer */}
            <div className="pt-2 border-t border-border">
                <button
                    type="button"
                    onClick={() => setShowJsonPreview(!showJsonPreview)}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                    <Code className="size-3.5" />
                    {showJsonPreview ? 'Hide Auto-Generated JSON Payload' : 'View Auto-Generated JSON Payload (Background Sync)'}
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
                        <pre className="pr-20">{JSON.stringify(activePayload, null, 2)}</pre>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReportDataBuilder;
