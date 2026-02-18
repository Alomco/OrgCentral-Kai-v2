import type { SecurityAlert } from '@/server/types/enhanced-security-types';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import { assertOrgAccessWithAbac } from '@/server/security/guards';
import { AbstractBaseService } from '@/server/services/abstract-base-service';
import type {
  CreateSecurityAlertInput,
  ResolveSecurityAlertInput,
  SecurityAlertServiceDependencies,
  SecurityAlertServiceOptions,
  UpdateSecurityAlertInput,
} from './security-alert-contracts';
import {
  type AlertHandlerContext,
  handleCreateAlert,
  handleEscalateAlert,
  handleResolveAlert,
  handleUpdateAlert,
} from './security-alert-handlers';

export class SecurityAlertService extends AbstractBaseService {
  private readonly handlerContext: AlertHandlerContext;

  constructor(
    private readonly dependencies: SecurityAlertServiceDependencies,
    options: SecurityAlertServiceOptions = {},
  ) {
    super();
    this.handlerContext = this.createAlertHandlerContext(options);
  }

  async createAlert(
    context: RepositoryAuthorizationContext,
    input: CreateSecurityAlertInput,
  ): Promise<SecurityAlert> {
    return handleCreateAlert(this.handlerContext, context, input);
  }

  async getAlert(context: RepositoryAuthorizationContext, alertId: string): Promise<SecurityAlert | null> {
    const alert = await this.dependencies.securityAlertRepository.getAlert(context, alertId);
    if (alert && alert.orgId !== context.orgId) {
      return null;
    }
    return alert;
  }

  async getAlertsByOrg(
    context: RepositoryAuthorizationContext,
    filters?: {
      status?: string;
      priority?: string;
      severity?: string;
      assignedTo?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<SecurityAlert[]> {
    return this.dependencies.securityAlertRepository.getAlertsByOrg(context, filters);
  }

  async updateAlert(
    context: RepositoryAuthorizationContext,
    input: UpdateSecurityAlertInput,
  ): Promise<SecurityAlert> {
    return handleUpdateAlert(this.handlerContext, context, input);
  }

  async resolveAlert(
    context: RepositoryAuthorizationContext,
    input: ResolveSecurityAlertInput,
  ): Promise<SecurityAlert> {
    return handleResolveAlert(this.handlerContext, context, input);
  }

  async escalateAlert(context: RepositoryAuthorizationContext, alertId: string): Promise<SecurityAlert> {
    return handleEscalateAlert(this.handlerContext, context, alertId);
  }

  async countAlertsByOrg(
    context: RepositoryAuthorizationContext,
    filters?: {
      status?: string;
      priority?: string;
      severity?: string;
      assignedTo?: string;
    },
  ): Promise<number> {
    return this.dependencies.securityAlertRepository.countAlertsByOrg(context, filters);
  }

  private createAlertHandlerContext(options: SecurityAlertServiceOptions): AlertHandlerContext {
    return {
      dependencies: this.dependencies,
      options: {
        autoEscalateCriticalAlerts: options.autoEscalateCriticalAlerts ?? true,
        notificationEnabled: options.notificationEnabled ?? true,
      },
      guard: this.dependencies.guard ?? assertOrgAccessWithAbac,
    };
  }
}