CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS customers_name_trgm_idx
ON customers USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS customers_shop_name_trgm_idx
ON customers USING gin (shop_name gin_trgm_ops);
