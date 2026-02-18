export interface IAuthAccountRepository {
    hasCredentialPassword(userId: string): Promise<boolean>;
}
