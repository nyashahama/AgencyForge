import { apiClient, type Session, type SessionUser, type Client, type CampaignSummary, type Brief, type Portal, type Playbook, type SettingGroup, type ActivityItem, type DashboardAnalytics, type ThroughputDatum, type SpecialistLoad } from "./client";

export const auth = {
  register: async (body: { name: string; email: string; password: string }): Promise<Session> => {
    return apiClient.post<Session>("/api/v1/auth/register", body);
  },

  login: async (body: { email: string; password: string }): Promise<Session> => {
    return apiClient.post<Session>("/api/v1/auth/login", body);
  },

  refresh: async (body: { refresh_token: string }): Promise<Session> => {
    return apiClient.post<Session>("/api/v1/auth/refresh", body);
  },

  logout: async (body: { refresh_token: string }): Promise<void> => {
    return apiClient.post<void>("/api/v1/auth/logout", body);
  },

  me: async (accessToken: string): Promise<SessionUser> => {
    return apiClient.get<SessionUser>("/api/v1/auth/me", {}, accessToken);
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

  update: async (id: string, body: Partial<Client>, accessToken: string): Promise<Client> => {
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

  update: async (id: string, body: Partial<Brief>, accessToken: string): Promise<Brief> => {
    return apiClient.patch<Brief>(`/api/v1/briefs/${id}`, body, accessToken);
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

  update: async (id: string, body: Partial<CampaignSummary>, accessToken: string): Promise<CampaignSummary> => {
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
};

export const workspace = {
  playbooks: {
    list: async (accessToken: string): Promise<Playbook[]> => {
      return apiClient.get<Playbook[]>("/api/v1/workspace/playbooks", {}, accessToken);
    },

    create: async (body: Partial<Playbook>, accessToken: string): Promise<Playbook> => {
      return apiClient.post<Playbook>("/api/v1/workspace/playbooks", body, accessToken);
    },

    update: async (id: string, body: Partial<Playbook>, accessToken: string): Promise<Playbook> => {
      return apiClient.patch<Playbook>(`/api/v1/workspace/playbooks/${id}`, body, accessToken);
    },
  },

  settings: {
    get: async (accessToken: string): Promise<SettingGroup[]> => {
      return apiClient.get<SettingGroup[]>("/api/v1/workspace/settings", {}, accessToken);
    },

    update: async (body: Partial<SettingGroup>, accessToken: string): Promise<SettingGroup[]> => {
      return apiClient.patch<SettingGroup[]>("/api/v1/workspace/settings", body, accessToken);
    },
  },

  activity: {
    list: async (accessToken: string): Promise<ActivityItem[]> => {
      return apiClient.get<ActivityItem[]>("/api/v1/workspace/activity", {}, accessToken);
    },
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
