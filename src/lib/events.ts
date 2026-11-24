export type AlumniEvent = {
  id: string;
  title: string;
  category: string;
  host: string;
  date: string;
  time: string;
  duration: string;
  format: string;
  description: string;
  registrationOpen: boolean;
};

export const distinguishedAlumnus = {
  id: "dev",
  initials: "DM",
  color: "sage",
  name: "Dev Malhotra",
  role: "Chief Technology Officer",
  company: "Asterline Systems",
  location: "Bengaluru",
  batch: "2004",
  degree: "B.E.",
  fieldOfStudy: "Computer Science",
  expertise: "AI engineering, applied AI and technology leadership",
  milestones: [
    { title: "Founded Asterline Systems at 26", detail: "Started with a small team building speech and language tools for customer support." },
    { title: "Contributed to open-source AI evaluation", detail: "Helped build tools engineers could use to spot failures before an AI system reached customers." },
    { title: "Helped founders ship their first AI products", detail: "Reviewed early prototypes and helped teams decide what to test before launch." },
  ],
  award: {
    name: "Distinguished Alumnus Award",
    issuer: "BITS Pilani",
    year: "2024",
    reason: "Recognised for leadership in applied AI and mentorship of early-stage founders.",
  },
};

export const aiLecture: AlumniEvent = {
  id: "ai-demo-to-production",
  title: "From AI demo to production",
  category: "AI & technology lecture",
  host: distinguishedAlumnus.name,
  date: "2026-12-10",
  time: "6:00–6:30 PM IST",
  duration: "30 minutes",
  format: "Online lecture",
  description: "Dev shares what changes when an AI prototype meets real users. Learn how to choose a first use case, evaluate model output, and monitor what breaks after launch. The session closes with a short Q&A.",
  registrationOpen: true,
};

export const alumniEvents: AlumniEvent[] = [
  aiLecture,
  {
    id: "bengaluru-alumni-meetup",
    title: "Bengaluru alumni meetup",
    category: "Alumni meetup",
    host: "BITS Bengaluru alumni chapter",
    date: "2026-12-12",
    time: "4:00–5:30 PM IST",
    duration: "90 minutes",
    format: "In person · Bengaluru",
    description: "Meet fellow alumni in Bengaluru for informal conversations about what you’re working on and where the network could help.",
    registrationOpen: false,
  },
  {
    id: "engineering-career-panel",
    title: "Finding your path in engineering",
    category: "Career panel",
    host: "BITS Alumni Relations",
    date: "2026-12-16",
    time: "6:30–7:15 PM IST",
    duration: "45 minutes",
    format: "Online panel",
    description: "Alumni share how they navigated early career choices, moved between roles, and decided when to specialise.",
    registrationOpen: false,
  },
];

const shortEventDate = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "long", timeZone: "UTC" });
const fullEventDate = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeZone: "UTC" });
const eventMonth = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });

export function eventDateLabel(date: string, style: "short" | "full") {
  return (style === "short" ? shortEventDate : fullEventDate).format(new Date(date));
}

export function eventDateBadge(date: string) {
  const day = new Date(date);
  return { day: day.getUTCDate(), month: eventMonth.format(day) };
}
