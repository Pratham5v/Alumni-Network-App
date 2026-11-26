"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { Building2, CalendarDays, ChartNoAxesCombined, Database, Globe, HeartHandshake, LayoutDashboard, Mail, MessageCircle, Send, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";
import styles from "../universities.module.css";

const audiences = [
  {
    id: "alumni", label: "Alumni", Icon: Users, heading: "Find the right people when you need them",
    benefits: [
      { Icon: Users, title: "Find alumni who can help", text: "Share what you need and discover verified alumni open to helping." },
      { Icon: MessageCircle, title: "Make a clear request", text: "Give the other person context, agree on a next step, and record the outcome." },
      { Icon: Building2, title: "Switch between university networks", text: "Use one account for your verified university memberships." },
      { Icon: CalendarDays, title: "Take part in university life", text: "Find events, communities, jobs, and causes where your university enables them." },
    ],
  },
  {
    id: "relations", label: "Alumni relations team", Icon: Building2, heading: "Run your alumni network",
    benefits: [
      { Icon: ShieldCheck, title: "Verify and invite graduates", text: "Import alumni records, review exceptions, and send batch invitations." },
      { Icon: Send, title: "Reach the right alumni", text: "Send targeted outreach by batch, department, or location." },
      { Icon: ChartNoAxesCombined, title: "See where alumni get value", text: "Track engagement, event participation, requests, and reported outcomes." },
      { Icon: SlidersHorizontal, title: "Choose what your network offers", text: "Enable jobs, events, communities, and fundraising, and configure a donation gateway." },
    ],
  },
  {
    id: "administration", label: "IT & administration", Icon: ShieldCheck, heading: "Configure the network for your university",
    benefits: [
      { Icon: Globe, title: "Use your own brand and domain", text: "Set the logo, colors, and terminology, and route users through your university’s custom domain." },
      { Icon: Mail, title: "Send from a university email domain", text: "Configure a branded sender and verify it with SPF and DKIM." },
      { Icon: ShieldCheck, title: "Choose who can manage the network", text: "Assign institution roles and control access to university records." },
      { Icon: Database, title: "Connect your existing systems", text: "Sync alumni records with your CRM and discuss any dedicated hosting requirements." },
    ],
  },
] as const;

const recordRows = [
  { name: "Aarav Shah", avatar: "aarav", batch: "2018", status: "Verified" },
  { name: "Riya Patel", avatar: "riya", batch: "2024", status: "Needs review" },
  { name: "Neha Rao", avatar: "neha", batch: "2016", status: "Verified" },
];

function AudiencePreview({ audience }: { audience: (typeof audiences)[number]["id"] }) {
  return (
    <figure className={styles.preview}>
      <figcaption><span><LayoutDashboard size={15} aria-hidden="true" />{audience === "alumni" ? "Alumni workspace" : "Institution workspace"}</span><small>Sample</small></figcaption>
      {audience === "relations" ? (
        <div className={styles.recordsLayout}>
          <ul className={styles.previewNav} aria-label="Sample workspace sections">
            {[{ Icon: LayoutDashboard, label: "Overview" }, { Icon: Users, label: "Alumni records" }, { Icon: ShieldCheck, label: "Verification" }, { Icon: CalendarDays, label: "Events" }, { Icon: HeartHandshake, label: "Fundraising" }].map(({ Icon, label }) =>
              <li key={label} className={label === "Alumni records" ? styles.previewSelected : undefined}><Icon size={14} aria-hidden="true" />{label}</li>
            )}
          </ul>
          <div className={styles.previewBody}>
            <h3>Alumni records</h3><p>Review and invite alumni to your network.</p>
            <table>
              <thead><tr><th scope="col">Name</th><th scope="col">Class of</th><th scope="col">Status</th></tr></thead>
              <tbody>{recordRows.map(({ name, avatar, batch, status }) => (
                <tr key={name}><td><span className={styles.recordPerson}><Image src={`/avatars/${avatar}.svg`} alt="" width={28} height={28} />{name}</span></td><td>{batch}</td><td><span className={status === "Verified" ? styles.verified : styles.review}>{status}</span></td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      ) : audience === "alumni" ? (
        <div className={styles.previewBody + " " + styles.alternatePreview}>
          <h3>My university networks</h3><p>Switch between your verified memberships.</p>
          <dl><div><dt>BITS Pilani</dt><dd>Current network</dd></div><div><dt>Westbridge University</dt><dd>Verified</dd></div></dl>
        </div>
      ) : (
        <div className={styles.previewBody + " " + styles.alternatePreview}>
          <h3>Workspace settings</h3><p>Manage your university’s branding, access, and integrations.</p>
          <dl><div><dt>Custom domain</dt><dd>alumni.westbridge.example</dd></div><div><dt>Admin access</dt><dd>University roles</dd></div><div><dt>CRM records</dt><dd>Sync settings</dd></div></dl>
        </div>
      )}
    </figure>
  );
}

export default function OfferAudience() {
  const [selected, setSelected] = useState(1);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const audience = audiences[selected];

  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = audiences.length - 1;
    const next = {
      ArrowLeft: index === 0 ? last : index - 1,
      ArrowRight: index === last ? 0 : index + 1,
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setSelected(next);
    buttons.current[next]?.focus();
  }

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label="Who the platform is for">
        {audiences.map(({ id, label, Icon }, index) => (
          <button type="button" key={id} ref={node => { buttons.current[index] = node; }} id={`offer-tab-${id}`} role="tab" aria-selected={selected === index} aria-controls={`offer-panel-${id}`} tabIndex={selected === index ? 0 : -1} onClick={() => setSelected(index)} onKeyDown={event => navigateTabs(event, index)}>
            <Icon size={18} aria-hidden="true" />{label}
          </button>
        ))}
      </div>
      {audiences.map(({ id, heading, benefits }) => (
        <div key={id} id={`offer-panel-${id}`} role="tabpanel" aria-labelledby={`offer-tab-${id}`} hidden={audience.id !== id} tabIndex={0} className={styles.audiencePanel}>
          <div>
            <h2>{heading}</h2>
            <ul className={styles.benefits}>{benefits.map(({ Icon, title, text }) => (
              <li key={title}><Icon size={21} aria-hidden="true" /><div><h3>{title}</h3><p>{text}</p></div></li>
            ))}</ul>
          </div>
          <AudiencePreview audience={id} />
        </div>
      ))}
    </>
  );
}
