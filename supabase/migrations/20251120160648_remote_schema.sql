


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."current_user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  -- Retorna apenas do JWT claim
  -- Se não existir, retorna NULL (não 'user')
  SELECT current_setting('request.jwt.claim.role', true);
$$;


ALTER FUNCTION "public"."current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_profiles_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_profiles_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  SELECT current_setting('request.jwt.claim.role', true) = 'admin';
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_profile_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Apenas notificar se role ou permissions mudaram
  IF (OLD.role IS DISTINCT FROM NEW.role) OR
     (OLD.permissions IS DISTINCT FROM NEW.permissions) THEN

    -- Em produção, você pode implementar uma notificação ao usuário
    -- para fazer re-login, ou forçar logout
    RAISE NOTICE 'Profile updated for user %. User should re-login to update JWT claims.', NEW.id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_profile_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bucket" "text" DEFAULT 'app-files'::"text" NOT NULL,
    "path" "text" NOT NULL,
    "resource_type" "text" NOT NULL,
    "resource_id" "uuid",
    "uploaded_by" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid",
    "type" "text",
    "event_timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "date" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "hours" numeric DEFAULT 0,
    "minutes" numeric DEFAULT 0,
    "notes" "text",
    "owner_org" "uuid",
    "status" "text" DEFAULT 'present'::"text",
    "actual_arrival_time" "text",
    "deduction" numeric DEFAULT 0,
    "event_type" "text",
    "event_date" "date",
    CONSTRAINT "attendance_events_status_check" CHECK (("status" = ANY (ARRAY['present'::"text", 'late'::"text"])))
);


ALTER TABLE "public"."attendance_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "client_type" "text",
    "legal_representative" "text",
    "address" "text",
    "city" "text",
    "country" "text",
    "nuit" "text",
    "notes" "text",
    "owner_org" "uuid",
    CONSTRAINT "clients_client_type_check" CHECK (("client_type" = ANY (ARRAY['individual'::"text", 'company'::"text"])))
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "last_message_timestamp" timestamp with time zone,
    "unread_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "title" "text",
    "participant_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "last_message_at" timestamp with time zone,
    "unread_counts" "jsonb" DEFAULT '{}'::"jsonb",
    "owner_org" "uuid"
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_templates" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text",
    "template" "jsonb",
    "version" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "owner_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "schema" "jsonb" DEFAULT '[]'::"jsonb",
    "template_html" "text",
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "owner_org" "uuid"
);


ALTER TABLE "public"."document_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "role" "text",
    "is_blocked" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "email" "text",
    "phone" "text",
    "document_type" "text",
    "document_number" "text",
    "address" "text",
    "salary" numeric,
    "start_date" "date",
    "is_active" boolean DEFAULT true,
    "photo_url" "text",
    "custom_fields" "jsonb" DEFAULT '{}'::"jsonb",
    "owner_org" "uuid",
    "mother_name" "text",
    "position" "text",
    "nuit" "text",
    "neighborhood" "text",
    "city" "text",
    "payment_date" integer,
    "work_schedule" "jsonb" DEFAULT '{"end": "18:00", "start": "08:00", "totalHours": 10}'::"jsonb",
    "documents" "jsonb" DEFAULT '[]'::"jsonb",
    "custom_term" "text"
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "description" "text",
    "amount" numeric,
    "type" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "reference_id" "uuid",
    "owner_org" "uuid",
    "date" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."generated_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_id" "text",
    "data" "jsonb",
    "user_id" "uuid",
    "client_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "status" "text",
    "storage_url" "text",
    "owner_org" "uuid"
);


