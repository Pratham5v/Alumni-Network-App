"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, CircleCheck, ClipboardList, Clock3, Layers3, Mail, Palette, ShieldCheck, Users } from "lucide-react";
import { sampleApplication, workEmailPattern, type Application, type State } from "./registration-model";
import { AdminPanel, AlumniPanel, BrandingPanel, ModulesPanel, SetupPreview, UniversityMark } from "./setup-panels";
import Workspace from "./workspace";
import useWalkthroughHistory from "./use-walkthrough-history";
import styles from "./walkthrough.module.css";

const steps = [
  { label: "Branding", title: "University branding", detail: "Logo, colors, and terminology", Icon: Palette, Panel: BrandingPanel },
  { label: "Modules", title: "Choose your modules", detail: "What alumni can use", Icon: Layers3, Panel: ModulesPanel },
  { label: "Admin team", title: "Set up your admin team", detail: "Roles and invitations", Icon: Users, Panel: AdminPanel },
  { label: "Invite alumni", title: "Invite your first alumni", detail: "Import your first roster", Icon: Mail, Panel: AlumniPanel },
];

function RegistrationForm({ application, editing, onSubmit, cancel }: {
  application: Application;
  editing: boolean;
  onSubmit: (application: Application) => void;
  cancel: () => void;
}) {
  const [draft, setDraft] = useState(application.name ? application : sampleApplication);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = { name: draft.name.trim(), website: draft.website.trim(), email: draft.email.trim().toLowerCase() };
    if (!values.name) return setError("Enter your institution’s official name.");
    try {
      const website = new URL(values.website);
      if (!["http:", "https:"].includes(website.protocol) || !website.hostname.includes(".")) throw new Error("Invalid website");
    } catch { return setError("Enter a full university website address, such as https://university.edu."); }
    if (!workEmailPattern.test(values.email)) return setError("Enter a valid work email.");
    onSubmit(values);
  }

  return <div className={styles.entryGrid}>
    <form className={styles.panel} onSubmit={submit}>
      <h2>Institution details</h2><p>Use the official website and the work email of the first workspace admin.</p>
      <div className={styles.registrationFields}>
        <label className={styles.field}>Institution name<input required autoComplete="organization" maxLength={120} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} placeholder="University name" /></label>
        <label className={styles.field}>University website<input required autoComplete="url" type="url" maxLength={200} value={draft.website} onChange={event => setDraft({ ...draft, website: event.target.value })} placeholder="https://university.edu" /></label>
        <label className={styles.field}>Primary admin’s work email<input required autoComplete="email" type="email" maxLength={254} value={draft.email} onChange={event => setDraft({ ...draft, email: event.target.value })} placeholder="alumni@university.edu" /></label>
        {error && <p role="alert" className={styles.notice}>{error}</p>}
      </div>
      <div className={styles.formActions}>
        {editing ? <button className={styles.textAction} type="button" onClick={cancel}>Cancel</button> : <p className={styles.hint}>{application.name ? "Your previous details are filled in." : "Sample details are filled in. You can edit any field."}</p>}
        <button className={styles.primary} type="submit">{editing ? "Save and resubmit" : "Submit for review"} <ArrowRight size={18} aria-hidden="true" /></button>
      </div>
    </form>
    <aside className={styles.preview}>
      <h2>What we review</h2>
      <ul className={styles.entrySteps}>
        <li><Building2 size={21} aria-hidden="true" /><div><strong>Official institution website</strong><p>Use the university’s own website so the reviewer can confirm which institution is applying.</p></div></li>
        <li><ShieldCheck size={21} aria-hidden="true" /><div><strong>Primary admin’s work email</strong><p>Use the address of the person who will own the workspace and manage admin access.</p></div></li>
      </ul>
      <div className={styles.asideNote}><ClipboardList size={17} aria-hidden="true" /><p>Approval opens setup for branding, modules, admin roles, and alumni invitations.</p></div>
    </aside>
  </div>;
}

function RegistrationStatus({ state, advance, edit }: { state: State; advance: () => void; edit: () => void }) {
  const approved = state.stage === "approved";
  const Icon = approved ? CircleCheck : Clock3;
  return <div className={styles.entryGrid}><section className={styles.panel}>
    <span className={styles.statusIcon} data-tone={approved ? "complete" : "pending"}><Icon size={24} aria-hidden="true" /></span>
    <h2>{approved ? "Your workspace is ready to set up" : "Application details"}</h2>
    {approved && <p>The primary admin can now configure the university’s alumni network.</p>}
    <dl className={styles.mapping}>
      <div><dt>Institution</dt><dd>{state.application.name}</dd></div>
      <div><dt>Website</dt><dd>{state.application.website}</dd></div>
      <div><dt>Primary admin</dt><dd>{state.application.email}</dd></div>
    </dl>
    {approved ? <button className={styles.primary} type="button" onClick={advance}>Start workspace setup <ArrowRight size={18} aria-hidden="true" /></button> :
      <button className={styles.secondary} type="button" onClick={edit}>Edit submission</button>}
  </section>
    <aside className={styles.preview}>
      <p className={styles.kicker}>Application progress</p>
      <h2>{state.application.name}</h2>
      <ol className={styles.reviewTimeline}>
        <li><CircleCheck size={19} aria-hidden="true" /><div><strong>Application submitted</strong><p>Institution details and a primary contact are on file.</p></div></li>
        <li aria-current={approved ? undefined : "step"}>{approved ? <CircleCheck size={19} aria-hidden="true" /> : <Clock3 size={19} aria-hidden="true" />}<div><strong>{approved ? "Platform approval complete" : "Platform review in progress"}</strong><p>Confirm the university website and the primary admin’s work email.</p></div></li>
        <li aria-current={approved ? "step" : undefined}><Palette size={19} aria-hidden="true" /><div><strong>Workspace setup</strong><p>Configure branding, select modules, and invite your first alumni.</p></div></li>
      </ol>
      {!approved && <div className={styles.demoControl}>
        <span className={styles.kicker}>Demo control</span>
        <button className={styles.primary} type="button" onClick={advance}>Simulate platform approval <ArrowRight size={18} aria-hidden="true" /></button>
      </div>}
    </aside>
  </div>;
}

