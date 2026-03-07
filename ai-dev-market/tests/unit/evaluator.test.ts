/**
 * 7. テスト — AI審査エンジン ユニットテスト
 * tests/unit/evaluator.test.ts
 */

import { aggregateVerdicts } from "../../src/lib/ai/evaluator";

describe("aggregateVerdicts", () => {
  test("両方A → A", () => {
    const r = aggregateVerdicts([
      { verdict: "A", score: 90 },
      { verdict: "A", score: 85 },
    ]);
    expect(r.verdict).toBe("A");
    expect(r.avgScore).toBe(88);
  });

  test("両方C → C", () => {
    const r = aggregateVerdicts([
      { verdict: "C", score: 10 },
      { verdict: "C", score: 20 },
    ]);
    expect(r.verdict).toBe("C");
    expect(r.avgScore).toBe(15);
  });

  test("AとC → B（部分的可）", () => {
    const r = aggregateVerdicts([
      { verdict: "A", score: 80 },
      { verdict: "C", score: 20 },
    ]);
    expect(r.verdict).toBe("B");
    expect(r.avgScore).toBe(50);
  });

  test("AとB → B", () => {
    const r = aggregateVerdicts([
      { verdict: "A", score: 85 },
      { verdict: "B", score: 60 },
    ]);
    expect(r.verdict).toBe("B");
  });

  test("1件のみ（API失敗時フォールバック）", () => {
    const r = aggregateVerdicts([{ verdict: "A", score: 75 }]);
    expect(r.verdict).toBe("A");
    expect(r.avgScore).toBe(75);
  });

  test("スコアが小数点でも整数に丸める", () => {
    const r = aggregateVerdicts([
      { verdict: "A", score: 70 },
      { verdict: "A", score: 71 },
      { verdict: "A", score: 72 },
    ]);
    expect(Number.isInteger(r.avgScore)).toBe(true);
    expect(r.avgScore).toBe(71);
  });
});
