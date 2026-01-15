import { beforeEach, describe, expect, it, vi, type MockedFunction } from 'vitest';
import { okAsync } from 'neverthrow';
import type { NotificationRecord } from '@/server/repositories/notifications/notification-schemas';
import type { INotificationRepository } from '@/server/repositories/contracts/notifications';
import type { INotificationPreferenceRepository } from '@/server/repositories/contracts/org/notifications/notification-preference-repository-contract';
import type { NotificationPreference } from '@/server/types/hr-types';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { AuditEventPayload } from '@/server/logging/audit-logger';
import { defaultOrgSettings } from '@/server/services/org/settings/org-settings-model';
import type {
  NotificationDeliveryAdapter,
  NotificationDeliveryPayload,
  NotificationDeliveryResult,
} from '../notification-types';
import { NotificationComposerService } from '../notification-composer.service';

vi.mock('@/server/services/security/security-event-service.provider', () => ({
  getSecurityEventService: () => ({
    logSecurityEvent: vi.fn().mockResolvedValue(undefined),
  }),
}));

const ORG_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '22222222-2222-2222-2222-222222222222';

const baseNotification: NotificationRecord = {
  id: 'notif-1',
  orgId: ORG_ID,
  userId: USER_ID,
  title: 'Test',
  body: 'Body',
  topic: 'other',
  priority: 'medium',
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
  correlationId: 'corr',
  createdByUserId: USER_ID,
  auditSource: 'tests',
  metadata: null,
  auditTrail: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

const authorization: RepositoryAuthorizationContext = {
  orgId: ORG_ID,
  userId: USER_ID,
  roleKey: 'custom',
  roleName: null,
  roleId: null,
  roleScope: null,
  permissions: {},
  dataResidency: 'UK_ONLY',
  dataClassification: 'OFFICIAL',
  auditSource: 'tests',
  correlationId: 'corr',
  sessionId: 'corr',
  roles: ['custom'],
  mfaVerified: true,
  ipAddress: '127.0.0.1',
  userAgent: 'vitest',
  authenticatedAt: new Date('2024-01-01T00:00:00Z'),
  sessionExpiresAt: new Date('2024-01-01T01:00:00Z'),
  lastActivityAt: new Date('2024-01-01T00:00:00Z'),
  requiresMfa: false,
  piiAccessRequired: false,
  dataBreachRisk: false,
  sessionToken: 'corr',
  authorizedAt: new Date('2024-01-01T00:00:00Z'),
  authorizationReason: 'test',
  tenantScope: {
    orgId: ORG_ID,
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    auditSource: 'tests',
  },
};

describe('NotificationComposerService', () => {
  let guard: (input: unknown) => Promise<void>;
  let auditRecorder: MockedFunction<(event: AuditEventPayload) => Promise<void>>;
  let adapterSend: MockedFunction<
    (payload: NotificationDeliveryPayload) => Promise<NotificationDeliveryResult>
  >;
  let adapter: NotificationDeliveryAdapter;
  let repo: INotificationRepository;
  let preferenceRepo: INotificationPreferenceRepository;
  let orgSettingsLoader: MockedFunction<(orgId: string) => Promise<typeof defaultOrgSettings>>;

  beforeEach(() => {
    vi.clearAllMocks();
    guard = vi.fn().mockResolvedValue(undefined);
    auditRecorder = vi.fn<(event: AuditEventPayload) => Promise<void>>().mockResolvedValue(
      undefined,
    );
    adapterSend = vi
      .fn<(payload: NotificationDeliveryPayload) => Promise<NotificationDeliveryResult>>()
      .mockResolvedValue({
        provider: 'resend',
        channel: 'EMAIL',
        status: 'sent',
        externalId: 'email-1',
      });
    adapter = {
      provider: 'resend',
      channel: 'EMAIL',
      send: adapterSend,
    };
    repo = {
      createNotification: vi.fn(() => okAsync(baseNotification)),
      markRead: vi.fn(() => okAsync({ ...baseNotification, isRead: true })),
      markAllRead: vi.fn(() => okAsync(2)),
      listNotifications: vi.fn(() => okAsync([baseNotification])),
      deleteNotification: vi.fn(() => okAsync(undefined)),
    };
    preferenceRepo = {
      getNotificationPreferencesByUser: vi.fn(() => Promise.resolve([])),
    } as unknown as INotificationPreferenceRepository;
    orgSettingsLoader = vi.fn(async () => defaultOrgSettings);
  });

  it('creates notification and dispatches adapter respecting guard', async () => {
    const service = new NotificationComposerService({
      notificationRepository: repo,
      preferenceRepository: preferenceRepo,
      deliveryAdapters: [adapter],
      guard,
      auditRecorder,
      orgSettingsLoader,
      defaultRetentionPolicyId: 'retain-1',
    });

    const result = await service.composeAndSend({
      authorization,
      notification: {
        orgId: ORG_ID,
        userId: USER_ID,
        title: 'Test',
        body: 'Body',
        topic: 'other',
        priority: 'medium',
        retentionPolicyId: 'retain-1',
        dataClassification: 'OFFICIAL',
        residencyTag: 'UK_ONLY',
        auditSource: 'tests',
        schemaVersion: 1,
        isRead: false,
      },
      targets: [{ channel: 'EMAIL', to: 'user@example.com' }],
    });

    expect(guard).toHaveBeenCalled();
    expect(repo.createNotification).toHaveBeenCalledWith(
      authorization,
      expect.objectContaining({ orgId: ORG_ID, userId: USER_ID, retentionPolicyId: 'retain-1' }),
    );
    expect(adapterSend).toHaveBeenCalled();
    expect(auditRecorder).toHaveBeenCalledWith(expect.objectContaining({ action: 'notification.compose' }));
    expect(result.deliveries[0]?.status).toBe('sent');
  });

  it('skips delivery when user disables channel', async () => {
    const disabledPreference: NotificationPreference = {
      id: 'pref-1',
      orgId: ORG_ID,
      userId: USER_ID,
      channel: 'EMAIL',
      enabled: false,
      quietHours: null,
      metadata: null,
      updatedAt: new Date(),
    };
    preferenceRepo.getNotificationPreferencesByUser = vi.fn(() =>
      Promise.resolve([disabledPreference]),
    );

    const service = new NotificationComposerService({
      notificationRepository: repo,
      preferenceRepository: preferenceRepo,
      deliveryAdapters: [adapter],
      guard,
      auditRecorder,
      orgSettingsLoader,
      defaultRetentionPolicyId: 'retain-1',
    });

    const result = await service.composeAndSend({
      authorization,
      notification: {
        orgId: ORG_ID,
        userId: USER_ID,
        title: 'Test',
        body: 'Body',
        topic: 'other',
        priority: 'medium',
        retentionPolicyId: 'retain-1',
        dataClassification: 'OFFICIAL',
        residencyTag: 'UK_ONLY',
        auditSource: 'tests',
        schemaVersion: 1,
        isRead: false,
      },
      targets: [{ channel: 'EMAIL', to: 'user@example.com' }],
    });

    expect(adapterSend).not.toHaveBeenCalled();
    expect(result.deliveries[0]?.status).toBe('skipped');
  });

  it('lists inbox and computes unread count', async () => {
    repo.listNotifications = vi.fn(() =>
      okAsync([
        { ...baseNotification, id: '1', isRead: false },
        { ...baseNotification, id: '2', isRead: true },
      ]),
    );
    const service = new NotificationComposerService({
      notificationRepository: repo,
      preferenceRepository: preferenceRepo,
      deliveryAdapters: [adapter],
      guard,
      auditRecorder,
      orgSettingsLoader,
      defaultRetentionPolicyId: 'retain-1',
    });

    const result = await service.listInbox({ authorization });

    expect(repo.listNotifications).toHaveBeenCalledWith(authorization, USER_ID, undefined);
    expect(result.unreadCount).toBe(1);
  });

  it('marks all notifications as read and records audit', async () => {
    const service = new NotificationComposerService({
      notificationRepository: repo,
      preferenceRepository: preferenceRepo,
      deliveryAdapters: [adapter],
      guard,
      auditRecorder,
      orgSettingsLoader,
      defaultRetentionPolicyId: 'retain-1',
    });

    const count = await service.markAllRead({ authorization });

    expect(repo.markAllRead).toHaveBeenCalledWith(authorization, USER_ID, undefined);
    expect(count).toBe(2);
    expect(auditRecorder).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'notification.read-all' }),
    );
  });
});
