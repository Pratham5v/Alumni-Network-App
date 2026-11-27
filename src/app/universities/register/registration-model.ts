import type { ImportRow } from "@/lib/institution";

export const sampleApplication = { name: "Westbridge University", website: "https://westbridge.example", email: "alumni@westbridge.example" };
export type Application = typeof sampleApplication;

export const moduleLabels = { events: "Events", communities: "Communities", jobs: "Job board", fundraising: "Fundraising" };
export type ModuleId = keyof typeof moduleLabels;
export const moduleIds = Object.keys(moduleLabels) as ModuleId[];

export const roles = {
  "Alumni relations admin": "Manage alumni records, invitations, communities, events, and campaigns.",
  Analyst: "View workspace analytics.",
};
export type InviteRole = keyof typeof roles;
export const graduationLabels = ["Class of", "Batch of", "Graduated in"] as const;
export type Branding = { logo: string; primary: string; accent: string; terminology: (typeof graduationLabels)[number] };

type RosterRow = ImportRow & { status: "ready" | "review" | "invited" };
type Integration = { provider: string; status: "connected" | "synced" };

export type WorkspaceSection = "overview" | "settings" | "analytics";
export type WorkspaceSetting = "branding" | "admins" | "modules" | "roster" | "crm" | "gateway" | "domain";
export type WalkthroughView = {
  stage: "apply" | "submitted" | "approved" | "setup" | "workspace";
  step: number;
  editing: boolean;
  section: WorkspaceSection;
  setting: WorkspaceSetting;
  reviewOnOpen: boolean;
};
export type State = WalkthroughView & {
  completedSteps: number[];
  application: Application;
  branding: Branding;
  modules: Record<ModuleId, boolean>;
  admins: { email: string; role: InviteRole }[];
  roster: RosterRow[];
  crm: Integration | null;
  gateway: string;
  domain: string;
};

export const initialState: State = {
  stage: "apply",
  step: 0,
  editing: false,
  section: "overview",
  setting: "crm",
  reviewOnOpen: false,
  completedSteps: [],
  application: { name: "", website: "", email: "" },
  branding: { logo: "", primary: "#245649", accent: "#AA7543", terminology: "Class of" },
  modules: { events: true, communities: true, jobs: false, fundraising: false },
  admins: [],
  roster: [],
  crm: null,
  gateway: "",
  domain: "",
};

export type Action =
  | { type: "submit"; application: Application }
  | { type: "approve" | "edit-submission" | "start" | "continue" | "invite-alumni" | "sync-crm" }
  | { type: "branding"; branding: Partial<Branding> }
  | { type: "module"; module: ModuleId }
  | { type: "invite-admin"; email: string; role: InviteRole }
  | { type: "load-roster"; rows: ImportRow[] }
  | { type: "fix-email"; index: number; email: string }
  | { type: "connect-crm" | "gateway" | "domain"; value: string }
  | { type: "select-step"; step: number }
  | { type: "select-section"; section: WorkspaceSection }
  | { type: "open-setting"; setting: WorkspaceSetting; review?: boolean }
  | { type: "restart" };

export const workEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const domainPattern = /^(?=.{3,253}$)(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z][a-z\d-]*[a-z\d]$/i;

const lastSetupStep = 3;

export function registrationReducer(state: State, action: Action): State {
  switch (action.type) {
    case "restart": return initialState;
    case "submit": return state.stage === "apply" ? { ...state, stage: "submitted", editing: false, application: action.application } : state;
    case "edit-submission": return state.stage === "submitted" ? { ...state, stage: "apply", editing: true } : state;
    case "approve": return state.stage === "submitted" ? { ...state, stage: "approved" } : state;
    case "start": return state.stage === "approved" ? { ...state, stage: "setup", step: 0 } : state;
    case "select-section": return state.stage === "workspace" ? { ...state, section: action.section } : state;
    case "open-setting": return state.stage === "workspace"
      ? { ...state, section: "settings", setting: action.setting, reviewOnOpen: Boolean(action.review) } : state;
    case "select-step":
      return state.stage === "setup" && Number.isInteger(action.step) && action.step >= 0 && action.step <= lastSetupStep
        ? { ...state, step: action.step } : state;
    case "continue": {
      if (state.stage !== "setup") return state;
      const completedSteps = state.completedSteps.includes(state.step) ? state.completedSteps : [...state.completedSteps, state.step];
      return state.step === lastSetupStep
        ? { ...state, completedSteps, stage: "workspace", section: "overview", setting: "crm", reviewOnOpen: false }
        : { ...state, completedSteps, step: state.step + 1 };
    }
    case "branding": return { ...state, branding: { ...state.branding, ...action.branding } };
    case "module": return { ...state, modules: { ...state.modules, [action.module]: !state.modules[action.module] } };
    case "invite-admin":
      if (!workEmailPattern.test(action.email) || state.admins.some(admin => admin.email === action.email) || state.application.email === action.email) return state;
      return { ...state, admins: [...state.admins, { email: action.email, role: action.role }] };
    case "load-roster":
      if (state.roster.some(row => row.status === "invited")) return state;
      return { ...state, roster: action.rows.map(row => ({ ...row, status: row.issue ? "review" : "ready" })) };
    case "fix-email": {
      const row = state.roster[action.index];
      if (row?.status !== "review" || row.issue !== "Missing or invalid email" || !workEmailPattern.test(action.email) || state.roster.some(item => item.email === action.email)) return state;
      return { ...state, roster: state.roster.map((item, index) => index === action.index ? { ...item, email: action.email, issue: undefined, status: "ready" } : item) };
    }
    case "invite-alumni":
      return { ...state, roster: state.roster.map(row => row.status === "ready" ? { ...row, status: "invited" } : row) };
    case "connect-crm": return { ...state, crm: { provider: action.value, status: "connected" } };
    case "sync-crm": return state.crm ? { ...state, crm: { ...state.crm, status: "synced" } } : state;
    case "gateway": return state.modules.fundraising ? { ...state, gateway: action.value } : state;
    case "domain": return domainPattern.test(action.value) ? { ...state, domain: action.value } : state;
  }
}
