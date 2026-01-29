'use server';

import type { LeavePolicy } from '@/server/types/leave-types';
import { PrismaLeavePolicyRepository } from '@/server/repositories/prisma/hr/leave';
import { listLeavePolicies, listLeavePoliciesInputSchema } from '@/server/use-cases/hr/leave-policies/list-leave-policies';

import { getLeavePolicySession } from './leave-policy-action-helpers';

const leavePolicyRepository = new PrismaLeavePolicyRepository();

export async function listLeavePoliciesAction(): Promise<{ policies: LeavePolicy[] }> {
    const session = await getLeavePolicySession('list');
    if (!session) {
        return { policies: [] };
    }

    const payload = listLeavePoliciesInputSchema.parse({ orgId: session.authorization.orgId });
    const result = await listLeavePolicies(
        { leavePolicyRepository },
        { authorization: session.authorization, payload },
    );

    return { policies: result.policies };
}
