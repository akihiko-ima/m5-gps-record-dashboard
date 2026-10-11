export const ACTIVITY_TYPES = ["motorcycle", "bicycle"] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/** 走行種別ごとの表示名と色。色の定義はここだけに置き、ほかから参照する */
export const ACTIVITY_TYPE_META: Record<ActivityType, { label: string; color: string }> = {
  motorcycle: { label: "バイク", color: "#F97316" }, // orange-500
  bicycle: { label: "自転車", color: "#3B82F6" }, // blue-500
};

export function isActivityType(value: unknown): value is ActivityType {
  return typeof value === "string" && (ACTIVITY_TYPES as readonly string[]).includes(value);
}
