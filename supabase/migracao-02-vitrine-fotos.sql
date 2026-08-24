-- =====================================================================
-- Portal Veículos — migração 02
-- Rode ESTE arquivo inteiro no Supabase → SQL Editor → New query → Run.
-- É seguro rodar mais de uma vez: nada é apagado.
--
-- O que ele faz:
--   1. libera a situação "suspenso" (carro que fica no estoque mas sai da vitrine)
--   2. cria a coluna "condicoes" (único dono, laudo cautelar, IPVA pago…)
-- =====================================================================

-- 1) situação do veículo: disponivel (ativo na vitrine) · suspenso · reservado · vendido
alter table public.veiculos drop constraint if exists veiculos_status_check;
alter table public.veiculos
  add constraint veiculos_status_check
  check (status in ('disponivel', 'suspenso', 'reservado', 'vendido'));

-- 2) condições do veículo, marcadas por caixa de seleção no cadastro
alter table public.veiculos
  add column if not exists condicoes text[] default '{}';

-- 3) a view é recriada para enxergar a coluna nova.
--    Tem que derrubar antes: "create or replace" não aceita coluna nova no select *.
drop view if exists public.veiculos_view;
create view public.veiculos_view as
  select v.*,
         (current_date - v.data_entrada)::int as dias_estoque,
         case when v.fipe is null or v.fipe = 0 then null
              else round(((v.preco - v.fipe) / v.fipe) * 100, 1) end as delta_fipe,
         (v.preco - v.custo) as margem
  from public.veiculos v;

alter view public.veiculos_view set (security_invoker = on);

-- 4) confirmação: a vitrine pública continua mostrando SÓ o que está disponível.
--    Carro suspenso ou vendido não aparece para o cliente.
drop policy if exists veiculos_publico on public.veiculos;
create policy veiculos_publico on public.veiculos
  for select to anon using (status = 'disponivel');

-- pronto. Se apareceu "Success. No rows returned", deu certo.
