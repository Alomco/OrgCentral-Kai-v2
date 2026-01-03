import type { EmployeeProfile } from '@/server/types/hr-types';

import type { FieldErrors } from '../_components/form-errors';
import type { SelfProfileFormValues } from './schema';

export interface SelfProfileFormState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    fieldErrors?: FieldErrors<SelfProfileFormValues>;
    values: SelfProfileFormValues;
}

function formatText(value: string | null | undefined): string {
    return value ?? '';
}

export function buildInitialSelfProfileFormState(profile: EmployeeProfile): SelfProfileFormState {
    return {
        status: 'idle',
        fieldErrors: undefined,
        values: {
            profileId: profile.id,
            displayName: formatText(profile.displayName),
            firstName: formatText(profile.firstName),
            lastName: formatText(profile.lastName),
            personalEmail: formatText(profile.personalEmail),
            phoneWork: formatText(profile.phone?.work),
            phoneMobile: formatText(profile.phone?.mobile),
            phoneHome: formatText(profile.phone?.home),
            addressStreet: formatText(profile.address?.street),
            addressCity: formatText(profile.address?.city),
            addressState: formatText(profile.address?.state),
            addressPostalCode: formatText(profile.address?.postalCode),
            addressCountry: formatText(profile.address?.country),
            emergencyContactName: formatText(profile.emergencyContact?.name),
            emergencyContactRelationship: formatText(profile.emergencyContact?.relationship),
            emergencyContactPhone: formatText(profile.emergencyContact?.phone),
            emergencyContactEmail: formatText(profile.emergencyContact?.email ?? undefined),
            photoUrl: formatText(profile.photoUrl),
        },
    };
}
