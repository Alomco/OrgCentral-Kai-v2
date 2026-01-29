'use server';

import { headers } from 'next/headers';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';

const COMPLIANCE_TEMPLATES_AUDIT_SOURCE_PREFIX = 'ui:hr:compliance:templates';
const COMPLIANCE_TEMPLATE_RESOURCE_TYPE = 'hr.compliance.template';
const ORG_PERMISSION_UPDATE = 'update' as const;

type ComplianceTemplateAction = 'create' | 'update' | 'delete' | 'list';

export async function getComplianceTemplateSession(action: ComplianceTemplateAction) {
    try {
        const headerStore = await headers();
        return await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: [ORG_PERMISSION_UPDATE] },
                auditSource: `${COMPLIANCE_TEMPLATES_AUDIT_SOURCE_PREFIX}:${action}`,
                action,
                resourceType: COMPLIANCE_TEMPLATE_RESOURCE_TYPE,
            },
        );
    } catch {
        return null;
    }
}
