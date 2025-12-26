export interface DebugOrgSummary {
  id: string;
  slug: string;
  name: string;
}

export interface DebugSecurityResponseAuthenticated {
  ok: true;
  authenticated: true;
  session: {
    user: {
      id: string;
      email: string | null;
      name: string | null;
    };
    session: {
      activeOrganizationId: string | null;
      expiresAt?: string;
      createdAt?: string;
    };
  };
  organizations?: DebugOrgSummary[];
  authorization?: {
    orgId: string;
    userId: string;
    roleKey: string;
    dataResidency: string;
    dataClassification: string;
    auditSource: string;
    correlationId: string;
    developmentSuperAdmin?: boolean;
  };
  rbac?: {
    roleStatements?: Record<string, string[]>;
  };
  abac?: {
    policyCount: number;
    policies: {
      id: string;
      effect: "allow" | "deny";
      actions: string[];
      resources: string[];
      priority?: number;
      description?: string;
    }[];
    usingFallbackPolicies: boolean;
  };
  warning?: string;
}

export interface DebugSecurityResponseUnauthenticated {
  ok: true;
  authenticated: false;
}

export type DebugSecurityResponse =
  | DebugSecurityResponseAuthenticated
  | DebugSecurityResponseUnauthenticated;
