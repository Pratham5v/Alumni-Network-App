"use client";

import { useState, type Dispatch, type FormEvent, type RefObject } from "react";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronRight, CircleCheck, Globe2, Heart, LockKeyhole, Mail } from "lucide-react";
import { googleCalendarUrl, interviewTimeLabel, tomorrowInterview } from "@/lib/calendar";
import { isValidCallLink, sampleCallLink } from "@/lib/model";
import { assignedTask, helpfulInteractions, maya, sampleMentorshipGoal, sampleMentorshipMessage, weeklyMentorshipMeetings, type Letter, type MentorshipAction, type MentorshipState } from "@/lib/mentorship";
import "./mentorship.css";

type Props = { mentorship: MentorshipState; update: Dispatch<MentorshipAction> };
type Heading = { heading: RefObject<HTMLHeadingElement | null> };

export function MayaPortrait({ size = 38 }: { size?: number }) {
  return <Image className="maya-portrait" src="/avatars/maya.svg" alt="" width={size} height={size} />;
}

function LetterMark() {
  return <span className="letter-mark" aria-hidden="true"><Mail size={21} /><Heart size={11} className="letter-heart" fill="currentColor" /></span>;
}

export function MayaRelationship({ openLetters }: { openLetters: () => void }) {
  return <>
    <section className="alumni-profile-help"><h2>Ask me about</h2><p>{maya.help}</p></section>
    <section className="alumni-profile-section">
      <h2>Your history with Maya</h2>
      <ul className="mentor-history">{helpfulInteractions.map(item => <li key={item.title}>
        <CircleCheck size={18} aria-hidden="true" />
        <div><strong>{item.title}</strong><p>{item.outcome.note}</p></div>
        <span>{item.date}</span>
      </li>)}</ul>
    </section>
    <button type="button" className="letter-entry" onClick={openLetters}>
      <LetterMark /><span><strong>View letters</strong><small>Thoughtful notes from your conversations</small></span><ChevronRight size={17} aria-hidden="true" />
    </button>
  </>;
}

export function MentorshipProposal({ update, heading, onSent }: Props & Heading & { onSent: () => void }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const goal = String(data.get("goal")).trim();
    const proposal = String(data.get("message")).trim();
    if (!goal || !proposal) return;
    update({ type: "propose", goal, proposal });
    onSent();
  }

  return <>
    <div className="page-heading"><h1 ref={heading} tabIndex={-1}>Propose mentorship</h1><p>Build on the conversations you’ve already had with Maya.</p></div>
    <div className="mentor-info"><MayaPortrait /><div><strong>Maya Rao</strong><p>Mentor · Product Manager</p></div></div>
    <form className="form-card mentor-form" onSubmit={submit}>
      <label>What are you working toward?<input name="goal" required maxLength={90} defaultValue={sampleMentorshipGoal} /></label>
      <p className="mentor-meta"><CalendarDays size={17} aria-hidden="true" /> Weekly 30-minute meetings for two months</p>
      <label>Your message<textarea name="message" rows={4} required maxLength={600} defaultValue={sampleMentorshipMessage} /></label>
      <button className="button primary" type="submit">Send proposal <ArrowRight size={17} aria-hidden="true" /></button>
    </form>
  </>;
}

