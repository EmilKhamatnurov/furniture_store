import "server-only";
import path from "node:path";
import fs from "node:fs/promises";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { env } from "@/config/env";
import { moduleLogger } from "@/lib/logger";

const log = moduleLogger("storage");

// ---------------------------------------------------------------------------
// Public media storage.
// Prod: S3 (Selectel) — objects are publicly readable, URLs built client-side
// via NEXT_PUBLIC_S3_BASE_URL (see src/lib/utils/images.ts).
// Dev without S3 keys: files land in public/uploads/<key> and are served by
// the dev server as /uploads/<key> (imageUrl() falls back to that path when
// NEXT_PUBLIC_S3_BASE_URL is empty).
// ---------------------------------------------------------------------------

const s3Configured = Boolean(env.S3_ACCESS_KEY && env.S3_SECRET_KEY);

let _client: S3Client | null = null;
function s3(): S3Client {
  _client ??= new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY,
      secretAccessKey: env.S3_SECRET_KEY,
    },
    // Path-style URLs (https://s3.selcdn.ru/<bucket>/<key>) — matches
    // NEXT_PUBLIC_S3_BASE_URL and the remotePatterns entry in next.config.ts.
    forcePathStyle: true,
  });
  return _client;
}

const LOCAL_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

/** Resolve a key inside the local uploads dir, refusing path traversal. */
function localPath(key: string): string {
  const resolved = path.resolve(LOCAL_UPLOADS_DIR, key);
  if (!resolved.startsWith(LOCAL_UPLOADS_DIR + path.sep)) {
    throw new Error(`Invalid storage key: ${key}`);
  }
  return resolved;
}

/** Upload a publicly readable object. Key must not start with "/". */
export async function putPublicObject(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  if (s3Configured) {
    await s3().send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        ACL: "public-read",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    return;
  }

  const filePath = localPath(key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, body);
}

/**
 * Delete an object. Best-effort: a failure (or missing file) is logged but
 * never thrown — an orphaned file must not block deleting the DB row.
 */
export async function deletePublicObject(key: string): Promise<void> {
  try {
    if (s3Configured) {
      await s3().send(
        new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key })
      );
    } else {
      await fs.rm(localPath(key), { force: true });
    }
  } catch (err) {
    log.warn({ err, key }, "Failed to delete storage object");
  }
}
