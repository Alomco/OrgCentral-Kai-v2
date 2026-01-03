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

import { saveEmployeeContractAction } from '../../actions';
import type { EmployeeContractFormState } from '../../form-state';
import { EmployeeContractEditFields } from './employee-contract-edit-fields';

export interface EmployeeContractEditCardProps {
    initialState: EmployeeContractFormState;
}

export function EmployeeContractEditCard({ initialState }: EmployeeContractEditCardProps) {
    const formId = useId();
    const [state, formAction, pending] = useActionState(saveEmployeeContractAction, initialState);
    const hasContract = state.values.contractId.length > 0;

    const statusMessage = state.status === 'success'
        ? state.message ?? 'Contract saved.'
        : state.status === 'error'
            ? state.message ?? 'Unable to save contract.'
            : hasContract
                ? 'Changes apply immediately.'
                : 'Create a contract to activate employment terms.';

    return (
        <form action={formAction}>
            <Card>
                <CardHeader>
                    <CardTitle>{hasContract ? 'Edit contract' : 'Create contract'}</CardTitle>
                    <CardDescription>
                        {hasContract
                            ? 'Update employment contract details for this employee.'
                            : 'Add the first employment contract for this employee.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <input type="hidden" name="profileId" value={state.values.profileId} />
                    <input type="hidden" name="userId" value={state.values.userId} />
                    <input type="hidden" name="contractId" value={state.values.contractId} />
                    <fieldset disabled={pending} className="space-y-6">
                        <EmployeeContractEditFields
                            formId={formId}
                            values={state.values}
                            fieldErrors={state.fieldErrors}
                        />
                    </fieldset>
                </CardContent>
                <CardFooter className="border-t justify-between gap-4">
                    <p
                        className="text-xs text-muted-foreground"
                        role="status"
                        aria-live="polite"
                    >
                        {statusMessage}
                    </p>
                    <Button type="submit" size="sm" disabled={pending}>
                        {pending ? <Spinner className="mr-2" /> : null}
                        {pending ? 'Saving...' : hasContract ? 'Save contract' : 'Create contract'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
