import { buildEnterpriseSettingsServiceDependencies, type EnterpriseSettingsServiceDependencies } from '@/server/repositories/providers/platform/settings/enterprise-settings-service-dependencies';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { AbstractBaseService, type ServiceExecutionContext } from '@/server/services/abstract-base-service';
import { getEnterpriseSettings, type GetEnterpriseSettingsResult } from '@/server/use-cases/platform/settings/get-enterprise-settings';
import { updateEnterpriseSettings, type UpdateEnterpriseSettingsResult } from '@/server/use-cases/platform/settings/update-enterprise-settings';
import type { EnterpriseSettings } from '@/server/types/platform-types';

const defaultDependencies = buildEnterpriseSettingsServiceDependencies();

export interface EnterpriseSettingsServiceContract {
    getSettings(authorization: RepositoryAuthorizationContext): Promise<GetEnterpriseSettingsResult>;
    updateSettings(
        authorization: RepositoryAuthorizationContext,
        updates: Partial<EnterpriseSettings>,
    ): Promise<UpdateEnterpriseSettingsResult>;
}

export class EnterpriseSettingsService extends AbstractBaseService implements EnterpriseSettingsServiceContract {
    constructor(private readonly dependencies: EnterpriseSettingsServiceDependencies) {
        super();
    }

    async getSettings(authorization: RepositoryAuthorizationContext): Promise<GetEnterpriseSettingsResult> {
        return this.runOperation<GetEnterpriseSettingsResult>(
            'platform.settings.enterprise.get',
            authorization,
            undefined,
            () => getEnterpriseSettings(this.dependencies, { authorization }),
        );
    }

    async updateSettings(
        authorization: RepositoryAuthorizationContext,
        updates: Partial<EnterpriseSettings>,
    ): Promise<UpdateEnterpriseSettingsResult> {
        return this.runOperation<UpdateEnterpriseSettingsResult>(
            'platform.settings.enterprise.update',
            authorization,
            undefined,
            () => updateEnterpriseSettings(this.dependencies, { authorization, updates }),
        );
    }

    private runOperation<TResult>(
        operation: string,
        authorization: RepositoryAuthorizationContext,
        metadata: Record<string, unknown> | undefined,
        handler: () => Promise<TResult>,
    ): Promise<TResult> {
        const context = this.buildContext(authorization, { metadata });
        return this.executeInServiceContext(context, operation, handler);
    }

    private buildContext(
        authorization: RepositoryAuthorizationContext,
        options?: Omit<ServiceExecutionContext, 'authorization'>,
    ): ServiceExecutionContext {
        return {
            authorization,
            correlationId: options?.correlationId ?? authorization.correlationId,
            metadata: options?.metadata,
        };
    }
}

function resolveDependencies(
    overrides?: Partial<EnterpriseSettingsServiceDependencies>,
): EnterpriseSettingsServiceDependencies {
    if (!overrides) {
        return defaultDependencies;
    }
    return { ...defaultDependencies, ...overrides };
}

const sharedService = new EnterpriseSettingsService(defaultDependencies);

export function getEnterpriseSettingsService(
    overrides?: Partial<EnterpriseSettingsServiceDependencies>,
): EnterpriseSettingsService {
    if (!overrides) {
        return sharedService;
    }
    return new EnterpriseSettingsService(resolveDependencies(overrides));
}

export async function fetchEnterpriseSettings(
    authorization: RepositoryAuthorizationContext,
    overrides?: Partial<EnterpriseSettingsServiceDependencies>,
): Promise<GetEnterpriseSettingsResult> {
    return getEnterpriseSettingsService(overrides).getSettings(authorization);
}

export async function saveEnterpriseSettings(
    authorization: RepositoryAuthorizationContext,
    updates: Partial<EnterpriseSettings>,
    overrides?: Partial<EnterpriseSettingsServiceDependencies>,
): Promise<UpdateEnterpriseSettingsResult> {
    return getEnterpriseSettingsService(overrides).updateSettings(authorization, updates);
}

export type { EnterpriseSettings };