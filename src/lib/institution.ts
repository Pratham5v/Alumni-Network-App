import { alumniEvents, distinguishedAlumnus, type AlumniEvent } from "./events";
import { recordDifferences, sampleAlumniRecord, type AlumniDetails } from "./onboarding";
import { fundraisingReducer, sampleCampaign, type Campaign, type FundraisingAction } from "./fundraising";

export type AlumniRecord = AlumniDetails & { email: string; batchFile: string; status: "ready" | "invited" };
export type ImportRow = Omit<AlumniRecord, "status" | "batchFile"> & { issue?: string };
type Review = { details: AlumniDetails; status: "pending" | "more-info" | "approved"; message: string; activity: string[] };
export type CommunityMember = { id: string; name: string; batch: string; role: "member" | "moderator" };
export type JoinRequest = { member: CommunityMember; message: string };
const sampleJoinRequests: JoinRequest[] = [
  { member: { id: "meera", name: "Meera Nair", batch: "2021", role: "member" }, message: "I’ve just moved to Bengaluru and would love to meet other alumni working in product and AI." },
  { member: { id: "vikram", name: "Vikram Iyer", batch: "2014", role: "member" }, message: "I’d like to meet local alumni and share what I’ve learned leading engineering teams." },
];
export type Community = {
  id: string; name: string; location: string; description: string;
  members: CommunityMember[]; requests: JoinRequest[]; activity: string[]; activeIntents: number;
  openMembership?: boolean;
};
export type TalkDraft = { title: string; date: string; time: string; description: string; message: string };
export type InstitutionTalk = TalkDraft & { id: string; status: "awaiting" | "accepted" | "published" };
export type InstitutionState = {
  records: AlumniRecord[];
  review: Review;
  reviewFromSignup: boolean;
  communities: Community[];
  talks: InstitutionTalk[];
  campaigns: Campaign[];
  registrationOverrides: Record<string, boolean>;
  activity: string[];
};

const member = (id: string, name: string, batch: string, role: CommunityMember["role"] = "member"): CommunityMember => ({ id, name, batch, role });
const { email: _email, ...referenceDetails } = sampleAlumniRecord;

export const initialInstitutionState: InstitutionState = {
  records: [
    { name: "Ananya Sen", email: "ananya@example.com", batch: "2026", degree: "B.E.", branch: "Computer Science", batchFile: "Class of 2026", status: "ready" },
    { name: "Ishaan Sethi", email: "ishaan@example.com", batch: "2026", degree: "B.E.", branch: "Computer Science", batchFile: "Class of 2026", status: "ready" },
  ],
  review: { details: { ...referenceDetails, batch: "2025" }, status: "pending", message: "", activity: ["Manual verification requested"] },
  reviewFromSignup: false,
  communities: [{
    id: "bengaluru", name: "Bengaluru Alumni", location: "Bengaluru",
    description: "A space for BITS alumni in Bengaluru to meet and help each other.",
    members: [member("ananya", "Ananya Sen", "2026", "moderator"), member("aarav", "Aarav Shah", "2018"), member("ishaan", "Ishaan Sethi", "2026")],
    requests: sampleJoinRequests,
    activeIntents: 3, activity: ["Ananya Sen was assigned as moderator"],
  }, {
    id: "product-startups", name: "Product & Startups", location: "Across locations", openMembership: true,
    description: "Trade feedback on product ideas, compare notes on early-stage decisions, and meet alumni building new things.",
    members: [member("neha", "Neha Rao", "2016", "moderator"), member("aarav", "Aarav Shah", "2018")],
    requests: [], activeIntents: 0, activity: [],
  }, {
    id: "software-engineering", name: "Software Engineering", location: "Across locations", openMembership: true,
    description: "Meet alumni working in software and share practical advice on system design, interviews and growing as an engineer.",
    members: [member("kabir", "Kabir Mehta", "2019", "moderator"), member("ananya", "Ananya Sen", "2026")],
    requests: [], activeIntents: 0, activity: [],
  }],
  talks: [],
  campaigns: [sampleCampaign],
  registrationOverrides: {},
  activity: [],
};

