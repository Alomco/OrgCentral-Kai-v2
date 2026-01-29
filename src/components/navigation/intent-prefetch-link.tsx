'use client';

import { useCallback, useMemo, type ReactNode } from 'react';
import Link, { type LinkProps } from 'next/link';
import { useRouter } from 'next/navigation';

interface IntentPrefetchLinkProps extends LinkProps {
    className?: string;
    children: ReactNode;
}

function toHrefString(href: LinkProps['href']): string {
    if (typeof href === 'string') {
        return href;
    }
    const pathname = href.pathname ?? '';
    const hash = href.hash ? (href.hash.startsWith('#') ? href.hash : `#${href.hash}`) : '';
    const searchParams = new URLSearchParams();
    if (href.query && typeof href.query === 'object') {
        Object.entries(href.query).forEach(([key, value]) => {
            if (value === undefined) {
                return;
            }
            if (Array.isArray(value)) {
                value.forEach((entry) => searchParams.append(key, String(entry)));
            } else {
                searchParams.append(key, String(value));
            }
        });
    }
    const search = searchParams.toString();
    return `${pathname}${search ? `?${search}` : ''}${hash}`;
}

export function IntentPrefetchLink({ href, className, children, ...props }: IntentPrefetchLinkProps) {
    const router = useRouter();
    const hrefString = useMemo(() => toHrefString(href), [href]);

    const handleIntentPrefetch = useCallback(() => {
        router.prefetch(hrefString);
    }, [hrefString, router]);

    return (
        <Link
            href={href}
            className={className}
            prefetch={false}
            onMouseEnter={handleIntentPrefetch}
            onFocus={handleIntentPrefetch}
            {...props}
        >
            {children}
        </Link>
    );
}
