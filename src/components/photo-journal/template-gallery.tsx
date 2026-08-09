"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { createJournalPage } from "@/lib/actions/journal-pages";
import { PHOTO_JOURNAL_TEMPLATES } from "@/types/photo-journal";

export function TemplateGallery() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function pick(template: string) {
    startTransition(async () => {
      try {
        const pageId = await createJournalPage(template);
        router.push(`/photo-journal/${pageId}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't start a new board");
      }
    });
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {PHOTO_JOURNAL_TEMPLATES.map((t) => (
        <Card
          key={t}
          role="button"
          aria-disabled={pending}
          onClick={() => !pending && pick(t)}
          className="flex h-28 w-40 shrink-0 cursor-pointer select-none flex-col items-center justify-center gap-1 border-dashed p-3 text-center transition-colors hover:border-accent hover:bg-accent/5"
        >
          <span className="text-sm font-medium">{t}</span>
          <span className="text-[11px] text-muted-foreground">New board</span>
        </Card>
      ))}
    </div>
  );
}
