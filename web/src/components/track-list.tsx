"use client";

import Link from "next/link";

import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCount, formatDateTime, formatDistance, formatDuration } from "@/lib/format";
import type { TrackSummary } from "@/lib/track/types";
import { cn } from "@/lib/utils";

import { ActivityBadge } from "./activity-badge";
import { TrackRowMenu } from "./track-row-menu";

export function TrackList({ tracks, selectedId }: { tracks: TrackSummary[]; selectedId: string | undefined }) {
  if (tracks.length === 0) {
    return (
      <p className="p-6 text-center text-sm text-muted-foreground">
        トラックがありません。CSV をアップロードしてください
      </p>
    );
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <ul className="divide-y">
        {tracks.map((track) => {
          const selected = track.id === selectedId;
          return (
            <li key={track.id} className={cn("group relative", selected && "bg-muted")}>
              {selected && <span className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden />}
              <Link
                href={`/?track=${track.id}`}
                scroll={false}
                aria-current={selected ? "true" : undefined}
                className="block py-3 pr-12 pl-4 transition-colors hover:bg-muted/60"
              >
                <div className="flex items-center gap-2">
                  <ActivityBadge type={track.activityType} />
                  <span className="text-sm font-medium tabular-nums">{formatDateTime(track.startedAt)}</span>
                </div>
                <div className="mt-1 flex gap-3 text-xs text-muted-foreground tabular-nums">
                  <span>{formatDuration(Date.parse(track.endedAt) - Date.parse(track.startedAt))}</span>
                  <span>{formatDistance(track.distanceM)}</span>
                  <span>{formatCount(track.pointCount)} 点</span>
                </div>
              </Link>
              <TrackRowMenu
                track={track}
                isSelected={selected}
                className="absolute top-1/2 right-2 -translate-y-1/2 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 md:data-[state=open]:opacity-100"
              />
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}
