// Count occurrences of markers in big minified files
import { readFileSync } from "node:fs";
const file = process.argv[2];
const s = readFileSync(file, "utf8");
const markers = [
  "_agent-native",
  "core-routes",
  "Failed to auto-mount",
  "auth/session",
  "framework-request-handler",
  "awaitBootstrap",
  "markDefaultPluginProvided",
  "_agentNativeH3Shim",
  "handleDocumentRequest",
];
for (const m of markers) {
  let i = 0;
  let idx = s.indexOf(m);
  while (idx !== -1) {
    i++;
    idx = s.indexOf(m, idx + 1);
  }
  console.log(String(i).padStart(8), m);
}
console.log("file length:", s.length);
