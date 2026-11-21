import assert from "node:assert/strict";
import { test } from "node:test";
import { demoReducer, demoReply, initialState, sampleIntent } from "../src/lib/model";

const withIntent = () => demoReducer(initialState, { type: "publish", intent: sampleIntent });
const withRequest = () => demoReducer(withIntent(), { type: "request", request: { personId: "aarav", message: "Could you share feedback on my startup idea?", commitment: "20-minute call" } });
const accepted = () => demoReducer(withRequest(), { type: "accept" });

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
  assert.equal(demoReducer(pending, { type: "confirm-conversation" }), pending);
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
  assert.equal(demoReducer(state, { type: "confirm-conversation" }), state);
  const sent = demoReducer(state, { type: "send-demo-message" });
  const confirmed = demoReducer(sent, { type: "confirm-conversation" });
  assert.equal(confirmed.conversationConfirmed, true);
  assert.equal(confirmed.messages.length, 3);
  assert.match(confirmed.messages[2].text, /6 PM works for me/);
  assert.equal(demoReducer(confirmed, { type: "confirm-conversation" }), confirmed);
});
test("a delayed confirmation cannot revive a completed request", () => {
  const sent = demoReducer(accepted(), { type: "send-demo-message" });
  const completed = demoReducer(sent, { type: "outcome", outcome: { happened: true, helpful: "Yes", resolved: true } });
  assert.equal(demoReducer(completed, { type: "confirm-conversation" }), completed);
});
test("a new journey preserves the profile while a reset restores sample data", () => {
  const state = { ...accepted(), profile: { ...initialState.profile, name: "Another Alumnus" } };
  const fresh = demoReducer(state, { type: "new-journey" });
  assert.equal(fresh.profile.name, "Another Alumnus");
  assert.equal(fresh.intent, null);
  assert.equal(fresh.request, null);
  assert.deepEqual(demoReducer(state, { type: "reset" }), initialState);
});
