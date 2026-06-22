import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, customerConsents } from "./db/schema";
import { getSession } from "@/modules/auth/session";
import type { Customer } from "./db/schema";

// ---------------------------------------------------------------------------
// Customers repository — account data access.
// ---------------------------------------------------------------------------

export interface CreateCustomerInput {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string | undefined;
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const [customer] = await db
    .insert(customers)
    .values({
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone ?? null,
    })
    .returning();

  if (!customer) throw new Error("Customer insert returned no rows");
  return customer;
}

export async function getCustomerByEmail(email: string): Promise<Customer | undefined> {
  return db.query.customers.findFirst({
    where: eq(customers.email, email.toLowerCase()),
  });
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
  return db.query.customers.findFirst({ where: eq(customers.id, id) });
}

export async function emailExists(email: string): Promise<boolean> {
  const existing = await getCustomerByEmail(email);
  return existing !== undefined;
}

export interface UpdateProfileInput {
  firstName: string;
  lastName: string;
  phone?: string | undefined;
}

export async function updateCustomerProfile(
  id: string,
  input: UpdateProfileInput
): Promise<void> {
  await db
    .update(customers)
    .set({
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone ?? null,
      updatedAt: sql`now()`,
    })
    .where(eq(customers.id, id));
}

export async function touchLastLogin(id: string): Promise<void> {
  await db
    .update(customers)
    .set({ lastLoginAt: sql`now()` })
    .where(eq(customers.id, id));
}

// ---------------------------------------------------------------------------
// Consents — 152-FZ. Record an explicit grant/revoke with content hash.
// ---------------------------------------------------------------------------
export interface RecordConsentInput {
  customerId: string;
  consentType: "privacy_policy" | "marketing_email" | "marketing_sms";
  consentTextHash: string;
  policyVersion: string;
  isGranted: boolean;
  ipAddress?: string | undefined;
}

export async function recordConsent(input: RecordConsentInput): Promise<void> {
  await db.insert(customerConsents).values({
    customerId: input.customerId,
    consentType: input.consentType,
    consentTextHash: input.consentTextHash,
    policyVersion: input.policyVersion,
    isGranted: input.isGranted,
    ipAddress: input.ipAddress ?? null,
  });
}

// ---------------------------------------------------------------------------
// getCurrentCustomer — resolves the signed session cookie to a live row.
// Returns null when not logged in, token invalid/expired, or account inactive.
// Safe to call from any Server Component.
// ---------------------------------------------------------------------------
export async function getCurrentCustomer(): Promise<Customer | null> {
  const session = await getSession();
  if (!session) return null;

  const customer = await getCustomerById(session.sub);
  if (!customer || !customer.isActive) return null;

  return customer;
}
