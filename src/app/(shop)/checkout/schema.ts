import { z } from "zod";

export const checkoutSchema = z.object({
  fullName: z.string().min(2, "Введите имя и фамилию"),
  email: z.string().email("Некорректный email"),
  phone: z
    .string()
    .min(10, "Введите номер телефона")
    .regex(/^[\d\s\+\-\(\)]+$/, "Некорректный номер телефона"),
  region: z.string().min(2, "Введите регион или область"),
  city: z.string().min(2, "Введите город"),
  street: z.string().min(3, "Введите улицу и номер дома"),
  apartment: z.string().optional(),
  postalCode: z
    .string()
    .regex(/^\d{6}$/, "Индекс — 6 цифр"),
  note: z.string().optional(),
  /** Serialized CartItem[] with priceCopecks as string */
  cartItems: z.string().min(2, "Корзина пуста"),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
