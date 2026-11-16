import type { HabitId } from "./rubric.ts";

export type HabitAnswers = Readonly<Partial<Record<HabitId, string>>>;

export type Rating = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface FamilyEvent {
  occurred: boolean;
  note?: string;
}

export interface DailyReport {
  date: string;
  dayType: "workday" | "dayOff" | "partialWorkday";
  shift: "morning" | "night" | "notApplicable";
  hoursWorked?: number;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  rubricVersion: number;
  habitAnswers: HabitAnswers;
  healthComplaints?: string;
  familyEvents?: Partial<Record<"child1" | "child2" | "partner", FamilyEvent>>;
  wellbeing?: Partial<Record<"mood" | "energy" | "stress" | "motivation" | "focus", Rating>>;
  notes?: string;
}
