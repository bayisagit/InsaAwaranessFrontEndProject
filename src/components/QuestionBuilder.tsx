'use client';

import React, { useRef } from 'react';
import { Question } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

interface QuestionBuilderProps {
    value: Question[];
    onChange: (questions: Question[]) => void;
    mode?: 'lesson' | 'certificate';
}

export function QuestionBuilder({ value, onChange, mode = 'certificate' }: QuestionBuilderProps) {
    const pairIdMap = useRef<Map<string, string>>(new Map());
    const addQuestion = (type: Question['type']) => {
        // Map 'multiple' to the correct backend string based on the mode
        const actualType = type === 'multiple' && mode === 'lesson' ? 'multiple_choice' : type;
        const newQuestion: Question = {
            id: `q_${Date.now()}`,
            type: actualType as any,
            question: '',
            correct_answer: actualType === 'true_false' ? true : (actualType === 'matching' ? {} : ''),
            options: actualType === 'multiple' || actualType === 'multiple_choice' ? [
                { id: 'a', label: '' },
                { id: 'b', label: '' }
            ] : undefined
        };
        onChange([...value, newQuestion]);
    };

    const updateQuestion = (id: string, updates: Partial<Question>) => {
        onChange(value.map(q => q.id === id ? { ...q, ...updates } : q));
    };

    const removeQuestion = (id: string) => {
        onChange(value.filter(q => q.id !== id));
    };

    const addOption = (questionId: string) => {
        const q = value.find(q => q.id === questionId);
        if (!q || !q.options) return;
        const newOptionId = String.fromCharCode(97 + q.options.length); // a, b, c...
        updateQuestion(questionId, {
            options: [...q.options, { id: newOptionId, label: '' }]
        });
    };

    const removeOption = (questionId: string, optionId: string) => {
        const q = value.find(q => q.id === questionId);
        if (!q || !q.options) return;
        updateQuestion(questionId, {
            options: q.options.filter(o => o.id !== optionId)
        });
    };

    const updateOption = (questionId: string, optionId: string, label: string) => {
        const q = value.find(q => q.id === questionId);
        if (!q || !q.options) return;
        updateQuestion(questionId, {
            options: q.options.map(o => o.id === optionId ? { ...o, label } : o)
        });
    };

    return (
        <div className="space-y-8">
            <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => addQuestion('multiple')}>
                    + Multiple Choice
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addQuestion('true_false')}>
                    + True/False
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addQuestion('matching')}>
                    + Matching
                </Button>
            </div>

            <div className="space-y-6">
                {value.map((q, index) => (
                    <div key={q.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-200 relative group">
                        <button
                            type="button"
                            onClick={() => removeQuestion(q.id)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            ✕
                        </button>

                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded uppercase tracking-wider">
                                Question {index + 1}: {q.type.replace('_', ' ')}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Question Text</label>
                                <textarea
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    value={q.question}
                                    onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                                    placeholder="Enter your question here..."
                                    rows={2}
                                />
                            </div>

                            {/* Multiple Choice Options */}
                            {(q.type === 'multiple' || q.type === 'multiple_choice') && q.options && (
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Options & Correct Answer</label>
                                    {q.options.map((opt) => (
                                        <div key={opt.id} className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name={`correct_${q.id}`}
                                                checked={q.correct_answer === opt.id}
                                                onChange={() => updateQuestion(q.id, { correct_answer: opt.id })}
                                                className="w-4 h-4 text-primary focus:ring-primary"
                                            />
                                            <input
                                                type="text"
                                                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                                                value={opt.label}
                                                onChange={(e) => updateOption(q.id, opt.id, e.target.value)}
                                                placeholder={`Option ${opt.id.toUpperCase()}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeOption(q.id, opt.id)}
                                                className="text-gray-300 hover:text-red-500"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => addOption(q.id)}
                                        className="text-xs font-bold text-primary hover:underline"
                                    >
                                        + Add Option
                                    </button>
                                </div>
                            )}

                            {/* True/False */}
                            {q.type === 'true_false' && (
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => updateQuestion(q.id, { correct_answer: true })}
                                        className={`flex-1 py-2 rounded-lg border font-bold text-sm transition-all ${q.correct_answer === true ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-500 hover:border-primary/50'}`}
                                    >
                                        True
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateQuestion(q.id, { correct_answer: false })}
                                        className={`flex-1 py-2 rounded-lg border font-bold text-sm transition-all ${q.correct_answer === false ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-500 hover:border-primary/50'}`}
                                    >
                                        False
                                    </button>
                                </div>
                            )}

                            {/* Matching */}
                            {q.type === 'matching' && (() => {
                                const answerMap = q.correct_answer as Record<string, string> || {};
                                const pairs = Object.entries(answerMap).map(([term, definition]) => {
                                    let id = pairIdMap.current.get(term);
                                    if (!id) {
                                        id = crypto.randomUUID ? crypto.randomUUID() : `pair_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                                        pairIdMap.current.set(term, id);
                                    }
                                    return { _id: id, term, definition };
                                });
                                return (
                                    <div className="space-y-3">
                                        <label className="block text-xs font-bold text-gray-500 uppercase">Term-Definition Pairs</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">Term</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">Definition</div>
                                        </div>
                                        {pairs.map((pair) => (
                                            <div key={pair._id} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                                                    value={pair.term}
                                                    onChange={(e) => {
                                                        const newAnswers = { ...answerMap };
                                                        delete newAnswers[pair.term];
                                                        newAnswers[e.target.value] = pair.definition;
                                                        pairIdMap.current.delete(pair.term);
                                                        pairIdMap.current.set(e.target.value, pair._id);
                                                        updateQuestion(q.id, { correct_answer: newAnswers });
                                                    }}
                                                />
                                                <input
                                                    type="text"
                                                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                                                    value={pair.definition}
                                                    onChange={(e) => {
                                                        const newAnswers = { ...answerMap, [pair.term]: e.target.value };
                                                        updateQuestion(q.id, { correct_answer: newAnswers });
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newAnswers = { ...answerMap };
                                                        delete newAnswers[pair.term];
                                                        pairIdMap.current.delete(pair.term);
                                                        updateQuestion(q.id, { correct_answer: newAnswers });
                                                    }}
                                                    className="text-gray-300 hover:text-red-500"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newAnswers = { ...answerMap, '': '' };
                                                updateQuestion(q.id, { correct_answer: newAnswers });
                                            }}
                                            className="text-xs font-bold text-primary hover:underline"
                                        >
                                            + Add Pair
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                ))}

                {value.length === 0 && (
                    <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                        <p className="text-gray-400 text-sm">No questions added yet. Start by choosing a type above.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
