import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CONTRACT_TYPE_VALUES } from '@/server/types/hr/people';

import { FieldError } from '@/app/(app)/hr/_components/field-error';
import type { EmployeeContractFormState } from '../../form-state';

interface EmployeeContractEditFieldsProps {
    formId: string;
    values: EmployeeContractFormState['values'];
    fieldErrors?: EmployeeContractFormState['fieldErrors'];
}

export function EmployeeContractEditFields({
    formId,
    values,
    fieldErrors,
}: EmployeeContractEditFieldsProps) {
    return (
        <>
            <section className="space-y-4">
                <div className="text-sm font-semibold">Core terms</div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-contractType`}>Contract type</Label>
                        <Select name="contractType" defaultValue={values.contractType}>
                            <SelectTrigger id={`${formId}-contractType`}>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                {CONTRACT_TYPE_VALUES.map((value) => (
                                    <SelectItem key={value} value={value}>
                                        {formatContractType(value)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FieldError message={fieldErrors?.contractType} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-jobTitle`}>Job title</Label>
                        <Input
                            id={`${formId}-jobTitle`}
                            name="jobTitle"
                            defaultValue={values.jobTitle}
                            required
                        />
                        <FieldError message={fieldErrors?.jobTitle} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-departmentId`}>Department</Label>
                        <Input
                            id={`${formId}-departmentId`}
                            name="departmentId"
                            defaultValue={values.departmentId}
                        />
                        <FieldError message={fieldErrors?.departmentId} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-location`}>Location</Label>
                        <Input
                            id={`${formId}-location`}
                            name="location"
                            defaultValue={values.location}
                        />
                        <FieldError message={fieldErrors?.location} />
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="text-sm font-semibold">Dates</div>
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-startDate`}>Start date</Label>
                        <Input
                            id={`${formId}-startDate`}
                            name="startDate"
                            type="date"
                            defaultValue={values.startDate}
                            required
                        />
                        <FieldError message={fieldErrors?.startDate} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-endDate`}>End date</Label>
                        <Input
                            id={`${formId}-endDate`}
                            name="endDate"
                            type="date"
                            defaultValue={values.endDate}
                        />
                        <FieldError message={fieldErrors?.endDate} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-probationEndDate`}>Probation end</Label>
                        <Input
                            id={`${formId}-probationEndDate`}
                            name="probationEndDate"
                            type="date"
                            defaultValue={values.probationEndDate}
                        />
                        <FieldError message={fieldErrors?.probationEndDate} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-furloughStartDate`}>Furlough start</Label>
                        <Input
                            id={`${formId}-furloughStartDate`}
                            name="furloughStartDate"
                            type="date"
                            defaultValue={values.furloughStartDate}
                        />
                        <FieldError message={fieldErrors?.furloughStartDate} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-furloughEndDate`}>Furlough end</Label>
                        <Input
                            id={`${formId}-furloughEndDate`}
                            name="furloughEndDate"
                            type="date"
                            defaultValue={values.furloughEndDate}
                        />
                        <FieldError message={fieldErrors?.furloughEndDate} />
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="text-sm font-semibold">Working pattern</div>
                <div className="space-y-2">
                    <Label htmlFor={`${formId}-workingPattern`}>Pattern (JSON)</Label>
                    <Textarea
                        id={`${formId}-workingPattern`}
                        name="workingPattern"
                        rows={3}
                        placeholder='{"days":["Mon","Tue"],"hours":"9-5"}'
                        defaultValue={values.workingPattern}
                    />
                    <FieldError message={fieldErrors?.workingPattern} />
                </div>
            </section>

            <section className="space-y-4">
                <div className="text-sm font-semibold">Benefits</div>
                <div className="space-y-2">
                    <Label htmlFor={`${formId}-benefits`}>Benefits (JSON)</Label>
                    <Textarea
                        id={`${formId}-benefits`}
                        name="benefits"
                        rows={3}
                        placeholder='{"health":"premium","allowance":"2000"}'
                        defaultValue={values.benefits}
                    />
                    <FieldError message={fieldErrors?.benefits} />
                </div>
            </section>

            <section className="space-y-4">
                <div className="text-sm font-semibold">Termination</div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-terminationReason`}>Termination reason</Label>
                        <Input
                            id={`${formId}-terminationReason`}
                            name="terminationReason"
                            defaultValue={values.terminationReason}
                        />
                        <FieldError message={fieldErrors?.terminationReason} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor={`${formId}-terminationNotes`}>Termination notes</Label>
                        <Textarea
                            id={`${formId}-terminationNotes`}
                            name="terminationNotes"
                            rows={3}
                            defaultValue={values.terminationNotes}
                        />
                        <FieldError message={fieldErrors?.terminationNotes} />
                    </div>
                </div>
            </section>
        </>
    );
}

function formatContractType(value: string): string {
    return value
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}
