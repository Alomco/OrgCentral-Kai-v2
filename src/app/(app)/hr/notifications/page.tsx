import { Suspense } from 'react';
import { type Metadata } from 'next';
import { headers as nextHeaders } from 'next/headers';

import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { getHrNotificationsAction } from '@/server/api-adapters/hr/notifications/get-hr-notifications';
import { NotificationList } from './_components/notification-list';
import { NotificationFilters } from './_components/notification-filters';
import { notificationFilterSchema } from './_schemas/filter-schema';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Notifications | HR',
  description: 'Manage your HR notifications',
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NotificationsPage({ searchParams }: PageProps) {
  const headerStore = await nextHeaders();
  const { authorization, session } = await getSessionContextOrRedirect({}, {
    headers: headerStore,
    requiredPermissions: { organization: ['read'] },
    auditSource: 'page:hr:notifications',
  });

  const resolvedParams = await searchParams;
  const parseResult = notificationFilterSchema.safeParse(resolvedParams);
  
  const filters = parseResult.success ? parseResult.data : {};
  
  const { notifications } = await getHrNotificationsAction({
    authorization,
    userId: session.user.id,
    filters: {
      ...filters,
      limit: 50, // Page size
    },
  });

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          Stay updated with your HR tasks and announcements.
        </p>
      </div>

      <NotificationFilters />

      <Suspense fallback={<NotificationsLoading />}>
        <NotificationList notifications={notifications} />
      </Suspense>
    </div>
  );
}

function NotificationsLoading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
