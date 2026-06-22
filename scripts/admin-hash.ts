/**
 * Generate a password hash for the admin panel.
 * Usage: npm run admin:hash -- "your-strong-password"
 *
 * The scrypt hash contains "$" which Next.js' env loader would expand/corrupt,
 * so we emit it BASE64-encoded — copy the whole line into .env.local as-is.
 */
import { hashPassword } from "@/modules/auth/password";

async function main() {
  const password = process.argv[2];
  if (!password) {
    console.error('Usage: npm run admin:hash -- "your-password"');
    process.exit(1);
  }
  const hash = await hashPassword(password);
  const encoded = Buffer.from(hash, "utf8").toString("base64");
  console.log("\nADMIN_PASSWORD_HASH=" + encoded + "\n");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
