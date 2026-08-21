import re

with open('src/components/AssessmentViewer.tsx', 'r') as f:
    content = f.read()

# 1. Update Props interface
props_orig = """interface AssessmentViewerProps {
 assessmentId?: string;
 lessonId?: string;
 certificateExamId?: string;
 onComplete?: () => void;
}"""
props_new = """interface AssessmentViewerProps {
 assessmentId?: string;
 lessonId?: string;
 certificateExamId?: string;
 onComplete?: () => void;
 previewMode?: boolean;
}"""
content = content.replace(props_orig, props_new)

# 2. Update component signature
sig_orig = "export function AssessmentViewer({ assessmentId: propAssessmentId, lessonId, certificateExamId, onComplete }: AssessmentViewerProps) {"
sig_new = "export function AssessmentViewer({ assessmentId: propAssessmentId, lessonId, certificateExamId, onComplete, previewMode }: AssessmentViewerProps) {"
content = content.replace(sig_orig, sig_new)

# 3. Update loadAssessment
# In loadAssessment, after we fetch `aData`, if previewMode, skip history and start
orig_load = """  // 2. Load history first to check for completed attempts
  const { data: hist } = await getAssessmentAttempts(id);
  const attempts = Array.isArray(hist) ? hist : [];
  setHistory(attempts);

  const lastGraded = attempts.find(h => h.status === 'graded' || h.status === 'needs_review');

  if (lastGraded) {
  // Show saved result instead of starting a new attempt
  setResult(lastGraded);
  if (!lastGraded.answers?.length) {
  // Fetch the full attempt detail with answers if not included
  const { data: fullAttempt } = await apiFetch(`/api/v1/assessments/${id}/attempts/`);
  if (fullAttempt) {
  const arr = Array.isArray(fullAttempt) ? fullAttempt : [];
  const found = arr.find((h: any) => h.id === lastGraded.id);
  if (found) { setResult(found); setAttempt(found); }
  }
  }
  setIsLoading(false);
  return;
  }

  // 3. Resume or Start
  const { data: resumeData, status: resumeStatus } = await resumeAssessment(id);
  if (resumeStatus === 200 && resumeData) {
  setAttempt(resumeData);
  const hydrated = hydrateAnswers(resumeData, aData.questions);
  setAnswers(hydrated);
  setCurrentIndex(resumeData.current_question_index ?? 0);
  } else {
  const { data: startData, error: startErr } = await startAssessment(id);
  if (startErr || !startData) { setLoadError(startErr || 'Failed to start assessment.'); setIsLoading(false); return; }
  setAttempt(startData);
  }"""

new_load = """  if (previewMode) {
      setAttempt(null);
      setResult(null);
      setHistory([]);
      setAnswers({});
      setCurrentIndex(0);
      setIsLoading(false);
      return;
  }

  // 2. Load history first to check for completed attempts
  const { data: hist } = await getAssessmentAttempts(id);
  const attempts = Array.isArray(hist) ? hist : [];
  setHistory(attempts);

  const lastGraded = attempts.find(h => h.status === 'graded' || h.status === 'needs_review');

  if (lastGraded) {
  // Show saved result instead of starting a new attempt
  setResult(lastGraded);
  if (!lastGraded.answers?.length) {
  // Fetch the full attempt detail with answers if not included
  const { data: fullAttempt } = await apiFetch(`/api/v1/assessments/${id}/attempts/`);
  if (fullAttempt) {
  const arr = Array.isArray(fullAttempt) ? fullAttempt : [];
  const found = arr.find((h: any) => h.id === lastGraded.id);
  if (found) { setResult(found); setAttempt(found); }
  }
  }
  setIsLoading(false);
  return;
  }

  // 3. Resume or Start
  const { data: resumeData, status: resumeStatus } = await resumeAssessment(id);
  if (resumeStatus === 200 && resumeData) {
  setAttempt(resumeData);
  const hydrated = hydrateAnswers(resumeData, aData.questions);
  setAnswers(hydrated);
  setCurrentIndex(resumeData.current_question_index ?? 0);
  } else {
  const { data: startData, error: startErr } = await startAssessment(id);
  if (startErr || !startData) { setLoadError(startErr || 'Failed to start assessment.'); setIsLoading(false); return; }
  setAttempt(startData);
  }"""
content = content.replace(orig_load, new_load)

# 4. scheduleSave
orig_scheduleSave = """ const scheduleSave = useCallback((qId: string, answer: any, index: number) => {
 if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
 saveTimerRef.current = setTimeout(async () => {
 const aId = assessmentIdRef.current;
 if (!aId) return;
 setIsSaving(true);
 const q = assessment?.questions.find(q => q.id === qId);
 if (q) await saveAssessmentProgress(aId, { question_id: qId, answer: formatAnswerForApi(q, answer), current_question_index: index });
 setIsSaving(false);
 }, 800);
 }, [assessment]);"""

