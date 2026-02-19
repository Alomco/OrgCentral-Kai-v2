import type { Prisma, PrismaClient } from '@prisma/client';
import type { IBrandingRepository } from '@/server/repositories/contracts/org/branding/branding-repository-contract';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import { mapOrgBrandingRecordToDomain, mapOrgBrandingUpdateToRecord } from '@/server/repositories/mappers/org/branding/branding-mapper';
import type { OrgBranding } from '@/server/types/branding-types';
import { getModelDelegate } from '@/server/repositories/prisma/helpers/prisma-utils';

type OrganizationDelegate = PrismaClient['organization'];
type OrganizationUpdateData = Parameters<OrganizationDelegate['update']>[0]['data'];

function normalizeSettings(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }
    return value as Record<string, unknown>;
}

function normalizeBranding(value: unknown): OrgBranding {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }
    return value as OrgBranding;
}

export class PrismaBrandingRepository extends BasePrismaRepository implements IBrandingRepository {
    private delegate(): OrganizationDelegate {
        return getModelDelegate(this.prisma, 'organization');
    }

    async getBranding(orgId: string): Promise<OrgBranding | null> {
        const record = await this.delegate().findUnique({ where: { id: orgId }, select: { settings: true, updatedAt: true } });
        const settings = record ? normalizeSettings(record.settings) : {};
        const brandingData = normalizeBranding(settings.branding);
        return mapOrgBrandingRecordToDomain(
            record
                ? {
                    orgId,
                    branding: Object.keys(brandingData).length ? brandingData : null,
                    updatedAt: record.updatedAt,
                }
                : null,
        );
    }

    async updateBranding(orgId: string, updates: Partial<OrgBranding>): Promise<OrgBranding> {
        const existing = await this.delegate().findUnique({ where: { id: orgId }, select: { settings: true, updatedAt: true } });
        const currentSettings = normalizeSettings(existing?.settings);
        const currentBranding = normalizeBranding(currentSettings.branding);
        const nextBranding = { ...currentBranding, ...mapOrgBrandingUpdateToRecord(updates).branding };

        const data: OrganizationUpdateData = {
            settings: {
                ...currentSettings,
                branding: nextBranding,
            } as Prisma.InputJsonValue,
        };

        const record = await this.delegate().update({ where: { id: orgId }, data, select: { settings: true, updatedAt: true } });
        const savedSettings = normalizeSettings(record.settings);
        const savedBranding = normalizeBranding(savedSettings.branding);
        const mapped = mapOrgBrandingRecordToDomain({
            orgId,
            branding: Object.keys(savedBranding).length ? savedBranding : null,
            updatedAt: record.updatedAt,
        });
        if (!mapped) {
            throw new Error('Failed to map branding record');
        }
        return mapped;
    }

    async resetBranding(orgId: string): Promise<void> {
        const existing = await this.delegate().findUnique({ where: { id: orgId }, select: { settings: true } });
        const currentSettings = normalizeSettings(existing?.settings);
        const { branding: _removed, ...rest } = currentSettings;
        void _removed;

        const data: OrganizationUpdateData = { settings: rest as Prisma.InputJsonValue };
        await this.delegate().update({ where: { id: orgId }, data });
    }
}
