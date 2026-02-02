'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';

import type { HrIntegrationsDefaults } from '../integrations-schema';
import { buildInitialHrIntegrationsFormState } from '../integrations-form-state';
import { updateHrIntegrationsAction } from '../integrations-actions';
import { fetchHrIntegrationsDefaults, HR_INTEGRATIONS_QUERY_KEY } from '../integrations-query';
import { GoogleCalendarSection } from './hr-google-calendar-section';
import { LmsIntegrationSection } from './hr-lms-integration-section';
import { MicrosoftCalendarSection } from './hr-m365-calendar-section';

export function HrIntegrationsForm(props: { defaults: HrIntegrationsDefaults }) {
    const { data: defaults } = useQuery({
        queryKey: HR_INTEGRATIONS_QUERY_KEY,
        queryFn: fetchHrIntegrationsDefaults,
        initialData: props.defaults,
    });
    const resolvedDefaults = defaults ?? props.defaults;
    const initialState = buildInitialHrIntegrationsFormState(resolvedDefaults);
    const [state, formAction, pending] = useActionState(updateHrIntegrationsAction, initialState);
    const integrationStatus = defaults?.status ?? state.integrationStatus;

    const googleEnabledReference = useRef<HTMLInputElement | null>(null);
    const m365EnabledReference = useRef<HTMLInputElement | null>(null);
    const lmsEnabledReference = useRef<HTMLInputElement | null>(null);
    const formReference = useRef<HTMLFormElement | null>(null);
    const statusReference = useRef<HTMLParagraphElement | null>(null);
    const previousStatus = useRef(state.status);

    useEffect(() => {
        formReference.current?.setAttribute('aria-busy', pending ? 'true' : 'false');
        if (!pending && state.status !== 'idle' && previousStatus.current !== state.status) {
            statusReference.current?.focus();
        }
        previousStatus.current = state.status;
    }, [pending, state.status]);

    return (
        <form ref={formReference} action={formAction}>
            <Card>
                <CardHeader>
                    <CardTitle>Integration connectors</CardTitle>
                    <CardDescription>
                        Connect calendars and training systems. Fill in what you know now and save—sync can be run later.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <GoogleCalendarSection
                        pending={pending}
                        state={{ ...state, integrationStatus }}
                        enabledReference={googleEnabledReference}
                    />

                    <Separator />

                    <MicrosoftCalendarSection
                        pending={pending}
                        state={{ ...state, integrationStatus }}
                        enabledReference={m365EnabledReference}
                    />

                    <Separator />

                    <LmsIntegrationSection
                        pending={pending}
                        state={{ ...state, integrationStatus }}
                        enabledReference={lmsEnabledReference}
                    />
                </CardContent>
                <CardFooter className="border-t justify-between gap-4">
                    <p
                        ref={statusReference}
                        tabIndex={-1}
                        className="text-xs text-muted-foreground"
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {state.status === 'success'
                            ? state.message ?? 'Saved'
                            : state.status === 'error'
                                ? state.message ?? 'Unable to save'
                                : 'Changes apply immediately'}
                    </p>
                    <Button type="submit" size="sm" disabled={pending}>
                        {pending ? <Spinner className="mr-2" /> : null}
                        {pending ? 'Saving...' : 'Save settings'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
