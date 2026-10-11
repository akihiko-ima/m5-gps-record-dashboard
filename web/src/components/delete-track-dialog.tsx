"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { deleteTrack } from "@/app/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDateTime } from "@/lib/format";
import type { TrackSummary } from "@/lib/track/types";

export function DeleteTrackDialog({
  track,
  isSelected,
  open,
  onOpenChange,
}: {
  track: TrackSummary;
  isSelected: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    setDeleting(true);
    const result = await deleteTrack(track.id).catch(() => undefined);
    setDeleting(false);
    if (result?.ok) {
      toast.success("トラックを削除しました");
      onOpenChange(false);
      if (isSelected) router.push("/", { scroll: false });
    } else {
      toast.error(result?.message ?? "削除に失敗しました");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => !deleting && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>トラックを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            {formatDateTime(track.startedAt)} のトラック（{track.originalFilename}
            ）を削除します。アップロードした CSV と変換済みデータも削除され、元に戻せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>キャンセル</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? "削除中…" : "削除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
