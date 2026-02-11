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
  logo_url TEXT,
  banner_url TEXT,
  phone TEXT,
  city TEXT,
  primary_color TEXT DEFAULT '#000000',
  accent_color TEXT DEFAULT '#3B82F6',
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#111111',
  button_text_color TEXT DEFAULT '#ffffff',
  font_family TEXT DEFAULT 'Inter',
  border_radius TEXT DEFAULT 'md' CHECK (border_radius IN ('none', 'sm', 'md', 'lg', 'xl')),
  theme TEXT DEFAULT 'default' CHECK (theme IN ('default', 'modern', 'minimal', 'single')),
  show_branding BOOLEAN NOT NULL DEFAULT true,
  show_floating_cart BOOLEAN NOT NULL DEFAULT true,
  show_search BOOLEAN NOT NULL DEFAULT true,
  checkout_show_email BOOLEAN NOT NULL DEFAULT true,
  checkout_show_country BOOLEAN NOT NULL DEFAULT true,
  checkout_show_city BOOLEAN NOT NULL DEFAULT true,
  checkout_show_note BOOLEAN NOT NULL DEFAULT true,
  thank_you_message TEXT,
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'fr', 'ar')),
  currency TEXT NOT NULL DEFAULT 'MAD',
  payment_methods TEXT[] DEFAULT '{cod}' CHECK (payment_methods = '{cod}'),
  is_published BOOLEAN NOT NULL DEFAULT false,
  custom_domain TEXT UNIQUE,
  domain_verified BOOLEAN NOT NULL DEFAULT false,
  ga_measurement_id TEXT,
  fb_pixel_id TEXT,
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
  total DECIMAL(10,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(store_id, status);

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

-- Store Views (visitor tracking)
CREATE TABLE store_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_store_views_store ON store_views(store_id);
CREATE INDEX idx_store_views_date ON store_views(store_id, viewed_at);

-- Store Images (central gallery)
CREATE TABLE store_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_store_images_store ON store_images(store_id);

-- Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
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
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id));
CREATE POLICY "Owners can view order items" ON order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders
    JOIN stores ON stores.id = orders.store_id
    WHERE orders.id = order_items.order_id AND stores.owner_id = (select auth.uid())
  ));

-- Store Views
ALTER TABLE store_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert store views" ON store_views FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_views.store_id AND stores.is_published = true));
CREATE POLICY "Owners can view store views" ON store_views FOR SELECT
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_views.store_id AND stores.owner_id = (select auth.uid())));

-- Store Images
ALTER TABLE store_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view own store images" ON store_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_images.store_id AND stores.owner_id = (select auth.uid())));
CREATE POLICY "Owners can insert store images" ON store_images FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_images.store_id AND stores.owner_id = (select auth.uid())));
CREATE POLICY "Owners can delete store images" ON store_images FOR DELETE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_images.store_id AND stores.owner_id = (select auth.uid())));

-- Store FAQs (custom Q&A for AI assistant)
CREATE TABLE store_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_store_faqs_store ON store_faqs(store_id);

ALTER TABLE store_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view own faqs" ON store_faqs FOR SELECT
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_faqs.store_id AND stores.owner_id = (select auth.uid())));
CREATE POLICY "Owners can insert faqs" ON store_faqs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_faqs.store_id AND stores.owner_id = (select auth.uid())));
CREATE POLICY "Owners can update faqs" ON store_faqs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_faqs.store_id AND stores.owner_id = (select auth.uid())));
CREATE POLICY "Owners can delete faqs" ON store_faqs FOR DELETE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_faqs.store_id AND stores.owner_id = (select auth.uid())));

-- Store Integrations (installed apps per store)
CREATE TABLE store_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  integration_id TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, integration_id)
);
CREATE INDEX idx_store_integrations_store ON store_integrations(store_id);
CREATE INDEX idx_store_integrations_enabled ON store_integrations(store_id, is_enabled) WHERE is_enabled = true;

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
    WHERE store_id = NEW.store_id AND is_enabled = true
  ) THEN
    INSERT INTO public.integration_events (store_id, event_type, payload)
    VALUES (
      NEW.store_id,
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
        'note', NEW.note,
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
      WHERE store_id = NEW.store_id AND is_enabled = true
    ) THEN
      INSERT INTO public.integration_events (store_id, event_type, payload)
      VALUES (
        NEW.store_id,
        'order.status_changed',
        jsonb_build_object(
          'order_id', NEW.id,
          'order_number', NEW.order_number,
          'store_id', NEW.store_id,
          'customer_name', NEW.customer_name,
          'customer_phone', NEW.customer_phone,
          'customer_country', NEW.customer_country,
          'customer_city', NEW.customer_city,
          'customer_address', NEW.customer_address,
          'old_status', OLD.status,
          'new_status', NEW.status,
          'total', NEW.total,
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
