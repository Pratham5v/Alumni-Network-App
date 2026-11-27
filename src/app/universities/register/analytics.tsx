"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, CalendarDays, Handshake, Info, ListTodo, Mail, ShieldCheck, Users } from "lucide-react";
import { cohortIds, getAnalytics, percent, periods, type CohortFilter, type Period } from "./analytics-data";
import styles from "./analytics.module.css";

const format = new Intl.NumberFormat("en-IN");
type Report = ReturnType<typeof getAnalytics>;

function InvitationTrend({ trend }: { trend: Report["trend"] }) {
  const title = useId();
  const fill = useId();
  const [week, setWeek] = useState<number | null>(null);
  const maximum = Math.max(...trend.map(point => Math.max(point.invited, point.verified)));
  const increment = maximum > 60 ? 20 : 10;
  const ceiling = Math.ceil(maximum / increment) * increment;
  const ticks = Array.from({ length: ceiling / increment + 1 }, (_, index) => index * increment);
  const plot = { firstX: 48, lastX: 745, top: 21, bottom: 160 };
  const x = (index: number) => plot.firstX + index / (trend.length - 1) * (plot.lastX - plot.firstX);
  const y = (value: number) => plot.bottom - value / ceiling * (plot.bottom - plot.top);
  const points = (key: "invited" | "verified") => trend.map((point, index) => `${x(index)},${y(point[key])}`).join(" ");
  const selected = week === null ? undefined : trend[week];

  return <figure className={styles.card + " " + styles.trend} aria-labelledby={title}>
    <div className={styles.chartHeader}>
      <div><h2 id={title}>Alumni invitations and verification</h2><p>Weekly invitees and how many have verified</p></div>
      <ul className={styles.legend}><li><span />Invited</li><li><span />Verified</li></ul>
    </div>
    <div className={styles.plotLabel}>{selected && <span><strong>{selected.label}</strong> · {selected.invited} invited · {selected.verified} verified</span>}</div>
    <svg className={styles.chart} viewBox="0 0 765 188" aria-hidden="true" onMouseLeave={() => setWeek(null)}>
      <defs><linearGradient id={fill} x1="0%" y1="0%" x2="0%" y2="100%"><stop stopColor="#e2eee4" /><stop offset="1" stopColor="#f7faf4" /></linearGradient></defs>
      {ticks.map(value => <g key={value}>
        <line x1={plot.firstX} x2={plot.lastX} y1={y(value)} y2={y(value)} className={styles.gridLine} />
        <text x={plot.firstX - 10} y={y(value) + 4} textAnchor="end">{value}</text>
      </g>)}
      <polygon points={`${plot.firstX},${plot.bottom} ${points("invited")} ${plot.lastX},${plot.bottom}`} fill={`url(#${fill})`} />
      <polyline points={points("invited")} className={styles.lineInvited} />
      <polyline points={points("verified")} className={styles.lineVerified} />
      {trend.map((point, index) => <g key={point.label}>
        {week === index && <line x1={x(index)} x2={x(index)} y1={plot.top} y2={plot.bottom} className={styles.guide} />}
        <circle cx={x(index)} cy={y(point.invited)} r={week === index ? 5 : 3} className={styles.lineInvited} />
        <circle cx={x(index)} cy={y(point.verified)} r={week === index ? 5 : 3} className={styles.lineVerified} />
        <text x={x(index)} y={180} textAnchor="middle">{point.label}</text>
        <rect x={x(index) - 18} y={plot.top - 6} width={36} height={plot.bottom - plot.top + 12} fill="transparent" onMouseEnter={() => setWeek(index)} />
      </g>)}
    </svg>
    <table className={styles.srOnly}>
      <caption>Weekly invitations and verifications</caption>
      <thead><tr><th scope="col">Week ending</th><th scope="col">Invited</th><th scope="col">Verified</th></tr></thead>
      <tbody>{trend.map(point => <tr key={point.label}><th scope="row">{point.label}</th><td>{point.invited}</td><td>{point.verified}</td></tr>)}</tbody>
    </table>
  </figure>;
}

function Funnel({ total }: { total: Report["total"] }) {
  const stages = [["Invited", total.invited], ["Verified", total.verified], ["Participated", total.participated]] as const;
  return <section className={styles.card}>
    <h2>From invitation to participation</h2><p>Progress for the same invited alumni</p>
    <ol className={styles.funnel}>
      {stages.map(([label, count]) => {
        const share = percent(count, total.invited);
        return <li key={label}>
          <div><strong>{label}</strong><span>{format.format(count)} · {share}%</span></div>
          <div className={styles.track} aria-hidden="true"><span style={{ width: `${share}%` }} /></div>
        </li>;
      })}
    </ol>
    <p className={styles.definition}><Info size={16} aria-hidden="true" /> Participation includes posting an intent, replying to a request, or attending an event.</p>
  </section>;
}

