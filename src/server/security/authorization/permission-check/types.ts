/**
 * Permission Check Types
 *
 * Type definitions for permission check results.
 *
 * @module permission-check/types
 */

export interface PermissionCheckResult {
    readonly allowed: boolean;
    readonly reason?: string;
}
