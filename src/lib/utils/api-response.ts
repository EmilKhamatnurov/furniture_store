import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Typed API response wrappers
// All Route Handlers return one of these shapes for consistency.
// ---------------------------------------------------------------------------

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiError = { ok: false; error: string; details?: unknown };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ ok: true, data }, { status });
}

export function created<T>(data: T): NextResponse<ApiSuccess<T>> {
  return ok(data, 201);
}

export function notFound(message = "Not found"): NextResponse<ApiError> {
  return NextResponse.json({ ok: false, error: message }, { status: 404 });
}

export function badRequest(
  message: string,
  details?: unknown
): NextResponse<ApiError> {
  return NextResponse.json(
    { ok: false, error: message, details },
    { status: 400 }
  );
}

export function unauthorized(message = "Unauthorized"): NextResponse<ApiError> {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden"): NextResponse<ApiError> {
  return NextResponse.json({ ok: false, error: message }, { status: 403 });
}

export function conflict(message: string): NextResponse<ApiError> {
  return NextResponse.json({ ok: false, error: message }, { status: 409 });
}

export function serverError(
  err: unknown,
  context?: Record<string, unknown>
): NextResponse<ApiError> {
  logger.error({ err, ...context }, "Unhandled server error");
  return NextResponse.json(
    { ok: false, error: "Internal server error" },
    { status: 500 }
  );
}

// ---------------------------------------------------------------------------
// Zod validation helper for Route Handler request bodies
// ---------------------------------------------------------------------------
export function validationError(err: ZodError): NextResponse<ApiError> {
  return NextResponse.json(
    {
      ok: false,
      error: "Validation failed",
      details: err.flatten().fieldErrors,
    },
    { status: 422 }
  );
}
