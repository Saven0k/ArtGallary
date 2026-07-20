// src/location/seeders/geonames.seeder.ts
//
// Запуск: npx ts-node -r tsconfig-paths/register src/location/seeders/geonames.seeder.ts
//
// Зависимости (установи перед запуском):
//   npm install adm-zip pg dotenv --save-dev
//   npm install @types/adm-zip @types/pg --save-dev

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import * as readline from 'readline';
import { createWriteStream } from 'fs';
import { Client } from 'pg';
import AdmZip from 'adm-zip';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// ─── Подключение напрямую через pg (без Sequelize/sync) ──────────────────────
const client = new Client({
  host:     process.env.POSTGRES_HOST     || 'localhost',
  port:     Number(process.env.POSTGRES_PORT) || 5432,
  database: process.env.POSTGRES_DB       || 'gallery',
  user:     process.env.POSTGRES_USER     || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'root',
});

const TMP_DIR = path.join(process.cwd(), '.geonames_tmp');

// ─────────────────────────────────────────────────────────────────────────────
// Создание таблиц через чистый SQL (не зависит от моделей и sync)
// ─────────────────────────────────────────────────────────────────────────────
async function createTables() {
  // Создаём таблицы если не существуют
  await client.query(`
    CREATE TABLE IF NOT EXISTS countries (
      id           SERIAL PRIMARY KEY,
      iso2         CHAR(2)      NOT NULL UNIQUE,
      iso3         CHAR(3),
      name_en      VARCHAR(100) NOT NULL,
      name_ru      VARCHAR(100),
      geonames_id  INTEGER,
      phone_code   VARCHAR(20),
      currency     CHAR(3),
      continent    CHAR(2),
      created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS cities (
      id           SERIAL PRIMARY KEY,
      geonames_id  INTEGER      NOT NULL UNIQUE,
      name_en      VARCHAR(200) NOT NULL,
      name_ru      VARCHAR(200),
      country_id   INTEGER      NOT NULL REFERENCES countries(id),
      country_code CHAR(2)      NOT NULL,
      region       VARCHAR(200),
      latitude     DECIMAL(9,6),
      longitude    DECIMAL(9,6),
      population   INTEGER      DEFAULT 0,
      timezone     VARCHAR(50),
      created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `);

  // Фикс: если таблицы уже существовали без DEFAULT на created_at/updated_at —
  // добавляем DEFAULT и заполняем NULL-значения
  await client.query(`
    ALTER TABLE countries
      ALTER COLUMN created_at SET DEFAULT NOW(),
      ALTER COLUMN updated_at SET DEFAULT NOW();
    UPDATE countries SET created_at = NOW() WHERE created_at IS NULL;
    UPDATE countries SET updated_at = NOW() WHERE updated_at IS NULL;
  `);

  await client.query(`
    ALTER TABLE cities
      ALTER COLUMN created_at SET DEFAULT NOW(),
      ALTER COLUMN updated_at SET DEFAULT NOW();
    UPDATE cities SET created_at = NOW() WHERE created_at IS NULL;
    UPDATE cities SET updated_at = NOW() WHERE updated_at IS NULL;
  `);

  // Индексы для быстрого поиска
  await client.query(`CREATE INDEX IF NOT EXISTS idx_countries_iso2    ON countries(iso2);`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_countries_name_ru ON countries(name_ru);`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_countries_name_en ON countries(name_en);`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_cities_name_ru    ON cities(name_ru);`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_cities_name_en    ON cities(name_en);`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_cities_country    ON cities(country_code);`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_cities_population ON cities(population);`);

  console.log('  ✅ Таблицы и индексы готовы');
}

