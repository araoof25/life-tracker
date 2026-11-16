export const schemaVersion = 1;

// This migration must run inside a transaction after the database is opened and keyed.
export const createReportSchema = `
  CREATE TABLE daily_reports (
    report_date TEXT PRIMARY KEY NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    submitted_at TEXT,
    rubric_version INTEGER NOT NULL CHECK (rubric_version > 0),
    payload TEXT NOT NULL CHECK (json_valid(payload))
  ) STRICT;
  PRAGMA user_version = 1;
`;
