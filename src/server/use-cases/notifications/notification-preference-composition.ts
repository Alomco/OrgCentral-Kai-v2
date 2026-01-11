import { PrismaNotificationPreferenceRepository } from '@/server/repositories/prisma/org/notifications';
import type { GetNotificationPreferencesInput, GetNotificationPreferencesResult } from './get-preference';
import { getNotificationPreferences } from './get-preference';

export function getNotificationPreferencesWithPrisma(
    input: GetNotificationPreferencesInput,
): Promise<GetNotificationPreferencesResult> {
    const repository = new PrismaNotificationPreferenceRepository();
    return getNotificationPreferences({ preferenceRepository: repository }, input);
}