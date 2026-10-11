"use client";

import { LocateFixedIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ACTIVITY_TYPE_META } from "@/lib/activity-type";
import { buildTimeline, RECORD_INTERVAL_MS, resolvePosition, type Timeline } from "@/lib/playback/timeline";
import type { TrackGeoJson, TrackSummary } from "@/lib/track/types";

import { DEFAULT_PLAYBACK_SPEED, PlaybackControls } from "./playback-controls";

function Placeholder({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 items-center justify-center bg-muted/40 text-sm text-muted-foreground">{children}</div>;
}

// Leaflet はブラウザ専用のため SSR しない
const TrackMap = dynamic(() => import("./track-map"), {
  ssr: false,
  loading: () => <Placeholder>地図を読み込み中…</Placeholder>,
});

type LoadState = { status: "loading" } | { status: "error" } | { status: "ready"; timeline: Timeline };

/** 選択中トラックの GeoJSON を取得し、地図と再生コントロールを表示する（トラックごとに key でリセット） */
export function TrackMapPanel({ track }: { track: TrackSummary }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/tracks/${track.id}/geojson`, { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<TrackGeoJson>) : Promise.reject(new Error(res.statusText))))
      .then((geojson) => setState({ status: "ready", timeline: buildTimeline(geojson, track.startedAt, track.endedAt) }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "error" });
      });
    return () => controller.abort();
  }, [track.id, track.startedAt, track.endedAt]);

  if (state.status === "loading") return <Placeholder>軌跡を読み込み中…</Placeholder>;
  if (state.status === "error") return <Placeholder>軌跡の読み込みに失敗しました</Placeholder>;
  return <PlaybackView timeline={state.timeline} color={ACTIVITY_TYPE_META[track.activityType].color} />;
}

/** 記録間隔ごとの目盛り番号（state 更新をこの単位に間引く） */
const stepOf = (timeline: Timeline, ms: number) => Math.floor((ms - timeline.startMs) / RECORD_INTERVAL_MS);

function PlaybackView({ timeline, color }: { timeline: Timeline; color: string }) {
  const [currentMs, setCurrentMs] = useState(timeline.startMs);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_PLAYBACK_SPEED);
  const [started, setStarted] = useState(false);
  const [follow, setFollow] = useState(true);
  const currentMsRef = useRef(timeline.startMs);

  // requestAnimationFrame で仮想時刻を進める。React の state は目盛りが変わったときだけ更新する
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const next = Math.min(currentMsRef.current + (now - last) * speed, timeline.endMs);
      last = now;
      currentMsRef.current = next;
      if (next >= timeline.endMs) {
        setCurrentMs(next);
        setPlaying(false);
        return;
      }
      setCurrentMs((prev) => (stepOf(timeline, prev) === stepOf(timeline, next) ? prev : next));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, timeline]);

  const seek = useCallback((ms: number) => {
    currentMsRef.current = ms;
    setCurrentMs(ms);
    setStarted(true);
  }, []);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    // 最後まで再生した後は先頭から
    if (currentMsRef.current >= timeline.endMs) seek(timeline.startMs);
    setStarted(true);
    setPlaying(true);
  };

  const position = useMemo(() => resolvePosition(timeline, currentMs), [timeline, currentMs]);
  const handleUserDrag = useCallback(() => setFollow(false), []);

  return (
    <>
      <div className="relative isolate min-h-0 flex-1">
        <TrackMap
          timeline={timeline}
          color={color}
          position={position}
          progressIndex={started ? position.index : null}
          follow={follow}
          onUserDrag={handleUserDrag}
        />
        {started && !follow && (
          <Button size="sm" variant="secondary" className="absolute top-3 right-3 z-[1000] shadow" onClick={() => setFollow(true)}>
            <LocateFixedIcon />
            追従を再開
          </Button>
        )}
      </div>
      <PlaybackControls
        startMs={timeline.startMs}
        endMs={timeline.endMs}
        currentMs={currentMs}
        playing={playing}
        speed={speed}
        onTogglePlay={togglePlay}
        onSeek={seek}
        onSpeedChange={setSpeed}
      />
    </>
  );
}
