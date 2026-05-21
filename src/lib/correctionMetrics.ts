/**
 * GWA / earned-units rules aligned with grading_system_rows (credit_unit, compute_gwa).
 * Keep in sync with sms-client/src/lib/correctionMetrics.ts
 */
export type CorrectionLineLike = {
  credit_units?: string | number | null;
  midterm?: string | null;
  final?: string | null;
  re_exam?: string | null;
  remarks?: string | null;
};

export type GradingRowLike = {
  grade_point: string;
  letter_grade: string;
  credit_unit: boolean;
  compute_gwa: boolean;
};

function norm(s: string | null | undefined) {
  return (s ?? "").trim().toUpperCase();
}

export function effectiveGradeLine(line: CorrectionLineLike): string {
  const f = line.final != null ? String(line.final).trim() : "";
  if (f) return f;
  const rx = line.re_exam != null ? String(line.re_exam).trim() : "";
  if (rx) return rx;
  const m = line.midterm != null ? String(line.midterm).trim() : "";
  return m;
}

export function matchGradingRule(effective: string, rows: GradingRowLike[]): GradingRowLike | null {
  const u = norm(effective);
  if (!u) return null;
  for (const r of rows) {
    if (norm(r.letter_grade) === u) return r;
    if (norm(r.grade_point) === u) return r;
  }
  const parsed = parseFloat(effective.replace(/,/g, "."));
  if (Number.isFinite(parsed)) {
    for (const r of rows) {
      const gp = parseFloat(String(r.grade_point).replace(/,/g, "."));
      if (Number.isFinite(gp) && Math.abs(gp - parsed) < 1e-6) return r;
    }
  }
  return null;
}

export type CorrectionMetrics = {
  total_subjects: number;
  total_units_enrolled: number;
  total_units_earned: number;
  gwa: number | null;
};

export function computeCorrectionMetrics(lines: CorrectionLineLike[], gradingRows: GradingRowLike[]): CorrectionMetrics {
  let totalUnitsEnrolled = 0;
  let totalUnitsEarned = 0;
  let weighted = 0;
  let gwaUnits = 0;

  for (const line of lines) {
    const units = Number(line.credit_units) || 0;
    totalUnitsEnrolled += units;
    const g = effectiveGradeLine(line);
    if (!g) continue;
    const rule = matchGradingRule(g, gradingRows);
    if (rule?.credit_unit) totalUnitsEarned += units;
    if (rule?.compute_gwa) {
      const gp = parseFloat(String(rule.grade_point).replace(/,/g, "."));
      if (Number.isFinite(gp)) {
        weighted += units * gp;
        gwaUnits += units;
      }
    }
  }

  return {
    total_subjects: lines.length,
    total_units_enrolled: totalUnitsEnrolled,
    total_units_earned: totalUnitsEarned,
    gwa: gwaUnits > 0 ? weighted / gwaUnits : null,
  };
}

/** Share of subjects that did not earn credit (for scholastic delinquency %). */
export function failingSubjectPercent(lines: CorrectionLineLike[], gradingRows: GradingRowLike[]): number {
  if (!lines.length) return 0;
  let failed = 0;
  for (const line of lines) {
    const g = effectiveGradeLine(line);
    if (!g) {
      failed += 1;
      continue;
    }
    const rule = matchGradingRule(g, gradingRows);
    if (!rule?.credit_unit) failed += 1;
  }
  return (failed / lines.length) * 100;
}