ALTER TABLE "public"."generated_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_number" "text" NOT NULL,
    "order_id" "uuid",
    "vat_rate" numeric,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "client_id" "uuid",
    "issue_date" "date" DEFAULT CURRENT_DATE,
    "due_date" "date",
    "total" numeric,
    "status" "text",
    "pdf_url" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "owner_org" "uuid"
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."materials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "unit" "text",
    "current_stock" numeric,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "category" "text",
    "default_width" numeric,
    "default_length" numeric,
    "price_per_unit" numeric,
    "selling_price" numeric,
    "stock_min" numeric,
    "stock_current" numeric DEFAULT 0,
    "supplier" "text",
    "is_sellable" boolean DEFAULT false,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "owner_org" "uuid"
);


ALTER TABLE "public"."materials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid",
    "sender_id" "uuid",
    "content" "text",
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "status" "text",
    "owner_org" "uuid"
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "is_favorite" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "owner_type" "text",
    "owner_id" "uuid",
    "owner_org" "uuid"
);


ALTER TABLE "public"."notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_number" "text" NOT NULL,
    "client_id" "uuid",
    "status" "text",
    "type" "text",
    "total" numeric,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "items" "jsonb" DEFAULT '[]'::"jsonb",
    "subtotal" numeric,
    "discount_type" "text",
    "discount_value" numeric,
    "vat_enabled" boolean DEFAULT false,
    "vat_amount" numeric,
    "due_date" "date",
    "notes" "text",
    "invoice_generated" boolean DEFAULT false,
    "assigned_to" "uuid",
    "owner_org" "uuid",
    "client_name" "text",
    "discount_amount" numeric DEFAULT 0
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "amount" numeric,
    "method" "text" DEFAULT 'transfer'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "invoice_id" "uuid",
    "status" "text",
    "notes" "text",
    "owner_org" "uuid",
    "date" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "permissions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "avatar_url" "text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "owner_org" "uuid",
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'user'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "supplier" "text",
    "total" numeric,
    "status" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "supplier_name" "text",
    "material_items" "jsonb" DEFAULT '[]'::"jsonb",
    "invoice_number" "text",
    "purchase_date" "date",
    "received_date" "date",
    "owner_org" "uuid",
    "material_id" "uuid",
    "material_name" "text",
    "quantity" numeric,
    "unit_price" numeric,
    "date" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."purchases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."salary_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid",
    "amount" numeric,
    "paid_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "month" integer,
    "year" integer,
    "payment_date" "date",
    "deductions" numeric,
    "gross_salary" numeric,
    "method" "text",
    "notes" "text",
    "owner_org" "uuid"
);


ALTER TABLE "public"."salary_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "base_price" numeric,
    "unit" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "variations" "jsonb" DEFAULT '[]'::"jsonb",
    "materials_used" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "owner_org" "uuid",
    "default_width" double precision,
    "default_length" double precision,
    "price_per_sqm" double precision
);


ALTER TABLE "public"."services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."settings" (
    "id" "text" NOT NULL,
    "value" "jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "material_id" "uuid",
    "quantity" numeric,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "movement_type" "text",
    "reference_type" "text",
    "reference_id" "uuid",
    "notes" "text",
    "owner_org" "uuid",
    "details" "text",
    "material_name" "text",
    CONSTRAINT "stock_movements_movement_type_check" CHECK (("movement_type" = ANY (ARRAY['addition'::"text", 'deduction'::"text", 'adjustment'::"text"])))
);


ALTER TABLE "public"."stock_movements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "due_date" timestamp with time zone,
    "is_completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "related_type" "text",
    "related_id" "uuid",
    "priority" "text",
    "assigned_to" "uuid",
    "owner_org" "uuid"
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "role" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "owner_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "permissions" "jsonb" DEFAULT '[]'::"jsonb",
    "created_by" "uuid",
    "owner_org" "uuid"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."attachments"
    ADD CONSTRAINT "attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance_events"
    ADD CONSTRAINT "attendance_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_templates"
    ADD CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generated_documents"
    ADD CONSTRAINT "generated_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."materials"
    ADD CONSTRAINT "materials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."salary_payments"
    ADD CONSTRAINT "salary_payments_employee_month_year_unique" UNIQUE ("employee_id", "month", "year");



