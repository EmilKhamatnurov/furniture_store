import type { Metadata } from "next";
import Link from "next/link";
import { urls } from "@/lib/utils/urls";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Вход",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="font-serif text-3xl font-semibold">Вход</h1>
        <p className="text-sm text-muted-foreground">
          Войдите в личный кабинет, чтобы видеть свои заказы
        </p>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-muted-foreground">
        Нет аккаунта?{" "}
        <Link href={urls.register()} className="font-medium text-primary hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
