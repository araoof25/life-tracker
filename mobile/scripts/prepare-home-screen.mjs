import { createHash } from "node:crypto";
import { copyFileSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const mobile = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(mobile, "dist");
const index = join(dist, "index.html");
const html = readFileSync(index, "utf8");
if (!html.includes("</head>") || !html.includes("</body>")) {
  throw new Error("Unexpected Expo web export. Run expo export --platform web first.");
}

const manifest = {
  id: "./",
  name: "Life Tracker",
  short_name: "Life Tracker",
  start_url: "./",
  scope: "./",
  display: "standalone",
  background_color: "#F2F6F3",
  theme_color: "#225D43",
  icons: [{ src: "./life-tracker-icon.png", sizes: "1024x1024", type: "image/png" }],
};

copyFileSync(join(mobile, "assets", "icon.png"), join(dist, "life-tracker-icon.png"));
writeFileSync(join(dist, "manifest.webmanifest"), JSON.stringify(manifest, null, 2) + "\n");

if (!html.includes('href="./manifest.webmanifest"')) {
  writeFileSync(index, html
    .replace("</head>", `<link rel="manifest" href="./manifest.webmanifest">
<link rel="apple-touch-icon" href="./life-tracker-icon.png">
<meta name="theme-color" content="#225D43">
</head>`)
    .replace("</body>", `<script>
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {
    console.error("Life Tracker offline setup failed.");
  });
}
</script>
</body>`));
}

function listAssets(directory, prefix = "") {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = prefix + entry.name;
    if (entry.isDirectory()) {
      return listAssets(join(directory, entry.name), relative + "/");
    }
    return relative === "sw.js" || relative.endsWith(".map") ? [] : [relative];
  });
}

const assets = listAssets(dist).sort();
const hash = createHash("sha256");
for (const asset of assets) {
  hash.update(asset);
  hash.update(readFileSync(join(dist, asset)));
}
const cacheVersion = hash.digest("hex").slice(0, 16);
const worker = `const prefix = "life-tracker:" + self.registration.scope + ":";
const cacheName = prefix + ${JSON.stringify(cacheVersion)};
const resolve = (path) => new URL(path, self.registration.scope).href;
const assets = new Set(${JSON.stringify(assets)}.map((path) => resolve(path.split("/").map(encodeURIComponent).join("/"))));
const shell = resolve("index.html");

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(
    Array.from(assets, (url) => new Request(url, { cache: "reload" })),
  )));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys
    .filter((key) => key.startsWith(prefix) && key !== cacheName)
    .map((key) => caches.delete(key)))));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const isShell = request.mode === "navigate" && (url.href === resolve("") || url.href === shell);
  const key = isShell ? shell : url.href;
  if (!assets.has(key)) return;
  event.respondWith(caches.open(cacheName)
    .then((cache) => cache.match(key))
    .then((response) => response ?? fetch(request)));
});
`;

writeFileSync(join(dist, "sw.js"), worker);
console.log(`Prepared a Life Tracker web build with ${assets.length} offline assets.`);