ALTER TABLE ONLY "public"."salary_payments"
    ADD CONSTRAINT "salary_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_attendance_events_date" ON "public"."attendance_events" USING "btree" ("date");



CREATE INDEX "idx_attendance_events_employee_id" ON "public"."attendance_events" USING "btree" ("employee_id");



CREATE INDEX "idx_clients_created_by" ON "public"."clients" USING "btree" ("created_by");



CREATE INDEX "idx_clients_owner_org" ON "public"."clients" USING "btree" ("owner_org");



CREATE UNIQUE INDEX "idx_conversations_participants_unique" ON "public"."conversations" USING "btree" ("participant_ids");



CREATE INDEX "idx_employees_owner_org" ON "public"."employees" USING "btree" ("owner_org");



CREATE INDEX "idx_expenses_created_by" ON "public"."expenses" USING "btree" ("created_by");



CREATE INDEX "idx_expenses_date" ON "public"."expenses" USING "btree" ("date");



CREATE INDEX "idx_expenses_type" ON "public"."expenses" USING "btree" ("type");



CREATE INDEX "idx_orders_client_id" ON "public"."orders" USING "btree" ("client_id");



CREATE INDEX "idx_orders_created_at" ON "public"."orders" USING "btree" ("created_at");



CREATE INDEX "idx_orders_created_by" ON "public"."orders" USING "btree" ("created_by");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_payments_date" ON "public"."payments" USING "btree" ("date");



CREATE INDEX "idx_payments_invoice_id" ON "public"."payments" USING "btree" ("invoice_id");



CREATE INDEX "idx_payments_order_id" ON "public"."payments" USING "btree" ("order_id");



CREATE INDEX "idx_salary_payments_employee_id" ON "public"."salary_payments" USING "btree" ("employee_id");



CREATE INDEX "idx_salary_payments_month_year" ON "public"."salary_payments" USING "btree" ("month", "year");



CREATE INDEX "idx_stock_movements_created_at" ON "public"."stock_movements" USING "btree" ("created_at");



CREATE INDEX "idx_stock_movements_material_id" ON "public"."stock_movements" USING "btree" ("material_id");



CREATE INDEX "idx_stock_movements_reference_id" ON "public"."stock_movements" USING "btree" ("reference_id");



CREATE OR REPLACE TRIGGER "set_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_profiles_updated_at"();



CREATE OR REPLACE TRIGGER "set_timestamp_attendance_events" BEFORE UPDATE ON "public"."attendance_events" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_timestamp_clients" BEFORE UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_timestamp_conversations" BEFORE UPDATE ON "public"."conversations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_timestamp_document_templates" BEFORE UPDATE ON "public"."document_templates" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_timestamp_employees" BEFORE UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_timestamp_expenses" BEFORE UPDATE ON "public"."expenses" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_timestamp_generated_documents" BEFORE UPDATE ON "public"."generated_documents" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_timestamp_invoices" BEFORE UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_timestamp_materials" BEFORE UPDATE ON "public"."materials" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_timestamp_messages" BEFORE UPDATE ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_timestamp_notes" BEFORE UPDATE ON "public"."notes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_timestamp_orders" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_timestamp_payments" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_timestamp_profiles" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_timestamp_purchases" BEFORE UPDATE ON "public"."purchases" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_timestamp_salary_payments" BEFORE UPDATE ON "public"."salary_payments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_timestamp_services" BEFORE UPDATE ON "public"."services" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_timestamp_settings" BEFORE UPDATE ON "public"."settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_timestamp_stock_movements" BEFORE UPDATE ON "public"."stock_movements" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_timestamp_tasks" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_timestamp_users" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_profile_change" AFTER UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."notify_profile_change"();



ALTER TABLE ONLY "public"."attendance_events"
    ADD CONSTRAINT "attendance_events_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."generated_documents"
    ADD CONSTRAINT "generated_documents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id");



