-- Force convert uploaded_by to UUID for vts_system_attachment to match Java entity UUID mapping
ALTER TABLE public.vts_system_attachment ALTER COLUMN uploaded_by TYPE UUID USING (CASE WHEN uploaded_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN uploaded_by::text::uuid ELSE NULL END);
