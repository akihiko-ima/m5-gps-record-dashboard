"use client";

import { PauseIcon, PlayIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { formatTimeWithSeconds } from "@/lib/format";
import { RECORD_INTERVAL_MS } from "@/lib/playback/timeline";

export const PLAYBACK_SPEEDS = [10, 60, 300, 600] as const;
export const DEFAULT_PLAYBACK_SPEED = 60;

export function PlaybackControls({
  startMs,
  endMs,
  currentMs,
  playing,
  speed,
  onTogglePlay,
  onSeek,
  onSpeedChange,
}: {
  startMs: number;
  endMs: number;
  currentMs: number;
  playing: boolean;
  speed: number;
  onTogglePlay: () => void;
  onSeek: (ms: number) => void;
  onSpeedChange: (speed: number) => void;
}) {
  const step = RECORD_INTERVAL_MS / 1000;
  // スライダーは目盛り（記録間隔）単位でしか値を取らないため、最大値を目盛りに切り上げる
  const maxSec = Math.ceil((endMs - startMs) / 1000 / step) * step;
  const currentSec = Math.min(maxSec, Math.floor((currentMs - startMs) / 1000 / step) * step);

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-t px-4 py-2">
      <Button size="icon" variant="outline" onClick={onTogglePlay} aria-label={playing ? "一時停止" : "再生"}>
        {playing ? <PauseIcon /> : <PlayIcon />}
      </Button>
      <Slider
        className="min-w-40 flex-1"
        min={0}
        max={maxSec}
        step={step}
        value={[currentSec]}
        onValueChange={([sec]) => onSeek(Math.min(endMs, startMs + sec * 1000))}
        aria-label="再生位置"
      />
      <span className="text-sm tabular-nums">
        {formatTimeWithSeconds(currentMs >= endMs ? endMs : startMs + currentSec * 1000)} / {formatTimeWithSeconds(endMs)}
      </span>
      <Select value={String(speed)} onValueChange={(v) => onSpeedChange(Number(v))}>
        <SelectTrigger size="sm" className="w-24" aria-label="再生速度">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PLAYBACK_SPEEDS.map((s) => (
            <SelectItem key={s} value={String(s)}>
              {s}x
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
