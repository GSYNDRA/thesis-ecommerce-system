import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle,
  ArrowLeft, X, LogOut, ShieldAlert, Clock, User, Calendar, Phone
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/* ─── shared auth layout wrapper ─── */
const AuthCard = ({ children, maxW = "max-w-md" }: { children: React.ReactNode; maxW?: string }) => (
  <div className="min-h-[600px] flex items-center justify-center bg-secondary/30 rounded-lg border border-border p-8">
    <div className={`w-full ${maxW} bg-card border border-border rounded-lg shadow-lg p-8`}>
      {children}
    </div>
  </div>
);

const InlineError = ({ msg }: { msg: string }) => (
  <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
    <span>{msg}</span>
  </div>
);

const InlineSuccess = ({ msg }: { msg: string }) => (
  <div className="flex items-start gap-2 text-success text-sm bg-success/5 border border-success/20 rounded-md px-3 py-2">
    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
    <span>{msg}</span>
  </div>
);

const FieldError = ({ msg }: { msg: string }) => (
  <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{msg}</p>
);

const PasswordInput = ({ id, label, placeholder, error, disabled }: { id: string; label: string; placeholder: string; error?: string; disabled?: boolean }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label} <span className="text-destructive">*</span></Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input id={id} type={show ? "text" : "password"} placeholder={placeholder} className={`pl-9 pr-10 ${error ? "border-destructive" : ""}`} disabled={disabled} />
        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShow(!show)}>
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <FieldError msg={error} />}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   SCREEN 1: LOGIN
   POST /api/v1/auth/login { email, password }
   ═══════════════════════════════════════════════════ */
