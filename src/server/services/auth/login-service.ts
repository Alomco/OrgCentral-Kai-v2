import type { LoginActionResult } from '@/features/auth/login/login-contracts';
import type { auth } from '@/server/lib/auth';
import { AbstractBaseService } from '@/server/services/abstract-base-service';
import type { IOrganizationRepository } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import type { IUserRepository } from '@/server/repositories/contracts/org/users/user-repository-contract';
import type { OrganizationData } from '@/server/types/leave-types';
import { SecurityConfigurationProvider } from '@/server/security/security-configuration-provider';
import { getSecurityEventService } from '@/server/services/security/security-event-service.provider';
import {
    buildPostLoginCallbackUrl,
    buildServiceContext,
    isOrganizationData,
    normalizeAuthError,
} from './login-service.helpers';
import { maskEmailForLog } from './login-service.logging';

const LOGIN_OPERATION = 'auth.login.signInEmail';
const LOGIN_ACTION = 'auth.login' as const;

type AuthSignInEmailFunction = (typeof auth)['api']['signInEmail'];

interface BetterAuthSignInEmailSuccessPayload {
    user: { id: string };
    url?: string | null;
}

interface BetterAuthHeadersResponse {
    headers: Headers;
    response: BetterAuthSignInEmailSuccessPayload;
}

interface OrganizationLookupRepository {
    getOrganizationBySlug(slug: string): Promise<OrganizationData | null>;
}

export interface LoginServiceDependencies {
    readonly authClient: {
        api: {
            signInEmail: AuthSignInEmailFunction;
        };
    };
    readonly organizationRepository: IOrganizationRepository;
    readonly userRepository: IUserRepository;
}

export interface LoginServiceInput {
    readonly credentials: {
        email: string;
        password: string;
        rememberMe?: boolean;
    };
    readonly tenant: {
        orgSlug: string;
    };
    readonly request: {
        headers: Headers;
        ipAddress?: string;
        userAgent?: string;
    };
}

export interface LoginServiceWithCookiesResult {
    result: LoginActionResult;
    headers: Headers | null;
}

export class LoginService extends AbstractBaseService {
    private readonly authClient: LoginServiceDependencies['authClient'];
    private readonly organizationRepository: OrganizationLookupRepository;
    private readonly userRepository: IUserRepository;
    private readonly securityConfigProvider: SecurityConfigurationProvider;

    constructor(dependencies: LoginServiceDependencies) {
        super();
        this.authClient = dependencies.authClient;
        this.organizationRepository = dependencies.organizationRepository;
        this.userRepository = dependencies.userRepository;
        this.securityConfigProvider = SecurityConfigurationProvider.getInstance();
    }

    async signIn(input: LoginServiceInput): Promise<LoginActionResult> {
        const { result } = await this.signInWithCookies(input);
        return result;
    }

