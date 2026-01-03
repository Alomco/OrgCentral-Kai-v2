import type { Prisma, $Enums } from '@prisma/client';
import type { EmployeeProfileDTO, EmploymentContractDTO } from './hr/people';

export type {
  PerformanceGoal,
  PerformanceGoalStatus,
  PerformanceReview,
  PerformanceReviewStatus,
  PerformanceReviewWithGoals,
} from '../domain/hr/performance/types';

type JsonValue = Prisma.JsonValue;

// Training record domain aligned to Prisma schema
export interface TrainingRecord {
  id: string;
  orgId: string;
  userId: string;
  courseName: string;
  provider: string;
  startDate: Date;
  endDate?: Date | null;
  expiryDate?: Date | null;
  renewalDate?: Date | null;
  status: string;
  certificate?: string | null;
  competency?: JsonValue;
  cost?: number | null;
  approved: boolean;
  approvedAt?: Date | null;
  approvedBy?: string | null;
  metadata?: JsonValue;
  createdAt: Date;
  updatedAt: Date;
}

// Employee profile domain aligned to Prisma schema
export type EmployeeProfile = EmployeeProfileDTO;

// Employment contract domain aligned to Prisma schema
export type EmploymentContract = EmploymentContractDTO;

// Security event domain aligned to Prisma schema
export interface SecurityEvent {
  id: string;
  orgId?: string | null;
  userId?: string | null;
  eventType: string;
  severity: string;
  description: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  additionalInfo?: JsonValue;
  resolved: boolean;
  resolvedAt?: Date | null;
  resolvedBy?: string | null;
  createdAt: Date;
}

// User session domain aligned to Prisma schema
export interface UserSession {
  id: string;
  userId: string;
  sessionId: string;
  status: $Enums.SessionStatus;
  ipAddress?: string | null;
  userAgent?: string | null;
  startedAt: Date;
  expiresAt: Date;
  lastAccess: Date;
  revokedAt?: Date | null;
  metadata?: JsonValue;
}

// Department domain aligned to Prisma schema
export interface Department {
  id: string;
  orgId: string;
  name: string;
  path?: string | null;
  leaderOrgId?: string | null;
  leaderUserId?: string | null;
  businessUnit?: string | null;
  costCenter?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Integration config domain aligned to Prisma schema
export interface IntegrationConfig {
  id: string;
  orgId: string;
  provider: string;
  credentials: JsonValue;
  settings: JsonValue;
  active: boolean;
  compliance?: JsonValue;
  createdAt: Date;
  updatedAt: Date;
}

// Notification preference domain aligned to Prisma schema
export interface NotificationPreference {
  id: string;
  orgId: string;
  userId: string;
  channel: $Enums.NotificationChannel;
  enabled: boolean;
  quietHours?: JsonValue;
  metadata?: JsonValue;
  updatedAt: Date;
}

// Role domain aligned to Prisma schema
export interface Role {
  id: string;
  orgId: string;
  name: string;
  description?: string | null;
  scope: $Enums.RoleScope;
  permissions: JsonValue;
  inheritsRoleIds?: string[];
  isSystem?: boolean;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User domain aligned to Prisma schema
export interface User {
  id: string;
  email: string;
  displayName?: string | null;
  status: $Enums.MembershipStatus;
  authProvider: string;
  lastLoginAt?: Date | null;
  failedLoginCount: number;
  lockedUntil?: Date | null;
  lastPasswordChange: Date;
  createdAt: Date;
  updatedAt: Date;
}