ALTER TABLE ONLY "public"."generated_documents"
    ADD CONSTRAINT "generated_documents_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."document_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."generated_documents"
    ADD CONSTRAINT "generated_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."salary_payments"
    ADD CONSTRAINT "salary_payments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id");



ALTER TABLE "public"."attachments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "attachments_rw" ON "public"."attachments" USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."attendance_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "attendance_events_access" ON "public"."attendance_events" USING ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"])))) WITH CHECK ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "attendance_events_delete_own" ON "public"."attendance_events" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "attendance_events_insert_own" ON "public"."attendance_events" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "attendance_events_select_own" ON "public"."attendance_events" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "attendance_events_update_own" ON "public"."attendance_events" FOR UPDATE USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clients_delete_own" ON "public"."clients" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "clients_insert_own" ON "public"."clients" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "clients_modify" ON "public"."clients" USING ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"])))) WITH CHECK ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "clients_select" ON "public"."clients" FOR SELECT USING ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "clients_select_own" ON "public"."clients" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "clients_update_own" ON "public"."clients" FOR UPDATE USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversations_access" ON "public"."conversations" USING ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR ("auth"."uid"() = "created_by") OR ("auth"."uid"() = ANY ("participant_ids")) OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"])))) WITH CHECK ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR ("auth"."uid"() = "created_by") OR ("auth"."uid"() = ANY ("participant_ids")) OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "conversations_delete_own" ON "public"."conversations" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "conversations_insert" ON "public"."conversations" FOR INSERT WITH CHECK ((("auth"."uid"() = ANY ("participant_ids")) OR (COALESCE((("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'role'::"text"), ''::"text") = 'admin'::"text")));



CREATE POLICY "conversations_insert_auth" ON "public"."conversations" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "conversations_insert_own" ON "public"."conversations" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "conversations_select" ON "public"."conversations" FOR SELECT USING ((("auth"."uid"() = ANY ("participant_ids")) OR (COALESCE((("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'role'::"text"), ''::"text") = 'admin'::"text")));



CREATE POLICY "conversations_select_auth" ON "public"."conversations" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "conversations_select_own" ON "public"."conversations" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "conversations_update" ON "public"."conversations" FOR UPDATE USING ((("auth"."uid"() = ANY ("participant_ids")) OR (COALESCE((("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'role'::"text"), ''::"text") = 'admin'::"text")));



CREATE POLICY "conversations_update_auth" ON "public"."conversations" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "conversations_update_own" ON "public"."conversations" FOR UPDATE USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



ALTER TABLE "public"."document_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "document_templates_access" ON "public"."document_templates" USING ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"])))) WITH CHECK ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "document_templates_delete_own" ON "public"."document_templates" FOR DELETE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "document_templates_insert_own" ON "public"."document_templates" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "document_templates_select_own" ON "public"."document_templates" FOR SELECT USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "document_templates_update_own" ON "public"."document_templates" FOR UPDATE USING (("auth"."uid"() = "owner_id")) WITH CHECK (("auth"."uid"() = "owner_id"));



ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "employees_delete_own" ON "public"."employees" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "employees_insert_own" ON "public"."employees" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "employees_modify" ON "public"."employees" USING ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"])))) WITH CHECK ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "employees_select" ON "public"."employees" FOR SELECT USING ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "employees_select_own" ON "public"."employees" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "employees_update_own" ON "public"."employees" FOR UPDATE USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



ALTER TABLE "public"."expenses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "expenses_access" ON "public"."expenses" USING ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"])))) WITH CHECK ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "expenses_delete_own" ON "public"."expenses" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "expenses_insert_own" ON "public"."expenses" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "expenses_select_own" ON "public"."expenses" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "expenses_update_own" ON "public"."expenses" FOR UPDATE USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



ALTER TABLE "public"."generated_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "generated_documents_access" ON "public"."generated_documents" USING ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR ("auth"."uid"() = "user_id") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"])))) WITH CHECK ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR ("auth"."uid"() = "user_id") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "generated_documents_delete_own" ON "public"."generated_documents" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "generated_documents_insert_own" ON "public"."generated_documents" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "generated_documents_select_own" ON "public"."generated_documents" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "generated_documents_update_own" ON "public"."generated_documents" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invoices_access" ON "public"."invoices" USING ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"])))) WITH CHECK ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "invoices_delete_own" ON "public"."invoices" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "invoices_insert_own" ON "public"."invoices" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "invoices_select_own" ON "public"."invoices" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "invoices_update_own" ON "public"."invoices" FOR UPDATE USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