export const sampleBatchCsv = `name,email,graduation year,degree,branch
Kavya Menon,kavya@example.com,2026,B.E.,Computer Science
Arjun Bhat,arjun@example.com,2026,B.E.,Electronics
Tara Desai,,2026,B.E.,Mechanical Engineering`;

export function previewAlumniBatch(text: string, existing: readonly AlumniRecord[]): ImportRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  let closedQuote = false;
  const input = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  for (let index = 0; index <= input.length; index++) {
    const character = input[index];
    if (character === '"') {
      if (quoted && input[index + 1] === '"') { value += '"'; index++; }
      else if (quoted) { quoted = false; closedQuote = true; }
      else if (!closedQuote && !value.trim()) { value = ""; quoted = true; }
      else throw new Error("Check the quotation marks in your CSV.");
    } else if (character === undefined || (!quoted && (character === "," || character === "\n"))) {
      if (quoted) throw new Error("A quoted CSV field is missing its closing quote.");
      row.push(value.trim());
      value = "";
      closedQuote = false;
      if (character !== ",") {
        if (row.some(Boolean)) rows.push(row);
        row = [];
      }
    } else if (!closedQuote) {
      value += character;
    } else if (character.trim()) {
      throw new Error("A quoted CSV field must end before the next column.");
    }
  }
  const [header, ...data] = rows;
  const columns = ["name", "email", "graduation year", "degree", "branch"];
  if (header?.map(item => item.toLowerCase()).join(",") !== columns.join(",")) throw new Error("Use the columns name, email, graduation year, degree, and branch.");
  if (data.length === 0 || data.length > 250) throw new Error("Upload a CSV with 1–250 alumni records.");
  const seen = new Set([...existing.map(record => record.email), sampleAlumniRecord.email]);
  return data.map(row => {
    const [name = "", rawEmail = "", batch = "", degree = "", branch = ""] = row;
    const email = rawEmail.toLowerCase();
    let issue: string | undefined;
    if (row.length !== columns.length) issue = "Expected five columns";
    else if (!name || !degree || !branch || !/^\d{4}$/.test(batch)) issue = "Incomplete alumni details";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) issue = "Missing or invalid email";
    else if (seen.has(email)) issue = "Duplicate record";
    if (!issue) seen.add(email);
    return { name, email, batch, degree, branch, issue };
  });
}

export type InstitutionAction =
  | { type: "fundraising"; action: FundraisingAction }
  | { type: "submit-review"; details: AlumniDetails }
  | { type: "review-more-info"; message: string }
  | { type: "review-approve" | "review-sample-reply" | "invite-ready" }
  | { type: "import"; file: string; rows: ImportRow[] }
  | { type: "save-community"; id?: string; name: string; location: string; description: string }
  | { type: "membership"; id: string; memberId: string; approve: boolean }
  | { type: "sample-join"; id: string }
  | { type: "join-community"; id: string; member: CommunityMember; message: string }
  | { type: "cancel-community-request"; id: string; memberId: string }
  | { type: "add-member"; id: string; email: string }
  | { type: "member-role"; id: string; memberId: string; role: CommunityMember["role"] }
  | { type: "remove-member"; id: string; memberId: string }
  | { type: "invite-host"; draft: TalkDraft }
  | { type: "host-accept" | "publish-talk"; id: string }
  | { type: "registration"; id: string; open: boolean };

export function readyAlumni(state: InstitutionState) {
  return state.records.filter(record => record.status === "ready");
}
export function sampleJoinCandidate(community: Community) {
  return sampleJoinRequests.find(request => !community.members.some(item => item.id === request.member.id) && !community.requests.some(item => item.member.id === request.member.id));
}

