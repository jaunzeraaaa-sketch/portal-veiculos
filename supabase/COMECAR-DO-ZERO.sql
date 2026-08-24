-- =====================================================================
--  PORTAL VEÍCULOS — COMEÇAR DO ZERO
--
--  Apaga TODOS os dados de teste e deixa o sistema limpo para o uso real.
--
--  ⚠️  ISSO NÃO TEM VOLTA. Rode só quando tiver certeza.
--
--  O que APAGA:  veículos, leads, vendas, tarefas, procuras e alertas
--  O que MANTÉM: seu login, a configuração da loja (nome, WhatsApp,
--                endereço) e toda a estrutura do banco
--
--  Cole no Supabase → SQL Editor → New query → Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) ANTES: o que existe hoje
-- ---------------------------------------------------------------------
select 'ANTES DE APAGAR' as momento,
       (select count(*) from public.veiculos)   as veiculos,
       (select count(*) from public.leads)      as leads,
       (select count(*) from public.vendas)     as vendas,
       (select count(*) from public.tarefas)    as tarefas,
       (select count(*) from public.interesses) as procuras,
       (select count(*) from public.alertas)    as alertas;

-- ---------------------------------------------------------------------
-- 2) APAGA — a ordem não importa, o cascade cuida das ligações
-- ---------------------------------------------------------------------
truncate table
  public.alertas,
  public.interesses,
  public.tarefas,
  public.vendas,
  public.leads,
  public.veiculos
restart identity cascade;

-- ---------------------------------------------------------------------
-- 3) DEPOIS: confirmação
-- ---------------------------------------------------------------------
select
  case when (select count(*) from public.veiculos)
          + (select count(*) from public.leads)
          + (select count(*) from public.vendas)
          + (select count(*) from public.tarefas)
          + (select count(*) from public.interesses)
          + (select count(*) from public.alertas) = 0
       then '✅ SISTEMA ZERADO — pode começar a cadastrar os carros de verdade'
       else '⚠️ Ainda sobrou alguma coisa — me avise'
  end as resultado;

-- a configuração da loja continua intacta:
select nome as "loja", vendedor as "seu nome", whatsapp as "whatsapp", cidade
from public.config where id = 1;
