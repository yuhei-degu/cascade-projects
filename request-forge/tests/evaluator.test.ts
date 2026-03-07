/**
 * テスト: AI評価エンジン (src/lib/ai/evaluator.ts)
 */
import { aggregateEvaluations } from "@/lib/ai/evaluator";
import type { AiEvaluationResult } from "@/types";

describe("aggregateEvaluations", () => {
  const base: AiEvaluationResult = {
    model: "test", feasible: true, feasibilityScore: 80,
    concerns: [], suggestions: "",
  };

  test("全員可 → feasible", () => {
    const evals: AiEvaluationResult[] = [
      { ...base, feasible: true,  feasibilityScore: 80 },
      { ...base, feasible: true,  feasibilityScore: 70 },
    ];
    const { verdict, avgScore } = aggregateEvaluations(evals);
    expect(verdict).toBe("feasible");
    expect(avgScore).toBe(75);
  });

  test("全員不可 → infeasible", () => {
    const evals: AiEvaluationResult[] = [
      { ...base, feasible: false, feasibilityScore: 10 },
      { ...base, feasible: false, feasibilityScore: 20 },
    ];
    const { verdict, avgScore } = aggregateEvaluations(evals);
    expect(verdict).toBe("infeasible");
    expect(avgScore).toBe(15);
  });

  test("1人可・1人不可 → partial", () => {
    const evals: AiEvaluationResult[] = [
      { ...base, feasible: true,  feasibilityScore: 75 },
      { ...base, feasible: false, feasibilityScore: 25 },
    ];
    const { verdict, avgScore } = aggregateEvaluations(evals);
    expect(verdict).toBe("partial");
    expect(avgScore).toBe(50);
  });

  test("空配列 → infeasible (avgScore NaN→0相当)", () => {
    const { verdict } = aggregateEvaluations([]);
    expect(verdict).toBe("infeasible");
  });
});
