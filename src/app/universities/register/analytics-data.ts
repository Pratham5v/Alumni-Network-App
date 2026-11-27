const weeks = ["8 Oct", "15 Oct", "22 Oct", "29 Oct", "5 Nov", "12 Nov", "19 Nov", "26 Nov"];

const measures = ["invited", "verified", "participated", "rated", "helpful"] as const;
type Measure = (typeof measures)[number];
type Counts = Record<Measure, number>;

export const periods = [
  { id: "all", label: "02 Oct – 26 Nov 2026", from: 0, to: 8 },
  { id: "recent", label: "30 Oct – 26 Nov 2026", from: 4, to: 8 },
  { id: "previous", label: "02 Oct – 29 Oct 2026", from: 0, to: 4 },
] as const;

export type Period = (typeof periods)[number]["id"];

// Each row follows that week’s invitees. Outcomes are counted as of the sample report date.
const cohorts = [
  {
    id: "2015–2018", examples: ["Ira Khanna", "Dev Malhotra", "Nikhil Menon"],
    invited: [10, 12, 12, 13, 15, 15, 18, 25], verified: [5, 6, 7, 9, 10, 10, 12, 16],
    participated: [3, 4, 5, 6, 7, 7, 9, 12], rated: [2, 3, 4, 5, 6, 6, 8, 10], helpful: [1, 2, 3, 4, 4, 5, 6, 8],
  },
  {
    id: "2019–2022", examples: ["Kabir Mehta", "Meera Nair", "Vikram Iyer"],
    invited: [13, 16, 16, 18, 22, 20, 25, 30], verified: [7, 9, 10, 13, 14, 14, 17, 21],
    participated: [4, 6, 7, 9, 10, 10, 12, 15], rated: [3, 4, 6, 8, 8, 9, 10, 13], helpful: [2, 3, 4, 6, 6, 7, 8, 10],
  },
  {
    id: "2023–2026", examples: ["Ananya Sen", "Ishaan Sethi", "Tara Desai"],
    invited: [10, 14, 16, 17, 20, 20, 24, 27], verified: [5, 7, 8, 8, 10, 11, 14, 18],
    participated: [2, 4, 4, 5, 6, 7, 8, 12], rated: [2, 3, 3, 4, 5, 6, 7, 11], helpful: [1, 2, 2, 3, 4, 4, 5, 8],
  },
] as const;

export const cohortIds = cohorts.map(group => group.id);
export type CohortFilter = "all" | (typeof cohorts)[number]["id"];
export const percent = (part: number, total: number) => total ? Math.round(100 * part / total) : 0;

const emptyCounts = (): Counts => ({ invited: 0, verified: 0, participated: 0, rated: 0, helpful: 0 });
const addCounts = (total: Counts, counts: Counts) => {
  measures.forEach(key => { total[key] += counts[key]; });
  return total;
};

export function getAnalytics(period: Period, cohort: CohortFilter) {
  const range = periods.find(item => item.id === period) ?? periods[0];
  const visible = cohorts.filter(group => cohort === "all" || group.id === cohort);
  const trend = weeks.slice(range.from, range.to).map((label, index) => {
    const week = range.from + index;
    return {
      label,
      invited: visible.reduce((sum, group) => sum + group.invited[week], 0),
      verified: visible.reduce((sum, group) => sum + group.verified[week], 0),
    };
  });

  const groups = visible.map(group => {
    const counts = emptyCounts();
    measures.forEach(key => { counts[key] = group[key].slice(range.from, range.to).reduce((sum, value) => sum + value, 0); });
    return { id: group.id, examples: group.examples, ...counts, pending: counts.invited - counts.verified };
  });
  const total = groups.reduce(addCounts, emptyCounts());
  const followUp = groups.reduce<(typeof groups)[number] | undefined>((lowest, group) => {
    if (!group.pending) return lowest;
    return !lowest || group.verified / group.invited < lowest.verified / lowest.invited ? group : lowest;
  }, undefined);

  return { trend, groups, total, followUp };
}
