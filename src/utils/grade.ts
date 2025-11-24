// Utilities for converting numeric scores (0-10) to 4.0 GPA scale
// and computing weighted GPA the way commonly used in Vietnamese universities.

export type GradeWithCredit = {
  score: number; // 0-10 scale
  credit: number; // course credit (số tín chỉ)
};

/**
 * Convert a numeric score (0-10) to a 4.0 scale according to a common
 * Vietnamese university mapping.
 *
 * Mapping used (common variant):
 * - [9.0, 10] => 4.0
 * - [8.5, 8.99] => 3.7
 * - [8.0, 8.49] => 3.5
 * - [7.0, 7.99] => 3.0
 * - [6.5, 6.99] => 2.5
 * - [6.0, 6.49] => 2.0
 * - [5.0, 5.99] => 1.0
 * - [0, 4.99] => 0.0
 *
 * Adjust thresholds if your university uses a different mapping.
 */
export function scoreToGpa4(score: number): number {
  if (score === null || score === undefined || isNaN(score)) return 0;
  const s = Number(score);
  if (s < 0) return 0;
  if (s >= 9.0) return 4.0;
  if (s >= 8.5) return 3.7;
  if (s >= 8.0) return 3.5;
  if (s >= 7.0) return 3.0;
  if (s >= 6.5) return 2.5;
  if (s >= 6.0) return 2.0;
  if (s >= 5.0) return 1.0;
  return 0.0;
}

function roundTo(value: number, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Calculate weighted GPA on 4.0 scale.
 *
 * Example:
 *   calculateGpa4([{ score: 8.7, credit: 3 }, { score: 6.5, credit: 2 }])
 *
 * Returns an object with `gpa` (rounded to 2 decimals), `totalCredits`, and `totalWeightedPoints`.
 */
export function calculateGpa4(grades: GradeWithCredit[]): { gpa: number; totalCredits: number; totalWeightedPoints: number } {
  if (!Array.isArray(grades) || grades.length === 0) {
    return { gpa: 0, totalCredits: 0, totalWeightedPoints: 0 };
  }

  let totalCredits = 0;
  let totalWeightedPoints = 0; // sum of (gpa * credit)

  for (const g of grades) {
    const credit = Number(g.credit) || 0;
    const score = Number(g.score) || 0;
    if (credit <= 0) continue;
    const gpa = scoreToGpa4(score);
    totalCredits += credit;
    totalWeightedPoints += gpa * credit;
  }

  if (totalCredits === 0) {
    return { gpa: 0, totalCredits: 0, totalWeightedPoints: roundTo(totalWeightedPoints, 2) };
  }

  const raw = totalWeightedPoints / totalCredits;
  return { gpa: roundTo(raw, 2), totalCredits, totalWeightedPoints: roundTo(totalWeightedPoints, 2) };
}

export default {
  scoreToGpa4,
  calculateGpa4,
};

/**
 * Given an array of components (each has a `score` on 0-10 and a `weight` coefficient),
 * compute the weighted final score for the course.
 *
 * Example: components = [{score: 7.5, weight: 2}, {score: 8.0, weight: 3}, {score: 6.0, weight: 5}]
 * final = sum(score*weight) / sum(weight)
 */
export function courseFinalScoreFromComponents(components: { score: number; weight: number }[]): number {
  if (!Array.isArray(components) || components.length === 0) return 0;
  let totalWeight = 0;
  let total = 0;
  for (const c of components) {
    const s = Number(c.score) || 0;
    const w = Number(c.weight) || 0;
    if (w <= 0) continue;
    total += s * w;
    totalWeight += w;
  }
  if (totalWeight === 0) return 0;
  return roundTo(total / totalWeight, 2);
}

/**
 * Compute course GPA (4.0) by first aggregating components into a final score
 * then converting that final score to 4.0 scale. Returns both finalScore and gpa.
 */
export function courseGpaFromComponents(components: { score: number; weight: number }[]): { finalScore: number; gpa: number } {
  const finalScore = courseFinalScoreFromComponents(components);
  return { finalScore, gpa: scoreToGpa4(finalScore) };
}
