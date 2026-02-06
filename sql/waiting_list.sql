
-- Tabela de Fila de Espera
create table if not exists waiting_list (
  id uuid default gen_random_uuid() primary key,
  company_id uuid not null,
  client_id text not null, -- Pode ser 'external' ou UUID
  client_name text not null,
  client_phone text not null,
  service_id uuid not null,
  service_name text not null,
  professional_id uuid, -- Opcional: Se null, qualquer profissional
  professional_name text,
  preferred_date date not null,
  
  status text check (status in ('active', 'notified', 'converted', 'cancelled', 'expired')) default 'active',
  priority_score integer default 0,
  
  created_at timestamp with time zone default now(),
  notified_at timestamp with time zone,
  expires_at timestamp with time zone,
  
  -- Constraint composta para evitar duplicidade
  -- Incluímos client_name para permitir múltiplos 'external' (sem telefone) desde que nomes sejam diferentes
  unique(client_name, client_phone, service_id, preferred_date, status)
);

-- Indexação para busca rápida por data e status
create index if not exists idx_waiting_list_priority on waiting_list (preferred_date, status, priority_score desc);


-- [BACKEND TRIGGER LOGIC]
-- Função que roda quando um agendamento é cancelado
create or replace function check_waiting_list()
returns trigger as $$
declare
    next_client record;
    appt_date date;
    appt_pro_id uuid;
begin
    -- Só roda se o status mudou para cancelled
    if (new.status = 'cancelled' and old.status <> 'cancelled') then
        appt_date := new.appointment_date::date;
        appt_pro_id := new.professional_id;

        -- 1. Buscar top 3 candidatos na fila
        -- que querem esta data e este profissional (ou qualquer um)
        for next_client in 
            select * from waiting_list
            where status = 'active'
              and preferred_date = appt_date
              and (professional_id is null or professional_id = appt_pro_id)
            order by priority_score desc, created_at asc
            limit 3
        loop
            -- 2. Atualizar status e Notificar (Simulação)
            update waiting_list 
            set status = 'notified',
                notified_at = now(),
                expires_at = now() + interval '30 minutes'
            where id = next_client.id;
            
            -- O sistema de notificação real observaria a mudança para 'notified' e enviaria o Push/Whats
        end loop;
    end if;
    return new;
end;
$$ language plpgsql;

-- Trigger (Assume que a tabela appointments existe no projeto correto)
drop trigger if exists on_appointment_cancel on appointments;
create trigger on_appointment_cancel
after update on appointments
for each row
execute function check_waiting_list();

-- Row Level Security (RLS) policies
alter table waiting_list enable row level security;

-- Remove policies antigas para recriar
drop policy if exists "Fila pública para inserção" on waiting_list;
drop policy if exists "Leitura pública de status" on waiting_list;

create policy "Fila pública para inserção" 
on waiting_list for insert 
with check (true);

create policy "Leitura pública de status" 
on waiting_list for select 
using (true);
