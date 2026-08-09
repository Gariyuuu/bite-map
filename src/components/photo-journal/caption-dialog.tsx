"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  initialText?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (text: string) => void;
}

export function CaptionDialog({ open, initialText, onOpenChange, onSubmit }: Props) {
  const [text, setText] = useState(initialText ?? "");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setText(initialText ?? "");
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add a caption</DialogTitle>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Best ramen we've had all year..."
          autoFocus
        />
        <DialogFooter>
          <Button
            disabled={!text.trim()}
            onClick={() => {
              onSubmit(text.trim());
              onOpenChange(false);
            }}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
