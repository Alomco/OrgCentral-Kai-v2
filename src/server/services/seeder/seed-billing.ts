// src/server/services/seeder/seed-billing.ts
import { faker } from '@faker-js/faker';
import { buildBillingRepositoryDependencies } from '@/server/repositories/providers/billing/billing-service-dependencies';
import {
    resolveSeederAuthorization,
    resolveSeedOrganization,
    type SeedContextOptions,
    getSeededMetadata,
    type SeedResult,
    UNKNOWN_ERROR_MESSAGE,
} from './utils';

type StringMetadata = Record<string, string>;

function toStringMetadata(metadata: Record<string, boolean | string | number | null>): StringMetadata {
    return Object.fromEntries(
        Object.entries(metadata).map(([key, value]) => [key, String(value)]),
    );
}

export async function seedBillingDataInternal(options?: SeedContextOptions): Promise<SeedResult> {
    try {
        const org = await resolveSeedOrganization(options);
        const authorization = resolveSeederAuthorization(org, options);
        const {
            subscriptionRepository,
            billingInvoiceRepository,
            paymentMethodRepository,
        } = buildBillingRepositoryDependencies();
        const metadata = toStringMetadata(getSeededMetadata());

        // 1. Subscription
        // Check if exists first to avoid unique constraint if we didn't clear
        const existingSub = await subscriptionRepository.getByOrgId(authorization, org.id);
        if (!existingSub) {
            await subscriptionRepository.upsertSubscription(authorization, {
                orgId: org.id,
                stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
                stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
                stripeSubscriptionItemId: `si_${faker.string.alphanumeric(14)}`,
                stripePriceId: `price_${faker.string.alphanumeric(14)}`,
                status: 'ACTIVE',
                seatCount: faker.number.int({ min: 5, max: 100 }),
                currentPeriodEnd: faker.date.future(),
                cancelAtPeriodEnd: false,
                stripeEventCreatedAt: new Date(),
                metadata,
            });
        }

        // 2. Billing Invoices
        let invoices = 0;
        for (let index = 0; index < 5; index++) {
            const date = faker.date.past({ years: 1 });
            await billingInvoiceRepository.upsertInvoice(authorization, {
                orgId: org.id,
                stripeInvoiceId: `in_${faker.string.alphanumeric(24)}`,
                status: 'PAID',
                amountDue: 2000,
                amountPaid: 2000,
                currency: 'GBP',
                periodStart: date,
                periodEnd: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000),
                userCount: faker.number.int({ min: 5, max: 50 }),
                metadata,
            });
            invoices++;
        }

        // 3. Payment Method
        const existingPm = await paymentMethodRepository.listByOrgId(authorization, org.id);
        if (!existingPm.length) {
            await paymentMethodRepository.upsertPaymentMethod(authorization, {
                orgId: org.id,
                stripePaymentMethodId: `pm_${faker.string.alphanumeric(24)}`,
                type: 'CARD',
                last4: faker.string.numeric(4),
                brand: faker.helpers.arrayElement(['visa', 'mastercard', 'amex']),
                expiryMonth: faker.number.int({ min: 1, max: 12 }),
                expiryYear: faker.number.int({ min: 2025, max: 2030 }),
                isDefault: true,
                metadata,
            });
        }
        return { success: true, message: `Seeded Billing: Subscription, ${String(invoices)} Invoices, Payment Method.`, count: 1 };
    } catch (error_) {
        return { success: false, message: error_ instanceof Error ? error_.message : UNKNOWN_ERROR_MESSAGE };
    }
}




