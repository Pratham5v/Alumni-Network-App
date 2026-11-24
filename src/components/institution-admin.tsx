"use client";

import { useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Award, CalendarDays, Check, ChevronRight, Ellipsis, FileText, Inbox, Layers3, LayoutGrid, Mail, Plus, Search, ShieldCheck, Upload, Users } from "lucide-react";
import { distinguishedAlumnus, eventDateLabel } from "@/lib/events";
import { previewAlumniBatch, publicInstitutionEvents, readyAlumni, sampleBatchCsv, sampleJoinCandidate, type AlumniRecord, type Community, type CommunityMember, type ImportRow, type InstitutionAction, type InstitutionState, type TalkDraft } from "@/lib/institution";
import { recordDifferences, sampleAlumniRecord } from "@/lib/onboarding";

type WorkspaceProps = {
  state: InstitutionState;
  update: (action: InstitutionAction) => void;
  registeredIds: string[];
  registrant: string;
  activeIntent: boolean;
  helpfulOutcome: boolean;
  onExit: () => void;
};
type Page = "overview" | "queue" | "records" | "communities" | "events";
const navigation = [
  { id: "overview", title: "Overview", icon: LayoutGrid },
  { id: "queue", title: "Work queue", icon: Inbox },
  { id: "records", title: "Alumni records", icon: FileText },
  { id: "communities", title: "Communities", icon: Users },
  { id: "events", title: "Events", icon: CalendarDays },
] as const;
const reviewStates = { pending: "Needs review", "more-info": "Awaiting alumnus", approved: "Approved" };
const countLabel = (count: number, singular: string, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`;

function Button({ children, kind = "secondary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { kind?: "primary" | "secondary" | "light" | "quiet" }) {
  return <button type="button" {...props} className={`inst-button ${kind}`}>{children}</button>;
}
function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "amber" | "green" }) {
  return <span className={`inst-chip ${tone}`}>{children}</span>;
}
function Heading({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="inst-heading"><div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}
function History({ entries }: { entries: string[] }) {
  return <ol className="inst-history">{entries.map((entry, index) => <li key={`${index}-${entry}`}>{entry}</li>)}</ol>;
}
function Face({ id, name }: { id: string; name: string }) {
  if (id.includes("@")) return <span className="inst-face inst-initials" aria-hidden="true">{name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase()}</span>;
  return <Image className="inst-face" src={`/avatars/${id}.svg`} width={37} height={37} alt="" unoptimized />;
}
function Person({ person }: { person: CommunityMember }) {
  return <span className="inst-person"><Face id={person.id} name={person.name} /><span><b>{person.name}</b><small>Class of {person.batch}</small></span></span>;
}

function HelpfulTrend({ currentWeek, period }: { currentWeek: number; period: string }) {
  const counts = period === "7" ? [currentWeek] : [2, 3, 4, currentWeek];
  const points = counts.map((count, index) => [counts.length === 1 ? 200 : 27 + index * 115, 100 - count * 12]);
  const line = points.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${points[0][0]},100 ${line} ${points[points.length - 1][0]},100`;
  return <div className="inst-trend">
    <h3>Helpful interactions by week</h3>
    <svg viewBox="0 0 400 108" role="img" aria-label={counts.map((count, index) => `${period === "7" ? "This week" : `Week ${index + 1}`}: ${count}`).join("; ")}>
      <defs><linearGradient id="inst-trend-fill" x2="0" y2="1"><stop stopColor="#b6d5c7" /><stop offset="1" stopColor="#eef6f0" /></linearGradient></defs>
      <path d="M15 28H385 M15 52H385 M15 76H385 M15 100H385" stroke="#cdded4" strokeDasharray="3 5" fill="none" />
      {points.length > 1 && <><polygon points={area} fill="url(#inst-trend-fill)" /><polyline points={line} stroke="#277164" strokeWidth="2.4" fill="none" /></>}
      {points.map(([x, y], index) => <g key={x}><circle cx={x} cy={y} r="4" fill="#fff" stroke="#277164" strokeWidth="2" /><text x={x} y={y - 9} textAnchor="middle">{counts[index]}</text></g>)}
    </svg>
    <div className="inst-trend-labels">{counts.map((_, index) => <small key={index}>{period === "7" ? "This week" : `Week ${index + 1}`}</small>)}</div>
  </div>;
}

