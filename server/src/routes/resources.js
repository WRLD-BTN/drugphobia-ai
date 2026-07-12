import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLINICS_PATH = path.resolve(__dirname, "../../../shared/clinics.json");

function loadClinics() {
  return JSON.parse(fs.readFileSync(CLINICS_PATH, "utf-8"));
}

const router = express.Router();

/** GET /resources — full directory (helplines always first, they're always reachable regardless of area). */
router.get("/resources", (req, res) => {
  const data = loadClinics();
  res.json({ helplines: data.helplines, facilities: data.facilities });
});

/** GET /resources/nearest?area=Harare — naive text match on the area field; swap for real geo lookup once clinics.json has coordinates. */
router.get("/resources/nearest", (req, res) => {
  const area = (req.query.area || "").toString().toLowerCase();
  const data = loadClinics();
  const matches = data.facilities
    .filter((f) => f.area.toLowerCase().includes(area) || area === "")
    .slice(0, 3);
  res.json({ helplines: data.helplines, facilities: matches });
});

export default router;
