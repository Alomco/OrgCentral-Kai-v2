'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { NotificationPreference } from '@/server/types/hr-types';
import { HR_NOTIFICATION_TYPE_VALUES } from '@/server/types/hr/notifications';
import { updateNotificationPreference } from './actions';

interface NotificationSettingsFormProps {
  preferences: NotificationPreference[];
}

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
interface JsonObject {
  readonly [key: string]: JsonValue;
}

export function NotificationSettingsForm({ preferences }: NotificationSettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  // Helper to find preference by channel
  const getPreference = (channel: 'EMAIL' | 'IN_APP') => 
    preferences.find(p => p.channel === channel);

  const emailPreference = getPreference('EMAIL');
  const inAppPreference = getPreference('IN_APP');
  const emailEnabled = emailPreference?.enabled ?? true;
  const inAppEnabled = inAppPreference?.enabled ?? true;

  const metadataObject = (preference: NotificationPreference): JsonObject => {
    const metadata = preference.metadata;
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return {};
    }
    return metadata as JsonObject;
  };

  const disabledTypesFromMetadata = (metadata: JsonObject): string[] => {
    const value = metadata.disabledTypes;
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((item): item is string => typeof item === 'string');
  };

  const handleToggleChannel = (channel: 'EMAIL' | 'IN_APP', enabled: boolean) => {
    const pref = getPreference(channel);
    if (!pref) {
      return;
    } // Should not happen if seeded

    startTransition(async () => {
      const result = await updateNotificationPreference({
        preferenceId: pref.id,
        enabled,
      });

      if (result.success) {
        toast.success(`${channel === 'EMAIL' ? 'Email' : 'In-app'} notifications ${enabled ? 'enabled' : 'disabled'}`);
      } else {
        toast.error('Failed to update preference');
      }
    });
  };

  const handleTypeToggle = (channel: 'EMAIL' | 'IN_APP', type: string, enabled: boolean) => {
    const pref = getPreference(channel);
    if (!pref) {
      return;
    }

    // We store disabled types in metadata to save space (assume enabled by default)
    const currentMetadata = metadataObject(pref);
    const disabledTypes = disabledTypesFromMetadata(currentMetadata);
    
    let newDisabledTypes;
    if (enabled) {
      newDisabledTypes = disabledTypes.filter(t => t !== type);
    } else {
      newDisabledTypes = [...disabledTypes, type];
    }

    startTransition(async () => {
      const result = await updateNotificationPreference({
        preferenceId: pref.id,
        metadata: {
          ...currentMetadata,
          disabledTypes: newDisabledTypes,
        },
      });

      if (!result.success) {
        toast.error('Failed to update preference');
      }
    });
  };

  const isTypeEnabled = (channel: 'EMAIL' | 'IN_APP', type: string) => {
    const pref = getPreference(channel);
    if (!pref) {
      return true;
    } // Default to enabled
    if (!pref.enabled) {
      return false;
    } // Parent switch overrides

    const metadata = metadataObject(pref);
    const disabledTypes = disabledTypesFromMetadata(metadata);
    return !disabledTypes.includes(type);
  };

  return (
    <div className="space-y-6">
      {/* Email Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Receive notifications via email
              </CardDescription>
            </div>
            <Switch
              checked={emailEnabled}
              onCheckedChange={(checked) => handleToggleChannel('EMAIL', checked)}
              disabled={isPending}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HR_NOTIFICATION_TYPE_VALUES.map((type) => (
              <div key={`email-${type}`} className="flex items-center space-x-2">
                <Switch
                  id={`email-${type}`}
                  checked={isTypeEnabled('EMAIL', type)}
                  onCheckedChange={(checked) => handleTypeToggle('EMAIL', type, checked)}
                  disabled={isPending || !emailEnabled}
                />
                <Label htmlFor={`email-${type}`} className="text-sm font-normal">
                  {type.replace(/-/g, ' ')}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* In-App Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle>In-App Notifications</CardTitle>
              <CardDescription>
                Receive notifications within the application
              </CardDescription>
            </div>
            <Switch
              checked={inAppEnabled}
              onCheckedChange={(checked) => handleToggleChannel('IN_APP', checked)}
              disabled={isPending}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HR_NOTIFICATION_TYPE_VALUES.map((type) => (
              <div key={`inapp-${type}`} className="flex items-center space-x-2">
                <Switch
                  id={`inapp-${type}`}
                  checked={isTypeEnabled('IN_APP', type)}
                  onCheckedChange={(checked) => handleTypeToggle('IN_APP', type, checked)}
                  disabled={isPending || !inAppEnabled}
                />
                <Label htmlFor={`inapp-${type}`} className="text-sm font-normal">
                  {type.replace(/-/g, ' ')}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isPending && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving changes...
        </div>
      )}
    </div>
  );
}
