import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function OrgSectionNav() {
    return (
        <nav aria-label="Organization sections" className="flex flex-wrap items-center gap-2">
            <Button asChild variant="secondary" size="sm">
                <Link href="/org/profile">Profile</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
                <Link href="/org/members">Members</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
                <Link href="/org/roles">Roles</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
                <Link href="/org/permissions">Permissions</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
                <Link href="/org/abac">ABAC Policies</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
                <Link href="/org/branding">Branding</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
                <Link href="/org/settings">Settings</Link>
            </Button>
        </nav>
    );
}
