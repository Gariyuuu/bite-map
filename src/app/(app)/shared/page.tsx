import { getCurrentUserId } from "@/lib/auth";
import { getUserSharedSpace } from "@/lib/queries/shared-space";
import { DATABASE_ENABLED } from "@/db";
import { Card } from "@/components/ui/card";
import { CreateOrJoinSpace } from "@/components/shared/create-or-join-space";
import { InviteCodeBadge } from "@/components/shared/invite-code-badge";
import { WishlistAddDialog } from "@/components/shared/wishlist-add-dialog";
import { WishlistItemCard } from "@/components/shared/wishlist-item-card";
import { WishlistRandomizer } from "@/components/shared/wishlist-randomizer";

export default async function SharedSpacePage() {
  const userId = await getCurrentUserId();

  if (!DATABASE_ENABLED) {
    return (
      <Card className="mx-auto mt-8 max-w-md border-dashed p-6 text-center text-sm text-muted-foreground">
        Connect DATABASE_URL to unlock Our Food Map — shared visit stats, wishlist, and food-date planning with a
        partner.
      </Card>
    );
  }

  const space = await getUserSharedSpace(userId);

  if (!space) return <CreateOrJoinSpace />;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{space.name}</h1>
          <p className="text-sm text-muted-foreground">
            {space.members.map((m) => m.name).join(" & ")}
          </p>
        </div>
        <InviteCodeBadge code={space.inviteCode} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{space.stats.you}</p>
          <p className="text-xs text-muted-foreground">You Only</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{space.stats.together}</p>
          <p className="text-xs text-muted-foreground">Together</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{space.stats.partner}</p>
          <p className="text-xs text-muted-foreground">Partner Only</p>
        </Card>
      </div>

      <WishlistRandomizer items={space.wishlist} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Shared Wishlist ({space.wishlist.length})</h2>
          <WishlistAddDialog sharedSpaceId={space.id} />
        </div>
        {space.wishlist.length === 0 && (
          <Card className="border-dashed p-6 text-center text-sm text-muted-foreground">
            Nothing on the shared wishlist yet — add somewhere you both want to try.
          </Card>
        )}
        <div className="space-y-2">
          {space.wishlist.map((item) => (
            <WishlistItemCard key={item.id} item={item} currentUserId={userId} />
          ))}
        </div>
      </section>
    </div>
  );
}
