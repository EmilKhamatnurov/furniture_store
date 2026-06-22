"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clearSessionCookie } from "@/modules/auth";
import { getCurrentCustomer, updateCustomerProfile } from "@/modules/customers";
import { profileSchema } from "../(auth)/schema";

export interface ProfileState {
  error?: string;
  success?: boolean;
  fieldErrors?: Partial<Record<string, string[]>>;
}

// ---------------------------------------------------------------------------
// Logout — clears the session cookie and returns home.
// ---------------------------------------------------------------------------
export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}

// ---------------------------------------------------------------------------
// Update profile — name & phone.
// ---------------------------------------------------------------------------
export async function updateProfileAction(
  _prev: ProfileState | null,
  formData: FormData
): Promise<ProfileState> {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return { error: "Сессия истекла. Войдите снова." };
  }

  const parsed = profileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { firstName, lastName, phone } = parsed.data;

  try {
    await updateCustomerProfile(customer.id, {
      firstName,
      lastName,
      phone: phone || undefined,
    });
  } catch (err) {
    console.error("[account] updateProfileAction failed:", err);
    return { error: "Не удалось сохранить изменения. Попробуйте позже." };
  }

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { success: true };
}
