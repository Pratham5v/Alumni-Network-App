import assert from "node:assert/strict";
import { test } from "node:test";
import { googleCalendarUrl, interviewTimeLabel, tomorrowInterview } from "../src/lib/calendar";

test("tomorrow at 6 PM uses the Indian date, including midnight and year boundaries", () => {
  for (const [now, expected] of [
    ["2026-11-23T10:00:00Z", "2026-11-24T12:30:00.000Z"],
    ["2026-11-23T19:00:00Z", "2026-11-25T12:30:00.000Z"],
    ["2026-12-31T10:00:00Z", "2027-01-01T12:30:00.000Z"],
    ["2028-02-28T10:00:00Z", "2028-02-29T12:30:00.000Z"],
  ]) {
    const meeting = tomorrowInterview(new Date(now));
    assert.equal(meeting.start, expected);
    assert.equal(Date.parse(meeting.end) - Date.parse(meeting.start), 20 * 60_000);
  }
});

test("calendar event contains the exact agreed time, participants, context and sample link", () => {
  const now = new Date("2026-11-23T10:00:00Z");
  const meeting = tomorrowInterview(now);
  const link = "https://meet.example.com/alumni-call?context=AI&demo=true";
  const url = new URL(googleCalendarUrl(meeting, link, "Prathmesh Mehrotra"));
  assert.equal(url.origin, "https://calendar.google.com");
  assert.equal(url.pathname, "/calendar/r/eventedit");
  assert.equal(url.searchParams.get("action"), "TEMPLATE");
  assert.equal(url.searchParams.get("dates"), "20261124T123000Z/20261124T125000Z");
  assert.equal(url.searchParams.get("text"), "AI interview prep with Riya");
  assert.equal(url.searchParams.get("stz"), "Asia/Kolkata");
  assert.equal(url.searchParams.get("etz"), "Asia/Kolkata");
  assert.equal(url.searchParams.get("location"), link);
  const details = url.searchParams.get("details")!;
  for (const value of ["Riya Sharma", "Prathmesh Mehrotra", "20-minute", "job description", link]) assert.ok(details.includes(value));
  assert.equal(url.searchParams.has("add"), false);
  assert.equal(interviewTimeLabel(meeting, now), "Tomorrow · 6:00–6:20 PM IST");
  assert.match(interviewTimeLabel(meeting, new Date("2026-11-25T10:00:00Z")), /24 Nov 2026/);
});

test("outgoing calendar event uses its own recipient, context, link and duration", () => {
  const meeting = tomorrowInterview(new Date("2026-11-23T10:00:00Z"), 30);
  const url = new URL(googleCalendarUrl(meeting, "https://meet.example.com/startup", "Prathmesh Mehrotra", {
    title: "Startup feedback with Aarav", otherName: "Aarav Shah", context: "Feedback on my startup idea",
  }));
  assert.equal(url.searchParams.get("text"), "Startup feedback with Aarav");
  assert.equal(url.searchParams.get("dates"), "20261124T123000Z/20261124T130000Z");
  assert.equal(url.searchParams.get("location"), "https://meet.example.com/startup");
  assert.match(url.searchParams.get("details")!, /30-minute call with Aarav Shah and Prathmesh Mehrotra/);
  assert.match(url.searchParams.get("details")!, /Feedback on my startup idea/);
  assert.ok(!url.searchParams.get("details")!.includes("Riya"));
  assert.equal(interviewTimeLabel(meeting, new Date("2026-11-23T10:00:00Z")), "Tomorrow · 6:00–6:30 PM IST");
});
