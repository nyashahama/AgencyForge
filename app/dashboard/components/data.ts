export const USER = {
  name: "Sophia Lund",
  initials: "SL",
  role: "Creative Director",
  agency: "Neon & Stone",
  plan: "Agency",
};

export const STATS = [
  {
    label: "Active campaigns",
    value: "24",
    delta: "+3 this week",
    up: true,
    tag: "Live",
  },
  {
    label: "Briefs processed",
    value: "312",
    delta: "+18 this month",
    up: true,
    tag: "Lifetime",
  },
  {
    label: "Client approval rate",
    value: "98%",
    delta: "+2% vs last month",
    up: true,
    tag: "Rate",
  },
  {
    label: "Avg. turnaround",
    value: "4.2h",
    delta: "−0.6h vs last month",
    up: true,
    tag: "Speed",
  },
];

type Status = "review" | "generating" | "approved";

export const CAMPAIGNS: {
  id: string;
  client: string;
  name: string;
  status: Status;
  statusLabel: string;
  agents: string[];
  progress: number;
  due: string;
  urgent: boolean;
}[] = [
  {
    id: "c-001",
    client: "Meridian Bank",
    name: "Q3 Brand Refresh",
    status: "review",
    statusLabel: "Pending review",
    agents: ["Copy", "Design", "Media"],
    progress: 88,
    due: "Today, 5 PM",
    urgent: true,
  },
  {
    id: "c-002",
    client: "Volta Footwear",
    name: "Summer Launch 2026",
    status: "generating",
    statusLabel: "Generating",
    agents: ["Copy", "Media", "Legal"],
    progress: 47,
    due: "Tomorrow",
    urgent: false,
  },
  {
    id: "c-003",
    client: "Helix Health",
    name: "Awareness Campaign",
    status: "approved",
    statusLabel: "Approved",
    agents: ["Copy", "Design", "Media", "Legal"],
    progress: 100,
    due: "Delivered",
    urgent: false,
  },
  {
    id: "c-004",
    client: "Crest Foods",
    name: "Product Launch — Oat Series",
    status: "generating",
    statusLabel: "Generating",
    agents: ["Copy", "Design"],
    progress: 22,
    due: "In 3 days",
    urgent: false,
  },
  {
    id: "c-005",
    client: "Drift Mobility",
    name: "Performance OOH",
    status: "review",
    statusLabel: "Pending review",
    agents: ["Copy", "Design", "Media"],
    progress: 75,
    due: "In 2 days",
    urgent: false,
  },
  {
    id: "c-006",
    client: "Sage Interiors",
    name: "Brand Identity Brief",
    status: "approved",
    statusLabel: "Approved",
    agents: ["Copy", "Design"],
    progress: 100,
    due: "Delivered",
    urgent: false,
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
    text: "Volta Footwear — media plan generated",
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
    text: "New brief uploaded — Crest Foods",
    time: "2h ago",
    icon: "↑",
  },
  {
    id: 5,
    type: "legal",
    text: "Legal docs ready — Drift Mobility",
    time: "3h ago",
    icon: "⊙",
  },
  {
    id: 6,
    type: "approved",
    text: "Sage Interiors approved all deliverables",
    time: "Yesterday",
    icon: "✓",
  },
];

export const AGENTS = [
  { name: "Copy", status: "active", load: 4, color: "#c8ff00" },
  { name: "Design", status: "active", load: 3, color: "#c8ff00" },
  { name: "Media", status: "active", load: 2, color: "#c8ff00" },
  { name: "Legal", status: "idle", load: 0, color: "#d4d0c8" },
  { name: "Budget", status: "active", load: 1, color: "#c8ff00" },
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