new_scheduleSave = """ const scheduleSave = useCallback((qId: string, answer: any, index: number) => {
 if (previewMode) return;
 if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
 saveTimerRef.current = setTimeout(async () => {
 const aId = assessmentIdRef.current;
 if (!aId) return;
 setIsSaving(true);
 const q = assessment?.questions.find(q => q.id === qId);
 if (q) await saveAssessmentProgress(aId, { question_id: qId, answer: formatAnswerForApi(q, answer), current_question_index: index });
 setIsSaving(false);
 }, 800);
 }, [assessment, previewMode]);"""
content = content.replace(orig_scheduleSave, new_scheduleSave)

# 5. navigate
orig_nav = """ const navigate = async (nextIndex: number) => {
 const aId = assessmentIdRef.current;
 if (aId) await saveAssessmentProgress(aId, { current_question_index: nextIndex });
 setCurrentIndex(nextIndex);
 };"""
new_nav = """ const navigate = async (nextIndex: number) => {
 const aId = assessmentIdRef.current;
 if (aId && !previewMode) await saveAssessmentProgress(aId, { current_question_index: nextIndex });
 setCurrentIndex(nextIndex);
 };"""
content = content.replace(orig_nav, new_nav)

# 6. handleSubmit
orig_submit = """ const handleSubmit = async () => {
 const aId = assessmentIdRef.current;
 if (!aId || !assessment) return;
 if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
 setIsSubmitting(true); setSubmitError('');

 const finalAnswers: Record<string, any> = {};
 for (const q of assessment.questions) {
 const raw = answers[q.id];
 if (raw !== undefined) finalAnswers[q.id] = formatAnswerForApi(q, raw);
 }

 const { data, error: err, status } = await submitAssessment(aId, finalAnswers);
 if (err || !data || !([200, 201].includes(status ?? 0))) {
 setSubmitError(err || `Submission failed (status ${status}).`);
 setIsSubmitting(false); return;
 }
 setResult(data);
 // Refresh history
 const { data: hist } = await getAssessmentAttempts(aId);
 setHistory(Array.isArray(hist) ? hist : []);
 if (onComplete) onComplete();
 setIsSubmitting(false);
 };"""
new_submit = """ const handleSubmit = async () => {
 const aId = assessmentIdRef.current;
 if (!aId || !assessment) return;
 if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
 setIsSubmitting(true); setSubmitError('');

 const finalAnswers: Record<string, any> = {};
 for (const q of assessment.questions) {
 const raw = answers[q.id];
 if (raw !== undefined) finalAnswers[q.id] = formatAnswerForApi(q, raw);
 }

 if (previewMode) {
     // Fake submission
     setTimeout(() => {
         setResult({
             id: 'fake-preview',
             assessment: aId,
             user: 'preview',
             attempt_number: 1,
             score: 100,
             passed: true,
             status: 'graded',
             started_at: new Date().toISOString(),
             submitted_at: new Date().toISOString(),
             answers: []
         } as any);
         setIsSubmitting(false);
         if (onComplete) onComplete();
     }, 1000);
     return;
 }

 const { data, error: err, status } = await submitAssessment(aId, finalAnswers);
 if (err || !data || !([200, 201].includes(status ?? 0))) {
 setSubmitError(err || `Submission failed (status ${status}).`);
 setIsSubmitting(false); return;
 }
 setResult(data);
 // Refresh history
 const { data: hist } = await getAssessmentAttempts(aId);
 setHistory(Array.isArray(hist) ? hist : []);
 if (onComplete) onComplete();
 setIsSubmitting(false);
 };"""
content = content.replace(orig_submit, new_submit)

# 7. handleRetake
orig_retake = """ const handleRetake = async () => {
 setResult(null); setAnswers({}); setCurrentIndex(0); setSubmitError('');
 const aId = assessmentIdRef.current;
 if (!aId) return;
 setIsLoading(true);
 const { data, error: err } = await startAssessment(aId);
 if (err || !data) { setLoadError(err || 'Failed to start new attempt.'); setIsLoading(false); return; }
 setAttempt(data); setIsLoading(false);
 };"""
new_retake = """ const handleRetake = async () => {
 setResult(null); setAnswers({}); setCurrentIndex(0); setSubmitError('');
 const aId = assessmentIdRef.current;
 if (!aId) return;
 
 if (previewMode) {
     return;
 }
 
 setIsLoading(true);
 const { data, error: err } = await startAssessment(aId);
 if (err || !data) { setLoadError(err || 'Failed to start new attempt.'); setIsLoading(false); return; }
 setAttempt(data); setIsLoading(false);
 };"""
content = content.replace(orig_retake, new_retake)

with open('src/components/AssessmentViewer.tsx', 'w') as f:
    f.write(content)

print("Updated AssessmentViewer.tsx")
