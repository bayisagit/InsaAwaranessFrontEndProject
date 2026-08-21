export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://insaawaranessbackendproject.onrender.com';
// Types

// Login response — matches POST /api/auth/login/ 200 OK
export interface LoginResponse {
    access: string;
    refresh: string;
    user: User;
    dashboard_route: string;
    must_change_password: boolean;
}

export interface Tokens {
    access: string;
    refresh?: string;
}

export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    preferred_language: string;
    is_active: boolean;
    must_change_password: boolean;
    organization_id?: string;
    organization_name?: string;
    profile_photo?: string;
}

// Background profile — matches GET/PUT/PATCH /api/auth/user/background-profile/
export interface BackgroundProfile {
    id?: string;
    user?: string;
    phone_number: string;
    nationality: string;
    region?: string;
    age_range: string;
    gender: string;
    education_level: string;
    field_of_study: string;
    institution_name?: string;
    employment_status: string;
    employer_name?: string;
    unemployment_description?: string;
    professional_experience: string;
    enrollment_motivation: string;
    referral_source: string;
    is_information_confirmed: boolean;
    profile_photo?: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface Organization {
    id: string;
    name: string;
    description: string;
    created_by: string;
    created_at: string;
}

// Org Application — POST /api/v1/organization-applications/
export interface OrganizationApplication {
    id: string;
    name: string;
    description: string;
    contact_email: string;
    contact_phone: string;
    website?: string;
    address: string;
    submitted_by: string | null;
    status: 'pending' | 'approved' | 'rejected';
    reviewed_by: string | null;
    reviewed_at: string | null;
    created_at: string;
}

// Membership — matches /api/v1/memberships/
export interface Membership {
    id: string;
    user: string;
    organization: string;
    org_role: 'admin' | 'member';
    department?: string;
    employee_id?: string;
    is_primary: boolean;
    joined_at: string;
}

export interface PaymentApproval {
    id: string;
    organization: string;
    amount: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewed_by: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface ComplianceReport {
    id: string;
    organization: string;
    title: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    report_data: Record<string, any>;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface Resource {
    id: string;
    organization: string;
    title: string;
    content: string;
    file_url: string;
    category: string;
    audience: string;
    status: 'draft' | 'submitted' | 'published' | 'archived';
    rejection_reason?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface Enrollment {
    id: string;
    user: string;
    course: string; // UUID from backend; hydrate separately if needed
    progress: number;
    status: 'in_progress' | 'completed';
    updated_at: string;
}

export interface Article {
    id: string;
    module: string;
    content: string;
    order: number;
}

export interface Certificate {
    id: string;
    enrollment: string;
    certificate_id: string;
    issued_at: string;
    pdf_file: string | null;
}

export interface TrainingRequest {
    id: string;
    organization: string;
    created_by: string;
    description: string;
    attachment_url?: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
}

export interface AwarenessTool {
    id: string;
    name: string;
    description: string;
    status: 'enabled' | 'disabled';
    config: Record<string, any>;
    created_by: string;
    created_at: string;
    updated_at: string;
    usage_count: number;
}

export interface AwarenessToolUsage {
    id: string;
    tool: string;
    tool_name: string;
    user: string;
    user_email: string;
    action: string;
    metadata: string;
    created_at: string;
}

export interface Video {
    id: string;
    module: string;
    video_url: string;
    duration: number;
    order: number;
}

export interface Question {
    id: string;
    type: 'multiple_choice' | 'true_false' | 'matching' | 'multiple';
    question: string;
    options?: { id: string; label: string; text?: string }[];
    correct_answer: any;
}

export interface AssessmentPayload {
    questions: Question[];
}

export interface Lesson {
    id: string;
    module: string;
    title: string;
    content_type: 'article' | 'video' | 'assessment' | 'image';
    content?: string;
    media_url?: string;
    video_url?: string;
    image_url?: string;
    language?: string;
    assessment_type?: 'multiple_choice' | 'true_false' | 'matching' | 'multiple';
    assessment_payload?: AssessmentPayload | string;
    assessment?: Assessment;
    passing_score?: number;
    order: number;
    created_at?: string;
    updated_at?: string;
}


export interface Course {
    id: string;
    title: string;
    description?: string;
    course_provider?: string;
    created_by?: string;
    assigned_by?: string | null;
    organization?: string | null;
    language: string;
    level?: string;
    is_active?: boolean;
    status: 'draft' | 'submitted' | 'published' | 'archived';
    rejection_reason?: string;
    thumbnail_url?: string;
    modules?: CourseModule[];
    course_exams?: Assessment[];
    created_at: string;
}

// Module shape as returned inline in CourseDetailSerializer
export interface CourseModule {
    id: string;
    course: string;
    title: string;
    order: number;
    articles: Article[];
    videos: Video[];
    lessons: Lesson[];
    module_quizzes?: Assessment[];
}

// Module shape from /api/v1/modules/ (includes nested articles/videos/lessons)
export interface Module {
    id: string;
    course: string;
    title: string;
    order: number;
    articles?: Article[];
    videos?: Video[];
    lessons?: Lesson[];
}

// ─────────────────────────────────────────────────────────────
// Normalized Assessment System (v1 API)
// ─────────────────────────────────────────────────────────────

export type QuestionType =
    | 'multiple_choice'
    | 'multiple_select'
    | 'true_false'
    | 'fill_blank'
    | 'matching'
    | 'ordering'
    | 'short_answer'
    | 'essay';

export interface AssessmentChoice {
    id: string;
    question: string;
    text: string;
    value: string;
    is_correct: boolean;
    order: number;
    created_at: string;
}

export interface AssessmentQuestion {
    id: string;
    assessment: string;
    type: QuestionType;
    prompt: string;
    explanation: string;
    order: number;
    points: number;
    is_required: boolean;
    allow_multiple_selection: boolean;
    case_sensitive: boolean;
    correct_text_answer: string;
    requires_manual_grading: boolean;
    choices: AssessmentChoice[];
    matching_pairs: { id: string; left_text: string; right_text: string; order: number }[];
    ordering_items: { id: string; text: string; correct_order: number; order: number }[];
    created_at: string;
    updated_at: string;
}

export interface Assessment {
    id: string;
    lesson: string | null;
    module: string | null;
    course: string | null;
    parent_type: 'lesson_assessment' | 'module_quiz' | 'course_exam';
    title: string;
    description: string;
    passing_score: number;
    time_limit_minutes: number;
    shuffle_questions: boolean;
    assessment_payload: any; // read-only, legacy auto-generated — use questions[] instead
    questions: AssessmentQuestion[];
    created_at: string;
    updated_at: string;
}

export interface AssessmentAnswer {
    id: string;
    attempt: string;
    question: string;
    response_text: string;
    response_json: Record<string, any> | null;
    is_correct: boolean | null; // null = manual grading pending
    requires_manual_grading: boolean;
    score: number;
    graded_by: string | null;
    graded_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface AssessmentAttempt {
    id: string;
    assessment: string;
    user: string;
    attempt_number: number;
    status: 'started' | 'in_progress' | 'submitted' | 'graded' | 'needs_review';
    score: number;       // percentage 0–100
    max_score: number;   // sum of question.points
    passed: boolean;
    current_question_index: number;
    started_at: string;
    last_saved_at: string;
    submitted_at: string | null;
    graded_at: string | null;
    answers: AssessmentAnswer[];
    created_at: string;
    updated_at: string;
}


export interface Alert {
    id: string;
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
    status: 'draft' | 'published' | 'archived';
    notify_email: boolean;
    notify_sms: boolean;
    organization: string;
    created_by: string;
    published_at: string;
    created_at: string;
    updated_at: string;
    total_deliveries: number;
    sent_deliveries: number;
    failed_deliveries: number;
    views_count: number;
}

export interface Campaign {
    id: string;
    organization: string;
    title: string;
    message: string;
    start_date: string;
    send_time: string;
    channels: string[];
    status: 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';
    content_type?: 'none' | 'poster' | 'video' | null;
    content_url?: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface AlertDelivery {
    id: string;
    alert: string;
    user: string;
    user_email: string;
    channel: 'email' | 'sms';
    status: 'pending' | 'sent' | 'failed';
    detail: string;
    delivered_at: string;
    created_at: string;
}

export interface AlertView {
    id: string;
    alert: string;
    user: string;
    user_email: string;
    viewed_at: string;
}

// Notification — matches GET /api/v1/notifications/
export interface NotificationData {
    id: string;
    user?: string;
    message: string;
    type?: string;
    is_read: boolean;
    created_at: string;
}

// Audit Log — matches GET /api/v1/audit-logs/
export interface AuditLog {
    id: string;
    actor: string | null;
    actor_email: string | null;
    action: string;
    app_label: string;
    model: string;
    object_id: string;
    changes: Record<string, any>;
    created_at: string;
}

// Lesson Progress — matches GET /api/v1/lesson-progress/
export interface LessonProgress {
    id: string;
    user: string;
    lesson: string;
    completed: boolean;
    watched_seconds: number;
    updated_at: string;
}

// Verify Certificate Response — matches GET /api/v1/certificates/verify/{id}/
export interface VerifyCertificateResponse {
    valid: boolean;
    certificate_id?: string;
    issued_at?: string;
    user?: string;
    course?: string;
    detail?: string;
}

// Analytics Dashboard — matches GET /api/v1/analytics/dashboard/
export interface AnalyticsDashboard {
    users: {
        total: number;
        by_role: Record<string, number>;
    };
    courses: {
        total: number;
        by_status: Record<string, number>;
    };
    enrollments: {
        total: number;
        by_status: Record<string, number>;
        average_progress: number;
    };
    certificates: {
        total: number;
    };
    assessments: {
        total_attempts: number;
        average_score: number;
    };
    alerts: {
        total: number;
        published: number;
    };
}

// ── Overview — GET /api/v1/analytics/overview/ ─────────────────────
export interface AnalyticsOverview {
    total_users: number;
    total_organizations: number;
    total_courses: number;
    total_enrollments: number;
    total_completions: number;
    total_certificates: number;
}

// ── Growth data point ──────────────────────────────────────────────
export interface GrowthDataPoint {
    month: string;
    count: number;
}

// ── Course Comparison — GET /api/v1/analytics/course-comparison/ ──
export interface CourseComparisonItem {
    course_id: string;
    course_title: string;
    total_enrolled: number;
    completed: number;
    completion_rate: number;
    certificates_issued: number;
}

// ── Top Course ─────────────────────────────────────────────────────
export interface TopCourseItem {
    course_id: string;
    course_title: string;
    total_enrolled: number;
    completed: number;
    completion_rate: number;
}

// ── Course Workspace — GET /api/v1/analytics/courses/{id}/workspace/ ─
export interface CourseWorkspaceAnalytics {
    course_title: string;
    summary: {
        total_enrolled: number;
        active: number;
        completed: number;
        completion_percentage: number;
        certificates_issued: number;
        average_assessment_score: number;
    };
    learner_overview: {
        total: number;
        completed: number;
        in_progress: number;
    };
    enrollment_trend: GrowthDataPoint[];
    completion_trend: GrowthDataPoint[];
}

// ── Enrollment Demographics — GET /api/v1/analytics/courses/{id}/enrollment-demographics/ ──
export interface DemographicDistribution {
    total_enrolled: number;
    nationality: Record<string, number>;
    employment_status: Record<string, number>;
    age_range: Record<string, number>;
    gender: Record<string, number>;
    organizations: Record<string, number>;
}

// Token Management Hook-like helpers for local storage
export const getTokens = (): Tokens | null => {
    if (typeof window === 'undefined') return null;
    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    if (access) return { access, refresh: refresh || undefined };
    return null;
};

export const setTokens = (tokens: Tokens) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access_token', tokens.access);
    if (tokens.refresh) {
        localStorage.setItem('refresh_token', tokens.refresh);
    }
};

export const clearTokens = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};

// Advanced Fetch Wrapper
export async function apiFetch<T = any>(
    endpoint: string,
    options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
    try {
        const tokens = getTokens();
        const method = options.method || 'GET';
        const headers = new Headers(options.headers || {});

        // Auto-add JSON content type if not provided and it has a body
        if (options.body && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }

        // Defensive: If method is GET but there is a body, it's likely an error (unless it's a very specific case)
        // This helps catch cases where apiFetch('/url', { body: ... }) is called without method: 'POST'
        if (method === 'GET' && options.body) {
        }

        if (tokens?.access) {
            headers.set('Authorization', `Bearer ${tokens.access}`);
        }

        const config: RequestInit = {
            ...options,
            method: options.body && method === 'GET' ? 'POST' : method,
            headers,
        };

        let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // Refresh Token Logic
        if (response.status === 401 && tokens?.refresh && endpoint !== '/api/auth/refresh/') {
            const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: tokens.refresh }),
            });

            if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                setTokens({ access: refreshData.access, refresh: tokens.refresh }); // Keep old refresh token

                // Retry original request with new access token
                headers.set('Authorization', `Bearer ${refreshData.access}`);
                config.headers = headers;
                response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            } else {
                // Refresh failed, user needs to login again
                clearTokens();
                // optionally trigger a custom event that AuthProvider listens to
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('auth:unauthorized'));
                }
            }
        }

        const isJson = response.headers.get('content-type')?.includes('application/json');
        const data = isJson ? await response.json() : null;

        if (!response.ok) {
            let errorMessage = 'An error occurred';
            if (data && typeof data === 'object') {
                if (typeof data.detail === 'string' && data.detail) {
                    errorMessage = data.detail;
                } else if (typeof data.message === 'string' && data.message) {
                    errorMessage = data.message;
                } else {
                    const parts: string[] = [];
                    for (const [key, value] of Object.entries(data)) {
                        if (['status', 'redirect', 'status_code'].includes(key)) continue;
                        if (Array.isArray(value) && value.length > 0) {
                            parts.push(`${key}: ${value.join(', ')}`);
                        } else if (typeof value === 'string' && value) {
                            parts.push(`${key}: ${value}`);
                        }
                    }
                    if (parts.length > 0) errorMessage = parts.join('; ');
                }
            } else if (typeof data === 'string') {
                errorMessage = data;
            }

            return { data, error: errorMessage, status: response.status };
        }

        return { data, status: response.status };
    } catch (error: any) {
        return { error: error.message || 'Network error', status: 500 };
    }
}


