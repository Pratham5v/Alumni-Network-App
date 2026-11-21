"use client";

import { useCallback, useEffect, useReducer, useRef, useState, type ButtonHTMLAttributes, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, BadgeCheck, CalendarDays, Check, CheckCheck, ChevronDown, ChevronRight, Clock3, Home, Layers3, LoaderCircle, MapPin, MessageCircle, Plus, Search, Send, ShieldCheck, Sparkles, Users, Video, X } from "lucide-react";
import { demoReducer, demoReply, initialState, sampleIntent, sampleProfile, type Commitment, type Intent, type Outcome, type Profile } from "@/lib/model";
import { people, type Person } from "@/lib/people";

type Screen = "welcome" | "onboard" | "verify" | "home" | "create" | "intent" | "intents" | "people" | "profile" | "compose" | "requests" | "request" | "conversation" | "outcome" | "success" | "my-profile";
const appScreens: Screen[] = ["home", "create", "intent", "intents", "people", "profile", "compose", "requests", "request", "conversation", "outcome", "success", "my-profile"];
type IntentForm = Omit<Intent, "status">;
const emptyIntent: IntentForm = { type: "Seeking advice", title: "", context: "", commitment: "20-minute call", expires: "14" };

function Button({ children, variant = "primary", busy, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "quiet"; busy?: boolean }) {
  return <button {...props} disabled={props.disabled || busy} className={`button ${variant} ${className}`} aria-busy={busy || undefined}>{busy && <LoaderCircle size={18} className="spin" />}{children}</button>;
}
function Avatar({ person, size = "normal" }: { person: Pick<Person, "initials" | "color">; size?: "normal" | "large" | "small" }) {
  return <span className={`avatar ${person.color} ${size}`} aria-hidden="true">{person.initials}</span>;
}
function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="field"><span className="field-label">{label}</span>{children}{hint && <span className="field-hint">{hint}</span>}</label>;
}
function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <span className="select-wrap"><select {...props}>{children}</select><ChevronDown size={17} aria-hidden="true" /></span>;
}
function Tag({ children, warm = false }: { children: ReactNode; warm?: boolean }) { return <span className={`tag ${warm ? "warm" : ""}`}>{children}</span>; }
function Empty({ icon, title, children, action }: { icon: ReactNode; title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h2>{title}</h2><p>{children}</p>{action}</div>;
}
function Choice({ name, value, selected, onSelect, children }: { name: string; value: string; selected: boolean; onSelect: () => void; children: ReactNode }) {
  return <label className={`choice ${selected ? "selected" : ""}`}><input type="radio" name={name} value={value} checked={selected} onChange={onSelect} /><span className="radio-mark" /><span>{children}</span></label>;
}

export default function AlumniApp() {
  const [state, dispatch] = useReducer(demoReducer, initialState);
  const [screen, setScreen] = useState<Screen>("welcome");
  const [profileForm, setProfileForm] = useState<Profile>(sampleProfile);
  const [intentForm, setIntentForm] = useState<IntentForm>(emptyIntent);
  const [personId, setPersonId] = useState("aarav");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All locations");
  const [expertise, setExpertise] = useState("All expertise");
  const [requestMessage, setRequestMessage] = useState("");
  const [commitment, setCommitment] = useState<Commitment>("20-minute call");
  const [outcome, setOutcome] = useState<Partial<Outcome>>({});
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const person = people.find(p => p.id === personId) || people[0];
  const recipient = people.find(p => p.id === state.request?.personId) || person;
  const inside = appScreens.includes(screen);
  const intent = state.intent;
  const request = state.request;
  const firstName = state.profile.name.trim().split(/\s+/)[0] || "Prathmesh";
  const replySent = state.messages.some(message => message.from === "you");

  const go = useCallback((next: Screen) => {
    window.history.pushState({ screen: next }, "", `#${next}`);
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  useEffect(() => {
    window.history.replaceState({ screen: "welcome" }, "", window.location.pathname);
    const onBack = (event: PopStateEvent) => {
      setScreen(event.state?.screen || "welcome");
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("popstate", onBack);
    return () => { window.removeEventListener("popstate", onBack); timers.current.forEach(clearTimeout); };
  }, []);
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [screen]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (screen === "conversation") messagesEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [state.messages.length, screen]);
  useEffect(() => {
    if (state.request?.status !== "accepted" || !replySent || state.conversationConfirmed) return;
    const timer = setTimeout(() => dispatch({ type: "confirm-conversation" }), 850);
    return () => clearTimeout(timer);
  }, [state.request?.status, replySent, state.conversationConfirmed]);

  function delayed(action: () => void) {
    if (busy) return;
    setBusy(true);
    timers.current.push(setTimeout(() => { action(); setBusy(false); }, 500));
  }
  function title(text: string, subtitle?: string, eyebrow?: string) {
    return <div className="page-heading">{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1 ref={headingRef} tabIndex={-1}>{text}</h1>{subtitle && <p>{subtitle}</p>}</div>;
  }
  function back(to: Screen, text = "Back") {
    return <button className="back-link" onClick={() => go(to)}><ArrowLeft size={19} />{text}</button>;
  }
  function openPerson(p: Person) { setPersonId(p.id); go("profile"); }
  function compose(p: Person) {
    if (request) { go("request"); return; }
    if (!intent) { go("create"); return; }
    setPersonId(p.id);
    setCommitment(intent.commitment === "Chat" ? "Chat" : p.commitment);
    setRequestMessage(`Hi ${p.name.split(" ")[0]},\n\n${intent.context}`);
    go("compose");
  }
  function freshIntent() {
    dispatch({ type: "new-journey" }); setIntentForm(emptyIntent); setOutcome({}); setRequestMessage(""); go("create");
  }
  function restart() {
    timers.current.forEach(clearTimeout); timers.current = [];
    dispatch({ type: "reset" }); setBusy(false); setToast(""); setProfileForm(sampleProfile); setIntentForm(emptyIntent); setOutcome({}); setSearch(""); setLocation("All locations"); setExpertise("All expertise"); go("welcome");
  }
  function personCard(p: Person, compact = false) {
    return <article className="person-card" key={p.id}>
      <button className="person-identity" onClick={() => openPerson(p)} aria-label={`View ${p.name}'s profile`}><Avatar person={p} /><span><strong>{p.name}</strong><span>{p.role} · {p.location}</span></span><ChevronRight size={18} className="muted" /></button>
      {!compact && <><p className="person-help">{p.help}</p><div className="availability"><span className="availability-dot" />Open to helping<span className="separator">·</span>{p.commitment}</div></>}
      <div className="card-actions"><button className="text-button" onClick={() => openPerson(p)}>View profile</button><Button variant="secondary" onClick={() => compose(p)}>{request ? "View request" : intent ? "Request help" : "Create an intent"}</Button></div>
    </article>;
  }
  function intentCard() {
    if (!intent) return null;
    return <button className="intent-card" onClick={() => go("intent")}><div className="row between"><Tag>{intent.status === "resolved" ? "Resolved" : "Active intent"}</Tag><ChevronRight size={19} /></div><h2>{intent.title}</h2><p>{intent.context}</p><div className="meta"><Clock3 size={15} />{intent.commitment}<span>·</span>{intent.status === "active" ? `${intent.expires} days` : "Closed with feedback"}</div></button>;
  }

  const filteredPeople = people.filter(p => {
    const words = `${p.name} ${p.role} ${p.expertise.join(" ")} ${p.help}`.toLowerCase();
    return words.includes(search.toLowerCase().trim()) && (location === "All locations" || p.location === location) && (expertise === "All expertise" || (expertise === "Product & startups" ? p.id !== "kabir" : p.id === "kabir"));
  });
  let content: ReactNode;

  switch (screen) {
    case "welcome": content = <div className="welcome">
      <div className="welcome-top"><a className="wordmark" href="#welcome" onClick={e => { e.preventDefault(); go("welcome"); }}><Layers3 size={25} strokeWidth={1.7} />alumni<span className="wordmark-period">.</span></a><span className="demo-label">Interactive demo</span></div>
      <div className="connection-art" aria-hidden="true"><span className="art-line one" /><span className="art-line two" /><span className="art-line three" /><div className="art-avatar a">PM</div><div className="art-avatar b">AS</div><div className="art-avatar c">NR</div><div className="art-center"><MessageCircle size={35} strokeWidth={1.6} /><span className="art-check"><Check size={13} /></span></div></div>
      <div className="welcome-copy"><span className="eyebrow">Your community. A little closer.</span><h1 ref={headingRef} tabIndex={-1}>Good connections start with a clear ask.</h1><p>Share what you need. Find an alumnus who can help. Make the conversation count.</p></div>
      <div className="welcome-benefits"><span><ShieldCheck size={19} />A verified alumni community</span><span><Clock3 size={19} />Help that fits your availability</span></div>
      <div className="welcome-bottom"><Button onClick={() => go("onboard")}>Explore the walkthrough</Button><p>Sample profiles and simulated interactions.</p></div>
    </div>; break;

    case "onboard": content = <>{back("welcome")}{title("Make yourself at home.", "A few details help your community recognize you.", "Getting started · 1 of 2")}
      <form onSubmit={e => { e.preventDefault(); dispatch({ type: "profile", profile: { ...profileForm, name: profileForm.name.trim(), role: profileForm.role.trim(), location: profileForm.location.trim() } }); go("verify"); }}>
        <div className="notice soft"><Sparkles size={18} /><p>We’ve filled in a sample profile. You can change it or continue as Prathmesh.</p></div>
        <Field label="Full name"><input required autoComplete="name" maxLength={60} value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} /></Field>
        <div className="form-row"><Field label="Graduation year"><Select value={profileForm.batch} onChange={e => setProfileForm({ ...profileForm, batch: e.target.value })}>{["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2016"].map(y => <option key={y}>{y}</option>)}</Select></Field><Field label="Location"><input required maxLength={45} value={profileForm.location} onChange={e => setProfileForm({ ...profileForm, location: e.target.value })} /></Field></div>
        <Field label="Current role"><input required maxLength={60} value={profileForm.role} onChange={e => setProfileForm({ ...profileForm, role: e.target.value })} /></Field>
        <div className="action-footer"><Button type="submit" disabled={!profileForm.name.trim() || !profileForm.location.trim() || !profileForm.role.trim()}>Continue</Button></div>
      </form></>; break;

    case "verify": content = <>{back("onboard")}{title("One community. Built on trust.", "Alumni verification helps keep your network relevant and welcoming.", "Getting started · 2 of 2")}
      <div className="verification-visual"><ShieldCheck size={42} strokeWidth={1.35} /></div>
      <div className="profile-summary"><span className="avatar sage">{state.profile.name.split(/\s+/).map(n => n[0]).slice(0, 2).join("")}</span><div><strong>{state.profile.name}</strong><p>Class of {state.profile.batch} · {state.profile.role}</p></div></div>
      <div className="explanation"><h2>How verification works</h2><p>Your institution checks your alumni details before giving you access to people and requests.</p><div className="notice soft"><BadgeCheck size={20} /><p>For this walkthrough, you’ll enter with a verified demo profile.</p></div></div>
      <div className="action-footer"><Button onClick={() => go("home")}>Enter the network</Button></div></>; break;

    case "home": content = <>{title(`Hi, ${firstName}.`, "Your alumni community, here when you need it.", "BITS alumni network")}
      {!intent ? <section className="home-prompt"><div className="prompt-icon"><MessageCircle size={25} strokeWidth={1.6} /></div><h2>What could your community help with?</h2><p>A fresh perspective, a career question, or a conversation with someone who’s been there.</p><Button onClick={() => go("create")}><Plus size={19} />Create an intent</Button></section> : <><div className="section-heading"><h2>Your intent</h2><button className="text-button" onClick={() => go("intents")}>View</button></div>{intentCard()}{request?.status === "completed" ? <div className="notice soft"><CheckCheck size={20} /><div><strong>You closed the loop.</strong><p>Your outcome has been recorded.</p><button className="text-button" onClick={() => go("success")}>View outcome</button></div></div> : request ? <button className="next-step" onClick={() => go("request")}><MessageCircle size={21} /><span><strong>{request.status === "accepted" ? `${recipient.name.split(" ")[0]} accepted your request` : "Your request is awaiting a response"}</strong><span>{request.status === "accepted" ? "Continue the conversation" : "View your request"}</span></span><ChevronRight size={19} /></button> : <Button className="full-width" onClick={() => go("people")}>Find alumni who can help</Button>}</>}
      <section className="people-preview"><div className="section-heading"><h2>Open to helping</h2><button className="text-button" onClick={() => go("people")}>See all</button></div>{people.slice(0, 2).map(p => personCard(p, true))}</section>
      <p className="quiet-note"><ShieldCheck size={15} />Profiles are visible within your verified community.</p>
    </>; break;

    case "create": content = request ? <>{back("intent")}{title("Your request is already underway.", "Its original context stays with the request. Follow the conversation from here.")}<Button className="full-width" onClick={() => go("request")}>View request</Button></> : <>{back(intent ? "intent" : "home")}{title(intent ? "Edit your intent" : "What do you need?", "A clear ask makes it easier for someone to help.")}
      <button className="example-button" onClick={() => setIntentForm(sampleIntent)}><Sparkles size={17} />Use the startup feedback example</button>
      <form onSubmit={e => { e.preventDefault(); delayed(() => { dispatch({ type: "publish", intent: { ...intentForm, title: intentForm.title.trim(), context: intentForm.context.trim() } }); setToast(intent ? "Your intent has been updated." : "Your intent is live. Let’s find someone who can help."); go("intent"); }); }}>
        <Field label="Intent type"><Select value={intentForm.type} onChange={e => setIntentForm({ ...intentForm, type: e.target.value as IntentForm["type"] })}><option>Seeking advice</option><option>Seeking mentorship</option></Select></Field>
        <Field label="Give it a title" hint="Keep it specific, so the right person recognizes it."><input required minLength={6} maxLength={80} placeholder="e.g. Feedback on my startup idea" value={intentForm.title} onChange={e => setIntentForm({ ...intentForm, title: e.target.value })} /></Field>
        <Field label="A little context" hint={`${intentForm.context.length}/400 characters`}><textarea required minLength={15} maxLength={400} rows={4} placeholder="What are you working on, and what would help?" value={intentForm.context} onChange={e => setIntentForm({ ...intentForm, context: e.target.value })} /></Field>
        <div className="form-row"><Field label="Expected commitment"><Select value={intentForm.commitment} onChange={e => setIntentForm({ ...intentForm, commitment: e.target.value as Commitment })}><option>20-minute call</option><option>30-minute call</option><option>Chat</option></Select></Field><Field label="Expires after"><Select value={intentForm.expires} onChange={e => setIntentForm({ ...intentForm, expires: e.target.value })}><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></Select></Field></div>
        <p className="quiet-note"><Users size={16} />Visible to verified alumni. Closes when resolved or expired.</p>
        <div className="action-footer"><Button type="submit" busy={busy} disabled={intentForm.title.trim().length < 6 || intentForm.context.trim().length < 15}>{intent ? "Save changes" : "Publish intent"}</Button></div>
      </form></>; break;

    case "intents": content = <>{title("Your intents", "What you need, and where it stands.")}{intent ? <>{intentCard()}{!request && <button className="text-button standalone" onClick={() => { setIntentForm(intent); go("create"); }}>Edit intent</button>}{request?.status === "completed" && <Button variant="secondary" className="full-width" onClick={freshIntent}>Try another intent</Button>}</> : <Empty icon={<Layers3 size={27} />} title="Start with a clear ask" action={<Button onClick={() => go("create")}><Plus size={18} />Create an intent</Button>}>Your current needs will appear here, along with the help they lead to.</Empty>}</>; break;

    case "intent": content = intent ? <>{back("intents")}{title(intent.title)}<div className="row gap"><Tag>{intent.status === "active" ? "Active" : "Resolved"}</Tag><span className="small muted">{intent.status === "active" ? `Expires in ${intent.expires} days` : "Outcome recorded"}</span></div><div className="detail-meta">{intent.type}<span>·</span>Verified alumni</div><section className="detail-section"><h2>What I need</h2><p>{intent.context}</p></section><div className="commitment-block"><span>Expected commitment</span><strong><Clock3 size={19} />{intent.commitment}</strong></div><div className="section-heading"><h2>Alumni who may help</h2></div>{personCard(people[0])}<p className="quiet-note">Relevant expertise and willingness to help are a useful starting point.</p><div className="action-footer">{request ? <Button onClick={() => go("request")}>View request</Button> : <><Button onClick={() => go("people")}>Discover alumni</Button><Button variant="quiet" onClick={() => { setIntentForm(intent); go("create"); }}>Edit intent</Button></>}</div></> : <Empty icon={<Layers3 size={27} />} title="Create your first intent" action={<Button onClick={() => go("create")}>Create an intent</Button>}>Tell your community what would help right now.</Empty>; break;

    case "people": content = <>{title("Find the right alumni", "Relevant experience. Open to helping.")}
      {intent && <div className="intent-context"><span>For your intent</span><strong>{intent.title}</strong></div>}
      <label className="search-field"><Search size={20} /><input type="search" aria-label="Search alumni" placeholder="Name, role or expertise" value={search} onChange={e => setSearch(e.target.value)} />{search && <button aria-label="Clear search" onClick={() => setSearch("")}><X size={17} /></button>}</label>
      <div className="filters"><Select aria-label="Filter by location" value={location} onChange={e => setLocation(e.target.value)}><option>All locations</option><option>Bengaluru</option><option>Gurgaon</option><option>Mumbai</option></Select><Select aria-label="Filter by expertise" value={expertise} onChange={e => setExpertise(e.target.value)}><option>All expertise</option><option>Product &amp; startups</option><option>Engineering</option></Select></div>
      <div className="section-heading"><h2>{search || location !== "All locations" || expertise !== "All expertise" ? "Search results" : "Open to helping"}</h2><span className="small muted" role="status">{filteredPeople.length} alumni</span></div>
      {filteredPeople.length ? filteredPeople.map(p => personCard(p)) : <Empty icon={<Search size={27} />} title="No alumni found" action={<Button variant="secondary" onClick={() => { setSearch(""); setLocation("All locations"); setExpertise("All expertise"); }}>Clear filters</Button>}>Try another name or broaden your filters.</Empty>}
    </>; break;

    case "profile": content = <>{back("people")}{title("Alumni profile")}<div className="profile-hero"><Avatar person={person} size="large" /><h2>{person.name}</h2><p>{person.role} · {person.company}</p><div className="meta"><MapPin size={15} />{person.location}<span>·</span>Class of {person.batch}</div><Tag>Open to helping</Tag></div><section className="detail-section"><h2>A little about me</h2><p>{person.about}</p></section><section className="detail-section"><h2>Expertise</h2><div className="expertise-list">{person.expertise.map(x => <span key={x}>{x}</span>)}</div></section><section className="detail-section"><h2>How I can help</h2><p>{person.help}</p></section><div className="commitment-block"><span>Preferred commitment</span><strong><Clock3 size={19} />{person.commitment}</strong></div><div className="action-footer"><Button onClick={() => compose(person)}>{request ? "View request" : intent ? "Request help" : "Create an intent to request help"}</Button></div></>; break;

    case "compose": content = intent ? <>{back("profile")}{title("Send a request", "A little context goes a long way.")}<div className="profile-summary"><Avatar person={person} /><div><strong>{person.name}</strong><p>{person.role} · {person.location}</p></div></div><form onSubmit={e => { e.preventDefault(); delayed(() => { dispatch({ type: "request", request: { personId: person.id, message: requestMessage.trim(), commitment } }); go("request"); setToast("Request sent. Your next step is ready below."); }); }}><div className="read-only-field"><span>Associated intent</span><strong>{intent.title}</strong></div><Field label="Your message" hint="Share the context and what you’d like their perspective on."><textarea required minLength={15} maxLength={600} rows={5} value={requestMessage} onChange={e => setRequestMessage(e.target.value)} /></Field><Field label="Requested commitment"><Select value={commitment} onChange={e => setCommitment(e.target.value as Commitment)}><option>{person.commitment}</option><option>Chat</option></Select></Field><p className="quiet-note"><ShieldCheck size={16} />Only this alumnus receives your request.</p><div className="action-footer"><Button type="submit" busy={busy} disabled={requestMessage.trim().length < 15}>Send request</Button><Button variant="quiet" type="button" onClick={() => go("profile")}>Cancel</Button></div></form></> : <Empty icon={<Layers3 size={27} />} title="Start with an intent" action={<Button onClick={() => go("create")}>Create an intent</Button>}>A request needs a little context about what you need.</Empty>; break;

    case "requests": content = <>{title("Your requests", "Follow the conversation, all the way through.")}{request ? <button className="request-list-card" onClick={() => go("request")}><div className="row between"><Tag warm={request.status === "pending"}>{request.status === "pending" ? "Awaiting response" : request.status === "accepted" ? "Accepted" : "Completed"}</Tag><ChevronRight size={19} /></div><h2>{request.intentTitle}</h2><div className="row gap"><Avatar person={recipient} size="small" /><span>{recipient.name}<span className="block small muted">{request.commitment}</span></span></div></button> : <Empty icon={<MessageCircle size={27} />} title="Good conversations start here" action={<Button onClick={() => go(intent ? "people" : "create")}>{intent ? "Discover alumni" : "Create an intent"}</Button>}>Find someone open to helping and send a specific request.</Empty>}</>; break;

    case "request": content = request ? <>{back("requests")}{title(request.status === "pending" ? "Your request is sent." : request.status === "accepted" ? "You’re connected." : "Interaction completed.", request.status === "pending" ? "You’ve made the first move." : request.status === "accepted" ? `${recipient.name.split(" ")[0]} is happy to help. Take the conversation forward.` : "Thanks for recording what happened.")}<Tag warm={request.status === "pending"}>{request.status === "pending" ? "Awaiting response" : request.status === "accepted" ? "Request accepted" : "Completed"}</Tag><div className="request-detail-card"><div className="profile-summary"><Avatar person={recipient} /><div><strong>{recipient.name}</strong><p>{recipient.role}</p></div></div><h2>{request.intentTitle}</h2><p className="preserve-lines">{request.message}</p><div className="meta"><Clock3 size={16} />{request.commitment}</div></div><div className="status-line"><span className="status-check"><Check size={15} /></span><div><strong>Request delivered</strong><p>Context and commitment shared.</p></div></div>{request.status !== "pending" && <div className="status-line"><span className="status-check"><Check size={15} /></span><div><strong>{recipient.name.split(" ")[0]} accepted</strong><p>You can arrange the interaction together.</p></div></div>}{request.status === "pending" ? <div className="demo-control"><span className="eyebrow">For this walkthrough</span><p>Preview what happens when {recipient.name.split(" ")[0]} accepts.</p><Button variant="secondary" busy={busy} onClick={() => delayed(() => { dispatch({ type: "accept" }); setToast(`${recipient.name.split(" ")[0]} accepted your request.`); })}>Preview acceptance</Button></div> : <div className="action-footer"><Button onClick={() => go(request.status === "completed" ? "success" : "conversation")}>{request.status === "completed" ? "View outcome" : "Open conversation"}</Button></div>}</> : <Empty icon={<MessageCircle size={27} />} title="No request yet" action={<Button onClick={() => go("people")}>Discover alumni</Button>}>Your next conversation starts with a clear ask.</Empty>; break;

    case "conversation": content = request && request.status !== "pending" ? <>
      {back("request")}{title("Conversation")}
      <div className="conversation-person"><Avatar person={recipient} /><div><strong>{recipient.name}</strong><span>{recipient.role}</span></div><BadgeCheck size={19} className="teal" /></div>
      <div className="conversation-context"><span><Check size={15} />Request accepted</span><strong>{request.intentTitle}</strong><small>{request.commitment}</small></div>
      <div className="section-heading"><h2>Arrange the interaction</h2></div>
      <p className="section-description">Agree on a time and share a call link here.</p>
      <div className="messages" aria-label="Conversation messages" aria-live="polite">
        {state.messages.map(m => <div key={m.id} className={`message ${m.from}`}><span>{m.from === "you" ? "You" : recipient.name.split(" ")[0]}</span><p>{m.text}</p></div>)}
        {replySent && !state.conversationConfirmed && request.status === "accepted" && <p className="replying"><LoaderCircle size={14} className="spin" />{recipient.name.split(" ")[0]} is replying…</p>}
        {state.conversationConfirmed && <div className="call-link-action"><Button type="button" variant="secondary"><Video size={18} />Share a call link</Button></div>}
        <div ref={messagesEnd} />
      </div>
      {request.status === "accepted" && <>
        {!replySent && <div className="guided-compose">
          <label htmlFor="demo-message" className="field-label">Your reply</label>
          <textarea id="demo-message" readOnly value={demoReply} rows={3} aria-describedby="demo-message-hint" />
          <span id="demo-message-hint" className="field-hint">A prefilled message for this walkthrough.</span>
          <Button type="button" onClick={() => dispatch({ type: "send-demo-message" })}><Send size={18} />Send message</Button>
        </div>}
        {state.conversationConfirmed && <div className="after-conversation"><span>After your conversation</span><Button variant="secondary" onClick={() => { setOutcome({}); go("outcome"); }}>Record the outcome</Button></div>}
      </>}
    </> : <Empty icon={<MessageCircle size={27} />} title="Your conversation starts after acceptance" action={<Button onClick={() => go("request")}>View request</Button>}>Both people agree before the interaction begins.</Empty>; break;

    case "outcome": content = request?.status === "accepted" ? <>{back("conversation")}{title("How did it go?", "A quick check-in helps close the loop.")}<div className="outcome-context"><strong>{request.intentTitle}</strong><p>With {recipient.name} · {request.commitment}</p></div><form onSubmit={e => { e.preventDefault(); if (outcome.happened === false) { setToast("No rush. Your request and intent are still open."); go("request"); return; } delayed(() => { dispatch({ type: "outcome", outcome: outcome as Outcome }); go("success"); }); }}><fieldset className="question"><legend>Did the conversation happen?</legend><div className="choices"><Choice name="happened" value="yes" selected={outcome.happened === true} onSelect={() => setOutcome({ happened: true })}>Yes</Choice><Choice name="happened" value="not-yet" selected={outcome.happened === false} onSelect={() => setOutcome({ happened: false })}>Not yet</Choice></div></fieldset>{outcome.happened === true && <div className="reveal"><fieldset className="question"><legend>Was it helpful?</legend><div className="choices">{(["Yes", "Partly", "No"] as const).map(v => <Choice key={v} name="helpful" value={v} selected={outcome.helpful === v} onSelect={() => setOutcome({ ...outcome, helpful: v })}>{v}</Choice>)}</div></fieldset><fieldset className="question"><legend>Is your original need resolved?</legend><div className="choices vertical"><Choice name="resolved" value="yes" selected={outcome.resolved === true} onSelect={() => setOutcome({ ...outcome, resolved: true })}>Yes, mark my intent resolved</Choice><Choice name="resolved" value="no" selected={outcome.resolved === false} onSelect={() => setOutcome({ ...outcome, resolved: false })}>No, keep my intent active</Choice></div></fieldset><p className="quiet-note">Completing an interaction doesn’t have to close your intent.</p></div>}{outcome.happened === false && <div className="notice soft"><Clock3 size={20} /><p>That’s okay. We’ll keep your request open so you can come back after the conversation.</p></div>}<div className="action-footer"><Button type="submit" busy={busy} disabled={outcome.happened === undefined || (outcome.happened && (!outcome.helpful || outcome.resolved === undefined))}>{outcome.happened === false ? "Keep request open" : "Save outcome"}</Button><Button type="button" variant="quiet" onClick={() => go("conversation")}>Skip for now</Button></div></form></> : <Empty icon={<CheckCheck size={27} />} title="Nothing to record yet" action={<Button onClick={() => go("request")}>View request</Button>}>Record the outcome after an accepted interaction.</Empty>; break;

    case "success": content = request?.status === "completed" ? <div className="success-page"><div className="success-icon"><CheckCheck size={35} strokeWidth={1.6} /></div>{title("Thanks for closing the loop.", intent?.status === "resolved" ? "Your interaction is complete, and your intent is resolved." : "Your interaction is complete. Your intent stays open for more help.")}<div className="summary-card"><h2>{request.intentTitle}</h2><p>With {recipient.name}</p><div><span>Conversation</span><strong>Completed</strong></div><div><span>Helpful?</span><strong>{request.outcome?.helpful}</strong></div><div><span>Intent</span><strong>{intent?.status === "resolved" ? "Resolved" : "Still active"}</strong></div></div><Button onClick={() => go("home")}>Back to home</Button><Button variant="quiet" onClick={() => go("intent")}>View intent</Button></div> : <Empty icon={<CheckCheck size={27} />} title="Your outcome will appear here" action={<Button onClick={() => go("requests")}>View requests</Button>}>Complete the interaction and record how it went.</Empty>; break;

    case "my-profile": content = <>{back("home")}{title("Your profile")}<div className="profile-hero"><span className="avatar sage large">{state.profile.name.split(/\s+/).map(n => n[0]).slice(0, 2).join("")}</span><h2>{state.profile.name}</h2><p>{state.profile.role}</p><div className="meta"><MapPin size={15} />{state.profile.location}<span>·</span>Class of {state.profile.batch}</div><Tag>Verified demo profile</Tag></div><div className="explanation"><h2>A simple walkthrough</h2><p>Create an intent, find someone open to helping, send a request and follow the connection through to an outcome.</p><p>This demo starts fresh when you refresh. You can also restart below.</p></div><Button variant="secondary" className="full-width" onClick={restart}>Restart walkthrough</Button></>; break;
  }

  const selectedTab = ["create", "intent", "intents"].includes(screen) ? "intents" : ["people", "profile"].includes(screen) ? "people" : ["compose", "requests", "request", "conversation", "outcome", "success"].includes(screen) ? "requests" : "home";
  return <div className={`app-shell ${inside ? "inside" : ""}`}>
    {inside && <header className="app-header"><button className="wordmark" onClick={() => go("home")} aria-label="Alumni home"><Layers3 size={23} strokeWidth={1.7} />alumni<span className="wordmark-period">.</span></button><button className="account-button" aria-label="Your profile" onClick={() => go("my-profile")}><span>{state.profile.name.split(/\s+/).map(n => n[0]).slice(0, 2).join("")}</span></button></header>}
    <main id="main-content" className={screen === "welcome" ? "welcome-main" : "main-content"} key={screen}>{content}</main>
    {inside && <nav className="bottom-nav" aria-label="Main navigation">{([{ name: "Home", id: "home", Icon: Home }, { name: "People", id: "people", Icon: Users }, { name: "Intents", id: "intents", Icon: Layers3 }, { name: "Requests", id: "requests", Icon: MessageCircle }] as const).map(({ name, id, Icon }) => <button key={id} aria-current={selectedTab === id ? "page" : undefined} onClick={() => go(id)} className={selectedTab === id ? "active" : ""}><span className="nav-icon"><Icon size={22} strokeWidth={selectedTab === id ? 2 : 1.65} />{id === "requests" && request && request.status !== "completed" && <span className="nav-badge">1</span>}</span><span>{name}</span></button>)}</nav>}
    <div className={`toast ${toast ? "visible" : ""}`} role="status" aria-live="polite">{toast && <><Check size={18} /><span>{toast}</span><button aria-label="Dismiss message" onClick={() => setToast("")}><X size={16} /></button></>}</div>
  </div>;
}
