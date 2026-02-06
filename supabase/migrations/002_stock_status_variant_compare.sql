-- Add status to products (replaces is_available for draft/active)
ALTER TABLE products ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft'));

-- Migrate existing data: is_available=false → draft
UPDATE products SET status = 'draft' WHERE is_available = false;

-- Add stock to products (nullable = unlimited/untracked)
ALTER TABLE products ADD COLUMN stock INTEGER;

-- Add compare_at_price and stock to product_variants
ALTER TABLE product_variants ADD COLUMN compare_at_price DECIMAL(10,2);
ALTER TABLE product_variants ADD COLUMN stock INTEGER;
