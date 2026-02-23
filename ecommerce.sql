-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS user_role_id_seq;
DROP TYPE IF EXISTS "public"."user_role_enum";
CREATE TYPE "public"."user_role_enum" AS ENUM ('customer', 'seller', 'deliverer', 'admin');

-- Table Definition
CREATE TABLE "public"."user_role" (
    "id" int4 NOT NULL DEFAULT nextval('user_role_id_seq'::regclass),
    "role_name" "public"."user_role_enum" NOT NULL,
    PRIMARY KEY ("id")
);


-- Indices
CREATE UNIQUE INDEX user_role_role_name_key ON public.user_role USING btree (role_name);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS user_id_seq;
DROP TYPE IF EXISTS "public"."gender_enum";
CREATE TYPE "public"."gender_enum" AS ENUM ('male', 'female', 'other');
DROP TYPE IF EXISTS "public"."user_status_enum";
CREATE TYPE "public"."user_status_enum" AS ENUM ('active', 'inactive', 'suspended', 'deleted');

-- Table Definition
CREATE TABLE "public"."user" (
    "id" int4 NOT NULL DEFAULT nextval('user_id_seq'::regclass),
    "email" varchar(255) NOT NULL,
    "hash_password" varchar(255) NOT NULL,
    "first_name" varchar(50) NOT NULL,
    "last_name" varchar(50) NOT NULL,
    "phone_number" varchar(20),
    "date_of_birth" date,
    "avatar_url" varchar(500),
    "gender" "public"."gender_enum" DEFAULT 'other'::gender_enum,
    "is_email_verified" bool DEFAULT false,
    "is_phone_verified" bool DEFAULT false,
    "status" "public"."user_status_enum" DEFAULT 'active'::user_status_enum,
    "role_id" int4,
    "total_orders" int4 DEFAULT 0,
    "total_spent" numeric(12,2) DEFAULT 0.00,
    "email_verification_token" varchar(255),
    "email_verification_expires" timestamptz,
    "password_reset_otp_hash" varchar(255),
    "password_reset_otp_expires" timestamptz,
    "password_reset_token" varchar(255),
    "password_reset_attempts" int4 DEFAULT 0,
    "password_reset_last_attempt" timestamptz,
    "password_changed_at" timestamptz,
    "is_otp_verified" bool DEFAULT false,
    "account_locked_until" timestamptz,
    "login_attempts" int4 DEFAULT 0,
    "user_name" text,
    "verification_token" text,
    "veri_token_expires_at" timestamptz,
    "is_verified" bool,
    "last_login" timestamptz,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."user_role"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    PRIMARY KEY ("id")
);


-- Indices
CREATE UNIQUE INDEX user_email_key ON public."user" USING btree (email);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS social_accounts_id_seq;

