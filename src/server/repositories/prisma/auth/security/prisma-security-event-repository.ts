import type { SecurityEvent as PrismaSecurityEvent } from '@prisma/client';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import { invalidateOrgCache, registerOrgCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_SECURITY_EVENTS } from '@/server/repositories/cache-scopes';
import type { ISecurityEventRepository } from '@/server/repositories/contracts/auth/security/security-event-repository-contract';
import type { SecurityEvent } from '@/server/types/hr-types';
import type {
  SecurityEventCreationData,
  SecurityEventFilters,
  SecurityEventUpdateData,
} from './security-event-repository.types';
import {
  mapToDomain,
  buildWhereClause,
  toCreationData,
  buildUpdatePayload,
  toSecurityEventJson,
  upsertResolutionNotes,
} from '@/server/repositories/mappers/auth/security/security-event-mapper';

export class PrismaSecurityEventRepository
  extends BasePrismaRepository
  implements ISecurityEventRepository {

  async findById(id: string): Promise<SecurityEvent | null> {
    const record = await this.prisma.securityEvent.findUnique({ where: { id } });
    return record ? mapToDomain(record) : null;
  }

  async findAll(filters?: SecurityEventFilters): Promise<SecurityEvent[]> {
    const records = await this.prisma.securityEvent.findMany({
      where: buildWhereClause(filters),
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => mapToDomain(record));
  }

  async create(data: SecurityEventCreationData): Promise<SecurityEvent> {
    const record = await this.prisma.securityEvent.create({
      data: { ...data, resolved: data.resolved ?? false },
    });

    await this.invalidateScope(record.orgId);
    return mapToDomain(record);
  }

  async update(id: string, data: SecurityEventUpdateData): Promise<SecurityEvent> {
    const record = await this.prisma.securityEvent.update({
      where: { id },
      data: data,
    });
    await this.invalidateScope(record.orgId);
    return mapToDomain(record);
  }

  async delete(id: string): Promise<SecurityEvent> {
    const record = await this.prisma.securityEvent.delete({ where: { id } });
    await this.invalidateScope(record.orgId);
    return mapToDomain(record);
  }

  async markAsResolved(id: string, resolvedBy: string, resolutionNotes?: string): Promise<SecurityEvent> {
    const record = await this.getRecordOrThrow(id);
    return this.applyResolution(record, resolvedBy, resolutionNotes);
  }

  async getSecurityEventsCount(orgId: string, daysBack = 7): Promise<number> {
    registerOrgCacheTag(orgId, CACHE_SCOPE_SECURITY_EVENTS);
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysBack);

    return this.prisma.securityEvent.count({
      where: {
        orgId,
        createdAt: { gte: dateThreshold },
      },
    });
  }

  async createSecurityEvent(
    tenantId: string,
    event: Omit<SecurityEvent, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<void> {
    await this.create(toCreationData(tenantId, event));
  }

  async updateSecurityEvent(
    tenantId: string,
    eventId: string,
    updates: Partial<Omit<SecurityEvent, 'id' | 'orgId' | 'userId' | 'createdAt' | 'occurredAt'>>,
  ): Promise<void> {
    await this.ensureOrgRecord(tenantId, eventId);
    const payload = buildUpdatePayload(updates);

    if (Object.keys(payload).length === 0) {
      return;
    }

    await this.update(eventId, payload);
  }

  async getSecurityEvent(tenantId: string, eventId: string): Promise<SecurityEvent | null> {
    registerOrgCacheTag(tenantId, CACHE_SCOPE_SECURITY_EVENTS);
    const record = await this.findById(eventId);
    return record?.orgId === tenantId ? record : null;
  }

  async getSecurityEventsByUser(
    tenantId: string,
    userId: string,
    filters?: { eventType?: string; severity?: string; startDate?: Date; endDate?: Date },
  ): Promise<SecurityEvent[]> {
    registerOrgCacheTag(tenantId, CACHE_SCOPE_SECURITY_EVENTS);
    return this.findAll({
      orgId: tenantId,
      userId,
      eventType: filters?.eventType,
      severity: filters?.severity,
      dateFrom: filters?.startDate,
      dateTo: filters?.endDate,
    });
  }

  async getSecurityEventsByOrganization(
    tenantId: string,
    filters?: { eventType?: string; severity?: string; userId?: string; startDate?: Date; endDate?: Date },
  ): Promise<SecurityEvent[]> {
    registerOrgCacheTag(tenantId, CACHE_SCOPE_SECURITY_EVENTS);
    return this.findAll({
      orgId: tenantId,
      userId: filters?.userId,
      eventType: filters?.eventType,
      severity: filters?.severity,
      dateFrom: filters?.startDate,
      dateTo: filters?.endDate,
    });
  }

  async resolveSecurityEvent(
    tenantId: string,
    eventId: string,
    resolverId: string,
    resolutionNotes?: string,
  ): Promise<void> {
    const existing = await this.ensureOrgRecord(tenantId, eventId);
    await this.applyResolution(existing, resolverId, resolutionNotes);
  }

  private async ensureOrgRecord(tenantId: string, eventId: string): Promise<PrismaSecurityEvent> {
    const record = await this.getRecordOrThrow(eventId);
    if (record.orgId !== tenantId) {
      throw new Error('Security event not found');
    }

    return record;
  }

  private async getRecordOrThrow(id: string): Promise<PrismaSecurityEvent> {
    const record = await this.prisma.securityEvent.findUnique({ where: { id } });
    if (!record) {
      throw new Error('Security event not found');
    }

    return record;
  }

  private async applyResolution(
    record: PrismaSecurityEvent,
    resolvedBy: string,
    resolutionNotes?: string,
  ): Promise<SecurityEvent> {
    const updated = await this.prisma.securityEvent.update({
      where: { id: record.id },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy,
        additionalInfo: resolutionNotes
          ? upsertResolutionNotes(record.additionalInfo, resolutionNotes)
          : toSecurityEventJson(record.additionalInfo),
      },
    });

    await this.invalidateScope(updated.orgId);
    return mapToDomain(updated);
  }

  private async invalidateScope(orgId?: string | null): Promise<void> {
    if (orgId) {
      await invalidateOrgCache(orgId, CACHE_SCOPE_SECURITY_EVENTS);
    }
  }
}
