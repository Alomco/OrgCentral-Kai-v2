"use client";

import { cva } from 'class-variance-authority';
import { useActionState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import type { OrganizationData } from '@/server/types/leave-types';
import { orgProfileKeys } from '../org-profile.api';
import { initialOrgProfileActionState } from '../actions.state';
import { updateOrgProfileAction } from '../actions';

import {
    ContactCard,
    TextAreaField,
    TextField,
    type TextFieldConfig,
    toDateInputValue,
} from './org-profile-form-fields';

const panelVariants = cva(
    'rounded-2xl bg-card/60 p-6 backdrop-blur transition-smooth motion-reduce:transition-none',
);

export function OrgProfileForm({ organization }: { organization: OrganizationData }) {
    const incorporationDate = toDateInputValue(organization.incorporationDate);
    const queryClient = useQueryClient();
    const [state, formAction, pending] = useActionState(
        updateOrgProfileAction,
        initialOrgProfileActionState,
    );

    useEffect(() => {
        if (state.status === 'success') {
            queryClient.invalidateQueries({ queryKey: orgProfileKeys.detail(organization.id) }).catch(() => null);
        }
    }, [organization.id, queryClient, state.status]);

    const formMessage = state.status === 'error'
        ? state.message
        : state.status === 'success'
            ? state.message ?? 'Saved'
            : undefined;

    const fieldErrors = state.fieldErrors ?? {};
    const errorFor = (name: string): string | undefined => fieldErrors[name]?.[0];

    const profileFields: TextFieldConfig[] = [
        {
            name: 'name',
            label: 'Organization name',
            defaultValue: organization.name,
            required: true,
        },
        {
            name: 'website',
            label: 'Website',
            type: 'url',
            placeholder: 'https://...',
            defaultValue: organization.website ?? '',
        },
        {
            name: 'phone',
            label: 'Phone',
            type: 'tel',
            placeholder: '+44...',
            defaultValue: organization.phone ?? '',
        },
        {
            name: 'industry',
            label: 'Industry',
            defaultValue: organization.industry ?? '',
        },
        {
            name: 'companyType',
            label: 'Company type',
            defaultValue: organization.companyType ?? '',
        },
        {
            name: 'employeeCountRange',
            label: 'Employee count range',
            defaultValue: organization.employeeCountRange ?? '',
        },
        {
            name: 'incorporationDate',
            label: 'Incorporation date',
            type: 'date',
            defaultValue: incorporationDate,
        },
    ];

    return (
        <form action={formAction} className={panelVariants()} aria-busy={pending}>
            <fieldset disabled={pending} className="grid gap-6">
                <div>
                    <p className="text-sm font-semibold text-foreground">Profile settings</p>
                    <p className="text-xs text-muted-foreground">
                        Update the organization details used across the platform.
                    </p>
                </div>

                <div className="sr-only" aria-live="polite">{formMessage ?? ''}</div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {profileFields.map((field) => (
                        <TextField key={field.name} {...field} error={errorFor(field.name)} />
                    ))}
                </div>

                <TextAreaField
                    name="address"
                    label="Address"
                    defaultValue={organization.address ?? ''}
                    error={errorFor('address')}
                />
                <TextAreaField
                    name="registeredOfficeAddress"
                    label="Registered office address"
                    defaultValue={organization.registeredOfficeAddress ?? ''}
                    error={errorFor('registeredOfficeAddress')}
                />

                <div className="grid gap-4">
                    <div>
                        <p className="text-sm font-semibold text-foreground">Contacts</p>
                        <p className="text-xs text-muted-foreground">Leave blank to clear contact records.</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <ContactCard
                            title="Primary business"
                            fields={[
                                { name: 'primaryContactName', label: 'Name', defaultValue: organization.primaryBusinessContact?.name ?? '' },
                                { name: 'primaryContactEmail', label: 'Email', type: 'email', defaultValue: organization.primaryBusinessContact?.email ?? '' },
                                { name: 'primaryContactPhone', label: 'Phone', type: 'tel', defaultValue: organization.primaryBusinessContact?.phone ?? '' },
                            ]}
                            errorFor={errorFor}
                        />
                        <ContactCard
                            title="Accounts & finance"
                            fields={[
                                { name: 'financeContactName', label: 'Name', defaultValue: organization.accountsFinanceContact?.name ?? '' },
                                { name: 'financeContactEmail', label: 'Email', type: 'email', defaultValue: organization.accountsFinanceContact?.email ?? '' },
                                { name: 'financeContactPhone', label: 'Phone', type: 'tel', defaultValue: organization.accountsFinanceContact?.phone ?? '' },
                            ]}
                            errorFor={errorFor}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button type="submit" size="sm" className="px-4" disabled={pending}>
                        {pending ? 'Saving...' : 'Save changes'}
                    </Button>
                    {state.status === 'success' ? (
                        <p className="text-xs text-muted-foreground">{state.message ?? 'Saved'}</p>
                    ) : null}
                </div>

                {state.status === 'error' ? (
                    <p className="text-xs text-destructive" role="alert">{state.message ?? 'Unable to save'}</p>
                ) : null}
            </fieldset>
        </form>
    );
}
