export const domainIds = ["health", "personalDevelopment", "financialDiscipline", "family"] as const;

export type DomainId = (typeof domainIds)[number];

export const currentRubricVersion = 1;

interface HabitOption {
  readonly id: string;
  readonly label: string;
  readonly weight: number | null;
}

interface HabitRule {
  readonly id: HabitId;
  readonly label: string;
  readonly options: readonly HabitOption[];
}

// Published versions keep their option IDs and weights for historical reports.
const rubricV1 = {
  health: [
    {
      id: "fluids",
      label: "Fluid Intake",
      options: [
        { id: "1", label: "2.5–3 L or more", weight: 1 },
        { id: "2", label: "2–2.49 L", weight: 0.8 },
        { id: "3", label: "1–1.99 L", weight: 0.4 },
        { id: "4", label: "Less than 1 L", weight: 0 },
      ],
    },
    {
      id: "meals",
      label: "Balanced Meals With Protein",
      options: [
        { id: "1", label: "3 meals", weight: 1 },
        { id: "2", label: "2 meals", weight: 0.67 },
        { id: "3", label: "1 meal", weight: 0.33 },
        { id: "4", label: "None", weight: 0 },
      ],
    },
    {
      id: "activity",
      label: "Physical Activity",
      options: [
        { id: "1", label: "20+ minutes", weight: 1 },
        { id: "2", label: "15–19 minutes", weight: 0.8 },
        { id: "3", label: "1–14 minutes", weight: 0.4 },
        { id: "4", label: "None", weight: 0 },
        { id: "5", label: "Medically deferred", weight: null },
      ],
    },
    {
      id: "teeth",
      label: "Brushing Teeth",
      options: [
        { id: "1", label: "Twice", weight: 1 },
        { id: "2", label: "Once", weight: 0.5 },
        { id: "3", label: "None", weight: 0 },
      ],
    },
    {
      id: "skincare",
      label: "Skincare",
      options: [
        { id: "1", label: "Cleanse and moisturize", weight: 1 },
        { id: "2", label: "One only", weight: 0.5 },
        { id: "3", label: "None", weight: 0 },
      ],
    },
    {
      id: "eyeBreaks",
      label: "Screen and Eye Breaks",
      options: [
        { id: "1", label: "Regular breaks", weight: 1 },
        { id: "2", label: "Some breaks", weight: 0.5 },
        { id: "3", label: "None", weight: 0 },
        { id: "4", label: "Not applicable", weight: null },
      ],
    },
    {
      id: "smoking",
      label: "Smoking Cessation",
      options: [
        { id: "1", label: "No nicotine, plan followed", weight: 1 },
        { id: "2", label: "Nicotine replacement treatment as planned, without smoking", weight: 1 },
        { id: "3", label: "Lapse, returned to plan", weight: 0.5 },
        { id: "4", label: "Repeated smoking or vaping", weight: 0 },
      ],
    },
    {
      id: "sleep",
      label: "Sleep Duration",
      options: [
        { id: "1", label: "7–9 hours", weight: 1 },
        { id: "2", label: "6–7 hours", weight: 0.7 },
        { id: "3", label: "More than 9 hours", weight: 0.7 },
        { id: "4", label: "4–6 hours", weight: 0.4 },
        { id: "5", label: "Less than 4 hours", weight: 0 },
      ],
    },
    {
      id: "snack1",
      label: "Healthy Snack 1",
      options: [
        { id: "1", label: "Balanced healthy snack", weight: 1 },
        { id: "2", label: "Partly healthy", weight: 0.5 },
        { id: "3", label: "Unhealthy snack", weight: 0 },
        { id: "4", label: "None", weight: 0 },
      ],
    },
    {
      id: "snack2",
      label: "Healthy Snack 2",
      options: [
        { id: "1", label: "Balanced healthy snack", weight: 1 },
        { id: "2", label: "Partly healthy", weight: 0.5 },
        { id: "3", label: "Unhealthy snack", weight: 0 },
        { id: "4", label: "None", weight: 0 },
      ],
    },
    {
      id: "badHabit",
      label: "The Bad Habit",
      options: [
        { id: "1", label: "Yes", weight: 0 },
        { id: "2", label: "No", weight: 1 },
      ],
    },
  ],
  personalDevelopment: [
    {
      id: "outsideReading",
      label: "Reading Outside Profession",
      options: [
        { id: "1", label: "30+ minutes", weight: 1 },
        { id: "2", label: "15–29 minutes", weight: 0.7 },
        { id: "3", label: "1–14 minutes", weight: 0.3 },
        { id: "4", label: "None", weight: 0 },
      ],
    },
    {
      id: "professionalReading",
      label: "Professional Reading",
      options: [
        { id: "1", label: "30+ minutes", weight: 1 },
        { id: "2", label: "15–29 minutes", weight: 0.7 },
        { id: "3", label: "1–14 minutes", weight: 0.3 },
        { id: "4", label: "None", weight: 0 },
      ],
    },
    {
      id: "seminar",
      label: "Scientific Seminar",
      options: [
        { id: "1", label: "Attended or watched", weight: 1 },
        { id: "2", label: "Partial session", weight: 0.5 },
        { id: "3", label: "None", weight: 0 },
        { id: "4", label: "Not applicable", weight: null },
      ],
    },
    {
      id: "mastersStudy",
      label: "Master's Study",
      options: [
        { id: "1", label: "60+ minutes", weight: 1 },
        { id: "2", label: "30–59 minutes", weight: 0.7 },
        { id: "3", label: "1–29 minutes", weight: 0.3 },
        { id: "4", label: "None", weight: 0 },
        { id: "5", label: "Not applicable", weight: null },
      ],
    },
    {
      id: "english",
      label: "English Learning",
      options: [
        { id: "1", label: "30+ minutes", weight: 1 },
        { id: "2", label: "15–29 minutes", weight: 0.7 },
        { id: "3", label: "1–14 minutes", weight: 0.3 },
        { id: "4", label: "None", weight: 0 },
      ],
    },
  ],
  financialDiscipline: [
    {
      id: "unnecessaryPurchases",
      label: "Unnecessary Purchases",
      options: [
        { id: "1", label: "None", weight: 1 },
        { id: "2", label: "Minor unnecessary purchase", weight: 0.5 },
        { id: "3", label: "Significant unnecessary purchase", weight: 0 },
      ],
    },
    {
      id: "unusedPurchases",
      label: "Unused Purchases",
      options: [
        { id: "1", label: "All purchases useful", weight: 1 },
        { id: "2", label: "Some potentially unused", weight: 0.5 },
        { id: "3", label: "Bought items unlikely to be used", weight: 0 },
        { id: "4", label: "No purchases", weight: 1 },
      ],
    },
    {
      id: "wastefulSpending",
      label: "Wasteful Spending",
      options: [
        { id: "1", label: "None", weight: 1 },
        { id: "2", label: "Minor waste", weight: 0.5 },
        { id: "3", label: "Significant waste", weight: 0 },
      ],
    },
  ],
  family: [
    {
      id: "partnerTime",
      label: "Quality Time With Partner",
      options: [
        { id: "1", label: "Meaningful quality time", weight: 1 },
        { id: "2", label: "Brief positive interaction", weight: 0.5 },
        { id: "3", label: "No quality time", weight: 0 },
        { id: "4", label: "Not applicable", weight: null },
      ],
    },
    {
      id: "childrenTime",
      label: "Quality Time With Children",
      options: [
        { id: "1", label: "Meaningful quality time", weight: 1 },
        { id: "2", label: "Brief positive interaction", weight: 0.5 },
        { id: "3", label: "No quality time", weight: 0 },
        { id: "4", label: "Not applicable", weight: null },
      ],
    },
    {
      id: "studySupport",
      label: "Helping Children Study",
      options: [
        { id: "1", label: "Meaningful study support", weight: 1 },
        { id: "2", label: "Brief study support", weight: 0.5 },
        { id: "3", label: "None", weight: 0 },
        { id: "4", label: "Not applicable", weight: null },
      ],
    },
    {
      id: "play",
      label: "Playing With Children",
      options: [
        { id: "1", label: "Meaningful play", weight: 1 },
        { id: "2", label: "Brief play", weight: 0.5 },
        { id: "3", label: "None", weight: 0 },
        { id: "4", label: "Not applicable", weight: null },
      ],
    },
  ],
} as const;

export type HabitId = (typeof rubricV1)[DomainId][number]["id"];

const rubrics: ReadonlyMap<number, Readonly<Record<DomainId, readonly HabitRule[]>>> =
  new Map([[1, rubricV1]]);

export function getRubric(version: number) {
  const rubric = rubrics.get(version);
  if (!rubric) {
    throw new RangeError("Unsupported scoring rubric version");
  }
  return rubric;
}
