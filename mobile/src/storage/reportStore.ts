import type { DailyReport } from "../domain/report.ts";
import { scoreReport } from "../domain/scoring.ts";
import { createReportSchema, schemaVersion } from "./schema.ts";

type Parameter = string | number | null;

interface ReportDatabase {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string, ...params: Parameter[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: Parameter[]): Promise<T[]>;
  runAsync(sql: string, ...params: Parameter[]): Promise<unknown>;
}

type Payload = Omit<DailyReport, "date" | "createdAt" | "updatedAt" | "submittedAt" | "rubricVersion">;

interface ReportRow {
  report_date: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  rubric_version: number;
  payload: string;
}

function reportFromRow(row: ReportRow): DailyReport {
  const payload = JSON.parse(row.payload) as Payload;
  return {
    ...payload,
    date: row.report_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at ?? undefined,
    rubricVersion: row.rubric_version,
  };
}

function validateReportDate(date: string) {
  const parsed = new Date(date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(parsed.valueOf()) ||
      parsed.toISOString().slice(0, 10) !== date) {
    throw new RangeError("Invalid report date");
  }
}

// Call once on a dedicated, already opened connection before exposing it to callers.
export async function openReportStore(database: ReportDatabase) {
  await database.execAsync("BEGIN IMMEDIATE");
  try {
    const version = await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
    if (version?.user_version === 0) {
      await database.execAsync(createReportSchema);
    } else if (version?.user_version !== schemaVersion) {
      throw new Error("Unsupported report database version");
    }
    await database.execAsync("COMMIT");
  } catch (error) {
    await database.execAsync("ROLLBACK");
    throw error;
  }

  return {
    async save(report: DailyReport) {
      const { date, createdAt, updatedAt, submittedAt, rubricVersion, ...payload } = report;
      validateReportDate(date);
      scoreReport(report);
      await database.runAsync(
        `INSERT INTO daily_reports (
           report_date, created_at, updated_at, submitted_at, rubric_version, payload
         ) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(report_date) DO UPDATE SET
           updated_at = excluded.updated_at,
           submitted_at = excluded.submitted_at,
           rubric_version = excluded.rubric_version,
           payload = excluded.payload`,
        date, createdAt, updatedAt, submittedAt ?? null, rubricVersion, JSON.stringify(payload),
      );
    },

    async get(date: string) {
      const row = await database.getFirstAsync<ReportRow>(
        "SELECT * FROM daily_reports WHERE report_date = ?", date,
      );
      return row === null ? null : reportFromRow(row);
    },

    async listBetween(firstDate: string, lastDate: string) {
      const rows = await database.getAllAsync<ReportRow>(
        "SELECT * FROM daily_reports WHERE report_date BETWEEN ? AND ? ORDER BY report_date",
        firstDate, lastDate,
      );
      return rows.map(reportFromRow);
    },

    async remove(date: string) {
      await database.runAsync("DELETE FROM daily_reports WHERE report_date = ?", date);
    },
  };
}
