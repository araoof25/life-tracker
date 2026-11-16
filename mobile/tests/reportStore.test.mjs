import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { openReportStore } from "../src/storage/reportStore.ts";

function connect(filename) {
  const database = new DatabaseSync(filename);
  return {
    execAsync: async (sql) => database.exec(sql),
    getFirstAsync: async (sql, ...params) => database.prepare(sql).get(...params) ?? null,
    getAllAsync: async (sql, ...params) => database.prepare(sql).all(...params),
    runAsync: async (sql, ...params) => database.prepare(sql).run(...params),
    close: () => database.close(),
  };
}

const draft = {
  date: "2026-01-03",
  dayType: "dayOff",
  shift: "notApplicable",
  createdAt: "2026-01-03T10:00:00Z",
  updatedAt: "2026-01-03T10:00:00Z",
  rubricVersion: 1,
  habitAnswers: { fluids: "3", activity: "5" },
  notes: "Synthetic entry",
};

test("a partial report persists across a database reopen and is edited in place", async () => {
  const directory = mkdtempSync(join(tmpdir(), "life-tracker-"));
  const filename = join(directory, "test.db");
  let connection;
  try {
    connection = connect(filename);
    const initial = await openReportStore(connection);
    await initial.save(draft);
    connection.close();
    connection = undefined;

    connection = connect(filename);
    const store = await openReportStore(connection);
    const saved = await store.get(draft.date);
    assert.deepEqual(saved, { ...draft, submittedAt: undefined });

    const submittedAt = "2026-01-03T20:00:00Z";
    await store.save({
      ...saved,
      createdAt: submittedAt,
      updatedAt: submittedAt,
      submittedAt,
      habitAnswers: { ...saved.habitAnswers, teeth: "1" },
    });
    await store.save({ ...draft, date: "2026-01-01" });
    const history = await store.listBetween("2026-01-01", "2026-01-03");
    assert.deepEqual(history.map(({ date }) => date), ["2026-01-01", draft.date]);
    assert.equal(history[1].createdAt, draft.createdAt);
    assert.equal(history[1].updatedAt, submittedAt);
    assert.equal(history[1].submittedAt, submittedAt);
    assert.deepEqual(history[1].habitAnswers, { ...draft.habitAnswers, teeth: "1" });

    await store.remove(draft.date);
    assert.equal(await store.get(draft.date), null);
    assert.ok(await store.get("2026-01-01"));
  } finally {
    connection?.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("invalid dates, answers and rubric versions cannot be saved", async () => {
  const connection = connect(":memory:");
  try {
    const store = await openReportStore(connection);
    await assert.rejects(store.save({ ...draft, date: "2026-02-30" }), /Invalid report date/);
    await assert.rejects(store.save({ ...draft, habitAnswers: { fluids: "invalid" } }), /Unknown habit option/);
    await assert.rejects(store.save({ ...draft, rubricVersion: 999 }), /Unsupported scoring rubric/);
    assert.deepEqual(await store.listBetween("2026-01-01", "2026-12-31"), []);
  } finally {
    connection.close();
  }
});

test("a newer database schema is preserved and rejected", async () => {
  const connection = connect(":memory:");
  try {
    await connection.execAsync("PRAGMA user_version = 999");
    await assert.rejects(openReportStore(connection), /Unsupported report database version/);
    assert.equal((await connection.getFirstAsync("PRAGMA user_version")).user_version, 999);
  } finally {
    connection.close();
  }
});
