import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout, InlineError, InlineSuccess } from "@/components/auth/AuthLayout";
import { authApi } from "@/lib/api/auth.api";
import { ApiError } from "@/lib/api/client";
import { clearResetToken, getResetToken } from "@/lib/auth/reset-token";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { clearAuthSession } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const resetToken = getResetToken();

    if (!resetToken) {
      setError("Reset token is missing. Restart forgot password flow.");
      return;
    }
    if (!newPassword.trim()) {
      setError("New password is required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await authApi.resetPassword({
        resetToken,
        newPassword,
      });

      clearResetToken();
      clearAuthSession();
      const nextMessage = response.message || "Password reset successful.";
      setMessage(nextMessage);
      toast.success(nextMessage);

      setTimeout(() => {
        navigate("/auth/login?reason=password_reset_success", { replace: true });
      }, 1200);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError("Failed to reset password.");
        toast.error("Failed to reset password.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Set New Password" subtitle="Choose a secure password for your account">
      {message ? <InlineSuccess message={message} /> : null}
      {error ? <InlineError message={error} /> : null}

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1">
          <Label htmlFor="new-password">New Password</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={loading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Resetting..." : "Reset Password"}
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
