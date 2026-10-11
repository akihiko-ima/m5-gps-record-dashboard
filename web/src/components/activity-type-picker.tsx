"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ACTIVITY_TYPE_META, ACTIVITY_TYPES, type ActivityType } from "@/lib/activity-type";

import { ActivityIcon } from "./activity-badge";

/** 走行種別の選択（未選択は空文字） */
export function ActivityTypePicker({
  value,
  onChange,
  disabled,
}: {
  value: ActivityType | "";
  onChange: (value: ActivityType | "") => void;
  disabled?: boolean;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value}
      onValueChange={(v) => onChange(v as ActivityType | "")}
      disabled={disabled}
      aria-label="走行種別"
      className="w-full"
    >
      {ACTIVITY_TYPES.map((type) => (
        <ToggleGroupItem
          key={type}
          value={type}
          className="flex-1 gap-2 data-[state=on]:text-white"
          style={value === type ? { backgroundColor: ACTIVITY_TYPE_META[type].color } : undefined}
        >
          <ActivityIcon type={type} />
          {ACTIVITY_TYPE_META[type].label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