export function publicInstitutionEvents(state: InstitutionState): AlumniEvent[] {
  const published: AlumniEvent[] = state.talks.filter(talk => talk.status === "published").map(talk => ({
    id: talk.id, title: talk.title, host: distinguishedAlumnus.name, category: "AI & technology lecture",
    date: talk.date, time: talk.time, duration: "30 minutes", format: "Online lecture",
    description: talk.description, registrationOpen: true, attendees: [],
  }));
  return [...alumniEvents, ...published].map(event => ({
    ...event, registrationOpen: state.registrationOverrides[event.id] ?? event.registrationOpen,
  }));
}

function log(state: InstitutionState, message: string) {
  return { ...state, activity: [message, ...state.activity].slice(0, 12) };
}

export function institutionReducer(state: InstitutionState, action: InstitutionAction): InstitutionState {
  switch (action.type) {
    case "fundraising": {
      const campaigns = fundraisingReducer(state.campaigns, action.action);
      return campaigns === state.campaigns ? state : { ...state, campaigns };
    }
    case "submit-review":
      if (state.review.status === "approved" || (state.reviewFromSignup && state.review.status !== "more-info")) return state;
      return log({ ...state, reviewFromSignup: true, review: {
        details: action.details, status: "pending", message: "",
        activity: [state.reviewFromSignup ? "Updated details received" : "Manual verification requested", ...state.review.activity],
      } }, "Alumni details submitted for review");
    case "review-more-info":
      if (state.review.status !== "pending" || !action.message.trim()) return state;
      return log({ ...state, review: { ...state.review, status: "more-info", message: action.message.trim(), activity: ["More information requested", ...state.review.activity] } }, "More information requested for an alumni record");
    case "review-sample-reply":
      if (state.review.status !== "more-info") return state;
      return log({ ...state, review: { details: referenceDetails, status: "pending", message: "", activity: ["Corrected details received in the demo", ...state.review.activity] } }, "Corrected alumni details received");
    case "review-approve":
      if (state.review.status !== "pending" || recordDifferences(state.review.details).length > 0) return state;
      return log({ ...state, review: { ...state.review, status: "approved", activity: ["Record approved", ...state.review.activity] }, records: [
        ...state.records, { ...referenceDetails, email: sampleAlumniRecord.email, batchFile: "Manual verification", status: "ready" },
      ] }, `${referenceDetails.name} was verified`);
    case "import": {
      const existing = new Set([...state.records.map(record => record.email), sampleAlumniRecord.email]);
      const added: AlumniRecord[] = [];
      for (const { issue, ...row } of action.rows) {
        if (issue || existing.has(row.email)) continue;
        existing.add(row.email);
        added.push({ ...row, batchFile: action.file, status: "ready" });
      }
      return added.length ? log({ ...state, records: [...state.records, ...added] }, `Imported ${added.length} alumni records from ${action.file}`) : state;
    }
    case "invite-ready": {
      const count = readyAlumni(state).length;
      return count ? log({ ...state, records: state.records.map(record => record.status === "ready" ? { ...record, status: "invited" } : record) }, `Invitations sent to ${count} alumni in the demo`) : state;
    }
    case "save-community": {
      const name = action.name.trim();
      if (!name || !action.location.trim() || state.communities.some(community => community.id !== action.id && community.name.toLowerCase() === name.toLowerCase())) return state;
      const details = { name, location: action.location.trim(), description: action.description.trim() };
      const activity = action.id ? "Community details updated" : "Community created";
      const communities = action.id ? state.communities.map(community => community.id === action.id ? { ...community, ...details, activity: [activity, ...community.activity] } : community) :
        [...state.communities, { id: `community-${state.communities.length + 1}`, ...details, members: [], requests: [], activeIntents: 0, activity: [activity] }];
      return log({ ...state, communities }, `${name} · ${activity}`);
    }
    case "join-community":
    case "cancel-community-request":
    case "sample-join":
    case "add-member":
    case "membership":
    case "member-role":
    case "remove-member": {
      const community = state.communities.find(item => item.id === action.id);
      if (!community) return state;
      let updated = community;
      let message: string;
      if (action.type === "join-community") {
        const joining = action.member;
        if (community.members.some(item => item.id === joining.id) || community.requests.some(item => item.member.id === joining.id)) return state;
        message = community.openMembership ? `${joining.name} joined ${community.name}` : `${joining.name} requested to join ${community.name}`;
        updated = community.openMembership
          ? { ...community, members: [...community.members, joining] }
          : { ...community, requests: [...community.requests, { member: joining, message: action.message.trim() }] };
      } else if (action.type === "cancel-community-request") {
        const request = community.requests.find(item => item.member.id === action.memberId);
        if (!request) return state;
        message = `${request.member.name} withdrew their request to join ${community.name}`;
        updated = { ...community, requests: community.requests.filter(item => item !== request) };
      } else if (action.type === "sample-join") {
        const sample = sampleJoinCandidate(community);
        if (!sample) return state;
        message = `${sample.member.name} requested to join ${community.name} in the demo`;
        updated = { ...community, requests: [...community.requests, sample] };
      } else if (action.type === "add-member") {
        const record = state.records.find(item => item.email === action.email);
        if (!record || community.members.some(person => person.name.toLowerCase() === record.name.toLowerCase()) || community.requests.some(item => item.member.name.toLowerCase() === record.name.toLowerCase())) return state;
        const added = member(record.email, record.name, record.batch);
        message = `${record.name} was added to ${community.name}`;
        updated = { ...community, members: [...community.members, added] };
      } else if (action.type === "membership") {
        const request = community.requests.find(item => item.member.id === action.memberId);
        if (!request) return state;
        message = `${request.member.name}’s join request was ${action.approve ? "approved" : "declined"}`;
        updated = { ...community, requests: community.requests.filter(item => item !== request), members: action.approve ? [...community.members, request.member] : community.members };
      } else {
        const current = community.members.find(item => item.id === action.memberId);
        if (!current) return state;
        if (action.type === "member-role") {
          if (current.role === action.role) return state;
          message = action.role === "moderator" ? `${current.name} was assigned as moderator` : `${current.name} returned to member access`;
          updated = { ...community, members: community.members.map(item => item === current ? { ...item, role: action.role } : item) };
        } else {
          message = `${current.name} was removed from the community`;
          updated = { ...community, members: community.members.filter(item => item !== current) };
        }
      }
      return log({ ...state, communities: state.communities.map(item => item === community ? { ...updated, activity: [message, ...community.activity] } : item) }, message);
    }
    case "invite-host":
      if (!Object.values(action.draft).every(value => value.trim()) || !/^\d{4}-\d{2}-\d{2}$/.test(action.draft.date) || !Number.isFinite(Date.parse(action.draft.date))) return state;
      return log({ ...state, talks: [...state.talks, { ...action.draft, id: `institution-talk-${state.talks.length + 1}`, status: "awaiting" }] }, `Host invitation sent for ${action.draft.title}`);
    case "host-accept":
    case "publish-talk": {
      const talk = state.talks.find(item => item.id === action.id && item.status === (action.type === "host-accept" ? "awaiting" : "accepted"));
      if (!talk) return state;
      return log({ ...state, talks: state.talks.map(item => item === talk ? { ...item, status: action.type === "host-accept" ? "accepted" : "published" } : item) }, `${talk.title} · ${action.type === "host-accept" ? "Host accepted in the demo" : "Event published"}`);
    }
    case "registration":
      if (!publicInstitutionEvents(state).some(event => event.id === action.id && event.registrationOpen !== action.open)) return state;
      return log({ ...state, registrationOverrides: { ...state.registrationOverrides, [action.id]: action.open } }, `Event registration ${action.open ? "opened" : "closed"}`);
  }
}
