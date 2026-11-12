-- Tighten initial-release enquiry and pharmacy data access.
-- Only trusted server-side functions using service_role may access these tables.

ALTER TABLE public.enquiries
  DROP CONSTRAINT IF EXISTS enquiries_enquiry_type_check;
ALTER TABLE public.enquiries
  ADD CONSTRAINT enquiries_enquiry_type_check
  CHECK (enquiry_type IN ('general', 'partnership', 'professional_interest', 'organisation_interest', 'international_care'));

GRANT USAGE ON SCHEMA public TO service_role;

REVOKE ALL ON TABLE public.enquiries, public.pharmacy_partner_applications,
  public.pharmacies, public.medicine_catalogue, public.pharmacy_inventory
FROM anon, authenticated;

GRANT ALL PRIVILEGES ON TABLE public.enquiries, public.pharmacy_partner_applications,
  public.pharmacies, public.medicine_catalogue, public.pharmacy_inventory
TO service_role;

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_catalogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_manage_enquiries ON public.enquiries;
CREATE POLICY service_role_manage_enquiries
ON public.enquiries FOR ALL TO service_role
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_manage_pharmacy_partner_applications ON public.pharmacy_partner_applications;
CREATE POLICY service_role_manage_pharmacy_partner_applications
ON public.pharmacy_partner_applications FOR ALL TO service_role
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_manage_pharmacies ON public.pharmacies;
CREATE POLICY service_role_manage_pharmacies
ON public.pharmacies FOR ALL TO service_role
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_manage_medicine_catalogue ON public.medicine_catalogue;
CREATE POLICY service_role_manage_medicine_catalogue
ON public.medicine_catalogue FOR ALL TO service_role
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_manage_pharmacy_inventory ON public.pharmacy_inventory;
CREATE POLICY service_role_manage_pharmacy_inventory
ON public.pharmacy_inventory FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_enquiries_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_pharmacy_partner_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enquiries_updated_at_trigger ON public.enquiries;
CREATE TRIGGER enquiries_updated_at_trigger
BEFORE UPDATE ON public.enquiries
FOR EACH ROW EXECUTE FUNCTION public.set_enquiries_updated_at();

DROP TRIGGER IF EXISTS pharmacy_partner_applications_updated_at_trigger
ON public.pharmacy_partner_applications;
CREATE TRIGGER pharmacy_partner_applications_updated_at_trigger
BEFORE UPDATE ON public.pharmacy_partner_applications
FOR EACH ROW EXECUTE FUNCTION public.set_pharmacy_partner_updated_at();

CREATE INDEX IF NOT EXISTS medicine_catalogue_reviewed_by_idx
  ON public.medicine_catalogue (reviewed_by);
CREATE INDEX IF NOT EXISTS pharmacies_application_id_idx
  ON public.pharmacies (application_id);
CREATE INDEX IF NOT EXISTS pharmacy_partner_applications_reviewed_by_idx
  ON public.pharmacy_partner_applications (reviewed_by);

-- Keep Supabase's RLS maintenance helper unavailable through public RPC.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
