'use server';

import { faker } from '@faker-js/faker';
import type { Prisma } from '@prisma/client';
import {
    MembershipStatus,
    EmploymentStatus,
    EmploymentType,
    LeaveRequestStatus,
    LeavePolicyType,
    LeaveAccrualFrequency,
} from '@prisma/client';
import { prisma } from '@/server/lib/prisma';
import { revalidatePath } from 'next/cache';
import { DEFAULT_BOOTSTRAP_POLICIES } from '@/server/security/abac-constants';

const SEEDED_METADATA_KEY = 'devSeeded';

interface SeedResult {
    success: boolean;
    message: string;
    count?: number;
}

async function getDefaultOrg() {
    const org = await prisma.organization.findFirst({
        where: { slug: 'orgcentral-platform' },
    });
    if (!org) {
        throw new Error('Platform organization not found. Run admin bootstrap first.');
    }
    return org;
}

async function getDefaultRole(orgId: string) {
    const role = await prisma.role.findFirst({
        where: { orgId, name: 'employee' },
    });

    if (!role) {
        // Create a basic employee role if it doesn't exist
        return prisma.role.create({
            data: {
                orgId,
                name: 'employee',
                description: 'Standard employee role',
                scope: 'ORG',
                permissions: {
                    employeeProfile: ['read'],
                    organization: ['read'],
                } as Prisma.InputJsonValue,
            },
        });
    }
    return role;
}

async function ensureLeavePolicy(orgId: string) {
    // Check if a default leave policy exists
    const existing = await prisma.leavePolicy.findFirst({
        where: { orgId, name: 'Annual Leave (Default)' },
    });

    if (existing) {
        return existing;
    }

    // Create a default annual leave policy
    return prisma.leavePolicy.create({
        data: {
            orgId,
            name: 'Annual Leave (Default)',
            policyType: LeavePolicyType.ANNUAL,
            accrualFrequency: LeaveAccrualFrequency.YEARLY,
            accrualAmount: 28, // UK statutory minimum
            carryOverLimit: 5,
            requiresApproval: true,
            isDefault: true,
            statutoryCompliance: true,
            metadata: {
                [SEEDED_METADATA_KEY]: true,
            } as Prisma.InputJsonValue,
        },
    });
}

export async function seedFakeEmployees(count = 5): Promise<SeedResult> {
    try {
        const org = await getDefaultOrg();
        const role = await getDefaultRole(org.id);
        const timestamp = new Date();
        let created = 0;

        for (let index = 0; index < count; index++) {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const email = faker.internet.email({ firstName, lastName }).toLowerCase();

            // Create user
            const user = await prisma.user.create({
                data: {
                    email,
                    displayName: `${firstName} ${lastName}`,
                    status: MembershipStatus.ACTIVE,
                },
            });

            // Create membership
            await prisma.membership.create({
                data: {
                    orgId: org.id,
                    userId: user.id,
                    roleId: role.id,
                    status: MembershipStatus.ACTIVE,
                    invitedAt: timestamp,
                    activatedAt: timestamp,
                    metadata: {
                        [SEEDED_METADATA_KEY]: true,
                        seededAt: timestamp.toISOString(),
                    } as Prisma.InputJsonValue,
                    createdBy: user.id,
                },
            });

            // Create employee profile
            await prisma.employeeProfile.create({
                data: {
                    orgId: org.id,
                    userId: user.id,
                    employeeNumber: `EMP${Date.now().toString(36).toUpperCase()}${String(index)}`,
                    firstName,
                    lastName,
                    displayName: `${firstName} ${lastName}`,
                    email,
                    jobTitle: faker.person.jobTitle(),
                    employmentStatus: EmploymentStatus.ACTIVE,
                    employmentType: faker.helpers.arrayElement([
                        EmploymentType.FULL_TIME,
                        EmploymentType.PART_TIME,
                        EmploymentType.CONTRACTOR,
                    ]),
                    startDate: faker.date.past({ years: 3 }),
                    metadata: {
                        [SEEDED_METADATA_KEY]: true,
                    } as Prisma.InputJsonValue,
                },
            });

            created++;
        }

        revalidatePath('/dev/dashboard');
        revalidatePath('/hr/employees');
        return { success: true, message: `Created ${String(created)} fake employees`, count: created };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, message };
    }
}

export async function seedFakeLeaveRequests(count = 10): Promise<SeedResult> {
    try {
        const org = await getDefaultOrg();
        const policy = await ensureLeavePolicy(org.id);

        // Get memberships to assign leave requests (LeaveRequest uses orgId + userId, not employeeId)
        const memberships = await prisma.membership.findMany({
            where: {
                orgId: org.id,
                status: MembershipStatus.ACTIVE,
            },
            take: 20,
        });

        if (memberships.length === 0) {
            return { success: false, message: 'No members found. Seed employees first.' };
        }

        let created = 0;
        for (let index = 0; index < count; index++) {
            const membership = faker.helpers.arrayElement(memberships);
            const startDate = faker.date.soon({ days: 30 });
            const endDate = faker.date.soon({ days: 7, refDate: startDate });
            const hours = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) * 8;

            await prisma.leaveRequest.create({
                data: {
                    orgId: org.id,
                    userId: membership.userId,
                    policyId: policy.id,
                    status: faker.helpers.arrayElement([
                        LeaveRequestStatus.DRAFT,
                        LeaveRequestStatus.SUBMITTED,
                        LeaveRequestStatus.APPROVED,
                        LeaveRequestStatus.REJECTED,
                        LeaveRequestStatus.PENDING_APPROVAL,
                    ]),
                    startDate,
                    endDate,
                    hours,
                    reason: faker.lorem.sentence(),
                    metadata: {
                        [SEEDED_METADATA_KEY]: true,
                    } as Prisma.InputJsonValue,
                },
            });
            created++;
        }

        revalidatePath('/dev/dashboard');
        revalidatePath('/hr/leave');
        return { success: true, message: `Created ${String(created)} fake leave requests`, count: created };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, message };
    }
}

