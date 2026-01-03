import { randomUUID } from 'node:crypto';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { requireSessionUser } from '@/server/api-adapters/http/session-helpers';
import { getFeatureFlagDecision } from '@/server/lib/optimizely';
import type { CreateLeaveBalanceResult as CreateLeaveBalanceUseCaseResult } from '@/server/use-cases/hr/leave/create-leave-balance';
import {
    leaveBalancePayloadSchema,
    type LeaveBalancePayload,
} from '@/server/types/hr-leave-schemas';
import type { LeaveBalance } from '@/server/types/leave-types';
import {
    defaultLeaveControllerDependencies,
    resolveLeaveControllerDependencies,
    type LeaveControllerDependencies,
    readJson,
} from './common';

export interface CreateLeaveBalanceResult extends CreateLeaveBalanceUseCaseResult {
    success: true;
    policyResolverEnabled: boolean;
    featureDecisionSource: 'optimizely' | 'fallback';
}

export async function createLeaveBalanceController(
    request: Request,
    dependencies: LeaveControllerDependencies = defaultLeaveControllerDependencies,
): Promise<CreateLeaveBalanceResult> {
    const payload = leaveBalancePayloadSchema.parse(await readJson<LeaveBalancePayload>(request));
    const { session, service } = resolveLeaveControllerDependencies(dependencies);

    const { session: authSession, authorization } = await getSessionContext(session, {
        headers: request.headers,
        requiredPermissions: { organization: ['create'] },
        auditSource: 'api:hr:leave:balance:create',
        action: 'create',
        resourceType: 'hr.leave.balance',
        resourceAttributes: {
            employeeId: payload.employeeId,
            leaveType: payload.leaveType,
            year: payload.year,
        },
    });

    const { userId } = requireSessionUser(authSession);
    const decision = await getFeatureFlagDecision('leave_policy_resolver', userId);
    const balance = buildBalanceModel(payload, authorization);

    const result = await service.createLeaveBalance({
        authorization,
        balance,
    });

    return {
        ...result,
        success: true,
        policyResolverEnabled: decision.enabled,
        featureDecisionSource: decision.source,
    };
}

function buildBalanceModel(
    payload: LeaveBalancePayload,
    authorization: { orgId: string; dataResidency: LeaveBalance['dataResidency']; dataClassification: LeaveBalance['dataClassification'] },
): Omit<LeaveBalance, 'createdAt' | 'updatedAt'> {
    const used = payload.used;
    const pending = payload.pending;
    const totalEntitlement = payload.totalEntitlement;
    const available =
        payload.available ?? Math.max(totalEntitlement - used - pending, 0);

    return {
        id: payload.id ?? randomUUID(),
        orgId: authorization.orgId,
        employeeId: payload.employeeId,
        leaveType: payload.leaveType,
        year: payload.year,
        totalEntitlement,
        used,
        pending,
        available,
        dataResidency: authorization.dataResidency,
        dataClassification: authorization.dataClassification,
        auditSource: 'api:hr:leave:balance:create',
    };
}
