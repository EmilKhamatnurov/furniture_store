import type { Metadata } from "next";
import { getCurrentCustomer } from "@/modules/customers";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Профиль",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="font-serif text-2xl md:text-3xl font-semibold">Профиль</h1>

      <ProfileForm
        firstName={customer.firstName}
        lastName={customer.lastName}
        phone={customer.phone ?? ""}
        email={customer.email}
      />
    </div>
  );
}
