import type { PolicyAdminCreateState } from '../policy-admin-form-utils';

function toDateInputValue(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export function buildInitialPolicyAdminState(policyCategories: readonly string[]): PolicyAdminCreateState {
    return {
        status: 'idle',
        values: {
            title: '',
            content: '',
            category: (policyCategories[0] ?? 'HR_POLICIES') as PolicyAdminCreateState['values']['category'],
            version: '1',
            effectiveDate: toDateInputValue(new Date()),
            expiryDate: '',
            status: 'draft',
            requiresAcknowledgment: true,
            applicableRoles: '',
            applicableDepartments: '',
        },
    };
}

export function formatCategoryLabel(value: string): string {
    return value
        .split('_')
        .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
        .join(' ');
}

export function formatStatusLabel(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
