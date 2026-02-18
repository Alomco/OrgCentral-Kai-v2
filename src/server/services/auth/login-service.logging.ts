export function maskEmailForLog(email: string): string {
    const trimmed = email.trim().toLowerCase();
    const atIndex = trimmed.indexOf('@');
    if (atIndex <= 0 || atIndex === trimmed.length - 1) {
        return '[REDACTED_EMAIL]';
    }

    const localPart = trimmed.slice(0, atIndex);
    const domain = trimmed.slice(atIndex + 1);
    const first = localPart.slice(0, 1);
    return `${first}***@${domain}`;
}