    async signInWithCookies(input: LoginServiceInput): Promise<LoginServiceWithCookiesResult> {
        const rawOrganization: unknown = await this.organizationRepository.getOrganizationBySlug(
            input.tenant.orgSlug,
        );

        if (!rawOrganization || !isOrganizationData(rawOrganization)) {
            this.logger.warn('auth.login.organization_missing', {
                action: LOGIN_ACTION,
                event: 'organization_not_found',
                orgSlug: input.tenant.orgSlug,
                timestamp: new Date().toISOString(),
            });

            return {
                result: {
                    ok: false,
                    code: 'ORG_NOT_FOUND',
                    message: 'We could not find that organization. Double-check the slug or contact your administrator.',
                } satisfies LoginActionResult,
                headers: null,
            } satisfies LoginServiceWithCookiesResult;
        }

        const organization = rawOrganization;

        const { slug: orgSlug, id: orgId, dataResidency, dataClassification } = organization;
        const serviceContext = buildServiceContext({
            organization,
            requestHeaders: input.request.headers,
        });
        const callbackURL = buildPostLoginCallbackUrl(input.request.headers, orgSlug);
        const securityConfig = this.securityConfigProvider.getOrgConfig(orgId);
        const now = new Date();
        const userEmailMasked = maskEmailForLog(input.credentials.email);

        const existingUser = await this.userRepository.findByEmail(input.credentials.email);
        if (existingUser?.lockedUntil && existingUser.lockedUntil > now) {
            return {
                result: {
                    ok: false,
                    code: 'ACCOUNT_LOCKED',
                    message: 'Your account is temporarily locked. Please try again later or contact support.',
                } satisfies LoginActionResult,
                headers: null,
            } satisfies LoginServiceWithCookiesResult;
        }

        return this.executeInServiceContext(serviceContext, LOGIN_OPERATION, async () => {
            try {
                const { headers, response } = (await this.authClient.api.signInEmail({
                    headers: input.request.headers,
                    returnHeaders: true,
                    body: {
                        email: input.credentials.email,
                        password: input.credentials.password,
                        rememberMe: input.credentials.rememberMe ?? true,
                        callbackURL,
                    },
                })) as BetterAuthHeadersResponse;

                const payload = response;
                const userId = payload.user.id;
                if (typeof userId !== 'string' || userId.length === 0) {
                    throw new Error('Auth provider returned an invalid login payload.');
                }

                this.logger.info('auth.login.success', {
                    action: LOGIN_ACTION,
                    event: 'login_success',
                    orgSlug,
                    orgId,
                    userId,
                    userEmailMasked,
                    residency: dataResidency,
                    classification: dataClassification,
                    ipAddress: input.request.ipAddress ?? undefined,
                    userAgent: input.request.userAgent ?? undefined,
                    timestamp: new Date().toISOString(),
                });

                if (existingUser) {
                    await this.userRepository.resetFailedLogin(existingUser.id);
                }

                return {
                    result: {
                        ok: true,
                        message: 'Login successful. Redirecting you now…',
                        redirectUrl: `/api/auth/post-login?org=${encodeURIComponent(input.tenant.orgSlug)}`,
                    } satisfies LoginActionResult,
                    headers,
                } satisfies LoginServiceWithCookiesResult;
            } catch (error) {
                const failure = normalizeAuthError(error);

                const reason = failure.code ?? 'UNKNOWN';

                if (existingUser) {
                    const nextFailedCount = existingUser.failedLoginCount + 1;
                    if (nextFailedCount >= securityConfig.maxLoginAttempts) {
                        const lockedUntil = new Date(
                            now.getTime() + securityConfig.lockoutDurationMinutes * 60 * 1000,
                        );
                        await this.userRepository.setLoginLockout(existingUser.id, lockedUntil, nextFailedCount);
                        await getSecurityEventService().logSecurityEvent({
                            orgId,
                            eventType: 'auth.login.lockout',
                            severity: 'high',
                            description: 'Account locked due to repeated failed login attempts.',
                            userId: existingUser.id,
                            ipAddress: input.request.ipAddress ?? undefined,
                            userAgent: input.request.userAgent ?? undefined,
                            metadata: {
                                orgSlug,
                                attempts: nextFailedCount,
                                lockoutMinutes: securityConfig.lockoutDurationMinutes,
                            },
                        });
                        return {
                            result: {
                                ok: false,
                                code: 'ACCOUNT_LOCKED',
                                message: 'Your account is temporarily locked. Please try again later or contact support.',
                            } satisfies LoginActionResult,
                            headers: null,
                        } satisfies LoginServiceWithCookiesResult;
                    }

                    await this.userRepository.incrementFailedLogin(existingUser.id);
                }

                this.logger.warn('auth.login.failure', {
                    action: LOGIN_ACTION,
                    event: 'login_failure',
                    orgSlug,
                    orgId,
                    userEmailMasked,
                    residency: dataResidency,
                    classification: dataClassification,
                    ipAddress: input.request.ipAddress ?? undefined,
                    userAgent: input.request.userAgent ?? undefined,
                    timestamp: new Date().toISOString(),
                    reason,
                });

                return { result: failure, headers: null } satisfies LoginServiceWithCookiesResult;
            }
        });
    }
}

