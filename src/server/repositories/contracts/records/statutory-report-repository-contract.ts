import type { StatutoryReportRecord, StatutoryReportFilters, StatutoryReportCreationData, StatutoryReportUpdateData } from '@/server/types/records/statutory-report';

export interface IStatutoryReportRepository {
    findById(id: string): Promise<StatutoryReportRecord | null>;
    findByOrgAndTypeAndPeriod(orgId: string, reportType: string, period: string): Promise<StatutoryReportRecord | null>;
    findAll(filters?: StatutoryReportFilters): Promise<StatutoryReportRecord[]>;
    create(data: StatutoryReportCreationData): Promise<StatutoryReportRecord>;
    update(id: string, data: StatutoryReportUpdateData): Promise<StatutoryReportRecord>;
    delete(id: string): Promise<StatutoryReportRecord>;
    markAsSubmitted(id: string, submittedByOrgId: string, submittedByUserId: string): Promise<StatutoryReportRecord>;
}
