# Deep Code Analysis Report — GalleryTema Server

**Date:** 2026-07-20  
**Scope:** 9 source files in `server/src/`  
**Status:** ⚠️ Multiple files are syntactically broken due to code corruption

---

## Summary

The codebase follows a NestJS + Sequelize architecture but suffers from **severe file corruption** in 3 of 9 analyzed files (`auth.service.ts`, `app.module.ts`, `subscription.service.ts`), duplicated business logic across services, unsafe defaults, missing input validation, and several security/performance anti-patterns. Immediate repair of corrupted files is required before any further work.

---

## Inputs Reviewed

| # | File | Status |
|---|------|--------|
| 1 | `artists/artists.service.ts` | Readable, many issues |
| 2 | `arts/arts.service.ts` | Corrupted at line ~290 |
| 3 | `auth/auth.service.ts` | **Severely corrupted** — mixed with Nominatim/location code |
| 4 | `users/users.service.ts` | Readable, medium issues |
| 5 | `location/location.service.ts` | Readable, minor issues |
| 6 | `files/files.service.ts` | Readable, security concerns |
| 7 | `app.module.ts` | **Severely corrupted** — mixed with location/main code |
| 8 | `main.ts` | Readable, security gaps |
| 9 | `artists/subscription.service.ts` | **Corrupted** — mixed with `artist.model.ts` content |

---

## Critical Issues

### 1. 🚨 Files Are Syntactically Broken (Build Will Fail)

#### `auth/auth.service.ts`

| Line | Issue |
|------|-------|
| **~40–63** | Constructor body is truncated mid-statement: `@InjectModel(RefreshToken) private tokenRepository: typeof RefreshToken, @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger ) { }` — followed by dangling fragment `async signAccessToken(userId: number, email: string, role: string): Promise<string> { return this.jwtService.signAsync({ sub: userId, email, role }, { secret: this.config.get("JWT_REFRESH_SECRET"), expiresIn: '7d' } as any,) }` — this is actually the **refresh token** signer, not access token. Missing access token implementation. |
| **~75–120** | Inside `fetchCountryFromNominatim` (which does **not belong** in `auth.service.ts`), there are fragments like `const tokenRecord = await ...`, `if (!tokenRecord)`, `const tokenMatch = await bcrypt.compare(...)` — these appear to be paste errors where location/Nominatim code was merged into auth. |
| **`COOKIE_BASE.secure`** | Set to `process.env.NODE_ENV === "production"` but later `res.cookie('accessToken', ..., { ...COOKIE_BASE, secure: false })` explicitly disables HTTPS for access token cookie — defeats the purpose. |

**Fix:** Reconstruct `auth.service.ts` from version control. The file currently contains a mix of auth logic and Nominatim geocoding code that belongs in `location.service.ts`.

#### `app.module.ts`

| Line | Issue |
|------|-------|
| **~48–53** | Contains foreign code: `ArtTag, City, Country], autoLoadModels: true, logging: console.log, query: { raw: true }, synchronize: true` — this is Sequelize config mixed with model import list. |
| **~57–72** | Contains `UsersModule, ArtsModule, AuthModule...` imports but these are placed **inside the SequelizeModule.forRoot() options object**, not in the module `imports` array. |
| **`autoLoadModels: true` + explicit `models: [...]`** | Contradictory — Sequelize will load models both ways, causing duplicates. |
| **`logging: console.log`** | Every SQL query printed to stdout in **all environments**. Major performance and log-noise issue. |
| **`synchronize: true`** | Dangerous in production — Sequelize will alter/drop tables on every app start. |

**Fix:** Split Sequelize config into a separate `sequelize.config.ts` or use `SequelizeModule.forRootAsync`, remove `synchronize`, disable logging in production, fix module imports structure.

#### `subscription.service.ts`

| Line | Issue |
|------|-------|
| **~13** | File content is mixed with `artist.model.ts`: `'📊 Расширенная статистика'`, `'⚡ Приоритетная загрузка'`, `'👑 VIP-значок'` — feature strings from `ArtistProfile.getAvailableFeatures()` are pasted into the subscription service. |
| **Whole file** | Cannot fully assess due to corruption. |

**Fix:** Restore from VCS. The feature strings belong in `artist.model.ts`, not here.

#### `arts/arts.service.ts`

| Line | Issue |
|------|-------|
| **~290–300** | `enrichWithLocationBatch` is truncated: `private async enrichWithLocationBatch(arts: any[], lang: Lang) { ... return arts.map(art => ({ ...art, city: art.city_id ? citiesMap.get(Number(art.city_id)) || null : null, country: art.country_id ? countriesMap.get(Number(art.country_id)) || null : null })); }` — the middle of the function is missing (the country/city fetching loop). |

