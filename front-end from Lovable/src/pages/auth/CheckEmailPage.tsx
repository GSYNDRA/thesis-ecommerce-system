import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthLayout, InlineError, InlineSuccess } from "@/components/auth/AuthLayout";
import { authApi } from "@/lib/api/auth.api";
import { ApiError } from "@/lib/api/client";
import { toast } from "sonner";

export default function CheckEmailPage() {
  const location = useLocation();
  const { email, initialMessage } = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      email: params.get("email") || "",
      initialMessage: params.get("message") || "",
    };
  }, [location.search]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialMessage) {
      setMessage(initialMessage);
    }
  }, [initialMessage]);

  async function onResend() {
    if (!email) {
      setError("Email is missing. Please register again.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await authApi.resendVerification({ email });
      const nextMessage = response.message || "Verification email resent.";
      setMessage(nextMessage);
      toast.success(nextMessage);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError("Failed to resend verification email.");
        toast.error("Failed to resend verification email.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Check Your Email" subtitle="Complete your account verification to continue">
      <div className="mb-6 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <Mail className="h-8 w-8 text-accent" />
        </div>
      </div>

      {message ? <InlineSuccess message={message} /> : null}
      {error ? <InlineError message={error} /> : null}

      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          We sent a verification link to{" "}
          <span className="font-medium text-foreground">{email || "your email"}</span>.
        </p>

        <div className="rounded-md bg-secondary/50 p-4 text-left text-xs text-muted-foreground">
          <p>- Click the link in your inbox to verify your account.</p>
          <p>- If you do not see it, check spam/junk folder.</p>
        </div>

        <Button className="w-full" variant="outline" onClick={onResend} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Resending..." : "Resend Verification Email"}
        </Button>

        <Link to="/auth/login" className="text-sm text-accent hover:underline">
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
