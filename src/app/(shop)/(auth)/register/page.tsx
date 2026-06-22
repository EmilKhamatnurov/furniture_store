import type { Metadata } from "next";
import Link from "next/link";
import { urls } from "@/lib/utils/urls";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Регистрация",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="font-serif text-3xl font-semibold">Регистрация</h1>
        <p className="text-sm text-muted-foreground">
          Создайте аккаунт, чтобы отслеживать заказы
        </p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{" "}
        <Link href={urls.login()} className="font-medium text-primary hover:underline">
          Войти
        </Link>
      </p>
    </div>
  );
}