function Overview({ state, activeIntent, helpfulOutcome, open }: Pick<WorkspaceProps, "state" | "activeIntent" | "helpfulOutcome"> & { open: (page: Page, focus?: "review" | "invites") => void }) {
  const [period, setPeriod] = useState("30");
  const ready = readyAlumni(state).length;
  const requests = state.communities.reduce((total, community) => total + community.requests.length, 0);
  const awaitingHosts = state.talks.filter(talk => talk.status === "awaiting").length;
  const helpful = helpfulOutcome ? 1 : 0;
  return <>
    <Heading title="Network overview" description="See what needs attention and how alumni are using the network." action={<Chip>Sample data</Chip>} />
    <div className="inst-overview-grid">
      <section className="inst-focus">
        <span className="inst-focus-label"><ShieldCheck size={19} />Needs attention</span>
        <h2>{state.review.status === "pending" ? "1 verification request needs a decision." : state.review.status === "more-info" ? "Waiting for updated alumni details." : "The verification queue is clear."}</h2>
        <p>{state.review.status === "pending" ? recordDifferences(state.review.details).length
          ? `${state.review.details.name}’s submitted details differ from the BITS record.` : `Review the matching details for ${state.review.details.name}.`
          : state.review.status === "more-info" ? "The applicant can send corrected details from Signup & verification." : "The approved alumnus is ready for an invitation."}</p>
        <Button kind="light" onClick={() => open("queue", "review")}>{state.review.status === "pending" ? "Review request" : "Open work queue"}<ArrowRight size={16} /></Button>
      </section>
      <section className="inst-panel inst-pending">
        <div className="inst-between"><h2>Also in the queue</h2><small>{countLabel(ready + requests + awaitingHosts, "item")}</small></div>
        <button type="button" className="inst-task" onClick={() => open("queue", "invites")}><span className="inst-icon"><Mail size={19} /></span><span><b>{ready} alumni ready to invite</b><small>Verified institution records</small></span><ChevronRight size={17} /></button>
        <button type="button" className="inst-task" onClick={() => open("communities")}><span className="inst-icon sand"><Users size={19} /></span><span><b>{countLabel(requests, "membership request")}</b><small>Across active communities</small></span><ChevronRight size={17} /></button>
        {awaitingHosts > 0 && <button type="button" className="inst-task" onClick={() => open("events")}><span className="inst-icon"><CalendarDays size={19} /></span><span><b>{countLabel(awaitingHosts, "host invitation")} awaiting reply</b><small>Events</small></span><ChevronRight size={17} /></button>}
        <div className="inst-actions"><Button kind="quiet" onClick={() => open("queue")}>Open work queue<ArrowRight size={15} /></Button></div>
      </section>
    </div>
    <section className="inst-panel inst-activity">
      <div className="inst-between"><div><h2>Network activity</h2><small>Membership, current needs, and outcomes.</small></div><select className="inst-period" aria-label="Activity date range" value={period} onChange={event => setPeriod(event.target.value)}><option value="30">Last 30 days</option><option value="7">Last 7 days</option></select></div>
      <div className="inst-overview-grid">
        <dl className="inst-metrics">
          <div><dt>Verified alumni<small>All time</small></dt><dd>{122 + state.records.length}</dd></div>
          <div><dt>Active intents<small>Open now</small></dt><dd>{8 + Number(activeIntent)}</dd></div>
          <div><dt>Interactions marked helpful<small>Last {period} days</small></dt><dd>{(period === "7" ? 5 : 14) + helpful}</dd></div>
          <div><dt>Upcoming events<small>In the alumni app</small></dt><dd>{publicInstitutionEvents(state).length}</dd></div>
        </dl>
        <HelpfulTrend currentWeek={5 + helpful} period={period} />
      </div>
    </section>
    {state.activity.length > 0 && <section className="inst-panel inst-block"><h2>Recent activity</h2><History entries={state.activity.slice(0, 4)} /></section>}
  </>;
}

