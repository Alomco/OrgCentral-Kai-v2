import type { JsonRecord } from '@/server/types/json';

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  conditions: SecurityCondition[];
  actions: SecurityAction[];
  priority: number; // Lower numbers = higher priority
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityCondition {
  type: 'data_classification' | 'data_residency' | 'user_role' | 'ip_address' | 'time_based' | 'device_compliance' | 'mfa_status';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'matches_regex';
  value: string | number | boolean;
  attribute?: string; // For complex conditions
}

export interface SecurityAction {
  type: 'allow' | 'deny' | 'require_mfa' | 'log_event' | 'notify_admin' | 'quarantine_data' | 'restrict_access';
  parameters?: JsonRecord;
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  actions: SecurityAction[];
  matchedPolicies: SecurityPolicy[];
  decisionLog: string[];
}

export interface SecurityPolicyEngineOptions {
  enableCaching?: boolean;
  cacheTtlMs?: number;
  cacheMaxEntries?: number;
  logPolicyEvaluations?: boolean;
}
