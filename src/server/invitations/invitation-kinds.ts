import type { JsonRecord, JsonValue } from '@/server/types/json';

export const INVITATION_KIND = {
    ORG_MEMBER: 'org_member',
    HR_ONBOARDING: 'hr_onboarding',
    PLATFORM_OWNER: 'platform_owner',
} as const;

export const INVITATION_KIND_METADATA_KEY = 'kind';

export type InvitationKind = (typeof INVITATION_KIND)[keyof typeof INVITATION_KIND];

const INVITATION_KIND_VALUES: InvitationKind[] = Object.values(INVITATION_KIND);

export function isInvitationKind(value: JsonValue | undefined): value is InvitationKind {
    return typeof value === 'string' && INVITATION_KIND_VALUES.includes(value as InvitationKind);
}

export function getInvitationKind(metadata: JsonRecord | null | undefined): InvitationKind | null {
    if (!metadata) {
        return null;
    }
    const candidate = metadata[INVITATION_KIND_METADATA_KEY];
    return isInvitationKind(candidate) ? candidate : null;
}

export function withInvitationKind(
    metadata: JsonRecord | undefined,
    kind: InvitationKind,
): JsonRecord {
    return {
        ...(metadata ?? {}),
        [INVITATION_KIND_METADATA_KEY]: kind,
    };
}
