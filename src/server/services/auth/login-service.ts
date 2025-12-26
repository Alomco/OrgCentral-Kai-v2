import type { LoginActionResult } from '@/features/auth/login/login-contracts';
import type { auth } from '@/server/lib/auth';
import { AbstractBaseService } from '@/server/services/abstract-base-service';
import type { IOrganizationRepository } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import type { OrganizationData } from '@/server/types/leave-types';
import {
    buildPostLoginCallbackUrl,
    buildServiceContext,
    isOrganizationData,
    normalizeAuthError,
} from './login-service.helpers';

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

    constructor(dependencies: LoginServiceDependencies) {
        super();
        this.authClient = dependencies.authClient;
        this.organizationRepository = dependencies.organizationRepository;
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
                    userEmail: input.credentials.email,
                    residency: dataResidency,
                    classification: dataClassification,
                    ipAddress: input.request.ipAddress ?? null,
                    userAgent: input.request.userAgent ?? null,
                    timestamp: new Date().toISOString(),
                });

                return {
                    result: {
                        ok: true,
                        message: 'Login successful. Redirecting you now…',
                        redirectUrl: payload.url ?? '/app',
                    } satisfies LoginActionResult,
                    headers,
                } satisfies LoginServiceWithCookiesResult;
            } catch (error) {
                const failure = normalizeAuthError(error);

                const reason = failure.code ?? 'UNKNOWN';

                this.logger.warn('auth.login.failure', {
                    action: LOGIN_ACTION,
                    event: 'login_failure',
                    orgSlug,
                    orgId,
                    userEmail: input.credentials.email,
                    residency: dataResidency,
                    classification: dataClassification,
                    ipAddress: input.request.ipAddress ?? null,
                    userAgent: input.request.userAgent ?? null,
                    timestamp: new Date().toISOString(),
                    reason,
                });

                return { result: failure, headers: null } satisfies LoginServiceWithCookiesResult;
            }
        });
    }
}

