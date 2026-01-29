'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Spinner } from '@/components/ui/spinner';
import { HR_NOTIFICATION_TYPE_VALUES } from '@/server/types/hr/notifications';
import type { NotificationPreference } from '@/server/types/hr-types';
import { updateNotificationPreference } from './actions';
import { NotificationSettingsErrorSummary } from './notification-settings-error-summary';
import { NotificationChannelCard } from './notification-channel-card';
import {
  applyPreferenceUpdate,
  getDisabledTypesFromMetadata,
  getPreferenceMetadataObject,
  getPreferenceRetryDelay,
  type NotificationSettingsFormProps,
  NOTIFICATION_PREFERENCES_QUERY_KEY,
  type PreferenceMutationContext,
  fetchNotificationPreferences,
  type UpdatePreferenceInput,
} from './notification-settings-helpers';

export function NotificationSettingsForm({ preferences: initialPreferences }: NotificationSettingsFormProps) {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const errorSummaryReference = useRef<HTMLDivElement | null>(null);
  const { data: preferences = initialPreferences } = useQuery({
    queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY,
    queryFn: fetchNotificationPreferences,
    initialData: initialPreferences,
  });
  const updatePreferenceMutation = useMutation({
    mutationKey: NOTIFICATION_PREFERENCES_QUERY_KEY,
    retry: (attempt, error) => {
      if (error instanceof Error && error.message.toLowerCase().includes('not authorized')) {
        return false;
      }
      return attempt < 2;
    },
    retryDelay: getPreferenceRetryDelay,
    onMutate: async (input: UpdatePreferenceInput): Promise<PreferenceMutationContext> => {
      setErrorMessage(null);
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY });
      const previous = queryClient.getQueryData<NotificationPreference[]>(NOTIFICATION_PREFERENCES_QUERY_KEY);
      const optimistic = applyPreferenceUpdate(previous, input);
      if (optimistic) {
        queryClient.setQueryData(NOTIFICATION_PREFERENCES_QUERY_KEY, optimistic);
      }
      return { previous };
    },
    mutationFn: async (input: UpdatePreferenceInput) => {
      const result = await updateNotificationPreference(input);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data.preference;
    },
    onError: (error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTIFICATION_PREFERENCES_QUERY_KEY, context.previous);
      }
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update preference.');
    },
    onSuccess: (preference) => {
      if (!preference) {
        return;
      }
      setErrorMessage(null);
      queryClient.setQueryData<NotificationPreference[]>(NOTIFICATION_PREFERENCES_QUERY_KEY, (current) => {
        if (!current || current.length === 0) {
          return [preference];
        }
        return current.map((item) => (item.id === preference.id ? preference : item));
      });
    },
  });
  const activeMutations = useIsMutating({ mutationKey: NOTIFICATION_PREFERENCES_QUERY_KEY });
  const isPending = updatePreferenceMutation.isPending || activeMutations > 0;

  useEffect(() => {
    if (errorMessage) {
      errorSummaryReference.current?.focus();
    }
  }, [errorMessage]);

  const preferencesByChannel = useMemo(() => {
    const emailPreference = preferences.find((pref) => pref.channel === 'EMAIL');
    const inAppPreference = preferences.find((pref) => pref.channel === 'IN_APP');
    return { emailPreference, inAppPreference };
  }, [preferences]);

  const emailEnabled = preferencesByChannel.emailPreference?.enabled ?? true;
  const inAppEnabled = preferencesByChannel.inAppPreference?.enabled ?? true;

  const handleToggleChannel = (channel: 'EMAIL' | 'IN_APP', enabled: boolean) => {
    const pref = channel === 'EMAIL' ? preferencesByChannel.emailPreference : preferencesByChannel.inAppPreference;
    if (!pref) {
      return;
    }

    updatePreferenceMutation.mutate(
      { preferenceId: pref.id, enabled },
      {
        onSuccess: () => {
          toast.success(
            `${channel === 'EMAIL' ? 'Email' : 'In-app'} notifications ${enabled ? 'enabled' : 'disabled'}`,
          );
        },
        onError: () => {
          toast.error('Failed to update preference');
        },
      },
    );
  };

  const handleTypeToggle = (channel: 'EMAIL' | 'IN_APP', type: string, enabled: boolean) => {
    const pref = channel === 'EMAIL' ? preferencesByChannel.emailPreference : preferencesByChannel.inAppPreference;
    if (!pref) {
      return;
    }

    // We store disabled types in metadata to save space (assume enabled by default)
    const currentMetadata = getPreferenceMetadataObject(pref);
    const disabledTypes = getDisabledTypesFromMetadata(currentMetadata);

    let newDisabledTypes;
    if (enabled) {
      newDisabledTypes = disabledTypes.filter(t => t !== type);
    } else {
      newDisabledTypes = [...disabledTypes, type];
    }

    updatePreferenceMutation.mutate(
      {
        preferenceId: pref.id,
        metadata: {
          ...currentMetadata,
          disabledTypes: newDisabledTypes,
        },
      },
      {
        onError: () => {
          toast.error('Failed to update preference');
        },
      },
    );
  };

  const isTypeEnabled = (channel: 'EMAIL' | 'IN_APP', type: string) => {
    const pref = channel === 'EMAIL' ? preferencesByChannel.emailPreference : preferencesByChannel.inAppPreference;
    if (!pref) {
      return true;
    } // Default to enabled
    if (!pref.enabled) {
      return false;
    } // Parent switch overrides

    const metadata = getPreferenceMetadataObject(pref);
    const disabledTypes = getDisabledTypesFromMetadata(metadata);
    return !disabledTypes.includes(type);
  };

  return (
    <div className="space-y-6" aria-busy={isPending}>
      {errorMessage ? (
        <NotificationSettingsErrorSummary ref={errorSummaryReference} message={errorMessage} />
      ) : null}
      <NotificationChannelCard
        channel="EMAIL"
        title="Email Notifications"
        description="Receive notifications via email"
        helpId="email-notification-types-help"
        helpText="Toggle individual notification types. Disabled types are stored per channel."
        enabled={emailEnabled}
        isPending={isPending}
        types={HR_NOTIFICATION_TYPE_VALUES}
        onToggleChannel={(checked) => handleToggleChannel('EMAIL', checked)}
        isTypeEnabled={(type) => isTypeEnabled('EMAIL', type)}
        onTypeToggle={(type, checked) => handleTypeToggle('EMAIL', type, checked)}
      />

      <NotificationChannelCard
        channel="IN_APP"
        title="In-App Notifications"
        description="Receive notifications within the application"
        helpId="inapp-notification-types-help"
        helpText="Toggle individual notification types for in-app delivery."
        enabled={inAppEnabled}
        isPending={isPending}
        types={HR_NOTIFICATION_TYPE_VALUES}
        onToggleChannel={(checked) => handleToggleChannel('IN_APP', checked)}
        isTypeEnabled={(type) => isTypeEnabled('IN_APP', type)}
        onTypeToggle={(type, checked) => handleTypeToggle('IN_APP', type, checked)}
      />

      {isPending && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Spinner className="h-4 w-4" />
          Saving changes...
        </div>
      )}
    </div>
  );
}
