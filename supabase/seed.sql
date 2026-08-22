-- =====================================================================
-- Dados de exemplo — rode depois do schema.sql para ver o sistema com conteúdo.
-- Quando começar a usar de verdade, apague tudo com:
--   delete from public.vendas; delete from public.tarefas;
--   delete from public.leads;  delete from public.veiculos;
-- =====================================================================

insert into public.veiculos
  (cod, placa, marca, modelo, versao, ano_fab, ano_mod, km, cor, cambio, preco, fipe, custo, data_entrada)
values
  ('ONIX-2021-A7X3','ABC1D23','Chevrolet','Onix','1.0 Turbo LTZ',2021,2021,42300,'Prata','Automático',78900,79400,71500, current_date - 18),
  ('HB20-2022-B4K9','DEF2E34','Hyundai','HB20','1.0 Comfort Plus',2022,2022,31800,'Branco','Manual',74500,73900,67200, current_date - 9),
  ('STRADA-2023-C2M1','GHI3F45','Fiat','Strada','Freedom 1.3 CD',2023,2023,28400,'Vermelho','Manual',96900,95100,88000, current_date - 31),
  ('GOL-2019-D8P5','JKL4G56','Volkswagen','Gol','1.6 MSI Trendline',2019,2020,68900,'Prata','Manual',52400,54000,47800, current_date - 63),
  ('COROLLA-2020-E1T7','MNO5H67','Toyota','Corolla','2.0 XEi',2020,2021,55100,'Preto','Automático',118900,116200,106000, current_date - 24),
  ('KICKS-2022-F6R2','PQR6I78','Nissan','Kicks','1.6 SV CVT',2022,2022,39700,'Cinza','Automático',98500,99800,90500, current_date - 12),
  ('RENEGADE-2021-G3W8','STU7J89','Jeep','Renegade','1.8 Longitude',2021,2021,47200,'Branco','Automático',107900,102400,95000, current_date - 52),
  ('POLO-2023-H9L4','VWX8K90','Volkswagen','Polo','1.0 TSI Highline',2023,2023,22600,'Azul','Automático',92400,91700,84900, current_date - 6),
  ('HRV-2020-J5N6','YZA9L01','Honda','HR-V','1.8 EX CVT',2020,2020,61400,'Prata','Automático',106500,108900,97000, current_date - 38),
  ('ARGO-2022-K7Q3','BCD0M12','Fiat','Argo','1.0 Drive',2022,2022,35900,'Branco','Manual',66900,65800,60400, current_date - 15),
  ('TRACKER-2021-L2V9','EFG1N23','Chevrolet','Tracker','1.0 Turbo LT',2021,2022,44800,'Preto','Automático',94900,96300,86700, current_date - 71),
  ('COMPASS-2022-M8Z5','HIJ2O34','Jeep','Compass','1.3 T270 Longitude',2022,2022,33200,'Cinza','Automático',148900,146500,136000, current_date - 27)
on conflict (cod) do nothing;

insert into public.leads (nome, telefone, cidade, origem, estagio, proxima_acao, proxima_acao_data, veiculo_id)
select l.nome, l.telefone, l.cidade, l.origem, l.estagio, l.acao, l.dt, v.id
from (values
  ('Ana Beatriz Rocha','(67) 99811-2200','Três Lagoas/MS','Instagram','Novo','Primeiro contato', current_date, 'POLO-2023-H9L4'),
  ('Marcos Tavares','(67) 99722-3311','Três Lagoas/MS','Webmotors','Novo','Primeiro contato', current_date, 'ONIX-2021-A7X3'),
  ('Diego Fontes','(67) 99633-4422','Selvíria/MS','Indicação','Contatado','Retornar ligação', current_date - 2, 'GOL-2019-D8P5'),
  ('Camila Duarte','(67) 99544-5533','Três Lagoas/MS','Instagram','Qualificado','Avaliar carro na troca', current_date + 1, 'HB20-2022-B4K9'),
  ('Fernando Alves','(67) 99455-6644','Andradina/SP','Webmotors','Qualificado','Enviar laudo cautelar', current_date - 1, 'COMPASS-2022-M8Z5'),
  ('Bruno Carvalho','(67) 99366-7755','Três Lagoas/MS','Mercado Livre','Visita agendada','Visita sábado 10h', current_date + 3, 'STRADA-2023-C2M1'),
  ('Sandra Ribeiro','(67) 99277-8866','Três Lagoas/MS','Instagram','Visita agendada','Visita quinta 15h', current_date + 1, 'HRV-2020-J5N6'),
  ('Eduardo Pinho','(67) 99188-9977','Brasilândia/MS','Site próprio','Visita realizada','Aguardando banco', current_date + 1, 'POLO-2023-H9L4')
) as l(nome, telefone, cidade, origem, estagio, acao, dt, cod)
join public.veiculos v on v.cod = l.cod;

insert into public.tarefas (data, hora, titulo, descricao, feito) values
  (current_date - 2, '15:00','Retornar ligação da Larissa Moraes','Ela pediu para ligar depois das 15h. Interesse no Tracker 2021.', false),
  (current_date,     '09:00','Ligar para Diego Fontes','Ação vencida no funil há 2 dias. Gol 2019, ficou de decidir sobre a entrada.', true),
  (current_date,     '16:30','Visita do Bruno Carvalho — Fiat Strada','Deixar a Strada lavada e com o tanque marcado. Ele vem com a esposa.', false),
  (current_date,     '18:00','Fechar o dia: atualizar o funil','Todo lead sem próxima ação tem que sair da lista antes de eu ir embora.', false),
  (current_date + 1, '10:00','Entrega do Argo para a Renata','Documentação pronta, conferir se o despachante já mandou o CRLV.', false),
  (current_date + 3, '09:30','Cobrar retorno do banco — Eduardo Pinho','Financiamento do Polo, análise entrou na terça.', false),
  (current_date + 6, '11:00','Revisar preço dos carros parados há mais de 45 dias','Gol e Renegade. Levar a comparação da FIPE para o gerente.', false);

insert into public.vendas
  (data_venda, cliente, telefone, cidade, veiculo_desc, veiculo_cod, valor_venda, custo_carro, outros_custos,
   troca_modelo, troca_ano, troca_placa, troca_cor, troca_valor)
values
  (current_date - 4,  'Renata Figueiredo','(67) 99812-4471','Três Lagoas/MS','Fiat Argo 1.0 Drive','ARGO-2022-K7Q3', 66900, 60400, 850, 'Ford Ka 1.0 SE','2017/2018','QAB7C42','Prata', 38500),
  (current_date - 11, 'Wagner Souto','(67) 99745-2210','Selvíria/MS','Nissan Kicks 1.6 SV','KICKS-2022-F6R2', 98500, 90500, 1200, null, null, null, null, null),
  (current_date - 18, 'Helena Castro','(67) 99633-8890','Três Lagoas/MS','Hyundai HB20 1.0 Comfort Plus','HB20-2022-B4K9', 74500, 67200, 640, 'VW Fox 1.6 Connect','2019/2019','RTA2J09','Branco', 44200);

update public.config set
  nome='Portal Veículos', cidade='Três Lagoas · MS', vendedor='João Vitor',
  whatsapp='5567999990000', whatsapp_exibe='(67) 99999-0000',
  endereco='Av. Ranulpho Marques Leal, 0000 — Três Lagoas/MS'
where id = 1;
