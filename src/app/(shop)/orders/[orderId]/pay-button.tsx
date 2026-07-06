"use client";

import { useActionState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initiatePaymentAction } from "./actions";

// ---------------------------------------------------------------------------
// PayButton — initiates a YuKassa payment for the given order.
// Uses useActionState so we can show a pending spinner and inline errors.
// On success the server action performs a redirect to YuKassa's payment form.
// ---------------------------------------------------------------------------

interface PayButtonProps {
  orderId: string;
  /** Capability token from the page URL — forwarded so the action can authorize */
  accessToken?: string | undefined;
}

export function PayButton({ orderId, accessToken }: PayButtonProps) {
  const [state, action, isPending] = useActionState(initiatePaymentAction, null);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      {accessToken && <input type="hidden" name="t" value={accessToken} />}

      {state?.error && (
        <p className="text-sm text-destructive text-center">{state.error}</p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full gap-2"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Переходим к оплате…
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
            Оплатить заказ
          </>
        )}
      </Button>
    </form>
  );
}
