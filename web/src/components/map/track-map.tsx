"use client";

import "leaflet/dist/leaflet.css";

import type { LatLngExpression, LatLngTuple, LeafletMouseEvent } from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";

import { findNearestPointIndex, type Timeline, type TimelinePosition } from "@/lib/playback/timeline";
import {
  formatAltitude,
  formatDateTimeWithSeconds,
  formatSpeed,
  formatTimeWithSeconds,
} from "@/lib/format";

// OSM タイル利用ポリシー: https://operations.osmfoundation.org/policies/tiles/
// - URL は https://tile.openstreetmap.org/{z}/{x}/{y}.png（サブドメインなし）。環境変数で差し替え可能
// - 帰属表示を右下に常に表示する。Referer を止める設定・キャッシュ無効化・先読み（keepBuffer の増加など）はしない
const TILE_URL = process.env.NEXT_PUBLIC_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors' +
  ' | <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noopener">地図の誤りを報告</a>';

export interface TrackMapProps {
  timeline: Timeline;
  color: string;
  position: TimelinePosition;
  /** 再生の進み具合を表示する点（null なら軌跡全体を通常表示） */
  progressIndex: number | null;
  follow: boolean;
  onUserDrag: () => void;
}

/** 区間ごとの座標列（先頭から count 点まで） */
function toSegments(timeline: Timeline, count = timeline.points.length): LatLngTuple[][] {
  const segments: LatLngTuple[][] = [];
  timeline.points.slice(0, count).forEach((p, i, points) => {
    if (i === 0 || points[i - 1].segment !== p.segment) segments.push([]);
    segments[segments.length - 1].push([p.lat, p.lon]);
  });
  return segments;
}

function MapEvents({ onUserDrag }: { onUserDrag: () => void }) {
  // プログラムによるパン（追従）では dragstart は発生しない
  useMapEvents({ dragstart: onUserDrag });
  return null;
}

/** 地図の大きさが変わったら再計算し、最初の大きさが決まった時点で軌跡全体が収まるようにする */
function FitToTrack({ bounds }: { bounds: LatLngTuple[] }) {
  const map = useMap();
  useEffect(() => {
    let fitted = false;
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      if (!fitted) {
        map.fitBounds(bounds, { padding: [32, 32] });
        fitted = true;
      }
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, bounds]);
  return null;
}

/** 現在位置が表示範囲の内側から外れたらパンする（表示中のタイルを取得するだけで先読みはしない） */
function FollowController({ latlng, active }: { latlng: LatLngTuple; active: boolean }) {
  const map = useMap();
  const [lat, lon] = latlng;
  useEffect(() => {
    if (!active) return;
    if (!map.getBounds().pad(-0.2).contains([lat, lon])) map.panTo([lat, lon]);
  }, [map, lat, lon, active]);
  return null;
}

export default function TrackMap({ timeline, color, position, progressIndex, follow, onUserDrag }: TrackMapProps) {
  const { points } = timeline;
  const [popupIndex, setPopupIndex] = useState<number | null>(null);

  const allSegments = useMemo(() => toSegments(timeline), [timeline]);
  const passedSegments = useMemo(
    () => (progressIndex === null ? [] : toSegments(timeline, progressIndex + 1)),
    [timeline, progressIndex],
  );
  const bounds = useMemo(() => points.map((p): LatLngTuple => [p.lat, p.lon]), [points]);

  const start = points[0];
  const goal = points[points.length - 1];
  const current = points[position.index];
  const popupPoint = popupIndex === null ? undefined : points[popupIndex];

  const handleTrackClick = (e: LeafletMouseEvent) =>
    setPopupIndex(findNearestPointIndex(timeline, e.latlng.lat, e.latlng.lng));

  return (
    <MapContainer bounds={bounds} boundsOptions={{ padding: [32, 32] }} className="h-full w-full">
      <TileLayer url={TILE_URL} attribution={ATTRIBUTION} maxZoom={19} />
      <MapEvents onUserDrag={onUserDrag} />
      <FitToTrack bounds={bounds} />

      {allSegments.map((segment, i) => (
        <Polyline
          key={`all-${i}`}
          positions={segment}
          pathOptions={{ color, weight: 5, opacity: progressIndex === null ? 0.9 : 0.35 }}
          eventHandlers={{ click: handleTrackClick }}
        />
      ))}
      {passedSegments.map((segment, i) => (
        <Polyline
          key={`passed-${i}`}
          positions={segment}
          pathOptions={{ color, weight: 5, opacity: 1 }}
          eventHandlers={{ click: handleTrackClick }}
        />
      ))}

      <CircleMarker center={[start.lat, start.lon]} radius={8} pathOptions={{ color: "#fff", weight: 2, fillColor: "#16A34A", fillOpacity: 1 }}>
        <Tooltip direction="top" offset={[0, -8]}>スタート {formatTimeWithSeconds(start.timeMs)}</Tooltip>
      </CircleMarker>
      <CircleMarker center={[goal.lat, goal.lon]} radius={8} pathOptions={{ color: "#fff", weight: 2, fillColor: "#DC2626", fillOpacity: 1 }}>
        <Tooltip direction="top" offset={[0, -8]}>ゴール {formatTimeWithSeconds(goal.timeMs)}</Tooltip>
      </CircleMarker>

      {progressIndex !== null && (
        <>
          <CircleMarker
            center={[current.lat, current.lon]}
            radius={9}
            pathOptions={{ color, weight: 4, fillColor: "#fff", fillOpacity: 1 }}
          >
            <Tooltip permanent direction="top" offset={[0, -10]} className="tabular-nums">
              {position.noFix ? (
                <span className="font-medium text-destructive">未測位</span>
              ) : (
                <>
                  {formatTimeWithSeconds(current.timeMs)} / {formatSpeed(current.speedKmh)} /{" "}
                  {formatAltitude(current.altitudeM)}
                </>
              )}
            </Tooltip>
          </CircleMarker>
          <FollowController latlng={[current.lat, current.lon]} active={follow} />
        </>
      )}

      {popupPoint && (
        <Popup
          key={popupIndex}
          position={[popupPoint.lat, popupPoint.lon] as LatLngExpression}
          eventHandlers={{ remove: () => setPopupIndex(null) }}
        >
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs tabular-nums [&_dt]:text-muted-foreground">
            <dt>日時</dt>
            <dd>{formatDateTimeWithSeconds(popupPoint.timeMs)}</dd>
            <dt>緯度・経度</dt>
            <dd>
              {popupPoint.lat.toFixed(6)}, {popupPoint.lon.toFixed(6)}
            </dd>
            <dt>高度</dt>
            <dd>{formatAltitude(popupPoint.altitudeM)}</dd>
            <dt>速度</dt>
            <dd>{formatSpeed(popupPoint.speedKmh)}</dd>
            <dt>衛星数</dt>
            <dd>{popupPoint.satellites ?? "-"}</dd>
            <dt>HDOP</dt>
            <dd>{popupPoint.hdop ?? "-"}</dd>
          </dl>
        </Popup>
      )}
    </MapContainer>
  );
}
