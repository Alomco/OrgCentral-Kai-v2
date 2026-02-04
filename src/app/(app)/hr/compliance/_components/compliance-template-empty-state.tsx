'use client';

import { Button } from '@/components/ui/button';

export function ComplianceTemplateEmptyState() {
    return (
        <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">No templates yet</p>
            <p className="mt-1">Create your first template or seed a starter pack to get going.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button asChild size="sm">
                    <a href="#create-template">Create template</a>
                </Button>
            </div>
        </div>
    );
}
