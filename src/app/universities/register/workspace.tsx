"use client";

import { useState, type FormEvent, type RefObject } from "react";
import { ArrowRight, BarChart3, CircleCheck, Database, Globe, Heart, LayoutDashboard, Settings2, ClipboardList, Mail } from "lucide-react";
import { domainPattern, moduleIds, moduleLabels, type WorkspaceSetting } from "./registration-model";
import { AdminPanel, AlumniPanel, BrandingPanel, ModulesPanel, SetupPreview, type PanelProps } from "./setup-panels";
import Analytics from "./analytics";
import styles from "./walkthrough.module.css";

const sections = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "settings", label: "Workspace settings", Icon: Settings2 },
  { id: "analytics", label: "Analytics", Icon: BarChart3 },
] as const;

const settingGroups = [
  { name: "Branding & access", items: [{ id: "branding", label: "Branding" }, { id: "admins", label: "Admin team" }] },
  { name: "Alumni operations", items: [{ id: "modules", label: "Modules" }, { id: "roster", label: "Alumni invitations" }] },
  { name: "Integrations", items: [{ id: "crm", label: "CRM sync" }, { id: "gateway", label: "Donation gateway" }, { id: "domain", label: "Custom domain" }] },
] as const;
const settings = settingGroups.flatMap(group => [...group.items]);
function CRM({ state, dispatch }: PanelProps) {
  const [provider, setProvider] = useState(state.crm?.provider ?? "Salesforce");
  return <>
    <h2>CRM sync</h2><p>Preview which alumni fields would sync from your institution’s CRM.</p>
    <div className={styles.integrationFields}>
      <label className={styles.field}>CRM provider<select value={provider} onChange={event => setProvider(event.target.value)}>
        <option>Salesforce</option><option>HubSpot</option><option>Other CRM</option>
      </select></label>
      <button className={styles.secondary} type="button" onClick={() => dispatch({ type: "connect-crm", value: provider })}>Connect sample CRM</button>
    </div>
    {state.crm && <>
      <p className={styles.domainStatus} role="status"><strong>{state.crm.provider}</strong><span className={styles.badge} data-tone={state.crm.status === "synced" ? "complete" : "pending"}>{state.crm.status === "synced" ? "Sample sync complete" : "Ready to sync"}</span></p>
      <dl className={styles.mapping}>{[["Full name", "Name"], ["Email address", "Email"], ["Graduation year", "Graduation year"], ["Department", "Branch"]].map(([from, to]) =>
        <div key={from}><dt>{from}</dt><dd><ArrowRight size={14} aria-hidden="true" />{to}</dd></div>
      )}</dl>
      {state.crm.status === "synced" && <dl className={styles.metrics} aria-label="Sample sync result"><div><dt>Records previewed</dt><dd>24</dd></div><div><dt>Ready to import</dt><dd>22</dd></div><div><dt>Need review</dt><dd>2</dd></div></dl>}
      <button className={styles.secondary} type="button" onClick={() => dispatch({ type: "sync-crm" })}>{state.crm.status === "synced" ? "Run sample sync again" : "Run sample sync"}</button>
    </>}
  </>;
}

function Gateway({ state, dispatch, openModules }: PanelProps & { openModules: () => void }) {
  const [provider, setProvider] = useState(state.gateway || "Razorpay");
  return <>
    <h2>Donation gateway</h2><p>Choose how the university would receive contributions to its campaigns.</p>
    {!state.modules.fundraising ? <>
      <p className={styles.notice}>Enable Fundraising in Modules to set up a gateway.</p>
      <button type="button" className={styles.secondary} onClick={openModules}>Open module settings <ArrowRight size={16} aria-hidden="true" /></button>
    </> : <>
      <div className={styles.integrationFields}>
        <label className={styles.field}>Gateway provider<select value={provider} onChange={event => setProvider(event.target.value)}><option>Razorpay</option><option>Stripe</option></select></label>
        <button type="button" className={styles.secondary} onClick={() => dispatch({ type: "gateway", value: provider })}>Connect demo gateway</button>
      </div>
      {state.gateway && <p className={styles.domainStatus} role="status"><strong>{state.gateway}</strong><span className={styles.badge}>Demo gateway connected</span></p>}
      <p>Sample configuration. No payment credentials or transactions are used.</p>
    </>}
  </>;
}

