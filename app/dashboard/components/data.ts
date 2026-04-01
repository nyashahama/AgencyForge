export const USER = {
  name: "Sophia Lund",
  initials: "SL",
  role: "Creative Director",
  agency: "Neon & Stone",
  plan: "Agency",
};

export type BriefStatus = "new" | "processing" | "ready" | "blocked";
export type CampaignStatus = "review" | "generating" | "approved";
export type ClientHealth = "strong" | "watch" | "risk";

export type Brief = {
  id: string;
  clientId: string;
  client: string;
  title: string;
  channel: string;
  uploaded: string;
  status: BriefStatus;
  pages: number;
  nextAction: string;
  owner: string;
};

export type Campaign = {
  id: string;
  clientId: string;
  client: string;
  name: string;
  status: CampaignStatus;
  statusLabel: string;
  progress: number;
  due: string;
  urgent: boolean;
  agents: string[];
  briefId: string;
  lead: string;
  budget: string;
  risk: "Low" | "Medium" | "High";
  deliverableCount: number;
};

export type Client = {
  id: string;
  name: string;
  lead: string;
  health: ClientHealth;
  activeCampaigns: number;
  openApprovals: number;
  lastTouchpoint: string;
  mrr: string;
  notes: string;
};

export type PortalWorkspace = {
  id: string;
  clientId: string;
  name: string;
  theme: string;
  reviewMode: string;
  shareState: string;
  lastPublished: string;
};

export type Playbook = {
  id: string;
  name: string;
  category: string;
  owner: string;
  updated: string;
  status: "published" | "draft";
};

export type SettingGroup = {
  id: string;
  name: string;
  description: string;
  items: Array<{ label: string; value: string }>;
};

export const BRIEFS: Brief[] = [
  {
    id: "b-001",
    clientId: "cl-001",
    client: "Meridian Bank",
    title: "Retail credit expansion",
    channel: "Brand + Paid Social",
    uploaded: "12 min ago",
    status: "ready",
    pages: 14,
    nextAction: "Launch campaign package",
    owner: "Sophia Lund",
  },
  {
    id: "b-002",
    clientId: "cl-002",
    client: "Volta Footwear",
    title: "Summer launch 2026",
    channel: "Multi-channel launch",
    uploaded: "34 min ago",
    status: "processing",
    pages: 9,
    nextAction: "Wait for media model",
    owner: "Ava Grant",
  },
  {
    id: "b-003",
    clientId: "cl-003",
    client: "Helix Health",
    title: "Awareness sprint",
    channel: "Digital video",
    uploaded: "2 hours ago",
    status: "blocked",
    pages: 11,
    nextAction: "Resolve legal usage note",
    owner: "Marcus Reid",
  },
  {
    id: "b-004",
    clientId: "cl-004",
    client: "Crest Foods",
    title: "Oat series launch",
    channel: "OOH + Retail",
    uploaded: "Today, 08:10",
    status: "new",
    pages: 7,
    nextAction: "Normalize intake brief",
    owner: "Sophia Lund",
  },
];

export const CAMPAIGNS: Campaign[] = [
  {
    id: "c-001",
    clientId: "cl-001",
    client: "Meridian Bank",
    name: "Q3 Brand Refresh",
    status: "review",
    statusLabel: "Pending review",
    progress: 88,
    due: "Today, 5 PM",
    urgent: true,
    agents: ["Copy", "Design", "Media"],
    briefId: "b-001",
    lead: "Sophia Lund",
    budget: "$180k",
    risk: "Medium",
    deliverableCount: 12,
  },
  {
    id: "c-002",
    clientId: "cl-002",
    client: "Volta Footwear",
    name: "Summer Launch 2026",
    status: "generating",
    statusLabel: "Generating",
    progress: 47,
    due: "Tomorrow",
    urgent: false,
    agents: ["Copy", "Media", "Legal"],
    briefId: "b-002",
    lead: "Ava Grant",
    budget: "$240k",
    risk: "Low",
    deliverableCount: 8,
  },
  {
    id: "c-003",
    clientId: "cl-003",
    client: "Helix Health",
    name: "Awareness Campaign",
    status: "approved",
    statusLabel: "Approved",
    progress: 100,
    due: "Delivered",
    urgent: false,
    agents: ["Copy", "Design", "Media", "Legal"],
    briefId: "b-003",
    lead: "Marcus Reid",
    budget: "$95k",
    risk: "Low",
    deliverableCount: 10,
  },
  {
    id: "c-004",
    clientId: "cl-004",
    client: "Crest Foods",
    name: "Product Launch Oat Series",
    status: "generating",
    statusLabel: "Generating",
    progress: 22,
    due: "In 3 days",
    urgent: false,
    agents: ["Copy", "Design"],
    briefId: "b-004",
    lead: "Sophia Lund",
    budget: "$120k",
    risk: "High",
    deliverableCount: 6,
  },
  {
    id: "c-005",
    clientId: "cl-005",
    client: "Drift Mobility",
    name: "Performance OOH",
    status: "review",
    statusLabel: "Pending review",
    progress: 75,
    due: "In 2 days",
    urgent: false,
    agents: ["Copy", "Design", "Media"],
    briefId: "b-001",
    lead: "Ava Grant",
    budget: "$132k",
    risk: "Medium",
    deliverableCount: 9,
  },
];

