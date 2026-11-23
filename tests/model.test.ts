import assert from "node:assert/strict";
import { test } from "node:test";
import { demoReducer, demoReply, incomingScenario, initialState, sampleCallLink, sampleIntent, sampleOutcome } from "../src/lib/model";

const withIntent = () => demoReducer(initialState, { type: "publish", intent: sampleIntent });
const withRequest = () => demoReducer(withIntent(), { type: "request", request: { personId: "aarav", message: "Could you share feedback on my startup idea?", commitment: "20-minute call" } });
const accepted = () => demoReducer(withRequest(), { type: "accept" });
const completed = () => demoReducer(accepted(), { type: "outcome", outcome: sampleOutcome });
const received = () => demoReducer(completed(), { type: "introduce-incoming" });

test("a request needs an active intent; duplicate submissions keep the original", () => {
  const action = { type: "request", request: { personId: "aarav", message: "A clear ask", commitment: "20-minute call" } } as const;
  assert.equal(demoReducer(initialState, action), initialState);
  const pending = withRequest();
  assert.equal(demoReducer(pending, action), pending);
});
test("acceptance opens one conversation and cannot be repeated", () => {
  const state = accepted();
  assert.equal(state.request?.status, "accepted");
  assert.equal(state.messages.length, 1);
  assert.equal(demoReducer(state, { type: "accept" }), state);
});
test("a pending request cannot be completed or messaged", () => {
  const pending = withRequest();
  assert.equal(demoReducer(pending, { type: "send-demo-message" }), pending);
  assert.equal(demoReducer(pending, { type: "confirm-conversation", now: "2026-11-23T10:00:00Z" }), pending);
  assert.equal(demoReducer(pending, { type: "outcome", outcome: { happened: true, helpful: "Yes", resolved: true } }), pending);
});
test("not yet keeps the accepted request and intent open", () => {
  const state = accepted();
  assert.equal(demoReducer(state, { type: "outcome", outcome: { happened: false } }), state);
});
test("completing an interaction need not resolve the intent", () => {
  const result = demoReducer(accepted(), { type: "outcome", outcome: { happened: true, helpful: "Partly", resolved: false } });
  assert.equal(result.request?.status, "completed");
  assert.equal(result.intent?.status, "active");
});
test("a resolved outcome closes the intent; incomplete feedback does not", () => {
  const state = accepted();
  assert.equal(demoReducer(state, { type: "outcome", outcome: { happened: true } }), state);
  const result = demoReducer(state, { type: "outcome", outcome: { happened: true, helpful: "Yes", resolved: true } });
  assert.equal(result.intent?.status, "resolved");
  assert.equal(result.request?.status, "completed");
});
test("the fixed demo reply can only be sent once", () => {
  const state = accepted();
  const result = demoReducer(state, { type: "send-demo-message" });
  assert.equal(result.messages[1].text, demoReply);
  assert.equal(result.messages[1].from, "you");
  assert.equal(demoReducer(result, { type: "send-demo-message" }), result);
});
test("confirmation requires a sent reply and is generated only once", () => {
  const state = accepted();
  assert.equal(demoReducer(state, { type: "confirm-conversation", now: "2026-11-23T10:00:00Z" }), state);
  const sent = demoReducer(state, { type: "send-demo-message" });
  const confirmed = demoReducer(sent, { type: "confirm-conversation", now: "2026-11-23T10:00:00Z" });
  assert.equal(confirmed.conversationConfirmed, true);
  assert.equal(confirmed.messages.length, 3);
  assert.match(confirmed.messages[2].text, /6 PM works for me/);
  assert.equal(demoReducer(confirmed, { type: "confirm-conversation", now: "2026-11-23T10:00:00Z" }), confirmed);
});
test("a delayed confirmation cannot revive a completed request", () => {
  const sent = demoReducer(accepted(), { type: "send-demo-message" });
  const completed = demoReducer(sent, { type: "outcome", outcome: { happened: true, helpful: "Yes", resolved: true } });
  assert.equal(demoReducer(completed, { type: "confirm-conversation", now: "2026-11-23T10:00:00Z" }), completed);
});
test("a new journey preserves the profile while a reset restores sample data", () => {
  const state = { ...accepted(), profile: { ...initialState.profile, name: "Another Alumnus" } };
  const fresh = demoReducer(state, { type: "new-journey" });
  assert.equal(fresh.profile.name, "Another Alumnus");
  assert.equal(fresh.intent, null);
  assert.equal(fresh.request, null);
  assert.deepEqual(demoReducer(state, { type: "reset" }), initialState);
});

