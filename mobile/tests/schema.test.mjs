import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { createReportSchema, schemaVersion } from "../src/storage/schema.ts";

test("report schema prevents duplicate dates and preserves partial entries", () => {
  const database = new DatabaseSync(":memory:");
  try {
    database.exec("BEGIN");
    database.exec(createReportSchema);
    database.exec("COMMIT");

    const schema = database.prepare("PRAGMA user_version").get();
    assert.equal(schema.user_version, schemaVersion);

    const insert = database.prepare(`
      INSERT INTO daily_reports (
        report_date, created_at, updated_at, submitted_at, rubric_version, payload
      ) VALUES (?, ?, ?, NULL, ?, ?)
    `);
    const timestamp = "2026-01-01T12:00:00Z";
    const payload = JSON.stringify({ habitAnswers: { fluids: "3" } });
    insert.run("2026-01-01", timestamp, timestamp, 1, payload);
    assert.throws(() => insert.run("2026-01-01", timestamp, timestamp, 1, payload), /UNIQUE/);
    assert.throws(() => insert.run("2026-01-02", timestamp, timestamp, 1, "{"), /CHECK/);
    assert.throws(() => insert.run("2026-01-02", timestamp, timestamp, 0, payload), /CHECK/);

    const report = database.prepare("SELECT * FROM daily_reports WHERE report_date = ?").get("2026-01-01");
    assert.equal(report.submitted_at, null);
    assert.equal(report.rubric_version, 1);
    assert.deepEqual(JSON.parse(report.payload), { habitAnswers: { fluids: "3" } });
  } finally {
    database.close();
  }
});
