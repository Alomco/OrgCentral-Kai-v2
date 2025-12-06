import { AbstractHrService } from '@/server/services/hr/abstract-hr-service';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { ServiceExecutionContext } from '@/server/services/abstract-base-service';
import { getComplianceStatus, type GetComplianceStatusDependencies } from '@/server/use-cases/hr/compliance/get-compliance-status';

export type ComplianceStatusServiceDependencies = GetComplianceStatusDependencies;

export class ComplianceStatusService extends AbstractHrService {
  constructor(private readonly dependencies: ComplianceStatusServiceDependencies) {
    super();
  }

  async getStatusForUser(authorization: RepositoryAuthorizationContext, userId: string) {
    await this.ensureOrgAccess(authorization);
    return this.runOperation('hr.compliance.status.get', authorization, { userId }, () =>
      getComplianceStatus(this.dependencies, { authorization, userId }),
    );
  }

  private runOperation<TResult>(
    operation: string,
    authorization: RepositoryAuthorizationContext,
    metadata: Record<string, unknown>,
    handler: () => Promise<TResult>,
  ): Promise<TResult> {
    const context: ServiceExecutionContext = this.buildContext(authorization, { metadata });
    return this.executeInServiceContext(context, operation, handler);
  }
}
