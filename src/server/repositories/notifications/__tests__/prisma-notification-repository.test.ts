import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    NotificationTopic,
    NotificationPriority,
    type PrismaClient,
    type NotificationMessage,
} from '@prisma/client';
import type { NotificationAuditWriter } from '@/server/repositories/contracts/notifications';
import { PrismaNotificationRepository } from '@/server/repositories/prisma/notifications/prisma-notification-repository';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { RepositoryAuthorizationError } from '@/server/repositories/security';

const invalidateNotificationCache = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const registerNotificationCache = vi.hoisted(() => vi.fn());

vi.mock('@/server/repositories/notifications/notification-cache', () => ({
    invalidateNotificationCache,
    registerNotificationCache,
    NOTIFICATION_CACHE_SCOPE: 'notifications',
}));

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';

const baseRecord: NotificationMessage = {
    id: '33333333-3333-4333-8333-333333333333',
    orgId: ORG_ID,
    userId: USER_ID,
    title: 'Title',
    body: 'Body',
    topic: NotificationTopic.OTHER,
    priority: NotificationPriority.MEDIUM,
    isRead: false,
    readAt: null,
    actionUrl: null,
    actionLabel: null,
    scheduledFor: null,
    expiresAt: null,
    retentionPolicyId: 'retain-1',
    dataClassification: 'OFFICIAL',
    residencyTag: 'UK_ONLY',
    schemaVersion: 1,
    correlationId: 'corr-1',
    createdByUserId: USER_ID,
    auditSource: 'tests',
    metadata: null,
    auditTrail: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
};

const authorization: RepositoryAuthorizationContext = {
    orgId: ORG_ID,
    userId: USER_ID,
    roleKey: 'custom',
    permissions: {},
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    auditSource: 'tests',
    correlationId: 'corr-1',
    tenantScope: {
        orgId: ORG_ID,
        dataResidency: 'UK_ONLY',
        dataClassification: 'OFFICIAL',
        auditSource: 'tests',
    },
};

function createRepository(auditWriter?: NotificationAuditWriter) {
    const model = {
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
    };

    const prisma = { notificationMessage: model } as unknown as PrismaClient;
    const repo = new PrismaNotificationRepository({ prisma, auditWriter });

    return { repo, model };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('PrismaNotificationRepository', () => {
    it('creates notification and writes audit envelope', async () => {
        const auditWriter: NotificationAuditWriter = { write: vi.fn().mockResolvedValue(undefined) };
        const { repo, model } = createRepository(auditWriter);
        model.create.mockResolvedValue({ ...baseRecord });

        const result = await repo.createNotification(authorization, {
            orgId: ORG_ID,
            userId: USER_ID,
            title: 'Title',
            body: 'Body',
            topic: 'other',
            priority: 'medium',
            retentionPolicyId: 'retain-1',
            dataClassification: 'OFFICIAL',
            residencyTag: 'UK_ONLY',
            auditSource: 'tests',
            schemaVersion: 1,
            isRead: false,
        });

        const record = await result.match(
            (value) => value,
            (error) => {
                throw error;
            },
        );

        expect(model.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    retentionPolicyId: 'retain-1',
                    auditSource: authorization.auditSource,
                }),
            }),
        );
        expect(record.id).toBe(baseRecord.id);
        expect(invalidateNotificationCache).toHaveBeenCalledWith(
            expect.objectContaining({ orgId: ORG_ID, classification: 'OFFICIAL' }),
        );
        expect(auditWriter.write).toHaveBeenCalled();
    });

    it('rejects cross-tenant creation attempts', async () => {
        const { repo } = createRepository();
        const attempt = repo.createNotification(authorization, {
            orgId: 'other-org',
            userId: USER_ID,
            title: 'Title',
            body: 'Body',
            topic: 'other',
            priority: 'medium',
            retentionPolicyId: 'retain-1',
            dataClassification: 'OFFICIAL',
            residencyTag: 'UK_ONLY',
            auditSource: 'tests',
            schemaVersion: 1,
            isRead: false,
        });

        await expect(
            attempt.match(
                () => Promise.reject(new Error('expected failure')),
                (error) => Promise.reject(error),
            ),
        ).rejects.toBeInstanceOf(RepositoryAuthorizationError);
    });

    it('marks all notifications as read and invalidates cache with derived context', async () => {
        const { repo, model } = createRepository();
        model.updateMany.mockResolvedValue({ count: 2 });
        model.findFirst.mockResolvedValue({
            dataClassification: 'OFFICIAL_SENSITIVE',
            residencyTag: 'GLOBAL_RESTRICTED',
        });

        const result = await repo.markAllRead(authorization, USER_ID);
        const count = await result.match(
            (value) => value,
            (error) => {
                throw error;
            },
        );

        expect(count).toBe(2);
        expect(invalidateNotificationCache).toHaveBeenCalledWith({
            orgId: ORG_ID,
            classification: 'OFFICIAL_SENSITIVE',
            residency: 'GLOBAL_RESTRICTED',
        });
    });

    it('registers cache tag when listing notifications', async () => {
        const { repo, model } = createRepository();
        model.findMany.mockResolvedValue([{ ...baseRecord, priority: NotificationPriority.HIGH }]);

        const result = await repo.listNotifications(authorization, USER_ID, { priorities: ['high'] });
        const notifications = await result.match(
            (value) => value,
            (error) => {
                throw error;
            },
        );

        expect(notifications[0]?.priority).toBe('high');
        expect(registerNotificationCache).toHaveBeenCalledWith(
            expect.objectContaining({ orgId: ORG_ID }),
        );
    });
});
