import { describe, expect, it } from 'vitest';
import {
    NOTIFICATION_SCHEMA_VERSION,
    notificationCreateSchema,
    notificationEnvelopeSchema,
} from '../notification-schemas';

const BASE_INPUT = {
    orgId: '11111111-1111-4111-8111-111111111111',
    userId: '22222222-2222-4222-8222-222222222222',
    title: 'Test',
    body: 'Body',
    topic: 'other' as const,
    priority: 'medium' as const,
    retentionPolicyId: 'retain-1',
    dataClassification: 'OFFICIAL' as const,
    residencyTag: 'UK_ONLY' as const,
    auditSource: 'tests',
};

describe('notificationCreateSchema', () => {
    it('accepts valid payload and coerces date values', () => {
        const parsed = notificationCreateSchema.parse({
            ...BASE_INPUT,
            scheduledFor: '2024-01-01T00:00:00Z',
        });

        expect(parsed.isRead).toBe(false);
        expect(parsed.scheduledFor).toBeInstanceOf(Date);
        expect(parsed.schemaVersion).toBe(NOTIFICATION_SCHEMA_VERSION);
    });

    it('rejects missing retention policy identifier', () => {
        expect(() =>
            notificationCreateSchema.parse({
                ...BASE_INPUT,
                retentionPolicyId: '',
            }),
        ).toThrow();
    });
});

describe('notificationEnvelopeSchema', () => {
    it('builds audit envelope with defaults', () => {
        const envelope = notificationEnvelopeSchema.parse({
            notificationId: '33333333-3333-4333-8333-333333333333',
            orgId: BASE_INPUT.orgId,
            userId: BASE_INPUT.userId,
            retentionPolicyId: BASE_INPUT.retentionPolicyId,
            dataClassification: BASE_INPUT.dataClassification,
            residencyTag: BASE_INPUT.residencyTag,
            payload: {
                ...BASE_INPUT,
                id: '44444444-4444-4444-8444-444444444444',
                isRead: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            auditMetadata: {
                auditSource: 'tests',
            },
        });

        expect(envelope.schemaVersion).toBeGreaterThan(0);
        expect(envelope.auditMetadata.capturedAt).toBeInstanceOf(Date);
    });
});
