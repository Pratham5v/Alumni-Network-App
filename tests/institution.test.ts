import assert from "node:assert/strict";
import { test } from "node:test";
import { demoReducer, initialState } from "../src/lib/model";
import { initialInstitutionState, institutionReducer, previewAlumniBatch, publicInstitutionEvents, readyAlumni, sampleBatchCsv } from "../src/lib/institution";
import { sampleAlumniRecord } from "../src/lib/onboarding";

test("batch import previews errors, handles quoted values and never imports duplicates", () => {
  const csv = sampleBatchCsv.replace("Kavya Menon", '"Menon, Kavya"');
  const rows = previewAlumniBatch(csv, initialInstitutionState.records);
  assert.equal(rows[0].name, "Menon, Kavya");
  assert.equal(rows[2].issue, "Missing or invalid email");
  const imported = institutionReducer(initialInstitutionState, { type: "import", file: "batch.csv", rows });
  assert.equal(readyAlumni(imported).length, 4);
  assert.equal(institutionReducer(imported, { type: "import", file: "batch.csv", rows }), imported);
  assert.equal(previewAlumniBatch(csv, imported.records)[0].issue, "Duplicate record");
  const invited = institutionReducer(imported, { type: "invite-ready" });
  assert.equal(readyAlumni(invited).length, 0);
  assert.equal(invited.records.filter(record => record.status === "invited").length, 4);
});

test("manual verification requires matching details before approval and queues one invitation", () => {
  assert.equal(institutionReducer(initialInstitutionState, { type: "review-approve" }), initialInstitutionState);
  const awaiting = institutionReducer(initialInstitutionState, { type: "review-more-info", message: "Confirm your year." });
  assert.equal(awaiting.review.status, "more-info");
  const { name, batch, degree, branch } = sampleAlumniRecord;
  const corrected = institutionReducer(awaiting, { type: "submit-review", details: { name, batch, degree, branch } });
  const approved = institutionReducer(corrected, { type: "review-approve" });
  assert.equal(approved.review.status, "approved");
  assert.equal(readyAlumni(approved).length, 3);
  assert.equal(institutionReducer(approved, { type: "review-approve" }), approved);
});

test("membership approvals add one member and moderator changes update that roster", () => {
  const approved = institutionReducer(initialInstitutionState, { type: "membership", id: "bengaluru", memberId: "meera", approve: true });
  const changed = institutionReducer(approved, { type: "member-role", id: "bengaluru", memberId: "meera", role: "moderator" });
  const community = changed.communities[0];
  assert.equal(community.members.length, 4);
  assert.equal(community.requests.length, 1);
  assert.equal(community.members.find(member => member.id === "meera")?.role, "moderator");
  assert.equal(institutionReducer(changed, { type: "membership", id: "bengaluru", memberId: "meera", approve: true }), changed);
});

test("talks become discoverable and registrable only after host acceptance and publication", () => {
  const draft = { title: "Reliable AI", date: "2026-12-17", time: "6 PM IST", description: "A public description", message: "A private invitation" };
  const id = "institution-talk-1";
  const awaiting = institutionReducer(initialInstitutionState, { type: "invite-host", draft });
  assert.equal(institutionReducer(awaiting, { type: "publish-talk", id }), awaiting);
  assert.equal(publicInstitutionEvents(awaiting).some(event => event.id === id), false);
  const accepted = institutionReducer(awaiting, { type: "host-accept", id });
  const published = institutionReducer(accepted, { type: "publish-talk", id });
  assert.equal(publicInstitutionEvents(published).find(event => event.id === id)?.description, draft.description);
  const demo = { ...initialState, institution: published };
  assert.deepEqual(demoReducer(demo, { type: "register-event", eventId: id }).registeredEventIds, [id]);
  const closed = demoReducer(demo, { type: "institution", action: { type: "registration", id, open: false } });
  assert.equal(demoReducer(closed, { type: "register-event", eventId: id }), closed);
  assert.equal(demoReducer(closed, { type: "new-journey" }).institution, closed.institution);
});
