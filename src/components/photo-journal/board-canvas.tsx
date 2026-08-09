"use client";

import { cn } from "@/lib/utils";
import { BoardElementView } from "./board-element";
import type { BoardElement } from "@/types/photo-journal";
import type { RefObject } from "react";

interface Props {
  boardRef: RefObject<HTMLDivElement | null>;
  elements: BoardElement[];
  editable: boolean;
  onUpdate: (id: string, patch: Partial<BoardElement>) => void;
  onDelete: (id: string) => void;
}

export function BoardCanvas({ boardRef, elements, editable, onUpdate, onDelete }: Props) {
  return (
    <div
      ref={boardRef}
      className={cn(
        "relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-[var(--journal-accent)]/25 shadow-inner",
        "bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.02)_0px,rgba(0,0,0,0.02)_1px,transparent_1px,transparent_28px)]",
        "bg-card"
      )}
    >
      {elements.length === 0 && editable && (
        <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-muted-foreground">
          Empty board — add a photo, restaurant, caption, or date from the toolbar below.
        </p>
      )}
      {elements
        .slice()
        .sort((a, b) => a.z - b.z)
        .map((el) => (
          <BoardElementView key={el.id} element={el} editable={editable} boardRef={boardRef} onUpdate={onUpdate} onDelete={onDelete} />
        ))}
    </div>
  );
}
