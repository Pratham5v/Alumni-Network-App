export type InterviewMeeting = { start: string; end: string };
const timeZone = "Asia/Kolkata";
const indianDate = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);

export function tomorrowInterview(now: Date, durationMinutes = 20): InterviewMeeting {
  const parts = indianDate(now);
  const part = (name: string) => Number(parts.find(p => p.type === name)!.value);
  // 18:00 IST is 12:30 UTC. UTC calendar arithmetic also handles month/year boundaries.
  const start = new Date(Date.UTC(part("year"), part("month") - 1, part("day") + 1, 12, 30));
  return { start: start.toISOString(), end: new Date(start.getTime() + durationMinutes * 60_000).toISOString() };
}

export function interviewTimeLabel(meeting: InterviewMeeting, now = new Date()): string {
  const tomorrow = tomorrowInterview(now);
  const day = meeting.start === tomorrow.start ? "Tomorrow" : new Intl.DateTimeFormat("en-IN", { timeZone, day: "numeric", month: "short", year: "numeric" }).format(new Date(meeting.start));
  const time = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit", hour12: true });
  return `${day} · ${time.format(new Date(meeting.start)).replace(/\s*(AM|PM)$/, "")}–${time.format(new Date(meeting.end))} IST`;
}

export function googleCalendarUrl(meeting: InterviewMeeting, callLink: string, participant: string, event = {
  title: "AI interview prep with Riya",
  otherName: "Riya Sharma",
  context: "Discuss AI engineering interview experience and preparation priorities. Bring the job description if available.",
}): string {
  const stamp = (value: string) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${stamp(meeting.start)}/${stamp(meeting.end)}`,
    stz: timeZone,
    etz: timeZone,
    ctz: timeZone,
    details: `${(Date.parse(meeting.end) - Date.parse(meeting.start)) / 60_000}-minute call with ${event.otherName} and ${participant}.\n\n${event.context}\n\nSample call link: ${callLink}`,
    location: callLink,
  });
  return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`;
}
