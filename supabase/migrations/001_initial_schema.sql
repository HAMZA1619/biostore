-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  polar_customer_id TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  subscription_status TEXT DEFAULT 'inactive',
  polar_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stores
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  design_settings JSONB NOT NULL DEFAULT '{}',
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'fr', 'ar')),
  currency TEXT NOT NULL DEFAULT 'MAD',
  payment_methods TEXT[] DEFAULT '{cod}' CHECK (payment_methods = '{cod}'),
  is_published BOOLEAN NOT NULL DEFAULT false,
  custom_domain TEXT UNIQUE,
  domain_verified BOOLEAN NOT NULL DEFAULT false,
  ga_measurement_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stores_owner ON stores(owner_id);
CREATE INDEX idx_stores_slug ON stores(slug);
CREATE INDEX idx_stores_custom_domain ON stores(custom_domain) WHERE custom_domain IS NOT NULL;

-- Collections
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, slug)
);
CREATE INDEX idx_collections_store ON collections(store_id);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  sku TEXT,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  image_urls TEXT[] DEFAULT '{}' CHECK (array_length(image_urls, 1) IS NULL OR array_length(image_urls, 1) <= 20),
  options JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft')),
  stock INTEGER,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_collection ON products(collection_id);

-- Product Variants
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  options JSONB NOT NULL DEFAULT '{}',
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  stock INTEGER,
  sku TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_variants_product ON product_variants(product_id);

-- Discounts (coupon codes + automatic discounts)
CREATE TABLE discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'code' CHECK (type IN ('code')),
  code TEXT,
  label TEXT DEFAULT '',
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_order_amount DECIMAL(10,2),
  max_uses INTEGER,
  max_uses_per_customer INTEGER,
  times_used INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_discounts_code ON discounts(store_id, code) WHERE code IS NOT NULL;
CREATE INDEX idx_discounts_store ON discounts(store_id);
CREATE INDEX idx_discounts_active ON discounts(store_id, is_active) WHERE is_active = true;

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_number SERIAL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_city TEXT,
  customer_country TEXT NOT NULL DEFAULT 'Unknown',
  customer_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'canceled')),
  payment_method TEXT NOT NULL DEFAULT 'cod' CHECK (payment_method = 'cod'),
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  discount_id UUID REFERENCES discounts(id) ON DELETE SET NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  note TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(store_id, status);
CREATE INDEX idx_orders_created_at ON orders(store_id, created_at DESC);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  variant_options JSONB,
  quantity INTEGER NOT NULL DEFAULT 1,
  image_url TEXT
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Store Views Hourly (aggregated visitor tracking — one row per store per hour)
CREATE TABLE store_views_hourly (
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  view_hour TIMESTAMPTZ NOT NULL DEFAULT date_trunc('hour', now()),
  view_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (store_id, view_hour)
);

-- Store Images (central gallery)
CREATE TABLE store_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_store_images_store ON store_images(store_id);

-- Increment discount usage counter (atomic)
CREATE OR REPLACE FUNCTION public.increment_discount_usage(p_discount_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.discounts
  SET times_used = times_used + 1
  WHERE id = p_discount_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Increment store view (atomic upsert for hourly counter)
CREATE OR REPLACE FUNCTION public.increment_store_view(p_store_id UUID, p_hour TIMESTAMPTZ)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.store_views_hourly (store_id, view_hour, view_count)
  VALUES (p_store_id, p_hour, 1)
  ON CONFLICT (store_id, view_hour)
  DO UPDATE SET view_count = store_views_hourly.view_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, subscription_status, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'trialing',
    now() + interval '3 days'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING ((select auth.uid()) = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING ((select auth.uid()) = id);

-- Stores
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published stores" ON stores FOR SELECT USING (is_published = true);
CREATE POLICY "Owners can view own stores" ON stores FOR SELECT USING ((select auth.uid()) = owner_id);
CREATE POLICY "Owners can insert stores" ON stores FOR INSERT WITH CHECK ((select auth.uid()) = owner_id);
CREATE POLICY "Owners can update own stores" ON stores FOR UPDATE USING ((select auth.uid()) = owner_id);
CREATE POLICY "Owners can delete own stores" ON stores FOR DELETE USING ((select auth.uid()) = owner_id);

-- Products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view products of published stores" ON products FOR SELECT
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND (stores.is_published = true OR stores.owner_id = (select auth.uid()))));
CREATE POLICY "Owners can insert products" ON products FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.owner_id = (select auth.uid())));
CREATE POLICY "Owners can update products" ON products FOR UPDATE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.owner_id = (select auth.uid())));
CREATE POLICY "Owners can delete products" ON products FOR DELETE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.owner_id = (select auth.uid())));

-- Product Variants
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view variants of published stores" ON product_variants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM products JOIN stores ON stores.id = products.store_id
    WHERE products.id = product_variants.product_id AND (stores.is_published = true OR stores.owner_id = (select auth.uid()))
  ));
