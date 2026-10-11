const fs = require("node:fs");
const path = require("node:path");
const { randomBytes } = require("node:crypto");
const { parse } = require("../../server/node_modules/dotenv");
const { generateVAPIDKeys } = require("../../server/node_modules/web-push");

function prepare(projectRoot, publicUrl = "http://localhost") {
  const url = new URL(publicUrl);
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
      "Use an HTTP(S) origin without a path, using port 80 or 443",
    );
  }
  const serverRoot = path.join(projectRoot, "server");
  const output = path.join(serverRoot, ".production.env");
  if (fs.existsSync(output)) return false;
  const read = (name) =>
    fs.existsSync(path.join(serverRoot, name))
      ? parse(fs.readFileSync(path.join(serverRoot, name)))
      : {};
  const local = {
    ...read(".env"),
    ...read(".development.env"),
    ...read("dev.env"),
  };
  const settings = read(".env.example");
  for (const key of Object.keys(settings)) {
    if (
      /^(POSTGRES_|ADMIN_|SMTP_|VAPID_|TRANSLATION_|TELEGRAM_)/.test(key) &&
      local[key] !== undefined
    ) {
      settings[key] = local[key];
    }
  }
  const keys =
    settings.VAPID_PUBLIC_KEY && settings.VAPID_PRIVATE_KEY
      ? {
          publicKey: settings.VAPID_PUBLIC_KEY,
          privateKey: settings.VAPID_PRIVATE_KEY,
        }
      : generateVAPIDKeys();
  Object.assign(settings, {
    NODE_ENV: "production",
    PORT: "5000",
    HTTP_HOST: "127.0.0.1",
    DB_SYNC: "false",
    TRUST_PROXY: "true",
    SWAGGER_ENABLED: "false",
    JWT_ACCESS_SECRET: randomBytes(48).toString("hex"),
    JWT_REFRESH_SECRET: randomBytes(48).toString("hex"),
    ADMIN_PASSWORD: local.ADMIN_PASSWORD || randomBytes(24).toString("hex"),
    BASE_URL: "/api",
    STATIC_DIR: "../data/uploads",
    FRONTEND_URL: url.origin,
    CORS_ORIGINS: url.origin,
    COOKIE_SECURE: String(url.protocol === "https:"),
    VAPID_PUBLIC_KEY: keys.publicKey,
    VAPID_PRIVATE_KEY: keys.privateKey,
    YOOKASSA_RETURN_URL: `${url.origin}/profile?section=tariff`,
  });
  const content =
    Object.entries(settings)
      .map(([key, value]) => {
        const quote = ["'", "`", '"'].find(
          (q) => !value.includes(q) && (q !== '"' || !/\\[nr]/.test(value)),
        );
        if (!quote)
          throw new Error(
            `Cannot safely write ${key}; configure .production.env manually`,
          );
        return `${key}=${quote}${value}${quote}`;
      })
      .join("\n") + "\n";
  if (JSON.stringify(parse(content)) !== JSON.stringify(settings)) {
    throw new Error(
      "Environment values could not be preserved; configure .production.env manually",
    );
  }
  const uploads = path.join(projectRoot, "data", "uploads");
  fs.mkdirSync(uploads, { recursive: true });
  const source = path.resolve(serverRoot, local.STATIC_DIR || "src/static");
  if (fs.existsSync(source)) {
    for (const file of fs.readdirSync(source, { withFileTypes: true })) {
      if (!file.isFile()) continue;
      try {
        fs.copyFileSync(
          path.join(source, file.name),
          path.join(uploads, file.name),
          fs.constants.COPYFILE_EXCL,
        );
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
      }
    }
  }
  fs.writeFileSync(output, content, { flag: "wx", mode: 0o600 });
  return true;
}

module.exports = { prepare };
if (require.main === module) {
  try {
    const created = prepare(path.resolve(__dirname, "../.."), process.argv[2]);
    console.log(
      created
        ? "Created server/.production.env and copied uploads to data/uploads. Check database and SMTP settings before starting."
        : "server/.production.env already exists; settings and uploads were left unchanged.",
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
