import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { normalizeRoles } from '@/server/use-cases/shared';
import type {
    EmploymentContractCreateInput,
    OnboardingChecklistConfig,
} from '@/server/types/hr/onboarding-workflows';
import type { ProfileMutationPayload, EmploymentTypeCode, ContractTypeCode } from '@/server/types/hr/people';
import { EMPLOYMENT_TYPE_VALUES, CONTRACT_TYPE_VALUES } from '@/server/types/hr/people';
import type { JsonValue } from '@/server/types/hr/people';
import type { OnboardingInvitation } from '@/server/repositories/contracts/hr/onboarding/invitation-repository-contract';
import { ValidationError } from '@/server/errors';
import type { CreateEmployeeProfileInput } from '@/server/use-cases/hr/people/create-employee-profile';

export interface OnboardingPayload {
    email?: string;
    displayName?: string;
    employeeId?: string;
    employeeNumber?: string;
    employmentType?: string;
    jobTitle?: string;
    eligibleLeaveTypes?: string[];
    onboardingTemplateId?: string;
    roles?: string[];
    contractType?: string;
    startDate?: string;
    departmentId?: string;
    location?: string;
    workingPattern?: JsonValue;
    benefits?: JsonValue;
}

export function extractOnboardingPayload(invitation: OnboardingInvitation): OnboardingPayload {
    const data = invitation.onboardingData;
    if (!isRecord(data)) {
        return {};
    }
    return {
        email: coerceString(data.email),
        displayName: coerceString(data.displayName),
        employeeId: coerceString(data.employeeId),
        employeeNumber: coerceString(data.employeeNumber),
        employmentType: coerceString(data.employmentType),
        jobTitle: coerceString(data.jobTitle ?? data.position),
        eligibleLeaveTypes: extractStringArray(data.eligibleLeaveTypes),
        onboardingTemplateId: coerceString(data.onboardingTemplateId),
        roles: extractStringArray(data.roles),
        contractType: coerceString(data.contractType),
        startDate: coerceString(data.startDate),
        departmentId: coerceString(data.departmentId),
        location: coerceString(data.location),
        workingPattern: isJsonValue(data.workingPattern) ? data.workingPattern : undefined,
        benefits: isJsonValue(data.benefits) ? data.benefits : undefined,
    } satisfies OnboardingPayload;
}

export function resolveEmployeeNumber(payload: OnboardingPayload): string {
    const candidate = payload.employeeId ?? payload.employeeNumber;
    if (candidate) {
        return candidate;
    }
    throw new ValidationError('Invitation is missing the employee identifier.');
}

export function resolveRoles(roles: string[] | undefined): string[] {
    return normalizeRoles(roles ?? []);
}

export function buildProfileData(params: {
    payload: OnboardingPayload;
    userId: string;
    employeeNumber: string;
    invitation: OnboardingInvitation;
}): ProfileMutationPayload['changes'] & { userId: string; employeeNumber: string } {
    const employmentType = resolveEmploymentType(params.payload.employmentType);
    return {
        userId: params.userId,
        employeeNumber: params.employeeNumber,
        employmentType,
        jobTitle: params.payload.jobTitle,
        email: params.payload.email ?? params.invitation.targetEmail,
        displayName: params.payload.displayName,
        eligibleLeaveTypes: params.payload.eligibleLeaveTypes ?? [],
        metadata: buildProfileMetadata(params.invitation),
    } satisfies ProfileMutationPayload['changes'] & { userId: string; employeeNumber: string };
}

export function buildContractData(
    payload: OnboardingPayload,
    userId: string,
): EmploymentContractCreateInput | null {
    const jobTitle = payload.jobTitle;
    if (!jobTitle) {
        return null;
    }

    const contractType = resolveContractType(payload.contractType, payload.employmentType);
    if (!contractType) {
        return null;
    }

    return {
        userId,
        contractType,
        jobTitle,
        startDate: payload.startDate ?? new Date().toISOString(),
        departmentId: payload.departmentId,
        location: payload.location,
        workingPattern: payload.workingPattern,
        benefits: payload.benefits,
    } satisfies EmploymentContractCreateInput;
}

export function buildChecklistConfig(
    payload: OnboardingPayload,
    token: string,
): OnboardingChecklistConfig | null {
    if (!payload.onboardingTemplateId) {
        return null;
    }

    return {
        templateId: payload.onboardingTemplateId,
        metadata: {
            source: 'complete-onboarding-invite',
            invitationToken: token,
        },
    } satisfies OnboardingChecklistConfig;
}

export function buildCreateProfileInput(params: {
    authorization: RepositoryAuthorizationContext;
    profileData: ProfileMutationPayload['changes'] & { userId: string; employeeNumber: string };
    contractData: EmploymentContractCreateInput | null;
    onboardingTemplateId?: string;
    onboardingChecklist: OnboardingChecklistConfig | null;
}): CreateEmployeeProfileInput {
    const createInput: CreateEmployeeProfileInput = {
        authorization: params.authorization,
        profileData: params.profileData,
        onboardingTemplateId: params.onboardingTemplateId,
        onboardingChecklist: params.onboardingChecklist ?? undefined,
    };

    if (params.contractData) {
        createInput.contractData = params.contractData;
    }

    return createInput;
}

function buildProfileMetadata(invitation: OnboardingInvitation): JsonValue {
    return {
        source: 'onboarding-invitation',
        token: invitation.token,
        issuedAt: invitation.createdAt instanceof Date
            ? invitation.createdAt.toISOString()
            : new Date(invitation.createdAt).toISOString(),
        organizationName: invitation.organizationName,
    } satisfies JsonValue;
}

function resolveEmploymentType(value?: string): EmploymentTypeCode {
    if (!value) {
        return 'FULL_TIME';
    }
    const normalized = value.replace(/[-\s]/g, '_').toUpperCase();
    return (EMPLOYMENT_TYPE_VALUES.includes(normalized as EmploymentTypeCode)
        ? normalized
        : 'FULL_TIME') as EmploymentTypeCode;
}

function resolveContractType(
    value: string | undefined,
    employmentType: string | undefined,
): ContractTypeCode | null {
    if (value) {
        const normalized = value.replace(/[-\s]/g, '_').toUpperCase();
        if (CONTRACT_TYPE_VALUES.includes(normalized as ContractTypeCode)) {
            return normalized as ContractTypeCode;
        }
    }
    const fallback = employmentType?.replace(/[-\s]/g, '_').toUpperCase();
    if (fallback === 'CONTRACTOR') {
        return 'AGENCY';
    }
    if (fallback === 'INTERN' || fallback === 'APPRENTICE') {
        return 'APPRENTICESHIP';
    }
    return 'PERMANENT';
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractStringArray(value: unknown): string[] | undefined {
    if (!Array.isArray(value)) {
        return undefined;
    }
    const next = value
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    return next.length > 0 ? next : undefined;
}

function coerceString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function isJsonValue(value: unknown): value is JsonValue {
    if (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
    ) {
        return true;
    }
    if (Array.isArray(value)) {
        return value.every(isJsonValue);
    }
    if (isRecord(value)) {
        return Object.values(value).every(isJsonValue);
    }
    return false;
}
