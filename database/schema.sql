BEGIN;

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'client', 'end_user', 'agent'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE account_status AS ENUM ('active', 'pending', 'blocked', 'deleted'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE order_status AS ENUM ('new', 'assigned', 'in_progress', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('created', 'authorized', 'captured', 'failed', 'refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  mobile varchar(24) NOT NULL UNIQUE,
  name varchar(120) NOT NULL DEFAULT '',
  status account_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (left(mobile,1)='+' AND substring(mobile from 2) ~ '^[1-9][0-9]{7,14}$')
);

CREATE TABLE IF NOT EXISTS admins (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_login_at timestamptz
);

CREATE TABLE IF NOT EXISTS clients (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  business_name varchar(160) NOT NULL DEFAULT '',
  service_description text NOT NULL DEFAULT '',
  latitude double precision,
  longitude double precision,
  radius_km numeric(6,2) NOT NULL DEFAULT 3 CHECK (radius_km > 0 AND radius_km <= 100),
  is_online boolean NOT NULL DEFAULT false,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180))
);

CREATE TABLE IF NOT EXISTS agents (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS otp_logs (
  id bigserial PRIMARY KEY,
  mobile varchar(24) NOT NULL,
  code_hash text NOT NULL,
  requested_role user_role NOT NULL,
  expires_at timestamptz NOT NULL,
  next_resend_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 3),
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS otp_logs_mobile_created_idx ON otp_logs (mobile, created_at DESC);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_sessions_user_active_idx ON auth_sessions (user_id, expires_at) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL UNIQUE,
  price_minor integer NOT NULL CHECK (price_minor >= 0),
  currency char(3) NOT NULL DEFAULT 'INR',
  billing_period varchar(20) NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
  gateway_plan_id varchar(120),
  active boolean NOT NULL DEFAULT true,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO plans(name,price_minor,currency,billing_period,features) VALUES
  ('Starter',0,'INR','monthly','{"radiusKm":3,"teamSeats":1}'::jsonb),
  ('Growth',99900,'INR','monthly','{"radiusKm":10,"teamSeats":5}'::jsonb),
  ('Business',999900,'INR','yearly','{"radiusKm":25,"teamSeats":25}'::jsonb)
ON CONFLICT(name) DO NOTHING;

CREATE TABLE IF NOT EXISTS client_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(user_id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES plans(id),
  status varchar(24) NOT NULL DEFAULT 'pending',
  gateway_subscription_id varchar(120),
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  client_id uuid REFERENCES clients(user_id),
  agent_id uuid REFERENCES agents(user_id),
  service_name varchar(160) NOT NULL,
  details text NOT NULL DEFAULT '',
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  address text NOT NULL,
  status order_status NOT NULL DEFAULT 'new',
  scheduled_at timestamptz,
  assigned_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_user_created_idx ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_client_status_idx ON orders (client_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_agent_status_idx ON orders (agent_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_location_idx ON orders (latitude, longitude);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(user_id) ON DELETE SET NULL,
  plan_id uuid REFERENCES plans(id) ON DELETE SET NULL,
  amount_minor integer NOT NULL CHECK (amount_minor >= 0),
  currency char(3) NOT NULL DEFAULT 'INR',
  status payment_status NOT NULL DEFAULT 'created',
  gateway varchar(32) NOT NULL DEFAULT 'razorpay',
  gateway_order_id varchar(120),
  gateway_subscription_id varchar(120),
  gateway_payment_id varchar(120),
  gateway_refund_id varchar(120),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS gateway_plan_id varchar(120);
CREATE UNIQUE INDEX IF NOT EXISTS plans_gateway_plan_id_idx ON plans(gateway_plan_id) WHERE gateway_plan_id IS NOT NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_subscription_id varchar(120);
CREATE INDEX IF NOT EXISTS payments_created_idx ON payments (created_at DESC);
CREATE INDEX IF NOT EXISTS payments_client_idx ON payments (client_id, created_at DESC);

CREATE TABLE IF NOT EXISTS platform_settings (
  key varchar(100) PRIMARY KEY,
  value jsonb NOT NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id bigserial PRIMARY KEY,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action varchar(120) NOT NULL,
  entity varchar(80) NOT NULL,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_events_created_idx ON audit_events (created_at DESC);

COMMIT;
