import { EntityNotFoundError } from '@/server/errors';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import type { IChecklistTemplateRepository } from '@/server/repositories/contracts/hr/onboarding/checklist-template-repository-contract';
import type { IChecklistInstanceRepository } from '@/server/repositories/contracts/hr/onboarding/checklist-instance-repository-contract';
import type { IProvisioningTaskRepository } from '@/server/repositories/contracts/hr/onboarding/provisioning-task-repository-contract';
import type { IOnboardingWorkflowTemplateRepository, IOnboardingWorkflowRunRepository } from '@/server/repositories/contracts/hr/onboarding/workflow-template-repository-contract';
import type {
    IEmailSequenceTemplateRepository,
    IEmailSequenceEnrollmentRepository,
    IEmailSequenceDeliveryRepository,
} from '@/server/repositories/contracts/hr/onboarding/email-sequence-repository-contract';
import type { IOnboardingMetricDefinitionRepository, IOnboardingMetricResultRepository } from '@/server/repositories/contracts/hr/onboarding/onboarding-metric-repository-contract';
import type { IOffboardingRepository } from '@/server/repositories/contracts/hr/offboarding';
import type { IUserSessionRepository } from '@/server/repositories/contracts/auth/sessions/user-session-repository-contract';
import type { ChecklistTemplateItem, ChecklistItemProgress } from '@/server/types/onboarding-types';
import type { OffboardingRecord } from '@/server/types/hr/offboarding-types';
import type { MembershipServiceContract } from '@/server/services/org/membership/membership-service.provider';
import type { JsonRecord } from '@/server/types/json';
import { assertOffboardingStarter } from '@/server/security/authorization/hr-guards/offboarding';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import { revokeOffboardingAccess } from './offboarding-access';
import { applyOffboardingAutomation } from './apply-offboarding-automation';

export type OffboardingMode = 'DIRECT' | 'CHECKLIST';

export interface StartOffboardingInput {
    authorization: RepositoryAuthorizationContext;
    profileId: string;
    mode: OffboardingMode;
    templateId?: string;
    reason: string;
    metadata?: JsonRecord | null;
    workflowTemplateId?: string | null;
    emailSequenceTemplateId?: string | null;
    provisioningTaskTypes?: string[] | null;
}

export interface StartOffboardingDependencies {
    offboardingRepository: IOffboardingRepository;
    employeeProfileRepository: IEmployeeProfileRepository;
    checklistTemplateRepository?: IChecklistTemplateRepository;
    checklistInstanceRepository?: IChecklistInstanceRepository;
    userSessionRepository?: IUserSessionRepository;
    membershipService?: MembershipServiceContract;
    provisioningTaskRepository?: IProvisioningTaskRepository;
    workflowTemplateRepository?: IOnboardingWorkflowTemplateRepository;
    workflowRunRepository?: IOnboardingWorkflowRunRepository;
    emailSequenceTemplateRepository?: IEmailSequenceTemplateRepository;
    emailSequenceEnrollmentRepository?: IEmailSequenceEnrollmentRepository;
    emailSequenceDeliveryRepository?: IEmailSequenceDeliveryRepository;
    onboardingMetricDefinitionRepository?: IOnboardingMetricDefinitionRepository;
    onboardingMetricResultRepository?: IOnboardingMetricResultRepository;
}

export interface StartOffboardingResult {
    offboarding: OffboardingRecord;
    checklistInstanceId?: string | null;
}

