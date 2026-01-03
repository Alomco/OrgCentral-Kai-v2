import type {
    EmergencyContact,
    JsonValue,
    PhoneNumbers,
    PostalAddress,
} from '@/server/types/hr/people';

export const FIELD_CHECK_MESSAGE = 'Check the highlighted fields and try again.';

export function readFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value.trim() : '';
}

export function normalizeOptionalText(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

export function parseDateField(value: string, required: boolean): { date: Date | null; error?: string } {
    if (!value) {
        return required ? { date: null, error: 'Date is required.' } : { date: null };
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return { date: null, error: 'Enter a valid date.' };
    }
    return { date };
}

export function parseOptionalNumberField(value: string): { value: number | null; error?: string } {
    if (!value) {
        return { value: null };
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return { value: null, error: 'Enter a valid number.' };
    }
    return { value: parsed };
}

export function parseJsonField(value: string): { value: JsonValue | null; error?: string } {
    if (!value) {
        return { value: null };
    }
    try {
        const parsed = JSON.parse(value) as JsonValue;
        return { value: parsed };
    } catch {
        return { value: null, error: 'Enter valid JSON.' };
    }
}

export function buildPhoneNumbers(work: string, mobile: string, home: string): PhoneNumbers | null {
    const phone: PhoneNumbers = {};
    const normalizedWork = normalizeOptionalText(work);
    const normalizedMobile = normalizeOptionalText(mobile);
    const normalizedHome = normalizeOptionalText(home);

    if (normalizedWork) {
        phone.work = normalizedWork;
    }
    if (normalizedMobile) {
        phone.mobile = normalizedMobile;
    }
    if (normalizedHome) {
        phone.home = normalizedHome;
    }

    return Object.keys(phone).length > 0 ? phone : null;
}

export function buildPostalAddress(
    street: string,
    city: string,
    state: string,
    postalCode: string,
    country: string,
): PostalAddress | null {
    const address: PostalAddress = {};
    const streetValue = normalizeOptionalText(street);
    const cityValue = normalizeOptionalText(city);
    const stateValue = normalizeOptionalText(state);
    const postalValue = normalizeOptionalText(postalCode);
    const countryValue = normalizeOptionalText(country);

    if (streetValue) {
        address.street = streetValue;
    }
    if (cityValue) {
        address.city = cityValue;
    }
    if (stateValue) {
        address.state = stateValue;
    }
    if (postalValue) {
        address.postalCode = postalValue;
    }
    if (countryValue) {
        address.country = countryValue;
    }

    return Object.keys(address).length > 0 ? address : null;
}

export function buildEmergencyContact(
    name: string,
    relationship: string,
    phone: string,
    email: string,
): EmergencyContact | null {
    const contact: EmergencyContact = {};
    const nameValue = normalizeOptionalText(name);
    const relationshipValue = normalizeOptionalText(relationship);
    const phoneValue = normalizeOptionalText(phone);
    const emailValue = normalizeOptionalText(email);

    if (nameValue) {
        contact.name = nameValue;
    }
    if (relationshipValue) {
        contact.relationship = relationshipValue;
    }
    if (phoneValue) {
        contact.phone = phoneValue;
    }
    if (emailValue) {
        contact.email = emailValue;
    }

    return Object.keys(contact).length > 0 ? contact : null;
}

export function buildEmployeeProfileCandidate(formData: FormData) {
    return {
        profileId: readFormString(formData, 'profileId'),
        displayName: readFormString(formData, 'displayName'),
        firstName: readFormString(formData, 'firstName'),
        lastName: readFormString(formData, 'lastName'),
        email: readFormString(formData, 'email'),
        personalEmail: readFormString(formData, 'personalEmail'),
        phoneWork: readFormString(formData, 'phoneWork'),
        phoneMobile: readFormString(formData, 'phoneMobile'),
        phoneHome: readFormString(formData, 'phoneHome'),
        jobTitle: readFormString(formData, 'jobTitle'),
        departmentId: readFormString(formData, 'departmentId'),
        costCenter: readFormString(formData, 'costCenter'),
        managerUserId: readFormString(formData, 'managerUserId'),
        employmentType: readFormString(formData, 'employmentType'),
        employmentStatus: readFormString(formData, 'employmentStatus'),
        startDate: readFormString(formData, 'startDate'),
        endDate: readFormString(formData, 'endDate'),
        addressStreet: readFormString(formData, 'addressStreet'),
        addressCity: readFormString(formData, 'addressCity'),
        addressState: readFormString(formData, 'addressState'),
        addressPostalCode: readFormString(formData, 'addressPostalCode'),
        addressCountry: readFormString(formData, 'addressCountry'),
        emergencyContactName: readFormString(formData, 'emergencyContactName'),
        emergencyContactRelationship: readFormString(formData, 'emergencyContactRelationship'),
        emergencyContactPhone: readFormString(formData, 'emergencyContactPhone'),
        emergencyContactEmail: readFormString(formData, 'emergencyContactEmail'),
        annualSalary: readFormString(formData, 'annualSalary'),
        hourlyRate: readFormString(formData, 'hourlyRate'),
        salaryAmount: readFormString(formData, 'salaryAmount'),
        salaryCurrency: readFormString(formData, 'salaryCurrency'),
        salaryFrequency: readFormString(formData, 'salaryFrequency'),
        salaryBasis: readFormString(formData, 'salaryBasis'),
        paySchedule: readFormString(formData, 'paySchedule'),
        metadata: readFormString(formData, 'metadata'),
    };
}

export function buildEmployeeContractCandidate(formData: FormData) {
    return {
        profileId: readFormString(formData, 'profileId'),
        userId: readFormString(formData, 'userId'),
        contractId: readFormString(formData, 'contractId'),
        contractType: readFormString(formData, 'contractType'),
        jobTitle: readFormString(formData, 'jobTitle'),
        departmentId: readFormString(formData, 'departmentId'),
        location: readFormString(formData, 'location'),
        startDate: readFormString(formData, 'startDate'),
        endDate: readFormString(formData, 'endDate'),
        probationEndDate: readFormString(formData, 'probationEndDate'),
        terminationReason: readFormString(formData, 'terminationReason'),
        furloughStartDate: readFormString(formData, 'furloughStartDate'),
        furloughEndDate: readFormString(formData, 'furloughEndDate'),
        workingPattern: readFormString(formData, 'workingPattern'),
        benefits: readFormString(formData, 'benefits'),
        terminationNotes: readFormString(formData, 'terminationNotes'),
    };
}