ALTER TABLE "public"."materials" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "materials_modify" ON "public"."materials" USING ((("owner_org" IS NULL) OR ("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text", 'user'::"text"])))) WITH CHECK ((("owner_org" IS NULL) OR ("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text", 'user'::"text"]))));



CREATE POLICY "materials_select" ON "public"."materials" FOR SELECT USING ((("owner_org" IS NULL) OR ("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text", 'user'::"text"]))));



ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "messages_access" ON "public"."messages" USING ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR ("auth"."uid"() = "sender_id") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"])))) WITH CHECK ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR ("auth"."uid"() = "sender_id") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "messages_delete_own" ON "public"."messages" FOR DELETE USING (("auth"."uid"() = "sender_id"));



CREATE POLICY "messages_insert" ON "public"."messages" FOR INSERT WITH CHECK ((("sender_id" = "auth"."uid"()) OR (COALESCE((("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'role'::"text"), ''::"text") = 'admin'::"text")));



CREATE POLICY "messages_insert_auth" ON "public"."messages" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "messages_insert_own" ON "public"."messages" FOR INSERT WITH CHECK (("auth"."uid"() = "sender_id"));



CREATE POLICY "messages_select" ON "public"."messages" FOR SELECT USING ((("sender_id" = "auth"."uid"()) OR (COALESCE((("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'role'::"text"), ''::"text") = 'admin'::"text")));



CREATE POLICY "messages_select_auth" ON "public"."messages" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "messages_select_own" ON "public"."messages" FOR SELECT USING (("auth"."uid"() = "sender_id"));



CREATE POLICY "messages_update" ON "public"."messages" FOR UPDATE USING ((("sender_id" = "auth"."uid"()) OR (COALESCE((("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'role'::"text"), ''::"text") = 'admin'::"text")));



CREATE POLICY "messages_update_auth" ON "public"."messages" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "messages_update_own" ON "public"."messages" FOR UPDATE USING (("auth"."uid"() = "sender_id")) WITH CHECK (("auth"."uid"() = "sender_id"));



ALTER TABLE "public"."notes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notes_access" ON "public"."notes" USING ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR ("auth"."uid"() = "created_by") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"])))) WITH CHECK ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR ("auth"."uid"() = "created_by") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "notes_delete_own" ON "public"."notes" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "notes_insert_own" ON "public"."notes" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "notes_select_own" ON "public"."notes" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "notes_update_own" ON "public"."notes" FOR UPDATE USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orders_access" ON "public"."orders" USING ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"])))) WITH CHECK ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "orders_delete_own" ON "public"."orders" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "orders_insert_own" ON "public"."orders" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "orders_select_own" ON "public"."orders" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "orders_update_own" ON "public"."orders" FOR UPDATE USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payments_access" ON "public"."payments" USING ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"])))) WITH CHECK ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "payments_delete_own" ON "public"."payments" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "payments_insert_own" ON "public"."payments" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "payments_select_own" ON "public"."payments" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "payments_update_own" ON "public"."payments" FOR UPDATE USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "profiles_select_all_authenticated" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



ALTER TABLE "public"."purchases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "purchases_access" ON "public"."purchases" USING ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"])))) WITH CHECK ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "purchases_delete_own" ON "public"."purchases" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "purchases_insert_own" ON "public"."purchases" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "purchases_select_own" ON "public"."purchases" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "purchases_update_own" ON "public"."purchases" FOR UPDATE USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



ALTER TABLE "public"."salary_payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "salary_payments_access" ON "public"."salary_payments" USING ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"])))) WITH CHECK ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "salary_payments_delete_own" ON "public"."salary_payments" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "salary_payments_insert_own" ON "public"."salary_payments" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "salary_payments_select_own" ON "public"."salary_payments" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "salary_payments_update_own" ON "public"."salary_payments" FOR UPDATE USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "services_modify" ON "public"."services" USING ((("owner_org" IS NULL) OR ("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text", 'user'::"text"])))) WITH CHECK ((("owner_org" IS NULL) OR ("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text", 'user'::"text"]))));



CREATE POLICY "services_select" ON "public"."services" FOR SELECT USING ((("owner_org" IS NULL) OR ("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text", 'user'::"text"]))));



ALTER TABLE "public"."settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "settings_admin_access" ON "public"."settings" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "settings_org_access" ON "public"."settings" USING (((COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"])) OR ("org_id" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid"))) WITH CHECK (((COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"])) OR ("org_id" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid")));



ALTER TABLE "public"."stock_movements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stock_movements_access" ON "public"."stock_movements" USING ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"])))) WITH CHECK ((("owner_org" = (NULLIF("current_setting"('request.jwt.claim.org_id'::"text", true), ''::"text"))::"uuid") OR (COALESCE("current_setting"('request.jwt.claim.role'::"text", true), ''::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "stock_movements_delete_own" ON "public"."stock_movements" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "stock_movements_insert_own" ON "public"."stock_movements" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "stock_movements_select_own" ON "public"."stock_movements" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "stock_movements_update_own" ON "public"."stock_movements" FOR UPDATE USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tasks_delete_own" ON "public"."tasks" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "tasks_insert_own" ON "public"."tasks" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "tasks_owner_access" ON "public"."tasks" USING ((("auth"."uid"() = "assigned_to") OR ("auth"."uid"() = "created_by") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))))) WITH CHECK ((("auth"."uid"() = "assigned_to") OR ("auth"."uid"() = "created_by") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))));



