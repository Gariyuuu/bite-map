"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createSharedSpace, joinSharedSpace } from "@/lib/actions/shared-space";

export function CreateOrJoinSpace() {
  const router = useRouter();
  const [name, setName] = useState("Our Food Map");
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();

  function create() {
    startTransition(async () => {
      try {
        await createSharedSpace(name);
        toast.success("Shared food map created");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't create a shared space");
      }
    });
  }

  function join() {
    startTransition(async () => {
      try {
        await joinSharedSpace(code);
        toast.success("Joined shared food map");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't join with that code");
      }
    });
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-4">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Our Food Map</h1>
        <p className="text-sm text-muted-foreground">Track restaurants, wishlist, and food dates together.</p>
      </div>

      <Card className="space-y-3 p-4">
        <p className="text-sm font-medium">Start a shared food map</p>
        <div className="space-y-1.5">
          <Label htmlFor="space-name">Name</Label>
          <Input id="space-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Button onClick={create} disabled={pending} className="w-full">
          Create
        </Button>
      </Card>

      <div className="text-center text-xs text-muted-foreground">or</div>

      <Card className="space-y-3 p-4">
        <p className="text-sm font-medium">Join your partner&apos;s food map</p>
        <div className="space-y-1.5">
          <Label htmlFor="invite-code">Invite code</Label>
          <Input id="invite-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABC123" />
        </div>
        <Button onClick={join} disabled={pending || code.length < 4} variant="outline" className="w-full">
          Join
        </Button>
      </Card>
    </div>
  );
}
