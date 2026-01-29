import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { PermissionResource } from '@/server/types/security-types';

import { PermissionResourceManager } from './permission-resource-manager';

export async function PermissionResourcePanel(props: { orgId: string; resourcesPromise: Promise<PermissionResource[]>; }) {
    const resources = await props.resourcesPromise;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Permission resource registry</CardTitle>
                <CardDescription>
                    Define resource keys and supported actions for roles and ABAC policies.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <PermissionResourceManager orgId={props.orgId} resources={resources} />
            </CardContent>
        </Card>
    );
}

