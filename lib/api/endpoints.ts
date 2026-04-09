import { apiClient, type AuthSession, type Client, type CampaignSummary, type Brief, type Portal, type Playbook, type SettingGroup, type ActivityItem, type DashboardAnalytics, type ThroughputDatum, type SpecialistLoad, type WorkspaceInvite, type InvitePreview } from "./client";

async function authRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: { code: "UNKNOWN", message: "Request failed" } }));
    const error = errorBody.error ?? { code: "UNKNOWN", message: "Request failed" };
    throw Object.assign(new Error(error.message), { code: error.code, status: response.status });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json();
  return payload.data as T;
}

export const auth = {
  register: async (body: { name: string; email: string; password: string }): Promise<AuthSession> => {
    return authRequest<AuthSession>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  login: async (body: { email: string; password: string }): Promise<AuthSession> => {
    return authRequest<AuthSession>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  session: async (): Promise<AuthSession> => {
    return authRequest<AuthSession>("/api/auth/session");
  },

  logout: async (): Promise<void> => {
    return authRequest<void>("/api/auth/logout", {
      method: "POST",
    });
  },
};

export const clients = {
  list: async (accessToken: string): Promise<Client[]> => {
    return apiClient.get<Client[]>("/api/v1/clients", {}, accessToken);
  },

  get: async (id: string, accessToken: string): Promise<Client> => {
    return apiClient.get<Client>(`/api/v1/clients/${id}`, {}, accessToken);
  },

  create: async (body: Partial<Client>, accessToken: string): Promise<Client> => {
    return apiClient.post<Client>("/api/v1/clients", body, accessToken);
  },

  update: async (
    id: string,
    body: {
      health?: string;
      notes?: string;
      mrr_cents?: number;
      open_approvals_count?: number;
      touchpoint_note?: string;
    },
    accessToken: string,
  ): Promise<Client> => {
    return apiClient.patch<Client>(`/api/v1/clients/${id}`, body, accessToken);
  },
};

export const briefs = {
  list: async (accessToken: string): Promise<Brief[]> => {
    return apiClient.get<Brief[]>("/api/v1/briefs", {}, accessToken);
  },

  get: async (id: string, accessToken: string): Promise<Brief> => {
    return apiClient.get<Brief>(`/api/v1/briefs/${id}`, {}, accessToken);
  },

  create: async (body: Partial<Brief>, accessToken: string): Promise<Brief> => {
    return apiClient.post<Brief>("/api/v1/briefs", body, accessToken);
  },

  launch: async (
    id: string,
    body: { campaign_name?: string; budget_cents?: number; due_at?: string },
    accessToken: string,
  ): Promise<{ brief: Brief; campaign_id: string }> => {
    return apiClient.post<{ brief: Brief; campaign_id: string }>(
      `/api/v1/briefs/${id}/launch`,
      body,
      accessToken,
    );
  },
};

export const campaigns = {
  list: async (accessToken: string): Promise<CampaignSummary[]> => {
    return apiClient.get<CampaignSummary[]>("/api/v1/campaigns", {}, accessToken);
  },

  get: async (id: string, accessToken: string): Promise<CampaignSummary> => {
    return apiClient.get<CampaignSummary>(`/api/v1/campaigns/${id}`, {}, accessToken);
  },

  create: async (body: {
    client_id: string;
    brief_id?: string;
    name: string;
    status?: string;
    budget_cents?: number;
    due_at?: string;
    progress?: number;
    risk_level?: string;
    budget_currency?: string;
  }, accessToken: string): Promise<CampaignSummary> => {
    return apiClient.post<CampaignSummary>("/api/v1/campaigns", body, accessToken);
  },

  update: async (
    id: string,
    body: {
      client_id?: string;
      brief_id?: string;
      name?: string;
      status?: string;
      budget_cents?: number;
      due_at?: string;
      progress?: number;
      risk_level?: string;
      budget_currency?: string;
    },
    accessToken: string,
  ): Promise<CampaignSummary> => {
    return apiClient.patch<CampaignSummary>(`/api/v1/campaigns/${id}`, body, accessToken);
  },

  advance: async (id: string, body: { note?: string }, accessToken: string): Promise<CampaignSummary> => {
    return apiClient.post<CampaignSummary>(`/api/v1/campaigns/${id}/advance`, body, accessToken);
  },
};

export const portals = {
  list: async (accessToken: string): Promise<Portal[]> => {
    return apiClient.get<Portal[]>("/api/v1/portals", {}, accessToken);
  },

  get: async (id: string, accessToken: string): Promise<Portal> => {
    return apiClient.get<Portal>(`/api/v1/portals/${id}`, {}, accessToken);
  },

  create: async (body: Partial<Portal>, accessToken: string): Promise<Portal> => {
    return apiClient.post<Portal>("/api/v1/portals", body, accessToken);
  },

  update: async (id: string, body: Partial<Portal>, accessToken: string): Promise<Portal> => {
    return apiClient.patch<Portal>(`/api/v1/portals/${id}`, body, accessToken);
  },

  publish: async (
    id: string,
    body: { share_expires_at?: string; payload?: Record<string, unknown> },
    accessToken: string,
  ): Promise<Portal> => {
    return apiClient.post<Portal>(`/api/v1/portals/${id}/publish`, body, accessToken);
  },
};

export const workspace = {
  invites: {
    list: async (accessToken: string): Promise<WorkspaceInvite[]> => {
      return apiClient.get<WorkspaceInvite[]>("/api/v1/workspace/invites", {}, accessToken);
    },

    create: async (
      body: { email: string; role: string },
      accessToken: string,
    ): Promise<WorkspaceInvite> => {
      return apiClient.post<WorkspaceInvite>("/api/v1/workspace/invites", body, accessToken);
    },

    resend: async (id: string, accessToken: string): Promise<WorkspaceInvite> => {
      return apiClient.post<WorkspaceInvite>(`/api/v1/workspace/invites/${id}/resend`, undefined, accessToken);
    },

    revoke: async (id: string, accessToken: string): Promise<void> => {
      return apiClient.post<void>(`/api/v1/workspace/invites/${id}/revoke`, undefined, accessToken);
    },
  },

  playbooks: {
    list: async (accessToken: string): Promise<Playbook[]> => {
      return apiClient.get<Playbook[]>("/api/v1/workspace/playbooks", {}, accessToken);
    },

    create: async (body: Partial<Playbook>, accessToken: string): Promise<Playbook> => {
      return apiClient.post<Playbook>("/api/v1/workspace/playbooks", body, accessToken);
    },

    update: async (
      id: string,
      body: {
        name?: string;
        category?: string;
        status?: string;
        body?: string;
      },
      accessToken: string,
    ): Promise<Playbook> => {
      return apiClient.patch<Playbook>(`/api/v1/workspace/playbooks/${id}`, body, accessToken);
    },
  },

  settings: {
    get: async (accessToken: string): Promise<SettingGroup[]> => {
      return apiClient.get<SettingGroup[]>("/api/v1/workspace/settings", {}, accessToken);
    },

    update: async (
      body: {
        items: Array<{
          group_key: string;
          item_key: string;
          value: string;
        }>;
      },
      accessToken: string,
    ): Promise<SettingGroup[]> => {
      return apiClient.patch<SettingGroup[]>("/api/v1/workspace/settings", body, accessToken);
    },
  },

  activity: {
    list: async (accessToken: string): Promise<ActivityItem[]> => {
      return apiClient.get<ActivityItem[]>("/api/v1/workspace/activity", {}, accessToken);
    },
  },
};

export const invites = {
  inspect: async (token: string): Promise<InvitePreview> => {
    return authRequest<InvitePreview>(`/api/invites/${token}`);
  },

  accept: async (
    token: string,
    body: { name: string; password: string },
  ): Promise<AuthSession> => {
    return authRequest<AuthSession>(`/api/invites/${token}/accept`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};

export const analytics = {
  dashboard: async (accessToken: string): Promise<DashboardAnalytics> => {
    return apiClient.get<DashboardAnalytics>("/api/v1/analytics/dashboard", {}, accessToken);
  },

  throughput: async (accessToken: string, days?: number): Promise<ThroughputDatum[]> => {
    const params = days ? { days: String(days) } : undefined;
    return apiClient.get<ThroughputDatum[]>("/api/v1/analytics/throughput", params, accessToken);
  },

  specialists: async (accessToken: string): Promise<SpecialistLoad[]> => {
    return apiClient.get<SpecialistLoad[]>("/api/v1/analytics/specialists", {}, accessToken);
  },
};
