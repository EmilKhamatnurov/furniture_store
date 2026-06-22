import { z } from "zod";

// ---------------------------------------------------------------------------
// Auth form schemas
// ---------------------------------------------------------------------------

export const registerSchema = z.object({
  firstName: z.string().min(2, "Введите имя"),
  lastName: z.string().min(2, "Введите фамилию"),
  email: z.string().email("Некорректный email"),
  phone: z
    .string()
    .regex(/^[\d\s+\-()]*$/, "Некорректный номер телефона")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(8, "Пароль не короче 8 символов")
    .max(200, "Слишком длинный пароль"),
  // Checkbox sends "on" when checked, nothing when unchecked
  consent: z.literal("on", {
    errorMap: () => ({ message: "Необходимо согласие на обработку данных" }),
  }),
});

export const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export const profileSchema = z.object({
  firstName: z.string().min(2, "Введите имя"),
  lastName: z.string().min(2, "Введите фамилию"),
  phone: z
    .string()
    .regex(/^[\d\s+\-()]*$/, "Некорректный номер телефона")
    .optional()
    .or(z.literal("")),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
