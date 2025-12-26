import { headers as nextHeaders } from 'next/headers';

import { HrPlaceholder } from '../_components/hr-placeholder';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';

export default async function HrAdminPage() {
    const headerStore = await nextHeaders();
    await getSessionContextOrRedirect({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['update'] },
        auditSource: 'ui:hr:admin',
    });

    return <HrPlaceholder title="HR administration" description="Admin dashboards for HR data and settings." />;
}

