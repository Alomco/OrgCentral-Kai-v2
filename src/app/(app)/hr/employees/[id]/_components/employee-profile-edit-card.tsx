'use client';

import { useActionState, useId } from 'react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

import { updateEmployeeProfileAction } from '../../actions';
import type { EmployeeProfileFormState } from '../../form-state';
import { EmployeeProfileCoreFields } from './employee-profile-core-fields';
import { EmployeeProfileAdditionalFields } from './employee-profile-additional-fields';

export interface EmployeeProfileEditCardProps {
    initialState: EmployeeProfileFormState;
}

export function EmployeeProfileEditCard({ initialState }: EmployeeProfileEditCardProps) {
    const formId = useId();
    const [state, formAction, pending] = useActionState(updateEmployeeProfileAction, initialState);

    const statusMessage = state.status === 'success'
        ? state.message ?? 'Profile saved.'
        : state.status === 'error'
            ? state.message ?? 'Unable to save profile.'
            : 'Changes apply immediately.';

    return (
        <form action={formAction}>
            <Card>
                <CardHeader>
                    <CardTitle>Edit profile</CardTitle>
                    <CardDescription>Update contact and employment details for this employee.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <input type="hidden" name="profileId" value={state.values.profileId} />
                    <fieldset disabled={pending} className="space-y-6">
                        <EmployeeProfileCoreFields
                            formId={formId}
                            values={state.values}
                            fieldErrors={state.fieldErrors}
                        />
                        <EmployeeProfileAdditionalFields
                            formId={formId}
                            values={state.values}
                            fieldErrors={state.fieldErrors}
                        />
                    </fieldset>
                </CardContent>
                <CardFooter className="border-t flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p
                        className="text-xs text-muted-foreground"
                        role="status"
                        aria-live="polite"
                    >
                        {statusMessage}
                    </p>
                    <Button type="submit" size="sm" disabled={pending}>
                        {pending ? <Spinner className="mr-2" /> : null}
                        {pending ? 'Saving...' : 'Save profile'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
