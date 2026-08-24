-- =====================================================================
--  PORTAL VEÍCULOS — ATUALIZAR O BANCO
--
--  Cole ESTE arquivo inteiro no Supabase:
--     SQL Editor  →  New query  →  colar  →  Run
--
--  Ele junta as migrações 02 e 03 numa só. É seguro rodar quantas vezes
--  quiser: nada é apagado, nenhum dado é perdido.
--  No fim ele mostra uma linha dizendo se deu tudo certo.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) VEÍCULOS — situação "suspenso" e a coluna de condições
-- ---------------------------------------------------------------------
alter table public.veiculos drop constraint if exists veiculos_status_check;
alter table public.veiculos
  add constraint veiculos_status_check
  check (status in ('disponivel', 'suspenso', 'reservado', 'vendido'));

alter table public.veiculos add column if not exists condicoes text[] default '{}';
alter table public.veiculos add column if not exists opcionais text[] default '{}';
alter table public.veiculos add column if not exists fotos     text[] default '{}';

-- ---------------------------------------------------------------------
-- 2) LEADS e TAREFAS — observação, vínculo com o lead e tipo
-- ---------------------------------------------------------------------
alter table public.leads   add column if not exists observacoes  text;
alter table public.leads   add column if not exists motivo_perda text;

alter table public.tarefas add column if not exists lead_id uuid
  references public.leads(id) on delete set null;
alter table public.tarefas add column if not exists tipo text not null default 'tarefa';

alter table public.tarefas drop constraint if exists tarefas_tipo_check;
alter table public.tarefas
  add constraint tarefas_tipo_check check (tipo in ('tarefa', 'lembrete'));

create index if not exists tarefas_lead_idx on public.tarefas(lead_id);

-- ---------------------------------------------------------------------
-- 3) INTERESSES — o carro que o cliente procura e você ainda não tem
-- ---------------------------------------------------------------------
create table if not exists public.interesses (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  marca       text not null,
  modelo      text not null,
  versao      text,
  ano         int,
  ano_ate     int,
  preco_ate   numeric(12,2),
  observacoes text,
  status      text not null default 'Aguardando disponibilidade'
              check (status in ('Aguardando disponibilidade', 'Atendido', 'Cancelado')),
  criado_em   timestamptz not null default now()
);
create index if not exists interesses_lead_idx   on public.interesses(lead_id);
create index if not exists interesses_status_idx on public.interesses(status);
create index if not exists interesses_busca_idx  on public.interesses(lower(marca), lower(modelo));

-- ---------------------------------------------------------------------
-- 4) ALERTAS — o carro procurado entrou no estoque
-- ---------------------------------------------------------------------
create table if not exists public.alertas (
  id           uuid primary key default gen_random_uuid(),
  interesse_id uuid not null references public.interesses(id) on delete cascade,
  lead_id      uuid not null references public.leads(id)      on delete cascade,
  veiculo_id   uuid not null references public.veiculos(id)   on delete cascade,
  status       text not null default 'Novo'
               check (status in ('Novo','Visualizado','Contatado','Negociação','Vendido','Sem interesse')),
  criado_em    timestamptz not null default now(),
  visto_em     timestamptz
);
-- é esta linha que impede o mesmo aviso de aparecer duas vezes
create unique index if not exists alertas_unico on public.alertas(interesse_id, veiculo_id);
create index if not exists alertas_status_idx on public.alertas(status);
create index if not exists alertas_lead_idx   on public.alertas(lead_id);

-- ---------------------------------------------------------------------
-- 5) VISÕES
-- ---------------------------------------------------------------------
-- A view precisa ser derrubada antes: com "create or replace" o Postgres
-- recusa a troca porque o "select v.*" ganhou uma coluna nova (condicoes).
drop view if exists public.alertas_view;
drop view if exists public.veiculos_view;

