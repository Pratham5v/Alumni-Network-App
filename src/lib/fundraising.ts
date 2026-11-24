export type CampaignDraft = { title: string; summary: string; purpose: string; goal: number; deadline: string };
type CampaignUpdate = { title: string; message: string };
export type Campaign = CampaignDraft & {
  id: string;
  status: "draft" | "published";
  pledges: Record<string, number>;
  updates: CampaignUpdate[];
};

export const sampleCampaign: Campaign = {
  id: "student-projects",
  title: "Student Project Fund",
  summary: "Help student teams build and test their ideas.",
  purpose: "Small grants cover prototype materials and testing for student teams preparing for the campus showcase.",
  goal: 120_000,
  deadline: "2026-12-31",
  status: "published",
  pledges: Object.fromEntries(Array.from({ length: 12 }, (_, index) => ["sample-" + index, 3_000])),
  updates: [{ title: "What student teams are building", message: "Student teams are preparing their first prototypes for the campus showcase. The project fund will help cover materials and testing." }],
};

const rupees = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const localDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });
const deadlineLabel = new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
export const formatRupees = (amount: number) => rupees.format(amount);
export const formatDeadline = (date: string) => deadlineLabel.format(new Date(date));
export const todayInIndia = (now = new Date()) => {
  const parts = localDay.formatToParts(now);
  return ["year", "month", "day"].map(part => parts.find(item => item.type === part)?.value.padStart(2, "0")).join("-");
};
export const demoSupporterId = "prathmesh";
export const maxCampaignAmount = 10_000_000;

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function isCampaignOpen(campaign: Campaign, today: string) {
  return campaign.status === "published" && campaign.deadline >= today;
}

export function campaignProgress(campaign: Campaign) {
  const amounts = Object.values(campaign.pledges);
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  return { total, supporters: amounts.length, percent: Math.round(total / campaign.goal * 100) };
}

export function campaignDraftError(draft: CampaignDraft, today: string) {
  if (!draft.title.trim() || !draft.summary.trim() || !draft.purpose.trim()) return "Add a title, summary, and a description of what the campaign will support.";
  if (!isCampaignAmount(draft.goal)) return "Enter a whole-rupee goal between ₹1 and ₹1,00,00,000.";
  if (!validDate(draft.deadline) || draft.deadline < today) return "Choose today or a future date for the deadline.";
  return "";
}

export function isCampaignAmount(amount: number) {
  return Number.isSafeInteger(amount) && amount > 0 && amount <= maxCampaignAmount;
}

export type FundraisingAction =
  | { type: "save-draft"; id?: string; draft: CampaignDraft; today: string }
  | { type: "publish"; id: string; today: string }
  | { type: "pledge"; id: string; amount: number; today: string }
  | { type: "add-update"; id: string; update: CampaignUpdate };

export function fundraisingReducer(campaigns: Campaign[], action: FundraisingAction): Campaign[] {
  const current = campaigns.find(campaign => campaign.id === action.id);
  if (action.type === "save-draft") {
    if (campaignDraftError(action.draft, action.today) || (action.id && current?.status !== "draft")) return campaigns;
    const { title, summary, purpose, ...datesAndGoal } = action.draft;
    const draft = { ...datesAndGoal, title: title.trim(), summary: summary.trim(), purpose: purpose.trim() };
    return current ? campaigns.map(campaign => campaign === current ? { ...campaign, ...draft } : campaign) :
      [...campaigns, { ...draft, id: "campaign-" + (campaigns.length + 1), status: "draft", updates: [], pledges: {} }];
  }
  if (!current) return campaigns;
  let changed: Campaign;
  switch (action.type) {
    case "publish":
      if (current.status !== "draft" || campaignDraftError(current, action.today)) return campaigns;
      changed = { ...current, status: "published" };
      break;
    case "pledge":
      if (!isCampaignOpen(current, action.today) || !isCampaignAmount(action.amount) || current.pledges[demoSupporterId] === action.amount) return campaigns;
      changed = { ...current, pledges: { ...current.pledges, [demoSupporterId]: action.amount } };
      break;
    case "add-update": {
      const { title, message } = action.update;
      if (current.status !== "published" || !title.trim() || !message.trim()) return campaigns;
      changed = { ...current, updates: [{ title: title.trim(), message: message.trim() }, ...current.updates] };
      break;
    }
  }
  return campaigns.map(campaign => campaign === current ? changed : campaign);
}