function Domain({ state, dispatch }: PanelProps) {
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(`${label} copied.`);
    } catch {
      setCopyStatus("Copy is unavailable. Select the DNS value to copy it manually.");
    }
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const domain = String(new FormData(event.currentTarget).get("domain")).trim().toLowerCase().replace(/\.$/, "");
    if (!domainPattern.test(domain)) { setError("Enter a domain such as alumni.university.edu, without https:// or a path."); return; }
    setError("");
    setCopyStatus("");
    dispatch({ type: "domain", value: domain });
  }
  return <>
    <h2>Custom domain</h2><p>Preview how your IT team would connect a university web address.</p>
    <form className={styles.integrationFields} onSubmit={save}>
      <label className={styles.field}>Alumni domain<input name="domain" required defaultValue={state.domain || `alumni.${new URL(state.application.website).hostname.replace(/^www\./, "")}`} placeholder="alumni.university.edu" /></label>
      <button className={styles.secondary} type="submit">Generate demo DNS instructions</button>
    </form>
    {error && <p role="alert" className={styles.notice}>{error}</p>}
    {state.domain && <>
      <p className={styles.domainStatus} role="status"><strong>{state.domain}</strong><span className={styles.badge} data-tone="pending">Pending verification</span></p>
      <dl className={styles.mapping}>{[["Type", "CNAME"], ["Host", state.domain], ["Example target", "domains.alumni.example"]].map(([label, value]) => (
        <div key={label}><dt>{label}</dt><dd className={styles.dnsValue}><code>{value}</code><button className={styles.textAction} type="button" aria-label={`Copy ${label.toLowerCase()}`} onClick={() => void copy(value, label)}>Copy</button></dd></div>
      ))}</dl>
      {copyStatus && <p role="status" className={styles.notice}>{copyStatus}</p>}
      <p>These records are examples for the walkthrough.</p>
    </>}
  </>;
}

const integrationDetails = {
  crm: { label: "Records and mapping", title: "Review what will sync", text: "Match CRM fields to alumni records before starting a sync.", items: ["Name and alumni email", "Graduation year and department", "Sample sync status and record count"] },
  gateway: { label: "Fundraising & payments", title: "Prepare to accept donations", text: "A connected gateway would handle contributions to published campaigns.", items: ["Fundraising module enabled", "Payment provider selected", "Test connection confirmed"] },
  domain: { label: "University web address", title: "Hand off to your IT team", text: "Share the DNS record with whoever manages your university’s domain.", items: ["Choose an alumni subdomain", "Create the CNAME record", "Verify the domain before going live"] },
};

