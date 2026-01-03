import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().max(max);
const optionalEmail = z.email().trim().max(200).or(z.literal(''));
const optionalUrl = z.string().trim().url('Enter a valid URL.').or(z.literal(''));

export const selfProfileFormSchema = z.object({
    profileId: z.uuid(),
    displayName: optionalText(120),
    firstName: optionalText(80),
    lastName: optionalText(80),
    personalEmail: optionalEmail,
    phoneWork: optionalText(40),
    phoneMobile: optionalText(40),
    phoneHome: optionalText(40),
    addressStreet: optionalText(140),
    addressCity: optionalText(100),
    addressState: optionalText(100),
    addressPostalCode: optionalText(40),
    addressCountry: optionalText(80),
    emergencyContactName: optionalText(120),
    emergencyContactRelationship: optionalText(120),
    emergencyContactPhone: optionalText(40),
    emergencyContactEmail: optionalEmail,
    photoUrl: optionalUrl,
});

export type SelfProfileFormValues = z.infer<typeof selfProfileFormSchema>;
