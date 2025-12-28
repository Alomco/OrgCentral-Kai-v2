import { z } from 'zod';
import { LEAVE_POLICY_TYPES } from '@/server/types/leave-types';
import type { LeavePolicy } from '@/server/types/leave-types';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { ILeavePolicyRepository } from '@/server/repositories/contracts/hr/leave/leave-policy-repository-contract';
import { assertPrivilegedOrgPolicyActor } from '@/server/security/authorization/hr-policies';
import { AuthorizationError, EntityNotFoundError, ValidationError } from '@/server/errors';
import { invalidateLeaveCacheScopes } from '@/server/use-cases/hr/leave/shared/cache-helpers';

const leavePolicyTypeValues = [...LEAVE_POLICY_TYPES] as [
    (typeof LEAVE_POLICY_TYPES)[number],
    ...(typeof LEAVE_POLICY_TYPES)[number][],
];

export const updateLeavePolicyPatchSchema = z
    .object({
        name: z.string().trim().min(1).max(120).optional(),
        type: z.enum(leavePolicyTypeValues).optional(),
        accrualAmount: z.coerce.number().nonnegative().max(366).optional(),
        carryOverLimit: z.coerce.number().int().nonnegative().optional().nullable(),
        requiresApproval: z.boolean().optional(),
        isDefault: z.boolean().optional(),
        activeFrom: z.coerce.date().optional(),
        activeTo: z.coerce.date().optional().nullable(),
        statutoryCompliance: z.boolean().optional(),
        maxConsecutiveDays: z.coerce.number().int().positive().optional().nullable(),
        allowNegativeBalance: z.boolean().optional(),
        metadata: z.record(z.string(), z.unknown()).optional().nullable(),
    })
    .strict();

export type UpdateLeavePolicyPatch = z.infer<typeof updateLeavePolicyPatchSchema>;

export interface UpdateLeavePolicyDependencies {
    leavePolicyRepository: ILeavePolicyRepository;
}

export interface UpdateLeavePolicyRequest {
    authorization: RepositoryAuthorizationContext;
    orgId: string;
    policyId: string;
    patch: UpdateLeavePolicyPatch;
}

export interface UpdateLeavePolicyResult {
    policy: LeavePolicy;
}

type LeavePolicyUpdateShape = Partial<Omit<LeavePolicy, 'id' | 'orgId' | 'createdAt'>>;

function buildLeavePolicyUpdates(patch: UpdateLeavePolicyPatch): LeavePolicyUpdateShape {
    const updates: LeavePolicyUpdateShape = {};

    const mappings: [
        key: keyof UpdateLeavePolicyPatch,
        apply: (value: UpdateLeavePolicyPatch[keyof UpdateLeavePolicyPatch]) => void,
    ][] = [
            ['name', (value) => {
                updates.name = value as string;
            }],
            ['type', (value) => {
                updates.policyType = value as LeavePolicy['policyType'];
            }],
            ['accrualAmount', (value) => {
                updates.accrualAmount = value as number;
            }],
            ['carryOverLimit', (value) => {
                updates.carryOverLimit = value as number | null;
            }],
            ['requiresApproval', (value) => {
                updates.requiresApproval = value as boolean;
            }],
            ['isDefault', (value) => {
                updates.isDefault = value as boolean;
            }],
            ['statutoryCompliance', (value) => {
                updates.statutoryCompliance = value as boolean;
            }],
            ['maxConsecutiveDays', (value) => {
                updates.maxConsecutiveDays = value as number | null;
            }],
            ['allowNegativeBalance', (value) => {
                updates.allowNegativeBalance = value as boolean;
            }],
            ['metadata', (value) => {
                updates.metadata = value as Record<string, unknown> | null;
            }],
        ];

    for (const [key, apply] of mappings) {
        const value = patch[key];
        if (value !== undefined) {
            apply(value);
        }
    }

    if (patch.activeFrom) {
        updates.activeFrom = patch.activeFrom.toISOString();
    }

    if (patch.activeTo !== undefined) {
        updates.activeTo = patch.activeTo ? patch.activeTo.toISOString() : null;
    }

    return updates;
}

export async function updateLeavePolicy(
    deps: UpdateLeavePolicyDependencies,
    request: UpdateLeavePolicyRequest,
): Promise<UpdateLeavePolicyResult> {
    assertPrivilegedOrgPolicyActor(request.authorization);

    if (request.orgId !== request.authorization.orgId) {
        throw new AuthorizationError('Cross-tenant leave policy operation denied.');
    }

    const existing = await deps.leavePolicyRepository.getLeavePolicy(
        request.authorization.tenantScope,
        request.policyId,
    );

    if (!existing) {
        throw new EntityNotFoundError('Leave policy', {
            orgId: request.authorization.orgId,
            policyId: request.policyId,
        });
    }

    if (request.patch.name && request.patch.name !== existing.name) {
        const collision = await deps.leavePolicyRepository.getLeavePolicyByName(
            request.authorization.tenantScope,
            request.patch.name,
        );

        if (collision && collision.id !== existing.id) {
            throw new ValidationError('A leave policy with this name already exists for the organization.', {
                orgId: request.authorization.orgId,
                name: request.patch.name,
            });
        }
    }

    const updates = buildLeavePolicyUpdates(request.patch);

    await deps.leavePolicyRepository.updateLeavePolicy(
        request.authorization.tenantScope,
        request.policyId,
        updates,
    );

    await invalidateLeaveCacheScopes(request.authorization, 'policies');

    const updated = await deps.leavePolicyRepository.getLeavePolicy(
        request.authorization.tenantScope,
        request.policyId,
    );

    if (!updated) {
        throw new EntityNotFoundError('Leave policy', {
            orgId: request.authorization.orgId,
            policyId: request.policyId,
        });
    }

    return { policy: updated };
}
