"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { checkAdminCredentials, loginAdmin, isAdminConfigured } from "@/modules/admin";
import { rateLimit, clientIp, retryAfterText } from "@/lib/security/rate-limit";

export interface AdminLoginState {
  error?: string;
}

const schema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export async function adminLoginAction(
  _prev: AdminLoginState | null,
  formData: FormData
): Promise<AdminLoginState> {
  // Strict throttle for the privileged single-admin login: 5 attempts / 10 min per IP
  const ip = await clientIp();
  const rl = await rateLimit("admin-login", ip, { limit: 5, windowSec: 600 });
  if (!rl.ok) {
    return { error: `Слишком много попыток. Повторите ${retryAfterText(rl.retryAfterSec)}` };
  }

  if (!isAdminConfigured()) {
    return {
      error: "Админ-доступ не настроен. Задайте ADMIN_EMAIL и ADMIN_PASSWORD_HASH.",
    };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Заполните email и пароль." };
  }

  const ok = await checkAdminCredentials(parsed.data.email, parsed.data.password);
  if (!ok) {
    return { error: "Неверный email или пароль." };
  }

  await loginAdmin(parsed.data.email.trim().toLowerCase());
  redirect("/admin");
}
