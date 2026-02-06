-- Create table for Anamnesis Templates
create table if not exists public.anamnesis_templates (
  id uuid default gen_random_uuid() primary key,
  company_id uuid, -- Optional, for multi-tenant
  title text not null,
  description text,
  category text,
  fields jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create table for Anamnesis Records (filled forms)
create table if not exists public.anamnesis_records (
  id uuid default gen_random_uuid() primary key,
  company_id uuid, -- Optional
  template_id uuid references public.anamnesis_templates(id) on delete set null,
  client_id text, -- Can be a UUID string or 'external'
  client_name text,
  answers jsonb not null default '{}'::jsonb,
  signature_url text, -- Stores the base64/data URL of the signature
  signed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table public.anamnesis_templates enable row level security;
alter table public.anamnesis_records enable row level security;

-- Policies for Anamnesis Templates
-- Allow read access to everyone (needed for Client Booking portal)
create policy "Templates are viewable by everyone"
  on public.anamnesis_templates for select
  using (true);

-- Allow full access to authenticated users (attendants/admins)
create policy "Authenticated users can manage templates"
  on public.anamnesis_templates for all
  using (auth.role() = 'authenticated');

-- Policies for Anamnesis Records
-- Allow insert by everyone (needed for external clients in booking portal)
create policy "Anyone can insert anamnesis records"
  on public.anamnesis_records for insert
  with check (true);

-- Allow viewing only by authenticated users (attendants)
create policy "Authenticated users can view records"
  on public.anamnesis_records for select
  using (auth.role() = 'authenticated');

-- Optional: Create updated_at trigger for templates
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_anamnesis_templates_updated_at
before update on public.anamnesis_templates
for each row
execute function update_updated_at_column();

-- Create indexes for better query performance
create index if not exists idx_anamnesis_templates_company on public.anamnesis_templates(company_id);
create index if not exists idx_anamnesis_records_template on public.anamnesis_records(template_id);
create index if not exists idx_anamnesis_records_client on public.anamnesis_records(client_id);
