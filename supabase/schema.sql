-- =====================================================================
-- Portal Veículos — estrutura do banco
-- Rode este arquivo inteiro no Supabase → SQL Editor → New query → Run
-- =====================================================================

-- ---------- VEÍCULOS ----------
create table if not exists public.veiculos (
  id          uuid primary key default gen_random_uuid(),
  cod         text unique not null,
  placa       text,
  marca       text not null,
  modelo      text not null,
  versao      text not null default '',
  ano_fab     int  not null,
  ano_mod     int  not null,
  km          int  not null default 0,
  cor         text not null default '',
  cambio      text not null default 'Manual',
  combustivel text not null default 'Flex',
  preco       numeric(12,2) not null,
  fipe        numeric(12,2),
  custo       numeric(12,2) not null default 0,
  descricao   text,
  opcionais   text[] default '{}',
  fotos       text[] default '{}',
  status      text not null default 'disponivel'
              check (status in ('disponivel','reservado','vendido')),
  data_entrada date not null default current_date,
  criado_em   timestamptz not null default now()
);
create index if not exists veiculos_status_idx on public.veiculos(status);
create index if not exists veiculos_cod_idx    on public.veiculos(cod);

-- dias parados: calculado na consulta, nunca guardado
create or replace view public.veiculos_view as
  select v.*,
         (current_date - v.data_entrada)::int as dias_estoque,
         case when v.fipe is null or v.fipe = 0 then null
              else round(((v.preco - v.fipe) / v.fipe) * 100, 1) end as delta_fipe,
         (v.preco - v.custo) as margem
  from public.veiculos v;

-- ---------- LEADS ----------
create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  telefone   text,
  cidade     text,
  origem     text not null default 'Site próprio',
  veiculo_id uuid references public.veiculos(id) on delete set null,
  estagio    text not null default 'Novo'
             check (estagio in ('Novo','Contatado','Qualificado','Visita agendada',
                                'Visita realizada','Proposta','Fechado','Perdido')),
  proxima_acao      text,
  proxima_acao_data date,
  motivo_perda      text,
  observacoes       text,
  criado_em  timestamptz not null default now()
);
create index if not exists leads_estagio_idx on public.leads(estagio);

-- ---------- VENDAS ----------
create table if not exists public.vendas (
  id           uuid primary key default gen_random_uuid(),
  data_venda   date not null default current_date,
  cliente      text not null,
  telefone     text,
  cidade       text,
  veiculo_id   uuid references public.veiculos(id) on delete set null,
  veiculo_desc text not null,          -- guardado por escrito: o carro pode ser excluído depois
  veiculo_cod  text,
  valor_venda  numeric(12,2) not null,
  custo_carro  numeric(12,2) not null default 0,
  outros_custos numeric(12,2) not null default 0,
  -- carro que entrou na troca
  troca_modelo text,
  troca_ano    text,
  troca_placa  text,
  troca_cor    text,
  troca_valor  numeric(12,2),
  criado_em    timestamptz not null default now()
);
create index if not exists vendas_data_idx on public.vendas(data_venda desc);

create or replace view public.vendas_view as
  select v.*,
         (v.valor_venda - v.custo_carro - coalesce(v.outros_custos,0)) as lucro,
         (v.valor_venda - coalesce(v.troca_valor,0))                    as dinheiro_entrou
  from public.vendas v;

-- ---------- TAREFAS ----------
create table if not exists public.tarefas (
  id        uuid primary key default gen_random_uuid(),
  data      date not null,
  hora      time not null default '09:00',
  titulo    text not null,
  descricao text,
  feito     boolean not null default false,
  lead_id   uuid references public.leads(id) on delete set null,
  criado_em timestamptz not null default now()
);
create index if not exists tarefas_data_idx on public.tarefas(data);

-- ---------- CONFIGURAÇÃO DA LOJA ----------
create table if not exists public.config (
  id        int primary key default 1 check (id = 1),
  nome      text not null default 'Portal Veículos',
  cidade    text not null default 'Três Lagoas · MS',
  vendedor  text not null default 'João Vitor',
  whatsapp  text not null default '5567999990000',
  whatsapp_exibe text not null default '(67) 99999-0000',
  endereco  text not null default '',
  logo_url  text,
  atualizado_em timestamptz not null default now()
);
insert into public.config (id) values (1) on conflict (id) do nothing;

-- =====================================================================
-- SEGURANÇA (RLS)
-- Regra: a vitrine é pública, o painel exige login.
-- =====================================================================
alter table public.veiculos enable row level security;
alter table public.leads    enable row level security;
alter table public.vendas   enable row level security;
alter table public.tarefas  enable row level security;
alter table public.config   enable row level security;

-- VEÍCULOS: qualquer visitante lê os disponíveis; só quem tem login altera
drop policy if exists veiculos_publico on public.veiculos;
create policy veiculos_publico on public.veiculos
  for select to anon using (status = 'disponivel');

drop policy if exists veiculos_dono on public.veiculos;
create policy veiculos_dono on public.veiculos
  for all to authenticated using (true) with check (true);

-- CONFIG: leitura pública (a vitrine precisa do nome e do WhatsApp)
drop policy if exists config_publico on public.config;
create policy config_publico on public.config for select to anon using (true);
drop policy if exists config_dono on public.config;
create policy config_dono on public.config for all to authenticated using (true) with check (true);

-- LEADS, VENDAS, TAREFAS: nada é público
drop policy if exists leads_dono on public.leads;
create policy leads_dono on public.leads for all to authenticated using (true) with check (true);
drop policy if exists vendas_dono on public.vendas;
create policy vendas_dono on public.vendas for all to authenticated using (true) with check (true);
drop policy if exists tarefas_dono on public.tarefas;
create policy tarefas_dono on public.tarefas for all to authenticated using (true) with check (true);

-- As views herdam a permissão de quem consulta
alter view public.veiculos_view set (security_invoker = on);
alter view public.vendas_view   set (security_invoker = on);
grant select on public.veiculos_view to anon, authenticated;
grant select on public.vendas_view   to authenticated;

-- =====================================================================
-- ARMAZENAMENTO DAS FOTOS
-- Crie o bucket em Storage → New bucket → nome "fotos" → marque Public
-- Depois rode as políticas abaixo.
-- =====================================================================
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
