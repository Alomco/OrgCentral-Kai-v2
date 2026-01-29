import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { type Metadata } from 'next';
import { headers as nextHeaders } from 'next/headers';

import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { NotificationList } from './_components/notification-list';
const NotificationFilters = dynamic(
  () => import('./_components/notification-filters').then((module) => module.NotificationFilters),
  { loading: () => <Skeleton className="h-10 w-full rounded-lg" /> },
);
import { notificationFilterSchema, type NotificationFilters } from './_schemas/filter-schema';
import { listHrNotifications } from './actions';
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
  await getSessionContextOrRedirect({}, {
    headers: headerStore,
    requiredPermissions: { organization: ['read'] },
    auditSource: 'page:hr:notifications',
  });

  const resolvedParams = await searchParams;
  const parseResult = notificationFilterSchema.safeParse(resolvedParams);

  const filters = parseResult.success ? parseResult.data : notificationFilterSchema.parse({});

  const notificationsPromise = listHrNotifications(filters);

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          Stay updated with your HR tasks and announcements.
        </p>
      </div>

      <NotificationFilters />

      <Suspense fallback={<NotificationsLoading />}>
        <NotificationListSection notificationsPromise={notificationsPromise} filters={filters} />
      </Suspense>
    </div>
  );
}

async function NotificationListSection({
  notificationsPromise,
  filters,
}: {
  notificationsPromise: ReturnType<typeof listHrNotifications>;
  filters: NotificationFilters;
}) {
  const { notifications, unreadCount } = await notificationsPromise;
  return (
    <NotificationList
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
      filters={filters}
    />
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