export function MentorshipJourney({ mentorship, update, heading, onLetters }: Props & Heading & { onLetters: () => void }) {
  const [draftOpen, setDraftOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [error, setError] = useState("");
  const [confirmFinish, setConfirmFinish] = useState(false);
  const meeting = mentorship.meetings[0];
  const active = mentorship.phase === "active";
  const firstDemoDate = (value: string) => {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
    return ["year", "month", "day"].map(key => parts.find(part => part.type === key)?.value).join("-");
  };
  const steps = [
    { name: "Understand the PM role", status: "Completed · Career discussion", done: true },
    { name: "Review a sample product case", status: "Completed · Feedback received", done: true },
    { name: "Build a product case study", status: mentorship.task === "complete" ? "Completed · Draft discussed" : "In progress", done: mentorship.task === "complete", current: mentorship.task !== "complete" },
    { name: "Prepare for PM interviews", status: mentorship.task === "complete" ? "In progress" : "Upcoming", done: false, current: mentorship.task === "complete" },
  ];

  function schedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const meetings = weeklyMentorshipMeetings(String(data.get("date")), String(data.get("time")));
    const callLink = String(data.get("link")).trim();
    if (!meetings.length || !isValidCallLink(callLink)) {
      setError("Enter a valid date, time, and web call link.");
      return;
    }
    update({ type: "schedule", meetings, callLink });
    setMeetingOpen(false);
    setError("");
  }

  return <>
    <div className="page-heading">
      <span className="tag">{active ? "Active mentorship" : mentorship.phase === "completed" ? "Mentorship completed" : "Mentorship proposal"}</span>
      <h1 ref={heading} tabIndex={-1} className="mentor-goal">{mentorship.goal || sampleMentorshipGoal}</h1>
      <div className="mentor-info"><MayaPortrait size={32} /><div><strong>Mentor: Maya Rao</strong><p>Weekly meetings · 2 months</p></div></div>
    </div>
    {mentorship.phase === "proposed" && <section className="mentor-panel">
      <h2>Awaiting Maya’s reply</h2><p>{mentorship.proposal}</p>
      <button type="button" className="button secondary" onClick={() => update({ type: "accept" })}>Simulate Maya accepting</button>
    </section>}
    {active && mentorship.plan && mentorship.task !== "complete" && <section className="mentor-panel mentor-next">
      <span className="eyebrow">Your next step</span>
      <h2>{assignedTask}</h2>
      {mentorship.task === "unassigned" ? <>
        <p>Maya can assign this task before your next conversation.</p>
        <button type="button" className="button secondary" onClick={() => update({ type: "assign-task" })}>Simulate Maya assigning a task</button>
      </> : <>
        <p>Assigned by Maya · Before the next session</p>
        {mentorship.task === "assigned" ? <button type="button" className="button secondary" onClick={() => setDraftOpen(!draftOpen)} aria-expanded={draftOpen}>Share your draft</button> :
          <><p className="mentor-draft">{mentorship.draft}</p><p role="status">Draft shared with Maya in the demo.</p><button type="button" className="button secondary" onClick={() => update({ type: "complete-task" })}>Mark reviewed together</button></>}
        {draftOpen && mentorship.task === "assigned" && <form className="mentor-form" onSubmit={event => {
          event.preventDefault();
          const draft = String(new FormData(event.currentTarget).get("draft")).trim();
          if (!draft) return;
          update({ type: "share-draft", draft });
          setDraftOpen(false);
        }}>
          <label>Draft or link<textarea name="draft" rows={3} required maxLength={1600} placeholder="Paste a draft or a link to share with Maya" /></label>
          <button className="button primary" type="submit">Send draft</button>
        </form>}
      </>}
    </section>}

    {active && <section className="mentor-panel">
      <div className="mentor-panel-heading"><CalendarDays size={20} aria-hidden="true" /><div><h2>Next meeting</h2><p>{meeting ? interviewTimeLabel(meeting) : "Choose a time for your weekly conversations."}</p></div></div>
      {meeting && <><details className="mentor-meetings"><summary>View {mentorship.meetings.length} weekly meetings</summary><ol>{mentorship.meetings.map(item => <li key={item.start}>{interviewTimeLabel(item)}</li>)}</ol></details>
        <div className="mentor-actions"><a className="button secondary" href={mentorship.callLink} target="_blank" rel="noreferrer">Open call link <ArrowUpRight size={15} aria-hidden="true" /></a>
          <a className="button secondary" href={googleCalendarUrl(meeting, mentorship.callLink, "Prathmesh", { title: "Product mentorship with Maya", otherName: maya.name, context: mentorship.goal })} target="_blank" rel="noreferrer">Add next meeting to Google Calendar</a></div></>}
      <button type="button" className="button secondary" onClick={() => setMeetingOpen(!meetingOpen)} aria-expanded={meetingOpen}>{meeting ? "Edit meeting schedule" : "Schedule weekly meetings"}</button>
      {meetingOpen && <form className="mentor-form" onSubmit={schedule}>
        <div className="form-row"><label>First meeting<input name="date" type="date" required defaultValue={firstDemoDate(meeting?.start ?? tomorrowInterview(new Date()).start)} /></label><label>Time (IST)<input name="time" type="time" required defaultValue={meeting ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(meeting.start)) : "18:00"} /></label></div>
        <label>Call link<input name="link" type="url" required defaultValue={mentorship.callLink || sampleCallLink} /></label>
        {error && <p role="alert">{error}</p>}
        <button className="button primary" type="submit">Save weekly schedule</button>
      </form>}
    </section>}

    {mentorship.plan && <section className="mentor-plan">
      <h2>Shared growth plan</h2>
      <ol>{steps.map(step => <li className={step.current ? "current" : undefined} key={step.name}>
        <span>{step.done ? <Check size={13} aria-hidden="true" /> : <span className="mentor-dot" />}</span><div><strong>{step.name}</strong><p>{step.status}</p></div>
      </li>)}</ol>
    </section>}

    {active && !mentorship.plan && <section className="mentor-panel"><h2>Shared growth plan</h2><p>Optionally add milestones that build on the work you’ve already done together.</p><button type="button" className="button secondary" onClick={() => update({ type: "create-plan" })}>Create shared growth plan</button></section>}

    {active && <div className="mentor-actions">{confirmFinish ? <>
      <button type="button" className="button secondary" onClick={() => setConfirmFinish(false)}>Keep mentorship open</button>
      <button type="button" className="button primary" onClick={() => update({ type: "finish" })}>Confirm completion</button>
    </> : <button type="button" className="button quiet" onClick={() => setConfirmFinish(true)}>Complete mentorship</button>}</div>}
    {mentorship.phase === "completed" && <section className="mentor-panel"><h2>What did Maya’s help make possible?</h2><p>You can tell her in a letter.</p><button type="button" className="button primary" onClick={onLetters}>Open letters <Mail size={16} aria-hidden="true" /></button></section>}
  </>;
}

