import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { HRNotificationDTO } from '@/server/types/hr/notifications';
import type { IHRNotificationRepository } from '@/server/repositories/contracts/hr/notifications/hr-notification-repository-contract';
import type { DataResidencyZone, DataClassificationLevel } from '@/server/types/tenant';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { HrNotificationService } from './hr-notification-service';

vi.mock('@/server/security/guards', () => ({
    assertOrgAccess: vi.fn().mockResolvedValue(undefined),
    assertOrgAccessWithAbac: vi.fn().mockResolvedValue(undefined),
}));

const repository: {
    createNotification: ReturnType<typeof vi.fn<IHRNotificationRepository['createNotification']>>;
    listNotifications: ReturnType<typeof vi.fn<IHRNotificationRepository['listNotifications']>>;
    getUnreadCount: ReturnType<typeof vi.fn<IHRNotificationRepository['getUnreadCount']>>;
    markRead: ReturnType<typeof vi.fn<IHRNotificationRepository['markRead']>>;
    markAllRead: ReturnType<typeof vi.fn<IHRNotificationRepository['markAllRead']>>;
    deleteNotification: ReturnType<typeof vi.fn<IHRNotificationRepository['deleteNotification']>>;
} = {
    createNotification: vi.fn(),
    listNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    deleteNotification: vi.fn(),
};

const authorization: RepositoryAuthorizationContext = {
    orgId: 'org-1',
    userId: 'user-1',
    roleKey: 'orgAdmin',
    permissions: {},
    dataResidency: 'UK_ONLY' as DataResidencyZone,
    dataClassification: 'OFFICIAL' as DataClassificationLevel,
    auditSource: 'test',
    correlationId: 'corr-123',
    tenantScope: {
        orgId: 'org-1',
        dataResidency: 'UK_ONLY' as DataResidencyZone,
        dataClassification: 'OFFICIAL' as DataClassificationLevel,
        auditSource: 'test',
    },
};

const sampleNotification: HRNotificationDTO = {
    id: 'notif-1',
    orgId: 'org-1',
    userId: 'user-1',
    title: 'Hello',
    message: 'World',
    type: 'system-announcement',
    priority: 'medium',
    isRead: false,
    dataClassification: 'OFFICIAL',
    residencyTag: 'UK_ONLY',
    createdAt: new Date(),
    updatedAt: new Date(),
};

function createService(): HrNotificationService {
    return new HrNotificationService({
        hrNotificationRepository: repository,
    });
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('HrNotificationService', () => {
    it('creates notification with defaults derived from authorization', async () => {
        const service = createService();
        repository.createNotification.mockResolvedValue(sampleNotification);

        const result = await service.createNotification({
            authorization,
            notification: {
                userId: 'user-2',
                title: 'A',
                message: 'B',
                type: 'leave-approval',
                priority: 'high',
            },
        });

        expect(repository.createNotification).toHaveBeenCalledWith(authorization, expect.objectContaining({
            orgId: 'org-1',
            userId: 'user-2',
            dataClassification: authorization.dataClassification,
            residencyTag: authorization.dataResidency,
            createdByUserId: authorization.userId,
            correlationId: authorization.correlationId,
        }));
        expect(result.notification).toBe(sampleNotification);
    });

    it('lists notifications and returns unread count', async () => {
        const service = createService();
        repository.listNotifications.mockResolvedValue([sampleNotification]);
        repository.getUnreadCount.mockResolvedValue(3);

        const result = await service.listNotifications({
            authorization,
            userId: 'user-9',
            filters: { unreadOnly: true },
        });

        expect(repository.listNotifications).toHaveBeenCalledWith(authorization, 'user-9', { unreadOnly: true });
        expect(repository.getUnreadCount).toHaveBeenCalledWith(authorization, 'user-9');
        expect(result.unreadCount).toBe(3);
        expect(result.notifications).toHaveLength(1);
    });

    it('marks a single notification as read with parsed date', async () => {
        const service = createService();
        const updated = { ...sampleNotification, isRead: true, readAt: new Date('2024-01-01') };
        repository.markRead.mockResolvedValue(updated);

        const result = await service.markNotificationRead({
            authorization,
            notificationId: 'notif-1',
            readAt: '2024-01-01T00:00:00.000Z',
        });

        expect(repository.markRead).toHaveBeenCalledWith(
            authorization,
            'notif-1',
            new Date('2024-01-01T00:00:00.000Z'),
        );
        expect(result.notification.isRead).toBe(true);
    });

    it('marks all notifications as read and returns updated unread count', async () => {
        const service = createService();
        repository.markAllRead.mockResolvedValue(5);
        repository.getUnreadCount.mockResolvedValue(1);

        const result = await service.markAllNotificationsRead({
            authorization,
            before: '2024-02-01T00:00:00.000Z',
        });

        expect(repository.markAllRead).toHaveBeenCalledWith(
            authorization,
            'user-1',
            new Date('2024-02-01T00:00:00.000Z'),
        );
        expect(result.updatedCount).toBe(5);
        expect(result.unreadCount).toBe(1);
    });

    it('deletes notification under org guard', async () => {
        const service = createService();
        repository.deleteNotification.mockResolvedValue(undefined);

        const result = await service.deleteNotification({
            authorization,
            notificationId: 'notif-1',
        });

        expect(repository.deleteNotification).toHaveBeenCalledWith(authorization, 'notif-1');
        expect(result.success).toBe(true);
    });
});
