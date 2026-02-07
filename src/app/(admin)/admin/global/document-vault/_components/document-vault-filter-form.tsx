import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InfoButton } from '@/components/ui/info-button';
import {
    DOCUMENT_TYPE_VALUES,
    RETENTION_POLICY_VALUES,
    SECURITY_CLASSIFICATION_VALUES,
} from '@/server/types/records/document-vault-schemas';

interface DocumentVaultFilterValues {
    tenantId?: string;
    breakGlassApprovalId?: string;
    fileName?: string;
    ownerUserId?: string;
    type?: string;
    classification?: string;
    retentionPolicy?: string;
}

export function DocumentVaultFilterForm({ values }: { values: DocumentVaultFilterValues }) {
    return (
        <form method="get" className="space-y-4 rounded-2xl border border-border/50 bg-card/60 p-4">
            <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">Tenant scope</h3>
                    <InfoButton
                        label="Tenant scope"
                        sections={[
                            { label: 'What', text: 'Limit results to a tenant and approval.' },
                            { label: 'Prereqs', text: 'Valid tenant ID and break-glass approval.' },
                            { label: 'Next', text: 'Apply filters, then review metadata.' },
                            { label: 'Compliance', text: 'Access is scoped by residency and classification.' },
                        ]}
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    Select a tenant and provide a break-glass approval to list documents.
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="tenantId">Tenant ID</Label>
                        <InfoButton
                            label="Tenant ID"
                            sections={[
                                { label: 'What', text: 'Tenant you want to inspect.' },
                                { label: 'Prereqs', text: 'Must match an existing tenant.' },
                                { label: 'Next', text: 'Add filters to narrow results.' },
                                { label: 'Compliance', text: 'Tenant scope enforced server-side.' },
                            ]}
                        />
                    </div>
                    <Input
                        id="tenantId"
                        name="tenantId"
                        placeholder="Tenant UUID"
                        defaultValue={values.tenantId ?? ''}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="breakGlassApprovalId">Break-glass approval ID</Label>
                        <InfoButton
                            label="Break-glass approval ID"
                            sections={[
                                { label: 'What', text: 'Approval token for listing or download.' },
                                { label: 'Prereqs', text: 'Issued by the break-glass form.' },
                                { label: 'Next', text: 'Re-request if approval expires.' },
                                { label: 'Compliance', text: 'Approvals are time-bound and audited.' },
                            ]}
                        />
                    </div>
                    <Input
                        id="breakGlassApprovalId"
                        name="breakGlassApprovalId"
                        placeholder="Approval UUID for list/download"
                        defaultValue={values.breakGlassApprovalId ?? ''}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="fileName">File name</Label>
                    <Input
                        id="fileName"
                        name="fileName"
                        placeholder="Search by file name"
                        defaultValue={values.fileName ?? ''}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ownerUserId">Owner user ID</Label>
                    <Input
                        id="ownerUserId"
                        name="ownerUserId"
                        placeholder="Owner UUID"
                        defaultValue={values.ownerUserId ?? ''}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <select
                        id="type"
                        name="type"
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        defaultValue={values.type ?? ''}
                    >
                        <option value="">All</option>
                        {DOCUMENT_TYPE_VALUES.map((value) => (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="classification">Classification</Label>
                        <InfoButton
                            label="Classification"
                            sections={[
                                { label: 'What', text: 'Security level for document content.' },
                                { label: 'Prereqs', text: 'Values follow the classification model.' },
                                { label: 'Next', text: 'Filter to reduce sensitive exposure.' },
                                { label: 'Compliance', text: 'Higher classes are more restricted.' },
                            ]}
                        />
                    </div>
                    <select
                        id="classification"
                        name="classification"
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        defaultValue={values.classification ?? ''}
                    >
                        <option value="">All</option>
                        {SECURITY_CLASSIFICATION_VALUES.map((value) => (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="retentionPolicy">Retention</Label>
                        <InfoButton
                            label="Retention policy"
                            sections={[
                                { label: 'What', text: 'Retention rule attached to the document.' },
                                { label: 'Prereqs', text: 'Retention policies configured.' },
                                { label: 'Next', text: 'Confirm policy before download.' },
                                { label: 'Compliance', text: 'Retention affects legal obligations.' },
                            ]}
                        />
                    </div>
                    <select
                        id="retentionPolicy"
                        name="retentionPolicy"
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        defaultValue={values.retentionPolicy ?? ''}
                    >
                        <option value="">All</option>
                        {RETENTION_POLICY_VALUES.map((value) => (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <Button type="submit">
                Apply filters
            </Button>
        </form>
    );
}
