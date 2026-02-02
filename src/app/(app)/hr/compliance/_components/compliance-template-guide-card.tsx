import { FileJson, Library, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { seedComplianceTemplatesAction } from '../actions/seed-templates';

export function ComplianceTemplateGuideCard() {
    return (
        <Card className="h-full border-primary/10 bg-primary/5 shadow-none">
            <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Library className="h-4 w-4" />
                    Getting started
                </CardTitle>
                <CardDescription>Simple tips for clean, consistent templates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                    <FileJson className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                        <div className="font-medium text-foreground">Use clear IDs</div>
                        Stick to a consistent format like region.domain.requirement and update the version when rules change.
                    </div>
                </div>
                <div className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                        <div className="font-medium text-foreground">Start with a template pack</div>
                        <form action={seedComplianceTemplatesAction} className="mt-1 flex items-center gap-2">
                            <Button type="submit" size="sm" variant="secondary">
                                <Sparkles className="mr-2 h-4 w-4" /> Seed starter templates
                            </Button>
                            <span className="text-xs text-muted-foreground">Great for onboarding quickly.</span>
                        </form>
                    </div>
                </div>
                <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-3 text-xs text-foreground">
                    <div className="mb-2 font-semibold uppercase tracking-wide text-[10px] text-muted-foreground">
                        Example items
                    </div>
                    <ul className="list-disc space-y-1 pl-4 text-xs">
                        <li>Right to work check (Document upload, required)</li>
                        <li>Signed policy acknowledgement (Acknowledgement, required)</li>
                        <li>Health & safety training date (Completion date, optional)</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
