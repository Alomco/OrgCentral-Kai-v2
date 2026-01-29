'use client';

import { useActionState, useEffect, useEffectEvent, useId, useRef } from 'react';
import { toast } from 'sonner';

import { updateSelfProfileAction } from '../actions';
import type { SelfProfileFormState } from '../form-state';
import { ProfileEditFormLayout } from './profile-edit-form-layout';

export interface ProfileEditFormProps {
    initialState: SelfProfileFormState;
    onSuccess?: () => void;
    onCancel?: () => void;
    formId?: string;
}

export function ProfileEditForm({ initialState, onSuccess, onCancel, formId }: ProfileEditFormProps) {
    const generatedFormId = useId();
    const resolvedFormId = formId ?? generatedFormId;
    const [state, formAction, pending] = useActionState(updateSelfProfileAction, initialState);
    const successTimeoutReference = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onSuccessEvent = useEffectEvent(() => {
        onSuccess?.();
    });

    // Track previous state to only react to actual changes
    const previousStatusReference = useRef<string | null>(null);

    useEffect(() => {
        // Only react if status actually changed
        if (previousStatusReference.current === state.status) {
            return;
        }
        previousStatusReference.current = state.status;

        if (state.status === 'success') {
            toast.success(state.message ?? 'Profile saved successfully');
            // Call the callback after a small delay to ensure the toast is visible
            if (successTimeoutReference.current) {
                clearTimeout(successTimeoutReference.current);
            }
            successTimeoutReference.current = setTimeout(() => {
                onSuccessEvent();
            }, 100);
        } else if (state.status === 'error') {
            toast.error(state.message ?? 'Failed to save profile');
        }
    }, [state.status, state.message]);

    useEffect(() => () => {
        if (successTimeoutReference.current) {
            clearTimeout(successTimeoutReference.current);
            successTimeoutReference.current = null;
        }
    }, []);

    return (
        <ProfileEditFormLayout
            resolvedFormId={resolvedFormId}
            state={state}
            pending={pending}
            formAction={formAction}
            onCancel={onCancel}
        />
    );
}
