import type { Person } from "./people";
import type { InterviewMeeting } from "./calendar";

export const maya: Person = {
  id: "maya", name: "Maya Rao", role: "Product Manager", company: "Former software engineer",
  location: "Bengaluru", batch: "2018", initials: "MR", color: "sage",
  expertise: ["Product management", "Career transitions", "Product case studies"],
  about: "I moved from software engineering into product. I help alumni turn their technical experience into a clear product story.",
  help: "Moving from engineering into product management.", commitment: "30-minute call",
  communities: ["BITS", "Bengaluru", "Product & Startups"],
};

const interactionHistory = [
  { title: "Understand the move into product", date: "6 Nov", outcome: { helpful: true, note: "Identified which engineering skills carry over." } },
  { title: "Review a sample product case", date: "13 Nov", outcome: { helpful: true, note: "Reframed the customer problem." } },
  { title: "Get feedback on a portfolio idea", date: "20 Nov", outcome: { helpful: true, note: "Chose a case study to develop further." } },
];
export const helpfulInteractions = interactionHistory.filter(entry => entry.outcome.helpful);
export const sampleMentorshipGoal = "Transition into Product Management";
export const sampleMentorshipMessage = "Could we meet weekly for two months? I’d like to build a product case study and prepare to interview for my first PM role.";
export const assignedTask = "Draft your product case study";

export type Letter = {
  id: string;
  from: "maya" | "you";
  title: string;
  body: string;
  allowProfile: boolean;
  featured: boolean;
};

export type MentorshipState = {
  phase: "idle" | "proposed" | "active" | "completed";
  goal: string;
  proposal: string;
  plan: boolean;
  task: "unassigned" | "assigned" | "shared" | "complete";
  draft: string;
  meetings: InterviewMeeting[];
  callLink: string;
  letters: Letter[];
};

export const initialMentorship: MentorshipState = {
  phase: "idle", goal: "", proposal: "", plan: false, task: "unassigned", draft: "", meetings: [], callLink: "",
  letters: [{
    id: "note-from-maya", from: "maya", title: "You’re finding your product voice.",
    body: "When we first spoke, you were unsure how your engineering work would translate to product. The way you reframed the customer problem in our last case showed how far you’ve come. Thank you for bringing real examples and giving the feedback a try. I’d be happy to keep helping you make the switch.",
    allowProfile: true, featured: false,
  }],
};

export type MentorshipAction =
  | { type: "reset" | "accept" | "create-plan" | "assign-task" | "complete-task" | "finish" }
  | { type: "propose"; goal: string; proposal: string }
  | { type: "share-draft"; draft: string }
  | { type: "schedule"; meetings: InterviewMeeting[]; callLink: string }
  | { type: "send-letter"; title: string; body: string; allowProfile: boolean }
  | { type: "feature-letter"; id: string; featured: boolean };

export function mentorshipReducer(state: MentorshipState, action: MentorshipAction): MentorshipState {
  switch (action.type) {
    case "reset": return initialMentorship;
    case "propose": return state.phase === "idle" && action.goal.trim() && action.proposal.trim()
      ? { ...state, phase: "proposed", goal: action.goal.trim(), proposal: action.proposal.trim() } : state;
    case "accept": return state.phase === "proposed" ? { ...state, phase: "active" } : state;
    case "create-plan": return state.phase === "active" && !state.plan ? { ...state, plan: true } : state;
    case "assign-task": return state.phase === "active" && state.plan && state.task === "unassigned" ? { ...state, task: "assigned" } : state;
    case "share-draft": return state.phase === "active" && state.task === "assigned" && action.draft.trim()
      ? { ...state, task: "shared", draft: action.draft.trim() } : state;
    case "complete-task": return state.phase === "active" && state.task === "shared" ? { ...state, task: "complete" } : state;
    case "schedule": return state.phase === "active" && action.meetings.length
      ? { ...state, meetings: action.meetings, callLink: action.callLink } : state;
    case "finish": return state.phase === "active" ? { ...state, phase: "completed" } : state;
    case "send-letter": {
      if (!action.title.trim() || !action.body.trim()) return state;
      const letter: Letter = {
        id: `maya-letter-${state.letters.length}`, from: "you", title: action.title.trim(), body: action.body.trim(),
        allowProfile: action.allowProfile, featured: false,
      };
      return { ...state, letters: [letter, ...state.letters] };
    }
    case "feature-letter": return {
      ...state,
      letters: state.letters.map(letter => letter.id === action.id && letter.from === "maya" && letter.allowProfile
        ? { ...letter, featured: action.featured } : letter),
    };
  }
}

export function weeklyMentorshipMeetings(date: string, time: string): InterviewMeeting[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return [];
  const first = new Date(`${date}T${time}:00+05:30`);
  if (!Number.isFinite(first.getTime())) return [];
  const [year, month, day] = date.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month + 2, 0)).getUTCDate();
  const end = Date.UTC(year, month + 1, Math.min(day, lastDay));
  const meetings: InterviewMeeting[] = [];
  let localDay = Date.UTC(year, month - 1, day);
  let start = first.getTime();
  while (localDay < end) {
    meetings.push({ start: new Date(start).toISOString(), end: new Date(start + 30 * 60_000).toISOString() });
    localDay += 7 * 86_400_000;
    start += 7 * 86_400_000;
  }
  return meetings;
}
