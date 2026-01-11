export interface AbsenceTypeCreateValues {
    label: string;
    key: string;
    tracksBalance: boolean;
    isActive: boolean;
}

export interface AbsenceTypeCreateState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    fieldErrors?: Partial<Record<keyof AbsenceTypeCreateValues, string>>;
    values: AbsenceTypeCreateValues;
}

export interface AbsenceTypeInlineState {
    status: 'idle' | 'success' | 'error';
    message?: string;
}
