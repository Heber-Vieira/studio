-- SQL Migration to fix Anamnesis Schema
-- Run this in your Supabase SQL Editor if you are seeing errors when creating templates or records.

-- 1. Create table for Anamnesis Templates if not exists
create table if not exists public.anamnesis_templates (
  id uuid default gen_random_uuid() primary key,
  company_id uuid,
  title text not null,
  description text,
  category text,
  fields jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Create table for Anamnesis Records if not exists
create table if not exists public.anamnesis_records (
  id uuid default gen_random_uuid() primary key,
  company_id uuid,
  template_id uuid references public.anamnesis_templates(id) on delete set null,
  client_id text,
  client_name text,
  answers jsonb not null default '{}'::jsonb,
  signature_url text,
  signed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- 3. Enable RLS
alter table public.anamnesis_templates enable row level security;
alter table public.anamnesis_records enable row level security;

-- 4. Idempotent Policy Creation for Templates
do $$
begin
    -- Select policy
    if not exists (select 1 from pg_policy where polname = 'Templates are viewable by everyone') then
        create policy "Templates are viewable by everyone" on public.anamnesis_templates for select using (true);
    end if;
    
    -- All access for authenticated users
    if not exists (select 1 from pg_policy where polname = 'Authenticated users can manage templates') then
        create policy "Authenticated users can manage templates" on public.anamnesis_templates for all using (auth.role() = 'authenticated');
    end if;
end $$;

-- 5. Idempotent Policy Creation for Records
do $$
begin
    -- Insert policy
    if not exists (select 1 from pg_policy where polname = 'Anyone can insert anamnesis records') then
        create policy "Anyone can insert anamnesis records" on public.anamnesis_records for insert with check (true);
    end if;
    
    -- Select policy for authenticated users
    if not exists (select 1 from pg_policy where polname = 'Authenticated users can view records') then
        create policy "Authenticated users can view records" on public.anamnesis_records for select using (auth.role() = 'authenticated');
    end if;
end $$;

-- 6. Trigger for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists update_anamnesis_templates_updated_at on public.anamnesis_templates;
create trigger update_anamnesis_templates_updated_at
before update on public.anamnesis_templates
for each row
execute function update_updated_at_column();

-- 7. Indexes
create index if not exists idx_anamnesis_templates_company on public.anamnesis_templates(company_id);
create index if not exists idx_anamnesis_records_template on public.anamnesis_records(template_id);
create index if not exists idx_anamnesis_records_client on public.anamnesis_records(client_id);
