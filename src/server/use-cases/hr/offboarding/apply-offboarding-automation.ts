import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IProvisioningTaskRepository } from '@/server/repositories/contracts/hr/onboarding/provisioning-task-repository-contract';
import type { IOnboardingWorkflowTemplateRepository, IOnboardingWorkflowRunRepository } from '@/server/repositories/contracts/hr/onboarding/workflow-template-repository-contract';
import type { IEmailSequenceTemplateRepository, IEmailSequenceEnrollmentRepository, IEmailSequenceDeliveryRepository } from '@/server/repositories/contracts/hr/onboarding/email-sequence-repository-contract';
import type { IOnboardingMetricDefinitionRepository, IOnboardingMetricResultRepository } from '@/server/repositories/contracts/hr/onboarding/onboarding-metric-repository-contract';
import type { ProvisioningTaskType } from '@/server/types/hr/provisioning-tasks';
import type { JsonRecord, JsonValue } from '@/server/types/json';
import { assertOrgAccessWithAbac } from '@/server/security/guards';

export interface ApplyOffboardingAutomationDependencies {
    provisioningTaskRepository: IProvisioningTaskRepository;
    workflowTemplateRepository: IOnboardingWorkflowTemplateRepository;
    workflowRunRepository: IOnboardingWorkflowRunRepository;
    emailSequenceTemplateRepository: IEmailSequenceTemplateRepository;
    emailSequenceEnrollmentRepository: IEmailSequenceEnrollmentRepository;
    emailSequenceDeliveryRepository: IEmailSequenceDeliveryRepository;
    onboardingMetricDefinitionRepository: IOnboardingMetricDefinitionRepository;
    onboardingMetricResultRepository: IOnboardingMetricResultRepository;
    now?: () => Date;
}

export interface ApplyOffboardingAutomationInput {
    authorization: RepositoryAuthorizationContext;
    employeeId: string;
    offboardingId: string;
    targetEmail?: string | null;
    workflowTemplateId?: string | null;
    emailSequenceTemplateId?: string | null;
    provisioningTaskTypes?: string[] | null;
}

export interface ApplyOffboardingAutomationResult {
    workflowRunId?: string;
    emailSequenceEnrollmentId?: string;
    provisioningTaskIds: string[];
    metricsRecorded: string[];
}

const DEFAULT_OFFBOARDING_TASKS: ProvisioningTaskType[] = ['ACCESS', 'ACCOUNT', 'EQUIPMENT'];

