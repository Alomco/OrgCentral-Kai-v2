/**
 * Repository contract for Integration Configurations
 * Following SOLID principles with clear separation of concerns
 */
import type { IntegrationConfig } from '@/server/types/hr-types';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';

export interface IIntegrationConfigRepository {
  /**
   * Create a new integration configuration
   */
  createIntegrationConfig(
    context: RepositoryAuthorizationContext,
    config: Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void>;

  /**
   * Update an existing integration configuration
   */
  updateIntegrationConfig(
    context: RepositoryAuthorizationContext,
    configId: string,
    updates: Partial<Omit<IntegrationConfig, 'id' | 'orgId' | 'createdAt'>>
  ): Promise<void>;

  /**
   * Get a specific integration configuration by ID
   */
  getIntegrationConfig(
    context: RepositoryAuthorizationContext,
    configId: string
  ): Promise<IntegrationConfig | null>;

  /**
   * Get integration configuration by provider
   */
  getIntegrationConfigByProvider(
    context: RepositoryAuthorizationContext,
    provider: string
  ): Promise<IntegrationConfig | null>;

  /**
   * Get all integration configurations for an organization
   */
  getIntegrationsByOrganization(
    context: RepositoryAuthorizationContext,
    filters?: {
      provider?: string;
      active?: boolean;
    }
  ): Promise<IntegrationConfig[]>;

  /**
   * Delete an integration configuration
   */
  deleteIntegrationConfig(
    context: RepositoryAuthorizationContext,
    configId: string
  ): Promise<void>;
}
