"use client";

import { useState, type ReactNode, type Ref } from "react";
import Image from "next/image";
import { ArrowUpRight, Bookmark, BriefcaseBusiness, Check, ChevronRight, Clock3, MapPin, Search, Send, SlidersHorizontal, Users } from "lucide-react";
import { defaultJobFilters, experienceLevels, jobIndustries, jobTypes, matchesJobFilters, normalizeJobDraft, workModes, type Job, type JobDraft, type JobFilters } from "@/lib/jobs";
import { people } from "@/lib/people";
import type { Community } from "@/lib/institution";

export type CommunityFilters = { query: string; mine: boolean };
type JobViewer = { id: string; name: string; role: string; batch: string };

export function ShareJobForm({ publish, cancel }: { publish: (draft: JobDraft) => void; cancel: () => void }) {
  const [error, setError] = useState("");
  return <form className="form-card share-job-form" onSubmit={event => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const workMode = workModes.find(mode => mode === fields.get("workMode"));
    if (!workMode) return;
    const draft = normalizeJobDraft({
      title: String(fields.get("title")), company: String(fields.get("company")),
      location: String(fields.get("location")), workMode,
      description: String(fields.get("description")), applicationUrl: String(fields.get("applicationUrl")),
      referralAvailable: fields.has("referralAvailable"),
      employment: jobTypes.find(type => type === fields.get("employment")),
      experienceLevel: experienceLevels.find(level => level === fields.get("experienceLevel")),
      industry: jobIndustries.find(industry => industry === fields.get("industry")),
    });
    if (!draft) {
      setError("Check the job details and use an application link starting with https:// or http://.");
      return;
    }
    publish(draft);
  }} onChange={() => { if (error) setError(""); }}>
    <label className="field"><span className="field-label">Job title</span><input name="title" required maxLength={80} /></label>
    <label className="field"><span className="field-label">Company</span><input name="company" required maxLength={80} /></label>
    <div className="share-job-location">
      <label className="field"><span className="field-label">Work mode</span><select name="workMode" defaultValue="" required><option value="" disabled>Select work mode</option>{workModes.map(mode => <option key={mode}>{mode}</option>)}</select></label>
      <label className="field"><span className="field-label">Location <small className="field-hint">(optional)</small></span><input name="location" placeholder="e.g. Bengaluru" maxLength={80} /></label>
    </div>
    <div className="share-job-location">
      <label className="field"><span className="field-label">Industry</span><select name="industry"><option value="">Select industry (optional)</option>{jobIndustries.map(industry => <option key={industry}>{industry}</option>)}</select></label>
      <label className="field"><span className="field-label">Job type</span><select name="employment"><option value="">Select type (optional)</option>{jobTypes.map(type => <option key={type}>{type}</option>)}</select></label>
    </div>
    <label className="field"><span className="field-label">Experience level</span><select name="experienceLevel"><option value="">Select level (optional)</option>{experienceLevels.map(level => <option key={level}>{level}</option>)}</select></label>
    <label className="field"><span className="field-label">Brief description</span><textarea name="description" rows={3} required maxLength={600} /></label>
    <label className="field"><span className="field-label">Application link</span><input name="applicationUrl" type="url" placeholder="https://" required maxLength={500} /></label>
    <label className="share-job-referral"><input type="checkbox" name="referralAvailable" /><span>I’m open to referral requests</span></label>
    {error && <p className="field-hint" role="alert">{error}</p>}
    <div className="action-footer"><button type="submit" className="button primary">Publish job</button><button type="button" className="button quiet" onClick={cancel}>Cancel</button></div>
  </form>;
}

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

const jobViews = [["all", "All jobs"], ["saved", "Saved"], ["applied", "Applied jobs"]] as const;

