import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { POLICY_CATEGORY_VALUES } from '@/server/services/hr/policies/hr-policy-schemas';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { listHrPoliciesForUi } from '@/server/use-cases/hr/policies/list-hr-policies.cached';

import { PolicyAdminManager } from './policy-admin-manager';

export async function PolicyAdminPanel(props: { authorization: RepositoryAuthorizationContext }) {
    const { policies } = await listHrPoliciesForUi({ authorization: props.authorization });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage policies</CardTitle>
                <CardDescription>Create, edit, and publish HR policies for the organization.</CardDescription>
            </CardHeader>
            <CardContent>
                <PolicyAdminManager policies={policies} policyCategories={POLICY_CATEGORY_VALUES} />
            </CardContent>
        </Card>
    );
}
