import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const FormBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
    <h4 className="font-serif text-2xl font-semibold mb-6 text-center">{title}</h4>
    {children}
  </div>
);

const FormPatternsSection = () => {
  return (
    <section className="showcase-section">
      <h2 className="showcase-section-title">4. Form Patterns</h2>
      <p className="showcase-section-desc">Auth-related form blocks: login, register, forgot password, reset password.</p>

      <div className="grid grid-cols-2 gap-8">
        <FormBlock title="Sign In">
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" type="email" placeholder="jane@example.com" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="login-pass">Password</Label>
              <Input id="login-pass" type="password" placeholder="••••••••" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-sm">Remember me</Label>
              </div>
              <button className="text-sm text-accent hover:underline">Forgot password?</button>
            </div>
            <Button className="w-full">Sign In</Button>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account? <button className="text-accent hover:underline">Sign up</button>
            </p>
          </div>
        </FormBlock>

        <FormBlock title="Create Account">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="reg-first">First Name</Label>
                <Input id="reg-first" placeholder="Jane" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="reg-last">Last Name</Label>
                <Input id="reg-last" placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="reg-email">Email</Label>
              <Input id="reg-email" type="email" placeholder="jane@example.com" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="reg-pass">Password</Label>
              <Input id="reg-pass" type="password" placeholder="••••••••" />
              <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms" className="text-sm">I agree to the Terms & Privacy Policy</Label>
            </div>
            <Button className="w-full">Create Account</Button>
          </div>
        </FormBlock>

        <FormBlock title="Forgot Password">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">Enter your email and we'll send you a reset link.</p>
            <div className="space-y-1">
              <Label htmlFor="forgot-email">Email</Label>
              <Input id="forgot-email" type="email" placeholder="jane@example.com" />
            </div>
            <Button className="w-full">Send Reset Link</Button>
            <p className="text-center text-sm text-muted-foreground">
              <button className="text-accent hover:underline">← Back to sign in</button>
            </p>
          </div>
        </FormBlock>

        <FormBlock title="Reset Password">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">Enter your new password below.</p>
            <div className="space-y-1">
              <Label htmlFor="reset-new">New Password</Label>
              <Input id="reset-new" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="reset-confirm">Confirm Password</Label>
              <Input id="reset-confirm" type="password" placeholder="••••••••" />
            </div>
            <Button className="w-full">Reset Password</Button>
          </div>
        </FormBlock>
      </div>
    </section>
  );
};

export default FormPatternsSection;
