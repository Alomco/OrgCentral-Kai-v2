import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    EMPLOYMENT_STATUS_VALUES,
    EMPLOYMENT_TYPE_VALUES,
} from '@/server/types/hr/people';

import { FieldError } from '@/app/(app)/hr/_components/field-error';
import type { EmployeeProfileFormState } from '../../form-state';
import {
    formatEmploymentStatus,
    formatEmploymentType,
} from '../../_components/employee-formatters';

interface EmployeeProfileCoreFieldsProps {
    formId: string;
    values: EmployeeProfileFormState['values'];
    fieldErrors?: EmployeeProfileFormState['fieldErrors'];
}

export function EmployeeProfileCoreFields({
    formId,
    values,
    fieldErrors,
}: EmployeeProfileCoreFieldsProps) {
    return (
        <>
            <section className="space-y-4">
                <div className="text-sm font-semibold">Contact</div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-displayName`}>Display name</Label>
                        <Input
                            id={`${formId}-displayName`}
                            name="displayName"
                            defaultValue={values.displayName}
                        />
                        <FieldError message={fieldErrors?.displayName} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-jobTitle`}>Job title</Label>
                        <Input
                            id={`${formId}-jobTitle`}
                            name="jobTitle"
                            defaultValue={values.jobTitle}
                        />
                        <FieldError message={fieldErrors?.jobTitle} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-firstName`}>First name</Label>
                        <Input
                            id={`${formId}-firstName`}
                            name="firstName"
                            defaultValue={values.firstName}
                        />
                        <FieldError message={fieldErrors?.firstName} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-lastName`}>Last name</Label>
                        <Input
                            id={`${formId}-lastName`}
                            name="lastName"
                            defaultValue={values.lastName}
                        />
                        <FieldError message={fieldErrors?.lastName} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-email`}>Work email</Label>
                        <Input
                            id={`${formId}-email`}
                            name="email"
                            type="email"
                            defaultValue={values.email}
                        />
                        <FieldError message={fieldErrors?.email} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-personalEmail`}>Personal email</Label>
                        <Input
                            id={`${formId}-personalEmail`}
                            name="personalEmail"
                            type="email"
                            defaultValue={values.personalEmail}
                        />
                        <FieldError message={fieldErrors?.personalEmail} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-phoneWork`}>Work phone</Label>
                        <Input
                            id={`${formId}-phoneWork`}
                            name="phoneWork"
                            defaultValue={values.phoneWork}
                        />
                        <FieldError message={fieldErrors?.phoneWork} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-phoneMobile`}>Mobile phone</Label>
                        <Input
                            id={`${formId}-phoneMobile`}
                            name="phoneMobile"
                            defaultValue={values.phoneMobile}
                        />
                        <FieldError message={fieldErrors?.phoneMobile} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-phoneHome`}>Home phone</Label>
                        <Input
                            id={`${formId}-phoneHome`}
                            name="phoneHome"
                            defaultValue={values.phoneHome}
                        />
                        <FieldError message={fieldErrors?.phoneHome} />
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="text-sm font-semibold">Employment</div>
                <div className="grid gap-4 sm:grid-cols-2">
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
                        <Label htmlFor={`${formId}-costCenter`}>Cost center</Label>
                        <Input
                            id={`${formId}-costCenter`}
                            name="costCenter"
                            defaultValue={values.costCenter}
                        />
                        <FieldError message={fieldErrors?.costCenter} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-managerUserId`}>Manager user ID</Label>
                        <Input
                            id={`${formId}-managerUserId`}
                            name="managerUserId"
                            defaultValue={values.managerUserId}
                        />
                        <FieldError message={fieldErrors?.managerUserId} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-employmentType`}>Employment type</Label>
                        <Select name="employmentType" defaultValue={values.employmentType}>
                            <SelectTrigger id={`${formId}-employmentType`}>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                {EMPLOYMENT_TYPE_VALUES.map((value) => (
                                    <SelectItem key={value} value={value}>
                                        {formatEmploymentType(value)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FieldError message={fieldErrors?.employmentType} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-employmentStatus`}>Employment status</Label>
                        <Select name="employmentStatus" defaultValue={values.employmentStatus}>
                            <SelectTrigger id={`${formId}-employmentStatus`}>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                {EMPLOYMENT_STATUS_VALUES.map((value) => (
                                    <SelectItem key={value} value={value}>
                                        {formatEmploymentStatus(value)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FieldError message={fieldErrors?.employmentStatus} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${formId}-startDate`}>Start date</Label>
                        <Input
                            id={`${formId}-startDate`}
                            name="startDate"
                            type="date"
                            defaultValue={values.startDate}
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
                </div>
            </section>
        </>
    );
}
