import { describe, expect, it, vi } from 'vitest';
import { ResendNotificationAdapter } from '../adapters/resend-notification-adapter';

const payload = {
  orgId: 'org-1',
  userId: 'user-1',
  to: 'user@example.com',
  subject: 'Hello',
  body: 'World',
  actionUrl: 'https://example.com',
};

describe('ResendNotificationAdapter', () => {
  it('skips when client is not configured', async () => {
    const adapter = new ResendNotificationAdapter({ fromAddress: 'no-reply@example.com' });

    const result = await adapter.send(payload);

    expect(result.status).toBe('skipped');
  });

  it('sends email through provided client', async () => {
    const send = vi.fn().mockResolvedValue({ id: 'msg-1' });
    const adapter = new ResendNotificationAdapter({
      fromAddress: 'no-reply@example.com',
      client: { emails: { send } },
    });

    const result = await adapter.send(payload);

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'no-reply@example.com', to: payload.to, subject: 'Hello' }),
    );
    expect(result).toEqual({
      provider: 'resend',
      channel: 'EMAIL',
      status: 'sent',
      externalId: 'msg-1',
    });
  });
});
