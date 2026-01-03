'use client';

import { useActionState, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ComplianceTemplate } from '@/server/types/compliance-types';

import { assignCompliancePackAction } from '../lifecycle-actions';

export interface EmployeeLifecycleComplianceCardProps {
    profileId: string;
    userId: string;
    templates: ComplianceTemplate[];
}

export function EmployeeLifecycleComplianceCard({
    profileId,
    userId,
    templates,
}: EmployeeLifecycleComplianceCardProps) {
    const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id ?? '');
    const selectedTemplate = useMemo(
        () => templates.find((template) => template.id === selectedTemplateId),
        [templates, selectedTemplateId],
    );
    const [state, formAction, pending] = useActionState(assignCompliancePackAction, { status: 'idle' });

    if (templates.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Compliance assignment</CardTitle>
                    <CardDescription>No compliance templates are available.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    Create a compliance template to assign required items to employees.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Compliance assignment</CardTitle>
                <CardDescription>Assign compliance packs and required items.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-4">
                    <input type="hidden" name="profileId" value={profileId} />
                    <input type="hidden" name="userId" value={userId} />
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground" htmlFor="compliance-template">
                            Template
                        </label>
                        <select
                            id="compliance-template"
                            name="templateId"
                            value={selectedTemplateId}
                            onChange={(event) => setSelectedTemplateId(event.target.value)}
                            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                            {templates.map((template) => (
                                <option key={template.id} value={template.id}>
                                    {template.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedTemplate ? (
                        <div className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground">Items to assign</div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {selectedTemplate.items.map((item) => (
                                    <label
                                        key={item.id}
                                        className="flex items-start gap-2 rounded-md border border-border/60 p-2 text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            name="templateItemIds"
                                            value={item.id}
                                            defaultChecked
                                            className="mt-1"
                                        />
                                        <span>
                                            <span className="font-medium">{item.name}</span>
                                            <span className="block text-xs text-muted-foreground">
                                                {item.type.replace(/_/g, ' ').toLowerCase()}
                                                {item.isMandatory ? ' - mandatory' : ''}
                                            </span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-3">
                        <Button type="submit" size="sm" disabled={pending}>
                            {pending ? 'Assigning...' : 'Assign compliance pack'}
                        </Button>
                        <span className="text-xs text-muted-foreground" role="status" aria-live="polite">
                            {state.status === 'error'
                                ? state.message ?? 'Unable to assign compliance pack.'
                                : state.status === 'success'
                                    ? state.message ?? 'Compliance pack assigned.'
                                    : 'Changes apply immediately.'}
                        </span>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
