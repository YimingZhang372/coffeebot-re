import { useMemo } from "react";
import { useProgramme } from "@/lib/programmeData";
import { activityByKey } from "@/lib/programme";
import { cropFor } from "@/lib/photoCrop";

const SLOTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, null];

/** Tight grid of the latest Champion-validated reuses. */
export default function LoginGrid() {
  const { reuses } = useProgramme();

  const posts = useMemo(
    () =>
      reuses
        .filter((r) => r.status === "validated" && r.photoUrl)
        .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
        .slice(0, 9),
    [reuses]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="grid flex-1 grid-cols-3 gap-[6px]">
        {SLOTS.map((slot, i) => {
          const post = slot === null ? null : posts[slot];
          if (!post) {
            return <div key={`empty-${i}`} className="aspect-square border border-rule bg-canvas" />;
          }
          const crop = cropFor(post.refId).style;
          return (
            <figure key={post.id} className="group relative aspect-square overflow-hidden bg-[#D6D2CD]">
              <img
                src={post.photoUrl}
                alt={`${post.floorCode} ${activityByKey(post.activityKey).name}`}
                style={crop}
                className="h-full w-full object-cover grayscale opacity-75 transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:grayscale-0 group-hover:opacity-100"
              />
              <span className="pointer-events-none absolute left-1.5 top-1.5 bg-transparent px-1.5 py-0.5 text-[9px] uppercase tracking-[0.1em] text-transparent transition-colors duration-300 group-hover:bg-ink/85 group-hover:text-white">
                {post.floorCode} · {activityByKey(post.activityKey).name}
              </span>
            </figure>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-sub">
        <span>latest champion-validated reuses</span>
        <span>{posts.length} of {reuses.filter((r) => r.status === "validated").length}</span>
      </div>
    </div>
  );
}