import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { type Metadata } from 'next';
import { headers as nextHeaders } from 'next/headers';
import Link from 'next/link';
import { Bell } from 'lucide-react';

import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { NotificationList } from './_components/notification-list';
const NotificationFilters = dynamic(
  () => import('./_components/notification-filters').then((module) => module.NotificationFilters),
  { loading: () => <Skeleton className="h-10 w-full rounded-lg" /> },
);
import { notificationFilterSchema, type NotificationFilters } from './_schemas/filter-schema';
import { listHrNotifications } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { HrPageHeader } from '../_components/hr-page-header';
import { Button } from '@/components/ui/button';

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
    <div className="flex h-full flex-col space-y-6 px-4 sm:px-6">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/hr">HR</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Notifications</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <HrPageHeader
        title="Notifications"
        description="Stay updated with HR tasks and announcements."
        icon={<Bell className="h-5 w-5" />}
        actions={(
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/hr/notifications/settings">Notification settings</Link>
          </Button>
        )}
      />

      <NotificationFilters />

      <Suspense fallback={<NotificationsLoading />}>
        <NotificationListSection notificationsPromise={notificationsPromise} filters={filters} />
      </Suspense>
      </div>
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
