import type {
    MentorAssignmentCreateInput,
    MentorAssignmentRecord,
    MentorAssignmentStatus,
    MentorAssignmentUpdateInput,
} from '@/server/types/hr/mentor-assignments';

export interface MentorAssignmentListFilters {
    employeeId?: string;
    mentorUserId?: string;
    status?: MentorAssignmentStatus;
}

export interface IMentorAssignmentRepository {
    createAssignment(input: MentorAssignmentCreateInput): Promise<MentorAssignmentRecord>;
    updateAssignment(
        orgId: string,
        assignmentId: string,
        updates: MentorAssignmentUpdateInput,
    ): Promise<MentorAssignmentRecord>;
    getAssignment(orgId: string, assignmentId: string): Promise<MentorAssignmentRecord | null>;
    listAssignments(orgId: string, filters?: MentorAssignmentListFilters): Promise<MentorAssignmentRecord[]>;
}
