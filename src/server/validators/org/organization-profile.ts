import { z } from 'zod';

export const contactInfoSchema = z
    .object({
        name: z.string().trim().min(1).max(120),
        email: z.email().max(254),
        phone: z.string().trim().min(1).max(64).optional(),
    })
    .strict();

export const contactDetailsSchema = z
    .object({
        primaryBusinessContact: contactInfoSchema.optional(),
        accountsFinanceContact: contactInfoSchema.optional(),
    })
    .strict();

export const organizationProfileUpdateSchema = z
    .object({
        name: z.string().trim().min(1).max(120).optional(),
        address: z.string().trim().min(1).max(200).nullable().optional(),
        phone: z.string().trim().min(1).max(64).nullable().optional(),
        website: z.string().trim().min(1).max(2048).nullable().optional(),
        companyType: z.string().trim().min(1).max(120).nullable().optional(),
        industry: z.string().trim().min(1).max(120).nullable().optional(),
        employeeCountRange: z.string().trim().min(1).max(120).nullable().optional(),
        incorporationDate: z.string().trim().min(4).max(32).nullable().optional(),
        registeredOfficeAddress: z.string().trim().min(1).max(250).nullable().optional(),
        contactDetails: contactDetailsSchema.nullable().optional(),
    })
    .strict();

export type OrganizationProfileUpdateInput = z.infer<typeof organizationProfileUpdateSchema>;