export const CLIENTS: Client[] = [
  {
    id: "cl-001",
    name: "Meridian Bank",
    lead: "Sophia Lund",
    health: "strong",
    activeCampaigns: 2,
    openApprovals: 4,
    lastTouchpoint: "Approved copy suite 2 min ago",
    mrr: "$42k",
    notes: "Needs faster legal turnaround on regional variants.",
  },
  {
    id: "cl-002",
    name: "Volta Footwear",
    lead: "Ava Grant",
    health: "strong",
    activeCampaigns: 1,
    openApprovals: 2,
    lastTouchpoint: "Media plan generated 18 min ago",
    mrr: "$36k",
    notes: "High launch urgency, but stakeholder response time is good.",
  },
  {
    id: "cl-003",
    name: "Helix Health",
    lead: "Marcus Reid",
    health: "watch",
    activeCampaigns: 1,
    openApprovals: 1,
    lastTouchpoint: "Compliance comment thread 1h ago",
    mrr: "$28k",
    notes: "Approval cycles lengthen when medical claims enter review.",
  },
  {
    id: "cl-004",
    name: "Crest Foods",
    lead: "Sophia Lund",
    health: "risk",
    activeCampaigns: 1,
    openApprovals: 5,
    lastTouchpoint: "New intake brief uploaded 2h ago",
    mrr: "$19k",
    notes: "Stakeholder map is incomplete and tone calibration is unresolved.",
  },
];

export const PORTAL_WORKSPACES: PortalWorkspace[] = [
  {
    id: "pw-001",
    clientId: "cl-001",
    name: "Meridian Executive Portal",
    theme: "Graphite / Lime",
    reviewMode: "Stage gate",
    shareState: "Published",
    lastPublished: "Today, 10:22",
  },
  {
    id: "pw-002",
    clientId: "cl-002",
    name: "Volta Launch Room",
    theme: "Obsidian / Sand",
    reviewMode: "Rolling review",
    shareState: "Draft",
    lastPublished: "Yesterday",
  },
  {
    id: "pw-003",
    clientId: "cl-003",
    name: "Helix Compliance Workspace",
    theme: "Slate / Cyan",
    reviewMode: "Compliance first",
    shareState: "Published",
    lastPublished: "3 days ago",
  },
];

export const PLAYBOOKS: Playbook[] = [
  {
    id: "pb-001",
    name: "Client onboarding",
    category: "Operations",
    owner: "Sophia Lund",
    updated: "Today",
    status: "published",
  },
  {
    id: "pb-002",
    name: "Revision policy",
    category: "Delivery",
    owner: "Ava Grant",
    updated: "Yesterday",
    status: "published",
  },
  {
    id: "pb-003",
    name: "Legal review",
    category: "Compliance",
    owner: "Marcus Reid",
    updated: "2 days ago",
    status: "draft",
  },
  {
    id: "pb-004",
    name: "Media planning rubric",
    category: "Strategy",
    owner: "Ava Grant",
    updated: "This week",
    status: "published",
  },
];

export const SETTINGS_GROUPS: SettingGroup[] = [
  {
    id: "sg-001",
    name: "Workspace identity",
    description: "Default brand presentation across client-facing surfaces.",
    items: [
      { label: "Primary brand", value: "Neon & Stone" },
      { label: "Default portal theme", value: "Graphite / Lime" },
      { label: "Presentation mode", value: "White-label enabled" },
    ],
  },
  {
    id: "sg-002",
    name: "Notifications",
    description: "How the team is alerted during delivery and review.",
    items: [
      { label: "Approval alerts", value: "Instant" },
      { label: "Risk escalation", value: "Slack + email" },
      { label: "Client digest", value: "Daily 08:00" },
    ],
  },
  {
    id: "sg-003",
    name: "Permissions",
    description: "Access boundaries for internal roles and clients.",
    items: [
      { label: "Client comments", value: "Enabled" },
      { label: "Publishing rights", value: "Directors only" },
      { label: "Document exports", value: "Tracked" },
    ],
  },
];

export const STATS = [
  {
    label: "Active campaigns",
    value: String(CAMPAIGNS.length),
    delta: "+3 this week",
    tag: "Live",
  },
  {
    label: "Briefs processed",
    value: "312",
    delta: "+18 this month",
    tag: "Lifetime",
  },
  {
    label: "Client approval rate",
    value: "98%",
    delta: "+2% vs last month",
    tag: "Rate",
  },
  {
    label: "Avg. turnaround",
    value: "4.2h",
    delta: "−0.6h vs last month",
    tag: "Speed",
  },
];

export const ACTIVITY = [
  {
    id: 1,
    type: "approved",
    text: "Meridian Bank approved copy suite",
    time: "2 min ago",
    icon: "✓",
  },
  {
    id: 2,
    type: "generate",
    text: "Volta Footwear media plan generated",
    time: "18 min ago",
    icon: "⚡",
  },
  {
    id: 3,
    type: "comment",
    text: "Helix Health left 3 comments",
    time: "1h ago",
    icon: "✦",
  },
  {
    id: 4,
    type: "brief",
    text: "New brief uploaded for Crest Foods",
    time: "2h ago",
    icon: "↑",
  },
  {
    id: 5,
    type: "legal",
    text: "Legal docs ready for Drift Mobility",
    time: "3h ago",
    icon: "⊙",
  },
];

export const AGENTS = [
  { name: "Copy", status: "active", load: 4, color: "#c8ff00" },
  { name: "Design", status: "active", load: 3, color: "#c8ff00" },
  { name: "Media", status: "active", load: 2, color: "#c8ff00" },
  { name: "Legal", status: "idle", load: 1, color: "#d4d0c8" },
  { name: "Budget", status: "active", load: 2, color: "#c8ff00" },
  { name: "Portal", status: "active", load: 4, color: "#c8ff00" },
];

export const THROUGHPUT = [
  { day: "Mon", campaigns: 3 },
  { day: "Tue", campaigns: 5 },
  { day: "Wed", campaigns: 4 },
  { day: "Thu", campaigns: 7 },
  { day: "Fri", campaigns: 6 },
  { day: "Sat", campaigns: 2 },
  { day: "Sun", campaigns: 4 },
];
