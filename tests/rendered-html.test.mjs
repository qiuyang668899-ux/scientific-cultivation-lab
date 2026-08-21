import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the scientific cultivation laboratory shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /<title>科学修仙实验室/);
  assert.match(html, /以科学为径/);
  assert.match(html, /向未知修行/);
  assert.match(html, /今日实验台/);
  assert.match(html, /体验保持开放/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|SkeletonPreview/);
});

test("contains the complete interactive research toolkit", async () => {
  const [page, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  for (const expected of ["今日修习", "假设库", "实验台", "观察记录", "理论图谱", "预注册新实验", "安全边界"]) {
    assert.match(page, new RegExp(expected));
  }
  assert.match(page, /localStorage\.setItem/);
  assert.match(page, /xiuxian-logs/);
  assert.match(page, /exportData/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /@media \(max-width:560px\)/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
