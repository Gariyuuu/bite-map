import { YuuChat } from "@/components/ai/yuu-chat";

export default function AiGuidePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">AI Guide</h1>
        <p className="text-sm text-muted-foreground">
          YUU knows your visits, ratings, and preferences — ask for a recommendation.
        </p>
      </div>
      <YuuChat />
    </div>
  );
}
