import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthLayout, FieldError, InlineError, InlineSuccess } from "@/components/auth/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getSafeReturnUrl } from "@/lib/auth/navigation";
import { ApiError } from "@/lib/api/client";
import { toast } from "sonner";

type FormState = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const returnUrl = getSafeReturnUrl(params.get("returnUrl"), "/");
  const reason = params.get("reason");

  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);

  function validate() {
    if (!form.email.trim()) return "Email is required.";
    if (!form.password.trim()) return "Password is required.";
    return null;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setNeedsEmailVerification(false);

    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      });
      toast.success("Login successful");
      navigate(returnUrl, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        const message = err.message || "Login failed";
        if (message.toLowerCase().includes("verify your email")) {
          setNeedsEmailVerification(true);
        }
        setError(message);
        toast.error(message);
      } else {
        setError("Login failed. Please try again.");
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your MAISON account">
      {reason === "session_expired" ? (
        <InlineSuccess message="Your session expired. Please sign in again." />
      ) : null}
      {reason === "password_reset_success" ? (
        <InlineSuccess message="Password reset successful. Please sign in." />
      ) : null}

      {error ? <InlineError message={error} /> : null}
      {needsEmailVerification && form.email.trim() ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Need a new verification email?{" "}
          <Link
            className="text-accent hover:underline"
            to={`/auth/check-email?email=${encodeURIComponent(form.email.trim())}`}
          >
            Open check email page
          </Link>
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
            disabled={loading}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, password: event.target.value }))
            }
            disabled={loading}
          />
          {!form.password.trim() && error === "Password is required." ? (
            <FieldError message="Password is required." />
          ) : null}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox id="remember-me" disabled={loading} />
            <Label htmlFor="remember-me" className="text-sm font-normal">
              Remember me
            </Label>
          </div>
          <Link to="/auth/forgot-password" className="text-sm text-accent hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Signing in..." : "Sign In"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/auth/register" className="font-medium text-accent hover:underline">
            Create account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
