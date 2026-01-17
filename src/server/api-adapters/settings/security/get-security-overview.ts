import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { SecurityOverviewResponse } from '@/lib/schemas/security-overview';
import { getSecurityOverviewWithPrisma } from '@/server/use-cases/settings/security/get-security-overview-with-prisma';

export interface GetSecurityOverviewAdapterInput {
    authorization: RepositoryAuthorizationContext;
    currentSessionToken: string;
}

export async function getSecurityOverviewAdapter(
    input: GetSecurityOverviewAdapterInput,
): Promise<SecurityOverviewResponse> {
    return getSecurityOverviewWithPrisma(input);
}
