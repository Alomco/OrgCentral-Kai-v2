'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function ErrorPage(props: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Intentionally no logging here to avoid leaking sensitive context.
    }, [props.error]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Unable to load Onboarding</CardTitle>
                    <CardDescription>
                        Something went wrong while rendering this page. Try again.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    If the problem persists, contact your administrator.
                </CardContent>
                <CardFooter className="border-t justify-end">
                    <Button type="button" onClick={props.reset}>
                        Retry
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
