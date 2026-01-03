'use client';

import serverErrorImage from '@/assets/errors/server_error.webp';
import {
    ErrorPageLayout,
    ErrorIllustration,
    ErrorContent,
    ErrorActions,
    ErrorLinkButton,
    ErrorRetryButton,
} from '@/components/error';

interface GlobalErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ reset }: GlobalErrorProps) {
    return (
        <div className="min-h-screen bg-[hsl(var(--background))]">
            <ErrorPageLayout intent="danger" fullScreen>
                <ErrorIllustration src={serverErrorImage} alt="Something went wrong" />
                <ErrorContent
                    title="Something went wrong"
                    description="Please try again or return to the dashboard."
                    intent="danger"
                />
                <ErrorActions>
                    <ErrorRetryButton reset={reset} />
                    <ErrorLinkButton href="/">Go home</ErrorLinkButton>
                </ErrorActions>
            </ErrorPageLayout>
        </div>
    );
}
