import assert from "node:assert/strict";
import test from "node:test";
import { domainIds, getRubric } from "../src/domain/rubric.ts";
import { scoreReport } from "../src/domain/scoring.ts";

const score = (habitAnswers) => scoreReport({ rubricVersion: 1, habitAnswers });
const rubric = getRubric(1);
const allHabits = domainIds.flatMap((domain) => rubric[domain]);

test("rubric has 23 distinct habits and preserves option weights", () => {
  assert.deepEqual(domainIds.map((domain) => rubric[domain].length), [11, 5, 3, 4]);
  assert.equal(new Set(allHabits.map(({ id }) => id)).size, 23);
  assert.deepEqual(allHabits.map(({ options }) => options.map(({ weight }) => weight)), [
    [1, .8, .4, 0], [1, .67, .33, 0], [1, .8, .4, 0, null],
    [1, .5, 0], [1, .5, 0], [1, .5, 0, null], [1, 1, .5, 0],
    [1, .7, .7, .4, 0], [1, .5, 0, 0], [1, .5, 0, 0], [0, 1],
    [1, .7, .3, 0], [1, .7, .3, 0], [1, .5, 0, null],
    [1, .7, .3, 0, null], [1, .7, .3, 0],
    [1, .5, 0], [1, .5, 0, 1], [1, .5, 0],
    [1, .5, 0, null], [1, .5, 0, null], [1, .5, 0, null], [1, .5, 0, null],
  ]);
  assert.equal(rubric.health.find(({ id }) => id === "badHabit").label, "The Bad Habit");
});

test("blank report has no scores and 23 unanswered habits", () => {
  const result = score({});
  assert.deepEqual(result.overall, { status: "unavailable", score: null });
  assert.deepEqual(result.completeness, { answered: 0, unanswered: 23, excluded: 0, total: 23 });
  assert.ok(Object.values(result.domains).every(({ score }) => score === null));
});

test("zero is scored and unanswered and excluded options stay out of the average", () => {
  const result = score({ fluids: "1", meals: "4", activity: "5", eyeBreaks: "4" });
  assert.deepEqual(result.domains.health, {
    score: .5, answered: 4, unanswered: 7, excluded: 2, applicable: 2,
  });
  assert.deepEqual(result.completeness, { answered: 4, unanswered: 19, excluded: 2, total: 23 });
});

test("an excluded-only domain cannot support a four-domain score", () => {
  const result = score({
    fluids: "1", english: "1", wastefulSpending: "1", childrenTime: "4",
  });
  assert.equal(result.domains.family.score, null);
  assert.equal(result.overall.status, "unavailable");
});

test("a zero domain counts toward an equal-weighted provisional score", () => {
  const result = score({
    fluids: "1", teeth: "1", meals: "1", english: "4",
    unusedPurchases: "4", childrenTime: "2",
  });
  assert.equal(result.domains.personalDevelopment.score, 0);
  assert.deepEqual(result.overall, { status: "provisional", score: .625 });
});

test("all 23 answered habits give a complete score even with exclusions", () => {
  const answers = Object.fromEntries(allHabits.map((habit) => [
    habit.id, habit.options.find(({ weight }) => weight === 1).id,
  ]));
  answers.activity = "5";
  answers.seminar = "4";
  const result = score(answers);
  assert.deepEqual(result.overall, { status: "complete", score: 1 });
  assert.deepEqual(result.completeness, { answered: 23, unanswered: 0, excluded: 2, total: 23 });
});

test("a fully answered report without applicable family answers has no overall score", () => {
  const answers = Object.fromEntries(allHabits.map(({ id }) => [id, "1"]));
  for (const { id } of rubric.family) answers[id] = "4";
  const result = score(answers);
  assert.equal(result.completeness.unanswered, 0);
  assert.equal(result.overall.status, "unavailable");
});

test("preserves precision until display", () => {
  const result = score({ fluids: "1", meals: "4", teeth: "3" });
  assert.equal(result.domains.health.score, 1 / 3);
});

test("nicotine replacement earns full credit and a lapse earns partial credit", () => {
  assert.equal(score({ smoking: "2" }).domains.health.score, 1);
  assert.equal(score({ smoking: "3" }).domains.health.score, .5);
  assert.equal(score({ smoking: "4" }).domains.health.score, 0);
});

test("wellbeing, family events, and submission state do not affect scores", () => {
  const report = { rubricVersion: 1, habitAnswers: { childrenTime: "1" } };
  assert.deepEqual(scoreReport({
    ...report,
    wellbeing: { stress: 10 },
    familyEvents: { child1: { occurred: true } },
    submittedAt: "2026-01-01T00:00:00Z",
  }), scoreReport(report));
});

test("unsupported rubric versions and unknown options fail explicitly", () => {
  assert.throws(() => scoreReport({ rubricVersion: 999, habitAnswers: {} }), RangeError);
  assert.throws(() => score({ fluids: "unknown" }), RangeError);
});
