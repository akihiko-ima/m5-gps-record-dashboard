import { formatDateTime, formatDistance, formatDuration, formatSpeed, formatTime } from "@/lib/format";
import type { TrackSummary as Track } from "@/lib/track/types";

import { ActivityBadge } from "./activity-badge";

export function TrackSummary({ track }: { track: Track }) {
  const durationMs = Date.parse(track.endedAt) - Date.parse(track.startedAt);
  const avgSpeedKmh = durationMs > 0 ? track.distanceM / 1000 / (durationMs / 3_600_000) : null;
  const sameDay = formatDateTime(track.startedAt).slice(0, 10) === formatDateTime(track.endedAt).slice(0, 10);

  const items = [
    { label: "記録時間", value: formatDuration(durationMs) },
    { label: "距離", value: formatDistance(track.distanceM) },
    { label: "最高速度", value: formatSpeed(track.maxSpeedKmh) },
    { label: "平均速度", value: formatSpeed(avgSpeedKmh) },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b px-4 py-2 text-sm">
      <div className="flex items-center gap-2">
        <ActivityBadge type={track.activityType} />
        <span className="font-medium tabular-nums">
          {formatDateTime(track.startedAt)} 〜 {sameDay ? formatTime(track.endedAt) : formatDateTime(track.endedAt)}
        </span>
      </div>
      {items.map((item) => (
        <div key={item.label} className="flex items-baseline gap-1.5">
          <span className="text-xs text-muted-foreground">{item.label}</span>
          <span className="font-medium tabular-nums">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
