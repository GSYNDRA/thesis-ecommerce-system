import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthLayout, InlineError } from "@/components/auth/AuthLayout";
import { authApi, type RegisterPayload } from "@/lib/api/auth.api";
import { ApiError } from "@/lib/api/client";
import { toast } from "sonner";

type RegisterFormState = RegisterPayload;

const initialState: RegisterFormState = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phoneNumber: "",
  dateOfBirth: "",
  gender: "other",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterFormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof RegisterFormState>(key: K, value: RegisterFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    if (!form.firstName.trim()) return "First name is required.";
    if (!form.lastName.trim()) return "Last name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!form.password.trim()) return "Password is required.";
    if (form.password.length < 6) return "Password must be at least 6 characters.";
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

    try {
      const response = await authApi.register({
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber?.trim() || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
      });

      const email = encodeURIComponent(form.email.trim());
      const msg = encodeURIComponent(response.data?.message || response.message || "");
      toast.success(response.message || "Registration successful");
      navigate(`/auth/check-email?email=${email}&message=${msg}`, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError("Register failed. Please try again.");
        toast.error("Register failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join MAISON for an exclusive shopping experience"
      maxWClassName="max-w-lg"
    >
      {error ? <InlineError message={error} /> : null}

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="first-name">First Name</Label>
            <Input
              id="first-name"
              value={form.firstName}
              onChange={(event) => setField("firstName", event.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="last-name">Last Name</Label>
            <Input
              id="last-name"
              value={form.lastName}
              onChange={(event) => setField("lastName", event.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => setField("email", event.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={(event) => setField("password", event.target.value)}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="phone">Phone Number (optional)</Label>
            <Input
              id="phone"
              value={form.phoneNumber || ""}
              onChange={(event) => setField("phoneNumber", event.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="dob">Date of Birth (optional)</Label>
            <Input
              id="dob"
              type="date"
              value={form.dateOfBirth || ""}
              onChange={(event) => setField("dateOfBirth", event.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label>Gender (optional)</Label>
          <Select
            value={form.gender || "other"}
            onValueChange={(value) => setField("gender", value as RegisterPayload["gender"])}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Creating account..." : "Create Account"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
