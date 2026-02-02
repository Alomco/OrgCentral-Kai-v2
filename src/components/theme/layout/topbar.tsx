/**
 * 🔝 Premium Topbar Component
 * 
 * Glassmorphism header with premium styling.
 * Server Component shell with client islands.
 * 
 * @module components/theme/layout/topbar
 */

import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import styles from './topbar.module.css';

// ============================================================================
// Types
// ============================================================================

export interface TopbarProps {
    /** Logo/brand element or company name */
    logo?: ReactNode;
    /** Logo link destination */
    logoHref?: string;
    /** Left side content (after logo) */
    leftContent?: ReactNode;
    /** Center content (search, etc.) */
    centerContent?: ReactNode;
    /** Right side actions */
    actions?: ReactNode;
    /** Additional class name */
    className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Premium glassmorphism topbar with gradient border.
 */
export function Topbar({
    logo,
    logoHref = '/dashboard',
    leftContent,
    centerContent,
    actions,
    className,
}: TopbarProps) {
    return (
        <header className={cn(styles.topbar, className)}>
            <div className={styles.topbarContent}>
                {/* Logo */}
                <Link href={logoHref} className={styles.logo}>
                    {logo ?? (
                        <>
                            <span className={styles.logoIcon}>O</span>
                            <span className={styles.logoText}>OrgCentral</span>
                        </>
                    )}
                </Link>

                {/* Left Content */}
                {leftContent && (
                    <div className={styles.leftContent}>{leftContent}</div>
                )}

                {/* Center Content */}
                {centerContent && (
                    <div className={styles.centerContent}>{centerContent}</div>
                )}
            </div>

            {/* Actions */}
            {actions && (
                <div className={styles.topbarActions}>{actions}</div>
            )}
        </header>
    );
}

// ============================================================================
// Sub-components
// ============================================================================

export interface TopbarSearchProps {
    placeholder?: string;
    shortcut?: string;
    onClick?: () => void;
    className?: string;
}

/**
 * Search trigger button for topbar.
 */
export function TopbarSearch({
    placeholder = 'Search...',
    shortcut = '⌘K',
    onClick,
    className,
}: TopbarSearchProps) {
    return (
        <button
            type="button"
            className={cn(styles.searchBox, className)}
            onClick={onClick}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
            </svg>
            <span className="flex-1 text-left">{placeholder}</span>
            <kbd className={styles.searchKbd}>{shortcut}</kbd>
        </button>
    );
}

export interface TopbarActionProps {
    icon: ReactNode;
    label: string;
    onClick?: () => void;
    className?: string;
}

/**
 * Icon button for topbar actions.
 */
export function TopbarAction({ icon, label, onClick, className }: TopbarActionProps) {
    return (
        <button
            type="button"
            className={cn(styles.actionButton, className)}
            onClick={onClick}
            aria-label={label}
        >
            {icon}
        </button>
    );
}
