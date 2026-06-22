import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { getCurrentCustomer } from "@/modules/customers";

// Auth pages share a narrow, centered layout. Already-authenticated visitors
// are bounced to their account.
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const customer = await getCurrentCustomer();
  if (customer) redirect("/account");

  return (
    <Container>
      <div className="flex justify-center py-12 md:py-20">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </Container>
  );
}
