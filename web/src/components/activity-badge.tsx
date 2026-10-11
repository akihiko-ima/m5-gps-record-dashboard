import { BikeIcon, MotorbikeIcon, type LucideIcon } from "lucide-react";

import { ACTIVITY_TYPE_META, type ActivityType } from "@/lib/activity-type";
import { cn } from "@/lib/utils";

const ICONS: Record<ActivityType, LucideIcon> = {
  motorcycle: MotorbikeIcon,
  bicycle: BikeIcon,
};

export function ActivityIcon({ type, className }: { type: ActivityType; className?: string }) {
  const Icon = ICONS[type];
  return <Icon className={cn("size-4", className)} aria-hidden />;
}

/** 走行種別のアイコン + 色付きバッジ（色は ACTIVITY_TYPE_META と共通） */
export function ActivityBadge({ type, className }: { type: ActivityType; className?: string }) {
  const { label, color } = ACTIVITY_TYPE_META[type];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white",
        className,
      )}
      style={{ backgroundColor: color }}
    >
      <ActivityIcon type={type} className="size-3.5" />
      {label}
    </span>
  );
}
