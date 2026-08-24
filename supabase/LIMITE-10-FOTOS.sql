-- =====================================================================
--  PORTAL VEÍCULOS — limite de 10 fotos por veículo
--  Cole no Supabase → SQL Editor → New query → Run.
--  Seguro rodar mais de uma vez. Não apaga foto nenhuma.
-- =====================================================================

-- ---------------------------------------------------------------------
--  LIMITE DE FOTOS — no máximo 10 por veículo
-- ---------------------------------------------------------------------
alter table public.veiculos drop constraint if exists veiculos_fotos_max;
alter table public.veiculos
  add constraint veiculos_fotos_max
  check (fotos is null or array_length(fotos, 1) is null or array_length(fotos, 1) <= 10);

-- conferência
select case when exists (
         select 1 from pg_constraint where conname = 'veiculos_fotos_max'
       ) then '✅ Limite de 10 fotos por veículo ativo'
       else '⚠️ Não criou — me avise' end as resultado;
