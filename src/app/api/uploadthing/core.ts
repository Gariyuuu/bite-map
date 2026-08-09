import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getCurrentUserId } from "@/lib/auth";

const f = createUploadthing();

/**
 * Upload routes for restaurant/journal photos (spec section 21, "Food Map
 * Photos"). Not yet wired into any UI — the Photo Journal editor (Phase 6)
 * is the first consumer. Exists now so adding UPLOADTHING_TOKEN later is a
 * drop-in, not a rebuild.
 */
export const uploadRouter = {
  restaurantPhoto: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => ({ userId: await getCurrentUserId() }))
    .onUploadComplete(async ({ metadata, file }) => {
      return { userId: metadata.userId, url: file.ufsUrl };
    }),
  journalPhoto: f({ image: { maxFileSize: "8MB", maxFileCount: 10 } })
    .middleware(async () => ({ userId: await getCurrentUserId() }))
    .onUploadComplete(async ({ metadata, file }) => {
      return { userId: metadata.userId, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
