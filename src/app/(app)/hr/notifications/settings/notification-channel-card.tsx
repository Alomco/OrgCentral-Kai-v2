import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { NotificationSettingsTypeHelp } from './notification-settings-type-help';

export type NotificationChannel = 'EMAIL' | 'IN_APP';

interface NotificationChannelCardProps {
    channel: NotificationChannel;
    title: string;
    description: string;
    helpId: string;
    helpText: string;
    enabled: boolean;
    isPending: boolean;
    types: readonly string[];
    onToggleChannel: (checked: boolean) => void;
    isTypeEnabled: (type: string) => boolean;
    onTypeToggle: (type: string, checked: boolean) => void;
}

export function NotificationChannelCard(props: NotificationChannelCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <CardTitle>{props.title}</CardTitle>
                        <CardDescription>{props.description}</CardDescription>
                    </div>
                    <Switch
                        checked={props.enabled}
                        onCheckedChange={props.onToggleChannel}
                        disabled={props.isPending}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <NotificationSettingsTypeHelp id={props.helpId} text={props.helpText} />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {props.types.map((type) => (
                        <div key={`${props.channel}-${type}`} className="flex items-center space-x-2">
                            <span id={`${props.channel.toLowerCase()}-${type}-help`} className="sr-only">
                                {`Toggle ${type.replace(/-/g, ' ')} ${props.title.toLowerCase()} alerts.`}
                            </span>
                            <Switch
                                id={`${props.channel.toLowerCase()}-${type}`}
                                checked={props.isTypeEnabled(type)}
                                onCheckedChange={(checked) => props.onTypeToggle(type, checked)}
                                aria-describedby={`${props.helpId} ${props.channel.toLowerCase()}-${type}-help`}
                                disabled={props.isPending || !props.enabled}
                            />
                            <Label htmlFor={`${props.channel.toLowerCase()}-${type}`} className="text-sm font-normal">
                                {type.replace(/-/g, ' ')}
                            </Label>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
