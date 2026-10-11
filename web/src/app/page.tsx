import { connection } from "next/server";
import { Suspense } from "react";

import { TrackMapPanel } from "@/components/map/track-map-panel";
import { TrackList } from "@/components/track-list";
import { TrackSummary } from "@/components/track-summary";
import { UploadDialog } from "@/components/upload-dialog";
import { getTrackService } from "@/server/track-service";

export default function Page({ searchParams }: PageProps<"/">) {
  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <h1 className="text-base font-semibold">M5 GPS Dashboard</h1>
        <UploadDialog />
      </header>
      <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">読み込み中…</p>}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Dashboard({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  // better-sqlite3 は同期 API のため、リクエスト時に読むことを明示する
  await connection();
  const { track: trackParam } = await searchParams;
  const tracks = getTrackService().listTracks();
  const selected = tracks.find((t) => t.id === trackParam);

  return (
    <main className="flex min-h-0 flex-1 flex-col md:flex-row">
      <aside className="flex max-h-[40dvh] shrink-0 flex-col border-b md:max-h-none md:w-80 md:border-r md:border-b-0">
        <h2 className="border-b px-4 py-2 text-sm font-medium text-muted-foreground">トラック一覧（新しい順）</h2>
        <TrackList tracks={tracks} selectedId={selected?.id} />
      </aside>
      <section className="flex min-h-[60dvh] min-w-0 flex-1 flex-col md:min-h-0">
        {selected ? (
          <>
            <TrackSummary track={selected} />
            <TrackMapPanel key={selected.id} track={selected} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
            左の一覧からトラックを選択してください
          </div>
        )}
      </section>
    </main>
  );
}
