import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send } from "lucide-react";

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  buttonLabel?: string;
}

export function Composer({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Type your message...",
  buttonLabel = "Send",
}: ComposerProps) {
  return (
    <div className="border-t p-3">
      <div className="flex items-end gap-2">
        <Button variant="ghost" size="icon" disabled={disabled} aria-label="Attach file">
          <Paperclip className="h-4 w-4" />
        </Button>
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-h-[56px] flex-1"
          disabled={disabled}
        />
        <Button
          size="icon"
          disabled={disabled || value.trim().length === 0}
          onClick={onSend}
          aria-label={buttonLabel}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
