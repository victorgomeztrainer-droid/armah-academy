-- Allow approved users to view ALL programs (published + coming soon catalog)
-- They can see the card but content is still locked (no modules/lessons for unpublished)
create policy "Approved users view all programs catalog" on public.programs
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_approved = true
    )
  );

-- Drop the old restrictive policy
drop policy if exists "Approved users view published programs" on public.programs;
