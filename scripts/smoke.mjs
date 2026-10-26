import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const port = "3101";
const server = spawn(process.execPath, [nextBin, "start", "--port", port, "--hostname", "127.0.0.1"], {
  cwd: process.cwd(),
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
server.stdout.on("data", (chunk) => { output += chunk.toString(); });
server.stderr.on("data", (chunk) => { output += chunk.toString(); });

try {
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (server.exitCode !== null) throw new Error(`服务器提前退出：${output}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/login`, { signal: AbortSignal.timeout(2000), redirect: "manual" });
      if (response.status === 200) { ready = true; break; }
    } catch { /* Wait for startup. */ }
    await sleep(500);
  }
  if (!ready) throw new Error(`无法访问登录页：${output}`);
  const privatePaths = ["/", "/tasks", "/ideas", "/resources", "/calendar", "/settings", "/music", "/search", "/learning", "/content-lab", "/analytics", "/lark", "/fitness", "/weekly-review"];
  for (const path of privatePaths) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, { redirect: "manual", signal: AbortSignal.timeout(5000) });
    if (![307, 308].includes(response.status) || new URL(response.headers.get("location"), response.url).pathname !== "/login") {
      throw new Error(`${path} 未重定向至登录页，状态：${response.status}`);
    }
    const cacheControl = response.headers.get("cache-control") ?? "";
    if (!cacheControl.includes("private") || !cacheControl.includes("no-store")) {
      throw new Error(`${path} 缺少私人页面的 no-store 缓存头。`);
    }
  }
  console.log(`PASS: 登录页 200；${privatePaths.length} 个私人路由均重定向至 /login，且响应包含 private, no-store。`);
} finally {
  server.kill();
}
