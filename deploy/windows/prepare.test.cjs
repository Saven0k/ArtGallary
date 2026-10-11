const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { parse } = require("../../server/node_modules/dotenv");
const { prepare } = require("./prepare.cjs");

test("preparation preserves credentials and files, generates secrets, and never overwrites production settings", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "gallery-deploy-"));
  try {
    const server = path.join(root, "server");
    const source = path.join(server, "src", "static");
    const destination = path.join(root, "data", "uploads");
    fs.mkdirSync(source, { recursive: true });
    fs.mkdirSync(destination, { recursive: true });
    fs.copyFileSync(
      path.resolve(__dirname, "../../server/.env.example"),
      path.join(server, ".env.example"),
    );
    fs.writeFileSync(
      path.join(server, ".development.env"),
      "POSTGRES_PASSWORD='a#b\\path'\nADMIN_EMAIL=owner@example.test\n",
    );
    fs.writeFileSync(
      path.join(server, "dev.env"),
      "SMTP_USER=sender@example.test\nSMTP_PASS='password#with\"quote'\nTRANSLATION_ENABLED=true\nTELEGRAM_BOT_ENABLED=true\nTELEGRAM_BOT_TOKEN=example-token\nTELEGRAM_PROXY_URL=http://127.0.0.1:8080\n",
    );
    fs.writeFileSync(path.join(source, "existing.png"), "original");
    fs.writeFileSync(path.join(source, "new.png"), "new");
    fs.writeFileSync(path.join(destination, "existing.png"), "production");
    for (const url of [
      "ftp://example.test",
      "https://example.test/path",
      "https://a:b@example.test",
      "https://example.test:8443",
      "https://example.test:80",
      "http://example.test:443",
      "https://example.test/?x=1",
    ]) {
      assert.throws(() => prepare(root, url));
    }
    assert.equal(prepare(root, "https://gallery.example.test"), true);
    const file = path.join(server, ".production.env");
    const before = fs.readFileSync(file, "utf8");
    const settings = parse(before);
    assert.equal(settings.POSTGRES_PASSWORD, "a#b\\path");
    assert.equal(settings.SMTP_PASS, 'password#with"quote');
    assert.equal(settings.ADMIN_EMAIL, "owner@example.test");
    assert.equal(settings.TRANSLATION_ENABLED, "true");
    assert.equal(settings.TELEGRAM_BOT_ENABLED, "true");
    assert.equal(settings.TELEGRAM_BOT_TOKEN, "example-token");
    assert.equal(settings.TELEGRAM_PROXY_URL, "http://127.0.0.1:8080");
    assert.equal(settings.FRONTEND_URL, "https://gallery.example.test");
    assert.equal(settings.COOKIE_SECURE, "true");
    assert.equal(settings.DB_SYNC, "false");
    assert.equal(settings.BASE_URL, "/api");
    assert.equal(settings.HTTP_HOST, "127.0.0.1");
    assert.ok(settings.JWT_ACCESS_SECRET.length >= 64);
    assert.notEqual(settings.JWT_ACCESS_SECRET, settings.JWT_REFRESH_SECRET);
    assert.ok(settings.VAPID_PUBLIC_KEY && settings.VAPID_PRIVATE_KEY);
    assert.equal(
      fs.readFileSync(path.join(destination, "existing.png"), "utf8"),
      "production",
    );
    assert.equal(
      fs.readFileSync(path.join(destination, "new.png"), "utf8"),
      "new",
    );
    assert.equal(
      fs.readFileSync(path.join(source, "existing.png"), "utf8"),
      "original",
    );
    assert.equal(prepare(root), false);
    assert.equal(fs.readFileSync(file, "utf8"), before);
  } finally {
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith("gallery-deploy-"));
    fs.rmSync(root, { recursive: true, force: true });
  }
});
