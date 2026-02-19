import type { MembershipStatus } from '../../src/generated/client';
import type { OrgRoleKey } from '@/server/security/access-control';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

export type OrganizationKey = 'platform' | 'alpha' | 'beta';

export type PersonaState =
    | 'ready'
    | 'password_setup_required'
    | 'profile_setup_required'
    | 'mfa_setup_required'
    | 'suspended'
    | 'no_membership';

export type ProfileMode = 'ready' | 'pending' | 'none';
export type MembershipMode = MembershipStatus | 'NONE';

export interface OrganizationSeedConfig {
    key: OrganizationKey;
    slug: string;
    name: string;
    tenantId: string;
    regionCode: string;
    dataResidency: DataResidencyZone;
    dataClassification: DataClassificationLevel;
    mfaRequired: boolean;
}

export interface PersonaSeedConfig {
    key: string;
    state: PersonaState;
    displayName: string;
    emailLocalPart: string;
    roleKey: OrgRoleKey;
    organizationKey?: OrganizationKey;
    hasPassword: boolean;
    profileMode: ProfileMode;
    membershipMode: MembershipMode;
    twoFactorEnabled: boolean;
    notes: string;
}

export interface SeedRuntimeConfig {
    seedSource: string;
    password: string;
    emailDomain: string;
    forcePasswordReset: boolean;
    outputDir: string;
    localCatalogPath: string;
    localGuidePath: string;
}

export interface SeededOrgRecord {
    key: OrganizationKey;
    id: string;
    slug: string;
    name: string;
    dataResidency: DataResidencyZone;
    dataClassification: DataClassificationLevel;
}

export interface OrganizationActor {
    userId: string;
    roleKey: 'globalAdmin' | 'owner';
}

export type OrganizationActorMap = Record<OrganizationKey, OrganizationActor>;

export interface PersonaCatalogRecord {
    key: string;
    state: PersonaState;
    email: string;
    password: string | null;
    displayName: string;
    roleKey: OrgRoleKey;
    organizationSlug: string | null;
    membershipMode: MembershipMode;
    profileMode: ProfileMode;
    twoFactorEnabled: boolean;
    notes: string;
    expectedResult: string;
}

export interface SeedCatalogFile {
    generatedAt: string;
    seedSource: string;
    personas: PersonaCatalogRecord[];
}
