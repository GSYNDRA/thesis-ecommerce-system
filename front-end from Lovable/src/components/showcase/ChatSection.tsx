import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, MoreVertical } from "lucide-react";

const ChatBubble = ({ sender, type, message, time }: {
  sender: string; type: "customer" | "ai" | "staff" | "system"; message: string; time?: string;
}) => {
  const isRight = type === "customer";
  const styles: Record<string, string> = {
    customer: "bg-primary text-primary-foreground ml-auto",
    ai: "bg-secondary text-secondary-foreground",
    staff: "bg-card border border-border text-foreground",
    system: "bg-muted text-muted-foreground text-center mx-auto text-xs italic",
  };
  if (type === "system") {
    return <div className={`py-2 px-4 rounded-full ${styles[type]} max-w-md`}>{message}</div>;
  }
  return (
    <div className={`flex flex-col gap-1 max-w-[70%] ${isRight ? "items-end ml-auto" : "items-start"}`}>
      <span className="text-[10px] text-muted-foreground font-medium">{sender} {type === "ai" && <Badge className="bg-info text-info-foreground text-[9px] px-1 py-0 ml-1">AI</Badge>}</span>
      <div className={`px-4 py-2.5 rounded-2xl text-sm ${styles[type]} ${isRight ? "rounded-br-sm" : "rounded-bl-sm"}`}>{message}</div>
      <span className="text-[10px] text-muted-foreground">{time}</span>
    </div>
  );
};

const TypingIndicator = ({ name }: { name: string }) => (
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <span>{name} is typing</span>
    <span className="flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
      ))}
    </span>
  </div>
);

const AssignmentNotice = ({ from, to }: { from: string; to: string }) => (
  <div className="flex items-center justify-center gap-2 py-2">
    <div className="h-px flex-1 bg-border" />
    <span className="text-[10px] text-muted-foreground px-2">Reassigned from {from} → {to}</span>
    <div className="h-px flex-1 bg-border" />
  </div>
);

const ChatSection = () => (
  <section className="showcase-section">
    <h2 className="showcase-section-title">9. Chat Components</h2>
    <p className="showcase-section-desc">Chat bubbles, typing indicator, assignment notices, message input.</p>

    <div className="max-w-2xl">
      <div className="showcase-group">
        <h3 className="showcase-group-title">Chat Thread</h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Order #38291 — Jane Doe</p>
              <p className="text-xs text-muted-foreground">Conversation started 2 min ago</p>
            </div>
            <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
          </div>

          <div className="p-4 space-y-4 min-h-[300px]">
            <ChatBubble sender="Jane" type="customer" message="Hi, I have a question about my order. The silk dress hasn't shipped yet." time="2:30 PM" />
            <ChatBubble sender="AI Assistant" type="ai" message="I can see your order #38291. The Silk Evening Dress is being prepared for shipping and should dispatch within 24 hours." time="2:30 PM" />
            <ChatBubble sender="" type="system" message="AI confidence below threshold — escalating to staff" />
            <AssignmentNotice from="AI Assistant" to="Sophie M." />
            <ChatBubble sender="Sophie M." type="staff" message="Hi Jane! I've checked with the warehouse team. Your dress will ship today with express delivery. You'll receive tracking shortly." time="2:34 PM" />
            <ChatBubble sender="Jane" type="customer" message="Thank you so much! 🙏" time="2:35 PM" />
            <TypingIndicator name="Sophie M." />
          </div>

          <div className="border-t border-border p-3 flex items-center gap-2">
            <Button variant="ghost" size="icon"><Paperclip className="w-4 h-4" /></Button>
            <Input placeholder="Type a message..." className="flex-1" />
            <Button size="icon"><Send className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default ChatSection;
