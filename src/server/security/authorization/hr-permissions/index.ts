/**
 * HR Permissions Index
 *
 * Barrel file re-exporting all HR permission modules.
 *
 * @module hr-permissions
 */

// Resource types
export {
    HR_RESOURCE_TYPE,
    HR_RESOURCE,
    type HrResourceType,
    isHrResourceType,
} from './resources';

// Actions
export {
    HR_ACTION,
    type HrAction,
    isHrAction,
} from './actions';

// Permission profiles
export {
    HR_PERMISSION_PROFILE,
    type HrPermissionProfileKey,
} from './profiles';

// Composite permission profiles
export {
    HR_ANY_PERMISSION_PROFILE,
    type HrAnyPermissionProfileKey,
} from './composite';
