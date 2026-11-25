"use client";

import { useState } from "react";
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, CalendarDays, ChevronRight, FlaskConical, Heart, Plus, Users } from "lucide-react";
import { campaignProgress, demoSupporterId, formatDeadline, formatRupees, isCampaignAmount, isCampaignOpen, maxCampaignAmount, todayInIndia, type Campaign } from "@/lib/fundraising";
import "./explore.css";

const destinations = [
  { id: "events", label: "Events", description: "Talks and meetups", Icon: CalendarDays, tone: "blue" },
  { id: "jobs", label: "Job board", description: "Roles shared by alumni", Icon: BriefcaseBusiness, tone: "sage" },
  { id: "communities", label: "Communities", description: "Groups by interest and location", Icon: Users, tone: "lilac" },
  { id: "campaigns", label: "Fundraising", description: "Support a university cause", Icon: Heart, tone: "warm" },
] as const;

type Destination = typeof destinations[number]["id"];

export function ExploreHub({ featured, open, openCampaign }: { featured?: Campaign; open: (destination: Destination) => void; openCampaign: (id: string) => void }) {
  return <>
    <div className="explore-grid" aria-label="Explore sections">
      {destinations.map(({ id, label, description, tone, Icon }) => <button key={id} type="button" className="explore-tile" onClick={() => open(id)}>
        <span className="row between"><span className={"explore-icon " + tone}><Icon size={21} aria-hidden="true" /></span><ArrowUpRight size={17} aria-hidden="true" /></span>
        <strong>{label}</strong><span>{description}</span>
      </button>)}
    </div>
    {featured && <button type="button" className="giving-feature" onClick={() => openCampaign(featured.id)}>
      <span className="row between"><span className="eyebrow">From BITS Pilani</span><FlaskConical size={22} aria-hidden="true" /></span>
      <strong>{featured.title}</strong><span className="giving-feature-copy">{featured.summary}</span>
      <span className="giving-feature-footer"><span><b>{formatRupees(campaignProgress(featured).total)}</b> pledged</span><span>View campaign<ArrowRight size={15} aria-hidden="true" /></span></span>
    </button>}
  </>;
}

export function CampaignProgress({ campaign }: { campaign: Campaign }) {
  const { total, supporters, percent } = campaignProgress(campaign);
  return <section className="giving-progress" aria-label="Campaign progress">
    <div className="row between"><strong>{formatRupees(total)}</strong><span className="giving-percent">{percent}% of goal</span></div>
    <p>Pledged toward {formatRupees(campaign.goal)}</p>
    <progress aria-label="Progress toward the pledge goal" value={Math.min(total, campaign.goal)} max={campaign.goal} />
    <div className="row between giving-meta"><span><Users size={15} aria-hidden="true" />{supporters} {supporters === 1 ? "supporter" : "supporters"}</span><span><CalendarDays size={15} aria-hidden="true" />Ends {formatDeadline(campaign.deadline)}</span></div>
  </section>;
}

export function CampaignPresentation({ campaign, preview = false, headingRef }: { campaign: Campaign; preview?: boolean; headingRef?: React.Ref<HTMLHeadingElement> }) {
  return <>
    <section className="giving-hero">
      <div><p className="eyebrow">BITS Pilani · Fundraising</p>{preview ? <h2>{campaign.title}</h2> : <h1 ref={headingRef} tabIndex={-1}>{campaign.title}</h1>}<p>{campaign.summary}</p></div>
      <div className="giving-illustration" aria-hidden="true"><div><FlaskConical size={35} /></div><Plus size={17} /></div>
    </section>
    <CampaignProgress campaign={campaign} />
    <section className="giving-impact"><h2>What your support makes possible</h2><p>{campaign.purpose}</p></section>
    {campaign.updates.length > 0 && <section className="giving-updates"><h2>Campaign updates</h2><ul>{campaign.updates.map((entry, index) => <li key={index}><h3>{entry.title}</h3><p>{entry.message}</p></li>)}</ul></section>}
  </>;
}

export function CampaignList({ campaigns, open }: { campaigns: Campaign[]; open: (id: string) => void }) {
  if (!campaigns.length) return <p className="giving-empty">Published university campaigns will appear here.</p>;
  return <div className="explore-list">{campaigns.map(campaign => <button key={campaign.id} type="button" className="giving-list-card" onClick={() => open(campaign.id)}>
    <span className="row between"><span className="explore-icon warm"><Heart size={19} aria-hidden="true" /></span><ChevronRight size={18} aria-hidden="true" /></span>
    <strong>{campaign.title}</strong><span>{campaign.summary}</span>
    <span className="giving-meta">{formatRupees(campaignProgress(campaign).total)} pledged · Ends {formatDeadline(campaign.deadline)}</span>
  </button>)}</div>;
}

export function PledgeSupport({ campaign, save }: { campaign: Campaign; save: (amount: number, today: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const previousAmount = campaign.pledges[demoSupporterId];
  const open = isCampaignOpen(campaign, todayInIndia());
  return <section className="giving-pledge" aria-label="Pledge support">
    {message && <p className="inline-confirmation" role="status">{message}</p>}
    {!open ? <p className="giving-empty">Pledges for this campaign have closed.</p> : editing ? <form onSubmit={event => {
      event.preventDefault();
      const today = todayInIndia();
      if (!isCampaignOpen(campaign, today)) { setEditing(false); return; }
      const value = Number(amount);
      if (!isCampaignAmount(value)) { setError("Enter a whole amount between ₹1 and ₹1,00,00,000."); return; }
      save(value, today);
      setMessage("Your " + formatRupees(value) + " pledge was " + (previousAmount ? "updated." : "recorded."));
      setEditing(false);
    }}>
      <label className="field"><span className="field-label">Pledge amount (₹)</span><input required type="number" inputMode="numeric" min="1" max={maxCampaignAmount} step="1" value={amount} onChange={event => { setAmount(event.target.value); setError(""); }} /></label>
      <div className="giving-amounts">{[500, 1_000, 2_500].map(value => <button type="button" key={value} className="button secondary" aria-pressed={Number(amount) === value} onClick={() => { setAmount(String(value)); setError(""); }}>{formatRupees(value)}</button>)}</div>
      {error && <p role="alert" className="field-hint">{error}</p>}
      <div className="action-footer"><button type="submit" className="button primary">Confirm pledge<ArrowRight size={17} aria-hidden="true" /></button><button type="button" className="button quiet" onClick={() => setEditing(false)}>Cancel</button></div>
    </form> : <>
      {previousAmount && <p className="giving-your-pledge">Your pledge: {formatRupees(previousAmount)}</p>}
      <button type="button" className="button primary full-width" onClick={() => { setAmount(previousAmount ? String(previousAmount) : ""); setMessage(""); setError(""); setEditing(true); }}>{previousAmount ? "Edit your pledge" : "Pledge support"}<ArrowRight size={17} aria-hidden="true" /></button>
    </>}
    <small className="giving-pledge-note">Demo pledge. No payment is collected.</small>
  </section>;
}