-- Table Definition
CREATE TABLE "public"."social_accounts" (
    "id" int4 NOT NULL DEFAULT nextval('social_accounts_id_seq'::regclass),
    "user_id" int4 NOT NULL,
    "google_id" varchar(255),
    "facebook_id" varchar(255),
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "social_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);


-- Indices
CREATE UNIQUE INDEX social_accounts_user_id_key ON public.social_accounts USING btree (user_id);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS user_sessions_id_seq;
DROP TYPE IF EXISTS "public"."revoked_reason_enum";
CREATE TYPE "public"."revoked_reason_enum" AS ENUM ('logout', 'suspicious', 'password_change', 'admin_action');

-- Table Definition
CREATE TABLE "public"."user_sessions" (
    "id" int4 NOT NULL DEFAULT nextval('user_sessions_id_seq'::regclass),
    "user_id" int4 NOT NULL,
    "jti" varchar(255) NOT NULL,
    "ait" int8 NOT NULL,
    "device_user_agent" text,
    "device_ip" varchar(45),
    "device_name" varchar(100),
    "device_location" varchar(100),
    "device_fingerprint" varchar(255),
    "suspicious_count" int4 DEFAULT 0,
    "revoked" bool DEFAULT false,
    "revoked_reason" "public"."revoked_reason_enum",
    "revoked_at" timestamptz,
    "last_activity_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "expires_at" timestamptz NOT NULL,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);


-- Indices
CREATE UNIQUE INDEX user_sessions_jti_key ON public.user_sessions USING btree (jti);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS token_blacklist_id_seq;
DROP TYPE IF EXISTS "public"."token_type_enum";
CREATE TYPE "public"."token_type_enum" AS ENUM ('access');
DROP TYPE IF EXISTS "public"."blacklist_reason_enum";
CREATE TYPE "public"."blacklist_reason_enum" AS ENUM ('logout', 'password_change', 'suspicious_activity', 'admin_revoked');

-- Table Definition
CREATE TABLE "public"."token_blacklist" (
    "id" int4 NOT NULL DEFAULT nextval('token_blacklist_id_seq'::regclass),
    "user_id" int4 NOT NULL,
    "token_hash" varchar(255) NOT NULL,
    "token_type" "public"."token_type_enum" NOT NULL DEFAULT 'access'::token_type_enum,
    "blacklisted_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "expires_at" timestamptz NOT NULL,
    "reason" "public"."blacklist_reason_enum" DEFAULT 'logout'::blacklist_reason_enum,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "token_blacklist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);


-- Indices
CREATE UNIQUE INDEX token_blacklist_token_hash_key ON public.token_blacklist USING btree (token_hash);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS shipping_address_id_seq;

-- Table Definition
CREATE TABLE "public"."shipping_address" (
    "id" int4 NOT NULL DEFAULT nextval('shipping_address_id_seq'::regclass),
    "address_line" text,
    "ward" varchar(255),
    "district" varchar(255),
    "city" varchar(255),
    "is_default" bool DEFAULT false,
    "user_id" int4,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT "shipping_address_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("id")
);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS size_category_id_seq;

-- Table Definition
CREATE TABLE "public"."size_category" (
    "id" int4 NOT NULL DEFAULT nextval('size_category_id_seq'::regclass),
    "size_cat_name" text NOT NULL,
    PRIMARY KEY ("id")
);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS size_option_id_seq;

-- Table Definition
CREATE TABLE "public"."size_option" (
    "id" int4 NOT NULL DEFAULT nextval('size_option_id_seq'::regclass),
    "size_name" text NOT NULL,
    "sort_order" int4 DEFAULT 0,
    "size_cat_id" int4,
    CONSTRAINT "size_option_size_cat_id_fkey" FOREIGN KEY ("size_cat_id") REFERENCES "public"."size_category"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("id")
);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS category_id_seq;

-- Table Definition
CREATE TABLE "public"."category" (
    "id" int4 NOT NULL DEFAULT nextval('category_id_seq'::regclass),
    "category_name" text NOT NULL,
    "status" int2 DEFAULT 1,
    "parent_cat_id" int4,
    "size_cat_id" int4,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT "category_parent_cat_id_fkey" FOREIGN KEY ("parent_cat_id") REFERENCES "public"."category"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "category_size_cat_id_fkey" FOREIGN KEY ("size_cat_id") REFERENCES "public"."size_category"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    PRIMARY KEY ("id")
);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS product_id_seq;

-- Table Definition
CREATE TABLE "public"."product" (
    "id" int4 NOT NULL DEFAULT nextval('product_id_seq'::regclass),
    "product_name" text NOT NULL,
    "product_description" text,
    "product_material" text,
    "care_instructions" text,
    "about" text,
    "category_id" int4,
    "status" int2 DEFAULT 1,
    "is_draft" bool DEFAULT true,
    "is_published" bool DEFAULT false,
    "product_slug" varchar(255),
    "ratings_average" numeric(3,2) DEFAULT 0,
    "ratings_count" int4 DEFAULT 0,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT "product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    PRIMARY KEY ("id")
);


-- Indices
CREATE UNIQUE INDEX product_product_slug_key ON public.product USING btree (product_slug);
CREATE INDEX idx_product_status ON public.product USING btree (is_published, is_draft);
CREATE INDEX idx_product_slug ON public.product USING btree (product_slug);
CREATE INDEX idx_product_ratings ON public.product USING btree (ratings_average DESC);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS product_item_id_seq;

-- Table Definition
CREATE TABLE "public"."product_item" (
    "id" int4 NOT NULL DEFAULT nextval('product_item_id_seq'::regclass),
    "price" numeric(12,2) NOT NULL DEFAULT 0,
    "product_code" text,
    "product_id" int4,
    "colour_id" int4,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT "product_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_item_colour_id_fkey" FOREIGN KEY ("colour_id") REFERENCES "public"."colour"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    PRIMARY KEY ("id")
);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS colour_id_seq;

-- Table Definition
CREATE TABLE "public"."colour" (
    "id" int4 NOT NULL DEFAULT nextval('colour_id_seq'::regclass),
    "colour_name" text NOT NULL,
    PRIMARY KEY ("id")
);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS product_image_id_seq;

-- Table Definition
CREATE TABLE "public"."product_image" (
    "id" int4 NOT NULL DEFAULT nextval('product_image_id_seq'::regclass),
    "image_filename" text NOT NULL,
    "product_item_id" int4,
    "created_at" timestamptz DEFAULT now(),
    CONSTRAINT "product_image_product_item_id_fkey" FOREIGN KEY ("product_item_id") REFERENCES "public"."product_item"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("id")
);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS attribute_type_id_seq;

-- Table Definition
CREATE TABLE "public"."attribute_type" (
    "id" int4 NOT NULL DEFAULT nextval('attribute_type_id_seq'::regclass),
    "attribute_type_name" text NOT NULL,
    PRIMARY KEY ("id")
);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS attribute_option_id_seq;

-- Table Definition
CREATE TABLE "public"."attribute_option" (
    "id" int4 NOT NULL DEFAULT nextval('attribute_option_id_seq'::regclass),
    "attribute_option_name" text NOT NULL,
    "attribute_type_id" int4,
    CONSTRAINT "attribute_option_attribute_type_id_fkey" FOREIGN KEY ("attribute_type_id") REFERENCES "public"."attribute_type"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("id")
);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS product_attribute_id_seq;

-- Table Definition
CREATE TABLE "public"."product_attribute" (
    "id" int4 NOT NULL DEFAULT nextval('product_attribute_id_seq'::regclass),
    "attribute_option_id" int4,
    "product_id" int4,
    CONSTRAINT "product_attribute_attribute_option_id_fkey" FOREIGN KEY ("attribute_option_id") REFERENCES "public"."attribute_option"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_attribute_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("id")
);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS product_variation_id_seq;

-- Table Definition
CREATE TABLE "public"."product_variation" (
    "id" int4 NOT NULL DEFAULT nextval('product_variation_id_seq'::regclass),
    "qty_in_stock" int4 DEFAULT 0,
    "product_item_id" int4,
    "size_id" int4,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT "product_variation_product_item_id_fkey" FOREIGN KEY ("product_item_id") REFERENCES "public"."product_item"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_variation_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "public"."size_option"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    PRIMARY KEY ("id")
);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS cart_id_seq;

-- Table Definition
CREATE TABLE "public"."cart" (
    "id" int4 NOT NULL DEFAULT nextval('cart_id_seq'::regclass),
    "status" int2 DEFAULT 1,
    "user_id" int4,
    "cart_count_products" int4 DEFAULT 0,
    "cart_total_items" int4 DEFAULT 0,
    "cart_subtotal" numeric(12,2) DEFAULT 0.00,
    "updated_at" timestamptz DEFAULT now(),
    "created_at" timestamptz DEFAULT now(),
    CONSTRAINT "cart_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("id")
);


-- Indices
CREATE INDEX idx_cart_user ON public.cart USING btree (user_id);
CREATE INDEX idx_cart_status ON public.cart USING btree (status);
CREATE INDEX idx_cart_updated ON public.cart USING btree (updated_at DESC);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS cart_product_id_seq;

-- Table Definition
CREATE TABLE "public"."cart_product" (
    "id" int4 NOT NULL DEFAULT nextval('cart_product_id_seq'::regclass),
    "quantity" int4 NOT NULL DEFAULT 1,
    "price" numeric(12,2) NOT NULL DEFAULT 0,
    "cart_id" int4,
    "variation_id" int4,
    "created_at" timestamptz DEFAULT now(),
    CONSTRAINT "cart_product_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."cart"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cart_product_variation_id_fkey" FOREIGN KEY ("variation_id") REFERENCES "public"."product_variation"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    PRIMARY KEY ("id")
);


-- Indices
CREATE UNIQUE INDEX cart_product_cart_id_variation_id_key ON public.cart_product USING btree (cart_id, variation_id);
CREATE INDEX idx_cart_product_cart ON public.cart_product USING btree (cart_id);
CREATE INDEX idx_cart_product_variation ON public.cart_product USING btree (variation_id);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS orders_id_seq;

-- Table Definition
CREATE TABLE "public"."orders" (
    "id" int4 NOT NULL DEFAULT nextval('orders_id_seq'::regclass),
    "order_number" varchar(20) NOT NULL,
    "total_price" numeric(14,2) NOT NULL DEFAULT 0,
    "total_discount_amount" numeric(14,2) DEFAULT 0,
    "actual_shipping_fee" numeric(12,2) DEFAULT 0,
    "tax_amount" numeric(12,2) DEFAULT 0,
    "net_amount" numeric(14,2) DEFAULT 0,
    "order_status" varchar(20) DEFAULT 'pending'::character varying,
    "tracking_number" varchar(100),
    "tracking_carrier" varchar(50),
    "payment_method" varchar(50),
    "payment_status" varchar(20) DEFAULT 'pending'::character varying,
    "payment_transaction_id" varchar(100),
    "payment_provider" varchar(50),
    "customer_id" int4,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "cart_id" int8,
    CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "orders_cart_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."cart"("id"),
    PRIMARY KEY ("id")
);


-- Indices
CREATE UNIQUE INDEX orders_order_number_key ON public.orders USING btree (order_number);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS order_product_id_seq;

-- Table Definition
CREATE TABLE "public"."order_product" (
    "id" int4 NOT NULL DEFAULT nextval('order_product_id_seq'::regclass),
    "quantity" int4 NOT NULL,
    "unit_price" numeric(12,2) NOT NULL,
    "total_price" numeric(12,2) NOT NULL,
    "order_id" int4,
    "product_id" int4,
    "product_item_id" int4,
    "variation_id" int4,
    CONSTRAINT "order_product_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_product_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "order_product_product_item_id_fkey" FOREIGN KEY ("product_item_id") REFERENCES "public"."product_item"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "order_product_variation_id_fkey" FOREIGN KEY ("variation_id") REFERENCES "public"."product_variation"("id") ON DELETE SET NULL,
    PRIMARY KEY ("id")
);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS order_discount_id_seq;

-- Table Definition
CREATE TABLE "public"."order_discount" (
    "id" int4 NOT NULL DEFAULT nextval('order_discount_id_seq'::regclass),
    "discount_amount" numeric(12,2) NOT NULL,
    "applied_at" timestamptz DEFAULT now(),
    "discount_id" int4,
    "customer_id" int4,
    "order_id" int4,
    CONSTRAINT "order_discount_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "public"."discount"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "order_discount_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "order_discount_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("id")
);


-- Indices
CREATE UNIQUE INDEX order_discount_discount_id_customer_id_key ON public.order_discount USING btree (discount_id, customer_id);
CREATE INDEX idx_order_discount_discount ON public.order_discount USING btree (discount_id);
CREATE INDEX idx_order_discount_customer ON public.order_discount USING btree (customer_id);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS review_id_seq;

-- Table Definition
CREATE TABLE "public"."review" (
    "id" int4 NOT NULL DEFAULT nextval('review_id_seq'::regclass),
    "rating" int2 NOT NULL,
    "comment" text,
    "uploaded_image" text,
    "is_verified" bool DEFAULT false,
    "created_at" timestamptz DEFAULT now(),
    "customer_id" int4,
    "product_id" int4,
    "order_item_id" int4,
    CONSTRAINT "review_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "review_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "review_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_product"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    PRIMARY KEY ("id")
);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS reservation_id_seq;

-- Table Definition
CREATE TABLE "public"."reservation" (
    "id" int4 NOT NULL DEFAULT nextval('reservation_id_seq'::regclass),
    "reserved_qty" int4 NOT NULL DEFAULT 1,
    "status" varchar(20) DEFAULT 'pending'::character varying,
    "created_at" timestamptz DEFAULT now(),
    "expires_at" timestamptz NOT NULL DEFAULT (now() + '24:00:00'::interval),
    "reservation_hours" int4 DEFAULT 24,
    "variation_id" int4,
    "customer_id" int4,
    CONSTRAINT "reservation_variation_id_fkey" FOREIGN KEY ("variation_id") REFERENCES "public"."product_variation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reservation_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    PRIMARY KEY ("id")
);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS key_value_store_id_seq;

-- Table Definition
CREATE TABLE "public"."key_value_store" (
    "id" int4 NOT NULL DEFAULT nextval('key_value_store_id_seq'::regclass),
    "key_name" text NOT NULL,
    "status" int2 DEFAULT 1,
    "permission" text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);


-- Indices
CREATE UNIQUE INDEX key_value_store_key_name_key ON public.key_value_store USING btree (key_name);

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS discount_id_seq;

-- Table Definition
CREATE TABLE "public"."discount" (
    "id" int4 NOT NULL DEFAULT nextval('discount_id_seq'::regclass),
    "discount_name" text NOT NULL,
    "discount_description" text,
    "discount_type" varchar(20) NOT NULL DEFAULT 'fixed_amount'::character varying,
    "discount_value" numeric(12,2) NOT NULL,
    "discount_code" text NOT NULL,
    "discount_start" timestamptz NOT NULL,
    "discount_end" timestamptz NOT NULL,
    "discount_max_uses" int4 NOT NULL,
    "discount_users_count" int4 DEFAULT 0,
    "discount_max_uses_per_user" int4 DEFAULT 1,
    "discount_min_order_value" numeric(12,2) DEFAULT 0,
    "active" bool DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);


-- Indices
CREATE UNIQUE INDEX discount_discount_code_key ON public.discount USING btree (discount_code);
CREATE INDEX idx_discount_code ON public.discount USING btree (discount_code);
CREATE INDEX idx_discount_active ON public.discount USING btree (active);
CREATE INDEX idx_discount_dates ON public.discount USING btree (discount_start, discount_end);