// Organizations (singular getter — list/create/update/delete are below)
export const getOrganization = (id: string) =>
    apiFetch<Organization>(`/api/v1/organizations/${id}/`);

// Payment Approvals
export const getPaymentApprovals = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<PaymentApproval>>(`/api/v1/payment-approvals/${query}`);
};

export const createPaymentApproval = (data: Partial<PaymentApproval>) =>
    apiFetch<PaymentApproval>('/api/v1/payment-approvals/', { method: 'POST', body: JSON.stringify(data) });

export const getPaymentApproval = (id: string) =>
    apiFetch<PaymentApproval>(`/api/v1/payment-approvals/${id}/`);

export const updatePaymentApproval = (id: string, data: Partial<PaymentApproval>, patch = true) =>
    apiFetch<PaymentApproval>(`/api/v1/payment-approvals/${id}/`, { method: patch ? 'PATCH' : 'PUT', body: JSON.stringify(data) });

export const deletePaymentApproval = (id: string) =>
    apiFetch(`/api/v1/payment-approvals/${id}/`, { method: 'DELETE' });

export const approvePaymentApproval = (id: string, data: any) =>
    apiFetch<PaymentApproval>(`/api/v1/payment-approvals/${id}/approve/`, { method: 'POST', body: JSON.stringify(data) });

