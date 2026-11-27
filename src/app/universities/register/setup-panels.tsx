"use client";

import { useRef, useState, type Dispatch, type FormEvent } from "react";
import Image from "next/image";
import { Building2, CalendarDays, Clock3, Heart, Mail, Users, BriefcaseBusiness, ShieldCheck, ChartNoAxesCombined, CircleCheck, ClipboardList } from "lucide-react";
import { previewAlumniBatch, sampleBatchCsv } from "@/lib/institution";
import { graduationLabels, moduleIds, moduleLabels, roles, workEmailPattern, type Action, type InviteRole, type State } from "./registration-model";
import styles from "./walkthrough.module.css";

export type PanelProps = { state: State; dispatch: Dispatch<Action> };

export function UniversityMark({ logo, size = 36 }: { logo: string; size?: number }) {
  return <span className={styles.mark} style={{ width: size, height: size }}>
    {logo ? <Image src={logo} alt="" width={size} height={size} unoptimized /> : <Building2 size={20} aria-hidden="true" />}
  </span>;
}

function BrandColor({ label, value, change }: { label: string; value: string; change: (hex: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  return <div className={styles.field}>
    <strong>{label}</strong>
    <div className={styles.colorField}>
      <input type="color" aria-label={`${label} picker`} value={value} onChange={event => {
        setDraft(null);
        change(event.target.value.toUpperCase());
      }} />
      <input type="text" aria-label={`${label} hex value`} value={draft ?? value} maxLength={7} spellCheck={false} onChange={event => {
        const entered = event.target.value.toUpperCase();
        setDraft(entered);
        if (/^#?[0-9A-F]{6}$/.test(entered)) change(entered.startsWith("#") ? entered : `#${entered}`);
      }} onBlur={() => setDraft(null)} />
    </div>
  </div>;
}

export function BrandingPanel({ state, dispatch }: PanelProps) {
  const { branding } = state;
  const [notice, setNotice] = useState("");
  const uploadVersion = useRef(0);

  function upload(file: File | undefined) {
    const version = ++uploadVersion.current;
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 300_000) {
      setNotice("Choose a PNG, JPEG, or WebP file under 300 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (uploadVersion.current !== version || typeof reader.result !== "string") return;
      // Apply only the logo so a color change made while reading the file survives.
      dispatch({ type: "branding", branding: { logo: reader.result } });
      setNotice("Logo updated.");
    };
    reader.onerror = () => { if (uploadVersion.current === version) setNotice("The logo could not be read."); };
    reader.readAsDataURL(file);
  }

  return <>
    <h2>University branding</h2>
    <p>These details appear in the alumni app and your invitations.</p>
    <hr />
    <div className={styles.fields}>
      <div>
        <strong>University logo</strong>
        <div className={styles.logoRow}>
          <UniversityMark logo={branding.logo} />
          <div><strong>{state.application.name}</strong><p>{branding.logo ? "Custom logo" : "Default university mark"}</p></div>
          <label className={styles.uploadButton}>Replace logo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => upload(event.currentTarget.files?.[0])} /></label>
        </div>
        {notice && <p role="status">{notice}</p>}
      </div>
      <div className={styles.twoFields}>
        <BrandColor label="Primary color" value={branding.primary} change={primary => dispatch({ type: "branding", branding: { primary } })} />
        <BrandColor label="Accent color" value={branding.accent} change={accent => dispatch({ type: "branding", branding: { accent } })} />
      </div>
      <label className={styles.field}>Graduation terminology
        <select value={branding.terminology} onChange={event => dispatch({ type: "branding", branding: { terminology: event.target.value as State["branding"]["terminology"] } })}>
          {graduationLabels.map(label => <option key={label}>{label}</option>)}
        </select>
        <small>This label appears in profiles and alumni records.</small>
      </label>
    </div>
  </>;
}

const moduleInfo = {
  events: { Icon: CalendarDays, text: "Publish events and take registrations." },
  communities: { Icon: Users, text: "Create groups and manage membership." },
  jobs: { Icon: BriefcaseBusiness, text: "Share opportunities and handle referrals." },
  fundraising: { Icon: Heart, text: "Run campaigns and accept donations." },
};

export function ModulesPanel({ state, dispatch }: PanelProps) {
  return <>
    <h2>Choose your modules</h2>
    <p>Enable the features you want alumni to see in Explore.</p>
    <div className={styles.rows}>
      {moduleIds.map(id => {
        const { Icon, text } = moduleInfo[id];
        return <div key={id} className={styles.moduleRow}>
          <Icon size={20} aria-hidden="true" />
          <div><strong>{moduleLabels[id]}</strong><p>{text}</p></div>
          <button className={styles.switch} type="button" role="switch" aria-label={moduleLabels[id]} aria-checked={state.modules[id]} onClick={() => dispatch({ type: "module", module: id })}><span /></button>
        </div>;
      })}
    </div>
  </>;
}

export function AdminPanel({ state, dispatch }: PanelProps) {
  const [role, setRole] = useState<InviteRole>("Alumni relations admin");
  const [notice, setNotice] = useState("");

  function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email")).trim().toLowerCase();
    if (!workEmailPattern.test(email)) return setNotice("Enter a valid work email.");
    if (state.application.email === email || state.admins.some(admin => admin.email === email)) return setNotice("This person already has access or an invitation.");
    dispatch({ type: "invite-admin", email, role });
    form.reset();
    setNotice("Demo invitation created.");
  }

  return <>
    <h2>Set up your admin team</h2>
    <p>Invite a teammate now or continue with just the workspace owner.</p>
    <div className={styles.rows}>
      <div className={styles.memberRow}><div><strong>{state.application.email}</strong><p>Workspace owner</p></div><span className={styles.badge}>Active</span></div>
      {state.admins.map(admin => <div className={styles.memberRow} key={admin.email}><div><strong>{admin.email}</strong><p>{admin.role}</p></div><span className={styles.badge} data-tone="pending">Invited</span></div>)}
    </div>
    <form className={styles.fields} onSubmit={invite}>
      <label className={styles.field}>Teammate’s work email<input name="email" type="email" required defaultValue={state.admins.length ? "" : "ananya@westbridge.example"} placeholder="colleague@university.edu" /></label>
      <label className={styles.field}>Role<select value={role} onChange={event => setRole(event.target.value as InviteRole)}>
        {Object.keys(roles).map(label => <option key={label}>{label}</option>)}
      </select></label>
      <div className={styles.roleSummary}><ShieldCheck size={17} aria-hidden="true" /><div><strong>What this role can do</strong><p>{roles[role]}</p></div></div>
      <button type="submit" className={styles.secondary}><Mail size={16} aria-hidden="true" /> Invite admin</button>
      {notice && <p role="status">{notice}</p>}
    </form>
  </>;
}

export function AlumniPanel({ state, dispatch, reviewOnOpen = false }: PanelProps & { reviewOnOpen?: boolean }) {
  const [notice, setNotice] = useState("");
  const [reviewIndex, setReviewIndex] = useState(() => reviewOnOpen ? state.roster.findIndex(row => row.status === "review") : -1);
  const recordInReview = state.roster[reviewIndex];
  const ready = state.roster.filter(row => row.status === "ready").length;
  const invited = state.roster.filter(row => row.status === "invited").length;
  const review = state.roster.filter(row => row.status === "review").length;

  function fixEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!recordInReview) return;
    const email = String(new FormData(event.currentTarget).get("email")).trim().toLowerCase();
    if (!workEmailPattern.test(email) || state.roster.some(row => row.email === email)) {
      setNotice("Enter a valid email that isn’t already in the roster.");
      return;
    }
    dispatch({ type: "fix-email", index: reviewIndex, email });
    setReviewIndex(-1);
    setNotice("Record is ready to invite.");
  }

  return <>
    <h2>Invite your first alumni</h2>
    <p>Import a sample roster, review an exception, and invite the eligible alumni.</p>
    {!state.roster.length ? <div className={styles.uploadBox}>
      <strong>Class of 2026 sample roster</strong>
      <p>Three records, including one with a missing email.</p>
      <button className={styles.secondary} type="button" onClick={() => {
        dispatch({ type: "load-roster", rows: previewAlumniBatch(sampleBatchCsv, []) });
        setNotice("Sample roster imported.");
      }}>Import sample roster</button>
    </div> : <>
      <div className={styles.rosterToolbar}>
        <p>{invited} invited · {ready} ready · {review} need review</p>
        {ready > 0 && <button className={styles.secondary} type="button" onClick={() => {
          dispatch({ type: "invite-alumni" });
          setNotice(`${ready} alumni invitation${ready === 1 ? "" : "s"} created in the demo.`);
        }}><Mail size={16} aria-hidden="true" /> Invite {ready} eligible</button>}
      </div>
      <div className={styles.tableFrame}>
        <table className={styles.rosterTable}>
          <thead><tr><th scope="col">Name</th><th scope="col">Year</th><th scope="col">Email</th><th scope="col">Status</th></tr></thead>
          <tbody>{state.roster.map((row, index) => <tr key={index} className={reviewIndex === index ? styles.selectedRow : undefined}>
            <th scope="row">{row.name}</th><td>{row.batch}</td><td>{row.email || <span className={styles.missing}>Missing email</span>}</td>
            <td>{row.status === "review" ? <button className={styles.reviewButton} type="button" onClick={() => { setNotice(""); setReviewIndex(reviewIndex === index ? -1 : index); }} aria-expanded={reviewIndex === index} aria-controls="roster-review">Review</button> :
              <span className={styles.badge} data-tone={row.status === "ready" ? "pending" : "complete"}>{row.status === "invited" ? "Invited" : "Ready to invite"}</span>}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {recordInReview && <form id="roster-review" className={styles.rosterReview} onSubmit={fixEmail}>
        <div><span className={styles.badge} data-tone="review">Needs review</span><h3>{recordInReview.name}</h3><p>{recordInReview.issue}</p></div>
        <label className={styles.field}>Alumni email<input key={reviewIndex} autoComplete="off" type="email" name="email" defaultValue={recordInReview.email || "tara@example.com"} required /></label>
        <div className={styles.reviewActions}><button className={styles.textAction} type="button" onClick={() => setReviewIndex(-1)}>Cancel</button><button className={styles.secondary} type="submit">Save record</button></div>
      </form>}
    </>}
    {notice && <p className={styles.notice} role="status">{notice}</p>}
  </>;
}

export function SetupPreview({ state, step = state.step }: { state: State; step?: number }) {
  if (step < 2) return <AlumniPreview state={state} showModules={step === 1} />;

  const roster = step === 3;
  return <aside className={styles.preview}>
    <p className={styles.kicker}>{roster ? "Invitation preview" : "Workspace access"}</p>
    <h2>{roster ? "What graduates receive" : "Who can do what"}</h2>
    {roster ? <>
      <div className={styles.invitePreview}>
        <UniversityMark logo={state.branding.logo} />
        <div><strong>{state.application.name}</strong><p>To: Kavya Menon · Sample invitation</p></div>
        <hr />
        <strong>You’re invited to join your alumni network</strong>
        <p>Verify your profile and connect with graduates from your university.</p>
      </div>
      <div className={styles.asideNote}><ClipboardList size={18} aria-hidden="true" /><p>Fix missing details before inviting a record. Any records still flagged stay in the review queue.</p></div>
    </> : <ul className={styles.accessList}>
      <li><ShieldCheck size={19} aria-hidden="true" /><div><strong>Workspace owner</strong><p>Manage workspace settings, integrations, and admin access.</p></div></li>
      <li><Users size={19} aria-hidden="true" /><div><strong>Alumni relations admin</strong><p>{roles["Alumni relations admin"]}</p></div></li>
      <li><ChartNoAxesCombined size={19} aria-hidden="true" /><div><strong>Analyst</strong><p>{roles.Analyst}</p></div></li>
    </ul>}
  </aside>;
}

export function AlumniPreview({ state, showModules }: { state: State; showModules: boolean }) {
  const { branding } = state;
  const enabled = moduleIds.filter(id => state.modules[id]);
  const color = branding.primary.slice(1);
  const channels = color.match(/../g)?.map(channel => parseInt(channel, 16) / 255) ?? [0, 0, 0];
  const luminance = channels.map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
  const titleColor = luminance[0] * .2126 + luminance[1] * .7152 + luminance[2] * .0722 > .179 ? "#141c17" : "#fff";

  return <aside className={styles.preview} aria-label="Alumni preview">
    <p className={styles.kicker}>Alumni preview</p>
    <h2>{showModules ? "What alumni can explore" : "Your branded network"}</h2>
    <p>See changes here as you make them.</p>
    <div className={styles.previewApp}>
      <div className={styles.previewHeader} style={{ backgroundColor: branding.primary, color: titleColor }}>
        <UniversityMark logo={branding.logo} size={31} /><strong>{state.application.name} Alumni</strong><span className={styles.previewTab} style={{ borderColor: branding.accent }}>Home</span>
      </div>
      <div className={styles.previewBody}>
        {showModules ? <>
          <p className={styles.kicker}>Available in your network</p>
          <h3>Explore</h3>
          {enabled.length ? <ul className={styles.previewModules}>{enabled.map(id => {
            const { Icon } = moduleInfo[id];
            return <li key={id}><span className={styles.tileIcon} data-tile={id}><Icon size={18} aria-hidden="true" /></span><strong>{moduleLabels[id]}</strong></li>;
          })}</ul> : <p>When modules are enabled, they appear here.</p>}
          {enabled.length > 0 && <p className={styles.commitment}><CircleCheck size={14} aria-hidden="true" />{enabled.length} enabled {enabled.length === 1 ? "module" : "modules"}</p>}
        </> : <>
          <p className={styles.kicker}>Your alumni network</p>
          <h3>Welcome, Prathmesh</h3>
          <p>{branding.terminology} 2026</p>
          <div className={styles.intent}>
            <p className={styles.kicker}>Alumni intent</p>
            <strong>Feedback on my startup idea</strong>
            <hr />
            <div className={styles.person}><Image src="/avatars/aarav.svg" alt="" width={36} height={36} /><div><strong>Aarav Shah</strong><p>Product Manager</p></div></div>
            <p className={styles.commitment}><Clock3 size={14} aria-hidden="true" />20-minute call</p>
          </div>
        </>}
      </div>
    </div>
  </aside>;
}
