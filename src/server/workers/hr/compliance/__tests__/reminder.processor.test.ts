import { describe, it, expect, beforeEach, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IComplianceItemRepository } from '@/server/repositories/contracts/hr/compliance/compliance-item-repository-contract';
import type { IComplianceTemplateRepository } from '@/server/repositories/contracts/hr/compliance/compliance-template-repository-contract';
import type { HrNotificationServiceContract } from '@/server/services/hr/notifications/hr-notification-service.provider';
import type { NotificationDispatchContract } from '@/server/services/notifications/notification-service.provider';
import { ComplianceReminderProcessor } from '../reminder.processor';
import { createComplianceItem } from './__fixtures__/compliance-factory';

function createAuthorization(): RepositoryAuthorizationContext {
    return {
        orgId: 'org-123',
        userId: 'system-user',
        roleKey: 'orgAdmin',
        permissions: {},
        dataResidency: 'UK_ONLY',
        dataClassification: 'OFFICIAL',
        auditSource: 'tests',
        auditBatchId: undefined,
        correlationId: 'corr-123',
        tenantScope: {
            orgId: 'org-123',
            dataResidency: 'UK_ONLY',
            dataClassification: 'OFFICIAL',
            auditSource: 'tests',
            auditBatchId: undefined,
        },
    };
}

