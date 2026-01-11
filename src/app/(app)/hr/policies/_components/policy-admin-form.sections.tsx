'use client';

import { forwardRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { FieldError } from '../../_components/field-error';
import { formatCategoryLabel, formatStatusLabel } from './policy-admin-form.state';
import type { PolicyAdminCreateState } from '../policy-admin-form-utils';

interface FormSectionProps {
    state: PolicyAdminCreateState;
    pending: boolean;
}

interface IdentityFieldsProps extends FormSectionProps {
    policyCategories: readonly string[];
}

export function PolicyIdentityFields({ state, pending, policyCategories }: IdentityFieldsProps) {
    return (
        <div className="grid gap-4 lg:grid-cols-4">
            <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="policy-title">Title</Label>
                <Input
                    id="policy-title"
                    name="title"
                    required
                    key={`policy-title-${state.values.title}`}
                    defaultValue={state.values.title}
                    aria-invalid={Boolean(state.fieldErrors?.title)}
                    aria-describedby={state.fieldErrors?.title ? 'policy-title-error' : undefined}
                />
                <FieldError id="policy-title-error" message={state.fieldErrors?.title} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="policy-category">Category</Label>
                <Select name="category" defaultValue={state.values.category} disabled={pending}>
                    <SelectTrigger id="policy-category">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {policyCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                                {formatCategoryLabel(category)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FieldError id="policy-category-error" message={state.fieldErrors?.category} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="policy-version">Version</Label>
                <Input
                    id="policy-version"
                    name="version"
                    required
                    key={`policy-version-${state.values.version}`}
                    defaultValue={state.values.version}
                    aria-invalid={Boolean(state.fieldErrors?.version)}
                    aria-describedby={state.fieldErrors?.version ? 'policy-version-error' : undefined}
                />
                <FieldError id="policy-version-error" message={state.fieldErrors?.version} />
            </div>
        </div>
    );
}

interface ScheduleFieldsProps extends FormSectionProps {
    requiresAckInputRef: React.RefObject<HTMLInputElement | null>;
    onAckChange: (checked: boolean) => void;
}

export function PolicyScheduleFields({ state, pending, requiresAckInputRef, onAckChange }: ScheduleFieldsProps) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
                <Label htmlFor="policy-effective">Effective date</Label>
                <Input
                    id="policy-effective"
                    name="effectiveDate"
                    type="date"
                    required
                    key={`policy-effective-${state.values.effectiveDate}`}
                    defaultValue={state.values.effectiveDate}
                    aria-invalid={Boolean(state.fieldErrors?.effectiveDate)}
                    aria-describedby={state.fieldErrors?.effectiveDate ? 'policy-effective-error' : undefined}
                />
                <FieldError id="policy-effective-error" message={state.fieldErrors?.effectiveDate} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="policy-expiry">Expiry date</Label>
                <Input
                    id="policy-expiry"
                    name="expiryDate"
                    type="date"
                    key={`policy-expiry-${state.values.expiryDate}`}
                    defaultValue={state.values.expiryDate}
                    aria-invalid={Boolean(state.fieldErrors?.expiryDate)}
                    aria-describedby={state.fieldErrors?.expiryDate ? 'policy-expiry-error' : undefined}
                />
                <FieldError id="policy-expiry-error" message={state.fieldErrors?.expiryDate} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="policy-status">Status</Label>
                <Select name="status" defaultValue={state.values.status} disabled={pending}>
                    <SelectTrigger id="policy-status">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {['draft', 'active'].map((status) => (
                            <SelectItem key={status} value={status}>
                                {formatStatusLabel(status)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FieldError id="policy-status-error" message={state.fieldErrors?.status} />
            </div>

            <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                <HiddenAckInput ref={requiresAckInputRef} checked={state.values.requiresAcknowledgment} />
                <Switch
                    id="policy-ack"
                    key={`policy-ack-switch-${state.values.requiresAcknowledgment ? 'on' : 'off'}`}
                    defaultChecked={state.values.requiresAcknowledgment}
                    onCheckedChange={(checked) => onAckChange(checked)}
                    disabled={pending}
                />
                <Label htmlFor="policy-ack" className="text-xs text-muted-foreground">
                    Requires acknowledgment
                </Label>
            </div>
        </div>
    );
}

const HiddenAckInput = forwardRef<HTMLInputElement, { checked: boolean }>(
    ({ checked }, reference) => (
        <input
            ref={reference}
            type="hidden"
            name="requiresAcknowledgment"
            value={checked ? 'on' : 'off'}
        />
    ),
);
HiddenAckInput.displayName = 'HiddenAckInput';

export function PolicyApplicabilityFields({ state }: FormSectionProps) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
                <Label htmlFor="policy-roles">Applicable roles</Label>
                <Input
                    id="policy-roles"
                    name="applicableRoles"
                    placeholder="member, manager, hrAdmin"
                    key={`policy-roles-${state.values.applicableRoles}`}
                    defaultValue={state.values.applicableRoles}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="policy-departments">Applicable departments</Label>
                <Input
                    id="policy-departments"
                    name="applicableDepartments"
                    placeholder="engineering, finance"
                    key={`policy-departments-${state.values.applicableDepartments}`}
                    defaultValue={state.values.applicableDepartments}
                />
            </div>
        </div>
    );
}

export function PolicyContentField({ state }: FormSectionProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor="policy-content">Policy content</Label>
            <Textarea
                id="policy-content"
                name="content"
                required
                rows={6}
                key={`policy-content-${state.values.content}`}
                defaultValue={state.values.content}
                aria-invalid={Boolean(state.fieldErrors?.content)}
                aria-describedby={state.fieldErrors?.content ? 'policy-content-error' : undefined}
            />
            <FieldError id="policy-content-error" message={state.fieldErrors?.content} />
        </div>
    );
}
