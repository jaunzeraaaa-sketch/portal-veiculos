# Portal Veículos — o que mudou

## Revisão de 24/08/2026 — correções e ajustes

### Erros corrigidos
- **"violates check constraint veiculos_status_check"** ao clicar em Suspenso e
  **"Could not find the table public.interesses"** ao salvar uma procura: os dois eram a
  mesma causa — as migrações 02 e 03 ainda não tinham sido rodadas no Supabase. Agora o
  painel **detecta isso ao abrir** e mostra uma faixa dizendo exatamente qual arquivo rodar,
  em vez de deixar o erro estourar só na hora de salvar. E toda mensagem de erro do banco
  passou a ser traduzida para português com a instrução do que fazer.

### Ajustes
- **Lead perdido agora exige justificativa.** Clicar em Perdido abre um modal próprio com a
  lista de motivos; "Outro" abre campo de texto livre. Não salva em branco, e o motivo fica
  gravado no lead e visível depois.
- **Card do veículo ao passar o mouse no Estoque**, com o mesmo componente já usado em
  Minhas vendas — ficha, números, situação do anúncio e margem.
- **Filtros em Minhas vendas:** data inicial, data final e cliente, combinados, com contador
  de resultados, soma do período e botão de limpar.
- **Menu hambúrguer no celular.** Abaixo de 900px o menu vira gaveta; testado em 320, 375,
  390 e 430 px sem nada estourar a largura da tela.
- **Rodapé da vitrine:** saiu a coluna "Todo carro daqui tem".
- **Follow-up saiu do menu.** O código continua inteiro em `src/components/Cadencia.tsx` —
  a página só redireciona para o painel.

---

## Versão de 24/08/2026

Este pacote reúne tudo que foi desenvolvido no dia. São quatro frentes.

---

### 1. Vitrine — o site que o cliente abre

- **Cabeçalho e topo viraram uma faixa escura contínua**, com a logo branca e um brilho
  vermelho da marca no canto. O site deixou de ser branco demais.
- **Frase nova:** "Seu próximo carro, na palma da sua mão".
- **Bloco de números removido** (12 carros / a partir de / 100% laudo). O espaço à direita
  ganhou uma silhueta de carro bem apagada, de fundo.
- **Botão do WhatsApp no verde oficial da marca** (`#25D366`) com o ícone do WhatsApp.
  O texto é verde-escuro em vez de branco: branco sobre esse verde tem leitura ruim no sol.
- **Ficha do carro** herdou o mesmo cabeçalho escuro, com um filete vermelho embaixo.
  O botão "Tenho interesse" também virou verde.
- Corrigida uma célula vazia que sobrava na barra de filtros no celular.

### 2. Estoque — cadastro e listagem

- **Miniatura da foto no lugar da coluna Código.** O código continua visível, embaixo do
  nome do veículo. Quando há mais de uma foto, a miniatura mostra a quantidade.
- **Upload de fotos** no cadastro, com dois botões: **Tirar foto** (abre a câmera direto no
  celular) e **Escolher da galeria**. A foto é reduzida no próprio navegador antes de subir —
  4 MB do celular viram cerca de 250 KB. Dá para trocar a capa e remover foto. Até 10 por carro — travado no navegador, no servidor e no banco.
- **"Informe os opcionais do seu veículo"** — lista de marcação agrupada em Conforto,
  Segurança, Tecnologia e Externo, no estilo dos portais. Vira a lista "Itens do veículo"
  na ficha que o cliente abre.
- **"Informe as condições do veículo"** — único dono, laudo cautelar, IPVA pago, chave
  reserva e outras. Viram os selos de confiança da ficha.
- **Filtros novos** na listagem: só na vitrine, só suspensos, só vendidos, **sem foto**.
- No cadastro, você escolhe se o carro **já entra na vitrine** ou fica suspenso.

### 3. Aba Vitrine — controle do que o cliente vê

- **Lista dos veículos** com foto, preço e a situação de cada um.
- **Três situações:** Ativo (aparece para o cliente), Suspenso (fica no estoque mas some do
  site) e Vendido. Troca com um clique.
- **Botão "+ Adicionar veículo na vitrine"**, que puxa do estoque os carros que estão fora
  e publica vários de uma vez.
- Indicador de **publicados sem foto** — anúncio sem foto é anúncio que não vende.

### 4. Leads — de cadastro para ferramenta de venda

- **Campo Observação** no cadastro e na edição do lead. Aparece resumido no card do funil.
- **"Adicionar às minhas tarefas"** (caixa de marcação). Cria a tarefa da próxima ação já
  com o nome do cliente. **Nada é criado sem marcar.**
- **"Criar lembrete no calendário"** (caixa de marcação). Cria um aviso com data e hora
  próprias, que faz o sino tocar. Também só com a caixa marcada.
  As duas aparecem em Minhas tarefas com o chip do cliente e atalho para o funil.
- **Procura no mercado:** registre o carro que o cliente quer e você ainda não tem —
  marca, modelo, versão, ano (ou faixa de anos), teto de preço e observações.
- **Alerta automático:** quando você cadastra um veículo que bate com alguma procura,
  o sino acende e o alerta aparece na aba Leads com [Ver lead] [Ver veículo] [WhatsApp].
  Funciona nos dois sentidos: registrar uma procura também varre o estoque atual.
- **Correspondência por marca + modelo + ano**, sem acento, sem maiúscula e sem hífen —
  `HR-V`, `HRV` e `hr v` são a mesma coisa. Versão e preço só reprovam se você preencher.
  `Corolla Cross` não casa com `Corolla`, de propósito.
- **Sem alerta repetido:** um índice único no banco garante que o mesmo cliente + carro
  gera um aviso só, para sempre.
- **Seis situações de alerta:** Novo · Visualizado · Contatado · Negociação · Vendido ·
  Sem interesse.

---

## Banco de dados

Duas migrações acompanham esta versão. Rode cada uma **uma vez** no
Supabase → SQL Editor → New query → cole → Run:

| Arquivo | O que faz |
|---|---|
| `supabase/migracao-02-vitrine-fotos.sql` | Situação "suspenso" e a coluna de condições do veículo |
| `supabase/migracao-03-leads-interesses.sql` | Observação do lead, tarefas ligadas ao lead, tabelas de interesses e alertas |

As duas são seguras de rodar de novo: nada é apagado.

---

## Ainda na fila

- Publicar na Vercel para o site sair do seu computador e ir para o ar.
- Integrações: Mercado Livre (o único que dá para ligar sozinho), Facebook, Instagram
  (a análise da Meta demora, vale começar cedo) e OLX (decisão comercial).
- Gatilho de alerta dentro do próprio banco, para valer também quando o veículo é
  alterado depois ou inserido direto pelo SQL Editor.