CREATE POLICY "Owners can insert variants" ON product_variants FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM products JOIN stores ON stores.id = products.store_id
    WHERE products.id = product_variants.product_id AND stores.owner_id = (select auth.uid())
  ));
CREATE POLICY "Owners can update variants" ON product_variants FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM products JOIN stores ON stores.id = products.store_id
    WHERE products.id = product_variants.product_id AND stores.owner_id = (select auth.uid())
  ));
CREATE POLICY "Owners can delete variants" ON product_variants FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM products JOIN stores ON stores.id = products.store_id
    WHERE products.id = product_variants.product_id AND stores.owner_id = (select auth.uid())
  ));

-- Collections
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view collections of published stores" ON collections FOR SELECT
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = collections.store_id AND (stores.is_published = true OR stores.owner_id = (select auth.uid()))));
CREATE POLICY "Owners can insert collections" ON collections FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = collections.store_id AND stores.owner_id = (select auth.uid())));
CREATE POLICY "Owners can update collections" ON collections FOR UPDATE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = collections.store_id AND stores.owner_id = (select auth.uid())));
CREATE POLICY "Owners can delete collections" ON collections FOR DELETE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = collections.store_id AND stores.owner_id = (select auth.uid())));

-- Discounts
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active discounts of published stores" ON discounts FOR SELECT
  USING (is_active = true AND EXISTS (SELECT 1 FROM stores WHERE stores.id = discounts.store_id AND stores.is_published = true));
CREATE POLICY "Owners can view own discounts" ON discounts FOR SELECT
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = discounts.store_id AND stores.owner_id = (select auth.uid())));
CREATE POLICY "Owners can insert discounts" ON discounts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = discounts.store_id AND stores.owner_id = (select auth.uid())));
CREATE POLICY "Owners can update discounts" ON discounts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = discounts.store_id AND stores.owner_id = (select auth.uid())));
CREATE POLICY "Owners can delete discounts" ON discounts FOR DELETE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = discounts.store_id AND stores.owner_id = (select auth.uid())));

-- Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can place orders" ON orders FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.is_published = true));
CREATE POLICY "Owners can view orders" ON orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = (select auth.uid())));
CREATE POLICY "Owners can update orders" ON orders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = (select auth.uid())));

-- Order Items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert order items" ON order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders
    JOIN stores ON stores.id = orders.store_id
    WHERE orders.id = order_items.order_id AND stores.is_published = true
  ));
CREATE POLICY "Owners can view order items" ON order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders
    JOIN stores ON stores.id = orders.store_id
    WHERE orders.id = order_items.order_id AND stores.owner_id = (select auth.uid())
  ));

-- Store Views Hourly
ALTER TABLE store_views_hourly ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can upsert store views" ON store_views_hourly FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_views_hourly.store_id AND stores.is_published = true));
CREATE POLICY "Anyone can update store views" ON store_views_hourly FOR UPDATE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_views_hourly.store_id AND stores.is_published = true));
CREATE POLICY "Owners can view store views" ON store_views_hourly FOR SELECT
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_views_hourly.store_id AND stores.owner_id = (select auth.uid())));

-- Store Images
ALTER TABLE store_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view own store images" ON store_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_images.store_id AND stores.owner_id = (select auth.uid())));
CREATE POLICY "Public can view images of published stores" ON store_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_images.store_id AND stores.is_published = true));
CREATE POLICY "Owners can insert store images" ON store_images FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_images.store_id AND stores.owner_id = (select auth.uid())));
CREATE POLICY "Owners can delete store images" ON store_images FOR DELETE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_images.store_id AND stores.owner_id = (select auth.uid())));

-- Store Integrations (installed apps per store)
CREATE TABLE store_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  integration_id TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, integration_id)
);
CREATE INDEX idx_store_integrations_store ON store_integrations(store_id);

ALTER TABLE store_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view own integrations" ON store_integrations FOR SELECT
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_integrations.store_id AND stores.owner_id = (select auth.uid())));
CREATE POLICY "Owners can insert integrations" ON store_integrations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_integrations.store_id AND stores.owner_id = (select auth.uid())));
CREATE POLICY "Owners can update integrations" ON store_integrations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_integrations.store_id AND stores.owner_id = (select auth.uid())));
CREATE POLICY "Owners can delete integrations" ON store_integrations FOR DELETE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_integrations.store_id AND stores.owner_id = (select auth.uid())));

-- Integration Events (event log for webhook dispatch)
CREATE TABLE integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  integration_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_integration_events_store ON integration_events(store_id);
CREATE INDEX idx_integration_events_status ON integration_events(status) WHERE status = 'pending';

ALTER TABLE integration_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view own events" ON integration_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = integration_events.store_id AND stores.owner_id = (select auth.uid())));

