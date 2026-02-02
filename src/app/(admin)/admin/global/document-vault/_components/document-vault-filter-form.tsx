import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
                <h3 className="text-sm font-semibold">Tenant scope</h3>
                <p className="text-xs text-muted-foreground">
                    Select a tenant and provide a break-glass approval to list documents.
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="tenantId">Tenant ID</Label>
                    <Input
                        id="tenantId"
                        name="tenantId"
                        placeholder="Tenant UUID"
                        defaultValue={values.tenantId ?? ''}
                        required
                    />
                </div>
            <div className="space-y-2">
                <Label htmlFor="breakGlassApprovalId">Break-glass approval ID</Label>
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
                    <Label htmlFor="classification">Classification</Label>
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
                    <Label htmlFor="retentionPolicy">Retention</Label>
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
