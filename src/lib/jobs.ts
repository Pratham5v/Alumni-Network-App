export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: "Hybrid" | "On-site" | "Remote";
  employment: "Full-time" | "Internship";
  sharedBy: string;
  referralAvailable: boolean;
  description: string;
  responsibilities: string[];
  qualifications: string[];
};

export const jobs: Job[] = [
  {
    id: "backend-engineer", title: "Backend Engineer", company: "Asterline Systems",
    location: "Bengaluru", workMode: "Hybrid", employment: "Full-time", sharedBy: "kabir", referralAvailable: true,
    description: "Build reliable APIs and backend services for applied AI products.",
    responsibilities: ["Design APIs and data models for product features.", "Improve reliability through testing, monitoring and incident follow-up."],
    qualifications: ["Experience building backend services and working with relational databases.", "Comfort explaining technical trade-offs to product and engineering teammates."],
  },
  {
    id: "product-design-intern", title: "Product Design Intern", company: "Northstar Labs",
    location: "Gurgaon", workMode: "On-site", employment: "Internship", sharedBy: "neha", referralAvailable: true,
    description: "Work with an early-stage team to prototype ideas and turn user feedback into product changes.",
    responsibilities: ["Sketch and prototype flows for new product ideas.", "Help run usability sessions and summarize what to change."],
    qualifications: ["A portfolio that shows how you approached a design problem.", "Comfort working with feedback and iterating on your work."],
  },
  {
    id: "data-analyst", title: "Data Analyst", company: "Clearwater Studio",
    location: "India", workMode: "Remote", employment: "Full-time", sharedBy: "aarav", referralAvailable: false,
    description: "Help product teams understand what users do and where they get stuck.",
    responsibilities: ["Define product metrics and build reports from operational data.", "Investigate changes in usage and explain your findings to product teams."],
    qualifications: ["Comfort querying data with SQL and checking its quality.", "Ability to communicate findings clearly to people outside analytics."],
  },
];
