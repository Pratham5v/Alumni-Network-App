import type { Metadata } from "next";
import RegistrationWalkthrough from "./registration-walkthrough";

export const metadata: Metadata = { title: "Register your university | Alumni" };

export default function UniversityRegistrationPage() {
  return <RegistrationWalkthrough />;
}
