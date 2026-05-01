
-- 1. Companies: B2B identity fields (slug added without UNIQUE first; backfill uniquely; then add UNIQUE)
alter table public.companies
  add column if not exists tagline text,
  add column if not exists slug text,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists goals text[] default '{}'::text[],
  add column if not exists auto_join_domain text;

-- Dedupe-aware backfill of slug
do $$
declare
  r record;
  base text;
  candidate text;
  n int;
begin
  for r in select id, name from public.companies where slug is null or slug = '' loop
    base := lower(regexp_replace(coalesce(r.name, 'company'), '[^a-zA-Z0-9]+', '-', 'g'));
    base := trim(both '-' from base);
    if base = '' then base := 'company'; end if;
    candidate := base;
    n := 0;
    while exists (select 1 from public.companies where slug = candidate and id <> r.id) loop
      n := n + 1;
      candidate := base || '-' || n::text;
    end loop;
    update public.companies set slug = candidate where id = r.id;
  end loop;
end $$;

-- Now safely enforce uniqueness
do $$ begin
  alter table public.companies add constraint companies_slug_key unique (slug);
exception when duplicate_object then null; end $$;

create index if not exists idx_companies_slug on public.companies(slug);
create index if not exists idx_companies_auto_join_domain on public.companies(auto_join_domain);

-- 2. Company services
create table if not exists public.company_services (
  company_id uuid not null references public.companies(id) on delete cascade,
  service_key text not null,
  created_at timestamptz not null default now(),
  primary key (company_id, service_key)
);

alter table public.company_services enable row level security;

drop policy if exists "Members can view their company services" on public.company_services;
create policy "Members can view their company services"
  on public.company_services for select
  using (
    exists (
      select 1 from public.company_members cm
      where cm.company_id = company_services.company_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
    )
    or has_role(auth.uid(), 'admin'::app_role)
  );

drop policy if exists "Owners and admins can manage company services" on public.company_services;
create policy "Owners and admins can manage company services"
  on public.company_services for all
  using (
    exists (
      select 1 from public.company_members cm
      where cm.company_id = company_services.company_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
        and cm.role in ('owner','admin')
    )
    or has_role(auth.uid(), 'admin'::app_role)
  )
  with check (
    exists (
      select 1 from public.company_members cm
      where cm.company_id = company_services.company_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
        and cm.role in ('owner','admin')
    )
    or has_role(auth.uid(), 'admin'::app_role)
  );

-- 3. Feed posts: dual authorship
alter table public.feed_posts
  add column if not exists author_type text not null default 'user',
  add column if not exists author_company_id uuid references public.companies(id) on delete set null,
  add column if not exists author_user_id uuid;

do $$ begin
  alter table public.feed_posts
    add constraint feed_posts_author_type_check
    check (author_type in ('user','company','admin'));
exception when duplicate_object then null; end $$;

create index if not exists idx_feed_posts_author_company on public.feed_posts(author_company_id);
create index if not exists idx_feed_posts_author_user on public.feed_posts(author_user_id);

-- 4. Company post drafts
create table if not exists public.company_post_drafts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  author_user_id uuid not null,
  agent_key text,
  text_content text not null,
  media_url text,
  link_url text,
  link_preview jsonb,
  tags text[] default '{}'::text[],
  status text not null default 'pending' check (status in ('pending','published','discarded')),
  published_post_id uuid references public.feed_posts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.company_post_drafts enable row level security;

drop policy if exists "Company members can view drafts for their company" on public.company_post_drafts;
create policy "Company members can view drafts for their company"
  on public.company_post_drafts for select
  using (
    exists (
      select 1 from public.company_members cm
      where cm.company_id = company_post_drafts.company_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
    )
    or has_role(auth.uid(), 'admin'::app_role)
  );

drop policy if exists "Members can create their own drafts" on public.company_post_drafts;
create policy "Members can create their own drafts"
  on public.company_post_drafts for insert
  with check (
    author_user_id = auth.uid()
    and exists (
      select 1 from public.company_members cm
      where cm.company_id = company_post_drafts.company_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
    )
  );

drop policy if exists "Authors can update their own drafts" on public.company_post_drafts;
create policy "Authors can update their own drafts"
  on public.company_post_drafts for update
  using (author_user_id = auth.uid())
  with check (author_user_id = auth.uid());

drop policy if exists "Authors can discard their own drafts" on public.company_post_drafts;
create policy "Authors can discard their own drafts"
  on public.company_post_drafts for delete
  using (author_user_id = auth.uid());

drop trigger if exists update_company_post_drafts_updated_at on public.company_post_drafts;
create trigger update_company_post_drafts_updated_at
  before update on public.company_post_drafts
  for each row execute function public.update_updated_at_column();

-- 5. Slug auto-set trigger for new companies
create or replace function public.companies_set_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  candidate text;
  n int := 0;
begin
  if new.slug is not null and new.slug <> '' then
    return new;
  end if;
  base := lower(regexp_replace(coalesce(new.name, 'company'), '[^a-zA-Z0-9]+', '-', 'g'));
  base := trim(both '-' from base);
  if base = '' then base := 'company'; end if;
  candidate := base;
  while exists (select 1 from public.companies where slug = candidate) loop
    n := n + 1;
    candidate := base || '-' || n::text;
  end loop;
  new.slug := candidate;
  return new;
end;
$$;

drop trigger if exists trg_companies_set_slug on public.companies;
create trigger trg_companies_set_slug
  before insert on public.companies
  for each row execute function public.companies_set_slug();
