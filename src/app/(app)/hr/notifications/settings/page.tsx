import { Suspense } from 'react';
import { type Metadata } from 'next';
import { headers as nextHeaders } from 'next/headers';

import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { getNotificationPreferencesAction } from '@/server/api-adapters/hr/notifications/get-notification-preferences';
import { NotificationSettingsForm } from './notification-settings-form';
import { Skeleton } from '@/components/ui/skeleton';
import { ensureDefaultNotificationPreferences } from '@/server/use-cases/notifications/ensure-default-preferences';
import { PrismaNotificationPreferenceRepository } from '@/server/repositories/prisma/org/notifications';

export const metadata: Metadata = {
  title: 'Notification Settings | HR',
  description: 'Manage your notification preferences',
};

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

  const { preferences } = await getNotificationPreferencesAction({
    authorization,
    userId: session.user.id,
  });

  return (
    <div className="flex flex-col h-full p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Notification Settings</h1>
        <p className="text-muted-foreground">
          Choose which notifications you want to receive and how.
        </p>
      </div>

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
