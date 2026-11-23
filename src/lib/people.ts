export type Person = {
  id: string; name: string; role: string; company: string; location: string;
  batch: string; initials: string; color: string; expertise: string[];
  about: string; help: string; commitment: "20-minute call" | "30-minute call";
  communities: string[];
  currentIntents?: { title: string; status: string }[];
};
export const people: Person[] = [
  {
    id: "aarav", name: "Aarav Shah", role: "Product Manager", company: "Product studio", location: "Bengaluru", batch: "2018", initials: "AS", color: "sage",
    expertise: ["Product strategy", "Startup feedback", "Early-stage products"],
    about: "I work with early-stage teams to turn ideas into useful products. Happy to be a sounding board for a fellow alumnus.",
    help: "Feedback on startup ideas and which features to prioritize.", commitment: "20-minute call",
    communities: ["BITS", "Bengaluru", "Product & Startups"],
    currentIntents: [{ title: "Coffee chats in Bengaluru", status: "Offering help · 5 days remaining" }],
  },
  {
    id: "neha", name: "Neha Rao", role: "Founder", company: "Northstar Labs", location: "Gurgaon", batch: "2016", initials: "NR", color: "peach",
    expertise: ["Building a startup", "Customer discovery", "Career decisions"],
    about: "Building a small team and learning along the way. I enjoy sharing an honest perspective on starting up and finding your direction.",
    help: "A founder’s perspective on an idea or your next career step.", commitment: "30-minute call",
    communities: ["BITS", "Gurgaon", "Product & Startups"],
  },
  {
    id: "kabir", name: "Kabir Mehta", role: "Senior Engineer", company: "Technology team", location: "Mumbai", batch: "2019", initials: "KM", color: "blue",
    expertise: ["Backend engineering", "System design", "Engineering careers"],
    about: "Backend engineer working on reliable services. Open to talking through technical choices and early-career questions.",
    help: "Discussing architecture choices and growing as an engineer.", commitment: "20-minute call",
    communities: ["BITS", "Mumbai", "Software Engineering"],
  },
];
