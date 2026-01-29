import type { ComplianceTemplate } from '@/server/types/compliance-types';
import { listComplianceTemplatesAction } from './actions/compliance-templates';

export const COMPLIANCE_TEMPLATES_QUERY_KEY = ['hr', 'compliance', 'templates'] as const;

export async function fetchComplianceTemplates(): Promise<ComplianceTemplate[]> {
    return listComplianceTemplatesAction();
}
