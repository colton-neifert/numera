#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const srcDir = path.resolve("node_modules/@electric-sql/pglite/dist");
const dests = [
  path.resolve(".vercel/output/functions/__server.func/_libs"),
  path.resolve(".vercel/output/functions/__server.func"),
];
const files = ["pglite.data", "pglite.wasm", "initdb.wasm"];

for (const dest of dests) {
  if (!fs.existsSync(dest)) continue;
  for (const name of files) {
    const from = path.join(srcDir, name);
    if (!fs.existsSync(from)) continue;
    fs.copyFileSync(from, path.join(dest, name));
    console.log(`copied ${name} -> ${dest}`);
  }
}
