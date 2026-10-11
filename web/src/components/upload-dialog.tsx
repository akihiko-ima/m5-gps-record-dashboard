"use client";

import { FileTextIcon, UploadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { uploadTrack } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ACTIVITY_TYPE_META, type ActivityType } from "@/lib/activity-type";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

import { ActivityTypePicker } from "./activity-type-picker";

const MAX_BYTES = 10 * 1024 * 1024;

const formatSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)}KB` : `${(bytes / 1024 / 1024).toFixed(1)}MB`);

export function UploadDialog() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType | "">("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setActivityType("");
    setFiles([]);
  };

  const handleOpenChange = (next: boolean) => {
    if (uploading) return;
    setOpen(next);
    if (!next) reset();
  };

  const handleUpload = async () => {
    if (!activityType || files.length === 0) return;
    setUploading(true);
    let lastId: string | undefined;
    // 1 ファイルずつ順に処理し、結果を個別に通知する
    for (const file of files) {
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name}: ファイルサイズが 10MB を超えています`);
        continue;
      }
      const formData = new FormData();
      formData.set("file", file);
      formData.set("activityType", activityType);
      try {
        const result = await uploadTrack(formData);
        if (result.ok) {
          lastId = result.data.id;
          toast.success(
            `${file.name} を${ACTIVITY_TYPE_META[activityType].label}の走行として登録しました（${formatCount(result.data.pointCount)} 点）`,
          );
        } else {
          toast.error(`${file.name}: ${result.message}`);
        }
      } catch {
        toast.error(`${file.name}: アップロードに失敗しました`);
      }
    }
    setUploading(false);
    if (lastId) {
      setOpen(false);
      reset();
      router.push(`/?track=${lastId}`, { scroll: false });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UploadIcon />
          CSV アップロード
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>CSV アップロード</DialogTitle>
          <DialogDescription>M5 GPS レコーダーで記録した CSV を登録します。</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <p className="text-sm font-medium">
            走行種別<span className="text-destructive">（必須）</span>
          </p>
          <ActivityTypePicker value={activityType} onChange={setActivityType} disabled={uploading} />
        </div>

        <div className="grid gap-2">
          <p className="text-sm font-medium">
            ファイル<span className="text-destructive">（必須・複数可）</span>
          </p>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              setFiles(Array.from(e.dataTransfer.files));
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground transition-colors hover:bg-muted/50",
              dragging && "border-primary bg-muted",
            )}
          >
            <UploadIcon className="size-5" />
            <span>ここに CSV をドロップ</span>
            <span>
              または <span className="font-medium text-foreground underline">ファイルを選択</span>
            </span>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              multiple
              className="sr-only"
              disabled={uploading}
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
          </label>
          {files.length > 0 && (
            <ul className="grid gap-1 text-sm">
              {files.map((file) => (
                <li key={`${file.name}-${file.size}`} className="flex items-center gap-2">
                  <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{file.name}</span>
                  <span className="shrink-0 text-muted-foreground">({formatSize(file.size)})</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={uploading}>
            キャンセル
          </Button>
          <Button onClick={handleUpload} disabled={!activityType || files.length === 0 || uploading}>
            {uploading ? "アップロード中…" : "アップロード"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