function WorkQueue({ state, update, mode, setMode, openRecords, openMembership }: Pick<WorkspaceProps, "state" | "update"> & { mode: "review" | "invites"; setMode: (value: "review" | "invites") => void; openRecords: () => void; openMembership: () => void }) {
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("Please confirm your graduation year so we can complete verification.");
  const { review } = state;
  const ready = readyAlumni(state);
  const membershipRequests = state.communities.reduce((count, community) => count + community.requests.length, 0);
  const mismatches = recordDifferences(review.details);
  return <>
    <Heading title="Work queue" description="Review verification requests and send alumni invitations." />
    <div className="inst-panel inst-work-grid">
      <div className="inst-queue">
        <h2>Ready for action</h2>
        <button type="button" className="inst-queue-item" aria-pressed={mode === "review"} onClick={() => setMode("review")}><Chip tone={review.status === "pending" ? "amber" : "neutral"}>{reviewStates[review.status]}</Chip><b>{review.details.name}</b><small>Manual verification</small></button>
        <button type="button" className="inst-queue-item" aria-pressed={mode === "invites"} onClick={() => setMode("invites")}><b>{ready.length} alumni ready to invite</b><small>Verified records</small></button>
        {membershipRequests > 0 && <button type="button" className="inst-queue-item" onClick={openMembership}><b>{countLabel(membershipRequests, "membership request")}</b><small>Review in Communities</small></button>}
      </div>
      <div className="inst-work-detail">
        {mode === "review" ? <>
          <div className="inst-between"><div><h2>{review.details.name}</h2><small>Manual verification request</small></div><Chip tone={review.status === "approved" ? "green" : "amber"}>{reviewStates[review.status]}</Chip></div>
          <div className="inst-table-wrap"><table className="inst-table"><thead><tr><th>Field</th><th>Submitted by alumnus</th><th>BITS record</th></tr></thead><tbody>
            {([["name", "Name"], ["batch", "Graduation year"], ["degree", "Degree"], ["branch", "Branch"]] as const).map(([key, label]) => <tr key={key} className={mismatches.some(field => field === label.toLowerCase()) ? "inst-mismatch" : undefined}><th scope="row">{label}</th><td>{review.details[key]}</td><td>{sampleAlumniRecord[key]}</td></tr>)}
          </tbody></table></div>
          {review.status === "pending" && <>
            {mismatches.length > 0 && <p className="inst-hint">Confirm the highlighted details before approving this request.</p>}
            {editing ? <form className="inst-form" onSubmit={event => { event.preventDefault(); if (!message.trim()) return; update({ type: "review-more-info", message }); setEditing(false); }}>
              <label>Message to the alumnus<textarea required maxLength={400} value={message} onChange={event => setMessage(event.target.value)} /></label>
              <div className="inst-actions"><Button onClick={() => setEditing(false)}>Cancel</Button><Button type="submit" kind="primary">Send request</Button></div>
            </form> : <div className="inst-actions"><Button disabled={mismatches.length > 0} kind={mismatches.length ? "secondary" : "primary"} onClick={() => update({ type: "review-approve" })}>Approve record</Button><Button kind={mismatches.length ? "primary" : "secondary"} onClick={() => { setMessage(mismatches.length ? `Please confirm your ${mismatches.join(", ")} so we can complete verification.` : "Please send further details so we can complete verification."); setEditing(true); }}>Request more information<ArrowRight size={15} /></Button></div>}
          </>}
          {review.status === "more-info" && <div className="inst-status" role="status"><b>Message sent in the demo</b><p>{review.message}</p><Button onClick={() => update({ type: "review-sample-reply" })}>Simulate corrected reply</Button></div>}
          {review.status === "approved" && <div className="inst-status" role="status"><b>Record approved</b><p>The alumnus can enter the app from verification and is ready for an invitation.</p></div>}
          <div className="inst-history-block"><h3>Activity history</h3><History entries={review.activity} /></div>
        </> : <>
          <h2>Invite verified alumni</h2><p className="inst-hint">Each invitation gives a verified alumnus a way to join the network.</p>
          {ready.length > 0 ? <><ul className="inst-list">{ready.map(person => <li key={person.email}><b>{person.name}</b><small>{person.email} · Class of {person.batch}</small></li>)}</ul>
            <div className="inst-actions"><Button kind="primary" onClick={() => update({ type: "invite-ready" })}><Mail size={16} />Invite {ready.length} alumni</Button></div></> : <p className="inst-status" role="status">No verified alumni are waiting for an invitation.</p>}
          <div className="inst-actions"><Button kind="quiet" onClick={openRecords}>View alumni records<ArrowRight size={15} /></Button></div>
        </>}
      </div>
    </div>
  </>;
}

