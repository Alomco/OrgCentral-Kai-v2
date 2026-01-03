'use client';

import { useActionState, useId } from 'react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

import { FieldError } from '@/app/(app)/hr/_components/field-error';

import { updateSelfProfileAction } from '../actions';
import type { SelfProfileFormState } from '../form-state';

export interface ProfileEditCardProps {
    initialState: SelfProfileFormState;
}

export function ProfileEditCard({ initialState }: ProfileEditCardProps) {
    const formId = useId();
    const [state, formAction, pending] = useActionState(updateSelfProfileAction, initialState);

    const statusMessage = state.status === 'success'
        ? state.message ?? 'Profile saved.'
        : state.status === 'error'
            ? state.message ?? 'Unable to save profile.'
            : 'Changes apply immediately.';

    return (
        <form action={formAction}>
            <Card>
                <CardHeader>
                    <CardTitle>Edit personal details</CardTitle>
                    <CardDescription>Update your contact, address, and emergency info.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <input type="hidden" name="profileId" value={state.values.profileId} />
                    <fieldset disabled={pending} className="space-y-6">
                        <section className="space-y-4">
                            <div className="text-sm font-semibold">Basic info</div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor={`${formId}-displayName`}>Display name</Label>
                                    <Input
                                        id={`${formId}-displayName`}
                                        name="displayName"
                                        defaultValue={state.values.displayName}
                                    />
                                    <FieldError message={state.fieldErrors?.displayName} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`${formId}-firstName`}>First name</Label>
                                    <Input
                                        id={`${formId}-firstName`}
                                        name="firstName"
                                        defaultValue={state.values.firstName}
                                    />
                                    <FieldError message={state.fieldErrors?.firstName} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`${formId}-lastName`}>Last name</Label>
                                    <Input
                                        id={`${formId}-lastName`}
                                        name="lastName"
                                        defaultValue={state.values.lastName}
                                    />
                                    <FieldError message={state.fieldErrors?.lastName} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`${formId}-personalEmail`}>Personal email</Label>
                                    <Input
                                        id={`${formId}-personalEmail`}
                                        name="personalEmail"
                                        type="email"
                                        defaultValue={state.values.personalEmail}
                                    />
                                    <FieldError message={state.fieldErrors?.personalEmail} />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="text-sm font-semibold">Phones</div>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor={`${formId}-phoneWork`}>Work phone</Label>
                                    <Input
                                        id={`${formId}-phoneWork`}
                                        name="phoneWork"
                                        defaultValue={state.values.phoneWork}
                                    />
                                    <FieldError message={state.fieldErrors?.phoneWork} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`${formId}-phoneMobile`}>Mobile phone</Label>
                                    <Input
                                        id={`${formId}-phoneMobile`}
                                        name="phoneMobile"
                                        defaultValue={state.values.phoneMobile}
                                    />
                                    <FieldError message={state.fieldErrors?.phoneMobile} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`${formId}-phoneHome`}>Home phone</Label>
                                    <Input
                                        id={`${formId}-phoneHome`}
                                        name="phoneHome"
                                        defaultValue={state.values.phoneHome}
                                    />
                                    <FieldError message={state.fieldErrors?.phoneHome} />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="text-sm font-semibold">Address</div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor={`${formId}-addressStreet`}>Street</Label>
                                    <Input
                                        id={`${formId}-addressStreet`}
                                        name="addressStreet"
                                        defaultValue={state.values.addressStreet}
                                    />
                                    <FieldError message={state.fieldErrors?.addressStreet} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`${formId}-addressCity`}>City</Label>
                                    <Input
                                        id={`${formId}-addressCity`}
                                        name="addressCity"
                                        defaultValue={state.values.addressCity}
                                    />
                                    <FieldError message={state.fieldErrors?.addressCity} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`${formId}-addressState`}>State/Region</Label>
                                    <Input
                                        id={`${formId}-addressState`}
                                        name="addressState"
                                        defaultValue={state.values.addressState}
                                    />
                                    <FieldError message={state.fieldErrors?.addressState} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`${formId}-addressPostalCode`}>Postal code</Label>
                                    <Input
                                        id={`${formId}-addressPostalCode`}
                                        name="addressPostalCode"
                                        defaultValue={state.values.addressPostalCode}
                                    />
                                    <FieldError message={state.fieldErrors?.addressPostalCode} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`${formId}-addressCountry`}>Country</Label>
                                    <Input
                                        id={`${formId}-addressCountry`}
                                        name="addressCountry"
                                        defaultValue={state.values.addressCountry}
                                    />
                                    <FieldError message={state.fieldErrors?.addressCountry} />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="text-sm font-semibold">Emergency contact</div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor={`${formId}-emergencyContactName`}>Name</Label>
                                    <Input
                                        id={`${formId}-emergencyContactName`}
                                        name="emergencyContactName"
                                        defaultValue={state.values.emergencyContactName}
                                    />
                                    <FieldError message={state.fieldErrors?.emergencyContactName} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`${formId}-emergencyContactRelationship`}>Relationship</Label>
                                    <Input
                                        id={`${formId}-emergencyContactRelationship`}
                                        name="emergencyContactRelationship"
                                        defaultValue={state.values.emergencyContactRelationship}
                                    />
                                    <FieldError message={state.fieldErrors?.emergencyContactRelationship} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`${formId}-emergencyContactPhone`}>Phone</Label>
                                    <Input
                                        id={`${formId}-emergencyContactPhone`}
                                        name="emergencyContactPhone"
                                        defaultValue={state.values.emergencyContactPhone}
                                    />
                                    <FieldError message={state.fieldErrors?.emergencyContactPhone} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`${formId}-emergencyContactEmail`}>Email</Label>
                                    <Input
                                        id={`${formId}-emergencyContactEmail`}
                                        name="emergencyContactEmail"
                                        type="email"
                                        defaultValue={state.values.emergencyContactEmail}
                                    />
                                    <FieldError message={state.fieldErrors?.emergencyContactEmail} />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="text-sm font-semibold">Profile photo</div>
                            <div className="space-y-2">
                                <Label htmlFor={`${formId}-photoUrl`}>Photo URL</Label>
                                <Input
                                    id={`${formId}-photoUrl`}
                                    name="photoUrl"
                                    type="url"
                                    placeholder="https://"
                                    defaultValue={state.values.photoUrl}
                                />
                                <FieldError message={state.fieldErrors?.photoUrl} />
                            </div>
                        </section>
                    </fieldset>
                </CardContent>
                <CardFooter className="border-t justify-between gap-4">
                    <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
                        {statusMessage}
                    </p>
                    <Button type="submit" size="sm" disabled={pending}>
                        {pending ? <Spinner className="mr-2" /> : null}
                        {pending ? 'Saving...' : 'Save changes'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
