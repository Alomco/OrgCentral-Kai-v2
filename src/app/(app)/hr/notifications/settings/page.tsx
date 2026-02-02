import { Suspense } from 'react';
import { type Metadata } from 'next';
import { headers as nextHeaders } from 'next/headers';
import Link from 'next/link';
import { Bell } from 'lucide-react';

import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { getNotificationPreferencesAction } from '@/server/api-adapters/hr/notifications/get-notification-preferences';
import { NotificationSettingsForm } from './notification-settings-form';
import { Skeleton } from '@/components/ui/skeleton';
import { ensureDefaultNotificationPreferences } from '@/server/use-cases/notifications/ensure-default-preferences';
import { PrismaNotificationPreferenceRepository } from '@/server/repositories/prisma/org/notifications';
import { registerNotificationPreferenceCacheTag } from '@/server/use-cases/notifications/cache-helpers';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { HrPageHeader } from '../../_components/hr-page-header';

export const metadata: Metadata = {
  title: 'Notification Settings | HR',
  description: 'Manage your notification preferences',
};

async function getPreferencesWithCache(
  authorization: RepositoryAuthorizationContext,
  userId: string,
) {
  'use cache';
  registerNotificationPreferenceCacheTag(authorization);
  return getNotificationPreferencesAction({ authorization, userId });
}

export default async function NotificationSettingsPage() {
  const headerStore = await nextHeaders();
  const { authorization, session } = await getSessionContextOrRedirect({}, {
    headers: headerStore,
    requiredPermissions: { organization: ['read'] },
    auditSource: 'page:hr:notifications:settings',
  });

  // Ensure defaults exist
  const repo = new PrismaNotificationPreferenceRepository();
  await ensureDefaultNotificationPreferences(
    { preferenceRepository: repo },
    { authorization, userId: session.user.id }
  );

  const { preferences } = await getPreferencesWithCache(authorization, session.user.id);

  return (
    <div className="flex flex-col h-full space-y-6 max-w-4xl mx-auto px-4 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/hr">HR</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/hr/notifications">Notifications</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <HrPageHeader
        title="Notification settings"
        description="Choose how you want to receive HR updates. You can change this anytime."
        icon={<Bell className="h-5 w-5" />}
      />

      <Suspense fallback={<SettingsLoading />}>
        <NotificationSettingsForm preferences={preferences} />
      </Suspense>
    </div>
  );
}

function SettingsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[200px] w-full rounded-xl" />
      <Skeleton className="h-[200px] w-full rounded-xl" />
    </div>
  );
}
