/**
 * HR Permission Types
 *
 * Type definitions for the HR permission system.
 * These types enforce compile-time safety for permission checks.
 *
 * @module hr-permission-types
 */
import type { OrgPermissionMap, OrgRoleKey } from '@/server/security/access-control';
import type { HrAction, HrResourceType } from './hr-permissions';

// ============================================================================
// Permission Context Types
// ============================================================================

/**
 * Base context for HR permission evaluation.
 */
export interface HrPermissionContext {
    readonly orgId: string;
    readonly userId: string;
    readonly roleKey: OrgRoleKey | 'custom';
    readonly permissions: OrgPermissionMap;
}

/**
 * Extended context with target user information for ownership checks.
 */
export interface HrPermissionContextWithTarget extends HrPermissionContext {
    readonly targetUserId?: string;
    readonly targetOrgId?: string;
}

// ============================================================================
// ABAC Evaluation Types
// ============================================================================

/**
 * Input for ABAC policy evaluation in HR contexts.
 */
export interface HrAbacEvaluationInput {
    readonly orgId: string;
    readonly userId: string;
    readonly action: HrAction;
    readonly resourceType: HrResourceType;
    readonly roles?: readonly string[];
    readonly subjectAttributes?: Readonly<Record<string, unknown>>;
    readonly resourceAttributes?: Readonly<Record<string, unknown>>;
}

/**
 * Result of ABAC policy evaluation.
 */
export interface HrAbacEvaluationResult {
    readonly allowed: boolean;
    readonly reasons: readonly string[];
    readonly matchedPolicyId?: string;
}

// ============================================================================
// Guard Input Types
// ============================================================================

/**
 * Base input for HR guards.
 */
export interface HrGuardInput {
    readonly orgId: string;
    readonly userId: string;
    readonly auditSource?: string;
    readonly correlationId?: string;
}

/**
 * Input for HR guards with action/resource for ABAC.
 */
export interface HrGuardInputWithAbac extends HrGuardInput {
    readonly action: HrAction;
    readonly resourceType: HrResourceType;
    readonly resourceAttributes?: Readonly<Record<string, unknown>>;
}

/**
 * Input for HR guards with target user (for ownership checks).
 */
export interface HrGuardInputWithTarget extends HrGuardInput {
    readonly targetUserId: string;
}

// ============================================================================
// Permission Check Types
// ============================================================================

/**
 * Result of a permission check operation.
 */
export interface HrPermissionCheckResult {
    readonly allowed: boolean;
    readonly reasons: readonly string[];
    readonly context?: HrPermissionContext;
}

/**
 * Options for permission check operations.
 */
export interface HrPermissionCheckOptions {
    /** If true, throws on denial instead of returning false. */
    readonly throwOnDenial?: boolean;
    /** Custom error message for denial. */
    readonly denialMessage?: string;
    /** Source for audit logging. */
    readonly auditSource?: string;
}

// ============================================================================
// Actor Type Definitions
// ============================================================================

/**
 * Represents who is performing an HR action.
 */
export type HrActor =
    | { type: 'user'; userId: string; roleKey: OrgRoleKey | 'custom' }
    | { type: 'system'; source: string }
    | { type: 'worker'; workerId: string };

/**
 * Represents the target of an HR action.
 */
export type HrActionTarget =
    | { type: 'self' }
    | { type: 'user'; userId: string }
    | { type: 'team'; managerId: string }
    | { type: 'department'; departmentId: string }
    | { type: 'organization' };

// ============================================================================
// Ownership Types
// ============================================================================

/**
 * Ownership information for HR resources.
 */
export interface HrResourceOwnership {
    readonly ownerId?: string;
    readonly ownerOrgId?: string;
    readonly departmentId?: string;
    readonly managerId?: string;
}

/**
 * Determines relationship between actor and resource owner.
 */
export type HrOwnershipRelation =
    | 'self'        // Actor is the owner
    | 'manager'     // Actor is the owner's manager
    | 'department'  // Actor is in the same department
    | 'team'        // Actor manages the owner's team
    | 'org'         // Actor has org-wide access
    | 'none';       // No relationship

// ============================================================================
// Policy Builder Types
// ============================================================================

/**
 * Builder input for creating ABAC policies.
 */
export interface HrAbacPolicyInput {
    readonly id: string;
    readonly description?: string;
    readonly effect: 'allow' | 'deny';
    readonly actions: readonly HrAction[];
    readonly resources: readonly HrResourceType[];
    readonly condition?: HrAbacCondition;
    readonly priority?: number;
}

/**
 * Condition block for HR ABAC policies.
 */
export interface HrAbacCondition {
    readonly subject?: Readonly<Record<string, unknown>>;
    readonly resource?: Readonly<Record<string, unknown>>;
}

// ============================================================================
// Permission Requirement Types
// ============================================================================

/**
 * Describes what permissions are required for an operation.
 */
export interface HrPermissionRequirement {
    /** All of these must be satisfied. */
    readonly required?: OrgPermissionMap;
    /** At least one of these must be satisfied. */
    readonly anyOf?: readonly OrgPermissionMap[];
    /** ABAC action/resource for attribute checks. */
    readonly abac?: {
        readonly action: HrAction;
        readonly resourceType: HrResourceType;
    };
}

// ============================================================================
// Authorization Decision Types
// ============================================================================

/**
 * Full authorization decision with metadata.
 */
export interface HrAuthorizationDecision {
    readonly allowed: boolean;
    readonly reasons: readonly string[];
    readonly rbacPassed: boolean;
    readonly abacPassed: boolean;
    readonly ownershipPassed: boolean;
    readonly evaluatedAt: Date;
    readonly correlationId?: string;
}

// ============================================================================
// Type Utilities
// ============================================================================

/**
 * Extracts the action type from a permission profile key.
 * Example: 'ABSENCE_READ' -> 'read'
 */
export type ExtractActionFromProfile<T extends string> =
    T extends `${string}_${infer Action}` ? Lowercase<Action> : never;

/**
 * Creates a type-safe permission map from a profile key.
 */
export type PermissionMapFromProfile<T extends string> = Record<T, OrgPermissionMap>;

