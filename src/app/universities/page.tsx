import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, ShieldCheck, Users } from "lucide-react";
import styles from "./universities.module.css";

export const metadata: Metadata = { title: "Alumni for universities" };

const highlights = [
  { Icon: Users, title: "Give alumni a reason to return", text: "Help graduates find relevant people, ask for help, and give back when they can." },
  { Icon: Building2, title: "Bring alumni operations together", text: "Verify graduates, reach the right groups, and manage communities, events, and fundraising." },
  { Icon: ShieldCheck, title: "Make the network your own", text: "Choose your branding, domain, and which features your graduates can use." },
];

export default function UniversitiesPage() {
  return (
    <main>
      <section className={styles.landingHero}>
        <div className={styles.container + " " + styles.heroGrid}>
          <div>
            <p className={styles.eyebrow}>For universities</p>
            <h1>Keep your alumni connected long after graduation.</h1>
            <p className={styles.lead}>Give graduates a place to find and help each other, and give your alumni relations team one place to run the network.</p>
            <Link href="/universities/what-we-offer" className={styles.primary}>See what we offer <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
          <aside className={styles.landingExample} aria-label="Example alumni request">
            <p className={styles.exampleLabel}><Building2 size={17} aria-hidden="true" /> Your university’s alumni network</p>
            <div className={styles.exampleCard}>
              <p className={styles.eyebrow}>Alumni request</p>
              <h2>“I’d love feedback on my startup idea.”</h2>
              <div className={styles.exampleMatch}>
                <Image src="/avatars/aarav.svg" alt="" width={42} height={42} />
                <div><strong>Aarav Shah</strong><p>Product Manager · Open to helping</p></div>
              </div>
            </div>
            <p className={styles.exampleCaption}>From a current need to a conversation with someone who can help.</p>
          </aside>
        </div>
      </section>
      <section className={styles.container + " " + styles.highlights} aria-label="Platform highlights">
        {highlights.map(({ Icon, title, text }) => (
          <div key={title}>
            <Icon size={24} aria-hidden="true" />
            <h2>{title}</h2>
            <p>{text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
