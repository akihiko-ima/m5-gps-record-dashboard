"use client";

import { EllipsisIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TrackSummary } from "@/lib/track/types";
import { cn } from "@/lib/utils";

import { ActivityTypeDialog } from "./activity-type-dialog";
import { DeleteTrackDialog } from "./delete-track-dialog";

export function TrackRowMenu({
  track,
  isSelected,
  className,
}: {
  track: TrackSummary;
  isSelected: boolean;
  className?: string;
}) {
  const [dialog, setDialog] = useState<"activityType" | "delete" | null>(null);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="メニュー" className={cn(className)}>
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDialog("activityType")}>
            <PencilIcon />
            走行種別を変更
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDialog("delete")}>
            <Trash2Icon />
            削除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ActivityTypeDialog
        track={track}
        open={dialog === "activityType"}
        onOpenChange={(open) => setDialog(open ? "activityType" : null)}
      />
      <DeleteTrackDialog
        track={track}
        isSelected={isSelected}
        open={dialog === "delete"}
        onOpenChange={(open) => setDialog(open ? "delete" : null)}
      />
    </>
  );
}
