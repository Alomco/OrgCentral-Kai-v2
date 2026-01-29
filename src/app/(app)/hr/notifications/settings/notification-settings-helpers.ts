import type { NotificationPreference } from '@/server/types/hr-types';
import { getNotificationPreferences } from './actions';

export interface NotificationSettingsFormProps {
    preferences: NotificationPreference[];
}

export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];

export interface JsonObject {
    readonly [key: string]: JsonValue;
}

export const NOTIFICATION_PREFERENCES_QUERY_KEY = ['hr', 'notifications', 'preferences'] as const;

export interface UpdatePreferenceInput {
    preferenceId: string;
    enabled?: boolean;
    metadata?: JsonValue;
}

export interface PreferenceMutationContext {
    previous?: NotificationPreference[];
}

export async function fetchNotificationPreferences(): Promise<NotificationPreference[]> {
    const result = await getNotificationPreferences();
    if (!result.success) {
        throw new Error(result.error.message);
    }
    return result.data.preferences;
}

export function applyPreferenceUpdate(
    preferences: NotificationPreference[] | undefined,
    input: UpdatePreferenceInput,
): NotificationPreference[] | undefined {
    if (!preferences || preferences.length === 0) {
        return preferences;
    }

    return preferences.map((preference) => {
        if (preference.id !== input.preferenceId) {
            return preference;
        }

        return {
            ...preference,
            enabled: input.enabled ?? preference.enabled,
            metadata: input.metadata ?? preference.metadata,
        };
    });
}

export function getPreferenceMetadataObject(preference: NotificationPreference): JsonObject {
    const metadata = preference.metadata;
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
        return {};
    }
    return metadata as JsonObject;
}

export function getDisabledTypesFromMetadata(metadata: JsonObject): string[] {
    const value = metadata.disabledTypes;
    if (!Array.isArray(value)) {
        return [];
    }
    return value.filter((item): item is string => typeof item === 'string');
}

export function getPreferenceRetryDelay(attempt: number): number {
    return Math.min(1000 * 2 ** attempt, 4000);
}