function AlumniRecords({ state, update, onInvites }: Pick<WorkspaceProps, "state" | "update"> & { onInvites: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ file: string; rows: ImportRow[] } | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const uploadAttempt = useRef(0);
  function load(file: string, contents: string) {
    setError("");
    setPreview(null);
    try { setPreview({ file, rows: previewAlumniBatch(contents, state.records) }); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Could not read this file."); }
  }
  const count = preview?.rows.filter(row => !row.issue).length ?? 0;
  const ready = readyAlumni(state).length;
  return <>
    <Heading title={uploading ? "Upload a batch" : "Alumni records"} description={uploading ? "Preview institution records before adding them to the workspace." : "Review imported records and see who has been invited."} action={uploading ? <Button onClick={() => { uploadAttempt.current++; setUploading(false); }}>Back to records</Button> : <Button kind="primary" onClick={() => { setUploading(true); setPreview(null); setError(""); setNotice(""); }}><Upload size={17} />Upload batch</Button>} />
    {notice && <p className="inst-status" role="status">{notice}</p>}
    {uploading ? <>
      <div className="inst-steps"><span>1 · Choose file</span><b aria-current="step">{preview ? "2 · Preview records" : "CSV upload"}</b><span>3 · Import</span></div>
      <section className="inst-panel inst-block">
        <div className="inst-between">
          <label className="inst-file">Alumni CSV<input type="file" accept=".csv,text/csv" onChange={async event => {
            const file = event.target.files?.[0]; if (!file) return;
            const attempt = ++uploadAttempt.current;
            setError(""); setPreview(null);
            if (file.size > 256_000) { setError("Choose a CSV smaller than 256 KB."); return; }
            try { const contents = await file.text(); if (attempt === uploadAttempt.current) load(file.name, contents); }
            catch { if (attempt === uploadAttempt.current) setError("Could not read this file. Choose another CSV."); }
          }} /></label>
          <Button onClick={() => { uploadAttempt.current++; load("class-of-2026.csv", sampleBatchCsv); }}>Use sample batch</Button>
        </div>
        <p className="inst-hint">Columns: name, email, graduation year, degree, branch.</p>
        {error && <p className="inst-status warning" role="alert">{error}</p>}
        {preview && <>
          <h2>{preview.file}</h2>
          <div className="inst-table-wrap"><table className="inst-table"><thead><tr><th>Alumnus</th><th>Graduation year</th><th>Import result</th></tr></thead><tbody>
            {preview.rows.map((row, index) => <tr key={index}><td>{row.name || "Unnamed record"}</td><td>{row.batch || "—"}</td><td><Chip tone={row.issue ? "amber" : "green"}>{row.issue || "Ready to import"}</Chip></td></tr>)}
          </tbody></table></div>
          <p className="inst-hint">{count} ready to import · {preview.rows.length - count} skipped. Invitations are sent from the work queue.</p>
          <div className="inst-actions"><Button kind="primary" disabled={!count} onClick={() => { update({ type: "import", ...preview }); setNotice(`Imported ${count} records. ${preview.rows.length - count} skipped.`); setUploading(false); }}>Import {count} records<ArrowRight size={15} /></Button></div>
        </>}
      </section>
    </> : <section className="inst-panel inst-block">
      <div className="inst-between"><h2>Verified alumni</h2><Button onClick={onInvites} disabled={!ready}><Mail size={16} />Review {ready} ready to invite</Button></div>
      <div className="inst-table-wrap"><table className="inst-table"><thead><tr><th>Alumnus</th><th>Graduation year</th><th>Source</th><th>Status</th></tr></thead><tbody>
        {state.records.map(record => <tr key={record.email}><td><b>{record.name}</b><small>{record.email}</small></td><td>{record.batch}</td><td>{record.batchFile}</td><td><Chip tone="green">{record.status === "invited" ? "Invited" : "Ready to invite"}</Chip></td></tr>)}
      </tbody></table></div>
    </section>}
  </>;
}

function CommunityEditor({ community, existing, onSave, onCancel }: { community?: Community; existing: Community[]; onSave: (action: InstitutionAction) => void; onCancel: () => void }) {
  const [error, setError] = useState("");
  return <form className="inst-panel inst-block inst-form" onSubmit={event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name")).trim(), location = String(data.get("location")).trim();
    if (!name || !location) { setError("Enter a name and location."); return; }
    if (existing.some(item => item.id !== community?.id && item.name.toLowerCase() === name.toLowerCase())) { setError("A community with this name already exists."); return; }
    onSave({ type: "save-community", id: community?.id, name, location, description: String(data.get("description")).trim() });
  }}>
    <label>Community name<input name="name" required maxLength={70} defaultValue={community?.name} /></label>
    <label>Location<input name="location" required maxLength={45} defaultValue={community?.location} /></label>
    <label>Description<textarea name="description" maxLength={240} defaultValue={community?.description} /></label>
    {error && <p className="inst-status warning" role="alert">{error}</p>}
    <div className="inst-actions"><Button onClick={onCancel}>Cancel</Button><Button kind="primary" type="submit">{community ? "Save changes" : "Create community"}</Button></div>
  </form>;
}

