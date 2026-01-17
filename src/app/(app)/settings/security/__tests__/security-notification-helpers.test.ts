import { describe, expect, it } from 'vitest';

import {
    extractSecurityNotificationState,
    mergeSecurityNotificationMetadata,
    type JsonObject,
} from '../security-notification-helpers';

describe('security notification helpers', () => {
    it('extracts only valid disabled types', () => {
        const metadata: JsonObject = {
            securityNotifications: {
                disabledTypes: ['security-alert', 'invalid-type', 'weekly-summary'],
            },
        };

        const state = extractSecurityNotificationState(metadata);
        expect(state.disabledTypes).toEqual(['security-alert', 'weekly-summary']);
    });

    it('merges security metadata without dropping other fields', () => {
        const metadata: JsonObject = {
            theme: 'dark',
            securityNotifications: {
                disabledTypes: ['new-device'],
                lastUpdatedBy: 'user-1',
            },
        };

        const updated = mergeSecurityNotificationMetadata(metadata, ['mfa-change']);
        expect((updated as JsonObject).theme).toBe('dark');
        expect(
            (updated as JsonObject).securityNotifications as JsonObject,
        ).toEqual({
            disabledTypes: ['mfa-change'],
            lastUpdatedBy: 'user-1',
        });
    });
});
