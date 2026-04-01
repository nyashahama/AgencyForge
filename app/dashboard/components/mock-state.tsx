"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import {
  ACTIVITY,
  AGENTS,
  BRIEFS,
  CAMPAIGNS,
  CLIENTS,
  PLAYBOOKS,
  PORTAL_WORKSPACES,
  SETTINGS_GROUPS,
  THROUGHPUT,
  USER,
  type Brief,
  type Campaign,
  type Client,
  type Playbook,
  type PortalWorkspace,
  type SettingGroup,
} from "./data";

type AgentRecord = {
  name: string;
  status: string;
  load: number;
  color: string;
};

type ActivityItem = {
  id: number;
  type: string;
  text: string;
  time: string;
  icon: string;
};

type ThroughputDatum = {
  day: string;
  campaigns: number;
};

type Toast = {
  id: number;
  title: string;
  detail: string;
};

type UploadDraft = {
  clientId: string;
  title: string;
  channel: string;
  pages: string;
  fileName: string;
};

type MockDashboardState = {
  user: typeof USER;
  briefs: Brief[];
  campaigns: Campaign[];
  clients: Client[];
  portals: PortalWorkspace[];
  playbooks: Playbook[];
  settings: SettingGroup[];
  agents: AgentRecord[];
  activity: ActivityItem[];
  throughput: ThroughputDatum[];
  searchQuery: string;
  searchResults: Array<{ id: string; type: string; title: string; subtitle: string }>;
  uploadModalOpen: boolean;
  setSearchQuery: (query: string) => void;
  setUploadModalOpen: (open: boolean) => void;
  uploadBrief: (draft: UploadDraft) => void;
  advanceBrief: (briefId: string) => void;
  createCampaignFromBrief: (briefId: string) => void;
  saveCampaign: (campaignId: string, patch: Partial<Campaign>) => void;
  createCampaign: (draft: {
    clientId: string;
    name: string;
    budget: string;
    due: string;
    briefId: string;
  }) => void;
  advanceCampaign: (campaignId: string) => void;
  updateClient: (clientId: string, patch: Partial<Client>) => void;
  logTouchpoint: (clientId: string, note: string) => void;
  savePortal: (portalId: string, patch: Partial<PortalWorkspace>) => void;
  togglePortalShare: (portalId: string) => void;
  savePlaybook: (draft: Playbook) => void;
  updateSettingItem: (groupId: string, label: string, value: string) => void;
  simulateAnalytics: () => void;
  pushToast: (title: string, detail: string) => void;
};

const MockDashboardContext = createContext<MockDashboardState | null>(null);

const EMPTY_UPLOAD_DRAFT: UploadDraft = {
  clientId: CLIENTS[0].id,
  title: "",
  channel: "",
  pages: "8",
  fileName: "",
};

function cloneSettings() {
  return SETTINGS_GROUPS.map((group) => ({
    ...group,
    items: group.items.map((item) => ({ ...item })),
  }));
}

function nextBriefStatus(status: Brief["status"]): Brief["status"] {
  if (status === "new") return "processing";
  if (status === "processing") return "ready";
  if (status === "blocked") return "processing";
  return "ready";
}

function briefNextAction(status: Brief["status"]) {
  if (status === "processing") return "Wait for media model";
  if (status === "ready") return "Launch campaign package";
  return "Normalize intake brief";
}

function campaignSnapshot(status: Campaign["status"]) {
  if (status === "generating") {
    return { statusLabel: "Generating", progress: 58, due: "Today, 6 PM" };
  }
  if (status === "review") {
    return { statusLabel: "Pending review", progress: 92, due: "Ready for approval" };
  }
  return { statusLabel: "Approved", progress: 100, due: "Delivered" };
}

