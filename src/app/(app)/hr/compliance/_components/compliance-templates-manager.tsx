'use client';
import { useActionState, useEffect, useMemo, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import type { ComplianceTemplate } from '@/server/types/compliance-types';
import { FieldError } from '../../_components/field-error';
import { createComplianceTemplateAction } from '../actions/compliance-templates';
import type { ComplianceTemplateCreateState } from '../compliance-template-form-utils';
import { ComplianceTemplateRow } from './compliance-template-row';
import { ComplianceTemplateGuideCard } from './compliance-template-guide-card';
import { ComplianceTemplateListHeader } from './compliance-template-list-header';
import { listTemplatesQuery, templatesKey } from '../compliance-templates.api';

const initialCreateState: ComplianceTemplateCreateState = {
    status: 'idle',
    values: {
        name: '',
        categoryKey: '',
        version: '',
        itemsJson: '',
    },
};

export function ComplianceTemplatesManager(props: { templates: ComplianceTemplate[] }) {
    const queryClient = useQueryClient();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const qValue = searchParams.get('q') ?? '';
    const qNormalized = qValue.trim().toLowerCase();
    const [state, action, pending] = useActionState(
        createComplianceTemplateAction,
        initialCreateState,
    );
    const { data: templatesData = { templates: props.templates } } = useQuery({
        ...listTemplatesQuery(qNormalized),
        initialData: { templates: props.templates },
    });
    const templates = templatesData.templates;
    const formReference = useRef<HTMLFormElement | null>(null);

    useEffect(() => {
        if (!pending && state.status === 'success') {
            void queryClient.invalidateQueries({ queryKey: templatesKey.list(qNormalized) }).catch(() => null);
            formReference.current?.reset();
        }
    }, [pending, queryClient, qNormalized, state.status]);

    useEffect(() => {
        formReference.current?.setAttribute('aria-busy', pending ? 'true' : 'false');
    }, [pending]);

    const nameError = state.fieldErrors?.name;
    const categoryError = state.fieldErrors?.categoryKey;
    const versionError = state.fieldErrors?.version;
    const itemsError = state.fieldErrors?.itemsJson;

    const message = state.status === 'error' ? state.message : state.status === 'success' ? state.message : null;

    const summary = useMemo(() => {
        const categories = new Set<string>();
        for (const template of templates) {
            if (template.categoryKey) {
                categories.add(template.categoryKey);
            }
        }

        return {
            count: templates.length,
            categories: Array.from(categories).slice(0, 6),
            hasOverflow: categories.size > 6,
        };
    }, [templates]);

    const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
        const next = new URLSearchParams(searchParams.toString());
        const value = event.target.value;
        if (value) {
            next.set('q', value);
        } else {
            next.delete('q');
        }
        const query = next.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <Card className="border-primary/15 shadow-sm">
                    <CardHeader className="flex flex-row items-start justify-between gap-3">
                        <div>
                            <CardTitle className="text-lg">Create compliance template</CardTitle>
                            <CardDescription>Standardize checklists for each region or business unit.</CardDescription>
                        </div>
                        <Badge variant="secondary" className="text-xs">Self-serve</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {message ? (
                            <Alert variant={state.status === 'error' ? 'destructive' : 'default'} role="status" aria-live="polite">
                                <AlertTitle>{state.status === 'error' ? 'Unable to save' : 'Template created'}</AlertTitle>
                                <AlertDescription>{message}</AlertDescription>
                            </Alert>
                        ) : null}

                        <form
                            ref={formReference}
                            action={action}
                            className="space-y-4"
                        >
                            <fieldset disabled={pending} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="compliance-template-name">Name</Label>
                                        <Input
                                            id="compliance-template-name"
                                            name="name"
                                            required
                                            key={`compliance-template-name-${state.values.name}`}
                                            defaultValue={state.values.name}
                                            placeholder="UK Right to Work"
                                            aria-invalid={Boolean(nameError)}
                                            aria-describedby={nameError ? 'compliance-template-name-error' : undefined}
                                        />
                                        <FieldError id="compliance-template-name-error" message={nameError} />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="compliance-template-category">Category key</Label>
                                            <Input
                                                id="compliance-template-category"
                                                name="categoryKey"
                                                placeholder="uk_employment"
                                                key={`compliance-template-category-${state.values.categoryKey}`}
                                                defaultValue={state.values.categoryKey}
                                                aria-invalid={Boolean(categoryError)}
                                                aria-describedby={categoryError ? 'compliance-template-category-error' : undefined}
                                            />
                                            <FieldError
                                                id="compliance-template-category-error"
                                                message={categoryError}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="compliance-template-version">Version</Label>
                                            <Input
                                                id="compliance-template-version"
                                                name="version"
                                                placeholder="1"
                                                key={`compliance-template-version-${state.values.version}`}
                                                defaultValue={state.values.version}
                                                aria-invalid={Boolean(versionError)}
                                                aria-describedby={versionError ? 'compliance-template-version-error' : undefined}
                                            />
                                            <FieldError
                                                id="compliance-template-version-error"
                                                message={versionError}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="compliance-template-items">Template items (JSON)</Label>
                                    <Textarea
                                        id="compliance-template-items"
                                        name="itemsJson"
                                        required
                                        rows={10}
                                        placeholder={`[
    {
        "id": "uk_employment.right_to_work",
        "name": "Right to work check",
        "type": "DOCUMENT",
        "isMandatory": true,
        "regulatoryRefs": ["UK_GDPR"]
    }
]`}
                                        key={`compliance-template-items-${state.values.itemsJson}`}
                                        defaultValue={state.values.itemsJson}
                                        className="font-mono text-xs"
                                        aria-invalid={Boolean(itemsError)}
                                        aria-describedby={itemsError ? 'compliance-template-items-error' : undefined}
                                    />
                                    <FieldError id="compliance-template-items-error" message={itemsError} />
                                    <p className="text-xs text-muted-foreground">
                                        Include stable ids, a human name, the item type, regulatoryRefs, and whether each item is mandatory.
                                    </p>
                                </div>
                            </fieldset>

                            <div className="flex flex-wrap items-center gap-3">
                                <Button type="submit" disabled={pending}>
                                    {pending ? <Spinner className="mr-2" /> : null}
                                    {pending ? 'Creating...' : 'Create template'}
                                </Button>
                                <p className="text-xs text-muted-foreground">Templates are scoped to the current organization and residency policy.</p>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <ComplianceTemplateGuideCard />
                </div>
            </div>

            <Card className="border-primary/10">
                <ComplianceTemplateListHeader
                    qValue={qValue}
                    summary={summary}
                    onSearchChange={handleSearchChange}
                />
                <CardContent>
                    {templates.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No templates configured yet. Seed defaults or add one manually to get started.</p>
                    ) : (
                        <div className="space-y-3">
                            {templates.map((template) => (
                                <ComplianceTemplateRow key={template.id} template={template} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