**Fix:** Reconstruct the batch enrichment logic.

---

### 2. 🔴 Security Issues

#### Weak Password Hashing Cost

| File | Line | Issue |
|------|------|-------|
| `artists.service.ts` | **31** | `bcrypt.hash(dto.password, 5)` — cost factor 5 is **critically weak**. Minimum recommended is 10. |
| `auth/auth.service.ts` | (corrupted) | Uses `passwordService.hashPassword` which may be correct, but verify cost factor there too. |

**Fix:** Use cost factor ≥ 10. The `PasswordService` likely centralizes this — confirm and align `artists.service.ts` to use it.

#### CORS Allows All Origins with Credentials

| File | Line | Issue |
|------|-------|
| `main.ts` | **8** | `app.enableCors({ origin: true, credentials: true })` — `origin: true` reflects any origin. Combined with `credentials: true`, this allows any website to make authenticated requests. |

**Fix:** Whitelist specific origins: `origin: ['https://yoursite.com']`.

#### Path Traversal in File Deletion

| File | Line | Issue |
|------|-------|
| `files/files.service.ts` | **67–69** | `const fileName = fileURL.split('/').pop() || ""; const filePath = path.join(staticDir, fileName);` — if `fileURL` is `../../../etc/passwd`, `path.join` could resolve outside `staticDir` depending on OS. While `.pop()` mitigates this somewhat, it's not robust. |

**Fix:** Validate resolved path stays within `staticDir` using `path.resolve` and prefix check.

#### No File Type / Size Validation

| File | Line | Issue |
|------|-------|
| `files/files.service.ts` | **22** | `const fileExtension = file.originalname?.split('.').pop() || 'jpg';` — any file type accepted, default is `jpg` which is misleading. No MIME validation, no size limit. |

**Fix:** Allowlist image extensions (jpg, png, gif, webp), check MIME type, enforce max size (e.g., 10MB).

#### Hardcoded Admin Credentials Fallback

| File | Line | Issue |
|------|-------|
| `users.service.ts` | **139–140** | `const adminEmail = process.env.ADMIN_EMAIL \|\| 'admin@mail.ru'; const adminPassword = process.env.ADMIN_PASSWORD \|\| 'admin';` — if env vars are missing, creates an admin with password `admin`. |

**Fix:** Throw an error if ADMIN_PASSWORD is not set. Never fall back to a known default password.

#### JWT Secret from Config Without Validation

| File | Line | Issue |
|------|-------|
| `auth/auth.service.ts` | (corrupted) | `this.config.get("JWT_ACCESS_SECRET")` — if missing, JWT signs with `undefined` secret, which is insecure. |

**Fix:** Use `config.getOrThrow<string>("JWT_ACCESS_SECRET")`.

---

### 3. 🟠 Performance Problems

#### N+1 Queries in Artist Stats

| File | Line | Issue |
|------|-------|
| `artists.service.ts` | **93–97** | `getArtistStats(artistId)` runs 2 queries per artist (count + findAll for likes). Called inside `Promise.all` for each moderated/top artist → O(n) DB round trips. |

**Fix:** Batch-fetch stats: one `COUNT` and one `SUM(likes)` grouped by `artist_id`.

#### Duplicated Scoring Logic

| File | Lines | Issue |
|------|-------|-------|
| `artists.service.ts` | **155–170** and **587–603** | `getModeratedArtists` and `getTopArtists` contain near-identical scoring blocks (parse moderate, fetch stats, calculate score). |
| `arts.service.ts` | `calculateScore` | Similar scoring exists for arts. Consider a shared scoring utility. |

**Fix:** Extract to `calculateArtistScore(profile, stats)` helper.

#### Inefficient Moderation Query

| File | Line | Issue |
|------|-------|
| `artists.service.ts` | **137–143** | `where: { moderate: { [Op.ne]: null, is_deleted: false } }` — the `is_deleted` condition on a JSON string column `moderate` is meaningless; `is_deleted` is a separate boolean column on `ArtistProfile`. Also, `moderate` is stored as a **JSON string**, so `[Op.ne]: null` checks if the string column is not NULL, not if the parsed JSON has `moderate: true`. |

**Fix:** Store moderation as structured columns or use a proper enum/status field with database index.

#### Full Table Scan in `checkAllSubscriptions`

| File | Line | Issue |
|------|-------|
| `subscription.service.ts` | **78** | `await this.artistProfileModel.findAll()` — loads **all** profiles into memory, then iterates. For thousands of artists this is expensive. |

