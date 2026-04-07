# AgencyForge Backend-Frontend Integration Spec

## Overview

Integrate the Go backend API with the Next.js frontend, replacing mock state with real API-backed data fetching and authenticated session handling.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│   Go Backend    │────▶│   PostgreSQL    │
│  (Frontend)     │◀────│   (API)         │◀────│   (Database)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## API Base URL

- Development: `http://localhost:8080`
- All API calls prefixed with `/api/v1`

## Authentication Flow

### Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | No | Create agency + user |
| POST | `/api/v1/auth/login` | No | Login, returns tokens |
| POST | `/api/v1/auth/refresh` | No | Refresh access token |
| POST | `/api/v1/auth/logout` | No | Revoke refresh token |
| GET | `/api/v1/auth/me` | Yes | Get current user |

### Session Shape
```typescript
interface Session {
  access_token: string;  // JWT, short-lived
  refresh_token: string; // Opaque, long-lived
  expires_at: number;    // Unix timestamp
  user: {
    id: string;
    email: string;
    name: string;
    agency_id: string;
  };
}
```

### Token Storage
- Access token: memory (not persisted)
- Refresh token: httpOnly cookie
- Token rotation on refresh

## Protected Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/clients` | List clients |
| POST | `/api/v1/clients` | Create client |
| GET | `/api/v1/clients/:id` | Get client |
| PATCH | `/api/v1/clients/:id` | Update client |
| GET | `/api/v1/briefs` | List briefs |
| POST | `/api/v1/briefs` | Create brief |
| GET | `/api/v1/briefs/:id` | Get brief |
| PATCH | `/api/v1/briefs/:id` | Update brief |
| GET | `/api/v1/campaigns` | List campaigns |
| POST | `/api/v1/campaigns` | Create campaign |
| GET | `/api/v1/campaigns/:id` | Get campaign |
| PATCH | `/api/v1/campaigns/:id` | Update campaign |
| POST | `/api/v1/campaigns/:id/advance` | Advance workflow |
| GET | `/api/v1/portals` | List portals |
| POST | `/api/v1/portals` | Create portal |
| GET | `/api/v1/portals/:id` | Get portal |
| PATCH | `/api/v1/portals/:id` | Update portal |
| GET | `/api/v1/workspace/playbooks` | List playbooks |
| POST | `/api/v1/workspace/playbooks` | Create playbook |
| PATCH | `/api/v1/workspace/playbooks/:id` | Update playbook |
| GET | `/api/v1/workspace/settings` | Get settings |
| PATCH | `/api/v1/workspace/settings` | Update settings |
| GET | `/api/v1/workspace/activity` | Get activity feed |
| GET | `/api/v1/analytics/dashboard` | Dashboard metrics |
| GET | `/api/v1/analytics/throughput` | Throughput data |
| GET | `/api/v1/analytics/specialists` | Specialist load |

## Response Envelope

All responses follow:
```typescript
interface ApiResponse<T> {
  data: T;
  request_id: string;
}
```

Errors:
```typescript
interface ApiError {
  code: string;
  message: string;
  details?: string;
}
```

## CORS

- Allowed origins: frontend URL (env-configured)
- Credentials: included with fetch

## Frontend Changes

### New Files
- `lib/api/client.ts` - API client with auth
- `lib/api/endpoints.ts` - Endpoint helpers
- `lib/auth/session.ts` - Session context + hooks
- `lib/auth/token-store.ts` - Token management

### Modified Files
- `app/layout.tsx` - Session provider
- `app/login/page.tsx` - Connect to backend
- `app/signup/page.tsx` - Connect to backend
- `app/dashboard/layout.tsx` - Auth guard
- `app/dashboard/page.tsx` - Real API data
- `app/dashboard/components/mock-state.tsx` - Deprecated

### Data Fetching Pattern
```typescript
// Server components for initial data
async function getDashboardData() {
  const session = await getSession();
  const [campaigns, briefs, clients] = await Promise.all([
    fetchCampaigns(session.access_token),
    fetchBriefs(session.access_token),
    fetchClients(session.access_token),
  ]);
  return { campaigns, briefs, clients };
}

// Client mutations via actions
async function submitBrief(formData: FormData) {
  const session = await getSession();
  return createBrief(session.access_token, Object.fromEntries(formData));
}
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```
