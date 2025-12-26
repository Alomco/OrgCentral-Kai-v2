import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { errorCardVariants, errorTitleVariants, type ErrorCardIntent } from './error-styles';

interface ErrorPageLayoutProps {
    children: React.ReactNode;
    intent?: ErrorCardIntent;
    className?: string;
    /** If true, uses full viewport height (for global error.tsx) */
    fullScreen?: boolean;
}

/**
 * Server Component - shared layout wrapper for all error pages.
 * Provides glassmorphism card with gradient mesh background.
 */
export function ErrorPageLayout({ children, intent = 'danger', className, fullScreen }: ErrorPageLayoutProps) {
    return (
        <main
            className={cn(
                'flex flex-col items-center justify-center gap-6 px-6 py-12 text-center',
                fullScreen && 'min-h-screen',
                !fullScreen && 'min-h-[70vh]',
            )}
        >
            <div className={cn(errorCardVariants({ intent }), 'max-w-md', className)}>
                {/* Background orbs */}
                <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[hsl(var(--primary)/0.2)] blur-3xl motion-safe:animate-pulse motion-reduce:animate-none" />
                <div className="pointer-events-none absolute -right-12 -bottom-12 h-40 w-40 rounded-full bg-[hsl(var(--accent)/0.2)] blur-3xl motion-safe:animate-pulse motion-reduce:animate-none" />
                {children}
            </div>
        </main>
    );
}

interface ErrorIllustrationProps {
    src: StaticImageData;
    alt: string;
}

/**
 * Server Component - floating illustration with glow effect.
 * CSS-first animation with reduced-motion support.
 */
export function ErrorIllustration({ src, alt }: ErrorIllustrationProps) {
    return (
        <div className="relative mb-4 flex justify-center">
            <div className="absolute inset-0 rounded-full bg-[hsl(var(--primary)/0.15)] blur-2xl motion-reduce:blur-xl" />
            <Image
                src={src}
                alt={alt}
                width={180}
                height={180}
                className="relative h-40 w-40 motion-safe:animate-[float_6s_ease-in-out_infinite] motion-reduce:animate-none drop-shadow-[0_16px_32px_rgba(0,0,0,0.35)]"
                priority
            />
        </div>
    );
}

interface ErrorContentProps {
    title: string;
    description: string;
    intent?: ErrorCardIntent;
}

/**
 * Server Component - error title and description with gradient text.
 */
export function ErrorContent({ title, description, intent = 'danger' }: ErrorContentProps) {
    return (
        <div className="relative space-y-2">
            <h1 className={errorTitleVariants({ intent })}>{title}</h1>
            <p className="text-[hsl(var(--muted-foreground))]">{description}</p>
        </div>
    );
}

interface ErrorActionsProps {
    children: React.ReactNode;
}

/**
 * Server Component - wrapper for action buttons.
 */
export function ErrorActions({ children }: ErrorActionsProps) {
    return <div className="relative mt-6 flex flex-wrap justify-center gap-3">{children}</div>;
}

interface ErrorLinkButtonProps {
    href: string;
    variant?: 'primary' | 'secondary';
    children: React.ReactNode;
}

/**
 * Server Component - navigation link styled as button.
 */
export function ErrorLinkButton({ href, variant = 'secondary', children }: ErrorLinkButtonProps) {
    const isPrimary = variant === 'primary';

    return (
        <Button
            asChild
            size="lg"
            variant={isPrimary ? 'default' : 'ghost'}
            className={cn(
                'px-6',
                isPrimary &&
                'shadow-[0_15px_45px_-22px_hsl(var(--primary)/0.85)] hover:shadow-[0_18px_55px_-20px_hsl(var(--primary)/0.95)]',
                !isPrimary && 'bg-[hsl(var(--card)/0.7)] hover:bg-[hsl(var(--card)/0.9)]',
                'motion-safe:translate-y-0 motion-safe:hover:-translate-y-px',
            )}
        >
            <Link href={href}>{children}</Link>
        </Button>
    );
}
