# AgencyForge Integration Plan

## Phase 1: API Client Foundation

### 1.1 Create API Client
**File:** `lib/api/client.ts`
- Base fetch wrapper with auth header injection
- Automatic 401 handling (token refresh + retry)
- Typed response envelope unwrapping
- Error normalization

### 1.2 Create Endpoint Helpers
**File:** `lib/api/endpoints.ts`
- `auth` - register, login, refresh, logout, me
- `clients` - list, get, create, update
- `briefs` - list, get, create, update
- `campaigns` - list, get, create, update, advance
- `portals` - list, get, create, update
- `workspace` - playbooks, settings, activity
- `analytics` - dashboard, throughput, specialists

### 1.3 Create Token Store
**File:** `lib/auth/token-store.ts`
- Store refresh_token in httpOnly cookie
- Access token in memory (React state/context)
- Cookie options: secure, sameSite: 'lax'

### 1.4 Create Session Context
**File:** `lib/auth/session.ts`
- `SessionProvider` - wraps app, initializes from cookie
- `useSession()` - access current user + tokens
- `useAuth()` - login, logout, register helpers
- Protected route logic

## Phase 2: Auth Pages

### 2.1 Update Login Page
**File:** `app/login/page.tsx`
- Replace mock delay with `POST /api/v1/auth/login`
- On success: store tokens, redirect to dashboard
- On error: display server error message

### 2.2 Update Signup Page
**File:** `app/signup/page.tsx`
- Connect to `POST /api/v1/auth/register`
- On success: auto-login and redirect

### 2.3 Create Logout Action
**File:** `app/actions/logout.ts`
- Call `POST /api/v1/auth/logout`
- Clear tokens from cookie
- Redirect to login

### 2.4 Add Auth Guard
**File:** `app/dashboard/layout.tsx`
- Redirect to /login if no valid session
- Refresh token on app load if expired

## Phase 3: Dashboard Data

### 3.1 Create Server Data Loaders
**Files:** `app/dashboard/actions.ts`
- `getDashboardData()` - parallel fetch campaigns, briefs, clients, analytics
- `getWorkspaceData()` - playbooks, settings, activity

### 3.2 Update Dashboard Page
**File:** `app/dashboard/page.tsx`
- Fetch real data via server actions
- Pass data to DashboardShell as props

### 3.3 Update Dashboard Components
**Files:** `app/dashboard/components/*.tsx`
- CampaignTable, DashboardKpiGrid, ActivityFeed
- ThroughputChart, AgentStatus, StatsBar
- Replace mock-state consumers with API data

## Phase 4: Domain Pages

### 4.1 Clients Page
**File:** `app/dashboard/clients/page.tsx`
- Fetch from `GET /api/v1/clients`
- Create/update via mutations

### 4.2 Briefs Page
**File:** `app/dashboard/briefs/page.tsx`
- Fetch from `GET /api/v1/briefs`
- Create/update/advance via mutations

### 4.3 Campaigns Page
**File:** `app/dashboard/campaigns/page.tsx`
- Fetch from `GET /api/v1/campaigns`
- Create/update/advance via mutations

### 4.4 Portal Page
**File:** `app/dashboard/portal/page.tsx`
- Fetch from `GET /api/v1/portals`
- Create/update via mutations

### 4.5 Analytics Page
**File:** `app/dashboard/analytics/page.tsx`
- Fetch from analytics endpoints

### 4.6 Settings Page
**File:** `app/dashboard/settings/page.tsx`
- Fetch workspace settings

## Phase 5: Deprecate Mock State

### 5.1 Remove Mock Provider
**File:** `app/dashboard/components/mock-state.tsx`
- Remove MockDashboardProvider wrapper
- Remove useMockDashboard hook usages

### 5.2 Remove Mock Data
**File:** `app/dashboard/components/data.ts`
- Remove static mock data arrays
- These become unused after Phase 4

## Implementation Order

1. Phase 1 (Foundation) - Critical path
2. Phase 2 (Auth) - Enables everything else
3. Phase 3 (Dashboard) - Core user experience
4. Phase 4 (Domain Pages) - Feature completeness
5. Phase 5 (Cleanup) - Remove technical debt

## Verification

- `curl http://localhost:8080/healthz` returns 200
- Login flow completes without mock delay
- Dashboard shows real agency data
- Token refresh works transparently
- Logout clears session properly
