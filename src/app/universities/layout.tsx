import styles from "./universities.module.css";

export default function UniversitiesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={styles.site}>{children}</div>;
}
