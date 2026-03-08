import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getSafeReturnUrl } from "@/lib/auth/navigation";
import type { ChatRole } from "@/lib/auth/roles";

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

interface RoleProtectedRouteProps extends GuardProps {
  allow: ChatRole;
}

export function RoleProtectedRoute({ allow, children }: RoleProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const rawReturnUrl = `${location.pathname}${location.search}${location.hash}`;
    const returnUrl = getSafeReturnUrl(rawReturnUrl, "/");
    const encoded = encodeURIComponent(returnUrl);
    return <Navigate to={`/auth/login?returnUrl=${encoded}`} replace />;
  }

  if (!role || role !== allow) {
    return <Navigate to="/403" replace />;
  }

  return children;
}

export function CustomerOnlyRoute({ children }: GuardProps) {
  return <RoleProtectedRoute allow="customer">{children}</RoleProtectedRoute>;
}

export function StaffOnlyRoute({ children }: GuardProps) {
  return <RoleProtectedRoute allow="staff">{children}</RoleProtectedRoute>;
}
