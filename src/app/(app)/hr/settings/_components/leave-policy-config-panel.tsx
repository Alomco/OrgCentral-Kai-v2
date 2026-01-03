import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { PrismaLeavePolicyRepository } from '@/server/repositories/prisma/hr/leave';
import { LEAVE_POLICY_TYPES } from '@/server/types/leave-types';
import { listLeavePolicies, listLeavePoliciesInputSchema } from '@/server/use-cases/hr/leave-policies/list-leave-policies';

import { LeavePolicyConfigForm } from './leave-policy-config-form';

export async function LeavePolicyConfigPanel(props: {
    authorization: RepositoryAuthorizationContext;
}) {
    const payload = listLeavePoliciesInputSchema.parse({ orgId: props.authorization.orgId });
    const result = await listLeavePolicies(
        { leavePolicyRepository: new PrismaLeavePolicyRepository() },
        { authorization: props.authorization, payload },
    );

    return <LeavePolicyConfigForm policies={result.policies} policyTypes={LEAVE_POLICY_TYPES} />;
}
