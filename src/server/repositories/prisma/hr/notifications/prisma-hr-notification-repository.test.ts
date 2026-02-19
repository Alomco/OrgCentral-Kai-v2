import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    HRNotificationType,
    NotificationPriority,
    type PrismaClient,
    type HRNotification as PrismaNotification,
} from '@prisma/client';
import { AuthorizationError } from '@/server/errors';
import { PrismaHRNotificationRepository } from './prisma-hr-notification-repository';

const invalidateHrNotifications = vi.hoisted(() => vi.fn());
const registerHrNotificationTag = vi.hoisted(() => vi.fn());

vi.mock('@/server/lib/cache-tags/hr-notifications', () => ({
    invalidateHrNotifications,
    registerHrNotificationTag,
}));

const ORG_ID = 'org-1';
const USER_ID = 'user-1';
const DOMAIN_APPROVAL_TYPE = 'leave-approval';
const PRISMA_REJECTION_TYPE: PrismaNotification['type'] = HRNotificationType.LEAVE_REJECTION;
const DOMAIN_REJECTION_TYPE = 'leave-rejection';

const baseRecord: PrismaNotification = {
    id: 'notif-1',
    orgId: ORG_ID,
    userId: USER_ID,
    title: 'Title',
    message: 'Message',
    type: HRNotificationType.LEAVE_APPROVAL,
    priority: NotificationPriority.MEDIUM,
    isRead: false,
    readAt: null,
    actionUrl: null,
    actionLabel: null,
    scheduledFor: null,
    expiresAt: null,
    correlationId: 'corr-1',
    createdByUserId: 'actor-1',
    dataClassification: 'OFFICIAL',
    residencyTag: 'UK_ONLY',
    metadata: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
};

function createRepository() {
    const model = {
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
    };

    const prisma = { hRNotification: model } as unknown as PrismaClient;
    const repo = new PrismaHRNotificationRepository({ prisma });

    return { repo, model };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('PrismaHRNotificationRepository', () => {
    it('creates a notification with enum mapping and invalidates cache', async () => {
        const { repo, model } = createRepository();
        model.create.mockResolvedValue({ ...baseRecord });

        const createInput = {
            orgId: ORG_ID,
            userId: USER_ID,
            title: 'Title',
            message: 'Message',
            type: DOMAIN_APPROVAL_TYPE,
            priority: 'medium',
            dataClassification: 'OFFICIAL',
            residencyTag: 'UK_ONLY',
        } satisfies Parameters<typeof repo.createNotification>[1];

        const result = await repo.createNotification(ORG_ID, createInput);

        const expectedCreateArguments = {
            data: expect.objectContaining({
                type: HRNotificationType.LEAVE_APPROVAL,
                priority: NotificationPriority.MEDIUM,
                isRead: false,
            }),
        } satisfies Record<string, unknown>;

        expect(model.create).toHaveBeenCalledWith(expectedCreateArguments);
        expect(result.type).toBe(DOMAIN_APPROVAL_TYPE);
        expect(result.priority).toBe('medium');
        expect(invalidateHrNotifications).toHaveBeenCalledWith(
            expect.objectContaining({ orgId: ORG_ID }),
        );
    });

    it('throws on cross-tenant creation attempts', async () => {
        const { repo } = createRepository();

        await expect(
            repo.createNotification(ORG_ID, {
                orgId: 'org-2',
                userId: USER_ID,
                title: 'x',
                message: 'y',
                type: DOMAIN_APPROVAL_TYPE,
                priority: 'low',
                dataClassification: 'OFFICIAL',
                residencyTag: 'UK_ONLY',
            }),
        ).rejects.toBeInstanceOf(AuthorizationError);
    });

    it('enforces tenant scoping on markRead', async () => {
        const { repo, model } = createRepository();
        model.updateMany.mockResolvedValue({ count: 1 });
        model.findFirst.mockResolvedValue({ ...baseRecord, orgId: 'other-org' });

        await expect(repo.markRead(ORG_ID, 'notif-1')).rejects.toThrow();
    });

    it('lists notifications with filters and registers cache tag', async () => {
        const { repo, model } = createRepository();
        model.findMany.mockResolvedValue([
            { ...baseRecord, type: PRISMA_REJECTION_TYPE, priority: NotificationPriority.HIGH },
        ]);

        const listFilters = {
            unreadOnly: true,
            types: [DOMAIN_REJECTION_TYPE],
            priorities: ['high'],
            limit: 10,
        } satisfies Parameters<typeof repo.listNotifications>[2];

        const notifications = await repo.listNotifications(ORG_ID, USER_ID, listFilters);

        expect(model.findMany).toHaveBeenCalledWith({
            where: {
                orgId: ORG_ID,
                userId: USER_ID,
                isRead: false,
                type: { in: [PRISMA_REJECTION_TYPE] },
                priority: { in: [NotificationPriority.HIGH] },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
        expect(notifications[0]?.type).toBe(DOMAIN_REJECTION_TYPE);
        expect(notifications[0]?.priority).toBe('high');
        expect(registerHrNotificationTag).toHaveBeenCalled();
    });

    it('marks all as read and invalidates cache with derived context', async () => {
        const { repo, model } = createRepository();
        model.updateMany.mockResolvedValue({ count: 2 });
        model.findFirst.mockResolvedValue({
            dataClassification: 'OFFICIAL_SENSITIVE',
            residencyTag: 'GLOBAL_RESTRICTED',
        });

        const count = await repo.markAllRead(ORG_ID, USER_ID);

        expect(count).toBe(2);
        const expectedUpdateArguments = {
            where: { orgId: ORG_ID, userId: USER_ID, isRead: false, createdAt: undefined },
            data: { isRead: true, readAt: expect.any(Date) as unknown as Date },
        } satisfies Record<string, unknown>;

        expect(model.updateMany).toHaveBeenCalledWith(expectedUpdateArguments);
        expect(invalidateHrNotifications).toHaveBeenCalledWith({
            orgId: ORG_ID,
            classification: 'OFFICIAL_SENSITIVE',
            residency: 'GLOBAL_RESTRICTED',
        });
    });
});
