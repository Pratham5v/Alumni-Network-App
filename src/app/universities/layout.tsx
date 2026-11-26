import Link from "next/link";
import { ArrowUpRight, Layers3 } from "lucide-react";
import styles from "./universities.module.css";

export default function UniversitiesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={styles.site}>
      <header className={styles.header}>
        <div className={styles.container}>
          <Link className="wordmark" href="/universities" aria-label="Alumni for universities">
            <Layers3 size={25} strokeWidth={1.7} aria-hidden="true" />alumni<span className="wordmark-period">.</span>
          </Link>
          <nav aria-label="University navigation">
            <Link href="/universities/what-we-offer">What we offer</Link>
            <Link href="/">Alumni prototype <ArrowUpRight size={15} aria-hidden="true" /></Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
