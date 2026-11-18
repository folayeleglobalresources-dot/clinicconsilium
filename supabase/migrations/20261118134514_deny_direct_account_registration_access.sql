create policy "No direct access to account registrations"
on public.account_registrations
for all
to anon, authenticated
using (false)
with check (false);
