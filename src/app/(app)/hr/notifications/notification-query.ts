import type { NotificationFilters } from './_schemas/filter-schema';
import { listHrNotifications } from './actions';

export const HR_NOTIFICATIONS_QUERY_KEY = ['hr', 'notifications'] as const;
export const HR_NOTIFICATION_DROPDOWN_FILTERS: NotificationFilters = { limit: 5, page: 1 };

export function buildHrNotificationsQueryKey(filters: NotificationFilters) {
  return [...HR_NOTIFICATIONS_QUERY_KEY, filters] as const;
}

export async function fetchHrNotifications(filters: NotificationFilters) {
  return listHrNotifications(filters);
}
