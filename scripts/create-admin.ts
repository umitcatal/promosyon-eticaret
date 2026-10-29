import "./env";
import { db } from "../lib/db";
import { hashPassword } from "../lib/password";

const email = process.argv[2] ?? process.env.ADMIN_EMAIL;
const password = process.argv[3] ?? process.env.ADMIN_PASSWORD;
const firstName = process.env.ADMIN_FIRST_NAME ?? "Site";
const lastName = process.env.ADMIN_LAST_NAME ?? "Yönetici";

if (!email || !password) {
  console.error(
    "Kullanım: npm run db:admin -- <email> <sifre> (veya .env.local içindeki ADMIN_* değerleri)"
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error("Şifre en az 8 karakter olmalı.");
  process.exit(1);
}

db.prepare(
  `INSERT INTO users (first_name, last_name, email, password_hash, role)
   VALUES (?, ?, ?, ?, 'admin')
   ON CONFLICT(email) DO UPDATE SET
     password_hash = excluded.password_hash,
     role = 'admin'`
).run(firstName, lastName, email, hashPassword(password));

console.log(`Admin hesabı hazır: ${email}`);