test("incoming request requires the completed journey and is introduced only once", () => {
  for (const state of [initialState, withRequest(), accepted()]) assert.equal(demoReducer(state, { type: "introduce-incoming" }), state);
  assert.equal(completed().incoming, null);
  const state = received();
  assert.equal(state.incoming?.status, "pending");
  assert.equal(state.incoming?.unread, true);
  assert.equal(demoReducer(state, { type: "introduce-incoming" }), state);
  assert.equal(demoReducer(state, { type: "read-incoming" }).incoming?.unread, false);
});

test("accepting Riya opens her own conversation with one fixed reply", () => {
  const state = demoReducer(received(), { type: "respond-incoming", response: "accepted" });
  assert.equal(state.incoming?.messages[0].text, incomingScenario.message);
  const sent = demoReducer(state, { type: "send-incoming-reply", now: "2026-11-23T10:00:00Z" });
  assert.equal(sent.incoming?.messages[1].text, incomingScenario.reply);
  assert.equal(demoReducer(sent, { type: "send-incoming-reply", now: "2026-11-23T10:00:00Z" }), sent);
  assert.equal(demoReducer(sent, { type: "respond-incoming", response: "declined", message: incomingScenario.decline }), sent);
  assert.equal(sent.request?.status, "completed");
});

test("decline and alternative require a message and preserve the original outcome", () => {
  for (const response of ["declined", "alternative-suggested"] as const) {
    const state = received();
    assert.equal(demoReducer(state, { type: "respond-incoming", response, message: " " }), state);
    const message = response === "declined" ? incomingScenario.decline : incomingScenario.alternative;
    const result = demoReducer(state, { type: "respond-incoming", response, message });
    assert.equal(result.incoming?.status, response);
    assert.equal(result.incoming?.response, message);
    assert.equal(result.incoming?.unread, false);
    assert.equal(result.request, state.request);
    assert.equal(result.intent, state.intent);
    assert.equal(demoReducer(result, { type: "send-incoming-reply", now: "2026-11-23T10:00:00Z" }), result);
  }
});

test("call links require confirmation, reject unsafe protocols, and are shared once", () => {
  const share = { type: "share-call-link", url: sampleCallLink, target: "sent" } as const;
  const state = accepted();
  assert.equal(demoReducer(state, share), state);
  const confirmed = demoReducer(demoReducer(state, { type: "send-demo-message" }), { type: "confirm-conversation", now: "2026-11-23T10:00:00Z" });
  for (const url of ["", "invalid", "javascript:alert(1)", "file:///tmp/test"]) assert.equal(demoReducer(confirmed, { ...share, url }), confirmed);
  const shared = demoReducer(confirmed, share);
  assert.equal(shared.callLink, sampleCallLink);
  assert.equal(shared.meeting?.start, "2026-11-24T12:30:00.000Z");
  assert.equal(shared.meeting?.end, "2026-11-24T12:50:00.000Z");
  assert.equal(shared.meeting, confirmed.meeting);
  assert.match(shared.messages.at(-1)!.text, /https:\/\/meet.example.com/);
  assert.equal(demoReducer(shared, share), shared);
});

test("Riya sends the link only after confirmation and the meeting stays fixed", () => {
  const share = { type: "receive-incoming-call-link" } as const;
  const state = demoReducer(received(), { type: "respond-incoming", response: "accepted" });
  assert.equal(demoReducer(state, share), state);
  const sent = demoReducer(state, { type: "send-incoming-reply", now: "2026-11-23T10:00:00Z" });
  const result = demoReducer(sent, share);
  assert.equal(result.incoming?.callLink, sampleCallLink);
  assert.equal(result.incoming?.messages.at(-1)?.from, "alumnus");
  assert.match(result.incoming!.messages.at(-1)!.text, /Tomorrow at 6 PM/);
  assert.equal(result.incoming?.meeting?.start, "2026-11-24T12:30:00.000Z");
  assert.equal(result.incoming?.meeting?.end, "2026-11-24T12:50:00.000Z");
  assert.equal(demoReducer(result, { type: "send-incoming-reply", now: "2026-11-25T10:00:00Z" }), result);
  assert.equal(result.callLink, null);
  assert.equal(result.messages, sent.messages);
  assert.equal(demoReducer(result, share), result);
  assert.equal(demoReducer(result, { type: "new-journey" }).incoming, result.incoming);
  assert.equal(demoReducer(result, { type: "reset" }).incoming, null);
});

test("pending and declined requests cannot receive a call link or create a meeting", () => {
  const pending = received();
  const declined = demoReducer(pending, { type: "respond-incoming", response: "declined", message: incomingScenario.decline });
  for (const state of [pending, declined]) {
    assert.equal(demoReducer(state, { type: "receive-incoming-call-link" }), state);
    assert.equal(demoReducer(state, { type: "send-incoming-reply", now: "2026-11-23T10:00:00Z" }), state);
    assert.equal(state.incoming?.meeting, null);
  }
});