create view public.veiculos_view as
  select v.*,
         (current_date - v.data_entrada)::int as dias_estoque,
         case when v.fipe is null or v.fipe = 0 then null
              else round(((v.preco - v.fipe) / v.fipe) * 100, 1) end as delta_fipe,
         (v.preco - v.custo) as margem
  from public.veiculos v;

create view public.alertas_view as
  select a.id, a.status, a.criado_em, a.visto_em,
         a.lead_id, a.interesse_id, a.veiculo_id,
         l.nome as lead_nome, l.telefone as lead_telefone,
         i.marca as busca_marca, i.modelo as busca_modelo,
         i.versao as busca_versao, i.ano as busca_ano,
         v.cod, v.marca, v.modelo, v.versao, v.ano_fab, v.ano_mod,
         v.preco, v.km, v.cor, v.status as veiculo_status, v.fotos
    from public.alertas a
    join public.leads      l on l.id = a.lead_id
    join public.interesses i on i.id = a.interesse_id
    join public.veiculos   v on v.id = a.veiculo_id;

alter view public.veiculos_view set (security_invoker = on);
alter view public.alertas_view  set (security_invoker = on);
grant select on public.veiculos_view to anon, authenticated;
grant select on public.alertas_view  to authenticated;

-- ---------------------------------------------------------------------
-- 6) SEGURANÇA — o painel exige login, a vitrine continua pública
-- ---------------------------------------------------------------------
alter table public.interesses enable row level security;
alter table public.alertas    enable row level security;

drop policy if exists interesses_dono on public.interesses;
create policy interesses_dono on public.interesses
  for all to authenticated using (true) with check (true);

drop policy if exists alertas_dono on public.alertas;
create policy alertas_dono on public.alertas
  for all to authenticated using (true) with check (true);

-- o cliente só enxerga o que está disponível
drop policy if exists veiculos_publico on public.veiculos;
create policy veiculos_publico on public.veiculos
  for select to anon using (status = 'disponivel');

-- ---------------------------------------------------------------------
-- 7) BALDE DAS FOTOS — se já existir, não faz nada
-- ---------------------------------------------------------------------
do $$
begin
  insert into storage.buckets (id, name, public)
  values ('fotos', 'fotos', true)
  on conflict (id) do nothing;

  drop policy if exists fotos_leitura on storage.objects;
  create policy fotos_leitura on storage.objects
    for select to anon, authenticated using (bucket_id = 'fotos');

  drop policy if exists fotos_escrita on storage.objects;
  create policy fotos_escrita on storage.objects
    for insert to authenticated with check (bucket_id = 'fotos');

  drop policy if exists fotos_exclusao on storage.objects;
  create policy fotos_exclusao on storage.objects
    for delete to authenticated using (bucket_id = 'fotos');
exception when others then
  raise notice 'Balde de fotos: crie manualmente em Storage → New bucket → nome "fotos" → marque Public. (%)', sqlerrm;
end $$;

-- ---------------------------------------------------------------------
-- 8) CONFERÊNCIA — o resultado desta consulta é o seu recibo
-- ---------------------------------------------------------------------
select
  case when count(*) = 5 then '✅ TUDO CERTO — pode voltar ao sistema e recarregar a página'
       else '⚠️ Faltou algo: ' || string_agg(item, ', ') end as resultado
from (
  select 'situação suspenso' as item
    where exists (select 1 from pg_constraint
                  where conname = 'veiculos_status_check'
                    and pg_get_constraintdef(oid) like '%suspenso%')
  union all
  select 'coluna condicoes'
    where exists (select 1 from information_schema.columns
                  where table_name = 'veiculos' and column_name = 'condicoes')
  union all
  select 'tabela interesses'
    where to_regclass('public.interesses') is not null
  union all
  select 'tabela alertas'
    where to_regclass('public.alertas') is not null
  union all
  select 'tarefas ligadas ao lead'
    where exists (select 1 from information_schema.columns
                  where table_name = 'tarefas' and column_name = 'lead_id')
) t;
