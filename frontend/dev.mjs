import { spawn } from "node:child_process";
import { createServer, request } from "node:http";

const frontendPort = 8000;
const esbuildPort = 8001;
const allowedHosts = new Set([
  "localhost",
  "127.0.0.1",
  ...(process.env.FRONTEND_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean),
]);

const frontendServer = createServer((incoming, outgoing) => {
  let requestUrl;
  try {
    requestUrl = new URL(`http://${incoming.headers.host ?? ""}`);
  } catch {
    outgoing.writeHead(400).end("Invalid Host header");
    return;
  }

  if (requestUrl.username || requestUrl.password || requestUrl.pathname !== "/" || requestUrl.search || requestUrl.hash) {
    outgoing.writeHead(400).end("Invalid Host header");
    return;
  }

  const requestHost = requestUrl.hostname.toLowerCase().replace(/\.$/, "");
  if (requestUrl.port !== String(frontendPort) || !allowedHosts.has(requestHost)) {
    outgoing.writeHead(403).end("Frontend host is not allowed");
    return;
  }

  const upstream = request(
    {
      hostname: "127.0.0.1",
      port: esbuildPort,
      path: incoming.url,
      method: incoming.method,
      headers: { ...incoming.headers, host: `127.0.0.1:${esbuildPort}` },
    },
    (response) => {
      outgoing.writeHead(response.statusCode ?? 502, response.headers);
      response.pipe(outgoing);
    }
  );

  upstream.on("error", (error) => {
    console.error("Could not reach the esbuild development server:", error.message);
    if (!outgoing.headersSent) outgoing.writeHead(502);
    outgoing.end("Frontend development server is unavailable");
  });

  incoming.pipe(upstream);
});

const processes = [
  { name: "esbuild (npm run dev)", child: spawn("npm", ["run", "dev"], { stdio: "inherit" }) },
  { name: "Tailwind CSS (npm run dev:css)", child: spawn("npm", ["run", "dev:css"], { stdio: "inherit" }) },
];

let stopping = false;

function stopAll(signal = "SIGTERM") {
  if (stopping) return;
  stopping = true;
  if (frontendServer.listening) frontendServer.close();

  for (const { child } of processes) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill(signal);
    }
  }
}

process.on("SIGINT", () => stopAll("SIGINT"));
process.on("SIGTERM", () => stopAll("SIGTERM"));

frontendServer.on("error", (error) => {
  console.error("Frontend host-validation proxy failed:", error);
  process.exitCode = 1;
  stopAll();
});
frontendServer.listen(frontendPort, "0.0.0.0");

for (const { name, child } of processes) {
  child.on("error", (error) => {
    console.error(`Failed to start ${name}:`, error);
    process.exitCode = 1;
    stopAll();
  });

  child.on("exit", (code, signal) => {
    console.log(`${name} exited (code=${code ?? "null"}, signal=${signal ?? "none"}).`);
    if (stopping) return;

    process.exitCode = code === 0 ? 1 : (code ?? 1);
    console.error(`${name} exited unexpectedly; stopping the other frontend process.`);
    stopAll();
  });
}