export const rejectPaymentApproval = (id: string, data: any) =>
    apiFetch<PaymentApproval>(`/api/v1/payment-approvals/${id}/reject/`, { method: 'POST', body: JSON.stringify(data) });

// Compliance Reports
export const getComplianceReports = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<ComplianceReport>>(`/api/v1/compliance-reports/${query}`);
};

export const createComplianceReport = (data: Partial<ComplianceReport>) =>
    apiFetch<ComplianceReport>('/api/v1/compliance-reports/', { method: 'POST', body: JSON.stringify(data) });

export const getComplianceReport = (id: string) =>
    apiFetch<ComplianceReport>(`/api/v1/compliance-reports/${id}/`);

export const updateComplianceReport = (id: string, data: Partial<ComplianceReport>, patch = true) =>
    apiFetch<ComplianceReport>(`/api/v1/compliance-reports/${id}/`, { method: patch ? 'PATCH' : 'PUT', body: JSON.stringify(data) });

export const deleteComplianceReport = (id: string) =>
    apiFetch(`/api/v1/compliance-reports/${id}/`, { method: 'DELETE' });

// Resources
export const getResources = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<Resource>>(`/api/v1/resources/${query}`);
};

export const createResource = (data: Partial<Resource>) =>
    apiFetch<Resource>('/api/v1/resources/', { method: 'POST', body: JSON.stringify(data) });

export const getResource = (id: string) =>
    apiFetch<Resource>(`/api/v1/resources/${id}/`);

export const updateResource = (id: string, data: Partial<Resource>, patch = true) =>
    apiFetch<Resource>(`/api/v1/resources/${id}/`, { method: patch ? 'PATCH' : 'PUT', body: JSON.stringify(data) });

export const deleteResource = (id: string) =>
    apiFetch(`/api/v1/resources/${id}/`, { method: 'DELETE' });

export const submitResourceForReview = (id: string) =>
    apiFetch<Resource>(`/api/v1/resources/${id}/submit-for-review/`, { method: 'POST', body: JSON.stringify({}) });

