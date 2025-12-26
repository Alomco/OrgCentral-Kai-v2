'use client';

import { useActionState, useId } from 'react';
import { AlertCircle, CheckCircle2, GraduationCap, Loader2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

import { enrollTrainingAction } from '../actions';
import type { EnrollTrainingFormState } from '../form-state';
import { FieldError } from '../../_components/field-error';

export interface EnrollTrainingFormProps {
    authorization: RepositoryAuthorizationContext;
    initialState: EnrollTrainingFormState;
}

export function EnrollTrainingForm({ authorization, initialState }: EnrollTrainingFormProps) {
    const formId = useId();
    const boundAction = enrollTrainingAction.bind(null, authorization);
    const [state, formAction, isPending] = useActionState(boundAction, initialState);

    const isSuccess = state.status === 'success';
    const isError = state.status === 'error';

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Enroll in Training
                </CardTitle>
                <CardDescription>Register for a new training course or certification.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-4">
                    {isSuccess ? (
                        <Alert className="bg-green-50 dark:bg-green-950/30">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-700 dark:text-green-400">
                                {state.message}
                            </AlertDescription>
                        </Alert>
                    ) : null}

                    {isError && state.message && !state.fieldErrors ? (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{state.message}</AlertDescription>
                        </Alert>
                    ) : null}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor={`${formId}-course`}>Course Name</Label>
                            <Input
                                id={`${formId}-course`}
                                name="courseName"
                                placeholder="e.g. Data Protection Training"
                                defaultValue={state.values.courseName}
                            />
                            <FieldError message={state.fieldErrors?.courseName} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`${formId}-provider`}>Provider</Label>
                            <Input
                                id={`${formId}-provider`}
                                name="provider"
                                placeholder="e.g. Internal, Coursera"
                                defaultValue={state.values.provider}
                            />
                            <FieldError message={state.fieldErrors?.provider} />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor={`${formId}-start`}>Start Date</Label>
                            <Input
                                id={`${formId}-start`}
                                name="startDate"
                                type="date"
                                defaultValue={state.values.startDate}
                            />
                            <FieldError message={state.fieldErrors?.startDate} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`${formId}-end`}>End Date</Label>
                            <Input
                                id={`${formId}-end`}
                                name="endDate"
                                type="date"
                                defaultValue={state.values.endDate}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`${formId}-expiry`}>Certificate Expiry</Label>
                            <Input
                                id={`${formId}-expiry`}
                                name="expiryDate"
                                type="date"
                                defaultValue={state.values.expiryDate}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 sm:max-w-[200px]">
                        <Label htmlFor={`${formId}-cost`}>Cost (optional)</Label>
                        <Input
                            id={`${formId}-cost`}
                            name="cost"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            defaultValue={state.values.cost ?? ''}
                        />
                    </div>

                    <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enrolling...
                            </>
                        ) : (
                            'Enroll in Training'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
