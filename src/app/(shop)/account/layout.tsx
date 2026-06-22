import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { getCurrentCustomer } from "@/modules/customers";
import { AccountNav } from "./account-nav";

// All /account/* routes require a session. The guard runs once here and the
// resolved customer is passed to the nav for the greeting.
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login");

  return (
    <Container>
      <div className="py-10 md:py-14">
        <div className="grid lg:grid-cols-[220px_1fr] gap-8 lg:gap-12 items-start">
          <AccountNav
            firstName={customer.firstName}
            lastName={customer.lastName}
            email={customer.email}
          />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </Container>
  );
}
