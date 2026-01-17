import { SECURITY_NOTIFICATION_TYPE_VALUES, type SecurityNotificationType } from './security-notification-types';

export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
export interface JsonObject {
    readonly [key: string]: JsonValue;
}

const securityTypeSet = new Set<string>(SECURITY_NOTIFICATION_TYPE_VALUES);

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeTypes(value: JsonValue | undefined): SecurityNotificationType[] {
    if (!Array.isArray(value)) {
        return [];
    }
    const filtered = value.filter((item): item is SecurityNotificationType =>
        typeof item === 'string' && securityTypeSet.has(item),
    );
    return Array.from(new Set(filtered));
}

export function extractSecurityNotificationState(metadata: JsonValue | undefined): {
    disabledTypes: SecurityNotificationType[];
} {
    if (!metadata || !isJsonObject(metadata)) {
        return { disabledTypes: [] };
    }

    const securityMeta = metadata.securityNotifications;
    if (!isJsonObject(securityMeta)) {
        return { disabledTypes: [] };
    }

    return { disabledTypes: normalizeTypes(securityMeta.disabledTypes) };
}

export function mergeSecurityNotificationMetadata(
    metadata: JsonValue | undefined,
    disabledTypes: SecurityNotificationType[],
): JsonValue {
    const base = isJsonObject(metadata) ? metadata : {};
    const securityMeta = isJsonObject(base.securityNotifications) ? base.securityNotifications : {};

    return {
        ...base,
        securityNotifications: {
            ...securityMeta,
            disabledTypes: Array.from(new Set(disabledTypes)),
        },
    };
}
