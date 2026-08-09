import { notFound } from "next/navigation";
import { getJournalPageById } from "@/lib/queries/journal-pages";
import { getCurrentUserId } from "@/lib/auth";
import { BoardEditor } from "@/components/photo-journal/board-editor";

export default async function PhotoJournalBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [page, userId] = await Promise.all([getJournalPageById(id), getCurrentUserId()]);

  if (!page) notFound();

  return (
    <BoardEditor
      pageId={page.id}
      initialTitle={page.title ?? "Untitled board"}
      initialElements={page.elements}
      ownedByCurrentUser={page.userId === userId}
    />
  );
}
