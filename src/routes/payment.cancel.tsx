import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/payment/cancel")({
  component: PaymentCancelAlias,
});

function PaymentCancelAlias() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/billing/cancel", replace: true });
  }, [navigate]);
  return null;
}
