"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const EXAMPLE_PROMPTS = [
  "Where should we eat tonight?",
  "Best Japanese place within 10 miles?",
  "Find somewhere cute for a date under $70",
  "What should I order at this restaurant?",
  "Show restaurants I haven't tried yet",
  "What's overrated around me?",
];

export function YuuChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey — I'm YUU, your food concierge. Ask me where to eat, what to order, or build you a food crawl.",
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || pending) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setPending(true);

    try {
      const res = await fetch("/api/ai-guide/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong reaching YUU." }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-3 md:h-[calc(100vh-8rem)]">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border bg-card p-4">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                m.role === "user" ? "bg-accent text-accent-foreground" : "bg-muted text-foreground"
              )}
            >
              {m.role === "assistant" && (
                <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-accent">
                  <Sparkles className="size-3" /> YUU
                </span>
              )}
              {m.content}
            </div>
          </div>
        ))}
        {pending && <p className="text-xs text-muted-foreground">YUU is thinking...</p>}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {EXAMPLE_PROMPTS.map((p) => (
          <Badge key={p} variant="outline" className="cursor-pointer text-xs" onClick={() => send(p)}>
            {p}
          </Badge>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask YUU where to eat..."
          disabled={pending}
        />
        <Button type="submit" disabled={pending || !input.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
