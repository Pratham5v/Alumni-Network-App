import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Database, Mail, Settings2 } from "lucide-react";
import OfferHeader from "./offer-header";
import OfferAudience from "./offer-audience";
import styles from "./universities.module.css";

export const metadata: Metadata = { title: "What we offer | Alumni for universities" };

export default function UniversityOfferPage() {
  return (
    <>
      <OfferHeader />
      <main>
        <section className={styles.offerHero}>
          <div className={styles.container + " " + styles.heroGrid}>
            <div>
              <p className={styles.eyebrow}>For universities</p>
              <h1>A complete university network application <span className={styles.swish}>for your university<svg viewBox="0 0 320 18" preserveAspectRatio="none" aria-hidden="true"><path d="M4 13C86 5 196 3 316 10" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" /></svg></span></h1>
              <p className={styles.lead}>Engage alumni, build stronger communities, and drive your institution’s long-term impact - all in one platform.</p>
              <Link className={styles.primary} href="/universities/register">Register your university <ArrowRight size={18} aria-hidden="true" /></Link>
            </div>
            <div className={styles.campus}>
              <Image src="/universities/campus.webp" alt="" width={535} height={280} unoptimized fetchPriority="high" />
            </div>
          </div>
        </section>

        <section className={styles.container + " " + styles.offerContent} aria-label="Platform capabilities">
          <OfferAudience />
          <div className={styles.deployment}>
            <div>
              <Database size={24} aria-hidden="true" />
              <div>
                <h2>Hosting &amp; data separation</h2>
                <p>Planned shared platform with isolated data, Row-Level Security (RLS), and access control.</p>
                <div className={styles.deploymentContact}>
                  <p>Dedicated databases and university-hosted deployment by request.</p>
                  <button className={styles.contact} type="button" aria-label="Contact us about hosting" title="Contact us about dedicated databases or university hosting">
                    <Mail size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
            <div>
              <Settings2 size={24} aria-hidden="true" />
              <div><h2>Branding &amp; integrations</h2><p>Custom domains, university branding, email sender domains, CRM sync, and donation gateways.</p></div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
