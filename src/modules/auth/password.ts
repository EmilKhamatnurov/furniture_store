import "server-only";
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// ---------------------------------------------------------------------------
// Password hashing — Node's built-in scrypt (memory-hard KDF, no native deps).
// Stored format:  scrypt$<saltHex>$<hashHex>
// scrypt is a strong, standardized KDF; we use it instead of argon2 to avoid
// a native build step. The DB column comment mentions argon2 historically.
// ---------------------------------------------------------------------------

const scrypt = promisify(_scrypt);

const KEYLEN = 64;
const SALT_BYTES = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = (await scrypt(password, salt, KEYLEN)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string | null
): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  const salt = Buffer.from(parts[1]!, "hex");
  const expected = Buffer.from(parts[2]!, "hex");
  const derived = (await scrypt(password, salt, KEYLEN)) as Buffer;

  // Length guard before timingSafeEqual (it throws on length mismatch)
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
