/** web/demo/ にダミー CSV を生成する: npm run demo:generate */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { generateDemoCsvs } from "./demo-routes";

const outDir = path.resolve(import.meta.dirname, "../demo");
mkdirSync(outDir, { recursive: true });
for (const { fileName, activityType, csv } of generateDemoCsvs()) {
  writeFileSync(path.join(outDir, fileName), csv);
  console.log(`${fileName} (${activityType}): ${csv.trimEnd().split("\n").length - 1} 行`);
}
