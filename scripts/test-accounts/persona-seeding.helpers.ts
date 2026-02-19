import { randomUUID } from 'node:crypto';
import { type PrismaClient } from '@prisma/client';
import type { PersonaSeedConfig, SeedRuntimeConfig, SeededOrgRecord } from './types';
import { hashCredentialPassword } from './password';
import { activatedAtByStatus, upsertEmployeeProfile } from './employee-profile-seeding';

export async function upsertAuthUser(
    prisma: PrismaClient,
    persona: PersonaSeedConfig,
    email: string,
): Promise<{ id: string; email: string; name: string; emailVerified: boolean }> {
    const existing = await prisma.authUser.findUnique({
        where: { email },
        select: { id: true },
    });

    const id = existing?.id ?? randomUUID();
    const user = await prisma.authUser.upsert({
        where: { id },
        update: {
            email,
            name: persona.displayName,
            emailVerified: true,
            twoFactorEnabled: persona.twoFactorEnabled,
            updatedAt: new Date(),
        },
        create: {
            id,
            email,
            name: persona.displayName,
            emailVerified: true,
            twoFactorEnabled: persona.twoFactorEnabled,
        },
    });

    return { id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified };
}

export async function syncCredentialAccount(
    prisma: PrismaClient,
    userId: string,
    config: SeedRuntimeConfig,
    hasPassword: boolean,
): Promise<void> {
    if (!hasPassword) {
        await prisma.authAccount.deleteMany({
            where: { userId, providerId: 'credential' },
        });
        return;
    }

    const hash = await hashCredentialPassword(config.password);
    const existing = await prisma.authAccount.findFirst({
        where: { userId, providerId: 'credential' },
        select: { id: true, password: true },
    });

    if (!existing) {
        await prisma.authAccount.create({
            data: {
                id: randomUUID(),
                userId,
                accountId: userId,
                providerId: 'credential',
                password: hash,
            },
        });
        return;
    }

    if (config.forcePasswordReset || !existing.password) {
        await prisma.authAccount.update({
            where: { id: existing.id },
            data: { password: hash, accountId: userId },
        });
    }
}

export async function syncMembershipState(
    prisma: PrismaClient,
    persona: PersonaSeedConfig,
    organization: SeededOrgRecord | null,
    userId: string,
    email: string,
    profileSequence: number,
): Promise<void> {
    if (!organization || persona.membershipMode === 'NONE') {
        await prisma.membership.deleteMany({ where: { userId } });
        await prisma.employeeProfile.deleteMany({ where: { userId } });
        await prisma.authOrgMember.deleteMany({ where: { userId } });
        return;
    }

    const role = await prisma.role.findUnique({
        where: { orgId_name: { orgId: organization.id, name: persona.roleKey } },
        select: { id: true },
    });
    if (!role) {
        throw new Error(`Role ${persona.roleKey} is missing for ${organization.slug}.`);
    }

    const status = persona.membershipMode;
    await prisma.membership.upsert({
        where: { orgId_userId: { orgId: organization.id, userId } },
        update: {
            roleId: role.id,
            status,
            activatedAt: activatedAtByStatus(status),
            updatedBy: userId,
            metadata: personaMetadata(persona),
        },
        create: {
            orgId: organization.id,
            userId,
            roleId: role.id,
            status,
            invitedBy: null,
            invitedAt: new Date(),
            activatedAt: activatedAtByStatus(status),
            createdBy: userId,
            metadata: personaMetadata(persona),
        },
    });

    if (persona.profileMode === 'none') {
        await prisma.employeeProfile.deleteMany({
            where: { orgId: organization.id, userId },
        });
    } else {
        const names = splitName(persona.displayName);
        const firstName = persona.profileMode === 'ready' ? names.firstName : null;
        const lastName = persona.profileMode === 'ready' ? names.lastName : null;
        await upsertEmployeeProfile({
            prisma,
            organizationId: organization.id,
            organizationKey: organization.key,
            userId,
            email,
            displayName: persona.displayName,
            firstName,
            lastName,
            profileSequence,
            metadata: personaMetadata(persona),
        });
    }

    await prisma.authOrganization.upsert({
        where: { id: organization.id },
        update: { slug: organization.slug, name: organization.name },
        create: {
            id: organization.id,
            slug: organization.slug,
            name: organization.name,
            metadata: JSON.stringify({ seedSource: 'scripts/seed-test-accounts' }),
        },
    });

    const existingAuthMember = await prisma.authOrgMember.findFirst({
        where: { organizationId: organization.id, userId },
        select: { id: true },
    });
    if (existingAuthMember) {
        await prisma.authOrgMember.update({
            where: { id: existingAuthMember.id },
            data: { role: persona.roleKey },
        });
    } else {
        await prisma.authOrgMember.create({
            data: {
                id: randomUUID(),
                organizationId: organization.id,
                userId,
                role: persona.roleKey,
            },
        });
    }
}

function personaMetadata(persona: PersonaSeedConfig) {
    return {
        seedSource: 'scripts/seed-test-accounts',
        persona: persona.key,
        state: persona.state,
    };
}

function splitName(displayName: string): { firstName: string; lastName: string } {
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] ?? 'Test';
    const lastName = parts.slice(1).join(' ') || 'User';
    return { firstName, lastName };
}
