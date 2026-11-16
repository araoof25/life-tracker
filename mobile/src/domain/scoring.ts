import type { DailyReport } from "./report.ts";
import { domainIds, getRubric } from "./rubric.ts";
import type { DomainId } from "./rubric.ts";

interface DomainScore {
  score: number | null;
  answered: number;
  unanswered: number;
  excluded: number;
  applicable: number;
}

type OverallScore =
  | { status: "unavailable"; score: null }
  | { status: "provisional" | "complete"; score: number };

export function scoreReport(report: Pick<DailyReport, "rubricVersion" | "habitAnswers">) {
  const rubric = getRubric(report.rubricVersion);
  const domains = {} as Record<DomainId, DomainScore>;
  let answered = 0;
  let unanswered = 0;
  let excluded = 0;
  let domainTotal = 0;
  let availableDomains = 0;

  for (const domain of domainIds) {
    const result: DomainScore = {
      score: null, answered: 0, unanswered: 0, excluded: 0, applicable: 0,
    };
    let weightTotal = 0;

    for (const habit of rubric[domain]) {
      const answer = report.habitAnswers[habit.id];
      if (answer === undefined) {
        result.unanswered += 1;
        continue;
      }

      const option = habit.options.find(({ id }) => id === answer);
      if (!option) {
        throw new RangeError("Unknown habit option");
      }
      result.answered += 1;

      if (option.weight === null) {
        result.excluded += 1;
        continue;
      }
      result.applicable += 1;
      weightTotal += option.weight;
    }

    if (result.applicable > 0) {
      result.score = weightTotal / result.applicable;
      domainTotal += result.score;
      availableDomains += 1;
    }
    domains[domain] = result;
    answered += result.answered;
    unanswered += result.unanswered;
    excluded += result.excluded;
  }

  const overall: OverallScore = availableDomains === domainIds.length
    ? { status: unanswered === 0 ? "complete" : "provisional", score: domainTotal / domainIds.length }
    : { status: "unavailable", score: null };

  return {
    domains,
    overall,
    completeness: { answered, unanswered, excluded, total: answered + unanswered },
  };
}
