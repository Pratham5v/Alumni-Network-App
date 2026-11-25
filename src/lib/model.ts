import { tomorrowInterview, type InterviewMeeting } from "./calendar";
import { initialInstitutionState, institutionReducer, publicInstitutionEvents, type InstitutionAction, type InstitutionState } from "./institution";
import { jobs } from "./jobs";

export type Profile = { name: string; batch: string; role: string; location: string };
export type Commitment = "20-minute call" | "30-minute call" | "Chat";
export type ProfileDetails = {
  bio: string;
  expertise: string;
  help: string;
  email: string;
  phone: string;
  linkedin: string;
  portfolio: string;
};
export type ContactVisibility = "private" | "accepted-request" | "alumni";
export type ProfilePreferences = {
  emailVisibility: ContactVisibility;
  phoneVisibility: ContactVisibility;
  notifications: { requests: boolean; replies: boolean; events: boolean };
  available: boolean;
  commitment: Commitment;
};
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
export type IncomingStatus = "pending" | "accepted" | "declined" | "alternative-suggested";
export type IncomingRequest = {
  status: IncomingStatus;
  unread: boolean;
  response?: string;
  messages: Message[];
  replySent: boolean;
  callLink: string | null;
  meeting: InterviewMeeting | null;
};
export type DemoState = {
  profile: Profile;
  profileDetails: ProfileDetails;
  profilePreferences: ProfilePreferences;
  intent: Intent | null;
  request: HelpRequest | null;
  messages: Message[];
  conversationConfirmed: boolean;
  meeting: InterviewMeeting | null;
  callLink: string | null;
  incoming: IncomingRequest | null;
  registeredEventIds: string[];
  savedJobIds: string[];
  referralRequests: Record<string, string>;
  institution: InstitutionState;
};
export const sampleProfile: Profile = { name: "Prathmesh Mehrotra", batch: "2026", role: "Software Engineer", location: "Gurgaon" };
export const sampleProfileLinks = {
  linkedin: "https://www.linkedin.com/in/demo-prathmesh-mehrotra",
  portfolio: "https://prathmesh.example.com",
};
const sampleProfileDetails: ProfileDetails = {
  bio: "Software engineer interested in backend systems, APIs, and applied AI.",
  expertise: "Backend Engineering, APIs, Applied AI",
  help: "Happy to share my AI engineering interview experience and help you decide what to prepare.",
  email: "prathmesh@example.com",
  phone: "",
  ...sampleProfileLinks,
};
const sampleProfilePreferences: ProfilePreferences = {
  emailVisibility: "private",
  phoneVisibility: "private",
  notifications: { requests: true, replies: true, events: false },
  available: true,
  commitment: "20-minute call",
};
export const demoReply = "I’m looking for advice on the product for my new startup. Does tomorrow at 6 PM work for a call?";
export const sampleCallLink = "https://meet.example.com/alumni-call";
export const sampleOutcome: Outcome = { happened: true, helpful: "Yes", resolved: true };
export const incomingScenario = {
  name: "Riya Sharma",
  batch: "2025",
  title: "AI interview preparation",
  commitment: "20-minute call",
  message: "I have an AI engineering interview coming up. I’d love to hear what your interview was like and what you’d prioritize if you were preparing again. Would you be open to a 20-minute call?",
  reply: "Tomorrow at 6 PM works for me. Bring the job description if you have it, and we can talk through what to prioritize.",
  decline: "Thanks for reaching out, Riya. I’m not available for a call right now. I hope you find someone who can help with your preparation.",
  alternative: "Kabir Mehta may be able to help with your engineering interview preparation. He’s open to discussing system design and engineering careers. You could reach out to him with your job description and what you’d like to focus on.",
} as const;
export const sampleIntent: Omit<Intent, "status"> = {
  type: "Seeking advice",
  title: "Feedback on my startup idea",
  context: "I’m working on a startup idea and would value a product perspective on the concept and which features to prioritize first.",
  commitment: "20-minute call",
  expires: "14",
};
export const initialState: DemoState = { profile: sampleProfile, profileDetails: sampleProfileDetails, profilePreferences: sampleProfilePreferences, intent: null, request: null, messages: [], conversationConfirmed: false, meeting: null, callLink: null, incoming: null, registeredEventIds: [], savedJobIds: [], referralRequests: {}, institution: initialInstitutionState };
export function isValidCallLink(value: string): boolean {
  try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
}
export type Action =
  | { type: "profile"; profile: Profile }
  | { type: "profile-details"; details: ProfileDetails }
  | { type: "profile-preferences"; preferences: ProfilePreferences }
  | { type: "publish"; intent: Omit<Intent, "status"> }
  | { type: "request"; request: Pick<HelpRequest, "personId" | "message" | "commitment"> }
  | { type: "accept" }
  | { type: "send-demo-message" }
  | { type: "confirm-conversation"; now: string }
  | { type: "share-call-link"; url: string; target: "sent" }
  | { type: "introduce-incoming" }
  | { type: "read-incoming" }
  | { type: "respond-incoming"; response: Exclude<IncomingStatus, "pending">; message?: string }
  | { type: "send-incoming-reply"; now: string }
  | { type: "receive-incoming-call-link" }
  | { type: "outcome"; outcome: Outcome }
  | { type: "register-event"; eventId: string }
  | { type: "toggle-saved-job"; jobId: string }
  | { type: "request-referral"; jobId: string; message: string }
  | { type: "institution"; action: InstitutionAction }
  | { type: "new-journey" }
  | { type: "reset" };

