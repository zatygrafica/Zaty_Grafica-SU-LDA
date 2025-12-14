drop extension if exists "pg_net";

drop trigger if exists "set_timestamp_attendance_events" on "public"."attendance_events";

drop trigger if exists "set_timestamp_clients" on "public"."clients";

drop trigger if exists "set_timestamp_conversations" on "public"."conversations";

drop trigger if exists "set_timestamp_document_templates" on "public"."document_templates";

drop trigger if exists "set_timestamp_employees" on "public"."employees";

drop trigger if exists "set_timestamp_expenses" on "public"."expenses";

drop trigger if exists "set_timestamp_generated_documents" on "public"."generated_documents";

drop trigger if exists "set_timestamp_invoices" on "public"."invoices";

drop trigger if exists "set_timestamp_materials" on "public"."materials";

drop trigger if exists "set_timestamp_messages" on "public"."messages";

drop trigger if exists "set_timestamp_notes" on "public"."notes";

drop trigger if exists "set_timestamp_orders" on "public"."orders";

drop trigger if exists "set_timestamp_payments" on "public"."payments";

drop trigger if exists "set_profiles_updated_at" on "public"."profiles";

drop trigger if exists "set_timestamp_profiles" on "public"."profiles";

drop trigger if exists "trigger_profile_change" on "public"."profiles";

drop trigger if exists "set_timestamp_purchases" on "public"."purchases";

drop trigger if exists "set_timestamp_salary_payments" on "public"."salary_payments";

drop trigger if exists "set_timestamp_services" on "public"."services";

drop trigger if exists "set_timestamp_settings" on "public"."settings";

drop trigger if exists "set_timestamp_stock_movements" on "public"."stock_movements";

drop trigger if exists "set_timestamp_tasks" on "public"."tasks";

drop trigger if exists "set_timestamp_users" on "public"."users";

drop policy "settings_admin_access" on "public"."settings";

drop policy "tasks_owner_access" on "public"."tasks";

alter table "public"."attendance_events" drop constraint "attendance_events_employee_id_fkey";

alter table "public"."generated_documents" drop constraint "generated_documents_client_id_fkey";

alter table "public"."generated_documents" drop constraint "generated_documents_template_id_fkey";

alter table "public"."generated_documents" drop constraint "generated_documents_user_id_fkey";

alter table "public"."invoices" drop constraint "invoices_client_id_fkey";

alter table "public"."invoices" drop constraint "invoices_order_id_fkey";

alter table "public"."messages" drop constraint "messages_conversation_id_fkey";

alter table "public"."orders" drop constraint "orders_client_id_fkey";

alter table "public"."payments" drop constraint "payments_invoice_id_fkey";

alter table "public"."payments" drop constraint "payments_order_id_fkey";

alter table "public"."salary_payments" drop constraint "salary_payments_employee_id_fkey";

alter table "public"."stock_movements" drop constraint "stock_movements_material_id_fkey";

alter table "public"."attendance_events" add constraint "attendance_events_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES public.employees(id) not valid;

alter table "public"."attendance_events" validate constraint "attendance_events_employee_id_fkey";

alter table "public"."generated_documents" add constraint "generated_documents_client_id_fkey" FOREIGN KEY (client_id) REFERENCES public.clients(id) not valid;

alter table "public"."generated_documents" validate constraint "generated_documents_client_id_fkey";

alter table "public"."generated_documents" add constraint "generated_documents_template_id_fkey" FOREIGN KEY (template_id) REFERENCES public.document_templates(id) ON DELETE SET NULL not valid;

alter table "public"."generated_documents" validate constraint "generated_documents_template_id_fkey";

alter table "public"."generated_documents" add constraint "generated_documents_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."generated_documents" validate constraint "generated_documents_user_id_fkey";

alter table "public"."invoices" add constraint "invoices_client_id_fkey" FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL not valid;

alter table "public"."invoices" validate constraint "invoices_client_id_fkey";

alter table "public"."invoices" add constraint "invoices_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) not valid;

alter table "public"."invoices" validate constraint "invoices_order_id_fkey";

alter table "public"."messages" add constraint "messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) not valid;

alter table "public"."messages" validate constraint "messages_conversation_id_fkey";

alter table "public"."orders" add constraint "orders_client_id_fkey" FOREIGN KEY (client_id) REFERENCES public.clients(id) not valid;

alter table "public"."orders" validate constraint "orders_client_id_fkey";

alter table "public"."payments" add constraint "payments_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL not valid;

alter table "public"."payments" validate constraint "payments_invoice_id_fkey";

alter table "public"."payments" add constraint "payments_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) not valid;

alter table "public"."payments" validate constraint "payments_order_id_fkey";

alter table "public"."salary_payments" add constraint "salary_payments_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES public.employees(id) not valid;

alter table "public"."salary_payments" validate constraint "salary_payments_employee_id_fkey";

alter table "public"."stock_movements" add constraint "stock_movements_material_id_fkey" FOREIGN KEY (material_id) REFERENCES public.materials(id) not valid;

alter table "public"."stock_movements" validate constraint "stock_movements_material_id_fkey";


  create policy "settings_admin_access"
  on "public"."settings"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "tasks_owner_access"
  on "public"."tasks"
  as permissive
  for all
  to public
using (((auth.uid() = assigned_to) OR (auth.uid() = created_by) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))))
with check (((auth.uid() = assigned_to) OR (auth.uid() = created_by) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))));


CREATE TRIGGER set_timestamp_attendance_events BEFORE UPDATE ON public.attendance_events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_timestamp_clients BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_timestamp_conversations BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_timestamp_document_templates BEFORE UPDATE ON public.document_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_timestamp_employees BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_timestamp_expenses BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_timestamp_generated_documents BEFORE UPDATE ON public.generated_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_timestamp_invoices BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_timestamp_materials BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_timestamp_messages BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_timestamp_notes BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_timestamp_orders BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_timestamp_payments BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_profiles_updated_at();

CREATE TRIGGER set_timestamp_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trigger_profile_change AFTER UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.notify_profile_change();

CREATE TRIGGER set_timestamp_purchases BEFORE UPDATE ON public.purchases FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_timestamp_salary_payments BEFORE UPDATE ON public.salary_payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_timestamp_services BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_timestamp_settings BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_timestamp_stock_movements BEFORE UPDATE ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_timestamp_tasks BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

drop policy "app-files-delete-secure" on "storage"."objects";

drop policy "app-files-select-secure" on "storage"."objects";


  create policy "app-files-delete-secure"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'app-files'::text) AND ((owner = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))));



  create policy "app-files-select-secure"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'app-files'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))));



