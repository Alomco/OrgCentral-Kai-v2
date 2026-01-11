export interface EmployeeQuickEditState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    fieldErrors?: Partial<Record<'employmentStatus' | 'jobTitle', string>>;
}

export const EMPLOYEE_QUICK_EDIT_INITIAL_STATE: EmployeeQuickEditState = {
    status: 'idle',
};
