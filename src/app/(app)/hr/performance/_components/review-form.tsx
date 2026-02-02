'use client';

import { useState } from 'react';
import { Star, Send, Loader2, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

interface ReviewQuestion {
    id: string;
    question: string;
    category: string;
}

interface ReviewFormProps {
    reviewId: string;
    reviewTitle: string;
    questions: ReviewQuestion[];
    onSaveDraft?: (responses: ReviewResponse[]) => Promise<void>;
    onSubmit?: (responses: ReviewResponse[]) => Promise<void>;
}

export interface ReviewResponse {
    questionId: string;
    rating: number;
    comments: string;
}

const RATING_LABELS = ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'];

export function ReviewForm({
    reviewId,
    reviewTitle,
    questions,
    onSaveDraft,
    onSubmit,
}: ReviewFormProps) {
    const [responses, setResponses] = useState<Map<string, ReviewResponse>>(new Map());
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateResponse = (questionId: string, field: 'rating' | 'comments', value: number | string) => {
        setResponses((previous) => {
            const next = new Map(previous);
            const current = next.get(questionId) ?? { questionId, rating: 0, comments: '' };
            next.set(questionId, {
                ...current,
                [field]: value,
            });
            return next;
        });
    };

    const getResponse = (questionId: string): ReviewResponse => {
        return responses.get(questionId) ?? { questionId, rating: 0, comments: '' };
    };

    const answeredCount = Array.from(responses.values()).filter((r) => r.rating > 0).length;
    const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
    const isComplete = answeredCount === questions.length;

    const handleSaveDraft = async () => {
        if (!onSaveDraft) { return; }
        setIsSaving(true);
        try {
            await onSaveDraft(Array.from(responses.values()));
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmit = async () => {
        if (!onSubmit || !isComplete) { return; }
        setIsSubmitting(true);
        try {
            await onSubmit(Array.from(responses.values()));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Group questions by category
    const questionsByCategory = questions.reduce<Record<string, ReviewQuestion[]>>(
        (accumulator, question) => {
            const existing = accumulator[question.category] ?? [];
            accumulator[question.category] = [...existing, question];
            return accumulator;
        },
        {},
    );

    return (
        <div className="space-y-6" data-review-id={reviewId}>
            {/* Progress Header */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle>{reviewTitle}</CardTitle>
                    <CardDescription>
                        {answeredCount} of {questions.length} questions answered. Save a draft anytime.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Progress value={progress} className="h-2" />
                </CardContent>
            </Card>

            {/* Questions by Category */}
            {Object.entries(questionsByCategory).map(([category, categoryQuestions]) => (
                <Card key={category}>
                    <CardHeader>
                        <CardTitle className="text-base">{category}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {categoryQuestions.map((question, index) => {
                            const response = getResponse(question.id);
                            return (
                                <div
                                    key={question.id}
                                    className="space-y-3 pb-6 border-b last:border-0 last:pb-0"
                                >
                                    <Label className="text-sm font-medium">
                                        {index + 1}. {question.question}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Select a rating, then add optional comments.
                                    </p>

                                    {/* Star Rating */}
                                    <div className="flex flex-wrap items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((rating) => (
                                            <button
                                                key={rating}
                                                type="button"
                                                onClick={() =>
                                                    updateResponse(question.id, 'rating', rating)
                                                }
                                                className="p-1 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                                                aria-label={`Rate ${String(rating)} out of 5 for ${question.question}`}
                                            >
                                                <Star
                                                    className={`h-6 w-6 transition-colors ${rating <= response.rating
                                                        ? 'fill-amber-400 text-amber-400'
                                                        : 'text-muted-foreground/30'
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                        {response.rating > 0 ? (
                                            <span className="ml-2 text-sm text-muted-foreground">
                                                {RATING_LABELS[response.rating - 1]}
                                            </span>
                                        ) : null}
                                    </div>

                                    {/* Comments */}
                                    <Textarea
                                        placeholder="Add helpful context (optional)..."
                                        value={response.comments}
                                        onChange={(event) =>
                                            updateResponse(question.id, 'comments', event.target.value)
                                        }
                                        rows={2}
                                        className="resize-none"
                                    />
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            ))}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={isSaving || isSubmitting}
                    className="w-full sm:w-auto"
                >
                    {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Draft
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={!isComplete || isSaving || isSubmitting}
                    className="w-full sm:w-auto"
                >
                    {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4 mr-2" />
                    )}
                    Submit Review
                </Button>
            </div>
        </div>
    );
}
