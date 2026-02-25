-- SQL Schema for Dadashri Designers Supabase Database
-- You can run these commands in the Supabase Dashboard -> SQL Editor

-- 1. Create the customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    "ordersCount" INTEGER DEFAULT 0,
    "totalSpent" NUMERIC DEFAULT 0,
    "lastOrderDate" TEXT,
    measurements JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    cloth_type TEXT,
    delivery_date TEXT,
    amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Received',
    is_urgent BOOLEAN DEFAULT false,
    quantity INTEGER DEFAULT 1,
    order_date TEXT,
    advance_paid NUMERIC DEFAULT 0,
    cloth_source TEXT DEFAULT 'Shop',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS) on both tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 4. Create policies to allow public reading and writing to these tables 
-- (Assuming for this app you want it openly readable/writable since you're using the publishable default key!)

-- Policy for customers table: Allow anyone to read, insert, update, delete
CREATE POLICY "Enable all actions for public" ON public.customers 
  FOR ALL 
  TO public 
  USING (true) 
  WITH CHECK (true);

-- Policy for orders table: Allow anyone to read, insert, update, delete
CREATE POLICY "Enable all actions for public" ON public.orders 
  FOR ALL 
  TO public 
  USING (true) 
  WITH CHECK (true);