function Communities({ state, update, initialId }: Pick<WorkspaceProps, "state" | "update"> & { initialId: string | null }) {
  const [id, setId] = useState<string | null>(initialId);
  const [editing, setEditing] = useState(false);
  const community = state.communities.find(item => item.id === id);
  if (editing) return <><Heading title={community ? "Edit community" : "Create a community"} description="Set the name and purpose alumni will see." /><CommunityEditor community={community} existing={state.communities} onSave={action => {
    update(action); if (!community) setId(`community-${state.communities.length + 1}`); setEditing(false);
  }} onCancel={() => setEditing(false)} /></>;
  if (community) return <CommunityDetail key={community.id} community={community} records={state.records} update={update} onEdit={() => setEditing(true)} onBack={() => setId(null)} />;
  return <>
    <Heading title="Communities" description="Manage membership, moderators, and activity." action={<Button kind="primary" onClick={() => setEditing(true)}><Plus size={17} />Create community</Button>} />
    <section className="inst-panel inst-community-list" aria-label="Communities">{state.communities.map(item => <button key={item.id} type="button" className="inst-task" onClick={() => setId(item.id)}>
      <span className="inst-icon"><Users size={19} /></span><span><b>{item.name}</b><small>{item.location} · {countLabel(item.members.length, "member")} · {item.requests.length} pending</small></span><ChevronRight size={17} />
    </button>)}</section>
  </>;
}

