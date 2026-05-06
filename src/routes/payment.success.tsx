import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

interface Search {
  session_id?: string;
  payment_id?: string;
}

export const Route = createFileRoute("/payment/success")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
    payment_id: typeof s.payment_id === "string" ? s.payment_id : undefined,
  }),
  component: PaymentSuccessAlias,
});

function PaymentSuccessAlias() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  useEffect(() => {
    navigate({ to: "/billing/success", search, replace: true });
  }, [navigate, search]);
  return null;
}
