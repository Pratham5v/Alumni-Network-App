"use client";

import { useCallback, useEffect, useReducer, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Award, BadgeCheck, BriefcaseBusiness, CalendarDays, Check, CheckCheck, ChevronDown, ChevronRight, Clock3, Eye, GraduationCap, Home, Layers3, Linkedin, LoaderCircle, Mail, MapPin, MessageCircle, Phone, Plus, RotateCcw, Search, Send, Settings, ShieldCheck, SlidersHorizontal, Sparkles, Users, Video, X } from "lucide-react";
import { demoReducer, demoReply, incomingScenario, initialState, isValidCallLink, sampleCallLink, sampleIntent, sampleOutcome, sampleProfile, sampleProfileLinks, type Commitment, type ContactVisibility, type Intent, type Message, type Outcome, type Profile, type ProfileDetails, type ProfilePreferences } from "@/lib/model";
import { people, relevanceToIntent, type Person } from "@/lib/people";
import { googleCalendarUrl, interviewTimeLabel } from "@/lib/calendar";
import { aiLecture, alumniEvents, distinguishedAlumnus, eventDateBadge, eventDateLabel, type AlumniEvent } from "@/lib/events";

type Screen = "welcome" | "onboard" | "verify" | "home" | "create" | "intent" | "intents" | "people" | "profile" | "compose" | "requests" | "request" | "conversation" | "outcome" | "success" | "my-profile" | "profile-edit" | "profile-settings" | "profile-preview" | "received-request" | "received-conversation" | "distinguished-profile" | "events" | "event";
const appScreens: Screen[] = ["home", "create", "intent", "intents", "people", "profile", "compose", "requests", "request", "conversation", "outcome", "success", "my-profile", "profile-edit", "profile-settings", "profile-preview", "received-request", "received-conversation", "distinguished-profile", "events", "event"];
type IntentForm = Omit<Intent, "status">;
type ContactPreview = { title: string; value: string };
type EventPage = { id: string; from: "events" | "distinguished-profile" };
const defaultEventPage: EventPage = { id: aiLecture.id, from: "events" };
const alumniBatches = [...new Set([...people, distinguishedAlumnus].map(alumnus => alumnus.batch))].sort((a, b) => Number(b) - Number(a));
const riya = { id: "riya", initials: "RS", color: "sage" };

function Button({ children, variant = "primary", busy, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "quiet"; busy?: boolean }) {
  return <button {...props} disabled={props.disabled || busy} className={`button ${variant} ${className}`} aria-busy={busy || undefined}>{busy && <LoaderCircle size={18} className="spin" />}{children}</button>;
}
function Avatar({ person, size = "normal" }: { person: Pick<Person, "initials" | "color"> & { id?: string }; size?: "normal" | "large" | "small" }) {
  return <span className={`avatar ${person.id ? "portrait" : person.color} ${size}`} aria-hidden="true">
    {person.id ? <Image src={`/avatars/${person.id}.svg`} width={78} height={78} alt="" unoptimized /> : person.initials}
  </span>;
}
function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="field"><span className="field-label">{label}</span>{children}{hint && <span className="field-hint">{hint}</span>}</label>;
}
function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <span className="select-wrap"><select {...props}>{children}</select><ChevronDown size={17} aria-hidden="true" /></span>;
}
function Tag({ children, warm = false }: { children: ReactNode; warm?: boolean }) { return <span className={`tag ${warm ? "warm" : ""}`}>{children}</span>; }

function EditProfileForm({ details, onSave }: { details: ProfileDetails; onSave: (details: ProfileDetails) => void }) {
  const [draft, setDraft] = useState(details);
  function update(key: keyof ProfileDetails, value: string) { setDraft({ ...draft, [key]: value }); }
  return <form className="form-card" onSubmit={event => {
    event.preventDefault();
    onSave({
      bio: draft.bio.trim(), expertise: draft.expertise.trim(), help: draft.help.trim(),
      email: draft.email.trim(), phone: draft.phone.trim(), linkedin: draft.linkedin.trim(), portfolio: draft.portfolio.trim(),
    });
  }}>
    <Field label="How I can help"><textarea rows={3} maxLength={180} value={draft.help} onChange={e => update("help", e.target.value)} /></Field>
    <Field label="About"><textarea rows={3} maxLength={280} value={draft.bio} onChange={e => update("bio", e.target.value)} /></Field>
    <Field label="Expertise" hint="Separate skills with commas."><input maxLength={140} value={draft.expertise} onChange={e => update("expertise", e.target.value)} /></Field>
    <fieldset className="profile-preference-group">
      <legend>Contact &amp; links</legend>
      <Field label="Email"><input type="email" maxLength={254} value={draft.email} onChange={e => update("email", e.target.value)} /></Field>
      <Field label="Phone number"><input type="tel" maxLength={40} value={draft.phone} onChange={e => update("phone", e.target.value)} /></Field>
      <Field label="LinkedIn URL"><input type="url" pattern="https?://.+" maxLength={250} placeholder="https://linkedin.com/in/…" value={draft.linkedin} onChange={e => update("linkedin", e.target.value)} /></Field>
      <Field label="Portfolio URL"><input type="url" pattern="https?://.+" maxLength={250} placeholder="https://…" value={draft.portfolio} onChange={e => update("portfolio", e.target.value)} /></Field>
    </fieldset>
    <div className="action-footer"><Button type="submit">Save profile</Button></div>
  </form>;
}

function ProfileSettingsForm({ preferences, onSave }: { preferences: ProfilePreferences; onSave: (preferences: ProfilePreferences) => void }) {
  const [draft, setDraft] = useState(preferences);
  return <form className="form-card" onSubmit={event => { event.preventDefault(); onSave(draft); }}>
    <fieldset className="profile-preference-group">
      <legend>Contact visibility</legend>
      <p>Choose who can see your email and phone number.</p>
      {([["Email visibility", "emailVisibility"], ["Phone number visibility", "phoneVisibility"]] as const).map(([label, key]) =>
        <Field key={key} label={label}><Select value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value as ContactVisibility })}>
          <option value="private">Only me</option><option value="accepted-request">People with an accepted request</option><option value="alumni">Verified alumni</option>
        </Select></Field>
      )}
    </fieldset>
    <fieldset className="profile-preference-group">
      <legend>Notification preferences</legend>
      {([["New requests", "requests"], ["Request replies and messages", "replies"], ["Event reminders", "events"]] as const).map(([label, key]) =>
        <label className="profile-toggle" key={key}><span>{label}</span><input type="checkbox" role="switch" checked={draft.notifications[key]} onChange={e => setDraft({ ...draft, notifications: { ...draft.notifications, [key]: e.target.checked } })} /></label>
      )}
      <p>Requests and replies control the Requests badge in this demo. Event reminder preferences are saved for this session.</p>
    </fieldset>
    <fieldset className="profile-preference-group">
      <legend>Availability</legend>
      <p>Pausing leaves existing conversations open.</p>
      <Field label="Availability status"><Select value={draft.available ? "open" : "paused"} onChange={e => setDraft({ ...draft, available: e.target.value === "open" })}>
        <option value="open">Open to helping</option><option value="paused">Paused</option>
      </Select></Field>
      <Field label="Preferred format"><Select value={draft.commitment} onChange={e => setDraft({ ...draft, commitment: e.target.value as Commitment })}>
        <option>Chat</option><option>20-minute call</option><option>30-minute call</option>
      </Select></Field>
    </fieldset>
    <div className="action-footer"><Button type="submit">Save settings</Button></div>
  </form>;
}
function Confirmation({ message }: { message: string }) {
  return <p className="inline-confirmation"><span><Check size={14} aria-hidden="true" /></span>{message}</p>;
}
function Empty({ icon, title, children, action }: { icon: ReactNode; title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h2>{title}</h2><p>{children}</p>{action}</div>;
}
function Choice({ name, value, selected, onSelect, children }: { name: string; value: string; selected: boolean; onSelect: () => void; children: ReactNode }) {
  return <label className={`choice ${selected ? "selected" : ""}`}><input type="radio" name={name} value={value} checked={selected} onChange={onSelect} /><span className="radio-mark" /><span>{children}</span></label>;
}
function Thread({ messages, name, children }: { messages: Message[]; name: string; children?: ReactNode }) {
  return <div className="messages" aria-label="Conversation messages" aria-live="polite">
    {messages.map(message => <div key={message.id} className={`message ${message.from}`}>
      <span>{message.from === "you" ? "You" : name}</span><p>{message.text}</p>
    </div>)}
    {children}
  </div>;
}
function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    else if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  return <dialog ref={dialog} className="sheet" aria-labelledby="sheet-title" onCancel={event => {
    event.preventDefault();
    onClose();
  }} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
  }}><div className="sheet-heading"><h2 id="sheet-title">{title}</h2><button type="button" className="sheet-close" aria-label="Close sheet" onClick={onClose}><X size={21} /></button></div>{children}</dialog>;
}

