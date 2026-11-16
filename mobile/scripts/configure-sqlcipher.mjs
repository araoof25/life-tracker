import { readFileSync, writeFileSync } from "node:fs";

const configFile = new URL("../app.json", import.meta.url);
const app = JSON.parse(readFileSync(configFile, "utf8"));
const plugins = app.expo.plugins ?? [];
app.expo.plugins = [
  ...plugins.filter((entry) => (Array.isArray(entry) ? entry[0] : entry) !== "expo-sqlite"),
  ["expo-sqlite", { useSQLCipher: true }],
];
writeFileSync(configFile, JSON.stringify(app, null, 2) + "\n");