export default function RegistrationWalkthrough() {
  const { state, dispatch, canGoBack, back } = useWalkthroughHistory();
  const heading = useRef<HTMLHeadingElement>(null);
  const screen = state.stage === "workspace"
    ? `${state.stage}:${state.section}:${state.section === "settings" ? state.setting : ""}`
    : `${state.stage}:${state.step}:${state.editing}`;
  const previousScreen = useRef(screen);

  useEffect(() => {
    if (screen !== previousScreen.current) {
      previousScreen.current = screen;
      heading.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [screen]);

  const setup = state.stage === "setup";
  const workspace = state.stage === "workspace";
  const { Panel, title: stepTitle } = steps[state.step];
  const title = {
    apply: state.editing ? "Edit university submission" : "Register your university",
    submitted: "Submitted for review",
    approved: "Registration approved",
    setup: stepTitle,
    workspace: "",
  }[state.stage];
  const description = {
    apply: "Request a workspace for your university’s alumni network.",
    submitted: "Your university’s details are ready for platform review.",
    approved: "Your university can now create its alumni network.",
    setup: "",
    workspace: "",
  }[state.stage];

  return <>
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.headerStart}>
          <Link className="wordmark" href="/universities" aria-label="Alumni for universities"><Layers3 size={25} strokeWidth={1.7} aria-hidden="true" />alumni<span className="wordmark-period">.</span></Link>
          {canGoBack && !setup && !state.editing && <button className={styles.textAction} type="button" onClick={back}><ArrowLeft size={16} aria-hidden="true" />Back</button>}
        </div>
        <span className={styles.headerTitle}>{workspace ? "Institution workspace" : "University setup"}</span>
        <div className={styles.headerActions}>
          {state.application.name ? <span className={styles.headerInstitution}><UniversityMark logo={state.branding.logo} /><strong>{state.application.name}</strong></span> :
            <Link className={styles.headerLink} href="/universities">What we offer</Link>}
          {state.stage !== "apply" && <button className={styles.textAction} type="button" aria-label="Restart walkthrough" onClick={() => {
            if (window.confirm("Restart the demo and clear this workspace’s sample changes?")) dispatch({ type: "restart" });
          }}>Restart</button>}
        </div>
      </div>
    </header>
    <main>
      {!workspace && <div className={setup ? styles.stepBand : styles.heroBand}>
        <div className={styles.container + " " + styles.masthead}>
          <div>
            <p className={styles.kicker}>{setup ? `Workspace setup · Step ${state.step + 1} of ${steps.length}` : "For universities"}</p>
            <h1 ref={heading} tabIndex={-1}>{title}</h1>
            {description && <p>{description}</p>}
          </div>
        </div>
      </div>}
      <div className={styles.container + " " + styles.content}>

      {state.stage === "apply" && <RegistrationForm application={state.application} editing={state.editing} onSubmit={application => dispatch({ type: "submit", application })} cancel={back} />}
      {(state.stage === "submitted" || state.stage === "approved") && <RegistrationStatus state={state} advance={() => dispatch({ type: state.stage === "approved" ? "start" : "approve" })} edit={() => dispatch({ type: "edit-submission" })} />}

      {setup && <>
        <div className={styles.setupGrid}>
          <nav className={styles.rail} aria-label="Setup steps">
            <p className={styles.kicker}>Setup progress</p>
            <ol>
              {steps.map(({ label, detail, Icon }, index) => {
                const completed = state.completedSteps.includes(index);
                return <li key={label}>
                  <button className={styles.railStep} type="button" aria-current={index === state.step ? "step" : undefined}
                    onClick={() => dispatch({ type: "select-step", step: index })}>
                    {completed ? <CircleCheck size={20} role="img" aria-label="Complete" /> : <Icon size={20} aria-hidden="true" />}
                    <span><strong>{label}</strong><small>{detail}</small></span>
                  </button>
                </li>;
              })}
            </ol>
          </nav>
          <section className={styles.panel + " " + styles.taskPanel} aria-label={steps[state.step].label}>
            <Panel state={state} dispatch={dispatch} />
            <div className={styles.setupActions}>
              <button type="button" className={styles.textAction} onClick={back}><ArrowLeft size={17} aria-hidden="true" />Back</button>
              <button type="button" className={styles.primary} onClick={() => dispatch({ type: "continue" })}>
                {state.step === 3 ? "Open workspace" : "Save and continue"} <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          </section>
          <SetupPreview state={state} />
        </div>
      </>}

      {workspace && <Workspace state={state} dispatch={dispatch} headingRef={heading} />}
      </div>
    </main>
  </>;
}