export function JobBoard({ jobs, viewer, filters, updateFilters, saved, applied, referrals, toggle, open }: {
  jobs: Job[]; viewer: JobViewer;
  filters: JobFilters; updateFilters: (filters: JobFilters) => void; saved: string[]; applied: string[]; referrals: Record<string, string>;
  toggle: (id: string) => void; open: (id: string) => void;
}) {
  const uniqueOptions = (values: string[]) => [...new Map(values.filter(Boolean).map(value => [value.toLowerCase(), value])).values()].sort();
  const facets = [
    { key: "location", label: "Location", options: uniqueOptions(jobs.map(job => job.location)) },
    { key: "industry", label: "Industry", options: jobIndustries },
    { key: "experienceLevel", label: "Experience level", options: experienceLevels },
    { key: "employment", label: "Job type", options: jobTypes },
    { key: "workMode", label: "Work mode", options: workModes },
  ] as const;
  const activeFacets = facets.filter(({ key }) => filters[key]).length;
  const [filtersOpen, setFiltersOpen] = useState(activeFacets > 0);
  const tracked = filters.view === "saved" ? saved : filters.view === "applied" ? applied : null;
  const results = jobs.filter(job => {
    const poster = job.sharedBy === viewer.id ? viewer : people.find(person => person.id === job.sharedBy);
    return (!tracked || tracked.includes(job.id)) && matchesJobFilters(job, filters, poster?.name);
  });
  return <>
    <div className="directory-filters">
      <div className="job-board-views" role="group" aria-label="Job views">
        {jobViews.map(([view, label]) => <button key={view} type="button" aria-pressed={filters.view === view} onClick={() => {
          if (filters.view === view) return;
          updateFilters({ ...defaultJobFilters, view });
          setFiltersOpen(false);
        }}>{label}</button>)}
      </div>
      <div className="job-board-search">
        <DirectorySearch label="Role, company, or location" value={filters.query} change={query => updateFilters({ ...filters, query })} />
        <button type="button" className="filter-toggle" aria-expanded={filtersOpen} aria-controls="job-board-filters" onClick={() => setFiltersOpen(open => !open)}>
          <SlidersHorizontal size={16} aria-hidden="true" />Filters{activeFacets > 0 && <span>{activeFacets}</span>}
        </button>
      </div>
      <div className="job-board-filters" id="job-board-filters" hidden={!filtersOpen}>
        {facets.map(({ key, label, options }) => <label key={key} className="field">
          <span className="field-label">{label}</span>
          <select value={filters[key]} onChange={event => updateFilters({ ...filters, [key]: event.target.value })}>
            <option value="">Any</option>{options.map(option => <option key={option}>{option}</option>)}
          </select>
        </label>)}
        {activeFacets > 0 && <button type="button" className="text-button" onClick={() => updateFilters({ ...defaultJobFilters, view: filters.view, query: filters.query })}>Clear filters</button>}
      </div>
    </div>
    <p className="directory-count" role="status">{results.length} {results.length === 1 ? "role" : "roles"}</p>
    {results.length === 0 ? <p className="giving-empty">{tracked?.length === 0 ? (filters.view === "applied" ? "After applying, open the listing and select Mark as applied to track it here." : "Save a role to find it here later.") : "No roles match. Try a different search or clear filters."}</p> :
      <div className="explore-list">{results.map(job => {
        const ownListing = job.sharedBy === viewer.id;
        const poster = ownListing ? viewer : people.find(person => person.id === job.sharedBy);
        return <article key={job.id} className="directory-card">
          <div className="directory-card-top">
            <EntryTitle icon={<span className="explore-icon sage"><BriefcaseBusiness size={18} aria-hidden="true" /></span>} title={job.title} meta={[job.company, job.location].filter(Boolean).join(" · ")} onOpen={() => open(job.id)} />
            <SaveJob compact title={job.title} saved={saved.includes(job.id)} toggle={() => toggle(job.id)} />
          </div>
          <div className="directory-card-footer"><span>{[job.workMode, job.employment, job.experienceLevel].filter(Boolean).join(" · ")}</span>{poster && <span>Shared by {ownListing ? "you" : poster.name}</span>}{applied.includes(job.id) && <span className="directory-badge">Applied</span>}{job.referralAvailable && <span className="directory-badge">{referrals[job.id] ? "Referral requested" : "Referral available"}</span>}</div>
        </article>;
      })}</div>}
  </>;
}

export function JobDetail({ job, viewer, saved, applied, message, headingRef, toggle, setApplied, request, viewRequests }: {
  job: Job; viewer: JobViewer; saved: boolean; applied: boolean; message?: string; headingRef: Ref<HTMLHeadingElement>;
  toggle: () => void; setApplied: (applied: boolean) => void; request: (message: string) => void; viewRequests: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const ownListing = job.sharedBy === viewer.id;
  const poster = ownListing ? viewer : people.find(person => person.id === job.sharedBy);
  return <>
    <header className="directory-hero">
      <span className="explore-icon sage"><BriefcaseBusiness size={22} aria-hidden="true" /></span>
      <h1 ref={headingRef} tabIndex={-1}>{job.title}</h1>
      <p>{job.company}</p>
      <div className="directory-meta">{job.location && <span><MapPin size={15} aria-hidden="true" />{job.location}</span>}<span>{job.workMode}</span>{job.employment && <span>{job.employment}</span>}{job.experienceLevel && <span>{job.experienceLevel}</span>}{job.industry && <span>{job.industry}</span>}</div>
      <SaveJob saved={saved} title={job.title} toggle={toggle} />
    </header>
    <section className="directory-section"><h2>About the role</h2><p>{job.description}</p></section>
    {!!job.expertise?.length && <section className="directory-section"><h2>Expertise</h2><div className="directory-meta">{job.expertise.map((skill, index) => <span key={index}>{skill}</span>)}</div></section>}
    {!!job.responsibilities?.length && <section className="directory-section"><h2>What you’ll do</h2><ul>{job.responsibilities.map(item => <li key={item}>{item}</li>)}</ul></section>}
    {!!job.qualifications?.length && <section className="directory-section"><h2>What they’re looking for</h2><ul>{job.qualifications.map(item => <li key={item}>{item}</li>)}</ul></section>}
    <section className="directory-action">
      {poster && <div className="directory-member"><Image src={`/avatars/${poster.id}.svg`} alt="" width={36} height={36} unoptimized /><div><small>Shared by</small><strong>{poster.name}</strong><small>{poster.role} · Class of {poster.batch}</small></div></div>}
      {job.applicationUrl && <a className="button primary" href={job.applicationUrl} target="_blank" rel="noopener noreferrer" aria-label="Apply externally (opens in a new tab)">Apply externally<ArrowUpRight size={17} aria-hidden="true" /></a>}
      {!ownListing && <>
        {applied && <p className="inline-confirmation" role="status"><Check size={16} aria-hidden="true" />Added to Applied jobs</p>}
        <button className="button secondary" type="button" onClick={() => setApplied(!applied)}>{applied ? "Remove from Applied jobs" : "Mark as applied"}</button>
      </>}
      {ownListing ? (job.referralAvailable && <p>You’re open to referral requests for this job.</p>) : message ? <>
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
        (!job.applicationUrl && <p>No application link or referral is available for this listing.</p>)}
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