export async function applyOffboardingAutomation(
    deps: ApplyOffboardingAutomationDependencies,
    input: ApplyOffboardingAutomationInput,
): Promise<ApplyOffboardingAutomationResult> {
    await assertOrgAccessWithAbac({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        auditSource: input.authorization.auditSource,
        correlationId: input.authorization.correlationId,
        action: 'hr.offboarding.automation.apply',
        resourceType: 'hr.offboarding',
        resourceAttributes: { employeeId: input.employeeId, offboardingId: input.offboardingId },
    });

    const now = deps.now ?? (() => new Date());
    const provisioningTaskIds: string[] = [];
    const metricsRecorded: string[] = [];

    let workflowRunId: string | undefined;
    if (input.workflowTemplateId) {
        const template = await deps.workflowTemplateRepository.getTemplate(
            input.authorization.orgId,
            input.workflowTemplateId,
        );
        if (template) {
            const run = await deps.workflowRunRepository.createRun({
                orgId: input.authorization.orgId,
                employeeId: input.employeeId,
                templateId: template.id,
                offboardingId: input.offboardingId,
                metadata: { source: 'offboarding', templateVersion: template.version },
                dataClassification: input.authorization.dataClassification,
                residencyTag: input.authorization.dataResidency,
                auditSource: input.authorization.auditSource,
                correlationId: input.authorization.correlationId,
                createdBy: input.authorization.userId,
            });
            workflowRunId = run.id;
        }
    }

    let emailSequenceEnrollmentId: string | undefined;
    if (input.emailSequenceTemplateId && input.targetEmail) {
        const template = await deps.emailSequenceTemplateRepository.getTemplate(
            input.authorization.orgId,
            input.emailSequenceTemplateId,
        );
        if (template) {
            const enrollment = await deps.emailSequenceEnrollmentRepository.createEnrollment({
                orgId: input.authorization.orgId,
                templateId: template.id,
                employeeId: input.employeeId,
                invitationToken: undefined,
                targetEmail: input.targetEmail,
                startedAt: now(),
                metadata: { source: 'offboarding' },
                dataClassification: input.authorization.dataClassification,
                residencyTag: input.authorization.dataResidency,
                auditSource: input.authorization.auditSource,
                correlationId: input.authorization.correlationId,
                createdBy: input.authorization.userId,
            });
            emailSequenceEnrollmentId = enrollment.id;

            const steps = normalizeSequenceSteps(template.steps);
            for (const step of steps) {
                await deps.emailSequenceDeliveryRepository.createDelivery({
                    orgId: input.authorization.orgId,
                    enrollmentId: enrollment.id,
                    stepKey: step.key,
                    scheduledAt: step.scheduledAt,
                    metadata: step.metadata,
                    dataClassification: input.authorization.dataClassification,
                    residencyTag: input.authorization.dataResidency,
                    auditSource: input.authorization.auditSource,
                    correlationId: input.authorization.correlationId,
                    createdBy: input.authorization.userId,
                });
            }
        }
    }

    const provisioningTypes = (input.provisioningTaskTypes ?? []).filter((value) => value.length > 0);
    const taskTypes = provisioningTypes.length > 0 ? provisioningTypes : DEFAULT_OFFBOARDING_TASKS;

    for (const taskType of taskTypes) {
        const task = await deps.provisioningTaskRepository.createTask({
            orgId: input.authorization.orgId,
            employeeId: input.employeeId,
            requestedByUserId: input.authorization.userId,
            offboardingId: input.offboardingId,
            taskType: taskType as ProvisioningTaskType,
            instructions: 'Deprovision offboarding resources',
            metadata: { source: 'offboarding' },
            dataClassification: input.authorization.dataClassification,
            residencyTag: input.authorization.dataResidency,
            auditSource: input.authorization.auditSource,
            correlationId: input.authorization.correlationId,
            createdBy: input.authorization.userId,
        });
        provisioningTaskIds.push(task.id);
    }

    const metricDefinition = await ensureMetricDefinition(
        deps,
        input.authorization,
        'offboarding.started',
        'Offboarding started',
    );
    if (metricDefinition) {
        await deps.onboardingMetricResultRepository.createResult({
            orgId: input.authorization.orgId,
            employeeId: input.employeeId,
            metricId: metricDefinition.id,
            value: 1,
            valueText: 'started',
            source: 'SYSTEM',
            measuredAt: now(),
            metadata: { source: 'offboarding' },
            dataClassification: input.authorization.dataClassification,
            residencyTag: input.authorization.dataResidency,
            auditSource: input.authorization.auditSource,
            correlationId: input.authorization.correlationId,
            createdBy: input.authorization.userId,
        });
        metricsRecorded.push(metricDefinition.key);
    }

    return {
        workflowRunId,
        emailSequenceEnrollmentId,
        provisioningTaskIds,
        metricsRecorded,
    };
}

interface NormalizedSequenceStep {
    key: string;
    scheduledAt: Date;
    metadata: JsonRecord;
}

function normalizeSequenceSteps(steps: JsonValue): NormalizedSequenceStep[] {
    if (!Array.isArray(steps)) {
        return [];
    }

    const now = new Date();
    return steps
        .map((step, index) => {
            if (!isJsonRecord(step)) {
                return null;
            }
            const key = typeof step.key === 'string' ? step.key : `step-${index + 1}`;
            const delayDays = typeof step.delayDays === 'number' ? step.delayDays : 0;
            const delayHours = typeof step.delayHours === 'number' ? step.delayHours : 0;
            const scheduledAt = new Date(now.getTime() + (delayDays * 24 + delayHours) * 60 * 60 * 1000);
            return {
                key,
                scheduledAt,
                metadata: step,
            } satisfies NormalizedSequenceStep;
        })
        .filter((value): value is NormalizedSequenceStep => Boolean(value));
}

function isJsonRecord(value: JsonValue): value is JsonRecord {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

async function ensureMetricDefinition(
    deps: ApplyOffboardingAutomationDependencies,
    authorization: RepositoryAuthorizationContext,
    key: string,
    label: string,
): Promise<{ id: string; key: string } | null> {
    const definitions = await deps.onboardingMetricDefinitionRepository.listDefinitions(
        authorization.orgId,
        { isActive: true },
    );
    const existing = definitions.find((definition) => definition.key === key);
    if (existing) {
        return { id: existing.id, key: existing.key };
    }
    const created = await deps.onboardingMetricDefinitionRepository.createDefinition({
        orgId: authorization.orgId,
        key,
        label,
        unit: 'count',
        targetValue: null,
        thresholds: null,
        isActive: true,
        metadata: { source: 'system' },
        dataClassification: authorization.dataClassification,
        residencyTag: authorization.dataResidency,
        auditSource: authorization.auditSource,
        correlationId: authorization.correlationId,
        createdBy: authorization.userId,
    });
    return { id: created.id, key: created.key };
}
