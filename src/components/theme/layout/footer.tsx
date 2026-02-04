/**
 * 🦶 Premium Footer Component
 * 
 * Elegant footer with gradient top border.
 * Server Component.
 * 
 * @module components/theme/layout/footer
 */

import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CurrentYear } from '@/components/theme/primitives/current-year';
import styles from './footer.module.css';

// ============================================================================
// Types
// ============================================================================

export interface FooterLink {
    label: string;
    href: string;
}

export interface FooterProps {
    /** Company/brand name */
    brandName?: string;
    /** Copyright year */
    year?: number;
    /** Navigation links */
    links?: FooterLink[];
    /** Social icons/buttons */
    socialContent?: ReactNode;
    /** Additional class */
    className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Premium footer with gradient border and flexible layout.
 */
export function Footer({
    brandName = 'OrgCentral',
    year,
    links = [],
    socialContent,
    className,
}: FooterProps) {
    const resolvedYear = typeof year === 'number' ? year : <CurrentYear />;

    return (
        <footer className={cn(styles.footer, className)}>
            <div className={styles.footerContent}>
                {/* Brand & Copyright */}
                <div className={styles.footerBrand}>
                    <div className={styles.footerLogo}>
                        <span className={styles.footerLogoIcon}>O</span>
                        <span>{brandName}</span>
                    </div>
                    <p className={styles.footerCopyright}>
                        © {resolvedYear} {brandName}. All rights reserved.
                    </p>
                </div>

                {/* Links */}
                {links.length > 0 && (
                    <nav className={styles.footerLinks}>
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={styles.footerLink}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                )}

                {/* Social */}
                {socialContent && (
                    <div className={styles.footerSocial}>{socialContent}</div>
                )}
            </div>
        </footer>
    );
}

// ============================================================================
// Minimal Footer
// ============================================================================

export interface MinimalFooterProps {
    className?: string;
}

/**
 * Compact footer for app layouts.
 */
export function MinimalFooter({ className }: MinimalFooterProps) {
    return (
        <footer className={cn('py-4 px-6 text-center text-sm text-muted-foreground', className)}>
            <p>© <CurrentYear /> OrgCentral. Built with ❤️</p>
        </footer>
    );
}
