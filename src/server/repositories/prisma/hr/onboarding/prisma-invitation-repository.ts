import { Prisma, type PrismaClient, type Invitation as PrismaInvitation } from '../../../../../generated/client';
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
import { coerceOnboardingData, onboardingDataSchema, toInvitationJson } from '@/server/invitations/onboarding-data';
import { hasOnboardingFingerprint, isJsonRecord } from '@/server/invitations/invitation-fingerprint';
import { getInvitationKind, INVITATION_KIND, withInvitationKind } from '@/server/invitations/invitation-kinds';
import type { JsonRecord, JsonValue } from '@/server/types/json';
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
    const onboardingData = onboardingDataSchema.parse(payload.onboardingData);
    const onboardingJson = toInvitationJson(onboardingData);
    const metadata = withInvitationKind(payload.metadata, INVITATION_KIND.HR_ONBOARDING);
    const record = await this.invitation.create({
      data: {
        token: `${payload.orgId}-${randomUUID()}`,
        orgId: payload.orgId,
        organizationName: payload.organizationName,
        targetEmail: payload.targetEmail,
        onboardingData: toJsonNullInput(
          onboardingJson as Prisma.InputJsonValue | Prisma.JsonValue | null | undefined,
        ),
        status: 'pending',
        invitedByUserId: payload.invitedByUserId ?? null,
        expiresAt: payload.expiresAt ?? null,
        metadata: toJsonNullInput(
          metadata as Prisma.InputJsonValue | Prisma.JsonValue | null | undefined,
        ),
        securityContext: toJsonNullInput(
          payload.securityContext as Prisma.InputJsonValue | Prisma.JsonValue | null | undefined,
        ),
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

    return records
      .filter((record) => isOnboardingInvitation(record))
      .map((record) => this.mapToDomain(record));
  }

  async getActiveInvitationByEmail(orgId: string, email: string): Promise<OnboardingInvitation | null> {
    const records = await this.invitation.findMany({
      where: {
        orgId,
        targetEmail: { equals: email, mode: 'insensitive' },
        status: 'pending',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const match = records.find((record) => isOnboardingInvitation(record));
    if (match) {
      registerOrgCacheTag(
        orgId,
        CACHE_SCOPE_ONBOARDING_INVITATIONS,
        PrismaOnboardingInvitationRepository.DEFAULT_CLASSIFICATION,
        PrismaOnboardingInvitationRepository.DEFAULT_RESIDENCY,
      );
    }

    return match ? this.mapToDomain(match) : null;
  }

  async getInvitationByToken(token: string): Promise<OnboardingInvitation | null> {
    const record = await this.invitation.findUnique({ where: { token } });
    if (record && isOnboardingInvitation(record)) {
      registerOrgCacheTag(
        record.orgId,
        CACHE_SCOPE_ONBOARDING_INVITATIONS,
        PrismaOnboardingInvitationRepository.DEFAULT_CLASSIFICATION,
        PrismaOnboardingInvitationRepository.DEFAULT_RESIDENCY,
      );
    }
    return record && isOnboardingInvitation(record) ? this.mapToDomain(record) : null;
  }

  async markAccepted(orgId: string, token: string, acceptedByUserId: string): Promise<void> {
    await this.assertOnboardingScope(orgId, token);
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
    const record = await this.assertOnboardingScope(orgId, token);
    const metadata = toJsonRecord(record.metadata) ?? {};
    const nextMetadata: JsonRecord = {
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
      onboardingData: coerceOnboardingData(record.onboardingData, record.targetEmail),
      metadata: toJsonRecord(record.metadata),
      securityContext: toJsonRecord(record.securityContext),
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

  private async assertOnboardingScope(orgId: string, token: string): Promise<PrismaInvitation> {
    const record = await this.invitation.findUnique({ where: { token } });
    if (record?.orgId !== orgId || !isOnboardingInvitation(record)) {
      throw new RepositoryAuthorizationError('Invitation not found for this organization.');
    }
    return record;
  }
}

function isOnboardingInvitation(record: PrismaInvitation): boolean {
  const metadata = toJsonRecord(record.metadata);
  const kind = getInvitationKind(metadata);
  if (kind) {
    return kind === INVITATION_KIND.HR_ONBOARDING;
  }
  return hasOnboardingFingerprint(record.onboardingData as JsonValue);
}

function toJsonRecord(value: Prisma.JsonValue | null | undefined): JsonRecord | undefined {
  return isJsonRecord(value as JsonValue | null | undefined) ? (value as JsonRecord) : undefined;
}

function toJsonNullInput(
  value: Parameters<typeof toPrismaInputJson>[0],
): Prisma.InputJsonValue | Prisma.JsonNullValueInput {
  const resolved = toPrismaInputJson(value);
  if (resolved === undefined || resolved === Prisma.DbNull) {
    return Prisma.JsonNull;
  }
  return resolved as Prisma.InputJsonValue | Prisma.JsonNullValueInput;
}
