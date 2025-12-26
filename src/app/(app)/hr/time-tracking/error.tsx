'use client';

import { AlertTriangle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TimeTrackingError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Time Tracking Error
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Something went wrong</AlertTitle>
                        <AlertDescription>
                            {error.message || 'Failed to load time tracking data.'}
                        </AlertDescription>
                    </Alert>
                    <Button onClick={reset} variant="outline">
                        Try again
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