export const approveResource = (id: string) =>
    apiFetch<Resource>(`/api/v1/resources/${id}/approve/`, { method: 'POST', body: JSON.stringify({}) });

export const rejectResource = (id: string, rejection_reason: string) =>
    apiFetch<Resource>(`/api/v1/resources/${id}/reject/`, { method: 'POST', body: JSON.stringify({ rejection_reason }) });

export const withdrawResource = (id: string) =>
    apiFetch<Resource>(`/api/v1/resources/${id}/withdraw/`, { method: 'POST', body: JSON.stringify({}) });

export const downloadResourceFile = async (id: string): Promise<Blob | null> => {
    const tokens = getTokens();
    const headers: Record<string, string> = {};
    if (tokens?.access) {
        headers['Authorization'] = `Bearer ${tokens.access}`;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/resources/${id}/download/`, { headers });
        if (!response.ok) return null;
        return await response.blob();
    } catch {
        return null;
    }
};

// Training Requests
export const getTrainingRequests = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<TrainingRequest>>(`/api/v1/training-requests/${query}`);
};

// Per API docs: only send description + optional attachment_url.
// The backend auto-assigns the caller's primary organization.
export const createTrainingRequest = (payload: { description: string; attachment_url?: string }) =>
    apiFetch<TrainingRequest>('/api/v1/training-requests/', { method: 'POST', body: JSON.stringify(payload) });

export const getTrainingRequest = (id: string) =>
    apiFetch<TrainingRequest>(`/api/v1/training-requests/${id}/`);

export const updateTrainingRequest = (id: string, data: Partial<TrainingRequest>, patch = true) =>
    apiFetch<TrainingRequest>(`/api/v1/training-requests/${id}/`, { method: patch ? 'PATCH' : 'PUT', body: JSON.stringify(data) });

export const deleteTrainingRequest = (id: string) =>
    apiFetch(`/api/v1/training-requests/${id}/`, { method: 'DELETE' });

export const approveTrainingRequest = (id: string) =>
    apiFetch<{ detail: string }>(`/api/v1/training-requests/${id}/approve/`, { method: 'POST', body: JSON.stringify({}) });

export const rejectTrainingRequest = (id: string) =>
    apiFetch<{ detail: string }>(`/api/v1/training-requests/${id}/reject/`, { method: 'POST', body: JSON.stringify({}) });

// ──────────────────────────────────────────────────────────
// Organization CRUD helpers
// ──────────────────────────────────────────────────────────

export const getOrganizations = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<Organization>>(`/api/v1/organizations/${query}`);
};

export const createOrganization = (data: { name: string; description?: string }) =>
    apiFetch<Organization>('/api/v1/organizations/', { method: 'POST', body: JSON.stringify(data) });

export const updateOrganization = (id: string, data: { name?: string; description?: string }) =>
    apiFetch<Organization>(`/api/v1/organizations/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteOrganization = (id: string) =>
    apiFetch(`/api/v1/organizations/${id}/`, { method: 'DELETE' });

// ──────────────────────────────────────────────────────────
// Organization Applications helpers
// ──────────────────────────────────────────────────────────

export const getOrgApplications = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<OrganizationApplication>>(`/api/v1/organization-applications/${query}`);
};

export const getOrgApplication = (id: string) =>
    apiFetch<OrganizationApplication>(`/api/v1/organization-applications/${id}/`);

export const createOrgApplication = (data: {
    name: string;
    description: string;
    contact_email: string;
    contact_phone: string;
    address: string;
    website?: string;
}) =>
    apiFetch<OrganizationApplication>('/api/v1/organization-applications/', { method: 'POST', body: JSON.stringify(data) });

export const approveOrgApplication = (id: string) =>
    apiFetch<{ detail: string; organization_id: string }>(`/api/v1/organization-applications/${id}/approve/`, { method: 'POST', body: JSON.stringify({}) });

export const rejectOrgApplication = (id: string) =>
    apiFetch<{ detail: string }>(`/api/v1/organization-applications/${id}/reject/`, { method: 'POST', body: JSON.stringify({}) });

// ──────────────────────────────────────────────────────────
// Memberships helpers
// ──────────────────────────────────────────────────────────

export const getMemberships = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<Membership>>(`/api/v1/memberships/${query}`);
};

export const createMembership = (data: {
    user: string;
    organization: string;
    org_role?: 'admin' | 'member';
    department?: string;
    employee_id?: string;
    is_primary?: boolean;
}) =>
    apiFetch<Membership>('/api/v1/memberships/', { method: 'POST', body: JSON.stringify(data) });

