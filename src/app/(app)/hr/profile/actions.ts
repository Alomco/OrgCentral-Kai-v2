'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getPeopleService } from '@/server/services/hr/people/people-service.provider';
import { normalizeProfileChanges } from '@/server/services/hr/people/helpers/onboard-payload.helpers';

import { toFieldErrors } from '../_components/form-errors';
import {
    FIELD_CHECK_MESSAGE,
    buildEmergencyContact,
    buildPhoneNumbers,
    buildPostalAddress,
    normalizeOptionalText,
    readFormString,
} from '../employees/action-helpers';
import type { SelfProfileFormState } from './form-state';
import { selfProfileFormSchema } from './schema';

const UPDATE_PROFILE_ERROR = 'Unable to update your profile.';
const UNAUTHORIZED_MESSAGE = 'Not authorized to update your profile.';

function buildSelfProfileCandidate(formData: FormData) {
    return {
        profileId: readFormString(formData, 'profileId'),
        displayName: readFormString(formData, 'displayName'),
        firstName: readFormString(formData, 'firstName'),
        lastName: readFormString(formData, 'lastName'),
        personalEmail: readFormString(formData, 'personalEmail'),
        phoneWork: readFormString(formData, 'phoneWork'),
        phoneMobile: readFormString(formData, 'phoneMobile'),
        phoneHome: readFormString(formData, 'phoneHome'),
        addressStreet: readFormString(formData, 'addressStreet'),
        addressCity: readFormString(formData, 'addressCity'),
        addressState: readFormString(formData, 'addressState'),
        addressPostalCode: readFormString(formData, 'addressPostalCode'),
        addressCountry: readFormString(formData, 'addressCountry'),
        emergencyContactName: readFormString(formData, 'emergencyContactName'),
        emergencyContactRelationship: readFormString(formData, 'emergencyContactRelationship'),
        emergencyContactPhone: readFormString(formData, 'emergencyContactPhone'),
        emergencyContactEmail: readFormString(formData, 'emergencyContactEmail'),
        photoUrl: readFormString(formData, 'photoUrl'),
    };
}

export async function updateSelfProfileAction(
    previous: SelfProfileFormState,
    formData: FormData,
): Promise<SelfProfileFormState> {
    const candidate = buildSelfProfileCandidate(formData);
    const parsed = selfProfileFormSchema.safeParse(candidate);

    if (!parsed.success) {
        return {
            status: 'error',
            message: FIELD_CHECK_MESSAGE,
            fieldErrors: toFieldErrors(parsed.error),
            values: previous.values,
        };
    }

    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext({}, {
            headers: headerStore,
            requiredPermissions: { employeeProfile: ['update'] },
            auditSource: 'ui:hr:profile:update',
        });
    } catch {
        return {
            status: 'error',
            message: UNAUTHORIZED_MESSAGE,
            values: previous.values,
        };
    }

    const profileUpdates = normalizeProfileChanges({
        displayName: normalizeOptionalText(parsed.data.displayName),
        firstName: normalizeOptionalText(parsed.data.firstName),
        lastName: normalizeOptionalText(parsed.data.lastName),
        personalEmail: normalizeOptionalText(parsed.data.personalEmail),
        phone: buildPhoneNumbers(
            parsed.data.phoneWork,
            parsed.data.phoneMobile,
            parsed.data.phoneHome,
        ),
        address: buildPostalAddress(
            parsed.data.addressStreet,
            parsed.data.addressCity,
            parsed.data.addressState,
            parsed.data.addressPostalCode,
            parsed.data.addressCountry,
        ),
        emergencyContact: buildEmergencyContact(
            parsed.data.emergencyContactName,
            parsed.data.emergencyContactRelationship,
            parsed.data.emergencyContactPhone,
            parsed.data.emergencyContactEmail,
        ),
        photoUrl: normalizeOptionalText(parsed.data.photoUrl),
    });

    try {
        const peopleService = getPeopleService();
        await peopleService.updateEmployeeProfile({
            authorization: session.authorization,
            payload: {
                profileId: parsed.data.profileId,
                profileUpdates,
            },
        });

        revalidatePath('/hr/profile');

        return {
            status: 'success',
            message: 'Profile updated.',
            fieldErrors: undefined,
            values: parsed.data,
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : UPDATE_PROFILE_ERROR,
            fieldErrors: undefined,
            values: parsed.data,
        };
    }
}
