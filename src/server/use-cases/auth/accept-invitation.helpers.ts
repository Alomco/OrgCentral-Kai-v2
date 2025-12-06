import { MembershipStatus, type Prisma } from '@prisma/client';
import type { InvitationRecord } from '@/server/repositories/contracts/auth/invitations/invitation-repository.types';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import type { IChecklistTemplateRepository } from '@/server/repositories/contracts/hr/onboarding/checklist-template-repository-contract';
import type { IChecklistInstanceRepository } from '@/server/repositories/contracts/hr/onboarding/checklist-instance-repository-contract';
import type { EmployeeProfilePayload, UserActivationPayload } from '@/server/repositories/contracts/org/membership';
import type { EmployeeProfileDTO } from '@/server/types/hr/people';
import type { ChecklistItemProgress, ChecklistTemplateItem } from '@/server/types/onboarding-types';
import { normalizeEmploymentType, parseDate, generateEmployeeNumber as sharedGenerateEmployeeNumber } from '@/server/use-cases/shared';

export type EmployeeNumberGenerator = () => string;
type LinkProfileToUserFunction = (
    tenantId: string,
    employeeNumber: string,
    userId: string,
) => Promise<void>;

export function buildEmployeeProfilePayload(
    record: InvitationRecord,
    userId: string,
    generateEmployeeNumber: EmployeeNumberGenerator,
): EmployeeProfilePayload {
    const employmentTypeValue = normalizeEmploymentType(record.onboardingData.employmentType);
    const trimmedEmployeeId = record.onboardingData.employeeId?.trim() ?? '';

    return {
        orgId: record.organizationId,
        userId,
        employeeNumber: trimmedEmployeeId.length > 0 ? trimmedEmployeeId : generateEmployeeNumber(),
        jobTitle: record.onboardingData.position ?? null,
        employmentType: employmentTypeValue as EmployeeProfilePayload['employmentType'],
        startDate: parseDate(record.onboardingData.startDate),
        metadata: buildInvitationMetadata(record),
    };
}

export function buildUserActivationPayload(record: InvitationRecord): UserActivationPayload {
    const primaryEmail = record.onboardingData.email.trim();
    const email = primaryEmail.length > 0 ? primaryEmail : record.targetEmail;
    const displayName = record.onboardingData.displayName.trim();
    const normalizedDisplayName = displayName.length > 0 ? displayName : email;

    return {
        displayName: normalizedDisplayName,
        email,
        status: MembershipStatus.ACTIVE,
    };
}

export function defaultEmployeeNumberGenerator(): string {
    return sharedGenerateEmployeeNumber();
}

export async function resolvePreboardingProfilePayload(
    repository: IEmployeeProfileRepository | undefined,
    record: InvitationRecord,
    userId: string,
): Promise<EmployeeProfilePayload | null> {
    if (!repository) {
        return null;
    }
    return resolveProfileUsingRepository(repository, record, userId);
}

export async function maybeInstantiateChecklistInstance(params: {
    record: InvitationRecord;
    employeeNumber?: string | null;
    templateRepository?: IChecklistTemplateRepository;
    instanceRepository?: IChecklistInstanceRepository;
}): Promise<void> {
    const { record, employeeNumber, templateRepository, instanceRepository } = params;
    const templateId = normalizeTemplateId(record.onboardingData.onboardingTemplateId);
    if (!templateId || !employeeNumber || !templateRepository || !instanceRepository) {
        return;
    }
    const existingInstance = await instanceRepository.getActiveInstanceForEmployee(
        record.organizationId,
        employeeNumber,
    );
    if (existingInstance) {
        return;
    }
    const template = await templateRepository.getTemplate(record.organizationId, templateId);
    if (!template) {
        return;
    }
    const items = mapTemplateItemsToProgress(template.items);
    await instanceRepository.createInstance({
        orgId: record.organizationId,
        employeeId: employeeNumber,
        templateId: template.id,
        templateName: template.name,
        items,
        metadata: {
            source: 'accept-invitation',
            issuedAt: new Date().toISOString(),
            invitationToken: record.token,
        },
    });
}

export function extractEmployeeNumber(record: InvitationRecord): string | undefined {
    const candidate = record.onboardingData.employeeId;
    if (typeof candidate !== 'string') {
        return undefined;
    }
    const trimmed = candidate.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function mapProfileDtoToPayload(
    profile: EmployeeProfileDTO,
    userId: string,
    record: InvitationRecord,
): EmployeeProfilePayload {
    const employmentType =
        (profile.employmentType as EmployeeProfilePayload['employmentType']) ??
        (normalizeEmploymentType(record.onboardingData.employmentType) as EmployeeProfilePayload['employmentType']);
    const startDate =
        coerceProfileStartDate(profile.startDate) ?? parseDate(record.onboardingData.startDate) ?? undefined;

    return {
        orgId: profile.orgId,
        userId,
        employeeNumber: profile.employeeNumber,
        jobTitle: profile.jobTitle ?? record.onboardingData.position ?? null,
        employmentType,
        startDate,
        metadata: mergeProfileMetadata(profile.metadata, record),
    };
}

function coerceProfileStartDate(value: Date | string | null | undefined): Date | null | undefined {
    if (value instanceof Date) {
        return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
        return parseDate(value);
    }
    return undefined;
}

function mergeProfileMetadata(existing: unknown, record: InvitationRecord): Prisma.JsonValue {
    const invitationMetadata = buildInvitationMetadata(record);
    if (isPlainObject(existing)) {
        return { ...existing, invitation: invitationMetadata } as Prisma.JsonValue;
    }
    if (existing === null || existing === undefined) {
        return { invitation: invitationMetadata };
    }
    return {
        legacyMetadata: existing,
        invitation: invitationMetadata,
    } as Prisma.JsonValue;
}

function buildInvitationMetadata(record: InvitationRecord): Prisma.JsonValue {
    return {
        source: 'invitation-onboarding',
        templateId: record.onboardingData.onboardingTemplateId ?? null,
        payload: cloneOnboardingPayload(record),
    };
}

function cloneOnboardingPayload(record: InvitationRecord): Prisma.JsonValue {
    return JSON.parse(JSON.stringify(record.onboardingData)) as Prisma.JsonValue;
}

function mapTemplateItemsToProgress(items: ChecklistTemplateItem[]): ChecklistItemProgress[] {
    return [...items]
        .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
        .map((item) => ({
            task: item.label,
            completed: false,
            completedAt: null,
            notes: item.description ?? null,
        }));
}

function normalizeTemplateId(value?: string | null): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function resolveProfileUsingRepository(
    repository: IEmployeeProfileRepository,
    record: InvitationRecord,
    userId: string,
): Promise<EmployeeProfilePayload | null> {
    const employeeNumber = extractEmployeeNumber(record);
    if (!employeeNumber) {
        return null;
    }
    const profile = await repository.findByEmployeeNumber(record.organizationId, employeeNumber);
    if (!profile) {
        return null;
    }
    await linkProfileToConfirmedUser(repository, record.organizationId, employeeNumber, userId);
    return mapProfileDtoToPayload(profile, userId, record);
}

async function linkProfileToConfirmedUser(
    repository: IEmployeeProfileRepository,
    tenantId: string,
    employeeNumber: string,
    userId: string,
): Promise<void> {
    const repositoryWithLink = repository as IEmployeeProfileRepository & {
        linkProfileToUser: LinkProfileToUserFunction;
    };
    await repositoryWithLink.linkProfileToUser(tenantId, employeeNumber, userId);
}
