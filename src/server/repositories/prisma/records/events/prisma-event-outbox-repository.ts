import { Prisma } from '@prisma/client';
import type { EventOutbox } from '@prisma/client';
import type { IEventOutboxRepository } from '@/server/repositories/contracts/records/event-outbox-repository-contract';
import { getModelDelegate, toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type { EventOutboxFilters, EventOutboxCreationData, EventOutboxUpdateData } from './prisma-event-outbox-repository.types';

export class PrismaEventOutboxRepository extends BasePrismaRepository implements IEventOutboxRepository {
  async findById(id: string): Promise<EventOutbox | null> {
    return this.prisma.eventOutbox.findUnique({
      where: { id },
    });
  }

  async findAll(filters?: EventOutboxFilters): Promise<EventOutbox[]> {
    const whereClause: Prisma.EventOutboxWhereInput = {};

    if (filters?.orgId) {
      whereClause.orgId = filters.orgId;
    }

    if (filters?.eventType) {
      whereClause.eventType = filters.eventType;
    }

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    const dateFrom = filters?.dateFrom;
    const dateTo = filters?.dateTo;
    if (dateFrom && dateTo) {
      whereClause.createdAt = { gte: dateFrom, lte: dateTo };
    } else if (dateFrom) {
      whereClause.createdAt = { gte: dateFrom };
    } else if (dateTo) {
      whereClause.createdAt = { lte: dateTo };
    }

    return getModelDelegate(this.prisma, 'eventOutbox').findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPendingEvents(limit = 100): Promise<EventOutbox[]> {
    return getModelDelegate(this.prisma, 'eventOutbox').findMany({
      where: {
        status: 'pending',
        availableAt: { lte: new Date() },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async findFailedEvents(limit = 100): Promise<EventOutbox[]> {
    return getModelDelegate(this.prisma, 'eventOutbox').findMany({
      where: {
        status: 'failed',
        retryCount: { lt: 3 }, // Less than max retries
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async create(data: EventOutboxCreationData): Promise<EventOutbox> {
    return getModelDelegate(this.prisma, 'eventOutbox').create({
      data: {
        ...data,
        status: data.status ?? 'pending',
        payload: toPrismaInputJson(data.payload) as Prisma.InputJsonValue,
      },
    });
  }

  async update(id: string, data: EventOutboxUpdateData): Promise<EventOutbox> {
    const updateData: Prisma.EventOutboxUpdateInput = {};
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.error !== undefined) {
      updateData.error = data.error === null ? Prisma.JsonNull : toPrismaInputJson(data.error);
    }
    if (data.processedAt !== undefined) {
      updateData.processedAt = data.processedAt;
    }
    if (data.maxRetries !== undefined) {
      updateData.maxRetries = data.maxRetries;
    }
    if (data.retryCount !== undefined) {
      updateData.retryCount = data.retryCount;
    }
    if (data.availableAt !== undefined) {
      updateData.availableAt = data.availableAt;
    }
    return getModelDelegate(this.prisma, 'eventOutbox').update({
      where: { id },
      data: updateData,
    });
  }

  async markAsProcessing(id: string): Promise<EventOutbox> {
    return getModelDelegate(this.prisma, 'eventOutbox').update({
      where: { id },
      data: {
        status: 'processing',
      },
    });
  }

  async markAsProcessed(id: string): Promise<EventOutbox> {
    return getModelDelegate(this.prisma, 'eventOutbox').update({
      where: { id },
      data: {
        status: 'processed',
        processedAt: new Date(),
      },
    });
  }

  async markAsFailed(id: string, error?: Prisma.InputJsonValue | null): Promise<EventOutbox> {
    const errorString = error ?? null;
    return getModelDelegate(this.prisma, 'eventOutbox').update({
      where: { id },
      data: {
        status: 'failed',
        error: errorString as unknown as Prisma.InputJsonValue | typeof Prisma.JsonNull,
        retryCount: {
          increment: 1
        }
      },
    });
  }

  async delete(id: string): Promise<EventOutbox> {
    return getModelDelegate(this.prisma, 'eventOutbox').delete({
      where: { id },
    });
  }

  async cleanupProcessedEvents(orgId: string, olderThan: Date): Promise<number> {
    const result = await getModelDelegate(this.prisma, 'eventOutbox').deleteMany({
      where: {
        orgId,
        status: 'processed',
        processedAt: { lt: olderThan }
      }
    });
    return result.count;
  }
}
