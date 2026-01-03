/**
 * HR Admin Hub - Zod Schemas for form validation
 * Single Responsibility: Schema definitions at boundaries
 */

import { z } from 'zod';

// ============================================================================
// Leave Management Schemas
// ============================================================================

export const approveLeaveFormSchema = z.object({
    requestId: z.uuid({ message: 'Invalid request ID' }),
    comments: z.string().max(500, 'Comments must be 500 characters or less').optional(),
});

export type ApproveLeaveFormInput = z.infer<typeof approveLeaveFormSchema>;

export const rejectLeaveFormSchema = z.object({
    requestId: z.uuid({ message: 'Invalid request ID' }),
    reason: z.string().min(1, 'Rejection reason is required').max(500),
});

export type RejectLeaveFormInput = z.infer<typeof rejectLeaveFormSchema>;

// ============================================================================
// Absence Management Schemas
// ============================================================================

export const acknowledgeAbsenceFormSchema = z.object({
    absenceId: z.uuid({ message: 'Invalid absence ID' }),
    note: z.string().max(500, 'Note must be 500 characters or less').optional(),
});

export type AcknowledgeAbsenceFormInput = z.infer<typeof acknowledgeAbsenceFormSchema>;

export const approveAbsenceFormSchema = z.object({
    absenceId: z.uuid({ message: 'Invalid absence ID' }),
    returnDate: z.coerce.date().optional(),
    notes: z.string().max(500).optional(),
});

export type ApproveAbsenceFormInput = z.infer<typeof approveAbsenceFormSchema>;

// ============================================================================
// Common Filter Schemas
// ============================================================================

export const adminFilterSchema = z.object({
    status: z.string().optional(),
    search: z.string().max(100).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
});

export type AdminFilterInput = z.infer<typeof adminFilterSchema>;
