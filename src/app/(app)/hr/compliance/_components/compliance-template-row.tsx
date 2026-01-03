'use client';

import type { ComplianceTemplate } from '@/server/types/compliance-types';

import { ComplianceTemplateDeleteForm } from './compliance-template-delete-form';
import { ComplianceTemplateUpdateForm } from './compliance-template-update-form';

export function ComplianceTemplateRow(props: { template: ComplianceTemplate }) {
    return (
        <div className="space-y-3 rounded-lg border p-3">
            <ComplianceTemplateUpdateForm template={props.template} />
            <ComplianceTemplateDeleteForm templateId={props.template.id} />
        </div>
    );
}
