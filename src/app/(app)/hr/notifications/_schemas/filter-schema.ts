import { z } from 'zod';
import { HR_NOTIFICATION_PRIORITY_VALUES, HR_NOTIFICATION_TYPE_VALUES } from '@/server/types/hr/notifications';

const MAX_NOTIFICATION_LIMIT = 50;

export const notificationFilterSchema = z.object({
  unreadOnly: z.coerce.boolean().optional(),
  type: z.enum(HR_NOTIFICATION_TYPE_VALUES).optional(),
  priority: z.enum(HR_NOTIFICATION_PRIORITY_VALUES).optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(MAX_NOTIFICATION_LIMIT).optional(),
});

export type NotificationFilters = z.infer<typeof notificationFilterSchema>;