describe('ComplianceReminderProcessor', () => {
    let complianceRepository: Pick<IComplianceItemRepository, 'findExpiringItemsForOrg'>;
    let templateRepository: Pick<IComplianceTemplateRepository, 'listTemplates'>;
    let notificationService: HrNotificationServiceContract;
    let notificationDispatcher: NotificationDispatchContract;
    let processor: ComplianceReminderProcessor;

    beforeEach(() => {
        complianceRepository = {
            findExpiringItemsForOrg: vi.fn(),
        };
        templateRepository = {
            listTemplates: vi.fn().mockResolvedValue([]),
        };
        notificationService = {
            createNotification: vi.fn().mockResolvedValue({ notification: { id: 'notif-1' } }) as never,
            listNotifications: vi.fn(),
            markNotificationRead: vi.fn(),
            markAllNotificationsRead: vi.fn(),
            deleteNotification: vi.fn(),
        } as unknown as HrNotificationServiceContract;
        notificationDispatcher = {
            dispatchNotification: vi.fn().mockResolvedValue(undefined),
        };
        processor = new ComplianceReminderProcessor({
            complianceItemRepository: complianceRepository as IComplianceItemRepository,
            complianceTemplateRepository: templateRepository as IComplianceTemplateRepository,
            notificationService,
            notificationDispatcher,
        });
    });

    it('returns zero stats when no expiring items are found', async () => {
        (complianceRepository.findExpiringItemsForOrg as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

        const authorization = createAuthorization();
        const result = await processor.process({ daysUntilExpiry: 15 }, authorization);

        expect(result).toEqual({ remindersSent: 0, usersTargeted: 0 });
        expect(notificationService.createNotification).not.toHaveBeenCalled();
        expect(notificationDispatcher.dispatchNotification).not.toHaveBeenCalled();
    });

    it('groups items per user and emits prioritized notifications', async () => {
        const referenceDate = new Date('2025-01-01T00:00:00Z');
        const userOneId = randomUUID();
        const userTwoId = randomUUID();
        const items = [
            createComplianceItem({ userId: userOneId, dueDate: new Date('2025-01-01T00:00:00Z') }),
            createComplianceItem({ userId: userOneId, dueDate: new Date('2025-01-03T00:00:00Z') }),
            createComplianceItem({ userId: userTwoId, dueDate: new Date('2025-01-05T00:00:00Z') }),
        ];
        (complianceRepository.findExpiringItemsForOrg as ReturnType<typeof vi.fn>).mockResolvedValueOnce(items);

        const authorization = createAuthorization();
        const result = await processor.process({ daysUntilExpiry: 7, referenceDate }, authorization);

        expect(result).toEqual({ remindersSent: 2, usersTargeted: 2 });
        expect(notificationService.createNotification).toHaveBeenCalledTimes(2);
        expect(notificationDispatcher.dispatchNotification).toHaveBeenCalledTimes(2);

        const firstCall = (notificationService.createNotification as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
        expect(firstCall?.notification.priority).toBe('urgent');
        expect(firstCall?.notification.userId).toBe(userOneId);
        expect(firstCall?.notification.metadata?.items).toHaveLength(2);

        const secondCall = (notificationService.createNotification as ReturnType<typeof vi.fn>).mock.calls[1]?.[0];
        expect(secondCall?.notification.priority).toBe('medium');
        expect(secondCall?.notification.userId).toBe(userTwoId);
        expect(secondCall?.notification.metadata?.items[0].itemId).toBe(items[2].id);

        const dispatchPayload = (notificationDispatcher.dispatchNotification as ReturnType<typeof vi.fn>).mock
            .calls[0]?.[0];
        expect(dispatchPayload?.notification.templateKey).toBe('hr.compliance.reminder');
        expect(dispatchPayload?.notification.channel).toBe('IN_APP');
        expect(dispatchPayload?.notification.recipient.userId).toBe(userOneId);
    });

    it('filters target users when provided', async () => {
        const userOneId = randomUUID();
        const userTwoId = randomUUID();
        const items = [
            createComplianceItem({ userId: userOneId }),
            createComplianceItem({ userId: userTwoId }),
        ];
        (complianceRepository.findExpiringItemsForOrg as ReturnType<typeof vi.fn>).mockResolvedValueOnce(items);

        const authorization = createAuthorization();
        const result = await processor.process({ targetUserIds: [userTwoId] }, authorization);

        expect(result).toEqual({ remindersSent: 1, usersTargeted: 1 });
        expect(notificationService.createNotification).toHaveBeenCalledTimes(1);
        expect(notificationDispatcher.dispatchNotification).toHaveBeenCalledTimes(1);
        const call = (notificationService.createNotification as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
        expect(call?.notification.userId).toBe(userTwoId);
    });

    it('uses template reminderDaysBeforeExpiry to expand scan window and filter items', async () => {
        const referenceDate = new Date('2025-01-01T00:00:00Z');
        const userId = randomUUID();
        const templateItemId = 'doc-right-to-work';

        (templateRepository.listTemplates as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
            {
                id: 'template-1',
                orgId: 'org-123',
                name: 'Pack',
                items: [
                    {
                        id: templateItemId,
                        name: 'Right to work',
                        type: 'DOCUMENT',
                        isMandatory: true,
                        reminderDaysBeforeExpiry: 10,
                    },
                ],
                createdAt: referenceDate,
                updatedAt: referenceDate,
            },
        ]);

        const itemDueInTen = createComplianceItem({
            userId,
            templateItemId,
            dueDate: new Date('2025-01-11T00:00:00Z'),
        });

        (complianceRepository.findExpiringItemsForOrg as ReturnType<typeof vi.fn>).mockResolvedValueOnce([itemDueInTen]);

        const authorization = createAuthorization();
        const result = await processor.process({ daysUntilExpiry: 7, referenceDate }, authorization);

        expect(result).toEqual({ remindersSent: 1, usersTargeted: 1 });
        expect(complianceRepository.findExpiringItemsForOrg).toHaveBeenCalledWith(
            authorization.orgId,
            referenceDate,
            10,
        );
    });

    it('does not notify items without template rules beyond fallback window', async () => {
        const referenceDate = new Date('2025-01-01T00:00:00Z');
        const userId = randomUUID();

        (templateRepository.listTemplates as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
            {
                id: 'template-1',
                orgId: 'org-123',
                name: 'Pack',
                items: [
                    {
                        id: 'some-other-item',
                        name: 'Other',
                        type: 'DOCUMENT',
                        isMandatory: true,
                        reminderDaysBeforeExpiry: 30,
                    },
                ],
                createdAt: referenceDate,
                updatedAt: referenceDate,
            },
        ]);

        const noRuleItem = createComplianceItem({
            userId,
            templateItemId: 'no-rule-item',
            dueDate: new Date('2025-01-10T00:00:00Z'), // 9 days out
        });

        (complianceRepository.findExpiringItemsForOrg as ReturnType<typeof vi.fn>).mockResolvedValueOnce([noRuleItem]);

        const authorization = createAuthorization();
        const result = await processor.process({ daysUntilExpiry: 7, referenceDate }, authorization);

        expect(result).toEqual({ remindersSent: 0, usersTargeted: 0 });
        expect(notificationService.createNotification).not.toHaveBeenCalled();
    });
});