CREATE POLICY "tasks_select_own" ON "public"."tasks" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "tasks_update_own" ON "public"."tasks" FOR UPDATE USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_delete_own" ON "public"."users" FOR DELETE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "users_insert_own" ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "users_select_own" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "users_update_own" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "owner_id")) WITH CHECK (("auth"."uid"() = "owner_id"));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_profiles_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_profiles_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_profiles_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_profile_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_profile_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_profile_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."attachments" TO "anon";
GRANT ALL ON TABLE "public"."attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."attachments" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_events" TO "anon";
GRANT ALL ON TABLE "public"."attendance_events" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_events" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."document_templates" TO "anon";
GRANT ALL ON TABLE "public"."document_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."document_templates" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON TABLE "public"."expenses" TO "anon";
GRANT ALL ON TABLE "public"."expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."expenses" TO "service_role";



GRANT ALL ON TABLE "public"."generated_documents" TO "anon";
GRANT ALL ON TABLE "public"."generated_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."generated_documents" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."materials" TO "anon";
GRANT ALL ON TABLE "public"."materials" TO "authenticated";
GRANT ALL ON TABLE "public"."materials" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."notes" TO "anon";
GRANT ALL ON TABLE "public"."notes" TO "authenticated";
GRANT ALL ON TABLE "public"."notes" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."purchases" TO "anon";
GRANT ALL ON TABLE "public"."purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases" TO "service_role";



GRANT ALL ON TABLE "public"."salary_payments" TO "anon";
GRANT ALL ON TABLE "public"."salary_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."salary_payments" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON TABLE "public"."settings" TO "anon";
GRANT ALL ON TABLE "public"."settings" TO "authenticated";
GRANT ALL ON TABLE "public"."settings" TO "service_role";



GRANT ALL ON TABLE "public"."stock_movements" TO "anon";
GRANT ALL ON TABLE "public"."stock_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_movements" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







