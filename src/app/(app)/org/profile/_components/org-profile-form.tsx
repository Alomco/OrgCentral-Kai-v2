"use client";

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cva } from 'class-variance-authority';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { OrganizationData } from '@/server/types/leave-types';

import {
    initialOrgProfileActionState,
    updateOrgProfileAction,
    type OrgProfileActionState,
} from '../actions';

const panelVariants = cva(
    'rounded-2xl bg-[hsl(var(--card)/0.6)] p-6 backdrop-blur transition-smooth motion-reduce:transition-none',
);

export function OrgProfileForm({ organization }: { organization: OrganizationData }) {
    const router = useRouter();
    const [state, formAction, pending] = useActionState<OrgProfileActionState, FormData>(
        updateOrgProfileAction,
        initialOrgProfileActionState,
    );

    useEffect(() => {
        if (state.status === 'success') {
            router.refresh();
        }
    }, [router, state.status]);

    const incorporationDate = toDateInputValue(organization.incorporationDate);

    const formMessage = state.message;
    const formError = state.status === 'error' ? formMessage : undefined;
    const formSuccess = state.status === 'success' ? formMessage ?? 'Saved' : undefined;
    const fieldErrors: Partial<Record<string, string[]>> = state.fieldErrors ?? {};

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
        <form action={formAction} className={panelVariants()}>
            <fieldset disabled={pending} className="grid gap-6">
                <div>
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Profile settings</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Update the organization details used across the platform.
                    </p>
                </div>

                <div className="sr-only" aria-live="polite">
                    {formError ?? formSuccess ?? ''}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {profileFields.map((field) => (
                        <TextField
                            key={field.name}
                            {...field}
                            error={errorFor(field.name)}
                        />
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
                        <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Contacts</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            Leave blank to clear contact records.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <ContactCard
                            title="Primary business"
                            fields={[
                                {
                                    name: 'primaryContactName',
                                    label: 'Name',
                                    defaultValue: organization.primaryBusinessContact?.name ?? '',
                                },
                                {
                                    name: 'primaryContactEmail',
                                    label: 'Email',
                                    type: 'email',
                                    defaultValue: organization.primaryBusinessContact?.email ?? '',
                                },
                                {
                                    name: 'primaryContactPhone',
                                    label: 'Phone',
                                    type: 'tel',
                                    defaultValue: organization.primaryBusinessContact?.phone ?? '',
                                },
                            ]}
                            errorFor={errorFor}
                        />
                        <ContactCard
                            title="Accounts & finance"
                            fields={[
                                {
                                    name: 'financeContactName',
                                    label: 'Name',
                                    defaultValue: organization.accountsFinanceContact?.name ?? '',
                                },
                                {
                                    name: 'financeContactEmail',
                                    label: 'Email',
                                    type: 'email',
                                    defaultValue: organization.accountsFinanceContact?.email ?? '',
                                },
                                {
                                    name: 'financeContactPhone',
                                    label: 'Phone',
                                    type: 'tel',
                                    defaultValue: organization.accountsFinanceContact?.phone ?? '',
                                },
                            ]}
                            errorFor={errorFor}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button type="submit" size="sm" className="px-4" disabled={pending}>
                        {pending ? 'Saving...' : 'Save changes'}
                    </Button>
                    {formSuccess ? <p className="text-xs text-[hsl(var(--muted-foreground))]">{formSuccess}</p> : null}
                </div>

                {formError ? (
                    <p className="text-xs text-destructive" role="alert">
                        {formError}
                    </p>
                ) : null}
            </fieldset>
        </form>
    );
}

function toDateInputValue(value: string | undefined): string {
    if (!value) {
        return '';
    }

    const trimmed = value.trim();
    const match = /^\d{4}-\d{2}-\d{2}/.exec(trimmed);
    if (match) {
        return match[0];
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
        return '';
    }

    return parsed.toISOString().slice(0, 10);
}

interface TextFieldConfig {
    name: string;
    label: string;
    defaultValue: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
}

function TextField({
    name,
    label,
    defaultValue,
    type,
    placeholder,
    required,
    error,
}: TextFieldConfig & { error?: string }) {
    const errorId = error ? `${name}-error` : undefined;
    return (
        <label className="grid gap-1">
            <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{label}</span>
            <Input
                name={name}
                type={type}
                defaultValue={defaultValue}
                placeholder={placeholder}
                required={required}
                aria-invalid={Boolean(error)}
                aria-describedby={errorId}
            />
            {error ? (
                <p id={errorId} className="text-xs text-destructive">
                    {error}
                </p>
            ) : null}
        </label>
    );
}

function TextAreaField({
    name,
    label,
    defaultValue,
    error,
}: {
    name: string;
    label: string;
    defaultValue: string;
    error?: string;
}) {
    const errorId = error ? `${name}-error` : undefined;
    return (
        <label className="grid gap-1">
            <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{label}</span>
            <Textarea
                name={name}
                defaultValue={defaultValue}
                rows={3}
                aria-invalid={Boolean(error)}
                aria-describedby={errorId}
            />
            {error ? (
                <p id={errorId} className="text-xs text-destructive">
                    {error}
                </p>
            ) : null}
        </label>
    );
}

function ContactCard({
    title,
    fields,
    errorFor,
}: {
    title: string;
    fields: TextFieldConfig[];
    errorFor: (name: string) => string | undefined;
}) {
    return (
        <div className="grid gap-3 rounded-xl bg-[hsl(var(--muted)/0.25)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                {title}
            </p>
            {fields.map((field) => (
                <TextField key={field.name} {...field} error={errorFor(field.name)} />
            ))}
        </div>
    );
}

