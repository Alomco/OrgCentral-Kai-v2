import type { IPlatformToolsRepository } from '@/server/repositories/contracts/platform/admin/platform-tools-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { PlatformToolExecution } from '@/server/types/platform/platform-tools';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import { platformToolExecutionSchema } from '@/server/validators/platform/admin/platform-tool-validators';
import { loadPlatformSettingJson, savePlatformSettingJson } from '@/server/repositories/prisma/platform/settings/platform-settings-json-store';

const PLATFORM_TOOL_EXECUTIONS_KEY = 'platform-tool-executions';

export class PrismaPlatformToolsRepository extends BasePrismaRepository implements IPlatformToolsRepository {
    async listExecutions(context: RepositoryAuthorizationContext): Promise<PlatformToolExecution[]> {
        const executions = await loadPlatformSettingJson(
            { prisma: this.prisma },
            PLATFORM_TOOL_EXECUTIONS_KEY,
            platformToolExecutionSchema.array(),
            [],
        );
        return executions.filter((execution) => execution.orgId === context.orgId);
    }

    async createExecution(
        context: RepositoryAuthorizationContext,
        execution: PlatformToolExecution,
    ): Promise<PlatformToolExecution> {
        const executions = await this.listExecutions(context);
        const next = [execution, ...executions];
        await savePlatformSettingJson({ prisma: this.prisma }, PLATFORM_TOOL_EXECUTIONS_KEY, next);
        return execution;
    }

    async updateExecution(
        context: RepositoryAuthorizationContext,
        execution: PlatformToolExecution,
    ): Promise<PlatformToolExecution> {
        const executions = await this.listExecutions(context);
        const next = executions.map((item) => (item.id === execution.id ? execution : item));
        await savePlatformSettingJson({ prisma: this.prisma }, PLATFORM_TOOL_EXECUTIONS_KEY, next);
        return execution;
    }
}