export const updateMembership = (id: string, data: Partial<Membership>) =>
    apiFetch<Membership>(`/api/v1/memberships/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteMembership = (id: string) =>
    apiFetch(`/api/v1/memberships/${id}/`, { method: 'DELETE' });


// Awareness Tools (SuperAdmin)
export const getAwarenessTools = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<AwarenessTool>>(`/api/v1/superadmin/awareness-tools/${query}`);
};

export const createAwarenessTool = (data: Partial<AwarenessTool>) =>
    apiFetch<AwarenessTool>('/api/v1/superadmin/awareness-tools/', { method: 'POST', body: JSON.stringify(data) });

export const getAwarenessTool = (id: string) =>
    apiFetch<AwarenessTool>(`/api/v1/superadmin/awareness-tools/${id}/`);

export const updateAwarenessTool = (id: string, data: Partial<AwarenessTool>, patch = true) =>
    apiFetch<AwarenessTool>(`/api/v1/superadmin/awareness-tools/${id}/`, { method: patch ? 'PATCH' : 'PUT', body: JSON.stringify(data) });

export const deleteAwarenessTool = (id: string) =>
    apiFetch(`/api/v1/superadmin/awareness-tools/${id}/`, { method: 'DELETE' });

export const configureAwarenessTool = (id: string, data: any) =>
    apiFetch<AwarenessTool>(`/api/v1/superadmin/awareness-tools/${id}/configure/`, { method: 'POST', body: JSON.stringify(data) });

export const toggleAwarenessToolStatus = (id: string, data: any = {}) =>
    apiFetch<AwarenessTool>(`/api/v1/superadmin/awareness-tools/${id}/toggle-status/`, { method: 'PATCH', body: JSON.stringify(data) });

export const getPublicAwarenessTools = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<AwarenessTool>>(`/api/v1/awareness-tools/${query}`);
};

export const recordAwarenessToolUsage = (data: { tool: string; action: string; metadata?: string }) =>
    apiFetch<AwarenessToolUsage>('/api/v1/awareness-tools/record-usage/', {
        method: 'POST',
        body: JSON.stringify(data)
    });

export const getAwarenessToolUsage = (id: string) =>
    apiFetch<AwarenessTool>(`/api/v1/superadmin/awareness-tools/${id}/usage/`);

export const getAwarenessToolUsageStats = () =>
    apiFetch<AwarenessTool>('/api/v1/superadmin/awareness-tools/usage-stats/');

// Awareness Tool Usages (SuperAdmin)
export const getAwarenessToolUsages = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<AwarenessToolUsage>>(`/api/v1/superadmin/awareness-tool-usages/${query}`);
};

export const getAwarenessToolUsageDetail = (id: string) =>
    apiFetch<AwarenessToolUsage>(`/api/v1/superadmin/awareness-tool-usages/${id}/`);


// Videos
export const getVideos = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<Video>>(`/api/v1/videos/${query}`);
};

export const createVideo = (data: Partial<Video>) =>
    apiFetch<Video>('/api/v1/videos/', { method: 'POST', body: JSON.stringify(data) });

export const getVideo = (id: string) =>
    apiFetch<Video>(`/api/v1/videos/${id}/`);

export const updateVideo = (id: string, data: Partial<Video>, patch = true) =>
    apiFetch<Video>(`/api/v1/videos/${id}/`, { method: patch ? 'PATCH' : 'PUT', body: JSON.stringify(data) });

export const deleteVideo = (id: string) =>
    apiFetch(`/api/v1/videos/${id}/`, { method: 'DELETE' });

// Courses
export const getCourses = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<Course>>(`/api/v1/courses/${query}`);
};

export const createCourse = (data: Partial<Course>) =>
    apiFetch<Course>('/api/v1/courses/', { method: 'POST', body: JSON.stringify(data) });

export const getCourse = (id: string) =>
    apiFetch<Course>(`/api/v1/courses/${id}/`);

export const updateCourse = (id: string, data: Partial<Course>, patch = true) =>
    apiFetch<Course>(`/api/v1/courses/${id}/`, { method: patch ? 'PATCH' : 'PUT', body: JSON.stringify(data) });

export const deleteCourse = (id: string) =>
    apiFetch(`/api/v1/courses/${id}/`, { method: 'DELETE' });

// Modules
export const getModules = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<Module>>(`/api/v1/modules/${query}`);
};

export const createModule = (data: Partial<Module>) =>
    apiFetch<Module>('/api/v1/modules/', { method: 'POST', body: JSON.stringify(data) });

export const getModule = (id: string) =>
    apiFetch<Module>(`/api/v1/modules/${id}/`);

export const updateModule = (id: string, data: Partial<Module>, patch = true) =>
    apiFetch<Module>(`/api/v1/modules/${id}/`, { method: patch ? 'PATCH' : 'PUT', body: JSON.stringify(data) });

export const deleteModule = (id: string) =>
    apiFetch(`/api/v1/modules/${id}/`, { method: 'DELETE' });

// Alerts
export const getAlerts = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<Alert>>(`/api/v1/alerts/${query}`);
};

export const createAlert = (data: Partial<Alert>) =>
    apiFetch<Alert>('/api/v1/alerts/', { method: 'POST', body: JSON.stringify(data) });

export const getAlert = (id: string) =>
    apiFetch<Alert>(`/api/v1/alerts/${id}/`);

export const updateAlert = (id: string, data: Partial<Alert>, patch = true) =>
    apiFetch<Alert>(`/api/v1/alerts/${id}/`, { method: patch ? 'PATCH' : 'PUT', body: JSON.stringify(data) });

export const deleteAlert = (id: string) =>
    apiFetch(`/api/v1/alerts/${id}/`, { method: 'DELETE' });

export const publishAlert = (id: string, data: any = {}) =>
    apiFetch<Alert>(`/api/v1/alerts/${id}/publish/`, { method: 'POST', body: JSON.stringify(data) });

export const acknowledgeAlert = (id: string, data: any = {}) =>
    apiFetch<Alert>(`/api/v1/alerts/${id}/acknowledge/`, { method: 'POST', body: JSON.stringify(data) });

// Alert Deliveries
export const getAlertDeliveries = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<AlertDelivery>>(`/api/v1/alert-deliveries/${query}`);
};

// Alert Views
export const getAlertViews = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<AlertView>>(`/api/v1/alert-views/${query}`);
};

// Enrollments
export const getEnrollments = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<Enrollment>>(`/api/v1/enrollments/${query}`);
};

export const createEnrollment = (userId: string, courseId: string) =>
    // Per API docs: only send user + course. Backend defaults progress=0, status=in_progress.
    apiFetch<Enrollment>('/api/v1/enrollments/', {
        method: 'POST',
        body: JSON.stringify({ user: userId, course: courseId })
    });

// Keep old name as alias for backwards compat
export const enrollInCourse = createEnrollment;

export const updateEnrollment = (id: string, data: { progress?: number; status?: 'in_progress' | 'completed' }) =>
    apiFetch<Enrollment>(`/api/v1/enrollments/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });

export const deleteEnrollment = (id: string) =>
    apiFetch(`/api/v1/enrollments/${id}/`, { method: 'DELETE' });

// Campaigns
export const getCampaigns = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<Campaign>>(`/api/v1/campaigns/${query}`);
};