export async function seedFakeDepartments(count = 5): Promise<SeedResult> {
    try {
        const org = await getDefaultOrg();
        const departments = [
            'Engineering',
            'Human Resources',
            'Finance',
            'Marketing',
            'Operations',
            'Sales',
            'Legal',
            'Customer Support',
        ];

        let created = 0;
        const toCreate = departments.slice(0, count);

        for (const name of toCreate) {
            await prisma.department.upsert({
                where: {
                    orgId_name: { orgId: org.id, name }
                },
                update: {},
                create: {
                    orgId: org.id,
                    name,
                },
            });
            created++;
        }

        revalidatePath('/dev/dashboard');
        return { success: true, message: `Created ${String(created)} departments`, count: created };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, message };
    }
}

export async function clearSeededData(): Promise<SeedResult> {
    try {
        const org = await getDefaultOrg();

        // Delete seeded leave requests
        const deletedLeave = await prisma.leaveRequest.deleteMany({
            where: {
                orgId: org.id,
                metadata: { path: [SEEDED_METADATA_KEY], equals: true },
            },
        });

        // Delete seeded leave policies
        const deletedPolicies = await prisma.leavePolicy.deleteMany({
            where: {
                orgId: org.id,
                metadata: { path: [SEEDED_METADATA_KEY], equals: true },
            },
        });

        // Delete seeded employee profiles
        const deletedProfiles = await prisma.employeeProfile.deleteMany({
            where: {
                orgId: org.id,
                metadata: { path: [SEEDED_METADATA_KEY], equals: true },
            },
        });

        // Delete seeded memberships
        const deletedMemberships = await prisma.membership.deleteMany({
            where: {
                orgId: org.id,
                metadata: { path: [SEEDED_METADATA_KEY], equals: true },
            },
        });

        revalidatePath('/dev/dashboard');
        revalidatePath('/hr/employees');
        revalidatePath('/hr/leave');

        const total = deletedLeave.count + deletedProfiles.count + deletedMemberships.count + deletedPolicies.count;
        return {
            success: true,
            message: `Cleared: ${String(deletedProfiles.count)} employees, ${String(deletedLeave.count)} leave, ${String(deletedPolicies.count)} policies`,
            count: total,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, message };
    }
}

export async function getSeededDataStats(): Promise<{
    employees: number;
    leaveRequests: number;
    departments: number;
}> {
    try {
        const org = await getDefaultOrg();

        const [employees, leaveRequests, departments] = await Promise.all([
            prisma.employeeProfile.count({
                where: {
                    orgId: org.id,
                    metadata: { path: [SEEDED_METADATA_KEY], equals: true },
                },
            }),
            prisma.leaveRequest.count({
                where: {
                    orgId: org.id,
                    metadata: { path: [SEEDED_METADATA_KEY], equals: true },
                },
            }),
            prisma.department.count({
                where: {
                    orgId: org.id,
                },
            }),
        ]);

        return { employees, leaveRequests, departments };
    } catch {
        return { employees: 0, leaveRequests: 0, departments: 0 };
    }
}

export async function seedAbacPolicies(): Promise<SeedResult> {
    try {
        const org = await getDefaultOrg();

        // Get current settings
        const currentSettings = org.settings as Record<string, unknown> | null;
        const updatedSettings = {
            ...(currentSettings ?? {}),
            abacPolicies: DEFAULT_BOOTSTRAP_POLICIES,
        };

        // Update organization with ABAC policies
        await prisma.organization.update({
            where: { id: org.id },
            data: {
                settings: updatedSettings as Prisma.InputJsonValue,
            },
        });

        revalidatePath('/dev');
        revalidatePath('/hr');
        return {
            success: true,
            message: `Seeded ${String(DEFAULT_BOOTSTRAP_POLICIES.length)} ABAC policies to org settings`,
            count: DEFAULT_BOOTSTRAP_POLICIES.length,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, message };
    }
}

export async function getAbacPolicyStatus(): Promise<{
    hasAbacPolicies: boolean;
    policyCount: number;
}> {
    try {
        const org = await getDefaultOrg();
        const settings = org.settings as Record<string, unknown> | null;
        const abacPolicies = settings?.abacPolicies;
        const policyArray = Array.isArray(abacPolicies) ? abacPolicies : [];
        return { hasAbacPolicies: policyArray.length > 0, policyCount: policyArray.length };
    } catch {
        return { hasAbacPolicies: false, policyCount: 0 };
    }
}
