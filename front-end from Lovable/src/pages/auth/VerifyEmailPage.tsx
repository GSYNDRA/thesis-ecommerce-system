import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthLayout, InlineError, InlineSuccess } from "@/components/auth/AuthLayout";
import { authApi } from "@/lib/api/auth.api";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type VerifyState = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuthSession } = useAuth();
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState<string>("Verifying your email...");

  const token = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("token");
  }, [location.search]);

  useEffect(() => {
    let active = true;

    async function verify() {
      if (!token) {
        setState("error");
        setMessage("Verification token is missing.");
        return;
      }

      try {
        const response = await authApi.verifyEmail(token);
        if (!active) return;

        setAuthSession({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          user: response.data.user || null,
        });

        setState("success");
        setMessage("Email verified successfully. Redirecting...");
        toast.success("Email verified successfully");

        setTimeout(() => {
          navigate("/", { replace: true });
        }, 1200);
      } catch (err) {
        if (!active) return;
        setState("error");
        if (err instanceof ApiError) {
          setMessage(err.message);
          toast.error(err.message);
        } else {
          setMessage("Email verification failed.");
          toast.error("Email verification failed.");
        }
      }
    }

    verify();

    return () => {
      active = false;
    };
  }, [navigate, setAuthSession, token]);

  return (
    <AuthLayout title="Email Verification" subtitle="Please wait while we validate your link">
      <div className="text-center">
        {state === "loading" ? (
          <div className="mb-4 flex justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
          </div>
        ) : null}

        {state === "success" ? (
          <div className="mb-4 flex justify-center">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
        ) : null}

        {state === "error" ? (
          <div className="mb-4 flex justify-center">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
        ) : null}
      </div>

      {state === "success" ? (
        <InlineSuccess message={message} />
      ) : (
        <InlineError message={message} />
      )}

      {state === "error" ? (
        <div className="mt-4 flex flex-col gap-2">
          <Button asChild>
            <Link to="/auth/login">Go to Sign In</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/auth/register">Create Account Again</Link>
          </Button>
        </div>
      ) : null}
    </AuthLayout>
  );
}
