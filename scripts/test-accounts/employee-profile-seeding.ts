import { randomUUID } from 'node:crypto';
import { MembershipStatus, type PrismaClient } from '../../src/generated/client';
import type { SeededOrgRecord } from './types';

interface UpsertEmployeeProfileInput {
    prisma: PrismaClient;
    organizationId: string;
    organizationKey: SeededOrgRecord['key'];
    userId: string;
    email: string;
    displayName: string;
    firstName: string | null;
    lastName: string | null;
    profileSequence: number;
    metadata: {
        seedSource: string;
        persona: string;
        state: string;
    };
}

export async function upsertEmployeeProfile(input: UpsertEmployeeProfileInput): Promise<void> {
    const existing = await input.prisma.employeeProfile.findUnique({
        where: { orgId_userId: { orgId: input.organizationId, userId: input.userId } },
        select: { id: true },
    });

    if (existing) {
        await input.prisma.employeeProfile.update({
            where: { id: existing.id },
            data: {
                firstName: input.firstName,
                lastName: input.lastName,
                displayName: input.displayName,
                email: input.email,
                metadata: input.metadata,
            },
        });
        return;
    }

    const employeeNumber = await reserveEmployeeNumber(input);
    await input.prisma.employeeProfile.create({
        data: {
            orgId: input.organizationId,
            userId: input.userId,
            employeeNumber,
            firstName: input.firstName,
            lastName: input.lastName,
            displayName: input.displayName,
            email: input.email,
            metadata: input.metadata,
        },
    });
}

export function activatedAtByStatus(status: MembershipStatus): Date | null {
    return status === MembershipStatus.ACTIVE ? new Date() : null;
}

async function reserveEmployeeNumber(input: UpsertEmployeeProfileInput): Promise<string> {
    const prefix = input.organizationKey.toUpperCase();
    const primary = `${prefix}-${String(input.profileSequence).padStart(4, '0')}`;
    const fallback = `${prefix}-${input.userId.replaceAll('-', '').slice(0, 8).toUpperCase()}`;
    const emergency = `${prefix}-${randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`;
    const candidates = [primary, fallback, emergency];

    const existing = await input.prisma.employeeProfile.findMany({
        where: {
            orgId: input.organizationId,
            employeeNumber: { in: candidates },
        },
        select: { employeeNumber: true },
    });
    const blocked = new Set(existing.map((record) => record.employeeNumber));

    const available = candidates.find((candidate) => !blocked.has(candidate));
    if (!available) {
        throw new Error(`Unable to reserve employee number for ${input.userId}`);
    }
    return available;
}
