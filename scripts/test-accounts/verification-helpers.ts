import { MembershipStatus, type PrismaClient } from '@prisma/client';
import type { PersonaCatalogRecord } from './types';

export interface AuthUserSummary {
    id: string;
    twoFactorEnabled: boolean | null;
}

export interface MembershipSummary {
    status: MembershipStatus;
    role: { name: string } | null;
}

export type ProfileSummary = {
    firstName: string | null;
    lastName: string | null;
} | null;

export type AuthOrgMemberSummary = {
    role: string;
} | null;

export async function getAuthUser(
    prisma: PrismaClient,
    persona: PersonaCatalogRecord,
    failures: string[],
): Promise<AuthUserSummary | null> {
    const authUser = await prisma.authUser.findUnique({
        where: { email: persona.email },
        select: { id: true, twoFactorEnabled: true },
    });
    if (!authUser) {
        failures.push(`${persona.key}: authUser missing`);
        return null;
    }
    return authUser;
}

export async function getCredentialCount(prisma: PrismaClient, userId: string): Promise<number> {
    return prisma.authAccount.count({
        where: {
            userId,
            providerId: 'credential',
            password: { not: null },
        },
    });
}

export function validateCredentialState(
    persona: PersonaCatalogRecord,
    credentialCount: number,
    failures: string[],
): void {
    const expectedPassword = persona.password !== null;
    if (expectedPassword && credentialCount === 0) {
        failures.push(`${persona.key}: credential account missing`);
    }
    if (!expectedPassword && credentialCount > 0) {
        failures.push(`${persona.key}: expected no credential account`);
    }
}

export function validateTwoFactorState(
    persona: PersonaCatalogRecord,
    authUser: AuthUserSummary,
    failures: string[],
): void {
    if (Boolean(authUser.twoFactorEnabled) !== persona.twoFactorEnabled) {
        failures.push(`${persona.key}: twoFactorEnabled mismatch`);
    }
}

export async function validateNoOrganization(
    prisma: PrismaClient,
    persona: PersonaCatalogRecord,
    userId: string,
    failures: string[],
): Promise<void> {
    const membershipCount = await prisma.membership.count({ where: { userId } });
    if (membershipCount > 0) {
        failures.push(`${persona.key}: expected no memberships`);
    }
    if (persona.state !== 'no_membership') {
        failures.push(`${persona.key}: state mismatch (${persona.state} != no_membership)`);
    }
}

export async function getMembership(
    prisma: PrismaClient,
    orgId: string,
    userId: string,
): Promise<MembershipSummary | null> {
    return prisma.membership.findUnique({
        where: { orgId_userId: { orgId, userId } },
        select: { status: true, role: { select: { name: true } } },
    });
}

export function validateMembershipPresence(
    persona: PersonaCatalogRecord,
    membership: MembershipSummary | null,
    failures: string[],
): boolean {
    if (!membership && persona.membershipMode !== 'NONE') {
        failures.push(`${persona.key}: membership missing`);
        return false;
    }
    if (!membership && persona.membershipMode === 'NONE') {
        if (persona.state !== 'no_membership') {
            failures.push(`${persona.key}: state mismatch (${persona.state} != no_membership)`);
        }
        return false;
    }
    return true;
}

export function validateMembershipDetails(
    persona: PersonaCatalogRecord,
    membership: MembershipSummary,
    failures: string[],
): void {
    if (membership.status !== persona.membershipMode) {
        failures.push(`${persona.key}: membership status mismatch (${membership.status} != ${persona.membershipMode})`);
    }
    if ((membership.role?.name ?? null) !== persona.roleKey) {
        failures.push(`${persona.key}: membership role mismatch`);
    }
}

export async function getProfile(
    prisma: PrismaClient,
    orgId: string,
    userId: string,
): Promise<ProfileSummary> {
    return prisma.employeeProfile.findUnique({
        where: { orgId_userId: { orgId, userId } },
        select: { firstName: true, lastName: true },
    });
}

export function validateProfile(
    persona: PersonaCatalogRecord,
    profile: ProfileSummary,
    failures: string[],
): void {
    if (persona.profileMode === 'none' && profile) {
        failures.push(`${persona.key}: unexpected employee profile`);
    }
    if (persona.profileMode !== 'none' && !profile) {
        failures.push(`${persona.key}: employee profile missing`);
    }
    if (profile && persona.profileMode === 'ready' && (!profile.firstName || !profile.lastName)) {
        failures.push(`${persona.key}: profile should include firstName/lastName`);
    }
    if (profile && persona.profileMode === 'pending' && profile.firstName && profile.lastName) {
        failures.push(`${persona.key}: profile should remain incomplete`);
    }
}

export function requiresProfileSetup(persona: PersonaCatalogRecord, profile: ProfileSummary): boolean {
    if (persona.roleKey === 'globalAdmin') {
        return false;
    }
    if (!profile) {
        return true;
    }
    return !normalizeText(profile.firstName) || !normalizeText(profile.lastName);
}

export async function getAuthOrgMember(
    prisma: PrismaClient,
    orgId: string,
    userId: string,
): Promise<AuthOrgMemberSummary> {
    return prisma.authOrgMember.findFirst({
        where: { organizationId: orgId, userId },
        select: { role: true },
    });
}

export function validateAuthOrgMember(
    persona: PersonaCatalogRecord,
    authOrgMember: AuthOrgMemberSummary,
    failures: string[],
): void {
    if (persona.membershipMode === 'NONE') {
        return;
    }
    if (!authOrgMember) {
        failures.push(`${persona.key}: auth org bridge member missing`);
        return;
    }
    if (authOrgMember.role !== persona.roleKey) {
        failures.push(`${persona.key}: auth org bridge role mismatch`);
    }
}

export function deriveExpectedState(input: {
    membershipStatus: MembershipStatus;
    hasCredentialPassword: boolean;
    requiresProfileSetup: boolean;
    mfaRequired: boolean;
    twoFactorEnabled: boolean;
}): PersonaCatalogRecord['state'] {
    if (input.membershipStatus !== MembershipStatus.ACTIVE) {
        return 'suspended';
    }
    if (!input.hasCredentialPassword) {
        return 'password_setup_required';
    }
    if (input.requiresProfileSetup) {
        return 'profile_setup_required';
    }
    if (input.mfaRequired && !input.twoFactorEnabled) {
        return 'mfa_setup_required';
    }
    return 'ready';
}

export function normalizeText(value: string | null): string {
    return typeof value === 'string' ? value.trim() : '';
}

export function extractSecuritySettings(settings: unknown): { mfaRequired?: boolean } {
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
        return {};
    }
    const value = settings as { security?: unknown };
    if (!value.security || typeof value.security !== 'object' || Array.isArray(value.security)) {
        return {};
    }
    return value.security as { mfaRequired?: boolean };
}