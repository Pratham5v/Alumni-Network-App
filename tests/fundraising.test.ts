import assert from "node:assert/strict";
import { test } from "node:test";
import { campaignProgress, fundraisingReducer, sampleCampaign, todayInIndia, type CampaignDraft } from "../src/lib/fundraising";
import { demoReducer, initialState } from "../src/lib/model";

const today = "2026-11-24";
const draft: CampaignDraft = { title: "Research Fund", summary: "Support student research", purpose: "Materials for the next cohort", goal: 10_000, deadline: "2026-12-31" };

test("campaigns accept pledges and publish updates only after publication", () => {
  const drafts = fundraisingReducer([], { type: "save-draft", draft, today });
  const id = drafts[0].id;
  assert.equal(fundraisingReducer(drafts, { type: "pledge", id, amount: 500, today }), drafts);
  const entry = { title: "Project milestone", message: "Student teams are preparing their prototypes." };
  assert.equal(fundraisingReducer(drafts, { type: "add-update", id, update: entry }), drafts);
  const published = fundraisingReducer(drafts, { type: "publish", id, today });
  const updated = fundraisingReducer(published, { type: "add-update", id, update: entry });
  assert.equal(updated[0].status, "published");
  assert.deepEqual(updated[0].updates, [entry]);
});

test("the alumni and admin views share the pledge total, with one pledge per demo supporter", () => {
  const id = sampleCampaign.id;
  const pledge = (state: typeof initialState, amount: number) => demoReducer(state, { type: "institution", action: { type: "fundraising", action: { type: "pledge", id, amount, today } } });
  const first = pledge(initialState, 500);
  const edited = pledge(first, 1_000);
  assert.deepEqual(campaignProgress(first.institution.campaigns[0]), { total: 36_500, supporters: 13, percent: 30 });
  assert.deepEqual(campaignProgress(edited.institution.campaigns[0]), { total: 37_000, supporters: 13, percent: 31 });
  assert.equal(demoReducer(edited, { type: "new-journey" }).institution, edited.institution);
});

test("campaign deadlines are inclusive in India and prevent late or invalid pledges", () => {
  assert.equal(todayInIndia(new Date("2026-12-31T18:29:00Z")), "2026-12-31");
  const afterDeadline = todayInIndia(new Date("2026-12-31T18:30:00Z"));
  const campaigns = [sampleCampaign];
  assert.equal(afterDeadline, "2027-01-01");
  assert.equal(fundraisingReducer(campaigns, { type: "pledge", id: sampleCampaign.id, amount: 500, today: afterDeadline }), campaigns);
  assert.equal(fundraisingReducer(campaigns, { type: "pledge", id: sampleCampaign.id, amount: 0.5, today }), campaigns);
});