// ──────────────────────────────────────────────────────────
// Assessment submit/attempts — NOTE: endpoint is /videos/{lesson_id}/ (not /lessons/)
// ──────────────────────────────────────────────────────────
export const submitLessonAttempt = (lessonId: string, answers: Record<string, any>) =>
    apiFetch(`/api/v1/videos/${lessonId}/submit/`, {
        method: 'POST',
        body: JSON.stringify({ answers })
    });

export const getLessonAttempts = (lessonId: string) =>
    apiFetch(`/api/v1/videos/${lessonId}/attempts/`);

export const getLessonAttemptDetail = (lessonId: string, attemptId: string) =>
    apiFetch(`/api/v1/videos/${lessonId}/attempts/${attemptId}/`);

// Lessons
export const getLessons = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<Lesson>>(`/api/v1/lessons/${query}`);
};

export const createLesson = (data: Partial<Lesson>) =>
    apiFetch<Lesson>('/api/v1/lessons/', { method: 'POST', body: JSON.stringify(data) });

export const getLesson = (id: string) =>
    apiFetch<Lesson>(`/api/v1/lessons/${id}/`);

export const updateLesson = (id: string, data: Partial<Lesson>, patch = true) =>
    apiFetch<Lesson>(`/api/v1/lessons/${id}/`, { method: patch ? 'PATCH' : 'PUT', body: JSON.stringify(data) });

export const deleteLesson = (id: string) =>
    apiFetch(`/api/v1/lessons/${id}/`, { method: 'DELETE' });


// Course actions (super_admin only)
export const assignCourseProvider = (courseId: string, providerId: string) =>
    apiFetch<{ detail: string }>(`/api/v1/courses/${courseId}/assign-provider/`, {
        method: 'POST',
        body: JSON.stringify({ provider_id: providerId })
    });

export const assignCourseOrganization = (courseId: string, organizationId: string | null) =>
    apiFetch<{ detail: string }>(`/api/v1/courses/${courseId}/assign-organization/`, {
        method: 'POST',
        body: JSON.stringify({ organization_id: organizationId })
    });

// Course approval workflow
export const submitCourseForReview = (courseId: string) =>
    apiFetch<Course>(`/api/v1/courses/${courseId}/submit-for-review/`, { method: 'POST', body: JSON.stringify({}) });

export const approveCourse = (courseId: string) =>
    apiFetch<Course>(`/api/v1/courses/${courseId}/approve/`, { method: 'POST', body: JSON.stringify({}) });

export const rejectCourse = (courseId: string, rejection_reason: string) =>
    apiFetch<Course>(`/api/v1/courses/${courseId}/reject/`, { method: 'POST', body: JSON.stringify({ rejection_reason }) });

export const withdrawCourse = (courseId: string) =>
    apiFetch<Course>(`/api/v1/courses/${courseId}/withdraw/`, { method: 'POST', body: JSON.stringify({}) });

// Articles (legacy module content)
export const getArticles = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<Article>>(`/api/v1/articles/${query}`);
};

export const createArticle = (data: { module: string; content: string; order?: number }) =>
    apiFetch<Article>('/api/v1/articles/', { method: 'POST', body: JSON.stringify(data) });

