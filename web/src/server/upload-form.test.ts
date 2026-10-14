import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CSV_HEADER } from "@/lib/track/csv";

import { openDb } from "./db/client";
import { createStorage } from "./storage";
import { createTrackService, MAX_CSV_BYTES, type TrackService } from "./track-service";
import { handleUploadRequest, readUploadForm } from "./upload-form";

const CSV = [
  CSV_HEADER,
  "2026-10-11T01:00:00Z,35.658636,139.745407,10,20,,",
  "2026-10-11T01:00:10Z,35.659636,139.745407,10,30,,",
].join("\n");

function form(file: File | string | null, activityType: string | null = "bicycle"): FormData {
  const fd = new FormData();
  if (file !== null) fd.append("file", file);
  if (activityType !== null) fd.append("activityType", activityType);
  return fd;
}

const csvFile = (name = "20261011_010000.csv", text = CSV) => new File([text], name, { type: "text/csv" });

const post = (body: FormData | string) =>
  new Request("http://localhost/api/tracks", { method: "POST", body });

describe("readUploadForm", () => {
  it("ファイル名・内容・種別を取り出す", async () => {
    const input = await readUploadForm(form(csvFile()));
    expect(input.fileName).toBe("20261011_010000.csv");
    expect(new TextDecoder().decode(input.bytes)).toBe(CSV);
    expect(input.activityType).toBe("bicycle");
  });

  it(".csv 以外・ファイルなしは INVALID_FORMAT", async () => {
    await expect(readUploadForm(form(csvFile("a.txt")))).rejects.toMatchObject({ code: "INVALID_FORMAT" });
    await expect(readUploadForm(form("text"))).rejects.toMatchObject({ code: "INVALID_FORMAT" });
    await expect(readUploadForm(form(null))).rejects.toMatchObject({ code: "INVALID_FORMAT" });
  });

  it("サイズ上限を超えると TOO_LARGE", async () => {
    const big = csvFile("big.csv", "a".repeat(MAX_CSV_BYTES + 1));
    await expect(readUploadForm(form(big))).rejects.toMatchObject({ code: "TOO_LARGE" });
  });
});

describe("handleUploadRequest", () => {
  let dataDir: string;
  let sqlite: ReturnType<typeof openDb>["sqlite"];
  let service: TrackService;

  beforeEach(() => {
    dataDir = mkdtempSync(path.join(tmpdir(), "upload-api-"));
    const opened = openDb(dataDir);
    sqlite = opened.sqlite;
    service = createTrackService({ db: opened.db, storage: createStorage(dataDir) });
  });

  afterEach(() => {
    sqlite.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  it("登録すると 201、同じ内容は 409、種別不正は 400", async () => {
    const created = await handleUploadRequest(post(form(csvFile())), service);
    expect(created.status).toBe(201);
    expect(await created.json()).toMatchObject({
      activityType: "bicycle",
      originalFilename: "20261011_010000.csv",
      pointCount: 2,
    });
    expect(service.listTracks()).toHaveLength(1);

    const duplicate = await handleUploadRequest(post(form(csvFile())), service);
    expect(duplicate.status).toBe(409);
    expect(await duplicate.json()).toMatchObject({ code: "DUPLICATE" });

    const invalidType = await handleUploadRequest(post(form(csvFile(), "car")), service);
    expect(invalidType.status).toBe(400);
    expect(await invalidType.json()).toMatchObject({ code: "INVALID_ACTIVITY_TYPE" });
  });

  it("multipart でない本文は 400", async () => {
    const res = await handleUploadRequest(post("not a form"), service);
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: "INVALID_FORMAT" });
  });
});
