// createAdmin.js
//
// Run with: node createAdmin.js "admin@example.org" "a-strong-password" [role]
// Creates (or updates the password for) an admin account. This is the ONLY
// supported way to create the first admin — there is no public sign-up
// endpoint for /admin routes, by design.

import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./src/db.js";
import { hashEmail } from "./src/utils/sanitize.js";

const [, , email, password, role = "admin"] = process.argv;

if (!email || !password) {
  console.error("Usage: node createAdmin.js <email> <password> [role=admin|moderator|superadmin]");
  process.exit(1);
}

if (password.length < 10) {
  console.error("Refusing to create an admin with a password under 10 characters. Use something stronger.");
  process.exit(1);
}

const emailHash = hashEmail(email);
const passHash = bcrypt.hashSync(password, 12);

const existing = db.prepare("SELECT id FROM admins WHERE email_hash = ?").get(emailHash);

if (existing) {
  db.prepare("UPDATE admins SET pass_hash = ?, role = ? WHERE id = ?").run(passHash, role, existing.id);
  console.log(`Updated existing admin (id ${existing.id}) with role "${role}".`);
} else {
  const info = db
    .prepare("INSERT INTO admins (email_hash, pass_hash, role) VALUES (?, ?, ?)")
    .run(emailHash, passHash, role);
  console.log(`Created admin id ${info.lastInsertRowid} with role "${role}".`);
}

console.log("Note: only the email HASH is stored — the plaintext email is never written to the database.");