export default function AlumniApp() {
  const [state, dispatch] = useReducer(demoReducer, initialState);
  const [screen, setScreen] = useState<Screen>("welcome");
  const [profileForm, setProfileForm] = useState<Profile>(sampleProfile);
  const [intentForm, setIntentForm] = useState<IntentForm>(sampleIntent);
  const [personId, setPersonId] = useState("aarav");
  const [eventPage, setEventPage] = useState(defaultEventPage);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All locations");
  const [expertise, setExpertise] = useState("All expertise");
  const [batchFilter, setBatchFilter] = useState("");
  const [distinguishedOnly, setDistinguishedOnly] = useState(false);
  const [matchToIntent, setMatchToIntent] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [commitment, setCommitment] = useState<Commitment>("20-minute call");
  const [outcome, setOutcome] = useState<Partial<Outcome>>(sampleOutcome);
  const [sheet, setSheet] = useState<"call-link" | "decline" | "alternative" | "attendees" | ContactPreview | null>(null);
  const [callLink, setCallLink] = useState(sampleCallLink);
  const [declineMessage, setDeclineMessage] = useState<string>(incomingScenario.decline);
  const [alternativeMessage, setAlternativeMessage] = useState<string>(incomingScenario.alternative);
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState<{ screen: Screen; message: string } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const conversationEnd = useRef<HTMLDivElement>(null);
  const lastThread = useRef<{ screen: Screen; length: number } | null>(null);
  const person = people.find(p => p.id === personId) || people[0];
  const recipient = people.find(p => p.id === state.request?.personId) || person;
  const selectedEvent = alumniEvents.find(event => event.id === eventPage.id) ?? aiLecture;
  const inside = appScreens.includes(screen);
  const contactPreview = typeof sheet === "object" ? sheet : null;
  const intent = state.intent;
  const activeIntent = intent?.status === "active" ? intent : null;
  const matchedIntent = matchToIntent ? activeIntent : null;
  const request = state.request;
  const incoming = state.incoming;
  const confirmationMessage = confirmation?.screen === screen ? confirmation.message : "";
  const { notifications } = state.profilePreferences;
  const unreadCount = (notifications.replies && request && request.status !== "completed" ? 1 : 0) + (notifications.requests && incoming?.unread ? 1 : 0);
  const firstName = state.profile.name.trim().split(/\s+/)[0] || "Prathmesh";
  const self = { initials: state.profile.name.split(/\s+/).map(name => name[0]).slice(0, 2).join(""), color: "sage" };
  const eventAttendees = state.registeredEventIds.includes(selectedEvent.id)
    ? [{ ...self, name: state.profile.name, role: state.profile.role, batch: state.profile.batch, id: undefined }, ...selectedEvent.attendees]
    : selectedEvent.attendees;
  const replySent = state.messages.some(message => message.from === "you");

  const go = useCallback((next: Screen, message?: string, event?: EventPage, match = false) => {
    setSheet(null);
    setConfirmation(message ? { screen: next, message } : null);
    if (event) setEventPage(event);
    setMatchToIntent(match);
    window.history.pushState({ screen: next, event, match }, "", event ? `#event/${event.id}` : `#${next}`);
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  useEffect(() => {
    window.history.replaceState({ screen: "welcome" }, "", window.location.pathname);
    const onBack = (event: PopStateEvent) => {
      setSheet(null);
      setConfirmation(null);
      if (event.state?.screen === "event") setEventPage(event.state.event ?? defaultEventPage);
      setMatchToIntent(event.state?.match === true);
      setScreen(event.state?.screen || "welcome");
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("popstate", onBack);
    return () => { window.removeEventListener("popstate", onBack); timers.current.forEach(clearTimeout); };
  }, []);
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [screen]);
  useEffect(() => {
    const length = screen === "received-conversation" ? incoming?.messages.length ?? 0 : state.messages.length;
    if (lastThread.current?.screen === screen && lastThread.current.length < length) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      conversationEnd.current?.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "nearest" });
    }
    lastThread.current = { screen, length };
  }, [state.messages.length, incoming?.messages.length, screen]);
  useEffect(() => {
    if (screen === "home" && request?.status === "completed" && !incoming) dispatch({ type: "introduce-incoming" });
  }, [screen, request?.status, incoming]);
  useEffect(() => {
    if (state.request?.status !== "accepted" || !replySent || state.conversationConfirmed) return;
    const timer = setTimeout(() => dispatch({ type: "confirm-conversation", now: new Date().toISOString() }), 850);
    return () => clearTimeout(timer);
  }, [state.request?.status, replySent, state.conversationConfirmed]);
  useEffect(() => {
    if (incoming?.status !== "accepted" || !incoming.replySent || incoming.callLink) return;
    const timer = setTimeout(() => dispatch({ type: "receive-incoming-call-link" }), 850);
    return () => clearTimeout(timer);
  }, [incoming?.status, incoming?.replySent, incoming?.callLink]);

  function delayed(action: () => void) {
    if (busy) return;
    setBusy(true);
    timers.current.push(setTimeout(() => { action(); setBusy(false); }, 500));
  }
  function title(text: string, subtitle?: string, eyebrow?: string) {
    return <>
      <div className="page-heading">{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1 ref={headingRef} tabIndex={-1}>{text}</h1>{subtitle && <p>{subtitle}</p>}</div>
      {confirmationMessage && <Confirmation message={confirmationMessage} />}
    </>;
  }
  function back(to: Screen, text = "Back", match = false) {
    return <button className="back-link" onClick={() => go(to, undefined, undefined, match)}><ArrowLeft size={19} />{text}</button>;
  }
  function setupHeading(step: 1 | 2, heading: string, description: string) {
    return <>
      <div className="setup-progress" aria-label={`Getting started, step ${step} of 2`}>
        <span>Getting started</span><span aria-hidden="true">{step} / 2</span>
        <div aria-hidden="true"><i className="filled" /><i className={step === 2 ? "filled" : ""} /></div>
      </div>
      {title(heading, description)}
    </>;
  }
  function openPerson(p: Person) { setPersonId(p.id); go("profile", undefined, undefined, Boolean(matchedIntent)); }
  function discoverForIntent() { go("people", undefined, undefined, true); }
  function changeIntentMatch(match: boolean) {
    setMatchToIntent(match);
    window.history.replaceState({ ...window.history.state, match }, "");
  }
  function openEvent(event: AlumniEvent, from: EventPage["from"]) {
    go("event", undefined, { id: event.id, from });
  }
  function compose(p: Person) {
    if (request) { go("request"); return; }
    if (!intent) { go("create"); return; }
    setPersonId(p.id);
    setCommitment(intent.commitment === "Chat" ? "Chat" : p.commitment);
    setRequestMessage(`Hi ${p.name.split(" ")[0]},\n\n${intent.context}`);
    go("compose");
  }
  function freshIntent() {
    dispatch({ type: "new-journey" }); setIntentForm(sampleIntent); setOutcome(sampleOutcome); setRequestMessage(""); go("create");
  }
  function clearDiscoveryFilters() {
    setSearch("");
    setLocation("All locations");
    setExpertise("All expertise");
    setBatchFilter("");
    setDistinguishedOnly(false);
  }
  function restart() {
    timers.current.forEach(clearTimeout); timers.current = [];
    dispatch({ type: "reset" }); setProfileForm(sampleProfile); setBusy(false); setIntentForm(sampleIntent); setOutcome(sampleOutcome); clearDiscoveryFilters(); setFiltersOpen(false); go("welcome");
  }
  function openReceived() { dispatch({ type: "read-incoming" }); go("received-request"); }
  function shareCallLink() { setCallLink(sampleCallLink); setSheet("call-link"); }
  function receivedStatus() {
    return incoming?.status === "accepted" ? "Accepted" : incoming?.status === "declined" ? "Declined" : incoming?.status === "alternative-suggested" ? "Recommendation sent" : "Awaiting your response";
  }
  function incomingHomeCard() {
    return <button className="incoming-card" onClick={openReceived}>
      <Avatar person={riya} />
      <span><span className="request-kicker">{incoming?.unread ? "New request from Riya" : "Request from Riya"}</span><strong>{incomingScenario.title}</strong><span>{incoming?.status === "pending" ? incomingScenario.commitment : receivedStatus()}</span></span>
      <ChevronRight size={19} aria-hidden="true" />
    </button>;
  }
  function personCard(p: Person, compact = false, matched = false) {
    const inDirectory = screen === "people";
    return <article className={`person-card${matched ? " person-match" : ""}${compact ? " person-compact" : ""}${inDirectory ? " discovery-person" : ""}`} key={p.id}>
      {matched && <div className="match-tag"><Sparkles size={14} aria-hidden="true" />Closest match for your intent</div>}
      <button className="person-identity" onClick={() => openPerson(p)} aria-label={`View ${p.name}'s profile`}>
        <Avatar person={p} /><span><strong>{p.name}</strong><span>{p.role} · {p.location}</span></span><ChevronRight size={18} className="muted" aria-hidden="true" />
      </button>
      {!compact && <>
        <p className="person-help">{p.help}</p>
        <div className="card-actions">
          <div className="availability">
            <span><span className="availability-dot" />Open to helping</span>
            <span aria-hidden="true">·</span>
            <span>{p.commitment}</span>
          </div>
          {!inDirectory && (intent || request) && <Button variant="secondary" onClick={() => compose(p)}>{request ? "View request" : "Request help"}</Button>}
        </div>
      </>}
    </article>;
  }
  function intentCard() {
    if (!intent) return null;
    return <button className="intent-card" onClick={() => go("intent")}><div className="row between"><Tag><span className="availability-dot" />{intent.status === "resolved" ? "Resolved" : "Active intent"}</Tag><ChevronRight size={19} aria-hidden="true" /></div><h2>{intent.title}</h2><p>{intent.context}</p><div className="meta"><Clock3 size={15} aria-hidden="true" />{intent.commitment}<span>·</span>{intent.status === "active" ? `${intent.expires} days` : "Closed with feedback"}</div></button>;
  }

  const searchTerm = search.toLowerCase().trim();
  const showingDistinguishedOnly = !matchedIntent && distinguishedOnly;
  const filteredPeople = people.filter(p => {
    const words = `${p.name} ${p.role} ${p.expertise.join(" ")} ${p.help}`.toLowerCase();
    return !showingDistinguishedOnly && words.includes(searchTerm) && (!batchFilter || p.batch === batchFilter)
      && (location === "All locations" || p.location === location)
      && (expertise === "All expertise" || (expertise === "Product & startups" ? p.id !== "kabir" : p.id === "kabir"));
  });
  const discoveryResults = filteredPeople.map(person => ({ person, relevance: matchedIntent ? relevanceToIntent(person, matchedIntent) : 0 }))
    .sort((a, b) => b.relevance - a.relevance);
  const intentSuggestions = activeIntent ? people.map(person => ({ person, relevance: relevanceToIntent(person, activeIntent) }))
    .sort((a, b) => b.relevance - a.relevance) : [];
  const suggestedAlumnus = intentSuggestions[0];
  const showDistinguished = !matchedIntent && (location === "All locations" || location === distinguishedAlumnus.location)
    && (expertise === "All expertise" || expertise === "Engineering")
    && (!batchFilter || distinguishedAlumnus.batch === batchFilter)
    && `${distinguishedAlumnus.name} ${distinguishedAlumnus.role} ${distinguishedAlumnus.expertise} distinguished alumni`.toLowerCase().includes(searchTerm);
  const activeFilterCount = Number(location !== "All locations") + Number(expertise !== "All expertise") + Number(Boolean(batchFilter)) + Number(showingDistinguishedOnly);
  const hasDiscoveryFilters = Boolean(searchTerm || activeFilterCount);
  let content: ReactNode;

  switch (screen) {
    case "welcome": content = <div className="welcome">
      <div className="welcome-top"><a className="wordmark" href="#welcome" onClick={e => { e.preventDefault(); go("welcome"); }}><Layers3 size={25} strokeWidth={1.7} />alumni<span className="wordmark-period">.</span></a><span className="demo-label">Interactive demo</span></div>
      <div className="welcome-hero">
        <div className="welcome-copy">
          <p className="welcome-pretext">Your community. A little closer.</p>
          <h1 ref={headingRef} tabIndex={-1}>Good connections start with a clear ask.</h1>
          <p className="welcome-subtitle">Share what you need. Find an alumnus who can help. Make the conversation count.</p>
        </div>
        <div className="welcome-visual" aria-hidden="true">
          <svg className="welcome-connections" viewBox="0 0 290 206" fill="none"><path d="M145 113 55 62M145 113 238 47M145 113 239 167" /></svg>
          <div className="welcome-hub"><MessageCircle strokeWidth={1.65} /><span><Check size={12} /></span></div>
          <div className="welcome-node welcome-node-left"><Avatar person={people[1]} /></div>
          <div className="welcome-node welcome-node-upper"><Avatar person={people[0]} /></div>
          <div className="welcome-node welcome-node-lower"><Avatar person={riya} /></div>
        </div>
        <div className="welcome-bottom"><Button onClick={() => go("onboard")}>Explore the walkthrough<ArrowRight size={18} aria-hidden="true" /></Button><p>Sample profiles and simulated interactions.</p></div>
      </div>
    </div>; break;

    case "onboard": content = <>{back("welcome", "Welcome")}{setupHeading(1, "Make yourself at home", "A few details help your community recognize you.")}
      <form className="form-card" onSubmit={e => { e.preventDefault(); dispatch({ type: "profile", profile: { ...profileForm, name: profileForm.name.trim(), role: profileForm.role.trim(), location: profileForm.location.trim() } }); go("verify"); }}>
        <div className="notice soft"><Sparkles size={18} aria-hidden="true" /><p>Continue with the sample details or make them your own.</p></div>
        <Field label="Full name"><input required autoComplete="name" maxLength={60} value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} /></Field>
        <div className="form-row"><Field label="Graduation year"><Select value={profileForm.batch} onChange={e => setProfileForm({ ...profileForm, batch: e.target.value })}>{["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2016"].map(y => <option key={y}>{y}</option>)}</Select></Field><Field label="Location"><input required maxLength={45} value={profileForm.location} onChange={e => setProfileForm({ ...profileForm, location: e.target.value })} /></Field></div>
        <Field label="Current role"><input required maxLength={60} value={profileForm.role} onChange={e => setProfileForm({ ...profileForm, role: e.target.value })} /></Field>
        <div className="action-footer"><Button type="submit" disabled={!profileForm.name.trim() || !profileForm.location.trim() || !profileForm.role.trim()}>Continue<ArrowRight size={18} aria-hidden="true" /></Button></div>
      </form></>; break;

    case "verify": content = <>{back("onboard", "Profile details")}{setupHeading(2, "One community. Built on trust.", "Alumni verification helps keep your network relevant and welcoming.")}
      <section className="verification-card">
        <div className="verification-identity"><Avatar person={self} /><div><h2>{state.profile.name}</h2><p>{state.profile.role}</p></div><ShieldCheck size={23} aria-hidden="true" /></div>
        <dl><div><dt>Graduation year</dt><dd>{state.profile.batch}</dd></div><div><dt>Location</dt><dd>{state.profile.location}</dd></div></dl>
        <button className="text-button" onClick={() => go("onboard")}>Edit details</button>
      </section>
      <div className="notice soft"><BadgeCheck size={20} aria-hidden="true" /><div><strong>Verified for this walkthrough</strong><p>You can continue with this demo profile.</p></div></div>
      <div className="action-footer"><Button onClick={() => go("home")}>Enter the network<ArrowRight size={18} aria-hidden="true" /></Button></div>
    </>; break;

    case "home": content = <>{title(`Hi, ${firstName}.`, undefined, "BITS alumni network")}
      {incoming && incomingHomeCard()}
      {!intent ? <section className="home-prompt"><div className="prompt-icon"><MessageCircle size={25} strokeWidth={1.6} /></div><h2>What could your community help with?</h2><p>A fresh perspective, a career question, or a conversation with someone who’s been there.</p><Button onClick={() => go("create")}><Plus size={19} />Create an intent</Button></section> : <><div className="section-heading"><h2>Your intent</h2><button className="text-button" onClick={() => go("intents")}>View</button></div>{intentCard()}{request?.status === "completed" ? <div className="notice soft"><CheckCheck size={20} /><div><strong>You closed the loop.</strong><p>Your outcome has been recorded.</p><button className="text-button" onClick={() => go("success")}>View outcome</button></div></div> : request ? <button className="next-step" onClick={() => go("request")}><MessageCircle size={21} /><span><strong>{request.status === "accepted" ? `${recipient.name.split(" ")[0]} accepted your request` : "Your request is awaiting a response"}</strong><span>{request.status === "accepted" ? "Continue the conversation" : "View your request"}</span></span><ChevronRight size={19} /></button> : <Button className="full-width" onClick={() => go("people")}>Find alumni who can help</Button>}</>}
      <section className="people-preview"><div className="section-heading"><h2>Open to helping</h2><button className="text-button" onClick={() => go("people")}>Browse people<ArrowRight size={15} aria-hidden="true" /></button></div><div className="people-preview-list">{people.slice(0, 2).map(p => personCard(p, true))}</div></section>
    </>; break;

    case "create": content = request ? <>{back("intent")}{title("Your request is already underway.", "Its original context stays with the request. Follow the conversation from here.")}<Button className="full-width" onClick={() => go("request")}>View request</Button></> : <>{back(intent ? "intent" : "home")}{title(intent ? "Edit your intent" : "What do you need?", "A clear ask makes it easier for someone to help.")}
      <form className="form-card" onSubmit={e => { e.preventDefault(); delayed(() => { dispatch({ type: "publish", intent: { ...intentForm, title: intentForm.title.trim(), context: intentForm.context.trim() } }); go("intent", intent ? "Intent updated" : "Intent published"); }); }}>
        <Field label="Intent type"><Select value={intentForm.type} onChange={e => setIntentForm({ ...intentForm, type: e.target.value as IntentForm["type"] })}><option>Seeking advice</option><option>Seeking mentorship</option></Select></Field>
        <Field label="Give it a title" hint="Keep it specific, so the right person recognizes it."><input required minLength={6} maxLength={80} placeholder="e.g. Feedback on my startup idea" value={intentForm.title} onChange={e => setIntentForm({ ...intentForm, title: e.target.value })} /></Field>
        <Field label="A little context" hint={`${intentForm.context.length}/400 characters`}><textarea required minLength={15} maxLength={400} rows={4} placeholder="What are you working on, and what would help?" value={intentForm.context} onChange={e => setIntentForm({ ...intentForm, context: e.target.value })} /></Field>
        <div className="form-row"><Field label="Expected commitment"><Select value={intentForm.commitment} onChange={e => setIntentForm({ ...intentForm, commitment: e.target.value as Commitment })}><option>20-minute call</option><option>30-minute call</option><option>Chat</option></Select></Field><Field label="Expires after"><Select value={intentForm.expires} onChange={e => setIntentForm({ ...intentForm, expires: e.target.value })}><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></Select></Field></div>
        <p className="quiet-note"><Users size={16} />Visible to verified alumni. Closes when resolved or expired.</p>
        <div className="action-footer"><Button type="submit" busy={busy} disabled={intentForm.title.trim().length < 6 || intentForm.context.trim().length < 15}>{intent ? "Save changes" : "Publish intent"}</Button></div>
      </form></>; break;

    case "intents": content = <>{title("Your intents", "What you need, and where it stands.")}{intent ? <>{intentCard()}{!request && <button className="text-button standalone" onClick={() => { setIntentForm(intent); go("create"); }}>Edit intent</button>}{request?.status === "completed" && <Button variant="secondary" className="full-width" onClick={freshIntent}>Try another intent</Button>}</> : <Empty icon={<Layers3 size={27} />} title="Start with a clear ask" action={<Button onClick={() => go("create")}><Plus size={18} />Create an intent</Button>}>Your current needs will appear here, along with the help they lead to.</Empty>}</>; break;

    case "intent": content = intent ? <>
      {back("intents", "Your intents")}{title(intent.title, undefined, "Your intent")}
      <section className="intent-detail">
        <div className="row between"><Tag><span className="availability-dot" />{intent.status === "active" ? "Active" : "Resolved"}</Tag><span className="small muted">{intent.type}</span></div>
        <h2>What I need</h2><p>{intent.context}</p>
        <div className="meta"><span><Clock3 size={15} aria-hidden="true" />{intent.commitment}</span><span>{intent.status === "active" ? `Expires in ${intent.expires} days` : "Outcome recorded"}</span></div>
      </section>
      {!request && <div className="action-footer">
        <Button onClick={discoverForIntent}>Discover alumni<ArrowRight size={17} aria-hidden="true" /></Button>
        <Button variant="quiet" onClick={() => { setIntentForm(intent); go("create"); }}>Edit intent</Button>
      </div>}
      <div className="section-heading"><h2>Alumni who may help</h2></div>
      {personCard(suggestedAlumnus?.person ?? people[0], false, Boolean(suggestedAlumnus?.relevance))}
      {request && <div className="action-footer"><Button onClick={() => go("request")}>View request</Button></div>}
    </> : <Empty icon={<Layers3 size={27} />} title="Create your first intent" action={<Button onClick={() => go("create")}>Create an intent</Button>}>Tell your community what would help right now.</Empty>; break;

    case "people": content = <>{title("Discover alumni", "Find someone with the experience you need.")}
      {activeIntent && <label className="discovery-intent">
        <span><Layers3 size={15} aria-hidden="true" />Match to intent</span>
        <Select value={matchedIntent ? "active" : "all"} onChange={e => changeIntentMatch(e.target.value === "active")}>
          <option value="all">Browse all alumni</option>
          <option value="active">{activeIntent.title}</option>
        </Select>
      </label>}
      <div className="discovery-search">
        <div className="search-field"><Search size={20} aria-hidden="true" /><input type="search" aria-label="Search alumni" placeholder="Name, role or expertise" value={search} onChange={e => setSearch(e.target.value)} />{search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")}><X size={17} /></button>}</div>
        <button type="button" className="filter-toggle" aria-expanded={filtersOpen} aria-controls="discovery-filters" onClick={() => setFiltersOpen(open => !open)}><SlidersHorizontal size={16} aria-hidden="true" />Filters{activeFilterCount > 0 && <span>{activeFilterCount}</span>}</button>
      </div>
      <div id="discovery-filters" className="discovery-filters" role="group" aria-labelledby="filter-label" hidden={!filtersOpen}>
        <div className="filter-heading">
          <span id="filter-label">Filters</span>
          {hasDiscoveryFilters && <button type="button" className="text-button" onClick={clearDiscoveryFilters}>Clear filters</button>}
        </div>
        <div className="filters">
          <Select aria-label="Filter by location" className={location !== "All locations" ? "filter-active" : undefined} value={location} onChange={e => setLocation(e.target.value)}><option>All locations</option><option>Bengaluru</option><option>Gurgaon</option><option>Mumbai</option></Select>
          <Select aria-label="Filter by expertise" className={expertise !== "All expertise" ? "filter-active" : undefined} value={expertise} onChange={e => setExpertise(e.target.value)}><option>All expertise</option><option>Product &amp; startups</option><option>Engineering</option></Select>
          <Select aria-label="Filter by graduation batch" className={batchFilter ? "filter-active" : undefined} value={batchFilter} onChange={e => setBatchFilter(e.target.value)}>
            <option value="">All batches</option>{alumniBatches.map(batch => <option key={batch} value={batch}>Class of {batch}</option>)}
          </Select>
          {!matchedIntent && <button type="button" className="distinguished-filter" aria-pressed={distinguishedOnly} onClick={() => setDistinguishedOnly(value => !value)}>
            {distinguishedOnly ? <Check size={16} aria-hidden="true" /> : <Award size={16} aria-hidden="true" />}Distinguished only
          </button>}
        </div>
      </div>
      {showDistinguished && <section aria-labelledby="distinguished-heading">
        <div className="section-heading"><h2 id="distinguished-heading">Distinguished Alumni</h2></div>
        <button className="distinguished-card person-identity" onClick={() => go("distinguished-profile")} aria-label={`View ${distinguishedAlumnus.name}'s profile`}>
          <Avatar person={distinguishedAlumnus} />
          <span><strong>{distinguishedAlumnus.name}</strong><span>{distinguishedAlumnus.role} · {distinguishedAlumnus.location}</span><span className="discovery-award">{distinguishedAlumnus.award.name} · {distinguishedAlumnus.award.year}</span></span>
          <Award size={19} aria-hidden="true" /><ChevronRight size={17} aria-hidden="true" />
        </button>
      </section>}
      {filteredPeople.length > 0 && <>
        <div className="section-heading"><h2>{matchedIntent ? "Recommended alumni" : hasDiscoveryFilters ? "Search results" : "Open to helping"}</h2><span className="small muted" role="status">{filteredPeople.length} alumni</span></div>
        <div className="discovery-results">{discoveryResults.map(({ person, relevance }, index) => personCard(person, false, index === 0 && relevance > 0))}</div>
      </>}
      {!filteredPeople.length && !showDistinguished && <Empty icon={<Search size={27} />} title="No alumni found">Try another name or broaden your filters.</Empty>}
    </>; break;

    case "distinguished-profile": {
      const { name, role, company, batch, degree, fieldOfStudy, location: city, award, milestones } = distinguishedAlumnus;
      content = <>
        <header className="alumni-profile-header">{back("people", "People")}<span>Alumni profile</span></header>
        <div className="alumni-profile-content">
          <div className="alumni-profile-identity">
            <Avatar person={distinguishedAlumnus} size="large" />
            <div>
              <h1 ref={headingRef} tabIndex={-1}>{name}</h1>
              <p>{role} · {company}</p>
              <p className="distinguished-education">{degree} {batch}, {fieldOfStudy}</p>
              <div className="meta"><span><MapPin size={15} aria-hidden="true" />{city}</span></div>
            </div>
          </div>
          <section className="recognition-card">
            <button className="recognition-badge" onClick={() => setSheet({ title: award.name, value: `${award.issuer} · ${award.year}. ${award.reason}` })}>
              <Award size={17} aria-hidden="true" />Distinguished Alumni<ChevronRight size={15} aria-hidden="true" />
            </button>
            <h2>{award.name}</h2><p>{award.issuer} · {award.year}</p>
            <small>Sample profile and recognition</small>
          </section>
          <section className="alumni-profile-section">
            <h2>Milestones &amp; accomplishments</h2>
            <ol className="milestone-list">
              {milestones.map(({ title, detail }) => <li key={title}><h3>{title}</h3><p>{detail}</p></li>)}
            </ol>
          </section>
          <section className="alumni-profile-section">
            <h2>Upcoming lecture</h2>
            <div className="event-host-preview"><CalendarDays size={20} aria-hidden="true" /><div><strong>{aiLecture.title}</strong><p>{aiLecture.duration} · {aiLecture.format}</p></div></div>
          </section>
        </div>
        <footer className="alumni-profile-action">
          <Button className="full-width" onClick={() => openEvent(aiLecture, "distinguished-profile")}>View lecture<ArrowRight size={18} aria-hidden="true" /></Button>
        </footer>
      </>;
      break;
    }

    case "events": content = <>{title("Events", "Talks, panels, and meetups in your alumni network.")}
      <button className="event-featured" onClick={() => openEvent(aiLecture, "events")}>
        <span className="featured-host">
          <Avatar person={distinguishedAlumnus} />
          <span><strong>{aiLecture.host}</strong><small><Award size={14} aria-hidden="true" />Distinguished alum</small></span>
        </span>
        <span className="event-category">{aiLecture.category}</span>
        <strong className="featured-event-title">{aiLecture.title}</strong>
        <span className="event-card-date"><CalendarDays size={15} aria-hidden="true" /><span><time dateTime={aiLecture.date}>{eventDateLabel(aiLecture.date, "short")}</time> · {aiLecture.time}</span></span>
        <span className="featured-event-action">
          <span className="event-status">{state.registeredEventIds.includes(aiLecture.id) ? "Registered" : "Registration open"}</span>
          <span>View details<ArrowRight size={17} aria-hidden="true" /></span>
        </span>
      </button>
      <section aria-labelledby="other-events-heading">
        <div className="section-heading"><h2 id="other-events-heading">Also coming up</h2></div>
        <div className="event-list">
          {alumniEvents.filter(event => event.id !== aiLecture.id).map(event => {
            const { day, month } = eventDateBadge(event.date);
            return <button key={event.id} className="event-card" onClick={() => openEvent(event, "events")}>
              <span className="event-date-badge" aria-hidden="true"><strong>{day}</strong><small>{month}</small></span>
              <span className="event-card-copy">
                <span className="event-category">{event.category} · {event.format}</span>
                <strong>{event.title}</strong>
                <span className="event-category"><time dateTime={event.date}>{eventDateLabel(event.date, "short")}</time> · Registration opens soon</span>
              </span>
              <ChevronRight size={16} aria-hidden="true" />
            </button>;
          })}
        </div>
      </section>
    </>; break;

    case "event": {
      const registered = state.registeredEventIds.includes(selectedEvent.id);
      const hasDistinguishedHost = selectedEvent.id === aiLecture.id;
      content = <>
        <header className="alumni-profile-header">{back(eventPage.from, eventPage.from === "events" ? "Events" : "Alumni profile")}<span>Event details</span></header>
        <div className="event-detail-content">
          {title(selectedEvent.title, undefined, selectedEvent.category)}
          <section className="event-host-card" aria-label="Hosted by">
            <span>Hosted by</span>
            <div className="event-host">
              {hasDistinguishedHost ? <Avatar person={distinguishedAlumnus} /> : <span className="event-host-icon"><CalendarDays size={21} aria-hidden="true" /></span>}
              <div><strong>{selectedEvent.host}</strong>{hasDistinguishedHost && <span>{distinguishedAlumnus.role}, {distinguishedAlumnus.company} · Class of {distinguishedAlumnus.batch}</span>}</div>
              {hasDistinguishedHost && <Award className="event-host-award" size={18} role="img" aria-label="Distinguished alum" />}
            </div>
          </section>
          <dl className="event-facts" aria-label="Schedule and format">
            <div><dt><CalendarDays size={16} aria-hidden="true" /><span className="sr-only">Date</span></dt><dd><time dateTime={selectedEvent.date}>{eventDateLabel(selectedEvent.date, "full")}</time></dd></div>
            <div><dt><Clock3 size={16} aria-hidden="true" /><span className="sr-only">Time and duration</span></dt><dd>{selectedEvent.time} · {selectedEvent.duration}</dd></div>
            <div><dt>{selectedEvent.format.startsWith("Online") ? <Video size={16} aria-hidden="true" /> : <MapPin size={16} aria-hidden="true" />}<span className="sr-only">Format</span></dt><dd>{selectedEvent.format}</dd></div>
          </dl>
          <section className="detail-section"><h2>About this event</h2><p>{selectedEvent.description}</p></section>
          <section className="event-attendance" aria-labelledby="event-attendance-heading">
            <h2 id="event-attendance-heading">Who’s coming</h2>
            <div className="event-attendance-summary">
              <div className="event-attendance-preview">
                <span className="event-attendee-avatars" aria-hidden="true">{eventAttendees.slice(0, 4).map(attendee =>
                  <Avatar key={attendee.id ?? "you"} person={attendee} size="small" />
                )}</span>
                <span className="event-attendee-count" role="status">{eventAttendees.length} going</span>
              </div>
              {eventAttendees.length > 0 && <button type="button" className="text-button event-attendees-link" aria-haspopup="dialog" onClick={() => setSheet("attendees")}>
                See all attendees<ChevronRight size={15} aria-hidden="true" />
              </button>}
            </div>
          </section>
        </div>
        <footer className="event-action">
          <Button className="full-width" disabled={registered || !selectedEvent.registrationOpen} onClick={() => {
            dispatch({ type: "register-event", eventId: selectedEvent.id });
            setConfirmation({ screen: "event", message: "You’re registered for this lecture." });
          }}>{registered ? "Registered" : selectedEvent.registrationOpen ? <>Register<ArrowRight size={17} aria-hidden="true" /></> : "Registration opens soon"}</Button>
        </footer>
      </>;
      break;
    }

    case "profile": {
      const contacts = [
        { label: "LinkedIn", title: "Sample LinkedIn profile", value: `linkedin.com/in/demo-${person.name.toLowerCase().replaceAll(" ", "-")}`, icon: <Linkedin size={19} aria-hidden="true" /> },
        {
          label: "Gmail", title: "Sample email address", value: `${person.name.toLowerCase().replaceAll(" ", ".")}@example.com`,
          icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 7v10.5h3V9.3m11 0v8.2h3V7M3.5 7l8.5 6.4L20.5 7m-17 0 2-2 6.5 5 6.5-5 2 2" /></svg>,
        },
        { label: "Portfolio", title: "Sample portfolio", value: `${person.id}.example.com`, icon: <BriefcaseBusiness size={19} aria-hidden="true" /> },
      ];
      content = <>
        <header className="alumni-profile-header">{back("people", "People", Boolean(matchedIntent))}<span>Alumni profile</span></header>
        <div className="alumni-profile-content">
          <div className="alumni-profile-identity">
            <Avatar person={person} size="large" />
            <div>
              <h1 ref={headingRef} tabIndex={-1}>{person.name}</h1>
              <p>{person.role} · {person.company}</p>
              <div className="meta"><span><MapPin size={15} aria-hidden="true" />{person.location}</span><span><GraduationCap size={15} aria-hidden="true" />Class of {person.batch}</span></div>
            </div>
          </div>
          <section className="alumni-profile-help">
            <Tag><span className="availability-dot" />Open to helping</Tag>
            <h2><span><MessageCircle size={16} aria-hidden="true" /></span>How I can help</h2>
            <p>{person.help}</p>
            <strong><Clock3 size={15} aria-hidden="true" />{person.commitment}</strong>
          </section>
          <section className="alumni-profile-section"><h2>Expertise</h2><ul className="alumni-profile-chips">{person.expertise.map(topic => <li key={topic}>{topic}</li>)}</ul></section>
          <section className="alumni-profile-section"><h2>About</h2><p>{person.about}</p></section>
          {!!person.currentIntents?.length && <section className="alumni-profile-section">
            <h2>Current intents</h2>
            <ul className="alumni-profile-intents">{person.currentIntents.map(entry => <li key={entry.title}><strong>{entry.title}</strong><p>{entry.status}</p></li>)}</ul>
          </section>}
          <section className="alumni-profile-section"><h2>Communities</h2><ul className="alumni-profile-chips community-chips">{person.communities.map(community => <li key={community}>{community}</li>)}</ul></section>
          <section className="alumni-profile-contact">
            <h2>Contact &amp; links</h2>
            <div>{contacts.map(({ label, title, value, icon }) => <button key={label} type="button" title={label} aria-label={label} onClick={() => setSheet({ title, value })}>{icon}</button>)}</div>
          </section>
        </div>
        <footer className="alumni-profile-action">
          <Button className="full-width" onClick={() => compose(person)}>{request ? "View request" : "Request help"}<ArrowRight size={18} aria-hidden="true" /></Button>
        </footer>
      </>;
      break;
    }

    case "compose": content = intent ? <>
      {back("profile", "Alumni profile")}{title("Send a request", "Let them know what you’d like help with and how much time you’re asking for.")}
      <div className="recipient-card">
        <div className="profile-summary"><Avatar person={person} /><div><span>To</span><strong>{person.name}</strong><p>{person.role} · {person.location}</p></div></div>
        <div className="recipient-intent"><Layers3 size={17} aria-hidden="true" /><div><span>Your intent</span><strong>{intent.title}</strong></div></div>
      </div>
      <form className="form-card" onSubmit={e => { e.preventDefault(); delayed(() => { dispatch({ type: "request", request: { personId: person.id, message: requestMessage.trim(), commitment } }); go("request", `Delivered to ${person.name}`); }); }}>
        <Field label="Your message" hint="Share the context and what you’d like their perspective on."><textarea required minLength={15} maxLength={600} rows={5} value={requestMessage} onChange={e => setRequestMessage(e.target.value)} /></Field>
        <Field label="Requested commitment"><Select value={commitment} onChange={e => setCommitment(e.target.value as Commitment)}><option>{person.commitment}</option><option>Chat</option></Select></Field>
        <p className="quiet-note"><ShieldCheck size={16} aria-hidden="true" />Only this alumnus receives your request.</p>
        <div className="action-footer"><Button type="submit" busy={busy} disabled={requestMessage.trim().length < 15}>Send request<Send size={17} aria-hidden="true" /></Button><Button variant="quiet" type="button" onClick={() => go("profile")}>Cancel</Button></div>
      </form>
    </> : <Empty icon={<Layers3 size={27} />} title="Start with an intent" action={<Button onClick={() => go("create")}>Create an intent</Button>}>A request needs a little context about what you need.</Empty>; break;

    case "requests": content = <>{title("Your requests", "Keep track of the help you’ve asked for and the requests you’ve received.")}
      {incoming && <section><div className="section-heading"><h2>Received</h2></div>{incomingHomeCard()}</section>}
      {request && <section>
        <div className="section-heading"><h2>Sent</h2></div>
        <button className="request-list-card" onClick={() => go("request")}>
          <div className="row between"><Tag warm={request.status === "pending"}>{request.status === "pending" ? "Awaiting response" : request.status === "accepted" ? "Accepted" : "Completed"}</Tag><ChevronRight size={19} aria-hidden="true" /></div>
          <h2>{request.intentTitle}</h2>
          <div className="row gap"><Avatar person={recipient} size="small" /><span>{recipient.name}<span className="block small muted">{request.commitment}</span></span></div>
        </button>
      </section>}
      {!request && !incoming && <Empty icon={<MessageCircle size={27} />} title="Good conversations start here" action={<Button onClick={() => go(intent ? "people" : "create")}>{intent ? "Discover alumni" : "Create an intent"}</Button>}>Find someone open to helping and send a specific request.</Empty>}
    </>; break;

    case "request": content = request ? <>
      {back("requests", "Requests")}{title(request.status === "pending" ? "Request sent" : request.status === "accepted" ? "You’re connected." : "Interaction completed", undefined, "Sent request")}
      <article className="request-detail-card">
        <div className="profile-summary"><Avatar person={recipient} /><div><strong>{recipient.name}</strong><p>{recipient.role}</p></div></div>
        <h2>{request.intentTitle}</h2><p className="preserve-lines">{request.message}</p>
        <div className="meta"><Clock3 size={16} aria-hidden="true" />{request.commitment}</div>
      </article>
      <ol className="request-progress">
        {(request.status !== "pending" || !confirmationMessage) && <li className="status-line"><span className="status-check"><Check size={15} aria-hidden="true" /></span><div><strong>Request delivered</strong><p>Context and time commitment shared.</p></div></li>}
        <li className="status-line"><span className={request.status === "pending" ? "status-check status-waiting" : "status-check"}>{request.status === "pending" ? <Clock3 size={15} aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}</span><div><strong>{request.status === "pending" ? "Awaiting response" : `${recipient.name.split(" ")[0]} accepted`}</strong><p>{request.status === "pending" ? "Once accepted, you can arrange a time together." : "You can arrange the interaction in your conversation."}</p></div></li>
      </ol>
      {request.status === "pending" ? <div className="demo-control">
        <span className="eyebrow">Walkthrough</span><p>See what happens when {recipient.name.split(" ")[0]} accepts.</p>
        <Button variant="secondary" busy={busy} onClick={() => delayed(() => { dispatch({ type: "accept" }); setConfirmation({ screen: "request", message: `${recipient.name.split(" ")[0]} accepted your request.` }); })}>Preview acceptance<ArrowRight size={17} aria-hidden="true" /></Button>
      </div> : <div className="action-footer"><Button onClick={() => go(request.status === "completed" ? "success" : "conversation")}>{request.status === "completed" ? "View outcome" : "Open conversation"}<ArrowRight size={17} aria-hidden="true" /></Button></div>}
    </> : <Empty icon={<MessageCircle size={27} />} title="No request yet" action={<Button onClick={() => go("people")}>Discover alumni</Button>}>Your next conversation starts with a clear ask.</Empty>; break;

    case "received-request": content = incoming ? <>
      {back("requests", "Requests")}{title(incomingScenario.title, "Interview experience and preparation", "Incoming request")}
      <div className="request-detail-card">
        <div className="profile-summary"><Avatar person={riya} /><div><strong>{incomingScenario.name}</strong><p>Class of {incomingScenario.batch} · Verified alumna</p></div></div>
        <h2>Riya’s intent</h2><p>{incomingScenario.message}</p>
        <div className="row between request-meta"><div className="meta"><Clock3 size={16} aria-hidden="true" />{incomingScenario.commitment}</div><Tag warm={incoming.status === "pending"}>{receivedStatus()}</Tag></div>
      </div>
      {incoming.status === "pending" ? <div className="action-footer">
        <Button onClick={() => { dispatch({ type: "respond-incoming", response: "accepted" }); go("received-conversation"); }}>Accept request</Button>
        <Button variant="secondary" onClick={() => { setAlternativeMessage(incomingScenario.alternative); setSheet("alternative"); }}>Suggest an alternative</Button>
        <Button variant="quiet" onClick={() => { setDeclineMessage(incomingScenario.decline); setSheet("decline"); }}>Decline request</Button>
      </div> : incoming.status === "accepted" ? <div className="action-footer"><Button onClick={() => go("received-conversation")}>Open conversation</Button></div> : <>
        <section className="detail-section"><h2>{incoming.status === "declined" ? "Your response has been sent" : "Alumnus recommended to Riya"}</h2><p>{incoming.response}</p></section>
        <div className="notice soft"><MessageCircle size={20} /><p>{incoming.status === "declined" ? "You declined this request. Riya can continue looking for help." : "Riya can review your recommendation and reach out to Kabir."}</p></div>
        <Button variant="secondary" className="full-width" onClick={() => go("home")}>Back to home</Button>
      </>}
    </> : <>{back("requests")}{title("No incoming request yet", "Finish your first interaction and return home.")}</>; break;

    case "received-conversation": content = incoming?.status === "accepted" ? <>
      {back("received-request", "Request")}
      <div className="conversation-person"><Avatar person={riya} /><div><h1 ref={headingRef} tabIndex={-1}>{incomingScenario.name}</h1><p>Class of {incomingScenario.batch}</p></div><BadgeCheck size={21} className="teal" aria-label="Verified alumna" role="img" /></div>
      <div className="conversation-context"><span><Check size={15} aria-hidden="true" />Request accepted</span><strong>{incomingScenario.title}</strong><small>{incomingScenario.commitment}</small></div>
      <Thread messages={incoming.messages} name="Riya">
        {incoming.replySent && !incoming.callLink && <p className="replying"><LoaderCircle size={14} className="spin" />Riya is replying…</p>}
      </Thread>
      {!incoming.replySent ? <div className="guided-compose"><div className="guided-label"><label htmlFor="incoming-reply" className="field-label">Your reply</label><span id="incoming-reply-hint" className="field-hint">Walkthrough reply</span></div><textarea id="incoming-reply" readOnly value={incomingScenario.reply} rows={3} aria-describedby="incoming-reply-hint" /><Button onClick={() => dispatch({ type: "send-incoming-reply", now: new Date().toISOString() })}><Send size={18} aria-hidden="true" />Send message</Button></div> : <>
        {incoming.callLink && incoming.meeting && <section className="calendar-card" aria-label="Agreed call">
          <CalendarDays size={23} /><div><h2>AI interview prep with Riya</h2><p>{interviewTimeLabel(incoming.meeting)}</p></div>
          <a className="button secondary" href={googleCalendarUrl(incoming.meeting, incoming.callLink, state.profile.name)} target="_blank" rel="noopener noreferrer">Add to Google Calendar</a>
          <span className="field-hint">Review and save in Google Calendar · opens a new tab</span>
        </section>}
        <p className="quiet-note"><CheckCheck size={16} />Your reply has been sent to Riya.</p>
      </>}
      <div ref={conversationEnd} className="conversation-end" />
    </> : <>{back("received-request")}{title("Review the request first")}<Button onClick={openReceived}>View Riya’s request</Button></>; break;

    case "conversation": content = request && request.status !== "pending" ? <>
      {back("request", "Request")}
      <div className="conversation-person"><Avatar person={recipient} /><div><h1 ref={headingRef} tabIndex={-1}>{recipient.name}</h1><p>{recipient.role}</p></div><BadgeCheck size={21} className="teal" aria-label="Verified alumnus" role="img" /></div>
      <div className="conversation-context"><span><Check size={15} aria-hidden="true" />{request.status === "completed" ? "Interaction completed" : "Request accepted"}</span><strong>{request.intentTitle}</strong><small>{request.commitment}</small></div>
      <Thread messages={state.messages} name={recipient.name.split(" ")[0]}>
        {replySent && !state.conversationConfirmed && request.status === "accepted" && <p className="replying"><LoaderCircle size={14} className="spin" />{recipient.name.split(" ")[0]} is replying…</p>}
      </Thread>
      {state.conversationConfirmed && !state.callLink && request.status === "accepted" && <div className="call-link-action"><Button type="button" onClick={shareCallLink}><Video size={18} aria-hidden="true" />Share a call link</Button></div>}
      {confirmationMessage && <Confirmation message={confirmationMessage} />}
      {state.callLink && state.meeting && <section className="calendar-card" aria-label="Agreed call">
        <CalendarDays size={23} /><div><h2>Startup feedback with {recipient.name.split(" ")[0]}</h2><p>{interviewTimeLabel(state.meeting)}</p></div>
        <a className="button secondary" href={googleCalendarUrl(state.meeting, state.callLink, state.profile.name, { title: `Startup feedback with ${recipient.name.split(" ")[0]}`, otherName: recipient.name, context: `${request.intentTitle}\n\n${request.message}` })} target="_blank" rel="noopener noreferrer">Add to Google Calendar</a>
        <span className="field-hint">Review and save in Google Calendar · opens a new tab</span>
      </section>}
      {request.status === "accepted" && <>
        {!replySent && <div className="guided-compose">
          <div className="guided-label"><label htmlFor="demo-message" className="field-label">Your reply</label><span id="demo-message-hint" className="field-hint">Walkthrough reply</span></div>
          <textarea id="demo-message" readOnly value={demoReply} rows={3} aria-describedby="demo-message-hint" />
          <Button type="button" onClick={() => dispatch({ type: "send-demo-message" })}><Send size={18} />Send message</Button>
        </div>}
        {state.conversationConfirmed && <div className="after-conversation"><span>After your conversation</span><Button variant="secondary" onClick={() => { setOutcome(sampleOutcome); go("outcome"); }}>Record the outcome</Button></div>}
      </>}
      <div ref={conversationEnd} className="conversation-end" />
    </> : <Empty icon={<MessageCircle size={27} />} title="Your conversation starts after acceptance" action={<Button onClick={() => go("request")}>View request</Button>}>Both people agree before the interaction begins.</Empty>; break;

    case "outcome": content = request?.status === "accepted" ? <>
      {back("conversation", "Conversation")}{title("How did it go?", "A quick check-in helps close the loop.", "Interaction outcome")}
      <div className="outcome-context"><Avatar person={recipient} size="small" /><div><strong>{request.intentTitle}</strong><p>With {recipient.name} · {request.commitment}</p></div></div>
      <form onSubmit={e => { e.preventDefault(); if (outcome.happened === false) { go("request", "Your request and intent are still open."); return; } delayed(() => { dispatch({ type: "outcome", outcome: outcome as Outcome }); go("success"); }); }}>
        <fieldset className="question"><legend>Did the conversation happen?</legend><div className="choices"><Choice name="happened" value="yes" selected={outcome.happened === true} onSelect={() => setOutcome({ happened: true })}>Yes</Choice><Choice name="happened" value="not-yet" selected={outcome.happened === false} onSelect={() => setOutcome({ happened: false })}>Not yet</Choice></div></fieldset>
        {outcome.happened === true && <div className="reveal">
          <fieldset className="question"><legend>Was it helpful?</legend><div className="choices">{(["Yes", "Partly", "No"] as const).map(value => <Choice key={value} name="helpful" value={value} selected={outcome.helpful === value} onSelect={() => setOutcome({ ...outcome, helpful: value })}>{value}</Choice>)}</div></fieldset>
          <fieldset className="question"><legend>Is your original need resolved?</legend><div className="choices vertical"><Choice name="resolved" value="yes" selected={outcome.resolved === true} onSelect={() => setOutcome({ ...outcome, resolved: true })}>Yes, mark my intent resolved</Choice><Choice name="resolved" value="no" selected={outcome.resolved === false} onSelect={() => setOutcome({ ...outcome, resolved: false })}>No, keep my intent active</Choice></div></fieldset>
          <p className="quiet-note">Completing an interaction doesn’t have to close your intent.</p>
        </div>}
        {outcome.happened === false && <div className="notice soft"><Clock3 size={20} aria-hidden="true" /><p>Your request can stay open until you’ve had the conversation.</p></div>}
        <div className="action-footer"><Button type="submit" busy={busy} disabled={outcome.happened === undefined || (outcome.happened && (!outcome.helpful || outcome.resolved === undefined))}>{outcome.happened === false ? "Keep request open" : "Save outcome"}</Button><Button type="button" variant="quiet" onClick={() => go("conversation")}>Skip for now</Button></div>
      </form>
    </> : <Empty icon={<CheckCheck size={27} />} title="Nothing to record yet" action={<Button onClick={() => go("request")}>View request</Button>}>Record the outcome after an accepted interaction.</Empty>; break;

    case "success": content = request?.status === "completed" ? <div className="success-page">
      <div className="success-hero"><div className="success-icon"><CheckCheck size={33} strokeWidth={1.6} aria-hidden="true" /></div>{title("Thanks for closing the loop.", intent?.status === "resolved" ? "Your interaction is complete and your intent is resolved." : "Your interaction is complete. Your intent stays open for more help.")}</div>
      <section className="summary-card">
        <h2>{request.intentTitle}</h2><p>With {recipient.name}</p>
        <dl><div><dt>Conversation</dt><dd>Completed</dd></div><div><dt>Helpful?</dt><dd>{request.outcome?.helpful}</dd></div><div><dt>Intent</dt><dd>{intent?.status === "resolved" ? "Resolved" : "Still active"}</dd></div></dl>
      </section>
      <Button onClick={() => go("home")}>Back to home<ArrowRight size={18} aria-hidden="true" /></Button><Button variant="quiet" onClick={() => go("intent")}>View intent</Button>
    </div> : <Empty icon={<CheckCheck size={27} />} title="Your outcome will appear here" action={<Button onClick={() => go("requests")}>View requests</Button>}>Complete the interaction and record how it went.</Empty>; break;

    case "my-profile":
    case "profile-preview": {
      const preview = screen === "profile-preview";
      const { name, role, batch, location: city } = state.profile;
      const { bio, expertise: skills, help, email, phone, linkedin, portfolio } = state.profileDetails;
      const { available, commitment: format, emailVisibility, phoneVisibility } = state.profilePreferences;
      const expertiseList = [...new Set(skills.split(",").map(skill => skill.trim()).filter(Boolean))];
      const communities = [...new Set(["BITS", city, "Software Engineering"])];
      const showEmail = email && (!preview || emailVisibility === "alumni");
      const showPhone = phone && (!preview || phoneVisibility === "alumni");
      const links = [
        { label: "LinkedIn", url: linkedin, sample: linkedin === sampleProfileLinks.linkedin, icon: <Linkedin size={18} aria-hidden="true" /> },
        { label: "Portfolio", url: portfolio, sample: portfolio === sampleProfileLinks.portfolio, icon: <BriefcaseBusiness size={18} aria-hidden="true" /> },
      ].filter(({ url }) => url && isValidCallLink(url));
      content = <>
        <header className="alumni-profile-header">
          {preview ? back("my-profile", "Your profile") : back("home", "Home")}
          <span>{preview ? "Profile preview" : "Your profile"}</span>
        </header>
        <div className="alumni-profile-content">
          {preview && <p className="self-profile-preview"><Eye size={16} aria-hidden="true" />Viewing as a verified alumnus</p>}
          <div className="alumni-profile-identity self-profile-identity">
            <Avatar person={self} size="large" />
            <div>
              <h1 ref={headingRef} tabIndex={-1}>{name}</h1>
              <p>{role}</p>
              <div className="meta"><span><MapPin size={15} aria-hidden="true" />{city}</span><span><GraduationCap size={15} aria-hidden="true" />Class of {batch}</span></div>
            </div>
          </div>
          {confirmationMessage && <Confirmation message={confirmationMessage} />}
          {!preview && <>
            <div className="self-profile-actions">
              <Button onClick={() => go("profile-edit")}>Edit profile</Button>
              <Button variant="secondary" onClick={() => go("profile-settings")}><Settings size={17} aria-hidden="true" />Settings</Button>
            </div>
            <button type="button" className="text-button self-profile-link" onClick={() => go("profile-preview")}><Eye size={16} aria-hidden="true" />Preview how alumni see you</button>
          </>}
          {(!preview || available || help) && <section className="alumni-profile-help self-profile-help" data-available={available}>
            <Tag>{available && <span className="availability-dot" />}{available ? "Open to helping" : "Availability paused"}</Tag>
            <h2><span><MessageCircle size={16} aria-hidden="true" /></span>How I can help</h2>
            {help && <p>{help}</p>}
            {available && <strong><Clock3 size={15} aria-hidden="true" />{format}</strong>}
            {!preview && <button type="button" className="text-button self-profile-link" onClick={() => go("profile-settings")}>Manage availability<ChevronRight size={15} aria-hidden="true" /></button>}
          </section>}
          {bio && <section className="alumni-profile-section"><h2>About</h2><p>{bio}</p></section>}
          {expertiseList.length > 0 && <section className="alumni-profile-section"><h2>Expertise</h2><ul className="alumni-profile-chips">{expertiseList.map(skill => <li key={skill}>{skill}</li>)}</ul></section>}
          <section className="alumni-profile-section"><h2>Communities</h2><ul className="alumni-profile-chips community-chips">{communities.map(community => <li key={community}>{community}</li>)}</ul></section>
          {(showEmail || showPhone || links.length > 0) && <section className="alumni-profile-contact">
            <h2>Contact &amp; links</h2>
            <div>
              {links.map(({ label, url, sample, icon }) => sample
                ? <button key={label} type="button" aria-label={label} title={label} onClick={() => setSheet({ title: `Sample ${label}`, value: url })}>{icon}</button>
                : <a key={label} href={url} target="_blank" rel="noreferrer" aria-label={label} title={label}>{icon}</a>)}
              {showEmail && <button type="button" aria-label="Email" title="Email" onClick={() => setSheet({ title: "Email", value: email })}><Mail size={18} aria-hidden="true" /></button>}
              {showPhone && <button type="button" aria-label="Phone" title="Phone" onClick={() => setSheet({ title: "Phone", value: phone })}><Phone size={18} aria-hidden="true" /></button>}
            </div>
          </section>}
          {activeIntent && <section className="alumni-profile-section">
            <h2>{preview ? "Current intent" : "Your intent"}</h2>
            {preview ? <ul className="alumni-profile-intents"><li><strong>{activeIntent.title}</strong><p>{activeIntent.commitment}</p></li></ul> :
              <button type="button" className="self-profile-intent" onClick={() => go("intent")}><div><strong>{activeIntent.title}</strong><span>Active · {activeIntent.commitment}</span></div><ChevronRight size={17} aria-hidden="true" /></button>}
          </section>}
          {!preview && <section className="account-demo">
            <Button variant="quiet" onClick={restart}><RotateCcw size={16} aria-hidden="true" />Restart walkthrough</Button>
          </section>}
        </div>
      </>;
      break;
    }

    case "profile-edit": content = <>
      {back("my-profile", "Your profile")}{title("Edit profile")}
      <EditProfileForm details={state.profileDetails} onSave={details => {
        dispatch({ type: "profile-details", details });
        go("my-profile", "Profile updated");
      }} />
    </>; break;

    case "profile-settings": content = <>
      {back("my-profile", "Your profile")}{title("Profile settings")}
      <ProfileSettingsForm preferences={state.profilePreferences} onSave={preferences => {
        dispatch({ type: "profile-preferences", preferences });
        go("my-profile", "Settings saved");
      }} />
    </>; break;
  }

  const isAlumniProfile = screen === "profile" || screen === "distinguished-profile";
  const usesProfileLayout = isAlumniProfile || screen === "my-profile" || screen === "profile-preview";
  const selectedTab = screen === "events" || screen === "event" ? "events" : ["create", "intent", "intents"].includes(screen) ? "intents" : screen === "people" || isAlumniProfile ? "people" : ["compose", "requests", "request", "conversation", "outcome", "success", "received-request", "received-conversation"].includes(screen) ? "requests" : "home";
  return <div className={`app-shell${inside ? " workspace-shell" : ""}`} data-screen={screen}>
    {inside && <header className="app-header">
      <button className="wordmark" onClick={() => go("home")} aria-label="Alumni home"><Layers3 size={23} strokeWidth={1.7} aria-hidden="true" />alumni<span className="wordmark-period">.</span></button>
      <button className="account-button" aria-label="Your profile" onClick={() => go("my-profile")}><Avatar person={self} size="small" /><span className="account-name">{firstName}</span></button>
    </header>}
    <main id="main-content" className={screen === "welcome" ? "welcome-main" : usesProfileLayout ? "alumni-profile" : screen === "event" ? "event-page" : "main-content"} key={screen}>{content}</main>
    <Sheet open={sheet !== null} title={contactPreview?.title ?? (sheet === "attendees" ? "Who’s coming" : sheet === "call-link" ? "Share a call link" : sheet === "decline" ? "Decline request" : "Suggest an alternative")} onClose={() => setSheet(null)}>
      {sheet === "attendees" ? <>
        <p className="event-attendee-event">{selectedEvent.title}</p>
        <ul className="event-attendee-list" aria-label="Attendees">
          {eventAttendees.map(attendee => <li key={attendee.id ?? "you"}>
            <Avatar person={attendee} size="small" />
            <div><strong>{attendee.name}{!attendee.id && " (you)"}</strong><span>{attendee.role} · Class of {attendee.batch}</span></div>
          </li>)}
        </ul>
      </> : contactPreview ? <p className="alumni-contact-value">{contactPreview.value}</p> : sheet === "call-link" ? <form onSubmit={e => { e.preventDefault(); if (!isValidCallLink(callLink.trim())) return; dispatch({ type: "share-call-link", url: callLink, target: "sent" }); setSheet(null); setConfirmation({ screen: "conversation", message: "Call link shared in the conversation." }); }}>
        <Field label="Call link"><input type="url" required value={callLink} onChange={e => setCallLink(e.target.value)} /></Field>
        <p className="field-hint">This sample link is shared in the chat. No meeting opens.</p>
        <div className="action-footer"><Button type="submit" disabled={!isValidCallLink(callLink.trim())}>Share link</Button></div>
      </form> : (sheet === "decline" || sheet === "alternative") && <form onSubmit={e => { e.preventDefault(); const message = sheet === "decline" ? declineMessage : alternativeMessage; if (!message.trim()) return; dispatch({ type: "respond-incoming", response: sheet === "decline" ? "declined" : "alternative-suggested", message }); setSheet(null); setConfirmation({ screen: "received-request", message: "Your response has been sent to Riya." }); }}>
        {sheet === "alternative" && <div className="recommendation-person"><Avatar person={people[2]} /><div><strong>{people[2].name}</strong><p>{people[2].role} · Class of {people[2].batch}</p><span>System design · Engineering careers</span></div></div>}
        <Field label={sheet === "decline" ? "Message to Riya" : "Recommend Kabir to Riya"}><textarea required rows={5} value={sheet === "decline" ? declineMessage : alternativeMessage} onChange={e => sheet === "decline" ? setDeclineMessage(e.target.value) : setAlternativeMessage(e.target.value)} /></Field>
        <div className="action-footer"><Button type="submit" disabled={!(sheet === "decline" ? declineMessage : alternativeMessage).trim()}>{sheet === "decline" ? "Send decline" : "Send recommendation"}</Button></div>
      </form>}
    </Sheet>
    {inside && <nav className="bottom-nav" aria-label="Main navigation">{([{ name: "Home", id: "home", Icon: Home }, { name: "People", id: "people", Icon: Users }, { name: "Intents", id: "intents", Icon: Layers3 }, { name: "Requests", id: "requests", Icon: MessageCircle }, { name: "Events", id: "events", Icon: CalendarDays }] as const).map(({ name, id, Icon }) => <button key={id} aria-current={selectedTab === id ? "page" : undefined} onClick={() => go(id)} className={selectedTab === id ? "active" : ""}><span className="nav-icon"><Icon size={22} strokeWidth={selectedTab === id ? 2 : 1.65} />{id === "requests" && unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}</span><span>{name}</span></button>)}</nav>}
    <div className="sr-only" role="status" aria-atomic="true">{confirmationMessage}</div>
  </div>;
}
