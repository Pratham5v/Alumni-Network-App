export type AlumniDetails = { name: string; batch: string; degree: string; branch: string };
type VerificationResult = "unchecked" | "matched" | "needs-review" | "review-requested";
type OnboardingState = {
  method: "google" | "manual" | null;
  details: AlumniDetails;
  result: VerificationResult;
};

export const sampleUniversityAccount = {
  name: "Prathmesh Mehrotra",
  email: "prathmesh.mehrotra@alumni.bits.example",
  institution: "BITS Pilani",
};

// Separate fixture for the institution's record. Google supplies only the demo identity.
export const sampleAlumniRecord = {
  email: "prathmesh.mehrotra@alumni.bits.example",
  name: "Prathmesh Mehrotra",
  batch: "2026",
  degree: "B.E.",
  branch: "Computer Science",
};

export const initialOnboardingState: OnboardingState = {
  method: null,
  details: { name: "", batch: "", degree: "", branch: "" },
  result: "unchecked",
};

type OnboardingAction =
  | { type: "reset" | "select-account" | "manual" | "check" | "request-review" | "resume-review" }
  | { type: "open-review"; details: AlumniDetails }
  | { type: "edit"; field: keyof AlumniDetails; value: string };

export function recordDifferences(details: AlumniDetails) {
  const fields = { name: "name", batch: "graduation year", degree: "degree", branch: "branch" } as const;
  const normalized = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
  return (Object.keys(fields) as (keyof AlumniDetails)[])
    .filter(field => normalized(details[field]) !== normalized(sampleAlumniRecord[field]))
    .map(field => fields[field]);
}

export function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case "reset": return initialOnboardingState;
    case "open-review": return { method: "manual", details: action.details, result: "review-requested" };
    case "resume-review": return { ...state, method: "manual", result: "unchecked" };
    case "select-account":
      return { method: "google", result: "unchecked", details: {
        name: sampleUniversityAccount.name, batch: sampleAlumniRecord.batch,
        degree: sampleAlumniRecord.degree, branch: sampleAlumniRecord.branch,
      } };
    case "manual": return { ...state, method: "manual", result: "unchecked" };
    case "edit":
      if (state.result === "review-requested") return state;
      return { ...state, result: "unchecked", details: { ...state.details, [action.field]: action.value } };
    case "check":
      if (state.method !== "google" || state.result === "review-requested") return state;
      return { ...state, result: sampleUniversityAccount.email === sampleAlumniRecord.email && recordDifferences(state.details).length === 0 ? "matched" : "needs-review" };
    case "request-review":
      if (state.method !== "manual" && state.result !== "needs-review") return state;
      if (!Object.values(state.details).every(value => value.trim()) || !/^\d{4}$/.test(state.details.batch)) return state;
      return { ...state, result: "review-requested" };
  }
}
