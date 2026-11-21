export type Profile = { name: string; batch: string; role: string; location: string };
export type Commitment = "20-minute call" | "30-minute call" | "Chat";
export type Intent = {
  title: string;
  context: string;
  type: "Seeking advice" | "Seeking mentorship";
  commitment: Commitment;
  expires: string;
  status: "active" | "resolved";
};
export type Outcome = { happened: boolean; helpful?: "Yes" | "Partly" | "No"; resolved?: boolean };
export type HelpRequest = {
  personId: string;
  message: string;
  commitment: Commitment;
  intentTitle: string;
  status: "pending" | "accepted" | "completed";
  outcome?: Outcome;
};
export type Message = { id: number; from: "you" | "alumnus"; text: string };
export type DemoState = {
  profile: Profile;
  intent: Intent | null;
  request: HelpRequest | null;
  messages: Message[];
};
export const sampleProfile: Profile = { name: "Riya Sharma", batch: "2025", role: "Software Engineer", location: "Gurgaon" };
export const sampleIntent: Omit<Intent, "status"> = {
  type: "Seeking advice",
  title: "Feedback on my startup idea",
  context: "I’m working on a startup idea and would value a product perspective on the concept and which features to prioritize first.",
  commitment: "20-minute call",
  expires: "14",
};
export const initialState: DemoState = { profile: sampleProfile, intent: null, request: null, messages: [] };
export type Action =
  | { type: "profile"; profile: Profile }
  | { type: "publish"; intent: Omit<Intent, "status"> }
  | { type: "request"; request: Pick<HelpRequest, "personId" | "message" | "commitment"> }
  | { type: "accept" }
  | { type: "message"; text: string }
  | { type: "outcome"; outcome: Outcome }
  | { type: "new-journey" }
  | { type: "reset" };

// All state lives in memory. A full page load intentionally starts a fresh demo.
export function demoReducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case "profile": return { ...state, profile: action.profile };
    case "publish":
      if (!action.intent.title.trim() || !action.intent.context.trim() || state.request) return state;
      return { ...state, intent: { ...action.intent, status: "active" } };
    case "request":
      if (!state.intent || state.intent.status !== "active" || state.request || !action.request.message.trim()) return state;
      return { ...state, request: { ...action.request, intentTitle: state.intent.title, status: "pending" } };
    case "accept":
      if (state.request?.status !== "pending") return state;
      return { ...state, request: { ...state.request, status: "accepted" }, messages: [{ id: 0, from: "alumnus", text: "Happy to help. What would you like to focus on? We can agree on a time here." }] };
    case "message":
      if (state.request?.status !== "accepted" || !action.text.trim()) return state;
      return { ...state, messages: [...state.messages, { id: state.messages.length, from: "you", text: action.text.trim() }] };
    case "outcome":
      if (state.request?.status !== "accepted") return state;
      if (!action.outcome.happened) return state;
      if (!action.outcome.helpful || typeof action.outcome.resolved !== "boolean") return state;
      return {
        ...state,
        request: { ...state.request, status: "completed", outcome: action.outcome },
        intent: state.intent ? { ...state.intent, status: action.outcome.resolved ? "resolved" : "active" } : null,
      };
    case "new-journey": return { ...initialState, profile: state.profile };
    case "reset": return initialState;
  }
}