export default function Workspace(props: PanelProps & { headingRef: RefObject<HTMLHeadingElement | null> }) {
  const { state, dispatch } = props;
  const { section, setting, reviewOnOpen } = state;
  const reviewCount = state.roster.filter(row => row.status === "review").length;
  const readyCount = state.roster.filter(row => row.status === "ready").length;
  const invitedCount = state.roster.filter(row => row.status === "invited").length;

  function openSetting(id: WorkspaceSetting, review = false) {
    dispatch({ type: "open-setting", setting: id, review });
  }
  const counts = [
    ["Alumni invited", invitedCount],
    ["Ready to invite", readyCount],
    ["Records to review", reviewCount],
  ];
  const integrationLinks = [
    { id: "crm", title: "CRM sync", Icon: Database, status: state.crm ? state.crm.status === "synced" ? "Sample sync complete" : "Sample connected" : "Set up record syncing" },
    { id: "gateway", title: "Donation gateway", Icon: Heart, status: !state.modules.fundraising ? "Fundraising is disabled" : state.gateway || "Set up donations" },
    { id: "domain", title: "Custom domain", Icon: Globe, status: state.domain ? "Pending verification" : "Use your university’s domain" },
  ] as const;

  const activeModules = moduleIds.filter(id => state.modules[id]);
  const setupSetting = (["branding", "modules", "admins", "roster"] as const).findIndex(id => id === setting);
  const integration = setting === "crm" || setting === "gateway" || setting === "domain" ? integrationDetails[setting] : null;

  return <>
    <div className={styles.workspaceBar}>
      <h1 id="workspace-section-heading" ref={props.headingRef} tabIndex={-1}>{section === "analytics" ? "Network analytics" : sections.find(item => item.id === section)?.label}</h1>
      <nav className={styles.workspaceNav} aria-label="Workspace sections">
        {sections.map(({ id, label, Icon }) => <button type="button" key={id} aria-pressed={section === id} onClick={() => dispatch({ type: "select-section", section: id })}><Icon size={17} aria-hidden="true" />{label}</button>)}
      </nav>
    </div>

    {section === "overview" && <div className={styles.dashboardGrid}>
      {reviewCount > 0 ? <section className={styles.attention}>
        <div><span className={styles.badge} data-tone="review">Needs attention</span><h2>{reviewCount} {reviewCount === 1 ? "record needs review" : "records need review"}</h2><p>Resolve missing details before sending these alumni an invitation.</p></div>
        <button className={styles.secondary} type="button" onClick={() => openSetting("roster", true)}>Review flagged records <ArrowRight size={16} aria-hidden="true" /></button>
      </section> : readyCount > 0 ? <section className={styles.attention}>
        <div><span className={styles.badge} data-tone="pending">Ready to invite</span><h2>{readyCount} {readyCount === 1 ? "alumnus is ready" : "alumni are ready"}</h2><p>Review the ready list and send the next batch.</p></div>
        <button className={styles.secondary} type="button" onClick={() => openSetting("roster")}>Open invitations <ArrowRight size={16} aria-hidden="true" /></button>
      </section> : null}
      <section className={styles.panel}>
        <span className={styles.badge}><CircleCheck size={15} aria-hidden="true" /> Setup complete</span>
        <h2>Launch summary</h2><p>Progress from your first alumni roster in this walkthrough.</p>
        <dl className={styles.metrics}>{counts.map(([label, count]) => <div key={label}><dt>{label}</dt><dd>{count}</dd></div>)}</dl>
        <button className={styles.secondary} type="button" onClick={() => openSetting("roster")}>Manage alumni invitations <ArrowRight size={16} aria-hidden="true" /></button>
      </section>
      <section className={styles.panel}><h2>Connect your systems</h2><p>Set up integrations when your university is ready.</p>
        <div className={styles.rows}>{integrationLinks.map(({ id, title, Icon, status }) => (
          <button type="button" className={styles.integrationLink} key={id} onClick={() => openSetting(id)}><Icon size={18} aria-hidden="true" /><span><strong>{title}</strong><small>{status}</small></span><ArrowRight size={16} aria-hidden="true" /></button>
        ))}</div>
      </section>
      <section className={styles.panel}>
        <h2>Workspace configuration</h2><p>Settings currently applied to your university’s alumni experience.</p>
        <dl className={styles.mapping}>
          <div><dt>Graduation terminology</dt><dd>{state.branding.terminology}</dd></div>
          <div><dt>Enabled modules</dt><dd>{activeModules.length ? activeModules.map(id => moduleLabels[id]).join(", ") : "Core network only"}</dd></div>
          <div><dt>Admin access</dt><dd>1 owner · {state.admins.length} {state.admins.length === 1 ? "invitation" : "invitations"}</dd></div>
        </dl>
        <button className={styles.secondary} type="button" onClick={() => openSetting("modules")}>Manage workspace settings <ArrowRight size={16} aria-hidden="true" /></button>
      </section>
      <section className={styles.panel}>
        <h2>Alumni rollout</h2><p>Recent records from your walkthrough.</p>
        <div className={styles.rows}>
          {state.roster.length ? state.roster.map((row, index) => <div key={index} className={styles.memberRow}>
            <div><strong>{row.name}</strong><p>{row.issue ?? row.email}</p></div>
            <span className={styles.badge} data-tone={row.status === "review" ? "review" : row.status === "ready" ? "pending" : "complete"}>{row.status === "invited" ? "Invited" : row.status === "review" ? "Needs review" : "Ready"}</span>
          </div>) : <div className={styles.asideNote}><Mail size={17} aria-hidden="true" /><p>Import a sample roster to start inviting alumni.</p></div>}
        </div>
        <button className={styles.secondary} type="button" onClick={() => dispatch({ type: "select-section", section: "analytics" })}>View sample analytics <ArrowRight size={16} aria-hidden="true" /></button>
      </section>
    </div>}

    {section === "settings" && <div className={styles.settingsGrid}>
      <nav className={styles.settingsNav} aria-label="Workspace settings">
        {settingGroups.map(group => <div className={styles.settingsGroup} key={group.name}>
          <p className={styles.kicker}>{group.name}</p>
          {group.items.map(({ id, label }) => <button type="button" key={id} aria-pressed={setting === id} onClick={() => openSetting(id)}>{label}</button>)}
        </div>)}
      </nav>
      <section className={styles.panel} aria-label={settings.find(item => item.id === setting)?.label}>
        {setting === "crm" && <CRM {...props} />}
        {setting === "gateway" && <Gateway {...props} openModules={() => openSetting("modules")} />}
        {setting === "domain" && <Domain {...props} />}
        {setting === "branding" && <BrandingPanel {...props} />}
        {setting === "modules" && <ModulesPanel {...props} />}
        {setting === "admins" && <AdminPanel {...props} />}
        {setting === "roster" && <AlumniPanel key={String(reviewOnOpen)} {...props} reviewOnOpen={reviewOnOpen} />}
      </section>
      {setupSetting >= 0 && <SetupPreview state={state} step={setupSetting} />}
      {integration && <aside className={styles.preview}>
        <p className={styles.kicker}>{integration.label}</p>
        <h2>{integration.title}</h2><p>{integration.text}</p>
        <ul className={styles.accessList}>{integration.items.map(item => <li key={item}><ClipboardList size={17} aria-hidden="true" /><span>{item}</span></li>)}</ul>
      </aside>}
    </div>}

    {section === "analytics" && <Analytics />}
  </>;
}
