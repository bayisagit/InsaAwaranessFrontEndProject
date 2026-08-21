import re

with open('src/components/CourseLearnerView.tsx', 'r') as f:
    content = f.read()

# 1. Update Sidebar Navigation
sidebar_orig = """                                                <button
                                                    key={lesson.id}
                                                    onClick={() => scrollToSection(lesId)}
                                                    className={`w-full flex items-start gap-2 py-1.5 px-2 rounded-md text-xs text-left transition-colors ${isActiveLes ? 'text-primary font-bold bg-primary/5' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    <Circle className={`w-2 h-2 mt-1 shrink-0 ${isActiveLes ? 'fill-primary' : ''}`} />
                                                    <span className="line-clamp-2">Lesson {lIdx + 1}: {lesson.title}</span>
                                                </button>
                                            );
                                        })}
                                    </div>"""

sidebar_new = """                                                <div key={lesson.id} className="flex flex-col gap-0.5">
                                                    <button
                                                        onClick={() => scrollToSection(lesId)}
                                                        className={`w-full flex items-start gap-2 py-1.5 px-2 rounded-md text-xs text-left transition-colors ${isActiveLes ? 'text-primary font-bold bg-primary/5' : 'text-muted-foreground hover:text-foreground'}`}
                                                    >
                                                        <Circle className={`w-2 h-2 mt-1 shrink-0 ${isActiveLes ? 'fill-primary' : ''}`} />
                                                        <span className="line-clamp-2">Lesson {lIdx + 1}: {lesson.title}</span>
                                                    </button>
                                                    {lesson.assessment && (
                                                        <button
                                                            onClick={() => scrollToSection(`${lesId}-assessment`)}
                                                            className={`w-full flex items-start gap-2 py-1.5 px-2 pl-6 rounded-md text-xs text-left transition-colors ${activeSectionId === `${lesId}-assessment` ? 'text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-muted-foreground hover:text-indigo-500'}`}
                                                        >
                                                            <CheckSquare className="w-3 h-3 mt-0.5 shrink-0" />
                                                            <span className="line-clamp-2">Lesson Assessment</span>
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        
                                        {/* Module Quizzes */}
                                        {(mod.module_quizzes || []).map((quiz, qIdx) => {
                                            const quizId = `module-${mod.id}-quiz-${quiz.id}`;
                                            const isActiveQuiz = activeSectionId === quizId;
                                            return (
                                                <button
                                                    key={quiz.id}
                                                    onClick={() => scrollToSection(quizId)}
                                                    className={`w-full flex items-start gap-2 py-2 px-2 mt-1 rounded-md text-xs text-left font-bold transition-colors ${isActiveQuiz ? 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-400' : 'text-orange-500/80 hover:text-orange-600 dark:hover:text-orange-400'}`}
                                                >
                                                    <Award className="w-3 h-3 mt-0.5 shrink-0" />
                                                    <span className="line-clamp-2">Module Quiz: {quiz.title || `Quiz ${qIdx + 1}`}</span>
                                                </button>
                                            );
                                        })}
                                    </div>"""
content = content.replace(sidebar_orig, sidebar_new)

# 2. Update Main Content - Lesson Assessment rendering
lesson_content_orig = """                                                {/* Lesson Assessment */}
                                                {lesson.content_type === 'assessment' && (
                                                    <div className="mb-8">
                                                        <AssessmentViewer lessonId={lesson.id} previewMode={previewMode} />
                                                    </div>
                                                )}"""

lesson_content_new = """                                                {/* Lesson Assessment */}
                                                {(lesson.content_type === 'assessment' || lesson.assessment) && (
                                                    <div id={`${lesson.id}-assessment`} className="mt-8 mb-4 border-t border-border pt-8 scroll-mt-24">
                                                        <h4 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-4 flex items-center gap-2">
                                                            <CheckSquare className="w-5 h-5" />
                                                            Lesson Assessment
                                                        </h4>
                                                        <AssessmentViewer assessmentId={lesson.assessment?.id} lessonId={lesson.id} previewMode={previewMode} />
                                                    </div>
                                                )}"""
content = content.replace(lesson_content_orig, lesson_content_new)
content = content.replace('id={`${lesson.id}-assessment`}', 'id={`lesson-${lesson.id}-assessment`}')

# 3. Update Main Content - Module Quizzes rendering
# We want to insert this after the lessons map, right before the horizontal rule
module_quizzes_insert = """                                    {index < modules.length - 1 && <div className="w-full h-px bg-border/50 my-4" />}"""
module_quizzes_new = """                                    {/* Module Quizzes */}
                                    {(mod.module_quizzes || []).map((quiz, qIdx) => (
                                        <section id={`module-${mod.id}-quiz-${quiz.id}`} key={quiz.id} className="scroll-mt-24 pl-4 sm:pl-8 mt-6">
                                            <div className="bg-orange-50/50 dark:bg-orange-950/20 rounded-3xl border border-orange-200 dark:border-orange-900/50 p-8 shadow-sm">
                                                <h3 className="text-xl font-bold text-orange-800 dark:text-orange-400 mb-6 pb-4 border-b border-orange-200 dark:border-orange-900/50 flex items-center gap-3">
                                                    <Award className="w-6 h-6" />
                                                    Module Quiz: {quiz.title || `Quiz ${qIdx + 1}`}
                                                </h3>
                                                <AssessmentViewer assessmentId={quiz.id} previewMode={previewMode} />
                                            </div>
                                        </section>
                                    ))}
                                    
                                    {index < modules.length - 1 && <div className="w-full h-px bg-border/50 my-4 mt-8" />}"""
content = content.replace(module_quizzes_insert, module_quizzes_new)

with open('src/components/CourseLearnerView.tsx', 'w') as f:
    f.write(content)

print("Updated CourseLearnerView.tsx with Assessments & Quizzes")
