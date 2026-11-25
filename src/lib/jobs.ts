export const workModes = ["Hybrid", "On-site", "Remote"] as const;
export const jobTypes = ["Full-time", "Part-time", "Contract", "Internship"] as const;
export const experienceLevels = ["Entry level", "Mid level", "Senior level"] as const;
export const jobIndustries = ["Technology", "Design services", "Media & research", "Financial services", "Healthcare", "Education", "Consumer goods", "Other"] as const;
export const alumniJobPosterId = "prathmesh";

export type JobFilters = { query: string; location: string; industry: string; experienceLevel: string; employment: string; workMode: string; view: "all" | "saved" | "applied" };
export const defaultJobFilters: JobFilters = { query: "", location: "", industry: "", experienceLevel: "", employment: "", workMode: "", view: "all" };

export type JobDraft = {
  title: string;
  company: string;
  location: string;
  workMode: typeof workModes[number];
  description: string;
  applicationUrl: string;
  referralAvailable: boolean;
  employment?: typeof jobTypes[number];
  experienceLevel?: typeof experienceLevels[number];
  industry?: typeof jobIndustries[number];
  expertise?: string[];
};

export type Job = Omit<JobDraft, "applicationUrl"> & {
  id: string;
  sharedBy: string;
  applicationUrl?: string;
  responsibilities?: string[];
  qualifications?: string[];
};

export function normalizeJobDraft(draft: JobDraft): JobDraft | null {
  const title = draft.title.trim();
  const company = draft.company.trim();
  const location = draft.location.trim();
  const description = draft.description.trim();
  const expertise = draft.expertise?.map(skill => skill.trim()).filter(Boolean);
  if (!title || title.length > 80 || !company || company.length > 80 || location.length > 80 ||
      !description || description.length > 600 || !workModes.includes(draft.workMode) ||
      (draft.employment && !jobTypes.includes(draft.employment)) || (draft.industry && !jobIndustries.includes(draft.industry)) ||
      (draft.experienceLevel && !experienceLevels.includes(draft.experienceLevel)) ||
      (expertise && (expertise.length > 10 || expertise.some(skill => skill.length > 50)))) return null;
  try {
    const url = new URL(draft.applicationUrl.trim());
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.href.length > 500) return null;
    return { ...draft, title, company, location, description, applicationUrl: url.href, ...(expertise?.length ? { expertise } : {}) };
  } catch {
    return null;
  }
}

export function matchesJobFilters(job: Job, filters: JobFilters, posterName = "") {
  const query = filters.query.trim().toLowerCase();
  return (!filters.location || job.location.toLowerCase() === filters.location.toLowerCase())
    && (!filters.industry || job.industry === filters.industry)
    && (!filters.experienceLevel || job.experienceLevel === filters.experienceLevel)
    && (!filters.employment || job.employment === filters.employment)
    && (!filters.workMode || job.workMode === filters.workMode)
    && [job.title, job.company, job.location, job.industry, job.workMode, job.employment, job.expertise?.join(" "), posterName].join(" ").toLowerCase().includes(query);
}

export const jobs: Job[] = [
  {
    id: "backend-engineer", title: "Backend Engineer", company: "Asterline Systems",
    location: "Bengaluru", workMode: "Hybrid", employment: "Full-time", sharedBy: "kabir", referralAvailable: true,
    industry: "Technology", experienceLevel: "Senior level", expertise: ["Backend engineering", "APIs", "SQL"],
    description: "Build reliable APIs and backend services for applied AI products.",
    responsibilities: ["Design APIs and data models for product features.", "Improve reliability through testing, monitoring and incident follow-up."],
    qualifications: ["Experience building backend services and working with relational databases.", "Comfort explaining technical trade-offs to product and engineering teammates."],
  },
  {
    id: "product-design-intern", title: "Product Design Intern", company: "Northstar Labs",
    location: "Gurgaon", workMode: "On-site", employment: "Internship", sharedBy: "neha", referralAvailable: true,
    industry: "Design services", experienceLevel: "Entry level", expertise: ["Product design", "Prototyping", "User research"],
    description: "Work with an early-stage team to prototype ideas and turn user feedback into product changes.",
    responsibilities: ["Sketch and prototype flows for new product ideas.", "Help run usability sessions and summarize what to change."],
    qualifications: ["A portfolio that shows how you approached a design problem.", "Comfort working with feedback and iterating on your work."],
  },
  {
    id: "data-analyst", title: "Data Analyst", company: "Clearwater Studio",
    location: "India", workMode: "Remote", employment: "Full-time", sharedBy: "aarav", referralAvailable: false,
    industry: "Media & research", experienceLevel: "Mid level", expertise: ["Data analytics", "SQL", "Reporting"],
    description: "Help product teams understand what users do and where they get stuck.",
    responsibilities: ["Define product metrics and build reports from operational data.", "Investigate changes in usage and explain your findings to product teams."],
    qualifications: ["Comfort querying data with SQL and checking its quality.", "Ability to communicate findings clearly to people outside analytics."],
  },
];