export const updateArticle = (id: string, data: Partial<Article>) =>
    apiFetch<Article>(`/api/v1/articles/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteArticle = (id: string) =>
    apiFetch(`/api/v1/articles/${id}/`, { method: 'DELETE' });

// Certificates (read-only — auto-created on enrollment completion)
export const getCertificates = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<Certificate>>(`/api/v1/certificates/${query}`);
};

export const getCertificate = (id: string) =>
    apiFetch<Certificate>(`/api/v1/certificates/${id}/`);

// ──────────────────────────────────────────────────────────
// Auth helpers
// ──────────────────────────────────────────────────────────

// Change password — PUT /api/auth/change-password/
export const changePassword = (oldPassword: string, newPassword: string) =>
    apiFetch<{ detail: string }>('/api/auth/change-password/', {
        method: 'PUT',
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });

// Background profile — GET /api/auth/user/background-profile/
export const getBackgroundProfile = () =>
    apiFetch<BackgroundProfile>('/api/auth/user/background-profile/');

// Background profile — PATCH /api/auth/user/background-profile/
export const updateBackgroundProfile = (data: Partial<BackgroundProfile>) =>
    apiFetch<BackgroundProfile>('/api/auth/user/background-profile/', {
        method: 'PATCH',
        body: JSON.stringify(data),
    });

// Login — POST /api/auth/login/
export const loginUser = (email: string, password: string) =>
    apiFetch<LoginResponse>('/api/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

// Register — POST /api/auth/register/
export interface RegisterPayload {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    preferred_language?: string;
}
export const registerUser = (payload: RegisterPayload) =>
    apiFetch('/api/auth/register/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

// Password reset request — POST /api/auth/password-reset/
export const requestPasswordReset = (email: string) =>
    apiFetch<{ detail: string; uid?: string; token?: string }>('/api/auth/password-reset/', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });

// Password reset confirm — POST /api/auth/password-reset/confirm/
export const confirmPasswordReset = (uid: string, token: string, newPassword: string) =>
    apiFetch<{ detail: string }>('/api/auth/password-reset/confirm/', {
        method: 'POST',
        body: JSON.stringify({ uid, token, new_password: newPassword }),
    });

// Social auth — POST /api/auth/social/google/
export const loginWithGoogle = (accessToken: string) =>
    apiFetch<LoginResponse>('/api/auth/social/google/', {
        method: 'POST',
        body: JSON.stringify({ access_token: accessToken }),
    });

// Social auth — POST /api/auth/social/github/
export const loginWithGitHub = (code: string) =>
    apiFetch<LoginResponse>('/api/auth/social/github/', {
        method: 'POST',
        body: JSON.stringify({ code }),
    });

// Logout — POST /api/auth/logout/
export const logoutUser = (refresh: string) =>
    apiFetch<{ detail: string }>('/api/auth/logout/', {
        method: 'POST',
        body: JSON.stringify({ refresh }),
    });

// ─────────────────────────────────────────────────────────────
// Normalized Assessment System Helpers
// ─────────────────────────────────────────────────────────────

// ── Assessments ──────────────────────────────────────────────
export const getAssessments = (params?: Record<string, any>) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiFetch<{ count: number; results: Assessment[] }>(`/api/v1/assessments/${qs}`);
};

export const createAssessment = (data: {
    lesson?: string;
    module?: string;
    course?: string;
    parent_type?: 'lesson_assessment' | 'module_quiz' | 'course_exam';
    title?: string;
    description?: string;
    passing_score?: number;
    time_limit_minutes?: number;
    shuffle_questions?: boolean;
}) => apiFetch<Assessment>('/api/v1/assessments/', { method: 'POST', body: JSON.stringify(data) });

export const getAssessment = (id: string) =>
    apiFetch<Assessment>(`/api/v1/assessments/${id}/`);

export const updateAssessment = (id: string, data: Partial<{
    title: string;
    description: string;
    passing_score: number;
    time_limit_minutes: number;
    shuffle_questions: boolean;
    legacy_assessment_payload: object; // ⚠ hard-deletes all existing questions — use with caution
}>) => apiFetch<Assessment>(`/api/v1/assessments/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteAssessment = (id: string) =>
    apiFetch(`/api/v1/assessments/${id}/`, { method: 'DELETE' });

// ── Assessment Attempt Actions ────────────────────────────────

/** Always call resumeAssessment first; only startAssessment on 404 */
export const startAssessment = (id: string) =>
    apiFetch<AssessmentAttempt>(`/api/v1/assessments/${id}/start/`, { method: 'POST', body: '{}' });

/** Returns 404 if no active attempt */
export const resumeAssessment = (id: string) =>
    apiFetch<AssessmentAttempt>(`/api/v1/assessments/${id}/resume/`);

/** Save one answer or a batch without submitting */
export const saveAssessmentProgress = (id: string, data: {
    question_id?: string;
    answer?: any;
    current_question_index?: number;
    answers?: Record<string, any>;
}) => apiFetch<AssessmentAttempt>(`/api/v1/assessments/${id}/save-progress/`, {
    method: 'POST',
    body: JSON.stringify(data),
});

/** Finalize and grade the active attempt */
export const submitAssessment = (id: string, answers?: Record<string, any>) =>
    apiFetch<AssessmentAttempt>(`/api/v1/assessments/${id}/submit/`, {
        method: 'POST',
        body: JSON.stringify({ answers: answers ?? {} }),
    });

/** Plain array of current user's attempts, newest first */
export const getAssessmentAttempts = (id: string) =>
    apiFetch<AssessmentAttempt[]>(`/api/v1/assessments/${id}/attempts/`);

// ── Assessment Questions ──────────────────────────────────────

export const getAssessmentQuestions = (params?: Record<string, any>) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiFetch<{ count: number; results: AssessmentQuestion[] }>(`/api/v1/assessment-questions/${qs}`);
};

export const createAssessmentQuestion = (data: {
    assessment: string;
    type: QuestionType;
    prompt: string;
    order: number;
    explanation?: string;
    points?: number;
    is_required?: boolean;
    allow_multiple_selection?: boolean;
    case_sensitive?: boolean;
    correct_text_answer?: string;
}) => apiFetch<AssessmentQuestion>('/api/v1/assessment-questions/', {
    method: 'POST',
    body: JSON.stringify(data),
});

export const updateAssessmentQuestion = (id: string, data: Partial<{
    prompt: string;
    explanation: string;
    points: number;
    order: number;
    is_required: boolean;
    case_sensitive: boolean;
    correct_text_answer: string;
}>) => apiFetch<AssessmentQuestion>(`/api/v1/assessment-questions/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
});

export const deleteAssessmentQuestion = (id: string) =>
    apiFetch(`/api/v1/assessment-questions/${id}/`, { method: 'DELETE' });

// ── Assessment Choices ────────────────────────────────────────

export const getAssessmentChoices = (params?: Record<string, any>) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiFetch<{ count: number; results: AssessmentChoice[] }>(`/api/v1/assessment-choices/${qs}`);
};

export const createAssessmentChoice = (data: {
    question: string;
    text: string;
    order: number;
    is_correct?: boolean;
    value?: string;
}) => apiFetch<AssessmentChoice>('/api/v1/assessment-choices/', {
    method: 'POST',
    body: JSON.stringify(data),
});

export const updateAssessmentChoice = (id: string, data: Partial<{
    text: string;
    value: string;
    is_correct: boolean;
    order: number;
}>) => apiFetch<AssessmentChoice>(`/api/v1/assessment-choices/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
});

export const deleteAssessmentChoice = (id: string) =>
    apiFetch(`/api/v1/assessment-choices/${id}/`, { method: 'DELETE' });

// ── Assessment Matching Pairs ─────────────────────────────────

export const createAssessmentMatchingPair = (data: {
    question: string;
    left_text: string;
    right_text: string;
    order: number;
}) => apiFetch<any>('/api/v1/assessment-matching-pairs/', {
    method: 'POST',
    body: JSON.stringify(data),
});

export const updateAssessmentMatchingPair = (id: string, data: Partial<{
    left_text: string;
    right_text: string;
    order: number;
}>) => apiFetch<any>(`/api/v1/assessment-matching-pairs/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
});

export const deleteAssessmentMatchingPair = (id: string) =>
    apiFetch(`/api/v1/assessment-matching-pairs/${id}/`, { method: 'DELETE' });

// ── Assessment Ordering Items ─────────────────────────────────

export const createAssessmentOrderingItem = (data: {
    question: string;
    text: string;
    order: number;
}) => apiFetch<any>('/api/v1/assessment-ordering-items/', {
    method: 'POST',
    body: JSON.stringify(data),
});

export const updateAssessmentOrderingItem = (id: string, data: Partial<{
    text: string;
    order: number;
}>) => apiFetch<any>(`/api/v1/assessment-ordering-items/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
});

