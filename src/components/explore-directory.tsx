"use client";

import { useState, type ReactNode, type Ref } from "react";
import Image from "next/image";
import { Bookmark, BriefcaseBusiness, Check, ChevronRight, Clock3, MapPin, Search, Send, Users } from "lucide-react";
import { jobs, type Job } from "@/lib/jobs";
import { people } from "@/lib/people";
import type { Community } from "@/lib/institution";

export type JobFilters = { query: string; workMode: string; savedOnly: boolean };
export type CommunityFilters = { query: string; mine: boolean };

function DirectorySearch({ label, value, change }: { label: string; value: string; change: (query: string) => void }) {
  return <label className="search-field">
    <Search size={18} aria-hidden="true" />
    <input aria-label={label} type="search" placeholder={label} value={value} onChange={event => change(event.target.value)} />
  </label>;
}

function EntryTitle({ icon, title, meta, onOpen }: { icon: ReactNode; title: string; meta: string; onOpen: () => void }) {
  return <button type="button" className="directory-open" onClick={onOpen}>
    {icon}<span><strong>{title}</strong><small>{meta}</small></span><ChevronRight size={18} aria-hidden="true" />
  </button>;
}

function SaveJob({ saved, toggle, title, compact = false }: { saved: boolean; toggle: () => void; title: string; compact?: boolean }) {
  return <button type="button" className={compact ? "directory-bookmark" : "button secondary"} aria-label={compact ? `Save ${title}` : "Save job"} aria-pressed={saved} onClick={toggle}>
    <Bookmark size={17} fill={saved ? "currentColor" : "none"} aria-hidden="true" />{!compact && (saved ? "Saved" : "Save job")}
  </button>;
}

export function JobBoard({ filters, updateFilters, saved, referrals, toggle, open }: {
  filters: JobFilters; updateFilters: (filters: JobFilters) => void; saved: string[]; referrals: Record<string, string>;
  toggle: (id: string) => void; open: (id: string) => void;
}) {
  const query = filters.query.trim().toLowerCase();
  const results = jobs.filter(job => {
    const poster = people.find(person => person.id === job.sharedBy);
    return (!filters.savedOnly || saved.includes(job.id))
      && (!filters.workMode || filters.workMode === job.workMode)
      && [job.title, job.company, job.location, job.workMode, job.employment, poster?.name].join(" ").toLowerCase().includes(query);
  });
  return <>
    <div className="directory-filters">
      <DirectorySearch label="Role, company, or location" value={filters.query} change={query => updateFilters({ ...filters, query })} />
      <div className="directory-filter-row">
        <select aria-label="Work mode" value={filters.workMode} onChange={event => updateFilters({ ...filters, workMode: event.target.value })}>
          <option value="">Any work mode</option><option>Hybrid</option><option>On-site</option><option>Remote</option>
        </select>
        <button type="button" className="button secondary directory-filter" aria-pressed={filters.savedOnly} onClick={() => updateFilters({ ...filters, savedOnly: !filters.savedOnly })}><Bookmark size={16} aria-hidden="true" />Saved</button>
      </div>
    </div>
    <p className="directory-count" role="status">{results.length} {results.length === 1 ? "role" : "roles"}</p>
    {results.length === 0 ? <p className="giving-empty">{filters.savedOnly && !saved.length ? "Save a role to find it here later." : "No roles match. Try a different search or work mode."}</p> :
      <div className="explore-list">{results.map(job => {
        const poster = people.find(person => person.id === job.sharedBy);
        return <article key={job.id} className="directory-card">
          <div className="directory-card-top">
            <EntryTitle icon={<span className="explore-icon sage"><BriefcaseBusiness size={18} aria-hidden="true" /></span>} title={job.title} meta={job.company + " · " + job.location} onOpen={() => open(job.id)} />
            <SaveJob compact title={job.title} saved={saved.includes(job.id)} toggle={() => toggle(job.id)} />
          </div>
          <div className="directory-card-footer"><span>{job.workMode} · {job.employment}</span>{poster && <span>Shared by {poster.name}</span>}{job.referralAvailable && <span className="directory-badge">{referrals[job.id] ? "Referral requested" : "Referral available"}</span>}</div>
        </article>;
      })}</div>}
  </>;
}

