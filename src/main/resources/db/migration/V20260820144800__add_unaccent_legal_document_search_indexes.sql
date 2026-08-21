-- Add trigram unaccent indexes for legal documents search
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_legal_documents_name_unaccent_trgm
    ON public.legal_documents USING gin (public.immutable_unaccent(LOWER(document_name)) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_legal_documents_number_unaccent_trgm
    ON public.legal_documents USING gin (public.immutable_unaccent(LOWER(document_number)) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_legal_documents_authority_unaccent_trgm
    ON public.legal_documents USING gin (public.immutable_unaccent(LOWER(issuing_authority)) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_legal_documents_area_unaccent_trgm
    ON public.legal_documents USING gin (public.immutable_unaccent(LOWER(application_area)) gin_trgm_ops);
