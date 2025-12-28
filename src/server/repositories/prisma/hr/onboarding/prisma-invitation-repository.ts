import { Prisma, type PrismaClient, type Invitation as PrismaInvitation } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { BasePrismaRepository, type BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type {
  IOnboardingInvitationRepository,
  OnboardingInvitation,
  OnboardingInvitationCreateInput,
} from '@/server/repositories/contracts/hr/onboarding/invitation-repository-contract';
import { CACHE_SCOPE_ONBOARDING_INVITATIONS } from '@/server/repositories/cache-scopes';
import { RepositoryAuthorizationError } from '@/server/repositories/security';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

type InvitationDelegate = PrismaClient['invitation'];

export class PrismaOnboardingInvitationRepository
  extends BasePrismaRepository
  implements IOnboardingInvitationRepository {
  private static readonly DEFAULT_CLASSIFICATION: DataClassificationLevel = 'OFFICIAL';
  private static readonly DEFAULT_RESIDENCY: DataResidencyZone = 'UK_ONLY';
  private readonly invitation: InvitationDelegate;

  constructor(options: BasePrismaRepositoryOptions = {}) {
    super(options);
    this.invitation = this.prisma.invitation;
  }

  async createInvitation(payload: OnboardingInvitationCreateInput): Promise<OnboardingInvitation> {
    const record = await this.invitation.create({
      data: {
        token: `${payload.orgId}-${randomUUID()}`,
        orgId: payload.orgId,
        organizationName: payload.organizationName,
        targetEmail: payload.targetEmail,
        onboardingData: toPrismaInputJson(
          payload.onboardingData as Prisma.InputJsonValue | Prisma.JsonValue | null | undefined,
        ) ?? Prisma.JsonNull,
        status: 'pending',
        invitedByUserId: payload.invitedByUserId ?? null,
        expiresAt: payload.expiresAt ?? null,
        metadata: toPrismaInputJson(
          payload.metadata as Prisma.InputJsonValue | Prisma.JsonValue | null | undefined,
        ) ?? Prisma.JsonNull,
        securityContext: toPrismaInputJson(
          payload.securityContext as Prisma.InputJsonValue | Prisma.JsonValue | null | undefined,
        ) ?? Prisma.JsonNull,
        ipAddress: payload.ipAddress ?? null,
        userAgent: payload.userAgent ?? null,
      },
    });

    await this.invalidateAfterWrite(payload.orgId, [CACHE_SCOPE_ONBOARDING_INVITATIONS]);
    return this.mapToDomain(record);
  }

  async listInvitationsByOrg(
    orgId: string,
    options?: { status?: OnboardingInvitation['status']; limit?: number },
  ): Promise<OnboardingInvitation[]> {
    const limit = options?.limit ?? 25;
    const records = await this.invitation.findMany({
      where: {
        orgId,
        status: options?.status,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return records.map((record) => this.mapToDomain(record));
  }

  async getActiveInvitationByEmail(orgId: string, email: string): Promise<OnboardingInvitation | null> {
    const record = await this.invitation.findFirst({
      where: {
        orgId,
        targetEmail: { equals: email, mode: 'insensitive' },
        status: 'pending',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (record) {
      registerOrgCacheTag(
        orgId,
        CACHE_SCOPE_ONBOARDING_INVITATIONS,
        PrismaOnboardingInvitationRepository.DEFAULT_CLASSIFICATION,
        PrismaOnboardingInvitationRepository.DEFAULT_RESIDENCY,
      );
    }

    return record ? this.mapToDomain(record) : null;
  }

  async getInvitationByToken(token: string): Promise<OnboardingInvitation | null> {
    const record = await this.invitation.findUnique({ where: { token } });
    if (record) {
      registerOrgCacheTag(
        record.orgId,
        CACHE_SCOPE_ONBOARDING_INVITATIONS,
        PrismaOnboardingInvitationRepository.DEFAULT_CLASSIFICATION,
        PrismaOnboardingInvitationRepository.DEFAULT_RESIDENCY,
      );
    }
    return record ? this.mapToDomain(record) : null;
  }

  async markAccepted(orgId: string, token: string, acceptedByUserId: string): Promise<void> {
    await this.assertOrgScope(orgId, token);
    await this.invitation.update({
      where: { token },
      data: {
        status: 'accepted',
        acceptedByUserId,
        acceptedAt: new Date(),
      },
    });
    await this.invalidateAfterWrite(orgId, [CACHE_SCOPE_ONBOARDING_INVITATIONS]);
  }

  async revokeInvitation(orgId: string, token: string, revokedByUserId: string, reason?: string): Promise<void> {
    const record = await this.assertOrgScope(orgId, token);
    const metadata = (record.metadata ?? {}) as Record<string, unknown>;
    const nextMetadata = {
      ...metadata,
      revocationReason: reason ?? metadata.revocationReason,
    };

    await this.invitation.update({
      where: { token },
      data: {
        status: 'revoked',
        revokedByUserId,
        revokedAt: new Date(),
        metadata: toPrismaInputJson(
          nextMetadata as Record<string, Prisma.InputJsonValue> | Prisma.InputJsonValue,
        ) ?? Prisma.JsonNull,
      },
    });
    await this.invalidateAfterWrite(orgId, [CACHE_SCOPE_ONBOARDING_INVITATIONS]);
  }

  private mapToDomain(record: PrismaInvitation): OnboardingInvitation {
    return {
      token: record.token,
      orgId: record.orgId,
      organizationName: record.organizationName,
      targetEmail: record.targetEmail,
      status: record.status as OnboardingInvitation['status'],
      invitedByUserId: record.invitedByUserId,
      onboardingData: record.onboardingData,
      metadata: record.metadata ?? undefined,
      securityContext: record.securityContext ?? undefined,
      ipAddress: record.ipAddress ?? undefined,
      userAgent: record.userAgent ?? undefined,
      expiresAt: record.expiresAt ?? undefined,
      acceptedAt: record.acceptedAt ?? undefined,
      acceptedByUserId: record.acceptedByUserId ?? undefined,
      revokedAt: record.revokedAt ?? undefined,
      revokedByUserId: record.revokedByUserId ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private async assertOrgScope(orgId: string, token: string): Promise<PrismaInvitation> {
    const record = await this.invitation.findUnique({ where: { token } });
    if (record?.orgId !== orgId) {
      throw new RepositoryAuthorizationError('Invitation not found for this organization.');
    }
    return record;
  }
}
