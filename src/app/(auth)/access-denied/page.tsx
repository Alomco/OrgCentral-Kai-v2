import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import AuthLayout from '@/components/auth/AuthLayout';
import accessDeniedImage from '@/assets/errors/access_denied.webp';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/auth/LogoutButton';

export const metadata: Metadata = {
    title: 'Access denied | OrgCentral',
    description: 'You do not have permission to view this page.',
};

export default function AccessDeniedPage() {
    return (
        <AuthLayout
            title="Access denied"
            subtitle="Your account doesn’t have permission for this area. Try switching accounts or request access."
        >
            <div className="w-full max-w-3xl rounded-3xl bg-[hsl(var(--card)/0.6)] p-8 text-center shadow-[0_20px_70px_-40px_hsl(var(--primary)/0.65)] backdrop-blur">
                <div className="flex flex-col items-center gap-6">
                    <Image
                        src={accessDeniedImage}
                        alt="Access denied"
                        width={240}
                        height={240}
                        className="h-48 w-48 drop-shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
                        priority
                    />
                    <p className="text-base text-[hsl(var(--foreground))]">
                        If you believe this is a mistake, contact your admin and include the workspace you’re trying to reach.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Button asChild className="px-6 py-2 text-sm font-semibold">
                            <Link href="/login">Switch account</Link>
                        </Button>
                        <LogoutButton label="Sign out" variant="outline" size="sm" className="px-6 py-2 text-sm font-semibold" />
                        <Button asChild variant="ghost" className="px-6 py-2 text-sm font-semibold">
                            <Link href="mailto:support@orgcentral.test?subject=Access%20request">Request access</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
