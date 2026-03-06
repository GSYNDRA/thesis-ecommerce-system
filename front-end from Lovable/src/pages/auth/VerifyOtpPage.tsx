import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout, InlineError, InlineSuccess } from "@/components/auth/AuthLayout";
import { authApi } from "@/lib/api/auth.api";
import { ApiError } from "@/lib/api/client";
import { setResetToken } from "@/lib/auth/reset-token";
import { toast } from "sonner";

export default function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("email") || "";
  }, [location.search]);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email) {
      setError("Email is missing. Restart forgot password flow.");
      return;
    }
    if (!otp.trim()) {
      setError("OTP is required.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await authApi.verifyOtp({ email, otp: otp.trim() });
      setResetToken(response.data.reset_token);
      const nextMessage = "OTP verified. Continue to reset password.";
      setMessage(nextMessage);
      toast.success(nextMessage);
      navigate("/auth/reset-password", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError("OTP verification failed.");
        toast.error("OTP verification failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    if (!email) {
      setError("Email is missing. Restart forgot password flow.");
      return;
    }

    setResending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await authApi.resendOtp({ email });
      const nextMessage = response.message || "OTP resent.";
      setMessage(nextMessage);
      toast.success(nextMessage);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError("Failed to resend OTP.");
        toast.error("Failed to resend OTP.");
      }
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout title="Verify OTP" subtitle={`Enter the code sent to ${email || "your email"}`}>
      {message ? <InlineSuccess message={message} /> : null}
      {error ? <InlineError message={error} /> : null}

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1">
          <Label htmlFor="otp">6-digit OTP</Label>
          <Input
            id="otp"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            maxLength={6}
            disabled={loading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Verifying..." : "Verify Code"}
        </Button>

        <Button type="button" variant="outline" className="w-full" disabled={resending} onClick={onResend}>
          {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {resending ? "Resending..." : "Resend Code"}
        </Button>

        <p className="text-center">
          <Link to="/auth/forgot-password" className="text-sm text-accent hover:underline">
            Use another email
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
