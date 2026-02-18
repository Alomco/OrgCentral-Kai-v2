import type { IAuthAccountRepository } from '@/server/repositories/contracts/auth/sessions/auth-account-repository-contract';
import { BasePrismaRepository, type BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';

const CREDENTIAL_PROVIDER_ID = 'credential';

export class PrismaAuthAccountRepository
    extends BasePrismaRepository
    implements IAuthAccountRepository {
    constructor(options: BasePrismaRepositoryOptions = {}) {
        super(options);
    }

    async hasCredentialPassword(userId: string): Promise<boolean> {
        const count = await this.prisma.authAccount.count({
            where: {
                userId,
                providerId: CREDENTIAL_PROVIDER_ID,
                password: { not: null },
            },
        });

        return count > 0;
    }
}
