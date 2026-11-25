export type WorkExperience = { role: string; organization: string; dates: string; summary: string; current?: boolean };

export type Person = {
  id: string; name: string; role: string; company: string; location: string;
  batch: string; initials: string; color: string; expertise: string[];
  about: string; help: string; commitment: "20-minute call" | "30-minute call";
  communities: string[];
  currentIntents?: { title: string; status: string }[];
  workExperience?: WorkExperience[];
};

function matchWords(value: string) {
  return new Set((value.toLowerCase().match(/\p{L}{4,}/gu) ?? []).map(word => word.replace(/s$/, "")));
}

// The demo ranks by shared words in a published intent and each alumnus's offer.
export function relevanceToIntent(person: Person, intent: { title: string; context: string }) {
  const expertise = matchWords(`${person.role} ${person.expertise.join(" ")}`);
  const help = matchWords(person.help);
  const title = matchWords(intent.title);
  const context = matchWords(intent.context);
  let score = 0;
  for (const word of new Set([...title, ...context])) {
    const weight = Number(expertise.has(word)) * 2 + Number(help.has(word));
    score += weight * (title.has(word) ? 3 : 1);
  }
  return score;
}

export const people: Person[] = [
  {
    id: "aarav", name: "Aarav Shah", role: "Product Manager", company: "Product studio", location: "Bengaluru", batch: "2018", initials: "AS", color: "sage",
    expertise: ["Product strategy", "Startup feedback", "Early-stage products"],
    about: "I work with early-stage teams to turn ideas into useful products. Happy to be a sounding board for a fellow alumnus.",
    help: "Feedback on startup ideas and which features to prioritize.", commitment: "20-minute call",
    communities: ["BITS", "Bengaluru", "Product & Startups"],
    currentIntents: [{ title: "Coffee chats in Bengaluru", status: "Offering help · 5 days remaining" }],
    workExperience: [
      { role: "Product Manager", organization: "Product studio", dates: "2022–Present", summary: "Works with early-stage teams to decide what to build and test first.", current: true },
      { role: "Associate Product Manager", organization: "Early-stage startup", dates: "2019–2022", summary: "Ran customer interviews and turned feedback into features to test." },
      { role: "Product Analyst", organization: "Consumer technology team", dates: "2018–2019", summary: "Tracked how customers used the product and flagged where they got stuck." },
    ],
  },
  {
    id: "neha", name: "Neha Rao", role: "Founder", company: "Northstar Labs", location: "Gurgaon", batch: "2016", initials: "NR", color: "peach",
    expertise: ["Building a startup", "Customer discovery", "Career decisions"],
    about: "Building a small team and learning along the way. I enjoy sharing an honest perspective on starting up and finding your direction.",
    help: "A founder’s perspective on an idea or your next career step.", commitment: "30-minute call",
    communities: ["BITS", "Gurgaon", "Product & Startups"],
    workExperience: [
      { role: "Founder", organization: "Northstar Labs", dates: "2022–Present", summary: "Builds a small product team and works directly with early customers.", current: true },
      { role: "Product Lead", organization: "Digital product team", dates: "2018–2022", summary: "Led customer discovery and took new ideas from prototype to launch." },
    ],
  },
  {
    id: "kabir", name: "Kabir Mehta", role: "Senior Engineer", company: "Technology team", location: "Mumbai", batch: "2019", initials: "KM", color: "blue",
    expertise: ["Backend engineering", "System design", "Engineering careers"],
    about: "Backend engineer working on reliable services. Open to talking through technical choices and early-career questions.",
    help: "Discussing architecture choices and growing as an engineer.", commitment: "20-minute call",
    communities: ["BITS", "Mumbai", "Software Engineering"],
    workExperience: [
      { role: "Senior Engineer", organization: "Technology team", dates: "2023–Present", summary: "Designs backend services and helps teams improve their reliability.", current: true },
      { role: "Software Engineer", organization: "Platform team", dates: "2019–2023", summary: "Built APIs and maintained services used by internal product teams." },
    ],
  },
];