**Fix:** Only fetch profiles where `plan !== 'free'` and `planExpiresAt IS NOT NULL`, or use a cron job with batched updates.

#### `updateAllScores` Loads All Arts

| File | Line | Issue |
|------|-------|
| `arts.service.ts` | ~257 | `const arts = await this.artRepository.findAll();` — loads every art instance, then calls `calculateScore` (which does another query per art for the artist profile). |

**Fix:** Batch-fetch artist plans and compute scores in a single pass, or use a cron job.

---

### 4. 🟡 Architecture & Design Issues

#### JSON Strings for Structured Data

| File | Line | Issue |
|------|-------|
| `artists.service.ts` | **53**, **413** | `moderate: JSON.stringify({...})` stored in a TEXT column. This prevents efficient querying, indexing, validation, and type safety. |
| `arts.service.ts` | ~80, ~230 | Same pattern for art moderation. |

**Fix:** Replace with proper columns: `moderation_status` (ENUM: pending/approved/rejected), `moderator_id`, `moderated_at`, `moderation_comment`, `moderation_errors` (JSONB if needed).

#### Service Layer Responsibilities Confused

| File | Line | Issue |
|------|-------|
| `auth.service.ts` | Mixed with Nominatim/location code | Authentication service contains geocoding fallback logic that belongs in `LocationService`. |

#### Tight Coupling: ArtistsService Depends on Art, Genre, Style Directly

| File | Line | Issue |
|------|-------|
| `artists.service.ts` | **17–24** | Injects `Art`, `Genre`, `Style` models directly. The artists service now knows about art internals. Consider a dedicated `ArtistDashboardService` or expose art data through a query service. |

#### Duplicate Location Validation

| File | Lines | Issue |
|------|-------|
| `users.service.ts` | **36–43** |
| `artists.service.ts` | (via DTO, similar pattern) |
| `arts.service.ts` | **33–43** |

Each service independently validates `country_id` and `city_id` by calling `LocationService`. This should be centralized in a pipe or a shared validator.

#### Missing Transactions in Non-Critical Paths

| File | Line | Issue |
|------|-------|
| `users.service.ts` | **99–102** | `deleteUserById` updates user and artistProfile in two separate operations without a transaction. If the second fails, data is inconsistent. |
| `arts.service.ts` | ~221 | `updateArt` updates art and tags without a transaction. |

---

### 5. 🟡 Code Quality & Duplication

#### `buildPagination` Duplicated

Defined in both `artists.service.ts` (~486) and `arts.service.ts` (~286) and likely elsewhere. Create a shared `PaginationHelper`.

#### `handleError` / Logging Patterns Duplicated

Every service has its own `handleError(method, error)` with nearly identical structure. Extract to a base service or utility.

#### `parseModerate` Duplicated

| File | Lines |
|------|-------|
| `artists.service.ts` | ~470 |
| `arts.service.ts` | ~265 |

Same try/catch JSON.parse logic. Extract to `parseJsonField<string>(value: string): T | null`.

#### Typo: `fileSerivce` vs `fileService`

| File | Line | Issue |
|------|-------|-------|
| `artists.service.ts` | **23**, **30**, **56**, etc. | Property is `fileSerivce` (missing 'r'). Inconsistent with `files.service.ts` export and all other services. |

#### Inconsistent Return Shapes

| Endpoint | Returns |
|----------|---------|
| `getAll()` (artists) | `{ data, pagination }` |
| `getModeratedArtists()` (artists) | `{ data, pagination }` |
| `getAllArts()` (arts) | `{ arts, pagination }` |
| `getModeratedArts()` (arts) | `{ arts, pagination }` |
| `getArtById()` | Single object or `null` |

No unified API response format. Clients must know which endpoint uses `data` vs `arts`.

#### `any` Types Used Extensively

| File | Lines |
|------|-------|
| `artists.service.ts` | **30** `image: any`, **463** `user: any`, **478** `userIds: number[]` returns Map with `any` |
| `arts.service.ts` | Throughout |
| `files.service.ts` | **15** `file: any` |
| `users.service.ts` | **83** `updateData: any` |

**Fix:** Define DTO types, file upload types (`Multer.File`), and result interfaces.

---

### 6. 🟡 Missing Validation & Error Handling

| File | Line | Issue |
|------|-------|-------|
| `artists.service.ts` | **42** | `dto.gender as 'M' \| 'F'` — runtime cast without validation. Any string passes. |
| `artists.service.ts` | **50** | `dto.second_name \``\` \|\| ''` — falsy values like `0` or `"0"` become empty string. |
| `users.service.ts` | **83–93** | Update builder checks `if (dto.name)` — empty string won't update but also won't clear. No way to set name to `''`. |
| `files/service.ts` | **22** | No validation that `file.buffer` exists before writing. |
| `auth.service.ts` | (corrupted) | No rate limiting on login/register endpoints visible. |

