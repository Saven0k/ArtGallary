CREATE TABLE IF NOT EXISTS promo_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  percent INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  "expiresAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'promo_codes'::regclass AND conname = 'promo_codes_code_format') THEN
    ALTER TABLE promo_codes ADD CONSTRAINT promo_codes_code_format CHECK (code ~ '^[A-Z0-9_-]{3,32}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'promo_codes'::regclass AND conname = 'promo_codes_percent_range') THEN
    ALTER TABLE promo_codes ADD CONSTRAINT promo_codes_percent_range CHECK (percent BETWEEN 1 AND 100);
  END IF;
END $$;

INSERT INTO promo_codes(code, percent, "createdAt", "updatedAt") VALUES
  ('SALE10', 10, NOW(), NOW()), ('SALE15', 15, NOW(), NOW()), ('ART20', 20, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;
