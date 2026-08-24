-- =====================================================================
-- Portal Veículos — migração 03
-- Rode ESTE arquivo inteiro no Supabase → SQL Editor → New query → Run.
-- É seguro rodar mais de uma vez: nada é apagado.
--
-- O que ele faz:
--   1. separa tarefa de lembrete no calendário (coluna "tipo")
--   2. cria a tabela de INTERESSES  — carro que o cliente procura e você não tem
--   3. cria a tabela de ALERTAS     — o encontro entre um interesse e um carro
--                                     que acabou de entrar no estoque
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) TAREFAS: agora sabem de qual lead vieram e se são tarefa ou lembrete
-- ---------------------------------------------------------------------
alter table public.tarefas
  add column if not exists lead_id uuid references public.leads(id) on delete set null;

alter table public.tarefas
  add column if not exists tipo text not null default 'tarefa';

alter table public.tarefas drop constraint if exists tarefas_tipo_check;
alter table public.tarefas
  add constraint tarefas_tipo_check check (tipo in ('tarefa', 'lembrete'));

create index if not exists tarefas_lead_idx on public.tarefas(lead_id);

-- garante que a coluna de observação do lead existe
alter table public.leads
  add column if not exists observacoes text;

-- ---------------------------------------------------------------------
-- 2) INTERESSES — o cliente procura um carro que hoje não está no pátio
-- ---------------------------------------------------------------------
create table if not exists public.interesses (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  marca       text not null,
  modelo      text not null,
  versao      text,                 -- opcional: critério extra de conferência
  ano         int,                  -- em branco = qualquer ano serve
  ano_ate     int,                  -- opcional: aceita uma faixa de anos
  preco_ate   numeric(12,2),        -- teto que o cliente aceita pagar
  observacoes text,
  status      text not null default 'Aguardando disponibilidade'
              check (status in ('Aguardando disponibilidade', 'Atendido', 'Cancelado')),
  criado_em   timestamptz not null default now()
);
create index if not exists interesses_lead_idx   on public.interesses(lead_id);
create index if not exists interesses_status_idx on public.interesses(status);
-- busca por marca/modelo sem diferenciar maiúscula e acento é feita na aplicação
create index if not exists interesses_busca_idx  on public.interesses(lower(marca), lower(modelo));

-- ---------------------------------------------------------------------
-- 3) ALERTAS — o sistema encontrou o carro que aquele cliente procurava
-- ---------------------------------------------------------------------
create table if not exists public.alertas (
  id           uuid primary key default gen_random_uuid(),
  interesse_id uuid not null references public.interesses(id) on delete cascade,
  lead_id      uuid not null references public.leads(id)      on delete cascade,
  veiculo_id   uuid not null references public.veiculos(id)   on delete cascade,
  status       text not null default 'Novo'
               check (status in ('Novo', 'Visualizado', 'Contatado', 'Negociação', 'Vendido', 'Sem interesse')),
  criado_em    timestamptz not null default now(),
  visto_em     timestamptz
);

-- ESTA é a linha que impede o mesmo aviso de aparecer duas vezes:
-- um interesse só gera um alerta por veículo, para sempre.
create unique index if not exists alertas_unico
  on public.alertas(interesse_id, veiculo_id);

create index if not exists alertas_status_idx on public.alertas(status);
create index if not exists alertas_lead_idx   on public.alertas(lead_id);

-- ---------------------------------------------------------------------
-- 4) SEGURANÇA — nada disso é público, igual a leads e vendas
-- ---------------------------------------------------------------------
alter table public.interesses enable row level security;
alter table public.alertas    enable row level security;

drop policy if exists interesses_dono on public.interesses;
create policy interesses_dono on public.interesses
  for all to authenticated using (true) with check (true);

drop policy if exists alertas_dono on public.alertas;
create policy alertas_dono on public.alertas
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------
-- 5) VISÃO PRONTA — alerta já com o nome do cliente e o carro
-- ---------------------------------------------------------------------
create or replace view public.alertas_view as
  select a.id, a.status, a.criado_em, a.visto_em,
         a.lead_id, a.interesse_id, a.veiculo_id,
         l.nome     as lead_nome,
         l.telefone as lead_telefone,
         i.marca    as busca_marca,
         i.modelo   as busca_modelo,
         i.versao   as busca_versao,
         i.ano      as busca_ano,
         v.cod, v.marca, v.modelo, v.versao, v.ano_fab, v.ano_mod,
         v.preco, v.km, v.cor, v.status as veiculo_status, v.fotos
    from public.alertas a
    join public.leads      l on l.id = a.lead_id
    join public.interesses i on i.id = a.interesse_id
    join public.veiculos   v on v.id = a.veiculo_id;

alter view public.alertas_view set (security_invoker = on);
grant select on public.alertas_view to authenticated;

-- pronto. Se apareceu "Success. No rows returned", deu certo.