// ─────────────────────────────────────────────────────────────────────────────
// downloadFile
// ─────────────────────────────────────────────────────────────────────────────
async function downloadFile(url: string, dest: string, attempt = 1): Promise<void> {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    console.log(`  ↩  Уже скачан: ${path.basename(dest)}`);
    return;
  }
  if (fs.existsSync(dest)) fs.unlinkSync(dest);

  console.log(`  ⬇  [${attempt}/3] ${path.basename(dest)}`);
  const proto = url.startsWith('https') ? https : http;

  await new Promise<void>((resolve, reject) => {
    const file = createWriteStream(dest);
    let downloaded = 0, total = 0, lastPrint = Date.now();

    const req = proto.get(url, { timeout: 30_000 }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        downloadFile(res.headers.location!, dest, attempt).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      total = parseInt(res.headers['content-length'] || '0', 10);

      let dataTimer: NodeJS.Timeout;
      const resetTimer = () => {
        clearTimeout(dataTimer);
        dataTimer = setTimeout(() => req.destroy(new Error('Нет данных 60 сек')), 60_000);
      };
      resetTimer();

      res.on('data', (chunk: Buffer) => {
        downloaded += chunk.length;
        resetTimer();
        if (Date.now() - lastPrint > 2000) {
          lastPrint = Date.now();
          const mb = (downloaded / 1024 / 1024).toFixed(1);
          if (total > 0) {
            const pct = Math.round((downloaded / total) * 100);
            process.stdout.write(`\r     ${pct}%  ${mb} / ${(total / 1024 / 1024).toFixed(0)} MB`);
          } else {
            process.stdout.write(`\r     ${mb} MB`);
          }
        }
      });

      res.pipe(file);
      file.on('finish', () => {
        clearTimeout(dataTimer);
        process.stdout.write(`\r  ✅ ${path.basename(dest)} — ${(downloaded / 1024 / 1024).toFixed(1)} MB\n`);
        file.close(() => resolve());
      });
      file.on('error', (err) => { clearTimeout(dataTimer); reject(err); });
    });

    req.on('timeout', () => req.destroy(new Error('Таймаут (30 сек)')));
    req.on('error', (err) => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  }).catch(async (err: Error) => {
    console.error(`\n  ❌ ${err.message}`);
    if (attempt < 3) {
      console.log(`  ⏳ Повтор через ${attempt * 5} сек...`);
      await new Promise(r => setTimeout(r, attempt * 5000));
      return downloadFile(url, dest, attempt + 1);
    }
    throw new Error(`Не удалось скачать: ${path.basename(dest)}`);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// extractZip — через adm-zip (без системного unzip)
// ─────────────────────────────────────────────────────────────────────────────
function extractZip(zipPath: string, destDir: string, filename: string): string {
  const outPath = path.join(destDir, filename);
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 0) {
    console.log(`  ↩  Уже распакован: ${filename}`);
    return outPath;
  }

  console.log(`  📦 Распаковываю: ${filename}...`);
  const zip   = new AdmZip(zipPath);
  const entry = zip.getEntry(filename);

  if (!entry) {
    const names = zip.getEntries().map(e => e.entryName).join(', ');
    throw new Error(`"${filename}" не найден в архиве. Содержимое: ${names}`);
  }

  fs.writeFileSync(outPath, entry.getData());
  console.log(`  ✅ Распакован (${(entry.header.size / 1024 / 1024).toFixed(0)} MB): ${filename}`);
  return outPath;
}

// ─────────────────────────────────────────────────────────────────────────────
// parseCountryInfo
// ─────────────────────────────────────────────────────────────────────────────
interface RawCountry {
  iso2: string; iso3: string; name_en: string;
  geonames_id: number; phone_code: string; currency: string; continent: string;
}

function parseCountryInfo(filePath: string): RawCountry[] {
  const result: RawCountry[] = [];
  for (const line of fs.readFileSync(filePath, 'utf-8').split('\n')) {
    if (line.startsWith('#') || !line.trim()) continue;
    const c = line.split('\t');
    if (c.length < 19 || !c[0].trim() || c[0].trim().length !== 2) continue;
    result.push({
      iso2: c[0].trim(), iso3: c[1].trim(),
      name_en: c[4].trim(), geonames_id: parseInt(c[16].trim(), 10),
      phone_code: c[12].trim(), currency: c[10].trim(), continent: c[8].trim(),
    });
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// parseAlternateNames — потоковое чтение
// ─────────────────────────────────────────────────────────────────────────────
async function parseAlternateNames(
  filePath: string, targetIds: Set<number>, lang = 'ru',
): Promise<Map<number, string>> {
  console.log(`  🌐 Читаю переводы (${lang})...`);
  const result = new Map<number, string>();
  let lines = 0, lastPrint = Date.now();

  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath, { encoding: 'utf-8' }),
      crlfDelay: Infinity,
    });
    rl.on('line', (line) => {
      lines++;
      if (Date.now() - lastPrint > 3000) {
        lastPrint = Date.now();
        process.stdout.write(`\r     ${(lines / 1_000_000).toFixed(1)}M строк, найдено: ${result.size}`);
      }
      const c = line.split('\t');
      if (c.length < 4) return;
      const id = parseInt(c[1], 10);
      if (c[2].trim() === lang && c[3].trim() && targetIds.has(id) && !result.has(id)) {
        result.set(id, c[3].trim());
      }
    });
    rl.on('close', () => {
      process.stdout.write(`\r  ✅ Переводов: ${result.size} из ${lines.toLocaleString()} строк\n`);
      resolve(result);
    });
    rl.on('error', reject);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// parseCitiesFile
// ─────────────────────────────────────────────────────────────────────────────
interface RawCity {
  geonames_id: number; name_en: string; country_code: string;
  region: string; lat: number; lon: number; population: number; timezone: string;
}

function parseCitiesFile(filePath: string): RawCity[] {
  const result: RawCity[] = [];
  for (const line of fs.readFileSync(filePath, 'utf-8').split('\n')) {
    if (!line.trim()) continue;
    const c = line.split('\t');
    if (c.length < 19) continue;
    const geonames_id  = parseInt(c[0], 10);
    const name_en      = c[2].trim() || c[1].trim();
    const country_code = c[8].trim().toUpperCase();
    if (!geonames_id || !name_en || !country_code) continue;
    result.push({
      geonames_id, name_en, country_code,
      region: c[10].trim(),
      lat: parseFloat(c[4]), lon: parseFloat(c[5]),
      population: parseInt(c[14], 10) || 0,
      timezone: c[17].trim(),
    });
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🌍 GeoNames Seeder\n');
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

  // ── 1. Подключение ─────────────────────────────────────────────────────────
  console.log('📦 Подключение к БД...');
  console.log(`   ${process.env.POSTGRES_USER}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`);
  await client.connect();
  console.log('  ✅ Подключено\n');

  // ── 2. Создание таблиц ─────────────────────────────────────────────────────
  console.log('🏗  Создание таблиц...');
  await createTables();
  console.log();

  // ── 3. Файлы ───────────────────────────────────────────────────────────────
  console.log('📥 Файлы GeoNames...\n');
  const countryInfoPath = path.join(TMP_DIR, 'countryInfo.txt');
  const citiesZipPath   = path.join(TMP_DIR, 'cities1000.zip');
  const altNamesZipPath = path.join(TMP_DIR, 'alternateNames.zip');

  await downloadFile('http://download.geonames.org/export/dump/countryInfo.txt',    countryInfoPath);
  await downloadFile('http://download.geonames.org/export/dump/cities1000.zip',     citiesZipPath);
  await downloadFile('http://download.geonames.org/export/dump/alternateNames.zip', altNamesZipPath);
  console.log();

  // ── 4. Распаковка ──────────────────────────────────────────────────────────
  const citiesTxtPath   = extractZip(citiesZipPath,   TMP_DIR, 'cities1000.txt');
  const altNamesTxtPath = extractZip(altNamesZipPath, TMP_DIR, 'alternateNames.txt');
  console.log();

  // ── 5. Парсинг ─────────────────────────────────────────────────────────────
  console.log('🗺  Парсинг стран...');
  const rawCountries = parseCountryInfo(countryInfoPath);
  console.log(`  ✅ Стран: ${rawCountries.length}`);

  console.log('🏙  Парсинг городов...');
  const rawCities = parseCitiesFile(citiesTxtPath);
  console.log(`  ✅ Городов: ${rawCities.length}\n`);

  // ── 6. Переводы ────────────────────────────────────────────────────────────
  console.log('🔤 Русские переводы...');
  const allIds = new Set<number>([
    ...rawCountries.map(c => c.geonames_id).filter(Boolean),
    ...rawCities.map(c => c.geonames_id),
  ]);
  const ruNames = await parseAlternateNames(altNamesTxtPath, allIds, 'ru');
  console.log();

  // ── 7. Сохранение стран ────────────────────────────────────────────────────
  console.log('💾 Сохранение стран...');
  for (const raw of rawCountries) {
    await client.query(`
      INSERT INTO countries (iso2, iso3, name_en, name_ru, geonames_id, phone_code, currency, continent)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (iso2) DO UPDATE SET
        iso3=EXCLUDED.iso3, name_en=EXCLUDED.name_en, name_ru=EXCLUDED.name_ru,
        geonames_id=EXCLUDED.geonames_id, phone_code=EXCLUDED.phone_code,
        currency=EXCLUDED.currency, continent=EXCLUDED.continent,
        updated_at=NOW()
    `, [
      raw.iso2, raw.iso3 || null, raw.name_en,
      raw.geonames_id ? (ruNames.get(raw.geonames_id) ?? null) : null,
      raw.geonames_id || null, raw.phone_code || null,
      raw.currency || null, raw.continent || null,
    ]);
  }
  console.log(`  ✅ Стран: ${rawCountries.length}`);

  // Map iso2 → id
  const { rows: countryRows } = await client.query('SELECT id, iso2 FROM countries');
  const countryIdByIso2 = new Map<string, number>(countryRows.map((r: any) => [r.iso2, r.id]));

  // ── 8. Сохранение городов батчами ──────────────────────────────────────────
  console.log('💾 Сохранение городов...');
  const BATCH = 500;
  let saved = 0, skipped = 0;

  for (let i = 0; i < rawCities.length; i += BATCH) {
    const batch = rawCities.slice(i, i + BATCH);
    const records: any[] = [];

    for (const raw of batch) {
      const country_id = countryIdByIso2.get(raw.country_code);
      if (!country_id) { skipped++; continue; }
      records.push([
        raw.geonames_id, raw.name_en,
        ruNames.get(raw.geonames_id) ?? null,
        country_id, raw.country_code,
        raw.region || null,
        isNaN(raw.lat) ? null : raw.lat,
        isNaN(raw.lon) ? null : raw.lon,
        isNaN(raw.population) ? 0 : raw.population,
        raw.timezone || null,
      ]);
    }

    if (records.length === 0) continue;

    // Формируем VALUES ($1,$2,...),($11,$12,...) динамически
    const cols = 10;
    const placeholders = records.map((_, ri) =>
      `(${Array.from({ length: cols }, (__, ci) => `$${ri * cols + ci + 1}`).join(',')})`
    ).join(',');

    await client.query(`
      INSERT INTO cities
        (geonames_id,name_en,name_ru,country_id,country_code,region,latitude,longitude,population,timezone)
      VALUES ${placeholders}
      ON CONFLICT (geonames_id) DO UPDATE SET
        name_en=EXCLUDED.name_en, name_ru=EXCLUDED.name_ru,
        country_id=EXCLUDED.country_id, country_code=EXCLUDED.country_code,
        region=EXCLUDED.region, latitude=EXCLUDED.latitude,
        longitude=EXCLUDED.longitude, population=EXCLUDED.population,
        timezone=EXCLUDED.timezone, updated_at=NOW()
    `, records.flat());

    saved += records.length;

    if (i % (BATCH * 20) === 0) {
      process.stdout.write(`\r  ⏳ ${Math.min(i + BATCH, rawCities.length).toLocaleString()} / ${rawCities.length.toLocaleString()}`);
    }
  }

  console.log(`\n  ✅ Городов: ${saved}`);
  if (skipped > 0) console.log(`  ⚠️  Пропущено: ${skipped}`);

  // ── 9. Итог ────────────────────────────────────────────────────────────────
  const { rows: [{ count: cCount }] } = await client.query('SELECT COUNT(*) FROM countries');
  const { rows: [{ count: ciCount }] } = await client.query('SELECT COUNT(*) FROM cities');
  console.log(`\n📊 Итого: стран ${cCount}, городов ${ciCount}`);
  console.log('✅ Готово!\n');

  await client.end();
}

seed().catch(async err => {
  console.error('\n❌ Ошибка:');
  console.error('  message:', err?.message  ?? '(нет)');
  console.error('  code   :', err?.code     ?? '(нет)');
  console.error('  detail :', err?.detail   ?? '(нет)');
  console.error('  hint   :', err?.hint     ?? '(нет)');
  if (!err?.message) console.error('  full err:', err);
  try { await client.end(); } catch {}
  process.exit(1);
});