export function LetterCard({ letter, speaker }: { letter: Letter; speaker: string }) {
  return <article className="mentor-letter">
    <div className="mentor-letter-kicker"><LetterMark /><span>{letter.from === "maya" ? "A note from Maya" : "Sent to Maya"}</span></div>
    <h2>{letter.title}</h2><p>{letter.body}</p>
    <footer>{letter.from === "maya" && <MayaPortrait size={31} />}<div><strong>{speaker}</strong><span>{letter.featured ? "Featured on your profile" : "Shared with the recipient"}</span></div></footer>
  </article>;
}

export function LetterExchange({ mentorship, update, heading }: Props & Heading) {
  const [tab, setTab] = useState<"maya" | "you">("maya");
  const [writing, setWriting] = useState(false);
  const [notice, setNotice] = useState("");
  const letters = mentorship.letters.filter(letter => letter.from === tab);

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title")).trim();
    const body = String(data.get("body")).trim();
    if (!title || !body) return;
    update({ type: "send-letter", title, body, allowProfile: data.has("sharing") });
    setWriting(false);
    setTab("you");
    setNotice("Letter sent to Maya in the demo.");
  }

  return <>
    <div className="page-heading"><h1 ref={heading} tabIndex={-1}>Letters with Maya</h1><p>Personal notes from your conversations and mentorship.</p></div>
    <div className="letter-tabs" aria-label="Letter direction">
      <button type="button" aria-pressed={tab === "maya"} onClick={() => setTab("maya")}>Received</button>
      <button type="button" aria-pressed={tab === "you"} onClick={() => setTab("you")}>Sent</button>
    </div>
    {notice && <p className="mentor-notice" role="status">{notice}</p>}
    {letters.length === 0 && <p className="mentor-panel">Your letters to Maya will appear here.</p>}
    {letters.map(letter => <div className="letter-group" key={letter.id}>
      <LetterCard letter={letter} speaker={letter.from === "maya" ? "Maya Rao" : "You"} />
      {letter.from === "maya" && letter.allowProfile && <section className="mentor-panel letter-sharing">
        <div className="mentor-panel-heading">{letter.featured ? <Globe2 size={18} aria-hidden="true" /> : <LockKeyhole size={18} aria-hidden="true" />}
          <div><h2>{letter.featured ? "Visible on your profile" : "Between you and Maya"}</h2><p>Maya has allowed you to add this note to your profile.</p></div></div>
        <button type="button" className="button secondary" onClick={() => {
          update({ type: "feature-letter", id: letter.id, featured: !letter.featured });
          setNotice(letter.featured ? "Letter removed from your profile." : "Letter added to your profile.");
        }}>{letter.featured ? "Remove from my profile" : "Add to my profile"} <ArrowUpRight size={15} aria-hidden="true" /></button>
      </section>}
      {letter.from === "you" && letter.allowProfile && <p className="mentor-meta"><Globe2 size={16} aria-hidden="true" /> Maya can choose to feature this on her profile.</p>}
    </div>)}
    {writing ? <form className="form-card mentor-form" onSubmit={send}>
      <h2>Write to Maya</h2>
      <label>Letter title<input name="title" required maxLength={80} placeholder="What did their help make possible?" /></label>
      <label>Your note<textarea name="body" rows={5} required maxLength={1500} placeholder="Tell Maya what her help made possible for you." /></label>
      <label className="mentor-checkbox"><input name="sharing" type="checkbox" /> Allow Maya to feature this letter on her profile</label>
      <div className="mentor-actions"><button className="button primary" type="submit">Send letter <Mail size={16} aria-hidden="true" /></button><button type="button" className="button quiet" onClick={() => setWriting(false)}>Cancel</button></div>
    </form> : <button type="button" className="button primary full-width" onClick={() => setWriting(true)}>Write a letter <Mail size={16} aria-hidden="true" /></button>}
  </>;
}