---

### 7. 🟡 Potential Bugs

| File | Line | Bug |
|------|-------|-----|
| `artists.service.ts` | **137–143** | `include: [{ model: ArtistProfile, where: { moderate: { [Op.ne]: null, is_deleted: false } } }]` — `is_deleted` is applied to the **included** `ArtistProfile` model, not filtered correctly because `moderate` is a JSON string, not an object. The intent seems to be "artists whose moderate JSON has `moderate: true`" but the query doesn't do that. |
| `artists.service.ts` | **155–160** | `profile.moderate` is parsed with `JSON.parse` inside `Promise.all` — if the JSON is malformed, it silently treats the artist as not moderated. No logging. |
| `arts.service.ts` | ~221 | `updateArt` does NOT use a transaction when updating art + tags. Concurrent updates can corrupt state. |
| `users.service.ts` | **113** | `permanentDeleteUser` deletes artistProfile and user but **does not delete associated arts, views, or files**. Orphaned data. |
| `subscription.service.ts` | (corrupted) | Cannot verify `purchaseSubscription` doesn't allow downgrading or self-renewal edge cases. |
| `main.ts` | **8** | `origin: true` with `credentials: true` is a CSRF-adjacent risk. |

---

### 8. 🟡 Naming & Convention Issues

| Issue | Location |
|-------|----------|
| `fileSerivce` typo | `artists.service.ts:23` |
| `signRefershToken` typo ("Refersh" → "Refresh") | `auth.service.ts` (corrupted) |
| `modarate-artist.dto.ts` (modarate → moderate) | `artists/dto/` |
| `UpdateuserDto` (capitalization) | `users/dto/update-user.dto.ts` |
| `planTypes` (lowercase p) vs NestJS convention | `artist.model.ts:8` |
| Mixed Russian/English in logs and error messages | Throughout |
| Emoji in production log messages (`✅`, `❌`, `📋`) | `artists.service.ts`, `users.service.ts` — fine for dev, noisy for log parsing. |

---

## Recommendations

### Immediate (P0)

1. **Restore corrupted files from Git/VCS:**
   - `auth/auth.service.ts` — reconstruct fully, remove Nominatim code
   - `app.module.ts` — fix module structure, remove `synchronize: true`, disable SQL logging
   - `subscription.service.ts` — restore, remove model content
   - `arts/arts.service.ts` — reconstruct `enrichWithLocationBatch`

2. **Set bcrypt cost to ≥ 10** everywhere.

3. **Restrict CORS origins** to known domains.

4. **Remove hardcoded admin password fallback** in `users.service.ts`.

5. **Add file type/size validation** in `files.service.ts`.

### Short-term (P1)

6. Extract shared helpers: `buildPagination`, `parseJsonField`, `handleError`, `validateLocation`.
7. Replace JSON-string `moderate` with proper database columns.
8. Batch-fetch artist stats to eliminate N+1 queries.
9. Add transactions to `deleteUserById`, `updateArt`, and other multi-table operations.
10. Centralize location ID validation (custom NestJS pipe).
11. Fix naming typos: `fileSerivce`, `signRefershToken`, `modarate`, `UpdateuserDto`.

### Medium-term (P2)

12. Introduce a unified API response wrapper (`{ data, pagination, meta }`).
13. Add DTO validation decorators (`class-validator`) to all input.
14. Move scoring logic to a dedicated service/utility.
15. Use `SequelizeModule.forRootAsync` for environment-aware DB config.
16. Add rate limiting on auth endpoints.
17. Implement proper file storage (S3/Cloudinary) instead of local filesystem.
18. Add unit/integration tests for services.

---

## Action Items

- [ ] Restore `auth/auth.service.ts`, `app.module.ts`, `subscription.service.ts`, `arts/arts.service.ts` from version control
- [ ] Run `npm run build` to confirm current compilation failures
- [ ] Fix bcrypt cost factor globally
- [ ] Restrict CORS to whitelisted origins
- [ ] Remove `synchronize: true` and `logging: console.log` from Sequelize config
- [ ] Extract `buildPagination` and `parseModerate` to shared utilities
- [ ] Replace JSON `moderate` column with typed columns + indexes
- [ ] Refactor `getArtistStats` to batch query (GROUP BY)
- [ ] Add transactions to non-transactional multi-model updates
- [ ] Fix all naming typos
- [ ] Add DTO validation decorators
- [ ] Implement rate limiting on `/auth/login` and `/auth/register`
