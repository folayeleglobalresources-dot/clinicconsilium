create policy "No direct access to enquiry activity"
on public.enquiry_activity
for all
to anon, authenticated
using (false)
with check (false);