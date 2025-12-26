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

    const errorFor = (name: string): string | undefined => state.fieldErrors?.[name]?.[0];

    return (
        <form action={formAction} className={panelVariants()}>
            <fieldset disabled={pending} aria-busy={pending} className="grid gap-6">
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
                    <label className="grid gap-1">
                        <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Organization name</span>
                        <Input
                            name="name"
                            defaultValue={organization.name}
                            required
                            aria-invalid={Boolean(errorFor('name'))}
                            aria-describedby={errorFor('name') ? 'name-error' : undefined}
                        />
                        {errorFor('name') ? (
                            <p id="name-error" className="text-xs text-destructive">
                                {errorFor('name')}
                            </p>
                        ) : null}
                    </label>

                    <label className="grid gap-1">
                        <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Website</span>
                        <Input
                            name="website"
                            type="url"
                            defaultValue={organization.website ?? ''}
                            placeholder="https://..."
                            aria-invalid={Boolean(errorFor('website'))}
                            aria-describedby={errorFor('website') ? 'website-error' : undefined}
                        />
                        {errorFor('website') ? (
                            <p id="website-error" className="text-xs text-destructive">
                                {errorFor('website')}
                            </p>
                        ) : null}
                    </label>

                    <label className="grid gap-1">
                        <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Phone</span>
                        <Input
                            name="phone"
                            type="tel"
                            defaultValue={organization.phone ?? ''}
                            placeholder="+44..."
                            aria-invalid={Boolean(errorFor('phone'))}
                            aria-describedby={errorFor('phone') ? 'phone-error' : undefined}
                        />
                        {errorFor('phone') ? (
                            <p id="phone-error" className="text-xs text-destructive">
                                {errorFor('phone')}
                            </p>
                        ) : null}
                    </label>

                    <label className="grid gap-1">
                        <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Industry</span>
                        <Input
                            name="industry"
                            defaultValue={organization.industry ?? ''}
                            aria-invalid={Boolean(errorFor('industry'))}
                            aria-describedby={errorFor('industry') ? 'industry-error' : undefined}
                        />
                        {errorFor('industry') ? (
                            <p id="industry-error" className="text-xs text-destructive">
                                {errorFor('industry')}
                            </p>
                        ) : null}
                    </label>

                    <label className="grid gap-1">
                        <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Company type</span>
                        <Input
                            name="companyType"
                            defaultValue={organization.companyType ?? ''}
                            aria-invalid={Boolean(errorFor('companyType'))}
                            aria-describedby={errorFor('companyType') ? 'companyType-error' : undefined}
                        />
                        {errorFor('companyType') ? (
                            <p id="companyType-error" className="text-xs text-destructive">
                                {errorFor('companyType')}
                            </p>
                        ) : null}
                    </label>

                    <label className="grid gap-1">
                        <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Employee count range</span>
                        <Input
                            name="employeeCountRange"
                            defaultValue={organization.employeeCountRange ?? ''}
                            aria-invalid={Boolean(errorFor('employeeCountRange'))}
                            aria-describedby={
                                errorFor('employeeCountRange') ? 'employeeCountRange-error' : undefined
                            }
                        />
                        {errorFor('employeeCountRange') ? (
                            <p id="employeeCountRange-error" className="text-xs text-destructive">
                                {errorFor('employeeCountRange')}
                            </p>
                        ) : null}
                    </label>

                    <label className="grid gap-1">
                        <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Incorporation date</span>
                        <Input
                            name="incorporationDate"
                            type="date"
                            defaultValue={incorporationDate}
                            aria-invalid={Boolean(errorFor('incorporationDate'))}
                            aria-describedby={errorFor('incorporationDate') ? 'incorporationDate-error' : undefined}
                        />
                        {errorFor('incorporationDate') ? (
                            <p id="incorporationDate-error" className="text-xs text-destructive">
                                {errorFor('incorporationDate')}
                            </p>
                        ) : null}
                    </label>
                </div>

                <label className="grid gap-1">
                    <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Address</span>
                    <Textarea
                        name="address"
                        defaultValue={organization.address ?? ''}
                        rows={3}
                        aria-invalid={Boolean(errorFor('address'))}
                        aria-describedby={errorFor('address') ? 'address-error' : undefined}
                    />
                    {errorFor('address') ? (
                        <p id="address-error" className="text-xs text-destructive">
                            {errorFor('address')}
                        </p>
                    ) : null}
                </label>

                <label className="grid gap-1">
                    <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Registered office address</span>
                    <Textarea
                        name="registeredOfficeAddress"
                        defaultValue={organization.registeredOfficeAddress ?? ''}
                        rows={3}
                        aria-invalid={Boolean(errorFor('registeredOfficeAddress'))}
                        aria-describedby={
                            errorFor('registeredOfficeAddress') ? 'registeredOfficeAddress-error' : undefined
                        }
                    />
                    {errorFor('registeredOfficeAddress') ? (
                        <p id="registeredOfficeAddress-error" className="text-xs text-destructive">
                            {errorFor('registeredOfficeAddress')}
                        </p>
                    ) : null}
                </label>

                <div className="grid gap-4">
                    <div>
                        <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Contacts</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            Leave blank to clear contact records.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-3 rounded-xl bg-[hsl(var(--muted)/0.25)] p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                                Primary business
                            </p>
                            <label className="grid gap-1">
                                <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Name</span>
                                <Input
                                    name="primaryContactName"
                                    defaultValue={organization.primaryBusinessContact?.name ?? ''}
                                    aria-invalid={Boolean(errorFor('primaryContactName'))}
                                    aria-describedby={errorFor('primaryContactName') ? 'primaryContactName-error' : undefined}
                                />
                                {errorFor('primaryContactName') ? (
                                    <p id="primaryContactName-error" className="text-xs text-destructive">
                                        {errorFor('primaryContactName')}
                                    </p>
                                ) : null}
                            </label>
                            <label className="grid gap-1">
                                <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Email</span>
                                <Input
                                    name="primaryContactEmail"
                                    type="email"
                                    defaultValue={organization.primaryBusinessContact?.email ?? ''}
                                    aria-invalid={Boolean(errorFor('primaryContactEmail'))}
                                    aria-describedby={errorFor('primaryContactEmail') ? 'primaryContactEmail-error' : undefined}
                                />
                                {errorFor('primaryContactEmail') ? (
                                    <p id="primaryContactEmail-error" className="text-xs text-destructive">
                                        {errorFor('primaryContactEmail')}
                                    </p>
                                ) : null}
                            </label>
                            <label className="grid gap-1">
                                <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Phone</span>
                                <Input
                                    name="primaryContactPhone"
                                    type="tel"
                                    defaultValue={organization.primaryBusinessContact?.phone ?? ''}
                                    aria-invalid={Boolean(errorFor('primaryContactPhone'))}
                                    aria-describedby={errorFor('primaryContactPhone') ? 'primaryContactPhone-error' : undefined}
                                />
                                {errorFor('primaryContactPhone') ? (
                                    <p id="primaryContactPhone-error" className="text-xs text-destructive">
                                        {errorFor('primaryContactPhone')}
                                    </p>
                                ) : null}
                            </label>
                        </div>

                        <div className="grid gap-3 rounded-xl bg-[hsl(var(--muted)/0.25)] p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                                Accounts & finance
                            </p>
                            <label className="grid gap-1">
                                <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Name</span>
                                <Input
                                    name="financeContactName"
                                    defaultValue={organization.accountsFinanceContact?.name ?? ''}
                                    aria-invalid={Boolean(errorFor('financeContactName'))}
                                    aria-describedby={errorFor('financeContactName') ? 'financeContactName-error' : undefined}
                                />
                                {errorFor('financeContactName') ? (
                                    <p id="financeContactName-error" className="text-xs text-destructive">
                                        {errorFor('financeContactName')}
                                    </p>
                                ) : null}
                            </label>
                            <label className="grid gap-1">
                                <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Email</span>
                                <Input
                                    name="financeContactEmail"
                                    type="email"
                                    defaultValue={organization.accountsFinanceContact?.email ?? ''}
                                    aria-invalid={Boolean(errorFor('financeContactEmail'))}
                                    aria-describedby={errorFor('financeContactEmail') ? 'financeContactEmail-error' : undefined}
                                />
                                {errorFor('financeContactEmail') ? (
                                    <p id="financeContactEmail-error" className="text-xs text-destructive">
                                        {errorFor('financeContactEmail')}
                                    </p>
                                ) : null}
                            </label>
                            <label className="grid gap-1">
                                <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Phone</span>
                                <Input
                                    name="financeContactPhone"
                                    type="tel"
                                    defaultValue={organization.accountsFinanceContact?.phone ?? ''}
                                    aria-invalid={Boolean(errorFor('financeContactPhone'))}
                                    aria-describedby={errorFor('financeContactPhone') ? 'financeContactPhone-error' : undefined}
                                />
                                {errorFor('financeContactPhone') ? (
                                    <p id="financeContactPhone-error" className="text-xs text-destructive">
                                        {errorFor('financeContactPhone')}
                                    </p>
                                ) : null}
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button type="submit" size="sm" className="px-4" disabled={pending}>
                        {pending ? 'Saving…' : 'Save changes'}
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
