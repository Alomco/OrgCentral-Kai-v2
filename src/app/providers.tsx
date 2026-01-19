'use client';

import { QueryClientProvider, QueryErrorResetBoundary } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Component, useState } from 'react';
import { ThemeProvider } from 'next-themes';

import { Toaster } from '@/components/ui/sonner';
import { createQueryClient } from '@/lib/react-query';

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => createQueryClient());

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <QueryErrorResetBoundary>
                {({ reset }) => (
                    <SimpleErrorBoundary onReset={reset}>
                        <QueryClientProvider client={queryClient}>
                            {children}
                            <Toaster />
                        </QueryClientProvider>
                    </SimpleErrorBoundary>
                )}
            </QueryErrorResetBoundary>
        </ThemeProvider>
    );
}

class SimpleErrorBoundary extends Component<{ onReset: () => void; children: ReactNode }, { error: Error | null }> {
    constructor(props: { onReset: () => void; children: ReactNode }) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { error };
    }

    componentDidCatch() {
        // no-op: logging can be added here if needed
    }

    handleReset = () => {
        this.setState({ error: null });
        this.props.onReset();
    };

    render() {
        if (this.state.error) {
            return (
                <div className="m-4 rounded-xl bg-card/90 p-4 text-sm shadow-lg backdrop-blur">
                    <p className="font-semibold text-foreground">Something went wrong.</p>
                    <p className="mt-1 text-foreground/70">{this.state.error.message}</p>
                    <button
                        type="button"
                        onClick={this.handleReset}
                        className="mt-3 inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-primary-foreground text-xs font-semibold shadow hover:opacity-90"
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
