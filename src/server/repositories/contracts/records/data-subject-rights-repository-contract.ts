import type { DataSubjectRight, DataSubjectRightFilters, DataSubjectRightCreationData, DataSubjectRightUpdateData } from '@/server/types/records/data-subject-right';

export interface IDataSubjectRightsRepository {
    findById(id: string): Promise<DataSubjectRight | null>;
    findByOrgAndRightType(orgId: string, rightType: string): Promise<DataSubjectRight[]>;
    findAll(filters?: DataSubjectRightFilters): Promise<DataSubjectRight[]>;
    create(data: DataSubjectRightCreationData): Promise<DataSubjectRight>;
    update(id: string, data: DataSubjectRightUpdateData): Promise<DataSubjectRight>;
    delete(id: string): Promise<DataSubjectRight>;
    markAsCompleted(id: string, response: string, responseFrom: string): Promise<DataSubjectRight>;
    updateStatus(id: string, status: string): Promise<DataSubjectRight>;
}