export function MockDashboardProvider({ children }: { children: ReactNode }) {
  const [briefs, setBriefs] = useState(() => BRIEFS.map((brief) => ({ ...brief })));
  const [campaigns, setCampaigns] = useState(() =>
    CAMPAIGNS.map((campaign) => ({ ...campaign, agents: [...campaign.agents] })),
  );
  const [clients, setClients] = useState(() => CLIENTS.map((client) => ({ ...client })));
  const [portals, setPortals] = useState(() =>
    PORTAL_WORKSPACES.map((portal) => ({ ...portal })),
  );
  const [playbooks, setPlaybooks] = useState(() =>
    PLAYBOOKS.map((playbook) => ({ ...playbook })),
  );
  const [settings, setSettings] = useState(cloneSettings);
  const [agents, setAgents] = useState(() => AGENTS.map((agent) => ({ ...agent })));
  const [activity, setActivity] = useState(() => ACTIVITY.map((item) => ({ ...item })));
  const [throughput, setThroughput] = useState(() =>
    THROUGHPUT.map((item) => ({ ...item })),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimers = useRef<number[]>([]);

  useEffect(() => {
    const timers = toastTimers.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  function pushToast(title: string, detail: string) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [{ id, title, detail }, ...current].slice(0, 4));
    const timer = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
    toastTimers.current.push(timer);
  }

  function prependActivity(item: Omit<ActivityItem, "id">) {
    setActivity((current) => [{ id: Date.now(), ...item }, ...current].slice(0, 7));
  }

  function adjustClient(clientId: string, patch: Partial<Client>) {
    setClients((current) =>
      current.map((client) => (client.id === clientId ? { ...client, ...patch } : client)),
    );
  }

  function uploadBrief(draft: UploadDraft) {
    const client = clients.find((item) => item.id === draft.clientId) ?? clients[0];
    const brief: Brief = {
      id: `b-${Date.now()}`,
      clientId: client.id,
      client: client.name,
      title: draft.title,
      channel: draft.channel,
      uploaded: "Just now",
      status: "new",
      pages: Number(draft.pages) || 8,
      nextAction: "Normalize intake brief",
      owner: USER.name,
    };

    setBriefs((current) => [brief, ...current]);
    adjustClient(client.id, {
      lastTouchpoint: `New intake brief added just now`,
      openApprovals: client.openApprovals + 1,
    });
    prependActivity({
      type: "brief",
      text: `${client.name} brief uploaded: ${draft.fileName || draft.title}`,
      time: "Just now",
      icon: "↑",
    });
    setUploadModalOpen(false);
    pushToast("Brief uploaded", `${brief.title} is now in the intake queue.`);
  }

  function advanceBrief(briefId: string) {
    let updatedBrief: Brief | undefined;

    setBriefs((current) =>
      current.map((brief) => {
        if (brief.id !== briefId) {
          return brief;
        }
        const status = nextBriefStatus(brief.status);
        updatedBrief = {
          ...brief,
          status,
          nextAction: briefNextAction(status),
        };
        return updatedBrief;
      }),
    );

    if (updatedBrief) {
      prependActivity({
        type: "brief",
        text: `${updatedBrief.client} brief moved to ${updatedBrief.status}`,
        time: "Just now",
        icon: "⊙",
      });
      pushToast("Brief updated", `${updatedBrief.title} is now ${updatedBrief.status}.`);
    }
  }

  function createCampaignFromBrief(briefId: string) {
    const brief = briefs.find((item) => item.id === briefId);
    if (!brief) return;

    const campaign: Campaign = {
      id: `c-${Date.now()}`,
      clientId: brief.clientId,
      client: brief.client,
      name: brief.title,
      status: "generating",
      statusLabel: "Generating",
      progress: 18,
      due: "Tomorrow",
      urgent: false,
      agents: ["Copy", "Design", "Media"],
      briefId: brief.id,
      lead: brief.owner,
      budget: "$90k",
      risk: "Medium",
      deliverableCount: 6,
    };

    setCampaigns((current) => [campaign, ...current]);
    setBriefs((current) =>
      current.map((item) =>
        item.id === briefId
          ? { ...item, status: "ready", nextAction: "Campaign package launched" }
          : item,
      ),
    );
    setAgents((current) =>
      current.map((agent) =>
        ["Copy", "Design", "Media"].includes(agent.name)
          ? { ...agent, status: "active", load: Math.min(agent.load + 1, 5) }
          : agent,
      ),
    );
    const client = clients.find((item) => item.id === brief.clientId);
    if (client) {
      adjustClient(brief.clientId, {
        activeCampaigns: client.activeCampaigns + 1,
        lastTouchpoint: `Campaign package launched just now`,
      });
    }
    prependActivity({
      type: "generate",
      text: `${brief.client} campaign launched from intake`,
      time: "Just now",
      icon: "⚡",
    });
    pushToast("Campaign created", `${campaign.name} has entered generation.`);
  }

  function saveCampaign(campaignId: string, patch: Partial<Campaign>) {
    let savedCampaign: Campaign | undefined;
    setCampaigns((current) =>
      current.map((campaign) => {
        if (campaign.id !== campaignId) {
          return campaign;
        }
        savedCampaign = { ...campaign, ...patch };
        return savedCampaign;
      }),
    );
    if (savedCampaign) {
      prependActivity({
        type: "comment",
        text: `${savedCampaign.client} campaign details updated`,
        time: "Just now",
        icon: "✦",
      });
      pushToast("Campaign saved", `${savedCampaign.name} has been updated.`);
    }
  }

  function createCampaign(draft: {
    clientId: string;
    name: string;
    budget: string;
    due: string;
    briefId: string;
  }) {
    const client = clients.find((item) => item.id === draft.clientId) ?? clients[0];
    const campaign: Campaign = {
      id: `c-${Date.now()}`,
      clientId: client.id,
      client: client.name,
      name: draft.name,
      status: "generating",
      statusLabel: "Generating",
      progress: 12,
      due: draft.due,
      urgent: false,
      agents: ["Copy", "Design"],
      briefId: draft.briefId || "manual",
      lead: client.lead,
      budget: draft.budget,
      risk: "Low",
      deliverableCount: 4,
    };
    setCampaigns((current) => [campaign, ...current]);
    adjustClient(client.id, {
      activeCampaigns: client.activeCampaigns + 1,
      lastTouchpoint: `Manual campaign created just now`,
    });
    prependActivity({
      type: "generate",
      text: `${client.name} campaign created manually`,
      time: "Just now",
      icon: "⚡",
    });
    pushToast("Campaign created", `${campaign.name} is now generating.`);
  }

  function advanceCampaign(campaignId: string) {
    let nextCampaign: Campaign | undefined;
    setCampaigns((current) =>
      current.map((campaign) => {
        if (campaign.id !== campaignId) {
          return campaign;
        }
        const nextStatus =
          campaign.status === "generating"
            ? "review"
            : campaign.status === "review"
              ? "approved"
              : "approved";
        const snapshot = campaignSnapshot(nextStatus);
        nextCampaign = { ...campaign, status: nextStatus, ...snapshot };
        return nextCampaign;
      }),
    );
    if (nextCampaign) {
      prependActivity({
        type: nextCampaign.status === "approved" ? "approved" : "generate",
        text: `${nextCampaign.client} moved to ${nextCampaign.statusLabel.toLowerCase()}`,
        time: "Just now",
        icon: nextCampaign.status === "approved" ? "✓" : "⚡",
      });
      pushToast("Campaign advanced", `${nextCampaign.name} is now ${nextCampaign.statusLabel}.`);
    }
  }

  function updateClient(clientId: string, patch: Partial<Client>) {
    setClients((current) =>
      current.map((client) => (client.id === clientId ? { ...client, ...patch } : client)),
    );
    pushToast("Client updated", "Account details have been saved.");
  }

  function logTouchpoint(clientId: string, note: string) {
    const client = clients.find((item) => item.id === clientId);
    if (!client) return;
    adjustClient(clientId, { lastTouchpoint: note });
    prependActivity({
      type: "comment",
      text: `${client.name} touchpoint logged`,
      time: "Just now",
      icon: "✦",
    });
    pushToast("Touchpoint logged", `${client.name} has a new account note.`);
  }

  function savePortal(portalId: string, patch: Partial<PortalWorkspace>) {
    setPortals((current) =>
      current.map((portal) => (portal.id === portalId ? { ...portal, ...patch } : portal)),
    );
    pushToast("Portal saved", "Workspace settings have been updated.");
  }

  function togglePortalShare(portalId: string) {
    let portalName = "";
    let nextState = "";
    setPortals((current) =>
      current.map((portal) => {
        if (portal.id !== portalId) {
          return portal;
        }
        nextState = portal.shareState === "Published" ? "Draft" : "Published";
        portalName = portal.name;
        return {
          ...portal,
          shareState: nextState,
          lastPublished: nextState === "Published" ? "Just now" : portal.lastPublished,
        };
      }),
    );
    prependActivity({
      type: "generate",
      text: `${portalName} ${nextState === "Published" ? "published" : "moved to draft"}`,
      time: "Just now",
      icon: "⊙",
    });
    pushToast(
      nextState === "Published" ? "Portal published" : "Portal reverted",
      `${portalName} is now ${nextState.toLowerCase()}.`,
    );
  }

  function savePlaybook(draft: Playbook) {
    setPlaybooks((current) => {
      const exists = current.some((playbook) => playbook.id === draft.id);
      if (exists) {
        return current.map((playbook) => (playbook.id === draft.id ? draft : playbook));
      }
      return [{ ...draft, id: `pb-${Date.now()}` }, ...current];
    });
    pushToast("Playbook saved", `${draft.name} has been stored.`);
  }

  function updateSettingItem(groupId: string, label: string, value: string) {
    setSettings((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              items: group.items.map((item) =>
                item.label === label ? { ...item, value } : item,
              ),
            }
          : group,
      ),
    );
    pushToast("Settings saved", "Workspace controls have been updated.");
  }

  function simulateAnalytics() {
    setThroughput((current) =>
      current.map((item, index) => ({
        ...item,
        campaigns: Math.max(1, item.campaigns + ((index % 2 === 0 ? 1 : -1) + 1)),
      })),
    );
    setAgents((current) =>
      current.map((agent, index) => ({
        ...agent,
        load: Math.max(1, Math.min(5, agent.load + (index % 3 === 0 ? 1 : 0))),
        status: index === 3 ? "active" : agent.status,
      })),
    );
    prependActivity({
      type: "generate",
      text: "Analytics simulation refreshed workload forecasts",
      time: "Just now",
      icon: "⚡",
    });
    pushToast("Analytics refreshed", "Mock throughput and utilization have been recalculated.");
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchResults = normalizedQuery
    ? [
        ...campaigns.map((item) => ({
          id: item.id,
          type: "Campaign",
          title: item.name,
          subtitle: `${item.client} · ${item.statusLabel}`,
        })),
        ...briefs.map((item) => ({
          id: item.id,
          type: "Brief",
          title: item.title,
          subtitle: `${item.client} · ${item.status}`,
        })),
        ...clients.map((item) => ({
          id: item.id,
          type: "Client",
          title: item.name,
          subtitle: `${item.lead} · ${item.health}`,
        })),
        ...playbooks.map((item) => ({
          id: item.id,
          type: "Playbook",
          title: item.name,
          subtitle: `${item.category} · ${item.status}`,
        })),
      ].filter(
        (item) =>
          item.title.toLowerCase().includes(normalizedQuery) ||
          item.subtitle.toLowerCase().includes(normalizedQuery),
      )
    : [];

  return (
    <MockDashboardContext.Provider
      value={{
        user: USER,
        briefs,
        campaigns,
        clients,
        portals,
        playbooks,
        settings,
        agents,
        activity,
        throughput,
        searchQuery,
        searchResults,
        uploadModalOpen,
        setSearchQuery,
        setUploadModalOpen,
        uploadBrief,
        advanceBrief,
        createCampaignFromBrief,
        saveCampaign,
        createCampaign,
        advanceCampaign,
        updateClient,
        logTouchpoint,
        savePortal,
        togglePortalShare,
        savePlaybook,
        updateSettingItem,
        simulateAnalytics,
        pushToast,
      }}
    >
      {children}
      <UploadBriefModal />
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-[24px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
          >
            <p className="text-sm font-semibold">{toast.title}</p>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">{toast.detail}</p>
          </div>
        ))}
      </div>
    </MockDashboardContext.Provider>
  );
}

