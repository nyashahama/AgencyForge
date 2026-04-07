const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    per_page: number;
    total: number;
  };
  request_id?: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: SessionUser;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  agency_id: string;
  agency: string;
  role: string;
}

export interface CampaignSummary {
  id: string;
  client_id: string;
  client_name: string;
  brief_id?: string;
  name: string;
  status: string;
  progress: number;
  budget_cents: number;
  budget_currency: string;
  risk_level: string;
  deliverable_count: number;
  pending_approvals_count: number;
  owner_email: string;
  specialists: string[];
  due_at?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  slug: string;
  lead_email: string;
  health: string;
  notes: string;
  mrr_cents: number;
  open_approvals_count: number;
  last_touchpoint_at?: string;
  primary_contact?: Contact;
  latest_touchpoint?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  role: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Touchpoint {
  id: string;
  author_user_id?: string;
  note: string;
  happened_at: string;
  created_at: string;
}

export interface Brief {
  id: string;
  client_id: string;
  client_name: string;
  title: string;
  channel: string;
  status: string;
  pages: number;
  owner_email: string;
  source_type: string;
  next_action: string;
  document_count: number;
  launched_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Portal {
  id: string;
  client_id: string;
  client_name: string;
  name: string;
  slug: string;
  theme: string;
  review_mode: string;
  share_state: string;
  description: string;
  latest_publication_version: number;
  active_share_count: number;
  published_at?: string;
  last_published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Playbook {
  id: string;
  name: string;
  category: string;
  owner_name: string;
  status: string;
  body: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SettingGroup {
  id: string;
  key: string;
  name: string;
  description: string;
  sort_order: number;
  items: SettingItem[];
  created_at: string;
  updated_at: string;
}

export interface SettingItem {
  id: string;
  key: string;
  label: string;
  value: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityItem {
  id: string;
  event_type: string;
  subject_type: string;
  message: string;
  icon: string;
  metadata?: Record<string, unknown>;
  occurred_at: string;
}

export interface DashboardAnalytics {
  active_campaigns: number;
  pending_reviews: number;
  briefs_in_intake: number;
  live_portals: number;
  recent_activity: ActivityItem[];
}

export interface ThroughputDatum {
  day: string;
  campaigns: number;
}

export interface SpecialistLoad {
  specialist_code: string;
  specialist_name: string;
  active_assignments: number;
  load_units: number;
}

class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      params?: Record<string, string>;
      accessToken?: string | null;
    } = {}
  ): Promise<T> {
    const { body, params, accessToken } = options;
    const token = accessToken ?? this.accessToken;

    let url = `${API_BASE}${path}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: { code: "UNKNOWN", message: "Request failed" } }));
      const error: ApiError = errorBody.error ?? { code: "UNKNOWN", message: "Request failed" };
      throw Object.assign(new Error(error.message), { code: error.code, status: response.status });
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const data: ApiResponse<T> = await response.json();
    return data.data;
  }

  async get<T>(path: string, params?: Record<string, string>, accessToken?: string | null): Promise<T> {
    return this.request<T>("GET", path, { params, accessToken });
  }

  async post<T>(path: string, body?: unknown, accessToken?: string | null): Promise<T> {
    return this.request<T>("POST", path, { body, accessToken });
  }

  async patch<T>(path: string, body?: unknown, accessToken?: string | null): Promise<T> {
    return this.request<T>("PATCH", path, { body, accessToken });
  }

  async delete<T>(path: string, accessToken?: string | null): Promise<T> {
    return this.request<T>("DELETE", path, { accessToken });
  }
}

export const apiClient = new ApiClient();
