"use client";

import { useRef, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Eye, Pencil } from "lucide-react";
import { BoardCanvas } from "./board-canvas";
import { AddElementToolbar } from "./add-element-toolbar";
import { ExportBoardButton } from "./export-board-button";
import { updateJournalPage, deleteJournalPage } from "@/lib/actions/journal-pages";
import type { BoardElement } from "@/types/photo-journal";

export function BoardEditor({
  pageId,
  initialTitle,
  initialElements,
  ownedByCurrentUser,
}: {
  pageId: string;
  initialTitle: string;
  initialElements: BoardElement[];
  ownedByCurrentUser: boolean;
}) {
  const router = useRouter();
  const boardRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(initialTitle);
  const [elements, setElements] = useState<BoardElement[]>(initialElements);
  const [editing, setEditing] = useState(ownedByCurrentUser && initialElements.length === 0);
  const [pending, startTransition] = useTransition();

  const addElement = useCallback((el: BoardElement) => setElements((prev) => [...prev, el]), []);
  const updateElement = useCallback(
    (id: string, patch: Partial<BoardElement>) =>
      setElements((prev) => prev.map((e) => (e.id === id ? ({ ...e, ...patch } as BoardElement) : e))),
    []
  );
  const removeElement = useCallback((id: string) => setElements((prev) => prev.filter((e) => e.id !== id)), []);

  function save() {
    startTransition(async () => {
      try {
        await updateJournalPage(pageId, title, elements);
        toast.success("Board saved");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't save this board");
      }
    });
  }

  function remove() {
    startTransition(async () => {
      try {
        await deleteJournalPage(pageId);
        router.push("/photo-journal");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't delete this board");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="flex items-center gap-2">
        {editing ? (
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="font-serif text-lg" />
        ) : (
          <h1 className="font-serif text-2xl font-semibold">{title}</h1>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <ExportBoardButton boardRef={boardRef} filename={title.toLowerCase().replace(/\s+/g, "-") || "board"} />
          {ownedByCurrentUser && (
            <>
              <Button variant="outline" size="icon" onClick={() => setEditing((e) => !e)} aria-label="Toggle edit mode">
                {editing ? <Eye className="size-4" /> : <Pencil className="size-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={remove} disabled={pending} aria-label="Delete board">
                <Trash2 className="size-4" />
              </Button>
              <Button onClick={save} disabled={pending}>
                {pending ? "Saving..." : "Save"}
              </Button>
            </>
          )}
        </div>
      </div>

      <BoardCanvas boardRef={boardRef} elements={elements} editable={editing} onUpdate={updateElement} onDelete={removeElement} />

      {editing && <AddElementToolbar elementCount={elements.length} onAdd={addElement} />}
    </div>
  );
}