function CommunityDetail({ community, records, update, onEdit, onBack }: { community: Community; records: AlumniRecord[]; update: WorkspaceProps["update"]; onEdit: () => void; onBack: () => void }) {
  const [tab, setTab] = useState("Members");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [adding, setAdding] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [memberAction, setMemberAction] = useState<{ id: string; confirmRemoval: boolean } | null>(null);
  const [message, setMessage] = useState("");
  const [requestIndex, setRequestIndex] = useState(0);
  const request = community.requests[requestIndex] ?? community.requests[0];
  const nextRequest = community.requests.find(item => item !== request);
  const filters = community.members.filter(member => member.name.toLowerCase().includes(search.trim().toLowerCase()) && (tab !== "Moderators" || member.role === "moderator") && (tab === "Moderators" || !role || member.role === role));
  const candidates = community.members.filter(person => person.role === "member");
  const eligible = records.filter(record => !community.members.some(member => member.name.toLowerCase() === record.name.toLowerCase()) && !community.requests.some(request => request.member.name.toLowerCase() === record.name.toLowerCase()));
  const demoJoin = community.id !== "bengaluru" && sampleJoinCandidate(community);
  return <>
    <Button kind="quiet" onClick={onBack}><ArrowLeft size={16} />Communities</Button>
    <div className="inst-community-heading"><span className="inst-icon"><Users size={25} /></span><Heading title={community.name} description={`${community.location} · ${countLabel(community.members.length, "member")} · ${countLabel(community.activeIntents, "active intent")}`} action={<Button onClick={onEdit}>Edit community</Button>} /></div>
    {community.description && <p className="inst-community-description">{community.description}</p>}
    {message && <p className="inst-status" role="status">{message}</p>}
    <div className="inst-community-grid">
      <section className="inst-panel inst-roster">
        <nav className="inst-tabs" aria-label="Community views">{["Members", "Moderators", "Activity"].map(label => <button key={label} type="button" aria-pressed={label === tab} onClick={() => { setTab(label); setSearch(""); setAssigning(false); setAdding(false); setMemberAction(null); }}>{label}{label === "Members" ? ` ${community.members.length}` : label === "Moderators" ? ` ${community.members.filter(member => member.role === "moderator").length}` : ""}</button>)}</nav>
        <div className="inst-block">
          <div className="inst-between"><h2>{tab}</h2>{tab !== "Activity" && <div className="inst-actions inst-roster-actions">
            {tab === "Members" && <Button disabled={!eligible.length} onClick={() => { setAdding(!adding); setAssigning(false); setMemberId(""); }}>Add member</Button>}
            <Button disabled={!candidates.length} onClick={() => { setAssigning(!assigning); setAdding(false); setMemberId(""); }}><Plus size={16} />Assign moderator</Button>
          </div>}</div>
          {tab === "Activity" ? <History entries={community.activity} /> : <>
            {assigning && <form className="inst-form inst-assignment" onSubmit={event => {
              event.preventDefault(); if (!memberId) return;
              update({ type: "member-role", id: community.id, memberId, role: "moderator" }); setAssigning(false); setMessage("Moderator assigned.");
            }}>
              <p className="inst-hint">Moderators can review join requests and help manage community membership.</p>
              <label>Member to assign<select required value={memberId} onChange={event => setMemberId(event.target.value)}><option value="">Select a member</option>{candidates.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
              <div className="inst-actions"><Button onClick={() => setAssigning(false)}>Cancel</Button><Button type="submit" kind="primary">Confirm assignment</Button></div>
            </form>}
            {adding && <form className="inst-form inst-assignment" onSubmit={event => {
              event.preventDefault(); if (!memberId) return;
              update({ type: "add-member", id: community.id, email: memberId }); setAdding(false); setMessage("Member added.");
            }}>
              <label>Verified alumnus<select required value={memberId} onChange={event => setMemberId(event.target.value)}><option value="">Select an alumnus</option>{eligible.map(person => <option key={person.email} value={person.email}>{person.name}</option>)}</select></label>
              <div className="inst-actions"><Button onClick={() => setAdding(false)}>Cancel</Button><Button type="submit" kind="primary">Confirm member</Button></div>
            </form>}
            <div className="inst-member-filters"><label className="inst-search"><Search size={17} /><input type="search" placeholder="Find an alumnus" aria-label="Find an alumnus" value={search} onChange={event => setSearch(event.target.value)} /></label>
              {tab === "Members" && <select aria-label="Filter member role" value={role} onChange={event => setRole(event.target.value)}><option value="">All roles</option><option value="moderator">Moderators</option><option value="member">Members</option></select>}</div>
            {filters.length ? <div className="inst-table-wrap"><table className="inst-table"><thead><tr><th>Alumnus</th><th>Role</th><th>Actions</th></tr></thead><tbody>{filters.map(person => <tr key={person.id}>
              <td><Person person={person} /></td><td><Chip tone={person.role === "moderator" ? "green" : "neutral"}>{person.role === "moderator" ? "Moderator" : "Member"}</Chip></td>
              <td>
                <button type="button" className="inst-member-menu" aria-label={`Manage ${person.name}`} aria-expanded={memberAction?.id === person.id} onClick={() => setMemberAction(memberAction?.id === person.id ? null : { id: person.id, confirmRemoval: false })}><Ellipsis size={20} /></button>
                {memberAction?.id === person.id && <div className="inst-row-actions">
                  {memberAction.confirmRemoval ? <><Button onClick={() => setMemberAction(null)}>Cancel</Button><Button onClick={() => { update({ type: "remove-member", id: community.id, memberId: person.id }); setMemberAction(null); setMessage(`${person.name} was removed.`); }}>Confirm removal</Button></> :
                    <>
                      {person.role === "moderator" && <Button kind="quiet" onClick={() => { update({ type: "member-role", id: community.id, memberId: person.id, role: "member" }); setMemberAction(null); setMessage(`${person.name} is now a member.`); }}>End moderator role</Button>}
                      <Button kind="quiet" onClick={() => setMemberAction({ id: person.id, confirmRemoval: true })}>Remove member</Button>
                    </>}
                </div>}
              </td>
            </tr>)}</tbody></table></div> : <p className="inst-hint">{community.members.length ? "No members match these filters." : "This community doesn’t have members yet."}</p>}
          </>}
        </div>
      </section>
      <aside className="inst-panel inst-join">
        <header><span className="inst-icon sand"><Inbox size={19} /></span><div><h2>Join requests</h2><small>{community.requests.length} awaiting review</small></div></header>
        {request ? <div className="inst-block">
          <Person person={request.member} /><blockquote>{request.message}</blockquote>
          <div className="inst-actions">{[false, true].map(approve => <Button key={String(approve)} kind={approve ? "primary" : "secondary"} onClick={() => {
            update({ type: "membership", id: community.id, memberId: request.member.id, approve });
            setRequestIndex(0); setMessage(`${request.member.name}’s request was ${approve ? "approved" : "declined"}.`);
          }}>{approve ? "Approve request" : "Decline"}</Button>)}</div>
          {nextRequest && <button type="button" className="inst-task inst-next" onClick={() => setRequestIndex(community.requests.indexOf(nextRequest))}><Face id={nextRequest.member.id} name={nextRequest.member.name} /><span><small>Next request</small><b>{nextRequest.member.name}</b></span><ChevronRight size={16} /></button>}
        </div> : <div className="inst-block"><p className="inst-hint">You’re caught up on requests.</p>{demoJoin && <Button onClick={() => { update({ type: "sample-join", id: community.id }); setRequestIndex(0); }}>Simulate a join request</Button>}</div>}
      </aside>
    </div>
  </>;
}

const sampleTalk: TalkDraft = { title: "Building reliable AI products", date: "2026-12-17", time: "6:00–6:30 PM IST", description: "A practical look at how to take an AI product from prototype to production.", message: "Would you be open to sharing how you take an AI product from prototype to production?" };
const talkLabels = { awaiting: "Awaiting host", accepted: "Ready to publish", published: "Published" };

function EventsWorkspace({ state, update, registeredIds, registrant }: Pick<WorkspaceProps, "state" | "update" | "registeredIds" | "registrant">) {
  const [mode, setMode] = useState<"list" | "new">("list");
  const [id, setId] = useState<string | null>(null);
  const [eventNotice, setEventNotice] = useState("");
  const event = publicInstitutionEvents(state).find(item => item.id === id);
  const talk = state.talks.find(item => item.id === id);
  if (mode === "new") return <>
    <Button kind="quiet" onClick={() => setMode("list")}><ArrowLeft size={16} />Events</Button>
    <Heading title="Invite a distinguished host" description="Propose a talk and track the host response before publishing." />
    <div className="inst-event-grid">
      <form className="inst-panel inst-block inst-form" onSubmit={submit => {
        submit.preventDefault();
        const data = new FormData(submit.currentTarget);
        const draft = { title: String(data.get("title")).trim(), date: String(data.get("date")), time: String(data.get("time")).trim(), message: String(data.get("message")).trim(), description: String(data.get("description")).trim() };
        if (!Object.values(draft).every(Boolean)) { setEventNotice("Fill in the talk details and a message to the host."); return; }
        update({ type: "invite-host", draft }); setId(`institution-talk-${state.talks.length + 1}`); setMode("list"); setEventNotice("Host invitation sent in the demo.");
      }}>
        <div className="inst-host"><Face id={distinguishedAlumnus.id} name={distinguishedAlumnus.name} /><div><b>{distinguishedAlumnus.name}</b><small>{distinguishedAlumnus.role} · Class of {distinguishedAlumnus.batch}</small></div><Chip tone="amber"><Award size={14} />Distinguished alumnus</Chip></div>
        <label>Talk title<input name="title" required maxLength={80} defaultValue={sampleTalk.title} /></label>
        <div className="inst-fields"><label>Proposed date<input name="date" type="date" required defaultValue={sampleTalk.date} /></label><label>Time (IST)<input name="time" required maxLength={32} defaultValue={sampleTalk.time} /></label></div>
        <p className="inst-hint">Format · Online lecture, 30 minutes</p>
        <label>Event description<textarea name="description" required maxLength={400} defaultValue={sampleTalk.description} /></label>
        <label>Message to Dev<textarea name="message" required maxLength={400} defaultValue={sampleTalk.message} /></label>
        {eventNotice && <p className="inst-status warning" role="alert">{eventNotice}</p>}
        <div className="inst-actions"><Button type="submit" kind="primary"><Mail size={17} />Send host invitation</Button></div>
      </form>
      <section className="inst-panel inst-block inst-event-status"><h2>Event status</h2><EventStages stage="draft" /><Button disabled>Publish event</Button><p className="inst-hint">Published talks appear in the alumni Events tab.</p></section>
    </div>
  </>;
  if (event || talk) {
    const attendeeCount = event ? event.attendees.length + Number(registeredIds.includes(event.id)) : 0;
    return <>
      <Button kind="quiet" onClick={() => { setId(null); setEventNotice(""); }}><ArrowLeft size={16} />Events</Button>
      <Heading title={event?.title ?? talk?.title ?? ""} description={eventDateLabel(event?.date ?? talk?.date ?? "", "full")} action={<Chip tone={event ? "green" : "neutral"}>{event ? "Published" : talkLabels[talk!.status]}</Chip>} />
      {eventNotice && <p className="inst-status" role="status">{eventNotice}</p>}
      <div className="inst-event-grid">
        <section className="inst-panel inst-block">
          {event ? <><div className="inst-between"><h2>Registration</h2><Chip tone={event.registrationOpen ? "green" : "neutral"}>{event.registrationOpen ? "Open" : "Closed"}</Chip></div>
            <p className="inst-hint">{attendeeCount} registered · {event.time} · {event.format}</p>
            {attendeeCount > 0 ? <ul className="inst-list">{event.attendees.map(person => <li key={person.id}><b>{person.name}</b><small>Class of {person.batch}</small></li>)}{registeredIds.includes(event.id) && <li><b>{registrant}</b><small>Registered in this session</small></li>}</ul> : <p className="inst-hint">Registered alumni will appear here.</p>}
            <div className="inst-actions"><Button onClick={() => { update({ type: "registration", id: event.id, open: !event.registrationOpen }); setEventNotice(event.registrationOpen ? "Registration closed." : "Registration opened."); }}>{event.registrationOpen ? "Close registration" : "Open registration"}</Button></div>
          </> : <><h2>Host invitation</h2><div className="inst-host"><Face id={distinguishedAlumnus.id} name={distinguishedAlumnus.name} /><div><b>{distinguishedAlumnus.name}</b><small>Distinguished alumnus</small></div></div><p>{talk?.message}</p></>}
        </section>
        <section className="inst-panel inst-block inst-event-status"><h2>Event status</h2><EventStages stage={event ? "published" : talk!.status} />
          {talk?.status === "awaiting" && <Button onClick={() => { update({ type: "host-accept", id: talk.id }); setEventNotice("Dev accepted the invitation in the demo."); }}>Simulate host acceptance</Button>}
          {talk?.status === "accepted" && <Button kind="primary" onClick={() => { update({ type: "publish-talk", id: talk.id }); setEventNotice("Event published to the alumni Events tab."); }}>Publish event</Button>}
          {talk?.status === "awaiting" && <p className="inst-hint">Publication is available after the host accepts.</p>}
        </section>
      </div>
    </>;
  }
  const publicEvents = publicInstitutionEvents(state);
  return <>
    <Heading title="Events" description="Manage host invitations, upcoming events, and registrations." action={<Button kind="primary" onClick={() => { setMode("new"); setEventNotice(""); }}><Mail size={17} />Invite a host</Button>} />
    <section className="inst-panel inst-block"><h2>Events &amp; invitations</h2>
      <div className="inst-table-wrap"><table className="inst-table"><thead><tr><th>Talk or event</th><th>Status</th><th>Action</th></tr></thead><tbody>
        {state.talks.filter(item => item.status !== "published").map(item => <tr key={item.id}><td><b>{item.title}</b><small>{distinguishedAlumnus.name} · {eventDateLabel(item.date, "short")}</small></td><td><Chip>{talkLabels[item.status]}</Chip></td><td><Button onClick={() => setId(item.id)}>View invitation</Button></td></tr>)}
        {publicEvents.map(item => <tr key={item.id}><td><b>{item.title}</b><small>{item.host} · {eventDateLabel(item.date, "short")}</small></td><td><Chip tone="green">Published</Chip></td><td><Button onClick={() => setId(item.id)}>Manage event</Button></td></tr>)}
      </tbody></table></div>
    </section>
  </>;
}

function EventStages({ stage }: { stage: "draft" | "awaiting" | "accepted" | "published" }) {
  const stages = [{ id: "draft", label: "Draft" }, { id: "awaiting", label: "Awaiting host" }, { id: "accepted", label: "Ready to publish" }, { id: "published", label: "Published" }];
  const current = stages.findIndex(item => item.id === stage);
  return <ol className="inst-timeline">{stages.map((item, index) => <li key={item.id} aria-current={index === current ? "step" : undefined} className={index <= current ? "complete" : ""}><span>{index < current ? <Check size={13} /> : index + 1}</span>{item.label}</li>)}</ol>;
}

export default function InstitutionAdmin(props: WorkspaceProps) {
  const [page, setPage] = useState<Page>("overview");
  const [mode, setMode] = useState<"review" | "invites">("review");
  const [communityId, setCommunityId] = useState<string | null>(null);
  const main = useRef<HTMLElement>(null);
  const { state, onExit } = props;
  const pending = Number(state.review.status === "pending") + readyAlumni(state).length + state.communities.reduce((total, community) => total + community.requests.length, 0);
  function open(next: Page, focus: "review" | "invites" = "review", community: string | null = null) {
    setPage(next); setMode(focus); setCommunityId(community); main.current?.focus({ preventScroll: true }); window.scrollTo(0, 0);
  }
  function openMembership() {
    const pendingCommunities = state.communities.filter(community => community.requests.length > 0);
    open("communities", "review", pendingCommunities.length === 1 ? pendingCommunities[0].id : null);
  }
  return <div className="institution-shell">
    <aside className="inst-sidebar">
      <div className="inst-logo"><Layers3 size={25} aria-hidden />alumni<span>.</span></div>
      <div className="inst-account"><span>BP</span><div><b>BITS Pilani</b><small>Institution Admin</small></div></div>
      <nav aria-label="Institution workspace">{navigation.map(({ id, title, icon: Icon }) => <button type="button" key={id} aria-current={page === id ? "page" : undefined} onClick={() => open(id)}><Icon size={17} aria-hidden /><span>{title}</span>{id === "queue" && pending > 0 && <small>{pending}</small>}</button>)}</nav>
      <button type="button" className="inst-exit" onClick={onExit}><ArrowLeft size={16} />Back to walkthroughs</button>
    </aside>
    <div className="inst-workspace">
      <header className="inst-topbar"><span>Institution workspace</span><span>Alumni Relations</span></header>
      <main ref={main} tabIndex={-1} className="inst-content">
        {page === "overview" && <Overview {...props} open={(next, focus) => next === "communities" ? openMembership() : open(next, focus)} />}
        {page === "queue" && <WorkQueue {...props} mode={mode} setMode={setMode} openRecords={() => open("records")} openMembership={openMembership} />}
        {page === "records" && <AlumniRecords {...props} onInvites={() => open("queue", "invites")} />}
        {page === "communities" && <Communities key={communityId ?? "communities"} {...props} initialId={communityId} />}
        {page === "events" && <EventsWorkspace {...props} />}
      </main>
    </div>
  </div>;
}
