import type { IOrganizationRepository } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import type { OrganizationData } from '@/server/types/leave-types';
import { OrgScopedPrismaRepository } from '@/server/repositories/prisma/org/org-scoped-prisma-repository';

const ORGANIZATION_NOT_FOUND_MESSAGE = 'Organization not found';

export class PrismaOrganizationRepository
    extends OrgScopedPrismaRepository
    implements IOrganizationRepository {

    async getOrganization(orgId: string): Promise<OrganizationData | null> {
        const organization = await this.prisma.organization.findUnique({ where: { id: orgId } });
        if (!organization) {
            return null;
        }

        const settings = (organization.settings as Record<string, unknown> | null) ?? {};
        const leaveSettings = (settings.leave as Record<string, unknown> | undefined) ?? {};
        const entitlements = leaveSettings.entitlements as Record<string, number> | undefined;
        const primaryLeaveType = leaveSettings.primaryLeaveType as string | undefined;
        const leaveYearStartDate = leaveSettings.leaveYearStartDate as string | undefined;
        const leaveRoundingRule = leaveSettings.leaveRoundingRule as OrganizationData['leaveRoundingRule'] | undefined;

        const governance = (organization.governanceTags as Record<string, unknown> | null) ?? {};
        const auditSettings = (governance.audit as Record<string, unknown> | undefined) ?? {};

        return {
            id: organization.id,
            dataResidency: organization.dataResidency,
            dataClassification: organization.dataClassification,
            auditSource: (auditSettings.source as string | undefined) ?? 'org-repository',
            auditBatchId: auditSettings.batchId as string | undefined,
            name: organization.name,
            leaveEntitlements: entitlements ?? {},
            primaryLeaveType: primaryLeaveType ?? 'annual',
            leaveYearStartDate: leaveYearStartDate ?? '01-01',
            leaveRoundingRule: leaveRoundingRule ?? 'full_day',
            createdAt: organization.createdAt.toISOString(),
            updatedAt: organization.updatedAt.toISOString(),
        } as OrganizationData;
    }

    async getLeaveEntitlements(orgId: string): Promise<Record<string, number>> {
        const organization = await this.prisma.organization.findUnique({ where: { id: orgId } });
        if (!organization) {
            return {};
        }

        const settings = (organization.settings as Record<string, unknown> | null) ?? {};
        const leaveSettings = (settings.leave as Record<string, unknown> | undefined) ?? {};
        const entitlements = leaveSettings.entitlements as Record<string, number> | undefined;

        return entitlements ?? {};
    }

    async updateLeaveSettings(
        orgId: string,
        settings: {
            leaveEntitlements: Record<string, number>;
            primaryLeaveType: string;
            leaveYearStartDate: string;
            leaveRoundingRule: string;
        },
    ): Promise<void> {
        const organization = await this.prisma.organization.findUnique({ where: { id: orgId } });
        if (!organization) {
            throw new Error(ORGANIZATION_NOT_FOUND_MESSAGE);
        }

        const currentSettings = (organization.settings as Record<string, unknown> | null) ?? {};

        await this.prisma.organization.update({
            where: { id: orgId },
            data: {
                settings: {
                    ...currentSettings,
                    leave: {
                        ...(currentSettings.leave as Record<string, unknown> | undefined),
                        entitlements: settings.leaveEntitlements,
                        primaryLeaveType: settings.primaryLeaveType,
                        leaveYearStartDate: settings.leaveYearStartDate,
                        leaveRoundingRule: settings.leaveRoundingRule,
                    },
                },
            },
        });
    }

    async addCustomLeaveType(orgId: string, leaveType: string): Promise<void> {
        const organization = await this.prisma.organization.findUnique({ where: { id: orgId } });
        if (!organization) {
            throw new Error(ORGANIZATION_NOT_FOUND_MESSAGE);
        }

        const settings = (organization.settings as Record<string, unknown> | null) ?? {};
        const leaveSettings = ((settings.leave as Record<string, unknown> | undefined) ?? {}) as {
            customTypes?: string[];
        };

        const customTypes = new Set(leaveSettings.customTypes ?? []);
        customTypes.add(leaveType);

        await this.prisma.organization.update({
            where: { id: orgId },
            data: {
                settings: {
                    ...settings,
                    leave: {
                        ...leaveSettings,
                        customTypes: Array.from(customTypes),
                    },
                },
            },
        });
    }

    async removeLeaveType(orgId: string, leaveTypeKey: string): Promise<void> {
        const organization = await this.prisma.organization.findUnique({ where: { id: orgId } });
        if (!organization) {
            throw new Error('Organization not found');
        }

        const settings = (organization.settings as Record<string, unknown> | null) ?? {};
        const leaveSettings = ((settings.leave as Record<string, unknown> | undefined) ?? {}) as {
            customTypes?: string[];
            entitlements?: Record<string, number>;
        };

        const customTypes = new Set(leaveSettings.customTypes ?? []);
        customTypes.delete(leaveTypeKey);

        const entitlements = { ...(leaveSettings.entitlements ?? {}) };
        const { [leaveTypeKey]: removed, ...remainingEntitlements } = entitlements;
        void removed;

        await this.prisma.organization.update({
            where: { id: orgId },
            data: {
                settings: {
                    ...settings,
                    leave: {
                        ...leaveSettings,
                        customTypes: Array.from(customTypes),
                        entitlements: remainingEntitlements,
                    },
                },
            },
        });
    }
}
