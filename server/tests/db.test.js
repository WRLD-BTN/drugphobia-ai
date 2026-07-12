import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { ensureDatabaseDirectory } from "../src/db.js";

test("ensureDatabaseDirectory creates the parent folder for the SQLite database", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "drugphobia-db-"));
  const nestedDir = path.join(tempDir, "nested", "data");
  const dbPath = path.join(nestedDir, "drugphobia.db");

  assert.equal(fs.existsSync(nestedDir), false);

  ensureDatabaseDirectory(dbPath);

  assert.equal(fs.existsSync(nestedDir), true);
});
