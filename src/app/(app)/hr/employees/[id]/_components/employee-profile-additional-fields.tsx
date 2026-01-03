import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useId } from 'react';
import {
    PAY_SCHEDULE_VALUES,
    SALARY_BASIS_VALUES,
    SALARY_FREQUENCY_VALUES,
} from '@/server/types/hr/people';

import { FieldError } from '@/app/(app)/hr/_components/field-error';
import type { EmployeeProfileFormState } from '../../form-state';

interface EmployeeProfileAdditionalFieldsProps {
    formId: string;
    values: EmployeeProfileFormState['values'];
    fieldErrors?: EmployeeProfileFormState['fieldErrors'];
}

export function EmployeeProfileAdditionalFields({
    formId,
    values,
    fieldErrors,
}: EmployeeProfileAdditionalFieldsProps) {
    const idPrefix = useId().replaceAll(':', '');
    const scopedFormId = `${formId}-${idPrefix}`;

    return (
        <>
            <section className="space-y-4">
                <div className="text-sm font-semibold">Address</div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor={`${scopedFormId}-addressStreet`}>Street</Label>
                        <Input
                            id={`${scopedFormId}-addressStreet`}
                            name="addressStreet"
                            defaultValue={values.addressStreet}
                        />
                        <FieldError message={fieldErrors?.addressStreet} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${scopedFormId}-addressCity`}>City</Label>
                        <Input
                            id={`${scopedFormId}-addressCity`}
                            name="addressCity"
                            defaultValue={values.addressCity}
                        />
                        <FieldError message={fieldErrors?.addressCity} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${scopedFormId}-addressState`}>State/Region</Label>
                        <Input
                            id={`${scopedFormId}-addressState`}
                            name="addressState"
                            defaultValue={values.addressState}
                        />
                        <FieldError message={fieldErrors?.addressState} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${scopedFormId}-addressPostalCode`}>Postal code</Label>
                        <Input
                            id={`${scopedFormId}-addressPostalCode`}
                            name="addressPostalCode"
                            defaultValue={values.addressPostalCode}
                        />
                        <FieldError message={fieldErrors?.addressPostalCode} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${scopedFormId}-addressCountry`}>Country</Label>
                        <Input
                            id={`${scopedFormId}-addressCountry`}
                            name="addressCountry"
                            defaultValue={values.addressCountry}
                        />
                        <FieldError message={fieldErrors?.addressCountry} />
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="text-sm font-semibold">Emergency contact</div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor={`${scopedFormId}-emergencyContactName`}>Name</Label>
                        <Input
                            id={`${scopedFormId}-emergencyContactName`}
                            name="emergencyContactName"
                            defaultValue={values.emergencyContactName}
                        />
                        <FieldError message={fieldErrors?.emergencyContactName} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${scopedFormId}-emergencyContactRelationship`}>Relationship</Label>
                        <Input
                            id={`${scopedFormId}-emergencyContactRelationship`}
                            name="emergencyContactRelationship"
                            defaultValue={values.emergencyContactRelationship}
                        />
                        <FieldError message={fieldErrors?.emergencyContactRelationship} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${scopedFormId}-emergencyContactPhone`}>Phone</Label>
                        <Input
                            id={`${scopedFormId}-emergencyContactPhone`}
                            name="emergencyContactPhone"
                            defaultValue={values.emergencyContactPhone}
                        />
                        <FieldError message={fieldErrors?.emergencyContactPhone} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${scopedFormId}-emergencyContactEmail`}>Email</Label>
                        <Input
                            id={`${scopedFormId}-emergencyContactEmail`}
                            name="emergencyContactEmail"
                            type="email"
                            defaultValue={values.emergencyContactEmail}
                        />
                        <FieldError message={fieldErrors?.emergencyContactEmail} />
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="text-sm font-semibold">Compensation</div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor={`${scopedFormId}-annualSalary`}>Annual salary</Label>
                        <Input
                            id={`${scopedFormId}-annualSalary`}
                            name="annualSalary"
                            inputMode="decimal"
                            defaultValue={values.annualSalary}
                        />
                        <FieldError message={fieldErrors?.annualSalary} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${scopedFormId}-hourlyRate`}>Hourly rate</Label>
                        <Input
                            id={`${scopedFormId}-hourlyRate`}
                            name="hourlyRate"
                            inputMode="decimal"
                            defaultValue={values.hourlyRate}
                        />
                        <FieldError message={fieldErrors?.hourlyRate} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${scopedFormId}-salaryAmount`}>Salary amount</Label>
                        <Input
                            id={`${scopedFormId}-salaryAmount`}
                            name="salaryAmount"
                            inputMode="decimal"
                            defaultValue={values.salaryAmount}
                        />
                        <FieldError message={fieldErrors?.salaryAmount} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${scopedFormId}-salaryCurrency`}>Currency</Label>
                        <Input
                            id={`${scopedFormId}-salaryCurrency`}
                            name="salaryCurrency"
                            defaultValue={values.salaryCurrency}
                        />
                        <FieldError message={fieldErrors?.salaryCurrency} />
                    </div>
                    <div className="space-y-2">
                        <Label>Frequency</Label>
                        <select
                            name="salaryFrequency"
                            defaultValue={values.salaryFrequency}
                            aria-label="Salary frequency"
                            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <option value="">Not set</option>
                            {SALARY_FREQUENCY_VALUES.map((value) => (
                                <option key={value} value={value}>
                                    {formatEnumLabel(value)}
                                </option>
                            ))}
                        </select>
                        <FieldError message={fieldErrors?.salaryFrequency} />
                    </div>
                    <div className="space-y-2">
                        <Label>Basis</Label>
                        <select
                            name="salaryBasis"
                            defaultValue={values.salaryBasis}
                            aria-label="Salary basis"
                            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <option value="">Not set</option>
                            {SALARY_BASIS_VALUES.map((value) => (
                                <option key={value} value={value}>
                                    {formatEnumLabel(value)}
                                </option>
                            ))}
                        </select>
                        <FieldError message={fieldErrors?.salaryBasis} />
                    </div>
                    <div className="space-y-2">
                        <Label>Pay schedule</Label>
                        <select
                            name="paySchedule"
                            defaultValue={values.paySchedule}
                            aria-label="Pay schedule"
                            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <option value="">Not set</option>
                            {PAY_SCHEDULE_VALUES.map((value) => (
                                <option key={value} value={value}>
                                    {formatEnumLabel(value)}
                                </option>
                            ))}
                        </select>
                        <FieldError message={fieldErrors?.paySchedule} />
                    </div>
                </div>
            </section>

            <section className="space-y-2">
                <Label htmlFor={`${scopedFormId}-metadata`}>Metadata (JSON)</Label>
                <Textarea
                    id={`${scopedFormId}-metadata`}
                    name="metadata"
                    rows={4}
                    placeholder='{"source":"hr-admin"}'
                    defaultValue={values.metadata}
                />
                <FieldError message={fieldErrors?.metadata} />
                <p className="text-xs text-muted-foreground">
                    Store structured notes or integration identifiers as JSON.
                </p>
            </section>
        </>
    );
}

function formatEnumLabel(value: string): string {
    return value
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}