-- Trigger: log event when order is created
CREATE OR REPLACE FUNCTION public.handle_order_created()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.store_integrations
    WHERE store_id = NEW.store_id
  ) THEN
    INSERT INTO public.integration_events (store_id, integration_id, event_type, payload)
    VALUES (
      NEW.store_id,
      '_trigger',
      'order.created',
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'store_id', NEW.store_id,
        'customer_name', NEW.customer_name,
        'customer_phone', NEW.customer_phone,
        'customer_email', NEW.customer_email,
        'customer_city', NEW.customer_city,
        'customer_country', NEW.customer_country,
        'customer_address', NEW.customer_address,
        'status', NEW.status,
        'total', NEW.total,
        'subtotal', NEW.subtotal,
        'discount_id', NEW.discount_id,
        'discount_amount', NEW.discount_amount,
        'note', NEW.note,
        'ip_address', NEW.ip_address,
        'created_at', NEW.created_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER on_order_created
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_created();

-- Trigger: log event when order status changes
CREATE OR REPLACE FUNCTION public.handle_order_status_changed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF EXISTS (
      SELECT 1 FROM public.store_integrations
      WHERE store_id = NEW.store_id
    ) THEN
      INSERT INTO public.integration_events (store_id, integration_id, event_type, payload)
      VALUES (
        NEW.store_id,
        '_trigger',
        'order.status_changed',
        jsonb_build_object(
          'order_id', NEW.id,
          'order_number', NEW.order_number,
          'store_id', NEW.store_id,
          'customer_name', NEW.customer_name,
          'customer_phone', NEW.customer_phone,
          'customer_email', NEW.customer_email,
          'customer_country', NEW.customer_country,
          'customer_city', NEW.customer_city,
          'customer_address', NEW.customer_address,
          'old_status', OLD.status,
          'new_status', NEW.status,
          'total', NEW.total,
          'subtotal', NEW.subtotal,
          'discount_id', NEW.discount_id,
          'discount_amount', NEW.discount_amount,
          'ip_address', NEW.ip_address,
          'updated_at', now()
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER on_order_status_changed
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_status_changed();

-- ===================================================
-- Abandoned Checkouts (checkout recovery tracking)
-- ===================================================

CREATE TABLE abandoned_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_country TEXT,
  customer_city TEXT,
  customer_address TEXT,
  cart_items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'recovered', 'expired')),
  recovered_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_abandoned_checkouts_store_phone
  ON abandoned_checkouts(store_id, customer_phone)
  WHERE status = 'pending' OR status = 'sent';

CREATE INDEX idx_abandoned_checkouts_store ON abandoned_checkouts(store_id);
CREATE INDEX idx_abandoned_checkouts_status ON abandoned_checkouts(status, created_at)
  WHERE status = 'pending';

ALTER TABLE abandoned_checkouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view abandoned checkouts" ON abandoned_checkouts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = abandoned_checkouts.store_id
    AND stores.owner_id = (select auth.uid())
  ));

CREATE POLICY "Owners can update abandoned checkouts" ON abandoned_checkouts
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = abandoned_checkouts.store_id
    AND stores.owner_id = (select auth.uid())
  ));

CREATE POLICY "Anyone can create abandoned checkouts" ON abandoned_checkouts
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = abandoned_checkouts.store_id
    AND stores.is_published = true
  ));

CREATE OR REPLACE FUNCTION public.upsert_abandoned_checkout(
  p_store_id UUID,
  p_customer_phone TEXT,
  p_customer_name TEXT DEFAULT NULL,
  p_customer_email TEXT DEFAULT NULL,
  p_customer_country TEXT DEFAULT NULL,
  p_customer_city TEXT DEFAULT NULL,
  p_customer_address TEXT DEFAULT NULL,
  p_cart_items JSONB DEFAULT '[]',
  p_subtotal DECIMAL DEFAULT 0,
  p_total DECIMAL DEFAULT 0,
  p_currency TEXT DEFAULT 'MAD'
) RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO public.abandoned_checkouts (
    store_id, customer_phone, customer_name, customer_email,
    customer_country, customer_city, customer_address,
    cart_items, subtotal, total, currency, status, updated_at
  ) VALUES (
    p_store_id, p_customer_phone, p_customer_name, p_customer_email,
    p_customer_country, p_customer_city, p_customer_address,
    p_cart_items, p_subtotal, p_total, p_currency, 'pending', now()
  )
  ON CONFLICT (store_id, customer_phone)
    WHERE status = 'pending' OR status = 'sent'
  DO UPDATE SET
    customer_name = COALESCE(EXCLUDED.customer_name, abandoned_checkouts.customer_name),
    customer_email = COALESCE(EXCLUDED.customer_email, abandoned_checkouts.customer_email),
    customer_country = COALESCE(EXCLUDED.customer_country, abandoned_checkouts.customer_country),
    customer_city = COALESCE(EXCLUDED.customer_city, abandoned_checkouts.customer_city),
    customer_address = COALESCE(EXCLUDED.customer_address, abandoned_checkouts.customer_address),
    cart_items = EXCLUDED.cart_items,
    subtotal = EXCLUDED.subtotal,
    total = EXCLUDED.total,
    currency = EXCLUDED.currency,
    status = 'pending',
    updated_at = now()
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

GRANT EXECUTE ON FUNCTION public.upsert_abandoned_checkout TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_abandoned_checkout TO authenticated;
