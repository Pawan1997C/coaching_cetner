export const percentage = (marks: number, total: number) =>
  total > 0 ? Math.round((marks / total) * 1000) / 10 : 0;

export const gradeFor = (pct: number) =>
  pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'F';
