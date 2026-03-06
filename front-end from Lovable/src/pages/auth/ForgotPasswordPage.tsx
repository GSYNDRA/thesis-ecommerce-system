import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout, InlineError, InlineSuccess } from "@/components/auth/AuthLayout";
import { authApi } from "@/lib/api/auth.api";
import { ApiError } from "@/lib/api/client";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await authApi.forgotPassword({ email: email.trim() });
      const nextMessage = response.message || "Verification code sent.";
      setMessage(nextMessage);
      toast.success(nextMessage);
      const encoded = encodeURIComponent(email.trim());
      navigate(`/auth/verify-otp?email=${encoded}`, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError("Unable to process request.");
        toast.error("Unable to process request.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Forgot Password" subtitle="Enter your email to receive a reset code">
      {message ? <InlineSuccess message={message} /> : null}
      {error ? <InlineError message={error} /> : null}

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={loading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Sending..." : "Send Verification Code"}
        </Button>

        <p className="text-center">
          <Link to="/auth/login" className="text-sm text-accent hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