export default function Analytics() {
  const [period, setPeriod] = useState<Period>("all");
  const [cohort, setCohort] = useState<CohortFilter>("all");
  const [reviewing, setReviewing] = useState(false);
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const reviewButton = useRef<HTMLButtonElement>(null);
  const reviewId = useId();
  const { trend, groups, total, followUp } = getAnalytics(period, cohort);

  useEffect(() => {
    if (reviewing) reviewHeading.current?.focus();
  }, [reviewing]);

  const metrics = [
    { label: "Alumni invited", value: total.invited, note: "Invitations issued to the selected group", Icon: Mail },
    { label: "Verified alumni", value: total.verified, note: `${percent(total.verified, total.invited)}% of invited alumni`, Icon: ShieldCheck },
    { label: "Alumni who participated", value: total.participated, note: `${percent(total.participated, total.verified)}% of verified alumni`, Icon: Users },
    { label: "Helpful outcomes", value: total.helpful, note: `${percent(total.helpful, total.rated)}% of ${format.format(total.rated)} rated interactions`, Icon: Handshake },
  ];

  return <section className={styles.report} aria-labelledby="workspace-section-heading">
    <div className={styles.masthead}>
      <p>Track alumni participation from the first invitation to a helpful outcome.</p>
      <div className={styles.filters}>
        <label><CalendarDays size={16} aria-hidden="true" /><span className={styles.srOnly}>Date range</span>
          <select value={period} onChange={event => { setReviewing(false); setPeriod(event.target.value as Period); }}>
            {periods.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label><Users size={16} aria-hidden="true" /><span className={styles.srOnly}>Graduation cohort</span>
          <select value={cohort} onChange={event => { setReviewing(false); setCohort(event.target.value as CohortFilter); }}>
            <option value="all">All graduation cohorts</option>
            {cohortIds.map(id => <option key={id} value={id}>{id}</option>)}
          </select>
        </label>
      </div>
    </div>

    <dl className={styles.metrics} aria-label="Key analytics metrics">
      {metrics.map(({ label, value, note, Icon }) => <div className={styles.card} key={label}>
        <dt>{label}</dt><Icon className={styles.metricIcon} size={35} aria-hidden="true" /><dd>{format.format(value)}</dd><dd>{note}</dd>
      </div>)}
    </dl>

    <div className={styles.reportGrid}>
      <InvitationTrend key={`${period}:${cohort}`} trend={trend} />
      <Funnel total={total} />

      <section className={styles.card}>
        <h2>Participation by graduation cohort</h2>
        <div className={styles.tableFrame}><table>
          <thead><tr><th scope="col">Graduation years</th><th scope="col">Invited</th><th scope="col">Verified</th><th scope="col">Participated</th><th scope="col">Verification rate</th></tr></thead>
          <tbody>{groups.map(group => <tr className={group.id === followUp?.id ? styles.highlight : undefined} key={group.id}>
            <th scope="row">{group.id}</th><td>{group.invited}</td><td>{group.verified}</td><td>{group.participated}</td><td><strong>{percent(group.verified, group.invited)}%</strong></td>
          </tr>)}</tbody>
        </table></div>
      </section>

      {followUp && <aside className={styles.card + " " + styles.followUp}>
        <span className={styles.kicker}><ListTodo size={17} aria-hidden="true" /> Follow-up opportunity</span>
        <h2>{followUp.pending} invitations are still pending</h2>
        <p>{groups.length > 1 ? `The ${followUp.id} cohort has the lowest verification rate.` : `The ${followUp.id} cohort has a ${percent(followUp.verified, followUp.invited)}% verification rate.`} Review who hasn’t verified before sending a reminder.</p>
        <button className={styles.button} type="button" ref={reviewButton} aria-expanded={reviewing} aria-controls={reviewId} onClick={() => setReviewing(!reviewing)}>
          {reviewing ? "Hide pending invitations" : "Review pending invitations"} <ArrowRight size={16} aria-hidden="true" />
        </button>
      </aside>}
      {followUp && <section id={reviewId} className={styles.card + " " + styles.review} hidden={!reviewing}>
        <div className={styles.chartHeader}>
          <div><h2 tabIndex={-1} ref={reviewHeading}>Pending invitations · {followUp.id}</h2><p>Showing {Math.min(followUp.examples.length, followUp.pending)} illustrative records out of {followUp.pending} pending invitations in the selected period.</p></div>
          <button className={styles.button} type="button" onClick={() => { setReviewing(false); reviewButton.current?.focus(); }}>Close review</button>
        </div>
        <div className={styles.tableFrame}><table>
          <thead><tr><th scope="col">Alumnus</th><th scope="col">Graduation cohort</th><th scope="col">Status</th></tr></thead>
          <tbody>{followUp.examples.slice(0, followUp.pending).map(name => <tr key={name}><th scope="row">{name}</th><td>{followUp.id}</td><td><span className={styles.pending}>Awaiting verification</span></td></tr>)}</tbody>
        </table></div>
      </section>}
    </div>
  </section>;
}
