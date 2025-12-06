import { describe, expect, it, vi } from 'vitest';
import { NovuNotificationAdapter } from '../adapters/novu-notification-adapter';

const payload = {
  orgId: 'org-1',
  userId: 'user-1',
  to: 'user@example.com',
  subject: 'Hello',
  body: 'Body',
  actionUrl: 'https://example.com',
};

describe('NovuNotificationAdapter', () => {
  it('skips when client is missing', async () => {
    const adapter = new NovuNotificationAdapter({ workflowId: 'wf-1' });

    const result = await adapter.send(payload);

    expect(result.status).toBe('skipped');
    expect(result.detail).toContain('not configured');
  });

  it('triggers novu workflow', async () => {
    const trigger = vi.fn().mockResolvedValue({ acknowledged: true, transactionId: 'tx-1' });
    const adapter = new NovuNotificationAdapter({
      workflowId: 'wf-1',
      client: { trigger },
      channel: 'EMAIL',
    });

    const result = await adapter.send(payload);

    expect(trigger).toHaveBeenCalledWith(
      'wf-1',
      expect.objectContaining({
        to: expect.objectContaining({ subscriberId: payload.userId, email: payload.to }),
      }),
    );
    expect(result).toEqual({
      provider: 'novu',
      channel: 'EMAIL',
      status: 'sent',
      externalId: 'tx-1',
    });
  });
});
