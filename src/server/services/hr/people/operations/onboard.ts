import { buildTelemetryMetadata, invalidateOnboardCaches } from '@/server/services/hr/people/helpers/people-orchestration.helpers';
import type {
    OnboardEmployeeInput,
    OnboardEmployeeResult,
    OrchestrationAuthorization,
} from '@/server/services/hr/people/people-orchestration.types';
import type { PeopleOrchestrationRuntime } from '@/server/services/hr/people/people-orchestration.deps';
import { buildContractPayload, buildProfilePayload } from '@/server/services/hr/people/helpers/onboard-payload.helpers';
import type {
    IOnboardingInvitationRepository,
    OnboardingInvitationCreateInput,
} from '@/server/repositories/contracts/hr/onboarding/invitation-repository-contract';
import type { IOrganizationRepository } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import type { OrganizationData } from '@/server/types/leave-types';

export async function onboardEmployeeOperation(
    runtime: PeopleOrchestrationRuntime,
    parsed: OnboardEmployeeInput,
): Promise<OnboardEmployeeResult> {
    const { authorization } = parsed as { authorization: OrchestrationAuthorization };
    await runtime.ensureOrgAccess(authorization);

    const metadata = buildTelemetryMetadata('onboard', authorization, {
        hasContract: Boolean(parsed.contractDraft),
        hasInvite: Boolean(parsed.invite),
    });

    return runtime.execute(authorization, 'hr.people.orchestration.onboard', metadata, async () => {
        const eligibleLeaveTypes = parsed.eligibleLeaveTypes ?? parsed.profileDraft.eligibleLeaveTypes ?? [];

        const profileData = buildProfilePayload(parsed.profileDraft, eligibleLeaveTypes);
        const enrichedProfileData = parsed.invite
            ? markPreboardingProfile(profileData, parsed.invite.email)
            : profileData;

        const profileResult = await runtime.deps.peopleService.createEmployeeProfile({
            authorization,
            payload: {
                profileData: enrichedProfileData,
            },
        });

        const result: OnboardEmployeeResult = {
            profileId: profileResult.profileId,
        };

        if (parsed.contractDraft) {
            const contractData = buildContractPayload(parsed.profileDraft, parsed.contractDraft);
            const contractResult = await runtime.deps.peopleService.createEmploymentContract({
                authorization,
                payload: {
                    contractData,
                },
            });
            result.contractId = contractResult.contractId;
        }

        if (parsed.invite && runtime.deps.onboardingInvitationRepository) {
            const invitationToken = await issueOnboardingInvitation({
                inviteEmail: parsed.invite.email,
                authorization,
                invitationRepository: runtime.deps.onboardingInvitationRepository,
                organizationRepository: runtime.deps.organizationRepository,
                onboardingTemplateId: parsed.onboardingTemplateId,
                profileDraft: parsed.profileDraft,
            });
            result.invitationToken = invitationToken;
        }

        if (eligibleLeaveTypes.length > 0) {
            const currentYear = new Date().getFullYear();
            await runtime.deps.leaveService.ensureEmployeeBalances({
                authorization,
                employeeId: parsed.profileDraft.employeeNumber,
                year: currentYear,
                leaveTypes: eligibleLeaveTypes,
            });
        }

        await invalidateOnboardCaches(authorization);
        return result;
    });
}

async function issueOnboardingInvitation(params: {
    inviteEmail: string;
    authorization: OrchestrationAuthorization;
    invitationRepository: IOnboardingInvitationRepository;
    organizationRepository?: IOrganizationRepository;
    onboardingTemplateId?: string | null;
    profileDraft: OnboardEmployeeInput['profileDraft'];
}): Promise<string> {
    const organization: OrganizationData | null | undefined =
        params.organizationRepository?.getOrganization
            ? await params.organizationRepository.getOrganization(params.authorization.orgId)
            : null;

    const names = extractLegacyNameFields(params.profileDraft.metadata);
    const resolvedDisplayName = names.displayName ?? buildFullName(names.firstName, names.lastName);
    const displayName = resolvedDisplayName ?? params.inviteEmail;

    const onboardingData: OnboardingInvitationCreateInput['onboardingData'] = {
        email: params.inviteEmail,
        displayName,
        employeeId: params.profileDraft.employeeNumber,
        employmentType: params.profileDraft.employmentType ?? null,
        position: params.profileDraft.jobTitle ?? null,
        startDate: toIsoString(params.profileDraft.startDate),
        onboardingTemplateId: params.onboardingTemplateId ?? null,
        roles: params.profileDraft.roles ?? [],
    };

    const invitation = await params.invitationRepository.createInvitation({
        orgId: params.authorization.orgId,
        organizationName: organization?.name ?? params.authorization.orgId,
        targetEmail: params.inviteEmail,
        invitedByUserId: params.authorization.userId,
        onboardingData,
        metadata: {
            correlationId: params.authorization.correlationId,
            auditSource: params.authorization.auditSource,
        },
    });

    return invitation.token;
}

function markPreboardingProfile(
    profileData: OnboardEmployeeInput['profileDraft'],
    inviteEmail: string,
): OnboardEmployeeInput['profileDraft'] {
    const metadata = isRecord(profileData.metadata) ? profileData.metadata : {};
    return {
        ...profileData,
        metadata: {
            ...metadata,
            preboarding: true,
            inviteEmail,
        },
    } satisfies OnboardEmployeeInput['profileDraft'];
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

interface LegacyNameFields {
    displayName?: string;
    firstName?: string;
    lastName?: string;
}

function extractLegacyNameFields(metadata: unknown): LegacyNameFields {
    if (!isRecord(metadata)) {
        return {};
    }
    const legacyCandidate = (metadata as { legacyProfile?: unknown }).legacyProfile;
    const legacySource: Record<string, unknown> = isRecord(legacyCandidate) ? legacyCandidate : metadata;

    const normalize = (value: unknown): string | undefined =>
        typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

    return {
        displayName: normalize(legacySource.displayName),
        firstName: normalize(legacySource.firstName),
        lastName: normalize(legacySource.lastName),
    };
}

function buildFullName(firstName?: string, lastName?: string): string | null {
    const parts = [firstName, lastName].filter(
        (part): part is string => typeof part === 'string' && part.trim().length > 0,
    );
    if (!parts.length) {
        return null;
    }
    return parts.join(' ');
}

function toIsoString(value: unknown): string | null {
    if (value === null || value === undefined) {
        return null;
    }
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value.toISOString();
    }
    if (typeof value === 'string' && value.trim().length > 0) {
        return value;
    }
    return null;
}
