import Link from 'next/link';
import { Clock, FileText, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComplianceItemSubmissionForm } from '../_components/compliance-item-submission-form';
import type { ComplianceLogItem, ComplianceTemplateItem } from '@/server/types/compliance-types';
import { formatDate } from './compliance-item-utils';

interface ComplianceItemDetailsCardProps {
    categoryLabel: string;
    statusLabel: string;
    itemType: string;
    dueDate: Date | string | null | undefined;
    createdAt: Date | string | null | undefined;
    completedAt: Date | string | null | undefined;
}

export function ComplianceItemDetailsCard({
    categoryLabel,
    statusLabel,
    itemType,
    dueDate,
    createdAt,
    completedAt,
}: ComplianceItemDetailsCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Details
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                    <div>
                        <p className="text-muted-foreground">Category</p>
                        <p className="font-medium break-words">{categoryLabel}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium break-words">{statusLabel}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Type</p>
                        <p className="font-medium break-words">{itemType}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Due Date</p>
                        <p className="font-medium break-words">{formatDate(dueDate)}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Created</p>
                        <p className="font-medium break-words">{formatDate(createdAt)}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Completed</p>
                        <p className="font-medium break-words">{formatDate(completedAt)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

interface ComplianceItemAssignmentCardProps {
    assignedName: string;
    userId: string;
}

export function ComplianceItemAssignmentCard({
    assignedName,
    userId,
}: ComplianceItemAssignmentCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Assignment
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                        <Link
                            href={`/hr/employees/${userId}`}
                            className="font-medium hover:underline truncate"
                        >
                            {assignedName}
                        </Link>
                        <p className="text-sm text-muted-foreground">Assigned Employee</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

interface ComplianceItemEvidenceCardProps {
    complianceItem: ComplianceLogItem;
    templateItem: ComplianceTemplateItem | null;
    canEdit: boolean;
}

export function ComplianceItemEvidenceCard({
    complianceItem,
    templateItem,
    canEdit,
}: ComplianceItemEvidenceCardProps) {
    return (
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Evidence submission
                </CardTitle>
                <CardDescription>
                    Submit attachments, acknowledgements, and notes for review.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ComplianceItemSubmissionForm
                    item={complianceItem}
                    templateItem={templateItem}
                    canEdit={canEdit}
                />
            </CardContent>
        </Card>
    );
}

interface ComplianceItemActivityCardProps {
    createdAt: Date | string | null | undefined;
    completedAt: Date | string | null | undefined;
}

export function ComplianceItemActivityCard({
    createdAt,
    completedAt,
}: ComplianceItemActivityCardProps) {
    return (
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Activity History
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex gap-3">
                        <div className="h-2 w-2 rounded-full bg-muted-foreground/50 mt-2" />
                        <div>
                            <p className="text-sm">Compliance item created</p>
                            <p className="text-xs text-muted-foreground">
                                {formatDate(createdAt)}
                            </p>
                        </div>
                    </div>
                    {completedAt ? (
                        <div className="flex gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2" />
                            <div>
                                <p className="text-sm">Completion submitted</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDate(completedAt)}
                                </p>
                            </div>
                        </div>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}