export const deleteAssessmentOrderingItem = (id: string) =>
    apiFetch(`/api/v1/assessment-ordering-items/${id}/`, { method: 'DELETE' });

// ──────────────────────────────────────────────────────────
// Certificate Actions
// ──────────────────────────────────────────────────────────
export const verifyCertificate = (certificateId: string) =>
    apiFetch<VerifyCertificateResponse>(`/api/v1/certificates/verify/${certificateId}/`);

export const downloadCertificate = async (id: string) => {
    const tokens = getTokens();
    const headers: Record<string, string> = {};
    if (tokens?.access) {
        headers['Authorization'] = `Bearer ${tokens.access}`;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/certificates/${id}/download/`, { headers });
        if (!response.ok) {
            if (response.status === 401 && tokens?.refresh) {
                const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh: tokens.refresh }),
                });
                if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    setTokens({ access: refreshData.access, refresh: tokens.refresh });
                    headers['Authorization'] = `Bearer ${refreshData.access}`;
                    const retry = await fetch(`${API_BASE_URL}/api/v1/certificates/${id}/download/`, { headers });
                    if (!retry.ok) return { data: null as unknown as Blob, error: `Download failed (status ${retry.status})`, status: retry.status };
                    const blob = await retry.blob();
                    return { data: blob, status: retry.status };
                }
                clearTokens();
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('auth:unauthorized'));
                }
                return { data: null as unknown as Blob, error: 'Session expired. Please log in again.', status: 401 };
            }
            return { data: null as unknown as Blob, error: `Download failed (status ${response.status})`, status: response.status };
        }
        const blob = await response.blob();
        return { data: blob, status: response.status };
    } catch (err) {
        return { data: null as unknown as Blob, error: err instanceof Error ? err.message : 'Download failed', status: 0 };
    }
};

export const generateCertificatePdf = (id: string) =>
    apiFetch<Certificate>(`/api/v1/certificates/${id}/generate-pdf/`, { method: 'POST', body: JSON.stringify({}) });

// ──────────────────────────────────────────────────────────
// Lesson Progress
// ──────────────────────────────────────────────────────────
export const getLessonProgress = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<LessonProgress>>(`/api/v1/lesson-progress/${query}`);
};

export const createLessonProgress = (data: { lesson: string; completed?: boolean; watched_seconds?: number }) =>
    apiFetch<LessonProgress>('/api/v1/lesson-progress/', { method: 'POST', body: JSON.stringify(data) });

export const getLessonProgressDetail = (id: string) =>
    apiFetch<LessonProgress>(`/api/v1/lesson-progress/${id}/`);

export const updateLessonProgress = (id: string, data: Partial<{ completed: boolean; watched_seconds: number }>) =>
    apiFetch<LessonProgress>(`/api/v1/lesson-progress/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteLessonProgress = (id: string) =>
    apiFetch(`/api/v1/lesson-progress/${id}/`, { method: 'DELETE' });

// ──────────────────────────────────────────────────────────
// Audit Logs
// ──────────────────────────────────────────────────────────
export const getAuditLogs = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<AuditLog>>(`/api/v1/audit-logs/${query}`);
};

export const getAuditLog = (id: string) =>
    apiFetch<AuditLog>(`/api/v1/audit-logs/${id}/`);

// ──────────────────────────────────────────────────────────
// Analytics Dashboard
// ──────────────────────────────────────────────────────────
export const getAnalyticsDashboard = () =>
    apiFetch<AnalyticsDashboard>('/api/v1/analytics/dashboard/');

export const getAnalyticsOverview = () =>
    apiFetch<AnalyticsOverview>('/api/v1/analytics/overview/');

export const getEnrollmentGrowth = (months = 12) =>
    apiFetch<GrowthDataPoint[]>(`/api/v1/analytics/enrollment-growth/?months=${months}`);

export const getUserGrowth = (months = 12) =>
    apiFetch<GrowthDataPoint[]>(`/api/v1/analytics/user-growth/?months=${months}`);

export const getCourseComparison = (params?: { course_ids?: string; date_from?: string; date_to?: string }) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<CourseComparisonItem[]>(`/api/v1/analytics/course-comparison/${query}`);
};

export const getTopCourses = (limit = 10) =>
    apiFetch<TopCourseItem[]>(`/api/v1/analytics/top-courses/?limit=${limit}`);

export const getCourseWorkspaceAnalytics = (courseId: string) =>
    apiFetch<CourseWorkspaceAnalytics>(`/api/v1/analytics/courses/${courseId}/workspace/`);

export const getCourseEnrollmentDemographics = (courseId: string) =>
    apiFetch<DemographicDistribution>(`/api/v1/analytics/courses/${courseId}/enrollment-demographics/`);

// ──────────────────────────────────────────────────────────
// Email Verification
// ──────────────────────────────────────────────────────────
export const verifyEmail = (uid: string, token: string) =>
    apiFetch<{ detail: string }>('/api/auth/verify-email/', {
        method: 'POST',
        body: JSON.stringify({ uid, token }),
    });

export const resendVerificationEmail = (email: string) =>
    apiFetch<{ detail: string }>('/api/auth/resend-verification/', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });

// ──────────────────────────────────────────────────────────
// Notifications — convenience wrappers
// ──────────────────────────────────────────────────────────
export const getNotifications = (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch<PaginatedResponse<NotificationData>>(`/api/v1/notifications/${query}`);
};

export const markNotificationRead = (id: string) =>
    apiFetch<{ detail: string }>(`/api/v1/notifications/${id}/mark_read/`, { method: 'POST', body: JSON.stringify({}) });

export const markNotificationUnread = (id: string) =>
    apiFetch<{ detail: string }>(`/api/v1/notifications/${id}/mark_unread/`, { method: 'POST', body: JSON.stringify({}) });

