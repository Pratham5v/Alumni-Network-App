import Link from "next/link";
import { ArrowUpRight, Layers3 } from "lucide-react";
import styles from "./universities.module.css";

export default function OfferHeader() {
  return (
    <header className={styles.header}>
        <div className={styles.container}>
        <Link className="wordmark" href="/universities" aria-label="Alumni for universities">
          <Layers3 size={25} strokeWidth={1.7} aria-hidden="true" />alumni<span className="wordmark-period">.</span>
        </Link>
        <Link className={styles.headerOffer} href="/universities">What we offer</Link>
        <nav aria-label="University actions">
          <Link href="/">Alumni prototype <ArrowUpRight size={15} aria-hidden="true" /></Link>
          <Link className={styles.primary} href="/universities/register">Register your university</Link>
        </nav>
      </div>
    </header>
  );
}
