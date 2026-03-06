import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getSafeReturnUrl } from "@/lib/auth/navigation";

interface GuardProps {
  children: ReactElement;
}

export function GuestOnlyRoute({ children }: GuardProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return children;

  const params = new URLSearchParams(location.search);
  const returnUrl = getSafeReturnUrl(params.get("returnUrl"), "/");
  return <Navigate to={returnUrl} replace />;
}

export function ProtectedRoute({ children }: GuardProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) return children;

  const rawReturnUrl = `${location.pathname}${location.search}${location.hash}`;
  const returnUrl = getSafeReturnUrl(rawReturnUrl, "/");
  const encoded = encodeURIComponent(returnUrl);

  return <Navigate to={`/auth/login?returnUrl=${encoded}`} replace />;
}
