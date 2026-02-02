'use client';

import { ChevronDown, Layers } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { ComplianceTemplate } from '@/server/types/compliance-types';

import { formatCategoryLabel, formatVersionLabel } from '../compliance-template-display';
import { ComplianceTemplateDeleteForm } from './compliance-template-delete-form';
import { ComplianceTemplateUpdateForm } from './compliance-template-update-form';

export function ComplianceTemplateRow(props: { template: ComplianceTemplate }) {
    const { template } = props;
    const itemCount = template.items.length;
    const categoryLabel = formatCategoryLabel(template.categoryKey);
    const versionLabel = formatVersionLabel(template.version);

    return (
        <div className="rounded-xl bg-card/20 p-4 ring-1 ring-border/15">
            <details className="group">
                <summary className="-mx-2 flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-2 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-base text-foreground">
                                {template.name}
                            </span>
                            <Badge variant="outline" className="text-[11px]" title={template.categoryKey ?? undefined}>
                                {categoryLabel}
                            </Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                                <Layers className="h-3 w-3" />
                                {String(itemCount)} item{itemCount === 1 ? '' : 's'}
                            </span>
                            <span aria-hidden="true">•</span>
                            <span>{versionLabel}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="sr-only">Toggle template details</span>
                        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                    </div>
                </summary>

                <div className="mt-4 space-y-3">
                    <ComplianceTemplateUpdateForm template={template} />
                    <ComplianceTemplateDeleteForm templateId={template.id} />
                </div>
            </details>
        </div>
    );
}