function UploadBriefModal() {
  const dashboard = useMockDashboard();
  const [draft, setDraft] = useState<UploadDraft>(EMPTY_UPLOAD_DRAFT);

  function closeModal() {
    setDraft(EMPTY_UPLOAD_DRAFT);
    dashboard.setUploadModalOpen(false);
  }

  return (
    <Modal
      open={dashboard.uploadModalOpen}
      onClose={closeModal}
      title="Upload brief"
      description="Capture a mock intake item with the same data shape the real backend will use."
      footer={
        <>
          <Button variant="ghost" onClick={closeModal}>
            Cancel
          </Button>
          <Button
            variant="accent"
            onClick={() => {
              if (!draft.title || !draft.channel) {
                dashboard.pushToast("Missing fields", "Add a title and channel before uploading.");
                return;
              }
              dashboard.uploadBrief({
                ...draft,
                fileName: draft.fileName || `${draft.title}.pdf`,
              });
              setDraft(EMPTY_UPLOAD_DRAFT);
            }}
          >
            Add to queue
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium">Client</label>
          <select
            value={draft.clientId}
            onChange={(event) =>
              setDraft((current) => ({ ...current, clientId: event.target.value }))
            }
            className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm outline-none focus:border-[var(--border-strong)]"
          >
            {dashboard.clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium">Brief title</label>
          <Input
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder="Spring product launch"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Channel mix</label>
          <Input
            value={draft.channel}
            onChange={(event) =>
              setDraft((current) => ({ ...current, channel: event.target.value }))
            }
            placeholder="Paid social + OOH"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Pages</label>
          <Input
            type="number"
            min="1"
            value={draft.pages}
            onChange={(event) => setDraft((current) => ({ ...current, pages: event.target.value }))}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium">File name</label>
          <Input
            value={draft.fileName}
            onChange={(event) =>
              setDraft((current) => ({ ...current, fileName: event.target.value }))
            }
            placeholder="meridian-q3-refresh.pdf"
          />
        </div>
      </div>
    </Modal>
  );
}

export function useMockDashboard() {
  const value = useContext(MockDashboardContext);
  if (!value) {
    throw new Error("useMockDashboard must be used within MockDashboardProvider");
  }
  return value;
}
