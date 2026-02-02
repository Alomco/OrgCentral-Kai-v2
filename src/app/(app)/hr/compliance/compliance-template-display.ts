export function formatCategoryLabel(value?: string): string {
    if (!value) {
        return 'General';
    }

    const normalized = value.replace(/[_-]+/g, ' ').trim();
    if (!normalized) {
        return 'General';
    }

    return normalized
        .split(' ')
        .filter((word) => word.length > 0)
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(' ');
}

export function formatVersionLabel(version?: string): string {
    return version ? `v${version}` : 'No version';
}
