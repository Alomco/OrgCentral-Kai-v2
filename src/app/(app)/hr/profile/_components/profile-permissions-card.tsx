import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { EmployeeProfile } from '@/server/types/hr-types';

export interface ProfilePermissionsCardProps {
    authorization: RepositoryAuthorizationContext;
    profile?: EmployeeProfile | null;
    className?: string;
}

function formatResource(resource: string): string {
    return resource.replace(/\./g, ' / ');
}

export function ProfilePermissionsCard({
    authorization,
    profile,
    className,
}: ProfilePermissionsCardProps) {
    const roleName = authorization.roleName && authorization.roleName !== authorization.roleKey
        ? authorization.roleName
        : null;
    const profileRoles = Array.isArray(profile?.roles)
        ? profile.roles.filter((role): role is string => typeof role === 'string' && role.trim().length > 0)
        : [];
    const permissionEntries = Object.entries(authorization.permissions)
        .filter(([, actions]) => Array.isArray(actions) && actions.length > 0)
        .map(([resource, actions]) => ({
            resource,
            actions: Array.from(new Set(actions)).sort(),
        }))
        .sort((a, b) => a.resource.localeCompare(b.resource));

    return (
        <Card className={cn(className)}>
            <CardHeader>
                <CardTitle>Role and access</CardTitle>
                <CardDescription>Role scope, tenancy, and permission coverage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{authorization.roleKey}</Badge>
                    {roleName ? <Badge variant="outline">{roleName}</Badge> : null}
                    {profileRoles.map((role) => (
                        <Badge key={role} variant="outline">{role}</Badge>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">Org {authorization.orgId}</Badge>
                    <Badge variant="outline">{authorization.dataResidency}</Badge>
                    <Badge variant="outline">{authorization.dataClassification}</Badge>
                </div>

                <div className="space-y-2">
                    {permissionEntries.length === 0 ? (
                        <div className="text-muted-foreground">No permissions assigned.</div>
                    ) : (
                        permissionEntries.map((entry) => (
                            <div
                                key={entry.resource}
                                className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-border/60 px-3 py-2"
                            >
                                <div className="text-xs font-medium text-muted-foreground">
                                    {formatResource(entry.resource)}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {entry.actions.map((action) => (
                                        <Badge key={`${entry.resource}:${action}`} variant="secondary">
                                            {action}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
