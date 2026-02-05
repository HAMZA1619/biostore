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
  theme TEXT DEFAULT 'default' CHECK (theme IN ('default', 'modern', 'minimal')),
  show_branding BOOLEAN NOT NULL DEFAULT true,
  currency TEXT NOT NULL DEFAULT 'MAD',
  delivery_note TEXT,
  payment_methods TEXT[] DEFAULT '{cod}',
  bank_details TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stores_owner ON stores(owner_id);
CREATE INDEX idx_stores_slug ON stores(slug);

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
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  product_type TEXT NOT NULL DEFAULT 'regular' CHECK (product_type IN ('regular', 'external')),
  external_url TEXT,
  image_urls TEXT[] DEFAULT '{}',
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_collection ON products(collection_id);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_number SERIAL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_city TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'canceled')),
  payment_method TEXT NOT NULL DEFAULT 'cod',
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
  product_name TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  image_url TEXT
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Stores
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published stores" ON stores FOR SELECT USING (is_published = true);
CREATE POLICY "Owners can view own stores" ON stores FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners can insert stores" ON stores FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update own stores" ON stores FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete own stores" ON stores FOR DELETE USING (auth.uid() = owner_id);

-- Products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view products of published stores" ON products FOR SELECT
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND (stores.is_published = true OR stores.owner_id = auth.uid())));
CREATE POLICY "Owners can insert products" ON products FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()));
CREATE POLICY "Owners can update products" ON products FOR UPDATE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()));
CREATE POLICY "Owners can delete products" ON products FOR DELETE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()));

-- Collections
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view collections of published stores" ON collections FOR SELECT
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = collections.store_id AND (stores.is_published = true OR stores.owner_id = auth.uid())));
CREATE POLICY "Owners can insert collections" ON collections FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = collections.store_id AND stores.owner_id = auth.uid()));
CREATE POLICY "Owners can update collections" ON collections FOR UPDATE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = collections.store_id AND stores.owner_id = auth.uid()));
CREATE POLICY "Owners can delete collections" ON collections FOR DELETE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = collections.store_id AND stores.owner_id = auth.uid()));

-- Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can place orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can view orders" ON orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()));
CREATE POLICY "Owners can update orders" ON orders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()));

-- Order Items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert order items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can view order items" ON order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders
    JOIN stores ON stores.id = orders.store_id
    WHERE orders.id = order_items.order_id AND stores.owner_id = auth.uid()
  ));
