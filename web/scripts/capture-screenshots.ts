/**
 * README 用のスクリーンショットを docs/images/ に撮る: npm run build && npm run screenshots
 *
 * - 一時ディレクトリを DATA_DIR にして本番ビルド（standalone）を起動し、web/demo/ のダミー CSV を画面から登録して撮影する
 * - 実際の走行データは使わない
 * - OSM タイル利用ポリシーに従い、手動実行で数枚撮るだけにする（パン・ズームを繰り返してタイルを集める操作はしない。CI では実行しない）
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { chromium, type Page } from "playwright";

const webDir = path.resolve(import.meta.dirname, "..");
const demoDir = path.join(webDir, "demo");
const outDir = path.resolve(webDir, "../docs/images");
const serverJs = path.join(webDir, ".next/standalone/server.js");
const port = Number(process.env.SCREENSHOT_PORT ?? 3300);
const baseUrl = `http://127.0.0.1:${port}`;

const DEMO_TYPES: Record<string, "バイク" | "自転車" | "ランニング"> = {
  "20260920_001230.csv": "バイク",
  "20260927_220510.csv": "自転車",
  "20261004_013000.csv": "自転車",
  "20261011_214000.csv": "ランニング",
};

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(baseUrl)).ok) return;
    } catch {
      // 起動待ち
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("サーバーが起動しませんでした");
}

/** 表示中のタイル・フォントの読み込みを待つ */
async function waitForMap(page: Page) {
  await page.waitForSelector(".leaflet-container");
  await page.waitForFunction(
    () => {
      const tiles = [...document.querySelectorAll<HTMLImageElement>(".leaflet-tile")];
      return tiles.length > 0 && tiles.every((t) => t.complete);
    },
    null,
    { timeout: 30_000 },
  );
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
}

async function upload(page: Page, fileName: string, typeLabel: string, screenshot?: string) {
  await page.getByRole("button", { name: "CSV アップロード" }).click();
  await page.getByRole("radio", { name: typeLabel }).click();
  await page.locator("input[type=file]").setInputFiles(path.join(demoDir, fileName));
  if (screenshot) {
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    await page.screenshot({ path: screenshot });
  }
  await page.getByRole("button", { name: "アップロード", exact: true }).click();
  await page.waitForURL(/track=/);
  await page.getByRole("dialog").waitFor({ state: "hidden" });
}

async function main() {
  if (!existsSync(serverJs)) {
    throw new Error("本番ビルドがありません。先に `npm run build` を実行してください");
  }
  const files = readdirSync(demoDir).filter((f) => f in DEMO_TYPES).sort();
  if (files.length !== Object.keys(DEMO_TYPES).length) {
    throw new Error("web/demo/ のダミー CSV が足りません。`npm run demo:generate` を実行してください");
  }

  mkdirSync(outDir, { recursive: true });
  const dataDir = mkdtempSync(path.join(tmpdir(), "m5-gps-screenshots-"));
  const server = spawn(process.execPath, [serverJs], {
    env: { ...process.env, DATA_DIR: dataDir, PORT: String(port), HOSTNAME: "127.0.0.1" },
    stdio: "ignore",
  });
  const browser = await chromium.launch();

  try {
    await waitForServer();
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: "ja-JP",
      timezoneId: "Asia/Tokyo",
    });
    const page = await context.newPage();
    await page.goto(baseUrl);
    await page.waitForLoadState("networkidle");

    // 古い順に登録（一覧は新しい順に並ぶ）。最初の 1 件でアップロードダイアログを撮る
    for (const [i, file] of files.entries()) {
      await upload(page, file, DEMO_TYPES[file], i === 0 ? path.join(outDir, "upload-dialog.png") : undefined);
    }
    // トーストが消えるのを待つ
    await page.locator("[data-sonner-toast]").first().waitFor({ state: "detached", timeout: 15_000 }).catch(() => {});

    // 全体画面（バイクのトラックを選択）
    await page.getByRole("link", { name: /バイク/ }).click();
    await page.waitForURL(/track=/);
    await waitForMap(page);
    await page.screenshot({ path: path.join(outDir, "dashboard.png") });

    // 再生中
    await page.getByRole("combobox", { name: "再生速度" }).click();
    await page.getByRole("option", { name: "300x" }).click();
    await page.getByRole("button", { name: "再生" }).click();
    await page.waitForTimeout(3500);
    await page.getByRole("button", { name: "一時停止" }).click();
    await waitForMap(page);
    await page.screenshot({ path: path.join(outDir, "playback.png") });

    // スマートフォン幅（ランニングのトラック）
    const trackUrl = await page.getByRole("link", { name: /ランニング/ }).getAttribute("href");
    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      locale: "ja-JP",
      timezoneId: "Asia/Tokyo",
    });
    const mobilePage = await mobile.newPage();
    await mobilePage.goto(`${baseUrl}${trackUrl}`);
    await waitForMap(mobilePage);
    await mobilePage.screenshot({ path: path.join(outDir, "mobile.png") });

    for (const name of ["dashboard.png", "playback.png", "upload-dialog.png", "mobile.png"]) {
      console.log(`docs/images/${name} (${Math.round(statSync(path.join(outDir, name)).size / 1024)}KB)`);
    }
  } finally {
    await browser.close();
    server.kill();
    rmSync(dataDir, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