// All state lives in memory. A full page load intentionally starts a fresh demo.
export function demoReducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case "profile": return { ...state, profile: action.profile };
    case "profile-details": return { ...state, profileDetails: action.details };
    case "profile-preferences": return { ...state, profilePreferences: action.preferences };
    case "publish":
      if (!action.intent.title.trim() || !action.intent.context.trim() || state.request) return state;
      return { ...state, intent: { ...action.intent, status: "active" } };
    case "request":
      if (!state.intent || state.intent.status !== "active" || state.request || !action.request.message.trim()) return state;
      return { ...state, request: { ...action.request, intentTitle: state.intent.title, status: "pending" } };
    case "accept":
      if (state.request?.status !== "pending") return state;
      return { ...state, request: { ...state.request, status: "accepted" }, messages: [{ id: 0, from: "alumnus", text: "Happy to help. What would you like to focus on? We can agree on a time here." }] };
    case "send-demo-message":
      if (state.request?.status !== "accepted" || state.messages.some(message => message.from === "you")) return state;
      return { ...state, messages: [...state.messages, { id: state.messages.length, from: "you", text: demoReply }] };
    case "confirm-conversation":
      if (state.request?.status !== "accepted" || state.conversationConfirmed || !state.messages.some(message => message.from === "you") || !Number.isFinite(Date.parse(action.now))) return state;
      return { ...state, conversationConfirmed: true, meeting: state.request.commitment === "Chat" ? null : tomorrowInterview(new Date(action.now), state.request.commitment === "30-minute call" ? 30 : 20), messages: [...state.messages, { id: state.messages.length, from: "alumnus", text: "Tomorrow at 6 PM works for me. Happy to discuss your product idea. Please share a call link here, and we’ll take it from there." }] };
    case "share-call-link": {
      const url = action.url.trim();
      if (!isValidCallLink(url)) return state;
      const text = `Here’s the call link for our conversation:\n${url}`;
      if (state.request?.status !== "accepted" || !state.conversationConfirmed || state.callLink) return state;
      return { ...state, callLink: url, messages: [...state.messages, { id: state.messages.length, from: "you", text }] };
    }
    case "introduce-incoming":
      if (state.request?.status !== "completed" || state.incoming) return state;
      return { ...state, incoming: { status: "pending", unread: true, messages: [], replySent: false, callLink: null, meeting: null } };
    case "read-incoming":
      if (!state.incoming || !state.incoming.unread) return state;
      return { ...state, incoming: { ...state.incoming, unread: false } };
    case "respond-incoming": {
      if (state.incoming?.status !== "pending") return state;
      if (action.response !== "accepted" && !action.message?.trim()) return state;
      return { ...state, incoming: { ...state.incoming, status: action.response, unread: false, response: action.message?.trim(), messages: action.response === "accepted" ? [{ id: 0, from: "alumnus", text: incomingScenario.message }] : [] } };
    }
    case "send-incoming-reply":
      if (state.incoming?.status !== "accepted" || state.incoming.replySent || !Number.isFinite(Date.parse(action.now))) return state;
      return { ...state, incoming: { ...state.incoming, replySent: true, meeting: tomorrowInterview(new Date(action.now)), messages: [...state.incoming.messages, { id: state.incoming.messages.length, from: "you", text: incomingScenario.reply }] } };
    case "receive-incoming-call-link":
      if (state.incoming?.status !== "accepted" || !state.incoming.replySent || state.incoming.callLink) return state;
      return { ...state, incoming: { ...state.incoming, callLink: sampleCallLink, messages: [...state.incoming.messages, { id: state.incoming.messages.length, from: "alumnus", text: `Tomorrow at 6 PM sounds great. Thanks, Prathmesh! Here’s the link for our 20-minute call:\n${sampleCallLink}` }] } };
    case "outcome":
      if (state.request?.status !== "accepted") return state;
      if (!action.outcome.happened) return state;
      if (!action.outcome.helpful || typeof action.outcome.resolved !== "boolean") return state;
      return {
        ...state,
        request: { ...state.request, status: "completed", outcome: action.outcome },
        intent: state.intent ? { ...state.intent, status: action.outcome.resolved ? "resolved" : "active" } : null,
      };
    case "register-event":
      if (state.registeredEventIds.includes(action.eventId) || !publicInstitutionEvents(state.institution).some(event => event.id === action.eventId && event.registrationOpen)) return state;
      return { ...state, registeredEventIds: [...state.registeredEventIds, action.eventId] };
    case "toggle-saved-job": {
      if (!jobs.some(job => job.id === action.jobId)) return state;
      const savedJobIds = state.savedJobIds.includes(action.jobId) ? state.savedJobIds.filter(id => id !== action.jobId) : [...state.savedJobIds, action.jobId];
      return { ...state, savedJobIds };
    }
    case "request-referral": {
      const message = action.message.trim();
      if (message.length < 15 || message.length > 600 || state.referralRequests[action.jobId] || !jobs.some(job => job.id === action.jobId && job.referralAvailable)) return state;
      return { ...state, referralRequests: { ...state.referralRequests, [action.jobId]: message } };
    }
    case "institution": return { ...state, institution: institutionReducer(state.institution, action.action) };
    case "new-journey": return { ...initialState, profile: state.profile, profileDetails: state.profileDetails, profilePreferences: state.profilePreferences, incoming: state.incoming, registeredEventIds: state.registeredEventIds, savedJobIds: state.savedJobIds, referralRequests: state.referralRequests, institution: state.institution };
    case "reset": return initialState;
  }
}
