import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageCircle, Send, Paperclip, X, Loader2, ArrowLeft, User,
  AlertCircle, CheckCircle, Clock, Bot, Headphones, MoreVertical,
  RefreshCw, WifiOff, ShieldAlert, Wifi, PhoneOff
} from "lucide-react";

/* ── Shared ── */
const SpecTable = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <div className="overflow-x-auto border border-border rounded-lg">
    <table className="w-full text-sm">
      <thead><tr className="bg-secondary/50 border-b border-border">
        {headers.map((h) => <th key={h} className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">{h}</th>)}
      </tr></thead>
      <tbody>{rows.map((row, i) => (
        <tr key={i} className="border-b border-border last:border-0">
          {row.map((cell, j) => <td key={j} className="px-4 py-2 text-xs">{cell}</td>)}
        </tr>
      ))}</tbody>
    </table>
  </div>
);

/* ── Chat bubble ── */
const Bubble = ({ sender, type, msg, time }: { sender: string; type: "customer" | "ai" | "staff" | "system"; msg: string; time?: string }) => {
  const isRight = type === "customer";
  const styles: Record<string, string> = {
    customer: "bg-primary text-primary-foreground ml-auto rounded-br-sm",
    ai: "bg-secondary text-secondary-foreground rounded-bl-sm",
    staff: "bg-card border border-border text-foreground rounded-bl-sm",
    system: "bg-muted text-muted-foreground text-center mx-auto text-xs italic rounded-full py-1.5 px-4",
  };
  if (type === "system") return <div className={styles[type]}>{msg}</div>;
  return (
    <div className={`flex flex-col gap-1 max-w-[70%] ${isRight ? "items-end ml-auto" : "items-start"}`}>
      <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
        {sender}
        {type === "ai" && <Badge className="bg-info text-info-foreground text-[8px] px-1 py-0">AI</Badge>}
        {type === "staff" && <Badge className="bg-success text-success-foreground text-[8px] px-1 py-0">AGENT</Badge>}
      </span>
      <div className={`px-4 py-2.5 rounded-2xl text-sm ${styles[type]}`}>{msg}</div>
      {time && <span className="text-[10px] text-muted-foreground">{time}</span>}
    </div>
  );
};

const Typing = ({ name, icon: Icon }: { name: string; icon: React.ElementType }) => (
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <Icon className="w-3.5 h-3.5" /><span>{name} is typing</span>
    <span className="flex gap-0.5">{[0, 1, 2].map((i) => <span key={i} className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}</span>
  </div>
);

const StreamingTokens = () => (
  <div className="flex flex-col gap-1 max-w-[70%] items-start">
    <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">AI Assistant <Badge className="bg-info text-info-foreground text-[8px] px-1 py-0">AI</Badge></span>
    <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm">
      I can help you with your order. Let me check the status of <span className="animate-pulse">▊</span>
    </div>
    <span className="text-[10px] text-muted-foreground">Streaming via chat:ai_token events…</span>
  </div>
);

/* ═══════════════════════════════════════════════════
   CUSTOMER SCREENS
   ═══════════════════════════════════════════════════ */

/* Screen 1: Chat Launcher */
const ChatLauncher = () => (
  <div className="relative h-[200px] bg-secondary/30 rounded-lg border border-border flex items-end justify-end p-6">
    <button className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
      <MessageCircle className="w-6 h-6" />
    </button>
    <p className="absolute bottom-6 right-24 text-xs text-muted-foreground">Emits chat:init (no sessionUuid for customer)</p>
  </div>
);

/* Screen 2: Chat AI Mode */
const ChatAIMode = ({ streaming = false }: { streaming?: boolean }) => (
  <div className="bg-card border border-border rounded-lg overflow-hidden max-w-md shadow-lg">
    <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-secondary/30">
      <div className="flex items-center gap-2">
        <Bot className="w-5 h-5 text-info" />
        <div>
          <p className="text-sm font-medium">MAISON Support</p>
          <p className="text-[10px] text-muted-foreground">AI-powered assistant</p>
        </div>
      </div>
      <Button variant="ghost" size="icon"><X className="w-4 h-4" /></Button>
    </div>
    <div className="p-4 space-y-3 min-h-[300px] max-h-[400px] overflow-y-auto">
      <Bubble sender="AI Assistant" type="ai" msg="Hello! How can I help you today?" time="2:30 PM" />
      <Bubble sender="You" type="customer" msg="I'd like to check the status of my order #38291" time="2:31 PM" />
      {streaming ? (
        <StreamingTokens />
      ) : (
        <Bubble sender="AI Assistant" type="ai" msg="Your order #38291 is currently being processed and should ship within 24 hours. Would you like me to notify you when it ships?" time="2:31 PM" />
      )}
      {!streaming && <Typing name="AI" icon={Bot} />}
    </div>
    <div className="border-t border-border p-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon"><Paperclip className="w-4 h-4" /></Button>
        <Input placeholder="Type a message…" className="flex-1" />
        <Button size="icon"><Send className="w-4 h-4" /></Button>
      </div>
      <div className="flex items-center justify-between mt-2">
        <button className="text-[10px] text-accent hover:underline flex items-center gap-1"><Headphones className="w-3 h-3" /> Talk to a human</button>
        <span className="text-[10px] text-muted-foreground">chat:send / chat:ai_token</span>
      </div>
    </div>
  </div>
);

/* Screen 3: Human Handoff Waiting */
const HandoffWaiting = ({ noStaff = false }: { noStaff?: boolean }) => (
  <div className="bg-card border border-border rounded-lg overflow-hidden max-w-md shadow-lg">
    <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-warning/5">
      <div className="flex items-center gap-2">
        <Headphones className="w-5 h-5 text-warning" />
        <div>
          <p className="text-sm font-medium">Connecting to Agent</p>
          <p className="text-[10px] text-muted-foreground">Please wait…</p>
        </div>
      </div>
      <Button variant="ghost" size="icon"><X className="w-4 h-4" /></Button>
    </div>
    <div className="p-6 text-center space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-accent mx-auto" />
      <p className="font-serif text-xl font-semibold">
        {noStaff ? "No Agents Available" : "Waiting for an agent…"}
      </p>
      <p className="text-sm text-muted-foreground">
        {noStaff
          ? "All support agents are currently offline. Your request has been queued and an agent will connect as soon as one is available."
          : "You'll be connected with the next available support agent. This usually takes under a minute."
        }
      </p>
      {noStaff && (
        <div className="bg-secondary/50 rounded-md p-3 text-xs text-muted-foreground">
          <p>Session status: escalation_pending</p>
          <p>No staff with isAvailable=true</p>
        </div>
      )}
      <p className="text-[10px] text-muted-foreground">Triggered by: chat:request_human or AI auto-escalation</p>
      <p className="text-[10px] text-muted-foreground">Listening for: chat:assigned</p>
    </div>
  </div>
);

/* Screen 4: Live Agent */
const LiveAgent = () => (
  <div className="bg-card border border-border rounded-lg overflow-hidden max-w-md shadow-lg">
    <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-success/5">
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-xs font-semibold">SM</div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-card" />
        </div>
        <div>
          <p className="text-sm font-medium">Sophie Miller</p>
          <p className="text-[10px] text-success">Connected • Agent</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon"><X className="w-4 h-4" /></Button>
      </div>
    </div>
    <div className="p-4 space-y-3 min-h-[300px]">
      <Bubble sender="" type="system" msg="You are now connected with Sophie Miller" />
      <Bubble sender="Sophie M." type="staff" msg="Hi! I can see you were asking about order #38291. Let me pull up the details." time="2:34 PM" />
      <Bubble sender="You" type="customer" msg="Yes, I was wondering when it will ship." time="2:34 PM" />
      <Bubble sender="Sophie M." type="staff" msg="Your order is being packed right now and will ship today with express delivery. I'll make sure you get tracking info shortly." time="2:35 PM" />
      <Bubble sender="You" type="customer" msg="Thank you so much! 🙏" time="2:35 PM" />
      <Typing name="Sophie M." icon={Headphones} />
    </div>
    <div className="border-t border-border p-3 flex items-center gap-2">
      <Button variant="ghost" size="icon"><Paperclip className="w-4 h-4" /></Button>
      <Input placeholder="Type a message…" className="flex-1" />
      <Button size="icon"><Send className="w-4 h-4" /></Button>
    </div>
  </div>
);

/* Screen 5: Reassigning */
const ReassigningState = () => (
  <div className="bg-card border border-border rounded-lg overflow-hidden max-w-md shadow-lg">
    <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-warning/5">
      <div className="flex items-center gap-2">
        <RefreshCw className="w-5 h-5 text-warning animate-spin" />
        <div>
          <p className="text-sm font-medium">Reassigning…</p>
          <p className="text-[10px] text-muted-foreground">Finding a new agent</p>
        </div>
      </div>
    </div>
    <div className="p-4 space-y-3">
      <Bubble sender="" type="system" msg="Sophie Miller has disconnected. Finding a new agent…" />
      <div className="text-center py-4 space-y-2">
        <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
        <p className="text-sm text-muted-foreground">Your conversation is being transferred.</p>
        <p className="text-[10px] text-muted-foreground">Triggered by: chat:reassigning event</p>
        <p className="text-[10px] text-muted-foreground">Cause: heartbeat timeout or agent disconnect</p>
      </div>
    </div>
  </div>
);

/* Screen 6: Chat Closed */
const ChatClosed = () => (
  <div className="bg-card border border-border rounded-lg overflow-hidden max-w-md shadow-lg">
    <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted">
      <p className="text-sm font-medium text-muted-foreground">Conversation Ended</p>
    </div>
    <div className="p-6 text-center space-y-4">
      <CheckCircle className="w-10 h-10 text-success mx-auto" />
      <p className="font-serif text-xl font-semibold">Chat Closed</p>
      <p className="text-sm text-muted-foreground">This conversation has ended. Thank you for contacting MAISON support.</p>
      <div className="bg-secondary/50 rounded-md p-3 text-xs text-muted-foreground">
        <p>Triggered by: chat:closed event or POST /api/v1/chat/session/:id/close</p>
        <p>Closed sessions cannot receive new messages.</p>
      </div>
      <Button className="w-full">Start New Conversation</Button>
      <p className="text-[10px] text-muted-foreground">New chat:init → creates new session</p>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════
   STAFF SCREENS
   ═══════════════════════════════════════════════════ */

/* Screen 7: Staff Dashboard */
const StaffDashboard = () => (
  <div className="bg-card border border-border rounded-lg shadow-sm">
    <div className="border-b border-border px-6 py-4 flex items-center justify-between">
      <div>
        <p className="font-serif text-xl font-semibold">Support Dashboard</p>
        <p className="text-xs text-muted-foreground">Staff view — manage active conversations</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch id="avail" defaultChecked />
          <Label htmlFor="avail" className="text-sm">Available</Label>
        </div>
        <Badge className="bg-success text-success-foreground">Online</Badge>
      </div>
    </div>

    <div className="grid grid-cols-4 gap-4 p-6">
      {[
        { label: "Active", value: "3", color: "text-info" },
        { label: "Waiting", value: "2", color: "text-warning" },
        { label: "Today", value: "12", color: "text-foreground" },
        { label: "Avg Time", value: "4m", color: "text-foreground" },
      ].map((s) => (
        <div key={s.label} className="bg-secondary/50 rounded-lg p-4 text-center">
          <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
        </div>
      ))}
    </div>

    <div className="px-6 pb-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Assigned Sessions (from GET /api/v1/chat/staff/workload)</p>
      <div className="space-y-2">
        {[
          { customer: "Jane Doe", subject: "Order #38291", time: "2m", status: "active" },
          { customer: "Mike Smith", subject: "Return request", time: "8m", status: "active" },
          { customer: "Sarah Lee", subject: "Size question", time: "1m", status: "waiting" },
        ].map((s) => (
          <div key={s.customer} className="flex items-center gap-3 bg-secondary/30 rounded-lg px-4 py-3 hover:bg-secondary/60 cursor-pointer transition-colors">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center"><User className="w-4 h-4 text-muted-foreground" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{s.customer}</p>
              <p className="text-xs text-muted-foreground truncate">{s.subject}</p>
            </div>
            <span className="text-xs text-muted-foreground">{s.time}</span>
            <Badge className={s.status === "active" ? "bg-success text-success-foreground text-[10px]" : "bg-warning text-warning-foreground text-[10px]"}>{s.status}</Badge>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* Screen 8: Availability Panel */
const AvailabilityPanel = () => (
  <div className="bg-card border border-border rounded-lg p-6 max-w-sm shadow-sm">
    <p className="font-serif text-lg font-semibold mb-4">Availability Settings</p>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="font-medium">Accept New Chats</Label>
        <Switch defaultChecked />
      </div>
      <p className="text-xs text-muted-foreground">POST /api/v1/chat/staff/availability {"{ isAvailable: true/false }"}</p>
      <p className="text-xs text-muted-foreground">Also emits staff:availability via WebSocket</p>
      <Separator />
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Connection Status</p>
        <div className="flex items-center gap-2 text-sm text-success"><Wifi className="w-4 h-4" /> WebSocket Connected</div>
        <p className="text-xs text-muted-foreground">ws:heartbeat sent every 30s to maintain connection</p>
      </div>
      <Separator />
      <div className="bg-secondary/50 rounded-md p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground mb-1">⚠ Important:</p>
        <p>Being connected ≠ being available.</p>
        <p>Must explicitly set isAvailable=true to receive assignments.</p>
      </div>
    </div>
  </div>
);

/* Screen 9: Staff Conversation */
const StaffConversation = () => (
  <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-xs font-semibold">JD</div>
        <div>
          <p className="text-sm font-medium">Jane Doe</p>
          <p className="text-[10px] text-muted-foreground">Session: abc-123 · Assigned to you</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">View History</Button>
        <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/5">Close Chat</Button>
      </div>
    </div>
    <div className="p-4 space-y-3 min-h-[300px]">
      <Bubble sender="" type="system" msg="Session started · AI handled initial conversation" />
      <Bubble sender="AI (history)" type="ai" msg="Hello! I can see your order #38291. It's being processed." time="2:30 PM" />
      <Bubble sender="Jane" type="customer" msg="I'd like to speak to a person please." time="2:32 PM" />
      <Bubble sender="" type="system" msg="Session assigned to you" />
      <Bubble sender="You" type="staff" msg="Hi Jane! I'm here to help. Let me look into your order right away." time="2:34 PM" />
      <Bubble sender="Jane" type="customer" msg="Thank you!" time="2:35 PM" />
    </div>
    <div className="border-t border-border p-3 flex items-center gap-2">
      <Button variant="ghost" size="icon"><Paperclip className="w-4 h-4" /></Button>
      <Input placeholder="Type a reply…" className="flex-1" />
      <Button size="icon"><Send className="w-4 h-4" /></Button>
    </div>
    <div className="border-t border-border px-4 py-2 text-[10px] text-muted-foreground flex items-center justify-between">
      <span>Staff emits: chat:send {"{ sessionUuid, content }"}</span>
      <span>Staff can: chat:close {"{ sessionUuid }"}</span>
    </div>
  </div>
);

/* Screen 10: Reassignment Notification */
const StaffReassignNotice = () => (
  <div className="bg-card border border-border rounded-lg p-6 max-w-md shadow-sm text-center space-y-4">
    <div className="w-14 h-14 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
      <PhoneOff className="w-7 h-7 text-warning" />
    </div>
    <p className="font-serif text-xl font-semibold">Session Reassigned</p>
    <p className="text-sm text-muted-foreground">Your session with Jane Doe has been reassigned to another agent due to connectivity issues.</p>
    <div className="bg-secondary/50 rounded-md p-3 text-xs text-muted-foreground space-y-1">
      <p>Triggered by: heartbeat timeout / disconnect</p>
      <p>Staff can no longer access this session's history</p>
      <p>(GET /history returns 403 for non-assigned staff)</p>
    </div>
    <Button variant="outline" className="w-full">Return to Dashboard</Button>
  </div>
);

/* ═══════════════════════════════════════════════════
   MAIN CHAT SHOWCASE
   ═══════════════════════════════════════════════════ */
const ChatShowcase = () => (
  <div className="min-h-screen bg-background">
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Chat UI Showcase</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Feature 3 — AI Chat + Human Handoff + Staff Workflow</p>
        </div>
        <a href="/" className="text-sm text-accent hover:underline flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Back</a>
      </div>
    </header>

    <main className="max-w-7xl mx-auto px-8 py-8 space-y-16">

      {/* INVENTORY */}
      <section>
        <h2 className="font-serif text-3xl font-semibold mb-4">Section 1: Screen Inventory</h2>
        <SpecTable headers={["#", "Screen", "Role", "REST API", "WS Emits", "WS Listens"]} rows={[
          ["1", "Chat Launcher", "Customer", "GET /chat/session/active", "chat:init", "ws:connected, chat:initialized"],
          ["2", "AI Chat", "Customer", "—", "chat:send", "chat:new_message, chat:ai_token, chat:ai_message_complete"],
          ["3", "Handoff Waiting", "Customer", "POST /chat/session/:id/request-human", "chat:request_human", "chat:assigned"],
          ["4", "Live Agent", "Customer", "—", "chat:send", "chat:new_message, chat:closed"],
          ["5", "Reassigning", "Customer", "—", "—", "chat:reassigning, chat:assigned"],
          ["6", "Chat Closed", "Customer", "—", "—", "chat:closed"],
          ["7", "Staff Dashboard", "Staff", "GET /chat/staff/workload", "chat:init {sessionUuid}", "ws:connected, chat:assigned"],
          ["8", "Availability", "Staff", "POST /chat/staff/availability", "staff:availability", "staff:availability_updated"],
          ["9", "Conversation", "Staff", "GET /chat/session/:id/history", "chat:send, chat:close", "chat:new_message, chat:closed"],
          ["10", "Reassign Notice", "Staff", "—", "—", "chat:reassigning"],
        ]} />
      </section>

      {/* CUSTOMER SCREENS */}
      <section>
        <h2 className="font-serif text-3xl font-semibold mb-6">Section 2: Customer Screens</h2>

        <div className="mb-12">
          <h3 className="font-serif text-2xl font-semibold mb-4">Screen 1: Chat Launcher</h3>
          <ChatLauncher />
        </div>

        <div className="mb-12">
          <h3 className="font-serif text-2xl font-semibold mb-4">Screen 2: AI Chat</h3>
          <Tabs defaultValue="normal">
            <TabsList className="bg-secondary mb-4">
              <TabsTrigger value="normal">Normal</TabsTrigger>
              <TabsTrigger value="streaming">AI Streaming</TabsTrigger>
            </TabsList>
            <TabsContent value="normal"><ChatAIMode /></TabsContent>
            <TabsContent value="streaming"><ChatAIMode streaming /></TabsContent>
          </Tabs>
        </div>

        <div className="mb-12">
          <h3 className="font-serif text-2xl font-semibold mb-4">Screen 3: Handoff Waiting</h3>
          <Tabs defaultValue="waiting">
            <TabsList className="bg-secondary mb-4">
              <TabsTrigger value="waiting">Waiting</TabsTrigger>
              <TabsTrigger value="no-staff">No Staff Available</TabsTrigger>
            </TabsList>
            <TabsContent value="waiting"><HandoffWaiting /></TabsContent>
            <TabsContent value="no-staff"><HandoffWaiting noStaff /></TabsContent>
          </Tabs>
        </div>

        <div className="mb-12">
          <h3 className="font-serif text-2xl font-semibold mb-4">Screen 4: Live Agent Connected</h3>
          <LiveAgent />
        </div>

        <div className="mb-12 grid grid-cols-2 gap-8">
          <div>
            <h3 className="font-serif text-2xl font-semibold mb-4">Screen 5: Reassigning</h3>
            <ReassigningState />
          </div>
          <div>
            <h3 className="font-serif text-2xl font-semibold mb-4">Screen 6: Chat Closed</h3>
            <ChatClosed />
          </div>
        </div>
      </section>

      {/* STAFF SCREENS */}
      <section>
        <h2 className="font-serif text-3xl font-semibold mb-6">Section 3: Staff Screens</h2>

        <div className="mb-12">
          <h3 className="font-serif text-2xl font-semibold mb-4">Screen 7: Support Dashboard</h3>
          <StaffDashboard />
        </div>

        <div className="mb-12 grid grid-cols-2 gap-8">
          <div>
            <h3 className="font-serif text-2xl font-semibold mb-4">Screen 8: Availability Panel</h3>
            <AvailabilityPanel />
          </div>
          <div>
            <h3 className="font-serif text-2xl font-semibold mb-4">Screen 10: Reassignment Notice</h3>
            <StaffReassignNotice />
          </div>
        </div>

        <div className="mb-12">
          <h3 className="font-serif text-2xl font-semibold mb-4">Screen 9: Assigned Conversation</h3>
          <StaffConversation />
        </div>
      </section>

      {/* EVENT MATRIX */}
      <section>
        <h2 className="font-serif text-3xl font-semibold mb-4">Section 4: WebSocket Event Matrix</h2>
        <SpecTable headers={["Event", "Direction", "Screen", "Payload", "UX Effect"]} rows={[
          ["chat:init", "Client → Server", "Launcher", "{ } or { sessionUuid }", "Opens/restores session"],
          ["ws:connected", "Server → Client", "All", "{ userId }", "Connection indicator green"],
          ["chat:initialized", "Server → Client", "Launcher → Chat", "{ sessionUuid }", "Transition to chat view"],
          ["chat:send", "Client → Server", "Chat", "{ sessionUuid, content }", "Show sent bubble"],
          ["chat:new_message", "Server → Client", "Chat", "{ message }", "Render new bubble"],
          ["chat:ai_token", "Server → Client", "AI Chat", "{ token }", "Append streaming token"],
          ["chat:ai_message_complete", "Server → Client", "AI Chat", "{ message }", "Finalize AI bubble"],
          ["chat:request_human", "Client → Server", "Chat", "{ sessionUuid, reason? }", "Show waiting state"],
          ["chat:assigned", "Server → Client", "Waiting", "{ staffName }", "Show agent connected"],
          ["chat:reassigning", "Server → Client", "Agent Chat", "{ reason }", "Show reassigning state"],
          ["chat:close", "Client → Server", "Chat", "{ sessionUuid }", "Show closed state"],
          ["chat:closed", "Server → Client", "Chat", "{ }", "Disable input, show closed"],
          ["staff:availability", "Client → Server", "Staff Panel", "{ isAvailable }", "Toggle availability"],
          ["staff:availability_updated", "Server → Client", "Staff", "{ isAvailable }", "Confirm toggle"],
          ["ws:heartbeat", "Client → Server", "Staff (bg)", "{ }", "Keep session alive (30s interval)"],
        ]} />
      </section>

      {/* FLOW */}
      <section>
        <h2 className="font-serif text-3xl font-semibold mb-4">Section 5: End-to-End Flow</h2>
        <div className="bg-card border border-border rounded-lg p-6 font-mono text-xs text-muted-foreground whitespace-pre-wrap">
{`CUSTOMER FLOW:
Chat Launcher (FAB)
  └─ WS connect + chat:init → ws:connected → chat:initialized { sessionUuid }
      └─ AI Chat Mode
          ├─ chat:send { content } → chat:ai_token (streaming) → chat:ai_message_complete
          ├─ "Talk to human" → chat:request_human { reason? }
          │   └─ Handoff Waiting
          │       ├─ chat:assigned { staffName } → Live Agent Mode
          │       │   ├─ chat:send / chat:new_message (bidirectional)
          │       │   ├─ chat:reassigning → Reassigning State
          │       │   │   └─ chat:assigned → New Agent Connected
          │       │   └─ chat:close / chat:closed → Chat Closed
          │       └─ No staff available → escalation_pending (wait indefinitely)
          └─ AI auto-escalates (low confidence) → same handoff flow

STAFF FLOW:
WS connect → ws:connected
  └─ staff:availability { isAvailable: true }
      └─ Dashboard (GET /chat/staff/workload)
          └─ Click session → chat:init { sessionUuid }
              └─ GET /chat/session/:id/history → Conversation Room
                  ├─ chat:send / chat:new_message
                  ├─ chat:close → chat:closed → Back to dashboard
                  └─ Disconnect/heartbeat timeout → chat:reassigning → Reassign Notice

EDGE CASES:
- Unauthorized WS connect → reject, show "Session expired" → redirect to login
- Staff access non-assigned session history → 403 → "Access denied"  
- Closed session + chat:send → rejected → "Session ended" notice
- Staff disconnect without close → heartbeat expires → auto-reassign`}
        </div>
      </section>

      {/* STATE MATRIX */}
      <section>
        <h2 className="font-serif text-3xl font-semibold mb-4">Section 6: State Matrix</h2>
        <SpecTable headers={["State", "Customer UX", "Staff UX"]} rows={[
          ["Loading", "Connecting spinner", "Dashboard skeleton"],
          ["AI Active", "Chat with streaming responses", "—"],
          ["Waiting", "Loader + queue message", "New session in list"],
          ["Assigned", "Agent name shown, chat enabled", "Session opened, input enabled"],
          ["Reassigning", "Reassigning banner + loader", "Lost session notice"],
          ["Closed", "Disabled input, restart CTA", "Session removed from active list"],
          ["Error (WS)", "Reconnecting banner", "Reconnecting banner"],
          ["Forbidden", "— (handled at auth layer)", "403 → access denied toast"],
          ["No Staff", "Queue message, extended wait", "— (all offline)"],
        ]} />
      </section>

      {/* HANDOFF */}
      <section>
        <h2 className="font-serif text-3xl font-semibold mb-4">Section 7: Next.js Handoff</h2>
        <div className="grid grid-cols-2 gap-6">
          <SpecTable headers={["Route", "Component", "Role Guard"]} rows={[
            ["/support", "ChatWidget (customer)", "Authenticated customer"],
            ["/staff/dashboard", "StaffDashboard", "Staff role only"],
            ["/staff/chat/:sessionUuid", "StaffConversation", "Staff + assigned only"],
          ]} />
          <div className="bg-card border border-border rounded-lg p-4 text-sm space-y-3">
            <p className="font-semibold">Socket Integration</p>
            <p className="text-xs text-muted-foreground">Use a shared useSocket() hook with token from auth context.</p>
            <p className="text-xs text-muted-foreground">Token sent via: auth.token / Authorization header / query param.</p>
            <p className="text-xs text-muted-foreground">Auto-reconnect on disconnect with exponential backoff.</p>
            <p className="font-semibold mt-2">Role Guards</p>
            <p className="text-xs text-muted-foreground">Customer: can only access own sessions.</p>
            <p className="text-xs text-muted-foreground">Staff: can only access assigned sessions.</p>
            <p className="text-xs text-muted-foreground">Staff chat:init requires sessionUuid (from workload list).</p>
          </div>
        </div>
      </section>

      {/* COMPLIANCE */}
      <section>
        <h2 className="font-serif text-3xl font-semibold mb-4">Section 8: Constraint Compliance</h2>
        <div className="bg-card border border-border rounded-lg p-6 space-y-2">
          {[
            "Only uses listed REST endpoints: /session/active, /session/:id/history, /session/:id/request-human, /session/:id/close, /staff/availability, /staff/workload",
            "Only uses listed WS events: chat:init, chat:send, chat:request_human, chat:close, staff:availability, ws:heartbeat (emits) + all server events",
            "No invented payload fields — exact match to contract",
            "Customer chat:init has no sessionUuid; Staff chat:init requires sessionUuid",
            "Staff connected ≠ available — explicit availability toggle shown",
            "AI auto-escalation and explicit human request both handled",
            "No staff available → escalation_pending state with queue message",
            "Heartbeat/disconnect → reassignment flow shown for both roles",
            "Closed sessions prevent further messages — disabled input + CTA",
            "History access denial (403) for non-owner/non-assigned — handled in staff screens",
            "Streaming tokens (chat:ai_token) with cursor fallback shown",
            "Desktop web only — no mobile variants",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" /><span>{item}</span>
            </div>
          ))}
        </div>
      </section>

    </main>
  </div>
);

export default ChatShowcase;
