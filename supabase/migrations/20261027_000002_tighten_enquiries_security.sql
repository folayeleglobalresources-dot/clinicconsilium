-- Tighten the initial enquiries schema after the first security-advisor review.
-- The table is intended to be accessed only by trusted server-side code using service_role.
-- Keep direct anonymous and authenticated access revoked; service_role also has an explicit RLS policy.
CREATE POLICY "service_role_manage_enquiries"
ON public.enquiries
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Pin the trigger function's search_path to prevent object-shadowing risks.
ALTER FUNCTION public.set_enquiries_updated_at()
SET search_path = public;

-- This maintenance helper must not be callable through the exposed PostgREST RPC API.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
