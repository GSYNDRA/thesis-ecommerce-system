import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const InputsSection = () => {
  return (
    <section className="showcase-section">
      <h2 className="showcase-section-title">3. Inputs & Form Controls</h2>
      <p className="showcase-section-desc">Text inputs, selects, checkboxes, radios, toggles with states.</p>

      <div className="grid grid-cols-3 gap-8">
        <div className="space-y-4">
          <h3 className="showcase-group-title">Text Inputs</h3>
          <div className="space-y-1">
            <Label htmlFor="default-input">Default</Label>
            <Input id="default-input" placeholder="Enter value..." />
          </div>
          <div className="space-y-1">
            <Label htmlFor="filled-input">Filled</Label>
            <Input id="filled-input" defaultValue="Jane Doe" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="disabled-input">Disabled</Label>
            <Input id="disabled-input" disabled defaultValue="Disabled" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="error-input" className="text-destructive">With Error</Label>
            <Input id="error-input" className="border-destructive focus-visible:ring-destructive" defaultValue="invalid@" />
            <p className="text-xs text-destructive">Please enter a valid email address.</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="success-input" className="text-success">Success</Label>
            <Input id="success-input" className="border-success focus-visible:ring-success" defaultValue="jane@acme.com" />
            <p className="text-xs text-success">Email verified ✓</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="showcase-group-title">Textarea & Select</h3>
          <div className="space-y-1">
            <Label>Textarea</Label>
            <Textarea placeholder="Write your message..." rows={3} />
          </div>
          <div className="space-y-1">
            <Label>Select</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Choose size..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xs">XS</SelectItem>
                <SelectItem value="s">S</SelectItem>
                <SelectItem value="m">M</SelectItem>
                <SelectItem value="l">L</SelectItem>
                <SelectItem value="xl">XL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Select (Disabled)</Label>
            <Select disabled>
              <SelectTrigger>
                <SelectValue placeholder="Disabled select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="x">X</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Slider</Label>
            <Slider defaultValue={[60]} max={100} step={1} />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="showcase-group-title">Toggles & Choices</h3>
          <div className="flex items-center gap-3">
            <Checkbox id="check-default" />
            <Label htmlFor="check-default">Default checkbox</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox id="check-checked" defaultChecked />
            <Label htmlFor="check-checked">Checked</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox id="check-disabled" disabled />
            <Label htmlFor="check-disabled" className="text-muted-foreground">Disabled</Label>
          </div>

          <div className="space-y-2 pt-2">
            <Label>Radio Group</Label>
            <RadioGroup defaultValue="standard">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="standard" id="radio-1" />
                <Label htmlFor="radio-1">Standard Shipping</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="express" id="radio-2" />
                <Label htmlFor="radio-2">Express Shipping</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="overnight" id="radio-3" disabled />
                <Label htmlFor="radio-3" className="text-muted-foreground">Overnight (Unavailable)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <Switch id="switch-default" />
              <Label htmlFor="switch-default">Notifications</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="switch-on" defaultChecked />
              <Label htmlFor="switch-on">Dark Mode</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="switch-disabled" disabled />
              <Label htmlFor="switch-disabled" className="text-muted-foreground">Disabled</Label>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InputsSection;
