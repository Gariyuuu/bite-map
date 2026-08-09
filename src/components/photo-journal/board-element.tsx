"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, MapPin, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BoardElement } from "@/types/photo-journal";

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

interface Props {
  element: BoardElement;
  editable: boolean;
  boardRef: React.RefObject<HTMLDivElement | null>;
  onUpdate: (id: string, patch: Partial<BoardElement>) => void;
  onDelete: (id: string) => void;
}

export function BoardElementView({ element, editable, boardRef, onUpdate, onDelete }: Props) {
  const dragState = useRef<{ startX: number; startY: number; elX: number; elY: number } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    if (!editable) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, elX: element.x, elY: element.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragState.current || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const dxPct = ((e.clientX - dragState.current.startX) / rect.width) * 100;
    const dyPct = ((e.clientY - dragState.current.startY) / rect.height) * 100;
    onUpdate(element.id, {
      x: clamp(dragState.current.elX + dxPct, 0, 100 - element.width),
      y: clamp(dragState.current.elY + dyPct, 0, 100 - element.height),
    });
  }

  function onPointerUp() {
    dragState.current = null;
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        left: `${element.x}%`,
        top: `${element.y}%`,
        width: `${element.width}%`,
        height: `${element.height}%`,
        transform: `rotate(${element.rotation}deg)`,
        zIndex: element.z,
        touchAction: editable ? "none" : undefined,
      }}
      className={cn("group absolute", editable && "cursor-move select-none")}
    >
      {editable && (
        <button
          onClick={() => onDelete(element.id)}
          className="absolute -right-2 -top-2 z-10 hidden size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow group-hover:flex"
          aria-label="Remove element"
        >
          <X className="size-3" />
        </button>
      )}
      <ElementContent element={element} />
    </div>
  );
}

function ElementContent({ element }: { element: BoardElement }) {
  switch (element.type) {
    case "photo":
      return (
        <div className="relative h-full w-full overflow-hidden rounded-lg border-4 border-white shadow-lg dark:border-neutral-800">
          <Image src={element.photoUrl} alt={element.caption ?? "Food photo"} fill className="object-cover" />
          {element.caption && (
            <span className="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-1 text-center text-xs text-white">
              {element.caption}
            </span>
          )}
        </div>
      );
    case "caption":
      return (
        <div className="flex h-full w-full items-center justify-center rounded-lg bg-transparent p-1 text-center font-serif text-lg italic leading-tight text-foreground">
          {element.text}
        </div>
      );
    case "restaurant-card":
      return (
        <Link
          href={`/restaurant/${encodeURIComponent(element.restaurantId)}`}
          className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-md"
        >
          <div className="relative h-2/3 w-full bg-muted">
            {element.photoUrl && <Image src={element.photoUrl} alt={element.restaurantName} fill className="object-cover" />}
          </div>
          <div className="flex flex-1 flex-col justify-center gap-0.5 px-2">
            <p className="truncate text-xs font-semibold">{element.restaurantName}</p>
            {element.cuisine && (
              <p className="flex items-center gap-0.5 truncate text-[10px] text-muted-foreground">
                <MapPin className="size-2.5" />
                {element.cuisine}
              </p>
            )}
          </div>
        </Link>
      );
    case "date-stamp":
      return (
        <div className="flex h-full w-full items-center justify-center gap-1.5 rounded-full bg-accent/15 px-2 text-xs font-medium text-foreground">
          <CalendarDays className="size-3" />
          {new Date(element.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
      );
  }
}
