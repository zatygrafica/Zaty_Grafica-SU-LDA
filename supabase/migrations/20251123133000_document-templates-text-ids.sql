-- Ensure document_templates.id can store textual slugs (e.g. 'cv')
-- and keep generated_documents.template_id in sync.
BEGIN;

ALTER TABLE public.generated_documents
  DROP CONSTRAINT IF EXISTS generated_documents_template_id_fkey;

ALTER TABLE public.document_templates
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE text USING id::text;

ALTER TABLE public.generated_documents
  ALTER COLUMN template_id TYPE text USING template_id::text;

ALTER TABLE public.generated_documents
  ADD CONSTRAINT generated_documents_template_id_fkey
    FOREIGN KEY (template_id)
    REFERENCES public.document_templates(id)
    ON DELETE SET NULL;

COMMIT;