export async function startOffboarding(
    deps: StartOffboardingDependencies,
    input: StartOffboardingInput,
): Promise<StartOffboardingResult> {
    await assertOffboardingStarter({
        authorization: input.authorization,
        resourceAttributes: {
            orgId: input.authorization.orgId,
            employeeId: input.profileId,
        },
    });

    const profile = await deps.employeeProfileRepository.getEmployeeProfile(
        input.authorization.orgId,
        input.profileId,
    );
    if (!profile) {
        throw new EntityNotFoundError('Employee profile', { profileId: input.profileId, orgId: input.authorization.orgId });
    }

    const existing = await deps.offboardingRepository.getOffboardingByEmployee(
        input.authorization.orgId,
        input.profileId,
    );
    if (existing?.status === 'IN_PROGRESS') {
        throw new Error('Offboarding already in progress for this employee.');
    }

    const offboarding = await deps.offboardingRepository.createOffboarding({
        orgId: input.authorization.orgId,
        employeeId: profile.id,
        initiatedByUserId: input.authorization.userId,
        checklistInstanceId: null,
        reason: input.reason,
        metadata: input.metadata ?? null,
        dataResidency: input.authorization.dataResidency,
        dataClassification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        correlationId: input.authorization.correlationId,
        createdBy: input.authorization.userId,
    });

    let checklistInstanceId: string | null = null;

    if (input.mode === 'CHECKLIST') {
        if (!input.templateId) {
            throw new Error('Checklist template is required for checklist-based offboarding.');
        }
        if (!deps.checklistTemplateRepository || !deps.checklistInstanceRepository) {
            throw new Error('Checklist repositories are required for checklist-based offboarding.');
        }

        const template = await deps.checklistTemplateRepository.getTemplate(
            input.authorization.orgId,
            input.templateId,
        );
        if (template?.type !== 'offboarding') {
            throw new Error('Offboarding checklist template not found.');
        }

        const items = mapTemplateItemsToProgress(template.items);
        const instance = await deps.checklistInstanceRepository.createInstance({
            orgId: input.authorization.orgId,
            employeeId: profile.employeeNumber,
            templateId: template.id,
            templateName: template.name,
            items,
            metadata: {
                source: 'offboarding',
                issuedAt: new Date().toISOString(),
                ...input.metadata,
            },
        });

        checklistInstanceId = instance.id;
        await deps.offboardingRepository.updateOffboarding(
            input.authorization.orgId,
            offboarding.id,
            {
                checklistInstanceId,
                updatedBy: input.authorization.userId,
            },
        );
    }

    if (input.mode === 'DIRECT') {
        if (!deps.userSessionRepository) {
            throw new Error('User session repository is required to complete direct offboarding.');
        }
        await deps.employeeProfileRepository.updateEmployeeProfile(
            input.authorization.orgId,
            profile.id,
            {
                employmentStatus: 'ARCHIVED',
                archivedAt: new Date(),
            },
        );

        const completed = await deps.offboardingRepository.updateOffboarding(
            input.authorization.orgId,
            offboarding.id,
            {
                status: 'COMPLETED',
                completedAt: new Date(),
                updatedBy: input.authorization.userId,
            },
        );

        const accessResult = await revokeOffboardingAccess({
            authorization: input.authorization,
            userId: profile.userId,
            userSessionRepository: deps.userSessionRepository,
            membershipService: deps.membershipService,
        });

        await recordAuditEvent({
            orgId: input.authorization.orgId,
            userId: input.authorization.userId,
            eventType: 'DATA_CHANGE',
            action: 'hr.offboarding.completed',
            resource: 'hr.offboarding',
            resourceId: completed.id,
            residencyZone: input.authorization.dataResidency,
            classification: input.authorization.dataClassification,
            auditSource: input.authorization.auditSource,
            payload: {
                profileId: profile.id,
                mode: input.mode,
                reason: input.reason,
                revokedSessions: accessResult.revokedSessions,
                membershipSuspended: accessResult.membershipSuspended,
            },
        });

        return {
            offboarding: completed,
            checklistInstanceId,
        };
    }

    await deps.employeeProfileRepository.updateEmployeeProfile(
        input.authorization.orgId,
        profile.id,
        {
            employmentStatus: 'OFFBOARDING',
        },
    );

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'DATA_CHANGE',
        action: 'hr.offboarding.started',
        resource: 'hr.offboarding',
        resourceId: offboarding.id,
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        payload: {
            profileId: profile.id,
            mode: input.mode,
            checklistInstanceId,
            reason: input.reason,
        },
    });

    if (
        deps.provisioningTaskRepository &&
        deps.workflowTemplateRepository &&
        deps.workflowRunRepository &&
        deps.emailSequenceTemplateRepository &&
        deps.emailSequenceEnrollmentRepository &&
        deps.emailSequenceDeliveryRepository &&
        deps.onboardingMetricDefinitionRepository &&
        deps.onboardingMetricResultRepository
    ) {
        await applyOffboardingAutomation(
            {
                provisioningTaskRepository: deps.provisioningTaskRepository,
                workflowTemplateRepository: deps.workflowTemplateRepository,
                workflowRunRepository: deps.workflowRunRepository,
                emailSequenceTemplateRepository: deps.emailSequenceTemplateRepository,
                emailSequenceEnrollmentRepository: deps.emailSequenceEnrollmentRepository,
                emailSequenceDeliveryRepository: deps.emailSequenceDeliveryRepository,
                onboardingMetricDefinitionRepository: deps.onboardingMetricDefinitionRepository,
                onboardingMetricResultRepository: deps.onboardingMetricResultRepository,
            },
            {
                authorization: input.authorization,
                employeeId: profile.id,
                offboardingId: offboarding.id,
                targetEmail: profile.email ?? profile.personalEmail ?? undefined,
                workflowTemplateId: input.workflowTemplateId ?? undefined,
                emailSequenceTemplateId: input.emailSequenceTemplateId ?? undefined,
                provisioningTaskTypes: input.provisioningTaskTypes ?? undefined,
            },
        );
    }

    return { offboarding, checklistInstanceId };
}

function mapTemplateItemsToProgress(items: ChecklistTemplateItem[]): ChecklistItemProgress[] {
    return items
        .slice()
        .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
        .map((item) => ({
            task: item.label,
            completed: false,
            completedAt: null,
            notes: item.description ?? null,
        }));
}
