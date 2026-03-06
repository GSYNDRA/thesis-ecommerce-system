import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MessageSquare, Clock, User } from "lucide-react";

const WorkloadCard = ({ name, active, sessions, avgTime }: { name: string; active: number; sessions: number; avgTime: string }) => (
  <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-xs font-semibold">{name.split(" ").map(n => n[0]).join("")}</div>
        <span className="text-sm font-medium">{name}</span>
      </div>
      <Badge className="bg-success text-success-foreground text-[10px]">Online</Badge>
    </div>
    <div className="grid grid-cols-3 gap-2 text-center">
      <div><p className="text-lg font-semibold">{active}</p><p className="text-[10px] text-muted-foreground">Active</p></div>
      <div><p className="text-lg font-semibold">{sessions}</p><p className="text-[10px] text-muted-foreground">Today</p></div>
      <div><p className="text-lg font-semibold">{avgTime}</p><p className="text-[10px] text-muted-foreground">Avg Time</p></div>
    </div>
  </div>
);

const SessionListRow = ({ customer, subject, time, status }: { customer: string; subject: string; time: string; status: "active" | "waiting" | "resolved" }) => {
  const statusStyles: Record<string, string> = {
    active: "bg-success text-success-foreground",
    waiting: "bg-warning text-warning-foreground",
    resolved: "bg-muted text-muted-foreground",
  };
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center"><User className="w-4 h-4 text-muted-foreground" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{customer}</p>
        <p className="text-xs text-muted-foreground truncate">{subject}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{time}</span>
      <Badge className={`text-[10px] ${statusStyles[status]}`}>{status}</Badge>
    </div>
  );
};

const StatusChips = () => (
  <div className="flex flex-wrap gap-2">
    <Badge className="bg-success text-success-foreground">Online</Badge>
    <Badge className="bg-warning text-warning-foreground">Away</Badge>
    <Badge className="bg-destructive text-destructive-foreground">Busy</Badge>
    <Badge className="bg-muted text-muted-foreground">Offline</Badge>
    <Badge variant="outline">Break</Badge>
    <Badge className="bg-info text-info-foreground">In Training</Badge>
  </div>
);

const StaffSection = () => (
  <section className="showcase-section">
    <h2 className="showcase-section-title">10. Staff Support Components</h2>
    <p className="showcase-section-desc">Availability toggle, workload cards, session list, status chips.</p>

    <div className="grid grid-cols-3 gap-8">
      <div className="space-y-6">
        <div>
          <h3 className="showcase-group-title">Availability Toggle</h3>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Accept new chats</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label className="font-medium">Auto-assign</Label>
              <Switch />
            </div>
          </div>
        </div>
        <div>
          <h3 className="showcase-group-title">Status Chips</h3>
          <StatusChips />
        </div>
      </div>

      <div>
        <h3 className="showcase-group-title">Workload Cards</h3>
        <div className="space-y-3">
          <WorkloadCard name="Sophie Miller" active={3} sessions={12} avgTime="4m" />
          <WorkloadCard name="Alex Chen" active={1} sessions={8} avgTime="6m" />
        </div>
      </div>

      <div>
        <h3 className="showcase-group-title">Session List</h3>
        <div className="bg-card border border-border rounded-lg p-3">
          <SessionListRow customer="Jane Doe" subject="Order #38291 — Shipping question" time="2m ago" status="active" />
          <SessionListRow customer="Mike Smith" subject="Return request — Wrong size" time="8m ago" status="waiting" />
          <SessionListRow customer="Sarah Lee" subject="Payment issue resolved" time="1h ago" status="resolved" />
          <SessionListRow customer="Tom Brown" subject="Product availability" time="2h ago" status="resolved" />
        </div>
      </div>
    </div>
  </section>
);

export default StaffSection;
