"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function InviteCodeBadge({ code }: { code: string }) {
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(code);
        toast.success("Invite code copied");
      }}
      className="inline-flex"
    >
      <Badge variant="outline" className="cursor-pointer gap-1.5 font-mono">
        <Copy className="size-3" />
        {code}
      </Badge>
    </button>
  );
}
