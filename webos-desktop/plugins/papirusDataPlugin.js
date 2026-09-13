import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, join } from "path";
import { gzipSync, brotliCompressSync, constants } from "zlib";

function compressPapirusData() {
  const base = resolve(process.cwd(), "src/generated");
  const files = ["papirus-available.json", "papirus-symlinks.json"];
  for (const name of files) {
    const jsonPath = join(base, name);
    if (!existsSync(jsonPath)) continue;
    const data = readFileSync(jsonPath);
    const gz = gzipSync(data, { level: 9, mtime: 0 });
    writeFileSync(`${jsonPath}.gz`, gz);
    try {
      const br = brotliCompressSync(data, {
        params: { [constants.BROTLI_PARAM_QUALITY]: 11 }
      });
      writeFileSync(`${jsonPath}.br`, br);
    } catch {}
  }
}

export function papirusDataPlugin() {
  return {
    name: "yukios-papirus-data",
    buildStart() {
      compressPapirusData();
    },
    configureServer(server) {
      compressPapirusData();
      const watcherPath = resolve(process.cwd(), "src/generated/papirus-available.json");
      const watcherPath2 = resolve(process.cwd(), "src/generated/papirus-symlinks.json");
      try {
        server.watcher.add(watcherPath);
        server.watcher.add(watcherPath2);
        server.watcher.on("change", (p) => {
          if (p.includes("papirus-available.json") || p.includes("papirus-symlinks.json")) {
            compressPapirusData();
          }
        });
        server.watcher.on("add", (p) => {
          if (p.includes("papirus-available.json") || p.includes("papirus-symlinks.json")) {
            compressPapirusData();
          }
        });
      } catch {}
    }
  };
}
