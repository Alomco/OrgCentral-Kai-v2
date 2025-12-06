import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getPeopleService } from '@/server/services/hr/people/people-service.provider';
import {
  createEmploymentContractInputSchema,
  getEmploymentContractRequestSchema,
  listEmploymentContractsRequestSchema,
  updateEmploymentContractInputSchema,
} from '@/server/types/hr-people-schemas';
import type { EmploymentContract } from '@/server/types/hr-types';
import { normalizeContractChanges } from '@/server/services/hr/people/helpers/onboard-payload.helpers';

interface ListContractsResult {
  success: true;
  data: { contracts: EmploymentContract[] };
}

interface CreateContractResult {
  success: true;
  data: { contractId: string };
}

interface GetContractResult {
  success: true;
  data: { contract: EmploymentContract | null };
}

interface UpdateContractResult {
  success: true;
  data: { contractId: string };
}

interface DeleteContractResult {
  success: true;
}

async function readJson<T = unknown>(request: Request, fallback: T): Promise<T> {
  try {
    return await request.json() as T;
  } catch {
    return fallback;
  }
}

export async function listContractsController(request: Request): Promise<ListContractsResult> {
  const raw = await readJson(request, {});
  const input = listEmploymentContractsRequestSchema.parse(raw);

  const { authorization } = await getSessionContext({}, {
    headers: request.headers,
    requiredRoles: ['member'],
    auditSource: 'api:hr:people:contracts:list',
    action: 'read',
    resourceType: 'employmentContract',
    resourceAttributes: { filterCount: Object.keys(input.filters ?? {}).length, filters: input.filters },
  });

  const service = getPeopleService();
  const result = await service.listEmploymentContracts({
    authorization,
    payload: { filters: input.filters },
  });

  return { success: true, data: { contracts: result.contracts } };
}

export async function createContractController(request: Request): Promise<CreateContractResult> {
  const raw = await readJson(request, {});
  const input = createEmploymentContractInputSchema.parse(raw);

  const { authorization } = await getSessionContext({}, {
    headers: request.headers,
    requiredRoles: ['orgAdmin'],
    auditSource: 'api:hr:people:contracts:create',
    action: 'create',
    resourceType: 'employmentContract',
    resourceAttributes: {
      targetUserId: input.targetUserId,
      contractType: input.changes.contractType,
      jobTitle: input.changes.jobTitle,
    },
  });

  const service = getPeopleService();
  const contractData = normalizeContractChanges(input.changes);
  const result = await service.createEmploymentContract({
    authorization,
    payload: {
      contractData: {
        ...contractData,
        userId: input.targetUserId,
        contractType: input.changes.contractType,
        jobTitle: input.changes.jobTitle,
        startDate: input.changes.startDate,
      },
    },
  });

  return { success: true, data: { contractId: result.contractId } };
}

export async function getContractController(
  request: Request,
  contractId: string,
): Promise<GetContractResult> {
  const input = getEmploymentContractRequestSchema.parse({ contractId });

  const { authorization } = await getSessionContext({}, {
    headers: request.headers,
    requiredRoles: ['member'],
    auditSource: 'api:hr:people:contracts:get',
    action: 'read',
    resourceType: 'employmentContract',
    resourceAttributes: { contractId: input.contractId },
  });

  const service = getPeopleService();
  const result = await service.getEmploymentContract({
    authorization,
    payload: { contractId: input.contractId },
  });

  return { success: true, data: { contract: result.contract } };
}

export async function updateContractController(
  request: Request,
  contractId: string,
): Promise<UpdateContractResult> {
  const raw = await readJson<Record<string, unknown>>(request, {});
  const parsed = updateEmploymentContractInputSchema.parse({ ...raw, contractId });

  const { authorization } = await getSessionContext({}, {
    headers: request.headers,
    requiredRoles: ['orgAdmin'],
    auditSource: 'api:hr:people:contracts:update',
    action: 'update',
    resourceType: 'employmentContract',
    resourceAttributes: { contractId: parsed.contractId, updateKeys: Object.keys(parsed.changes) },
  });

  const service = getPeopleService();
  const contractUpdates = normalizeContractChanges(parsed.changes);
  const result = await service.updateEmploymentContract({
    authorization,
    payload: { contractId: parsed.contractId, contractUpdates },
  });

  return { success: true, data: { contractId: result.contractId } };
}

export async function deleteContractController(
  request: Request,
  contractId: string,
): Promise<DeleteContractResult> {
  const { authorization } = await getSessionContext({}, {
    headers: request.headers,
    requiredRoles: ['orgAdmin'],
    auditSource: 'api:hr:people:contracts:delete',
    action: 'delete',
    resourceType: 'employmentContract',
    resourceAttributes: { contractId },
  });

  const service = getPeopleService();
  await service.deleteEmploymentContract({
    authorization,
    payload: { contractId },
  });

  return { success: true };
}
