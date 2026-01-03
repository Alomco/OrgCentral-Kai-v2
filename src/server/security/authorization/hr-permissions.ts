/**
 * Centralized HR Permission Registry
 *
 * Re-exports from split modules for backwards compatibility.
 *
 * @module hr-permissions
 * @see hr-permissions/index for the split implementation
 */
export {
    HR_RESOURCE_TYPE,
    HR_RESOURCE,
    type HrResourceType,
    isHrResourceType,
    HR_ACTION,
    type HrAction,
    isHrAction,
    HR_PERMISSION_PROFILE,
    type HrPermissionProfileKey,
    HR_ANY_PERMISSION_PROFILE,
    type HrAnyPermissionProfileKey,
} from './hr-permissions/index';
