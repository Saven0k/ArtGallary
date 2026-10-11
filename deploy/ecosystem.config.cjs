const path = require("node:path");
const fs = require("node:fs");
const { parse } = require("../server/node_modules/dotenv");

const projectRoot = path.resolve(__dirname, "..");
const serverRoot = path.join(projectRoot, "server");
const settings = parse(
  fs.readFileSync(path.join(serverRoot, ".production.env")),
);
const url = new URL(settings.FRONTEND_URL);
if (
  !["http:", "https:"].includes(url.protocol) ||
  url.username ||
  url.password ||
  url.pathname !== "/" ||
  url.search ||
  url.hash ||
  url.port
) {
  throw new Error(
    "FRONTEND_URL must be an HTTP(S) origin using port 80 or 443",
  );
}
const logs = path.join(serverRoot, "logs");
fs.mkdirSync(logs, { recursive: true });

module.exports = {
  apps: [
    {
      name: "gallery-api",
      cwd: serverRoot,
      script: "dist/main.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "600M",
      env: {
        ...settings,
        NODE_ENV: "production",
        PORT: "5000",
        HTTP_HOST: "127.0.0.1",
        TRUST_PROXY: "true",
        COOKIE_SECURE: String(url.protocol === "https:"),
      },
      out_file: path.join(logs, "pm2-out.log"),
      error_file: path.join(logs, "pm2-error.log"),
      merge_logs: true,
      time: true,
    },
    {
      name: "gallery-web",
      cwd: __dirname,
      script:
        process.env.GALLERY_CADDY || path.join(__dirname, "bin", "caddy.exe"),
      args: ["run", "--config", path.join(__dirname, "Caddyfile")],
      interpreter: "none",
      autorestart: true,
      env: {
        GALLERY_ADDRESS: url.protocol === "https:" ? url.host : ":80",
        GALLERY_FRONTEND: path
          .join(projectRoot, "frontend", "dist")
          .replace(/\\/g, "/"),
        GALLERY_ACCESS_LOG: path
          .join(logs, "caddy-access.log")
          .replace(/\\/g, "/"),
      },
      out_file: path.join(logs, "caddy-out.log"),
      error_file: path.join(logs, "caddy-error.log"),
      merge_logs: true,
      time: true,
    },
  ],
};
