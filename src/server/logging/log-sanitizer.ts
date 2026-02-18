const REDACTED_VALUE = '[REDACTED]';

const SENSITIVE_KEYS = new Set<string>([
    'password',
    'pass',
    'passwd',
    'pwd',
    'token',
    'accesstoken',
    'refreshtoken',
    'idtoken',
    'sessiontoken',
    'jwttoken',
    'authtoken',
    'identitytoken',
    'authorization',
    'authheader',
    'cookie',
    'setcookie',
    'secret',
    'clientsecret',
    'privatekey',
    'apikey',
    'xapikey',
    'otp',
    'pin',
    'cvv',
    'ninumber',
    'ssn',
    'bankdetails',
    'accountnumber',
    'routingnumber',
    'iban',
    'email',
    'phone',
]);

const BEARER_PATTERN = /\bbearer\s+[a-z0-9._~+/-]+=*/gi;
const API_KEY_PATTERN = /\bapi(?:[-_\s]?key)\b\s*[:=]?\s*[^\s,;]+/gi;
const X_API_KEY_PATTERN = /\bx-api-key\b\s*[:=]?\s*[^\s,;]+/gi;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const SECRET_ASSIGNMENT_PATTERN = /\b(password|pass|passwd|pwd|token|authorization|cookie|set-cookie|secret|client_secret|refresh_token|access_token|id_token|api_key|x_api_key)\b\s*[:=]\s*[^\s,;]+/gi;
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;

export function sanitizeLogMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const visited = new WeakSet<object>();
    const sanitized = sanitizeLogValueInternal(metadata, undefined, visited);
    if (!isRecord(sanitized)) {
        return {};
    }
    return sanitized;
}

function sanitizeLogValueInternal(
    value: unknown,
    key: string | undefined,
    visited: WeakSet<object>,
): unknown {
    if (isSensitiveKey(key)) {
        return REDACTED_VALUE;
    }

    if (typeof value === 'string') {
        return sanitizeStringValue(value);
    }

    if (Array.isArray(value)) {
        return value.map((item) => sanitizeLogValueInternal(item, key, visited));
    }

    if (isRecord(value)) {
        if (visited.has(value)) {
            return '[Circular]';
        }
        visited.add(value);

        const sanitizedEntries = Object.entries(value).map(([entryKey, entryValue]) => [
            entryKey,
            sanitizeLogValueInternal(entryValue, entryKey, visited),
        ]);

        return Object.fromEntries(sanitizedEntries);
    }

    return value;
}

function sanitizeStringValue(value: string): string {
    return value
        .replace(BEARER_PATTERN, 'Bearer [REDACTED]')
        .replace(API_KEY_PATTERN, 'api-key=[REDACTED]')
        .replace(X_API_KEY_PATTERN, 'x-api-key=[REDACTED]')
        .replace(SECRET_ASSIGNMENT_PATTERN, (_match, key: string) => `${key}=[REDACTED]`)
        .replace(JWT_PATTERN, '[REDACTED_JWT]')
        .replace(EMAIL_PATTERN, '[REDACTED_EMAIL]');
}

function isSensitiveKey(key: string | undefined): boolean {
    if (!key) {
        return false;
    }
    return SENSITIVE_KEYS.has(normalizeKey(key));
}

function normalizeKey(key: string): string {
    return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function sanitizeLogText(value: string): string {
    return sanitizeStringValue(value);
}