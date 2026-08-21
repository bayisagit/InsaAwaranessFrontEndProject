import re

with open('src/app/dashboard/courses/[courseId]/page.tsx', 'r') as f:
    content = f.read()

# 1. Change component signature
content = content.replace("export default function LearnerWorkspacePage() {", "export function CourseLearnerView({ courseId, previewMode = false }: { courseId: string; previewMode?: boolean }) {")

# 2. Remove useParams for courseId
content = re.sub(r'const \{ courseId \} = useParams<\{ courseId: string \}>\(\);\n\s*', '', content)

# 3. Update fetchCourseData for previewMode
orig_fetch = """        const [courseRes, enrollRes] = await Promise.all([
            apiFetch(`/api/v1/courses/${courseId}/`),
            apiFetch(`/api/v1/enrollments/?course=${courseId}&user=${user?.id}`)
        ]);"""
new_fetch = """        const courseRes = await apiFetch(`/api/v1/courses/${courseId}/`);
        let enrollRes: any = { data: null };
        if (!previewMode) {
            enrollRes = await apiFetch(`/api/v1/enrollments/?course=${courseId}&user=${user?.id}`);
        }"""
content = content.replace(orig_fetch, new_fetch)

# 4. Update enrollRes handling
orig_enroll_handling = """        if (enrollRes.data) {
            const results = enrollRes.data.results || (Array.isArray(enrollRes.data) ? enrollRes.data : []);
            const foundEnrollment = results[0] || null;
            setIsEnrolled(!!foundEnrollment);
            setEnrollment(foundEnrollment);
        }"""
new_enroll_handling = """        if (previewMode) {
            setIsEnrolled(true);
        } else if (enrollRes.data) {
            const results = enrollRes.data.results || (Array.isArray(enrollRes.data) ? enrollRes.data : []);
            const foundEnrollment = results[0] || null;
            setIsEnrolled(!!foundEnrollment);
            setEnrollment(foundEnrollment);
        }"""
content = content.replace(orig_enroll_handling, new_enroll_handling)

# 5. Update Back Links
content = content.replace('href="/dashboard/courses"', 'href={previewMode ? `/admin/courses/${courseId}` : "/dashboard/courses"}')
content = content.replace('My Courses\n', '{previewMode ? "Admin Workspace" : "My Courses"}\n')
content = content.replace('← Back to My Courses', '← Back to {previewMode ? "Admin Workspace" : "My Courses"}')
content = content.replace('My Courses\r\n', '{previewMode ? "Admin Workspace" : "My Courses"}\n')

# 6. Add Preview Banner
orig_main_area = """            {/* Main Content Area */}
            <SidebarInset className="flex flex-col flex-1 overflow-hidden h-screen bg-muted/30">"""
new_main_area = """            {/* Main Content Area */}
            <SidebarInset className="flex flex-col flex-1 overflow-hidden h-screen bg-muted/30">
                {previewMode && (
                    <div className="bg-yellow-500 text-yellow-950 px-4 py-2 text-center text-sm font-bold shadow-md z-[60] flex items-center justify-center gap-2">
                        👁 Preview Mode — Learner progress, assessments, and analytics are simulated and not saved.
                    </div>
                )}"""
content = content.replace(orig_main_area, new_main_area)

# 7. Pass previewMode to AssessmentViewer
content = content.replace('<AssessmentViewer lessonId={lesson.id} />', '<AssessmentViewer lessonId={lesson.id} previewMode={previewMode} />')
content = content.replace('<AssessmentViewer\n                                                assessmentId={exam.id}', '<AssessmentViewer\n                                                assessmentId={exam.id}\n                                                previewMode={previewMode}')

# 8. Fix "My Certificates" link if previewMode
cert_orig = '<Link href="/dashboard/certificates"'
cert_new = '<Link href={previewMode ? "#" : "/dashboard/certificates"}'
content = content.replace(cert_orig, cert_new)

with open('src/components/CourseLearnerView.tsx', 'w') as f:
    f.write(content)

print("Generated CourseLearnerView.tsx")