const LoginScreen = ({ state = "default" }: { state?: "default" | "validation" | "api-error" | "unverified" | "locked" | "loading" | "success" }) => (
  <AuthCard>
    <div className="text-center mb-6">
      <p className="font-serif text-3xl font-semibold tracking-tight">Welcome Back</p>
      <p className="text-sm text-muted-foreground mt-1">Sign in to your MAISON account</p>
    </div>

    {state === "api-error" && <InlineError msg="Invalid email or password. Please try again." />}
    {state === "unverified" && <InlineError msg="Please verify your email address before signing in. Check your inbox." />}
    {state === "locked" && <InlineError msg="Account temporarily locked due to too many failed attempts. Try again later." />}
    {state === "success" && <InlineSuccess msg="Login successful. Redirecting…" />}

    <div className="space-y-4 mt-4">
      <div className="space-y-1">
        <Label htmlFor="login-email">Email Address <span className="text-destructive">*</span></Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input id="login-email" type="email" placeholder="jane@example.com"
            className={`pl-9 ${state === "validation" ? "border-destructive" : ""}`}
            disabled={state === "loading" || state === "success"} />
        </div>
        {state === "validation" && <FieldError msg="Please enter a valid email address." />}
      </div>

      <PasswordInput id="login-pass" label="Password" placeholder="Enter your password"
        error={state === "validation" ? "Password is required." : undefined}
        disabled={state === "loading" || state === "success"} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox id="remember-me" />
          <Label htmlFor="remember-me" className="text-sm font-normal">Remember me</Label>
        </div>
        <button className="text-sm text-accent hover:underline">Forgot password?</button>
      </div>

      <Button className="w-full" disabled={state === "loading" || state === "success"}>
        {state === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
        {state === "loading" ? "Signing in…" : state === "success" ? "Redirecting…" : "Sign In"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account? <button className="text-accent hover:underline font-medium">Create account</button>
      </p>
    </div>
  </AuthCard>
);

/* ═══════════════════════════════════════════════════
   SCREEN 2: REGISTER
   POST /api/v1/auth/register
   { email, password, firstName, lastName, phoneNumber?, dateOfBirth?, gender? }
   ═══════════════════════════════════════════════════ */
const RegisterScreen = ({ state = "default" }: { state?: "default" | "validation" | "api-error" | "loading" }) => (
  <AuthCard maxW="max-w-lg">
    <div className="text-center mb-6">
      <p className="font-serif text-3xl font-semibold tracking-tight">Create Account</p>
      <p className="text-sm text-muted-foreground mt-1">Join MAISON for an exclusive shopping experience</p>
    </div>

    {state === "api-error" && <InlineError msg="An account with this email already exists." />}

    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="reg-first">First Name <span className="text-destructive">*</span></Label>
          <Input id="reg-first" placeholder="Jane" className={state === "validation" ? "border-destructive" : ""} disabled={state === "loading"} />
          {state === "validation" && <FieldError msg="First name is required." />}
        </div>
        <div className="space-y-1">
          <Label htmlFor="reg-last">Last Name <span className="text-destructive">*</span></Label>
          <Input id="reg-last" placeholder="Doe" disabled={state === "loading"} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="reg-email">Email Address <span className="text-destructive">*</span></Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input id="reg-email" type="email" placeholder="jane@example.com" className="pl-9" disabled={state === "loading"} />
        </div>
      </div>

      <PasswordInput id="reg-pass" label="Password" placeholder="Min 8 characters" disabled={state === "loading"} />
      <p className="text-xs text-muted-foreground -mt-2">Must be at least 8 characters with one uppercase letter and one number.</p>

      <Separator />
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Optional Information</p>

      <div className="space-y-1">
        <Label htmlFor="reg-phone">Phone Number</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input id="reg-phone" type="tel" placeholder="+1 (555) 123-4567" className="pl-9" disabled={state === "loading"} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="reg-dob">Date of Birth</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="reg-dob" type="date" className="pl-9" disabled={state === "loading"} />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Gender</Label>
          <Select disabled={state === "loading"}>
            <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <Checkbox id="reg-terms" className="mt-0.5" />
        <Label htmlFor="reg-terms" className="text-sm font-normal leading-snug">
          I agree to the <button className="text-accent hover:underline">Terms of Service</button> and <button className="text-accent hover:underline">Privacy Policy</button>
        </Label>
      </div>

      <Button className="w-full" disabled={state === "loading"}>
        {state === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
        {state === "loading" ? "Creating account…" : "Create Account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account? <button className="text-accent hover:underline font-medium">Sign in</button>
      </p>
    </div>
  </AuthCard>
);

/* ═══════════════════════════════════════════════════
   SCREEN 3: CHECK EMAIL (post-register)
   ═══════════════════════════════════════════════════ */
const CheckEmailScreen = () => (
  <AuthCard>
    <div className="text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
        <Mail className="w-8 h-8 text-accent" />
      </div>
      <p className="font-serif text-2xl font-semibold">Check Your Email</p>
      <p className="text-sm text-muted-foreground">
        We've sent a verification link to <span className="font-medium text-foreground">jane@example.com</span>. Click the link in the email to activate your account.
      </p>
      <div className="bg-secondary/50 rounded-md p-4 text-xs text-muted-foreground space-y-1">
        <p>• The link will expire in 24 hours</p>
        <p>• Check your spam folder if you don't see it</p>
      </div>
      <Separator />
      <p className="text-sm text-muted-foreground">
        Didn't receive the email?
      </p>
      <Button variant="outline" className="w-full">Resend Verification Email</Button>
      <button className="text-sm text-accent hover:underline">← Back to sign in</button>
    </div>
  </AuthCard>
);

/* ═══════════════════════════════════════════════════
   SCREEN 4: VERIFY EMAIL CALLBACK
   GET /api/v1/auth/verify-email?token=...
   ═══════════════════════════════════════════════════ */
const VerifyEmailScreen = ({ state = "loading" }: { state?: "loading" | "success" | "invalid" | "expired" }) => (
  <AuthCard>
    <div className="text-center space-y-4">
      {state === "loading" && (
        <>
          <Loader2 className="w-10 h-10 animate-spin text-accent mx-auto" />
          <p className="font-serif text-2xl font-semibold">Verifying Your Email</p>
          <p className="text-sm text-muted-foreground">Please wait while we verify your email address…</p>
        </>
      )}
      {state === "success" && (
        <>
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto"><CheckCircle className="w-8 h-8 text-success" /></div>
          <p className="font-serif text-2xl font-semibold">Email Verified!</p>
          <p className="text-sm text-muted-foreground">Your account has been activated. You can now sign in.</p>
          <Button className="w-full">Continue to Sign In</Button>
        </>
      )}
      {state === "invalid" && (
        <>
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto"><AlertCircle className="w-8 h-8 text-destructive" /></div>
          <p className="font-serif text-2xl font-semibold">Invalid Link</p>
          <p className="text-sm text-muted-foreground">This verification link is invalid. It may have already been used.</p>
          <Button variant="outline" className="w-full">Request New Verification</Button>
          <button className="text-sm text-accent hover:underline">← Back to sign in</button>
        </>
      )}
      {state === "expired" && (
        <>
          <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto"><Clock className="w-8 h-8 text-warning" /></div>
          <p className="font-serif text-2xl font-semibold">Link Expired</p>
          <p className="text-sm text-muted-foreground">This verification link has expired. Request a new one below.</p>
          <Button className="w-full">Resend Verification Email</Button>
          <button className="text-sm text-accent hover:underline">← Back to sign in</button>
        </>
      )}
    </div>
  </AuthCard>
);

/* ═══════════════════════════════════════════════════
   SCREEN 5: FORGOT PASSWORD
   POST /api/v1/auth/forgot-password { email }
   ═══════════════════════════════════════════════════ */
const ForgotPasswordScreen = ({ state = "default" }: { state?: "default" | "validation" | "loading" | "success" }) => (
  <AuthCard>
    <div className="text-center mb-6">
      <p className="font-serif text-3xl font-semibold tracking-tight">Forgot Password</p>
      <p className="text-sm text-muted-foreground mt-1">Enter your email to receive a one-time verification code.</p>
    </div>

    {state === "success" && <InlineSuccess msg="If an account exists for this email, a verification code has been sent." />}

    <div className="space-y-4 mt-4">
      <div className="space-y-1">
        <Label htmlFor="forgot-email">Email Address <span className="text-destructive">*</span></Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input id="forgot-email" type="email" placeholder="jane@example.com"
            className={`pl-9 ${state === "validation" ? "border-destructive" : ""}`}
            disabled={state === "loading" || state === "success"} />
        </div>
        {state === "validation" && <FieldError msg="Please enter a valid email address." />}
      </div>

      <Button className="w-full" disabled={state === "loading" || state === "success"}>
        {state === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
        {state === "loading" ? "Sending…" : state === "success" ? "Code Sent ✓" : "Send Verification Code"}
      </Button>

      {state === "success" && (
        <Button variant="outline" className="w-full">Continue to Enter Code →</Button>
      )}

      <p className="text-center">
        <button className="text-sm text-accent hover:underline">← Back to sign in</button>
      </p>
    </div>
  </AuthCard>
);

/* ═══════════════════════════════════════════════════
   SCREEN 6: VERIFY OTP
   POST /api/v1/auth/verify-otp { email, otp }
   POST /api/v1/auth/resend-otp { email }
   ═══════════════════════════════════════════════════ */
const VerifyOTPScreen = ({ state = "default" }: { state?: "default" | "validation" | "invalid" | "expired" | "loading" | "success" }) => (
  <AuthCard>
    <div className="text-center mb-6">
      <p className="font-serif text-3xl font-semibold tracking-tight">Enter Verification Code</p>
      <p className="text-sm text-muted-foreground mt-1">
        We sent a 6-digit code to <span className="font-medium text-foreground">jane@example.com</span>
      </p>
    </div>

    {state === "invalid" && <InlineError msg="Invalid verification code. Please check and try again." />}
    {state === "expired" && <InlineError msg="This code has expired. Request a new one below." />}
    {state === "success" && <InlineSuccess msg="Code verified! Redirecting to reset password…" />}

    <div className="space-y-4 mt-4">
      <div className="space-y-1">
        <Label>Verification Code <span className="text-destructive">*</span></Label>
        <div className="flex gap-2 justify-center">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Input key={i} maxLength={1} className={`w-12 h-14 text-center text-xl font-semibold ${
              state === "invalid" || state === "expired" ? "border-destructive" : state === "success" ? "border-success" : ""
            }`} disabled={state === "loading" || state === "success"}
            defaultValue={state === "success" ? String(i + 1) : state === "invalid" ? String(9 - i) : ""} />
          ))}
        </div>
        {state === "validation" && <FieldError msg="Please enter all 6 digits." />}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <span className="flex items-center justify-center gap-1"><Clock className="w-3.5 h-3.5" /> Code expires in <span className="font-medium text-foreground">4:32</span></span>
      </div>

      <Button className="w-full" disabled={state === "loading" || state === "success"}>
        {state === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
        {state === "loading" ? "Verifying…" : state === "success" ? "Verified ✓" : "Verify Code"}
      </Button>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Didn't receive a code? <button className="text-accent hover:underline font-medium">Resend Code</button>
        </p>
        <p className="text-xs text-muted-foreground mt-1">Calls POST /api/v1/auth/resend-otp</p>
      </div>

      <p className="text-center">
        <button className="text-sm text-accent hover:underline">← Back to forgot password</button>
      </p>
    </div>
  </AuthCard>
);

/* ═══════════════════════════════════════════════════
   SCREEN 7: RESET PASSWORD
   POST /api/v1/auth/reset-password
   Headers: Authorization Bearer <reset_token>
   Body: { new_password }
   ═══════════════════════════════════════════════════ */
const ResetPasswordScreen = ({ state = "default" }: { state?: "default" | "validation" | "api-error" | "loading" | "success" }) => (
  <AuthCard>
    <div className="text-center mb-6">
      <p className="font-serif text-3xl font-semibold tracking-tight">Set New Password</p>
      <p className="text-sm text-muted-foreground mt-1">Choose a strong password for your account.</p>
    </div>

    {state === "api-error" && <InlineError msg="Unable to reset password. The reset token may have expired. Please start over." />}
    {state === "success" && <InlineSuccess msg="Password reset successfully! Redirecting to sign in…" />}

    <div className="space-y-4 mt-4">
      <PasswordInput id="reset-new" label="New Password" placeholder="Min 8 characters"
        error={state === "validation" ? "Password must be at least 8 characters." : undefined}
        disabled={state === "loading" || state === "success"} />

      <PasswordInput id="reset-confirm" label="Confirm New Password" placeholder="Re-enter password"
        error={state === "validation" ? "Passwords do not match." : undefined}
        disabled={state === "loading" || state === "success"} />

      <div className="bg-secondary/50 rounded-md p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground mb-1">Password requirements:</p>
        <p>• At least 8 characters</p>
        <p>• One uppercase letter</p>
        <p>• One number</p>
      </div>

      <Button className="w-full" disabled={state === "loading" || state === "success"}>
        {state === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
        {state === "loading" ? "Resetting…" : state === "success" ? "Done ✓" : "Reset Password"}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        After resetting, you will be redirected to sign in with your new password.
      </p>
    </div>
  </AuthCard>
);

/* ═══════════════════════════════════════════════════
   SCREEN 8: SESSION EXPIRED
   ═══════════════════════════════════════════════════ */
const SessionExpiredModal = () => (
  <div className="min-h-[400px] flex items-center justify-center bg-foreground/30 backdrop-blur-sm rounded-lg border border-border">
    <div className="bg-card border border-border rounded-lg shadow-xl max-w-sm w-full p-6 text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
        <ShieldAlert className="w-7 h-7 text-warning" />
      </div>
      <p className="font-serif text-xl font-semibold">Session Expired</p>
      <p className="text-sm text-muted-foreground">Your session has expired. Please sign in again to continue.</p>
      <div className="bg-secondary/50 rounded-md p-3 text-xs text-muted-foreground">
        <p>Token refresh via POST /api/v1/auth/refresh-token failed.</p>
        <p className="mt-1">Requires: Authorization header + refreshToken body.</p>
      </div>
      <Button className="w-full">Sign In Again</Button>
      <button className="text-sm text-muted-foreground hover:text-foreground">Continue browsing as guest</button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════
   SCREEN 9: LOGOUT CONFIRMATION
   POST /api/v1/auth/logout
   Headers: Authorization Bearer <accessToken>
   Body: { refreshToken }
   ═══════════════════════════════════════════════════ */
const LogoutModal = () => (
  <div className="min-h-[400px] flex items-center justify-center bg-foreground/30 backdrop-blur-sm rounded-lg border border-border">
    <div className="bg-card border border-border rounded-lg shadow-xl max-w-sm w-full p-6 text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto">
        <LogOut className="w-7 h-7 text-muted-foreground" />
      </div>
      <p className="font-serif text-xl font-semibold">Sign Out?</p>
      <p className="text-sm text-muted-foreground">You'll need to sign in again to access your account, orders, and wishlist.</p>
      <div className="bg-secondary/50 rounded-md p-3 text-xs text-muted-foreground">
        <p>Calls POST /api/v1/auth/logout with accessToken header + refreshToken body.</p>
        <p className="mt-1">If access token expired, still clears local session.</p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1">Cancel</Button>
        <Button className="flex-1">Sign Out</Button>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════
   SPEC TABLES
   ═══════════════════════════════════════════════════ */
const SpecTable = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <div className="overflow-x-auto border border-border rounded-lg">
    <table className="w-full text-sm">
      <thead><tr className="bg-secondary/50 border-b border-border">
        {headers.map((h) => <th key={h} className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">{h}</th>)}
      </tr></thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-border last:border-0">
            {row.map((cell, j) => <td key={j} className="px-4 py-2 text-xs">{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ═══════════════════════════════════════════════════
   MAIN AUTH SHOWCASE PAGE
   ═══════════════════════════════════════════════════ */
const AuthShowcase = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight">Auth UI Showcase</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Feature 1 — Authentication & Authorization Screens</p>
          </div>
          <a href="/" className="text-sm text-accent hover:underline flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Back to Index</a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8 space-y-16">

        {/* ── SECTION 1: SCREEN INVENTORY ── */}
        <section>
          <h2 className="font-serif text-3xl font-semibold mb-2">Section 1: Screen Inventory</h2>
          <SpecTable
            headers={["#", "Screen", "Route", "Endpoint", "Auth Required"]}
            rows={[
              ["1", "Login", "/auth/login", "POST /api/v1/auth/login", "No"],
              ["2", "Register", "/auth/register", "POST /api/v1/auth/register", "No"],
              ["3", "Check Email", "/auth/check-email", "— (info screen)", "No"],
              ["4", "Verify Email", "/auth/verify-email", "GET /api/v1/auth/verify-email?token=", "No"],
              ["5", "Forgot Password", "/auth/forgot-password", "POST /api/v1/auth/forgot-password", "No"],
              ["6", "Verify OTP", "/auth/verify-otp", "POST /api/v1/auth/verify-otp", "No"],
              ["7", "Reset Password", "/auth/reset-password", "POST /api/v1/auth/reset-password", "Bearer reset_token"],
              ["8", "Session Expired", "(modal overlay)", "POST /api/v1/auth/refresh-token", "Bearer accessToken"],
              ["9", "Logout", "(modal overlay)", "POST /api/v1/auth/logout", "Bearer accessToken"],
            ]}
          />
        </section>

        {/* ── SECTION 2: DETAILED SCREEN SPECS ── */}
        <section>
          <h2 className="font-serif text-3xl font-semibold mb-6">Section 2: Detailed Screen Specs</h2>

          {/* LOGIN */}
          <div className="mb-12">
            <h3 className="font-serif text-2xl font-semibold mb-1">Screen 1: Login</h3>
            <p className="text-sm text-muted-foreground mb-4">POST /api/v1/auth/login — Body: {"{ email, password }"}</p>
            <Tabs defaultValue="default">
              <TabsList className="bg-secondary mb-4">
                <TabsTrigger value="default">Default</TabsTrigger>
                <TabsTrigger value="validation">Validation Error</TabsTrigger>
                <TabsTrigger value="api-error">API Error</TabsTrigger>
                <TabsTrigger value="unverified">Unverified Email</TabsTrigger>
                <TabsTrigger value="locked">Account Locked</TabsTrigger>
                <TabsTrigger value="loading">Loading</TabsTrigger>
                <TabsTrigger value="success">Success</TabsTrigger>
              </TabsList>
              <TabsContent value="default"><LoginScreen state="default" /></TabsContent>
              <TabsContent value="validation"><LoginScreen state="validation" /></TabsContent>
              <TabsContent value="api-error"><LoginScreen state="api-error" /></TabsContent>
              <TabsContent value="unverified"><LoginScreen state="unverified" /></TabsContent>
              <TabsContent value="locked"><LoginScreen state="locked" /></TabsContent>
              <TabsContent value="loading"><LoginScreen state="loading" /></TabsContent>
              <TabsContent value="success"><LoginScreen state="success" /></TabsContent>
            </Tabs>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <SpecTable headers={["Field", "Type", "Required", "Validation"]} rows={[
                ["email", "email", "Yes", "Valid email format"],
                ["password", "password", "Yes", "Non-empty"],
              ]} />
              <SpecTable headers={["API Response", "UX Behavior"]} rows={[
                ["200 + tokens", "Store tokens → redirect to last page or /"],
                ["401 invalid credentials", "Show 'Invalid email or password' error"],
                ["403 email not verified", "Show 'Please verify your email' error"],
                ["429 account locked", "Show account locked message"],
              ]} />
            </div>
          </div>

          {/* REGISTER */}
          <div className="mb-12">
            <h3 className="font-serif text-2xl font-semibold mb-1">Screen 2: Register</h3>
            <p className="text-sm text-muted-foreground mb-4">POST /api/v1/auth/register — Body: {"{ email, password, firstName, lastName, phoneNumber?, dateOfBirth?, gender? }"}</p>
            <Tabs defaultValue="default">
              <TabsList className="bg-secondary mb-4">
                <TabsTrigger value="default">Default</TabsTrigger>
                <TabsTrigger value="validation">Validation</TabsTrigger>
                <TabsTrigger value="api-error">API Error</TabsTrigger>
                <TabsTrigger value="loading">Loading</TabsTrigger>
              </TabsList>
              <TabsContent value="default"><RegisterScreen state="default" /></TabsContent>
              <TabsContent value="validation"><RegisterScreen state="validation" /></TabsContent>
              <TabsContent value="api-error"><RegisterScreen state="api-error" /></TabsContent>
              <TabsContent value="loading"><RegisterScreen state="loading" /></TabsContent>
            </Tabs>
            <div className="mt-4">
              <SpecTable headers={["Field", "Type", "Required", "Validation"]} rows={[
                ["firstName", "text", "Yes", "Non-empty, max 50 chars"],
                ["lastName", "text", "Yes", "Non-empty, max 50 chars"],
                ["email", "email", "Yes", "Valid email format"],
                ["password", "password", "Yes", "Min 8 chars, 1 uppercase, 1 number"],
                ["phoneNumber", "tel", "No", "Valid phone format if provided"],
                ["dateOfBirth", "date", "No", "Must be in the past"],
                ["gender", "select", "No", "male | female | other"],
              ]} />
            </div>
          </div>

          {/* CHECK EMAIL */}
          <div className="mb-12">
            <h3 className="font-serif text-2xl font-semibold mb-1">Screen 3: Check Email</h3>
            <p className="text-sm text-muted-foreground mb-4">Informational screen shown after successful registration.</p>
            <CheckEmailScreen />
          </div>

          {/* VERIFY EMAIL */}
          <div className="mb-12">
            <h3 className="font-serif text-2xl font-semibold mb-1">Screen 4: Verify Email Callback</h3>
            <p className="text-sm text-muted-foreground mb-4">GET /api/v1/auth/verify-email?token=...</p>
            <Tabs defaultValue="loading">
              <TabsList className="bg-secondary mb-4">
                <TabsTrigger value="loading">Loading</TabsTrigger>
                <TabsTrigger value="success">Success</TabsTrigger>
                <TabsTrigger value="invalid">Invalid Token</TabsTrigger>
                <TabsTrigger value="expired">Expired Token</TabsTrigger>
              </TabsList>
              <TabsContent value="loading"><VerifyEmailScreen state="loading" /></TabsContent>
              <TabsContent value="success"><VerifyEmailScreen state="success" /></TabsContent>
              <TabsContent value="invalid"><VerifyEmailScreen state="invalid" /></TabsContent>
              <TabsContent value="expired"><VerifyEmailScreen state="expired" /></TabsContent>
            </Tabs>
          </div>

          {/* FORGOT PASSWORD */}
          <div className="mb-12">
            <h3 className="font-serif text-2xl font-semibold mb-1">Screen 5: Forgot Password</h3>
            <p className="text-sm text-muted-foreground mb-4">POST /api/v1/auth/forgot-password {"{ email }"}</p>
            <Tabs defaultValue="default">
              <TabsList className="bg-secondary mb-4">
                <TabsTrigger value="default">Default</TabsTrigger>
                <TabsTrigger value="validation">Validation</TabsTrigger>
                <TabsTrigger value="loading">Loading</TabsTrigger>
                <TabsTrigger value="success">Success</TabsTrigger>
              </TabsList>
              <TabsContent value="default"><ForgotPasswordScreen state="default" /></TabsContent>
              <TabsContent value="validation"><ForgotPasswordScreen state="validation" /></TabsContent>
              <TabsContent value="loading"><ForgotPasswordScreen state="loading" /></TabsContent>
              <TabsContent value="success"><ForgotPasswordScreen state="success" /></TabsContent>
            </Tabs>
          </div>

          {/* VERIFY OTP */}
          <div className="mb-12">
            <h3 className="font-serif text-2xl font-semibold mb-1">Screen 6: Verify OTP</h3>
            <p className="text-sm text-muted-foreground mb-4">POST /api/v1/auth/verify-otp {"{ email, otp }"} · POST /api/v1/auth/resend-otp {"{ email }"}</p>
            <Tabs defaultValue="default">
              <TabsList className="bg-secondary mb-4">
                <TabsTrigger value="default">Default</TabsTrigger>
                <TabsTrigger value="validation">Validation</TabsTrigger>
                <TabsTrigger value="invalid">Invalid Code</TabsTrigger>
                <TabsTrigger value="expired">Expired</TabsTrigger>
                <TabsTrigger value="loading">Loading</TabsTrigger>
                <TabsTrigger value="success">Success</TabsTrigger>
              </TabsList>
              <TabsContent value="default"><VerifyOTPScreen state="default" /></TabsContent>
              <TabsContent value="validation"><VerifyOTPScreen state="validation" /></TabsContent>
              <TabsContent value="invalid"><VerifyOTPScreen state="invalid" /></TabsContent>
              <TabsContent value="expired"><VerifyOTPScreen state="expired" /></TabsContent>
              <TabsContent value="loading"><VerifyOTPScreen state="loading" /></TabsContent>
              <TabsContent value="success"><VerifyOTPScreen state="success" /></TabsContent>
            </Tabs>
          </div>

          {/* RESET PASSWORD */}
          <div className="mb-12">
            <h3 className="font-serif text-2xl font-semibold mb-1">Screen 7: Reset Password</h3>
            <p className="text-sm text-muted-foreground mb-4">POST /api/v1/auth/reset-password — Headers: Bearer reset_token — Body: {"{ new_password }"}</p>
            <Tabs defaultValue="default">
              <TabsList className="bg-secondary mb-4">
                <TabsTrigger value="default">Default</TabsTrigger>
                <TabsTrigger value="validation">Validation</TabsTrigger>
                <TabsTrigger value="api-error">API Error</TabsTrigger>
                <TabsTrigger value="loading">Loading</TabsTrigger>
                <TabsTrigger value="success">Success</TabsTrigger>
              </TabsList>
              <TabsContent value="default"><ResetPasswordScreen state="default" /></TabsContent>
              <TabsContent value="validation"><ResetPasswordScreen state="validation" /></TabsContent>
              <TabsContent value="api-error"><ResetPasswordScreen state="api-error" /></TabsContent>
              <TabsContent value="loading"><ResetPasswordScreen state="loading" /></TabsContent>
              <TabsContent value="success"><ResetPasswordScreen state="success" /></TabsContent>
            </Tabs>
          </div>

          {/* SESSION EXPIRED + LOGOUT */}
          <div className="mb-12">
            <h3 className="font-serif text-2xl font-semibold mb-1">Screen 8 & 9: Session Expired & Logout</h3>
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div>
                <p className="showcase-group-title mb-3">Session Expired Modal</p>
                <SessionExpiredModal />
              </div>
              <div>
                <p className="showcase-group-title mb-3">Logout Confirmation Modal</p>
                <LogoutModal />
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: FLOW + TRANSITIONS ── */}
        <section>
          <h2 className="font-serif text-3xl font-semibold mb-4">Section 3: Auth Flow & Transitions</h2>
          <div className="bg-card border border-border rounded-lg p-6 font-mono text-sm space-y-6">
            <div>
              <p className="font-sans font-semibold text-accent mb-2">Registration Flow</p>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{`/auth/register
  ├─ POST /api/v1/auth/register → 201 Created
  │   └─ Redirect → /auth/check-email
  │       └─ User clicks email link
  │           └─ GET /api/v1/auth/verify-email?token=xxx
  │               ├─ 200 → /auth/verify-email (success) → "Continue to Sign In" → /auth/login
  │               ├─ 400 → /auth/verify-email (invalid token)
  │               └─ 410 → /auth/verify-email (expired token) → "Resend"
  └─ 409 Conflict → "Account already exists" error`}</pre>
            </div>
            <Separator />
            <div>
              <p className="font-sans font-semibold text-accent mb-2">Login Flow</p>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{`/auth/login
  ├─ POST /api/v1/auth/login → 200 + { accessToken, refreshToken }
  │   └─ Store tokens → Redirect to returnUrl || /
  ├─ 401 → "Invalid email or password"
  ├─ 403 → "Please verify your email"
  └─ 429 → "Account locked"`}</pre>
            </div>
            <Separator />
            <div>
              <p className="font-sans font-semibold text-accent mb-2">Password Reset Flow</p>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{`/auth/forgot-password
  └─ POST /api/v1/auth/forgot-password { email } → 200
      └─ Redirect → /auth/verify-otp?email=jane@example.com
          ├─ POST /api/v1/auth/verify-otp { email, otp } → 200 + { reset_token }
          │   └─ Redirect → /auth/reset-password
          │       ├─ POST /api/v1/auth/reset-password { new_password }
          │       │   Headers: Bearer reset_token
          │       │   └─ 200 → Redirect to /auth/login with success message
          │       └─ 401 → "Reset token expired, start over"
          ├─ 400 → "Invalid code"
          └─ 410 → "Code expired" → "Resend" → POST /api/v1/auth/resend-otp { email }`}</pre>
            </div>
            <Separator />
            <div>
              <p className="font-sans font-semibold text-accent mb-2">Session Refresh</p>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{`On 401 from any protected API:
  └─ POST /api/v1/auth/refresh-token
      Headers: Authorization: Bearer <accessToken>
      Body: { refreshToken }
      ├─ 200 → New tokens → Retry original request
      └─ 401 → Show Session Expired modal → /auth/login`}</pre>
            </div>
            <Separator />
            <div>
              <p className="font-sans font-semibold text-accent mb-2">Logout</p>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{`User clicks "Sign Out":
  └─ Show confirmation modal
      └─ Confirm:
          ├─ POST /api/v1/auth/logout
          │   Headers: Bearer <accessToken>
          │   Body: { refreshToken }
          │   └─ 200 → Clear local tokens → /auth/login
          └─ If 401 (expired token) → Still clear local tokens → /auth/login`}</pre>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: DESIGN SYSTEM SLICE ── */}
        <section>
          <h2 className="font-serif text-3xl font-semibold mb-4">Section 4: Design System — Auth Slice</h2>
          <div className="grid grid-cols-2 gap-6">
            <SpecTable headers={["Token", "Value", "Usage"]} rows={[
              ["--background", "40 33% 97%", "Page background (ivory)"],
              ["--card", "40 25% 95%", "Auth card surface"],
              ["--foreground", "220 15% 15%", "Primary text (charcoal)"],
              ["--accent", "32 40% 52%", "CTAs, links (warm gold)"],
              ["--destructive", "0 65% 50%", "Error states"],
              ["--success", "145 45% 40%", "Success states"],
              ["--warning", "38 90% 55%", "Warnings, expiry"],
              ["--border", "35 15% 85%", "Card borders, dividers"],
              ["--ring", "32 40% 52%", "Focus ring (matches accent)"],
            ]} />
            <SpecTable headers={["Element", "Spec"]} rows={[
              ["Headings", "Cormorant Garamond, 30px, semibold"],
              ["Body text", "Inter, 14px, regular"],
              ["Labels", "Inter, 14px, medium"],
              ["Helper text", "Inter, 12px, muted-foreground"],
              ["Error text", "Inter, 12px, destructive"],
              ["Auth card", "max-w-md, rounded-lg, shadow-lg, p-8"],
              ["Input height", "h-10 (40px)"],
              ["Button height", "h-10, full-width in auth forms"],
              ["Focus ring", "ring-2 ring-ring ring-offset-2"],
              ["Spacing scale", "4px increments: 4, 8, 12, 16, 24, 32"],
            ]} />
          </div>
          <div className="mt-4">
            <SpecTable headers={["Keyboard Flow", "Behavior"]} rows={[
              ["Tab", "Moves through: email → password → remember me → forgot link → submit → register link"],
              ["Enter", "Submits form from any input field"],
              ["Escape", "Closes modals (session expired, logout)"],
              ["Shift+Tab", "Reverse tab order"],
              ["Space", "Toggles checkboxes, activates buttons"],
            ]} />
          </div>
        </section>

        {/* ── SECTION 5: UX COPY ── */}
        <section>
          <h2 className="font-serif text-3xl font-semibold mb-4">Section 5: UX Copy Set</h2>
          <SpecTable headers={["Screen", "Title", "Subtitle", "CTA", "Error Copy"]} rows={[
            ["Login", "Welcome Back", "Sign in to your MAISON account", "Sign In", "Invalid email or password."],
            ["Register", "Create Account", "Join MAISON for an exclusive shopping experience", "Create Account", "An account with this email already exists."],
            ["Check Email", "Check Your Email", "We've sent a verification link to {email}", "Resend Verification Email", "—"],
            ["Verify Email", "Verifying Your Email / Email Verified! / Invalid Link / Link Expired", "(varies)", "Continue to Sign In / Resend", "(varies)"],
            ["Forgot Password", "Forgot Password", "Enter your email to receive a verification code", "Send Verification Code", "—"],
            ["Verify OTP", "Enter Verification Code", "We sent a 6-digit code to {email}", "Verify Code", "Invalid code / Code expired"],
            ["Reset Password", "Set New Password", "Choose a strong password", "Reset Password", "Reset token expired"],
            ["Session Expired", "Session Expired", "Please sign in again to continue", "Sign In Again", "—"],
            ["Logout", "Sign Out?", "You'll need to sign in again", "Sign Out / Cancel", "—"],
          ]} />
        </section>

        {/* ── SECTION 6: NEXT.JS HANDOFF ── */}
        <section>
          <h2 className="font-serif text-3xl font-semibold mb-4">Section 6: Next.js Handoff</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="showcase-group-title mb-3">Route Map</h3>
              <SpecTable headers={["Route", "Component", "Guard"]} rows={[
                ["/auth/login", "LoginPage", "Redirect if authenticated"],
                ["/auth/register", "RegisterPage", "Redirect if authenticated"],
                ["/auth/check-email", "CheckEmailPage", "Public"],
                ["/auth/verify-email", "VerifyEmailPage", "Public (reads ?token=)"],
                ["/auth/forgot-password", "ForgotPasswordPage", "Public"],
                ["/auth/verify-otp", "VerifyOTPPage", "Public (reads ?email=)"],
                ["/auth/reset-password", "ResetPasswordPage", "Requires reset_token in state"],
              ]} />
            </div>
            <div>
              <h3 className="showcase-group-title mb-3">State Management</h3>
              <div className="bg-card border border-border rounded-lg p-4 text-sm space-y-3">
                <div><span className="font-medium">Token Storage:</span> <span className="text-muted-foreground">httpOnly cookies (preferred) or localStorage + memory</span></div>
                <div><span className="font-medium">Auth Context:</span> <span className="text-muted-foreground">React Context with useAuth() hook</span></div>
                <div><span className="font-medium">API Client:</span> <span className="text-muted-foreground">Axios interceptor for auto-refresh on 401</span></div>
                <div><span className="font-medium">Route Guards:</span> <span className="text-muted-foreground">Next.js middleware or AuthGuard wrapper</span></div>
                <div><span className="font-medium">Email passing:</span> <span className="text-muted-foreground">URL params (?email=) for OTP; React state for reset_token</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 7: COMPLIANCE CHECKLIST ── */}
        <section>
          <h2 className="font-serif text-3xl font-semibold mb-4">Section 7: Constraint Compliance</h2>
          <div className="bg-card border border-border rounded-lg p-6 space-y-2">
            {[
              "No invented endpoints — only uses the 9 listed API routes",
              "No invented payload fields — exact match to contract",
              "All 9 required screens included with full state coverage",
              "Login handles: success, invalid creds, unverified email, account locked",
              "Verify email handles: loading, success, invalid token, expired token",
              "OTP handles: default, validation, invalid, expired, loading, success",
              "Reset password uses Bearer reset_token header",
              "Refresh token shows both accessToken header + refreshToken body requirement",
              "Logout gracefully handles expired access token edge case",
              "Desktop web only — no mobile/tablet variants",
              "Keyboard accessibility annotated",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
};

export default AuthShowcase;
