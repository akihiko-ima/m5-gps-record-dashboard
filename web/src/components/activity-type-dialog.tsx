"use client";

import { useState } from "react";
import { toast } from "sonner";

import { updateActivityType } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ACTIVITY_TYPE_META, type ActivityType } from "@/lib/activity-type";
import { formatDateTime } from "@/lib/format";
import type { TrackSummary } from "@/lib/track/types";

import { ActivityTypePicker } from "./activity-type-picker";

export function ActivityTypeDialog({
  track,
  open,
  onOpenChange,
}: {
  track: TrackSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [value, setValue] = useState<ActivityType | "">(track.activityType);
  const [saving, setSaving] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (saving) return;
    if (next) setValue(track.activityType);
    onOpenChange(next);
  };

  const handleSave = async () => {
    if (!value || value === track.activityType) return;
    setSaving(true);
    const result = await updateActivityType(track.id, value).catch(() => undefined);
    setSaving(false);
    if (result?.ok) {
      toast.success(`走行種別を${ACTIVITY_TYPE_META[value].label}に変更しました`);
      onOpenChange(false);
    } else {
      toast.error(result?.message ?? "走行種別の変更に失敗しました");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>走行種別を変更</DialogTitle>
          <DialogDescription>{formatDateTime(track.startedAt)} のトラック</DialogDescription>
        </DialogHeader>
        <ActivityTypePicker value={value} onChange={setValue} disabled={saving} />
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={!value || value === track.activityType || saving}>
            {saving ? "保存中…" : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
