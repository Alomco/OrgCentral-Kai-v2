import type {
    IWaitlistRepository,
    WaitlistEntryInput,
} from '@/server/repositories/contracts/auth/waitlist/waitlist-repository-contract';
import { normalizeString, normalizeEmail, assertNonEmpty } from '@/server/use-cases/shared';

export interface AddToWaitlistDependencies {
    waitlistRepository: IWaitlistRepository;
}

export type AddToWaitlistInput = WaitlistEntryInput;

export interface AddToWaitlistResult {
    success: true;
}

export async function addToWaitlist(
    { waitlistRepository }: AddToWaitlistDependencies,
    input: AddToWaitlistInput,
): Promise<AddToWaitlistResult> {
    const cleaned = normalizeEntry(input);
    await waitlistRepository.createEntry(cleaned);
    return { success: true };
}

function normalizeEntry(entry: AddToWaitlistInput): WaitlistEntryInput {
    const name = normalizeString(entry.name);
    const email = normalizeEmail(entry.email);
    const industry = normalizeString(entry.industry);

    assertNonEmpty(name, 'Contact name');
    assertNonEmpty(email, 'Email address');
    assertNonEmpty(industry, 'Industry description');

    return {
        name,
        email,
        industry,
        metadata: entry.metadata,
    } satisfies WaitlistEntryInput;
}
