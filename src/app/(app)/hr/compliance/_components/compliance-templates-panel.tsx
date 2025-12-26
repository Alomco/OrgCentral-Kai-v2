import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { PrismaComplianceTemplateRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-template-repository';
import { listComplianceTemplates } from '@/server/use-cases/hr/compliance/list-compliance-templates';

import { seedComplianceTemplatesAction } from '../actions/seed-templates';

export interface ComplianceTemplatesPanelProps {
    authorization: RepositoryAuthorizationContext;
}

export async function ComplianceTemplatesPanel({ authorization }: ComplianceTemplatesPanelProps) {
    const templates = await listComplianceTemplates(
        { complianceTemplateRepository: new PrismaComplianceTemplateRepository() },
        { authorization },
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Templates</CardTitle>
                <CardDescription>Default packs and organization templates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form action={seedComplianceTemplatesAction}>
                    <button className="text-sm font-medium underline underline-offset-4">
                        Seed default templates
                    </button>
                </form>

                {templates.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No templates found.</div>
                ) : (
                    <div className="overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Version</TableHead>
                                    <TableHead className="text-right">Items</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {templates.map((template) => (
                                    <TableRow key={template.id}>
                                        <TableCell className="font-medium">{template.name}</TableCell>
                                        <TableCell>{template.categoryKey ?? '—'}</TableCell>
                                        <TableCell className="text-muted-foreground">{template.version ?? '—'}</TableCell>
                                        <TableCell className="text-right">{template.items.length}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
