import { CHECKLIST_TEMPLATE_TYPES } from '@/server/types/onboarding-types';

export function readFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
}

export const CHECKLIST_TEMPLATES_RESOURCE_TYPE = 'hr.onboarding';
export const CHECKLIST_TEMPLATES_REDIRECT_PATH = '/hr/onboarding';
export const CHECKLIST_TEMPLATES_FIELD_ERROR_MESSAGE = 'Please review the highlighted fields.';
export const CHECKLIST_TEMPLATES_FIELD_TYPE = 'type';

export function parseItemsText(itemsText: string): { label: string; order: number }[] {
    return itemsText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((label, index) => ({ label, order: index }));
}

export function parseTemplateType(type: string): (typeof CHECKLIST_TEMPLATE_TYPES)[number] {
    if (CHECKLIST_TEMPLATE_TYPES.includes(type as (typeof CHECKLIST_TEMPLATE_TYPES)[number])) {
        return type as (typeof CHECKLIST_TEMPLATE_TYPES)[number];
    }

    return 'onboarding';
}