export function JobDetail({ job, saved, message, headingRef, toggle, request, viewRequests }: {
  job: Job; saved: boolean; message?: string; headingRef: Ref<HTMLHeadingElement>;
  toggle: () => void; request: (message: string) => void; viewRequests: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const poster = people.find(person => person.id === job.sharedBy);
  return <>
    <header className="directory-hero">
      <span className="explore-icon sage"><BriefcaseBusiness size={22} aria-hidden="true" /></span>
      <h1 ref={headingRef} tabIndex={-1}>{job.title}</h1>
      <p>{job.company}</p>
      <div className="directory-meta"><span><MapPin size={15} aria-hidden="true" />{job.location}</span><span>{job.workMode}</span><span>{job.employment}</span></div>
      <SaveJob saved={saved} title={job.title} toggle={toggle} />
    </header>
    <section className="directory-section"><h2>About the role</h2><p>{job.description}</p></section>
    <section className="directory-section"><h2>What you’ll do</h2><ul>{job.responsibilities.map(item => <li key={item}>{item}</li>)}</ul></section>
    <section className="directory-section"><h2>What they’re looking for</h2><ul>{job.qualifications.map(item => <li key={item}>{item}</li>)}</ul></section>
    <section className="directory-action">
      {poster && <div className="directory-member"><Image src={`/avatars/${poster.id}.svg`} alt="" width={36} height={36} unoptimized /><div><small>Shared by</small><strong>{poster.name}</strong><small>{poster.role} · Class of {poster.batch}</small></div></div>}
      {message ? <>
        <p className="inline-confirmation" role="status"><Check size={16} aria-hidden="true" />Referral requested</p>
        <p className="preserve-lines">{message}</p>
        <button className="button secondary" type="button" onClick={viewRequests}>View requests<ChevronRight size={17} aria-hidden="true" /></button>
      </> : job.referralAvailable ? editing ? <form onSubmit={event => {
        event.preventDefault();
        if (draft.trim().length < 15) return;
        request(draft);
      }}>
        <label className="field"><span className="field-label">Your referral request</span><textarea autoFocus required minLength={15} maxLength={600} rows={4} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Share why you’re interested and what makes you a good fit." /><span className="field-hint">15–600 characters</span></label>
        <div className="action-footer"><button className="button primary" type="submit" disabled={draft.trim().length < 15}>Submit request<Send size={15} aria-hidden="true" /></button><button className="button quiet" type="button" onClick={() => setEditing(false)}>Cancel</button></div>
      </form> : <><p>{poster?.name.split(" ")[0] ?? "The alum who shared this role"} is open to referral requests.</p><button className="button primary" type="button" onClick={() => setEditing(true)}>Request a referral<ChevronRight size={17} aria-hidden="true" /></button></> :
        <p>No application link or referral is available for this listing.</p>}
    </section>
  </>;
}

function membership(community: Community, viewerId: string) {
  if (community.members.some(member => member.id === viewerId)) return "Joined";
  if (community.requests.some(request => request.member.id === viewerId)) return "Pending approval";
  return community.openMembership ? "Open to join" : "Approval required";
}

function memberCount(community: Community) {
  return `${community.members.length} ${community.members.length === 1 ? "member" : "members"}`;
}

export function ExploreCommunities({ communities, viewerId, filters, updateFilters, open }: {
  communities: Community[]; viewerId: string; filters: CommunityFilters; updateFilters: (filters: CommunityFilters) => void; open: (id: string) => void;
}) {
  const query = filters.query.trim().toLowerCase();
  const results = communities.filter(community => (!filters.mine || ["Joined", "Pending approval"].includes(membership(community, viewerId)))
    && [community.name, community.location, community.description].join(" ").toLowerCase().includes(query));
  return <>
    <div className="directory-filters directory-community-filters" role="search">
      <DirectorySearch label="Community, interest, or location" value={filters.query} change={query => updateFilters({ ...filters, query })} />
      <button type="button" className="button secondary directory-filter" aria-pressed={filters.mine} onClick={() => updateFilters({ ...filters, mine: !filters.mine })}><Users size={16} aria-hidden="true" />My communities</button>
    </div>
    <p className="directory-count" role="status">{results.length} {results.length === 1 ? "community" : "communities"}</p>
    {results.length === 0 ? <p className="giving-empty">{filters.mine ? "Your memberships and pending requests will appear here when they match your search." : "No communities match your search."}</p> :
      <div className="explore-list">{results.map(community => <article key={community.id} className="directory-card community-card">
        <EntryTitle icon={<span className="explore-icon lilac"><Users size={18} aria-hidden="true" /></span>} title={community.name} meta={community.location + " · " + memberCount(community)} onOpen={() => open(community.id)} />
        {community.description && <p>{community.description}</p>}
        <div className="directory-card-footer"><span className="directory-badge">{membership(community, viewerId)}</span></div>
      </article>)}</div>}
  </>;
}

export function CommunityDetail({ community, viewerId, headingRef, join, withdraw, leave }: {
  community: Community; viewerId: string; headingRef: Ref<HTMLHeadingElement>; join: (message: string) => void; withdraw: () => void; leave: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmLeaving, setConfirmLeaving] = useState(false);
  const [message, setMessage] = useState("");
  const status = membership(community, viewerId);
  const joined = status === "Joined";
  const pending = status === "Pending approval";
  const moderator = community.members.find(member => member.id === viewerId)?.role === "moderator";
  const visibleMembers = joined ? community.members : community.members.filter(member => member.role === "moderator");
  const activities = people.filter(person => community.members.some(member => member.id === person.id))
    .flatMap(person => (person.currentIntents ?? []).map(intent => ({ ...intent, name: person.name })));
  return <>
    <header className="directory-hero community-hero">
      <span className="explore-icon lilac"><Users size={22} aria-hidden="true" /></span>
      <h1 ref={headingRef} tabIndex={-1}>{community.name}</h1>
      <div className="directory-meta"><span><MapPin size={15} aria-hidden="true" />{community.location}</span><span><Users size={15} aria-hidden="true" />{memberCount(community)}</span></div>
      <p>{community.description}</p>
    </header>
    <section className="directory-action" aria-label="Membership">
      <h2>Membership</h2>
      {joined || pending ? <>
        <p className="inline-confirmation" role="status">{joined ? <Check size={16} aria-hidden="true" /> : <Clock3 size={16} aria-hidden="true" />}{status}</p>
        {pending && <><p>A moderator will review your request.</p><button type="button" className="button quiet" onClick={withdraw}>Withdraw request</button></>}
        {joined && !moderator && (confirmLeaving ? <>
          <p>Leave {community.name}?</p>
          <div className="action-footer"><button type="button" className="button secondary" onClick={() => { leave(); setConfirmLeaving(false); }}>Confirm leave</button><button type="button" className="button quiet" onClick={() => setConfirmLeaving(false)}>Cancel</button></div>
        </> : <button type="button" className="button quiet" onClick={() => setConfirmLeaving(true)}>Leave community</button>)}
      </> : community.openMembership ?
        <button type="button" className="button primary" onClick={() => join("")}>Join community<ChevronRight size={17} aria-hidden="true" /></button> : editing ?
          <form onSubmit={event => { event.preventDefault(); join(message); setMessage(""); setEditing(false); }}>
            <label className="field"><span className="field-label">Note to the moderator (optional)</span><textarea autoFocus maxLength={400} rows={3} value={message} onChange={event => setMessage(event.target.value)} placeholder="Share why you’d like to join." /></label>
            <div className="action-footer"><button type="submit" className="button primary">Send join request<Send size={15} aria-hidden="true" /></button><button type="button" className="button quiet" onClick={() => setEditing(false)}>Cancel</button></div>
          </form> : <><p>A moderator approves new members.</p><button type="button" className="button primary" onClick={() => setEditing(true)}>Request to join<ChevronRight size={17} aria-hidden="true" /></button></>}
    </section>
    {visibleMembers.length > 0 && <section className="directory-section"><h2>{joined ? "Members" : "Moderators"}</h2><ul className="directory-members">{visibleMembers.map(member => <li className="directory-member" key={member.id}><div><strong>{member.name}</strong><small>Class of {member.batch}{member.role === "moderator" && " · Moderator"}</small></div></li>)}</ul></section>}
    {joined && <section className="directory-section"><h2>Active intents from members</h2>{activities.length ? <ul className="directory-members">{activities.map(intent => <li key={intent.name + intent.title}><strong>{intent.title}</strong><p>{intent.name} · {intent.status}</p></li>)}</ul> : <p>No active intents from members yet.</p>}</section>}
  </>;
}
