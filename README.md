# Portal Veículos — sistema do vendedor

Site público com o estoque + painel privado de estoque, vendas e tarefas.
Next.js 16 · Supabase · Vercel.

**A vitrine é aberta. Todo o resto exige login.** Quem tentar abrir `/painel` sem estar logado cai na tela de entrada — testei rota por rota.

---

## 1. O que já está pronto

| Rota | Quem acessa | O que faz |
|---|---|---|
| `/` | qualquer pessoa | Vitrine com filtro de marca, faixa de preço e ordenação |
| `/carro/onix-2021-a7x3` | qualquer pessoa | Ficha do veículo com o link de WhatsApp já com o código |
| `/login` | qualquer pessoa | Entrada no painel |
| `/painel` | só logado | Atividades de hoje, alertas de estoque, resumo do mês |
| `/painel/estoque` | só logado | Cadastrar, editar, marcar vendido, excluir |
| `/painel/vendas` | só logado | Lista com lucro e ficha completa no hover; registrar venda com troca |
| `/painel/tarefas` | só logado | Calendário com sino de notificação |
| `/painel/vitrine` | só logado | Dados da loja e botão VER COMO O CLIENTE |

Quando você registra uma venda, três coisas acontecem sozinhas: a venda entra na lista, o carro sai da vitrine, e o carro da troca entra no estoque pelo valor de entrada.

---

## 2. Antes de começar: o custo real

Preciso ser direto com você em dois pontos que quase nenhum tutorial menciona.

**A Vercel gratuita não serve para o seu caso.** O plano Hobby é restrito a uso pessoal não comercial, e a própria Vercel define como comercial qualquer site que anuncie a venda de um produto ou serviço. A sua vitrine anuncia carros. Na prática você precisa do **Pro, US$ 20/mês**. Dá para usar o Hobby enquanto está testando e ninguém real está acessando, mas na hora que virar o site de verdade, sobe para Pro.

**O Supabase gratuito serve para começar, com um alerta.** O Free dá 500 MB de banco, 1 GB de arquivos, 5 GB de tráfego e 50 mil usuários por mês — muito mais do que você vai usar. O problema é que **projeto gratuito é pausado depois de 1 semana sem acesso**. Como você vai usar todo dia, na prática não pausa. Se pausar, você reativa em um clique no painel do Supabase. O Pro custa US$ 25/mês e remove a pausa, além de dar backup diário.

**Minha recomendação de armazenamento:** comece com **Supabase Free**. Ele resolve as três coisas de que você precisa numa conta só — banco de dados, login e as fotos dos carros. Migre para o Pro quando (a) as fotos passarem de 1 GB, mais ou menos 400 carros com 12 fotos cada, ou (b) você começar a perder tempo com pausa. Enquanto isso, **ative o backup manual uma vez por semana** (instruções na seção 8) — no Free não existe backup automático, e é o único risco de verdade que você corre.

Custo para começar: **US$ 20/mês** (Vercel Pro) + **R$ 40/ano** de domínio. Perto de R$ 115 por mês.

---

## 2.1 Se você baixou a versão anterior deste projeto

A primeira versão vinha com **Next.js 15.1.6**, que tem uma falha crítica de execução remota de código (CVE-2025-66478, nota 10 de 10). Já corrigi — este pacote vem com Next 16, sem nenhum alerta de segurança.

Se você já tinha instalado a versão antiga, não precisa baixar tudo de novo. Dentro da pasta do projeto, rode:

```bash
npm install next@16 react@latest react-dom@latest
npm audit
```

Tem que aparecer `found 0 vulnerabilities`.

> Só corre risco de verdade quem tinha o site **no ar** com a versão vulnerável. Se você só rodou na sua máquina, não houve exposição e não precisa trocar senha nenhuma.

---

## 3. Instalar no MacBook

Abra o **Terminal** (⌘+espaço, digite "terminal").

### 3.1 Node.js

```bash
node -v
```

Se não aparecer `v20` ou maior, baixe o instalador LTS em <https://nodejs.org> e rode. Depois feche e abra o Terminal de novo.

### 3.2 Abrir o projeto

Descompacte a pasta `portal-veiculos` em algum lugar fácil, por exemplo `Documentos`. Depois:

```bash
cd ~/Documents/portal-veiculos
npm install
```

Para abrir no VS Code:

```bash
code .
```

> Se `code` não funcionar: abra o VS Code, aperte ⇧⌘P, digite "shell command" e escolha **Install 'code' command in PATH**.

---

## 4. Criar o banco no Supabase

1. Entre em <https://supabase.com> e crie a conta (dá para usar o GitHub).
2. **New project**. Nome: `portal-veiculos`. Região: **South America (São Paulo)** — é a mais perto de Três Lagoas. Guarde a senha do banco que ele pede.
3. Espere uns 2 minutos até o projeto ficar verde.

### 4.1 Rodar o schema

No menu da esquerda: **SQL Editor → New query**. Abra o arquivo `supabase/schema.sql` do projeto, copie tudo, cole e clique em **Run**.

Depois faça o mesmo com `supabase/seed.sql` — ele põe 12 carros, 8 leads, 7 tarefas e 3 vendas de exemplo, só para você ver o sistema com conteúdo. Quando for usar de verdade, apague com o comando que está comentado no começo do arquivo.

### 4.2 Criar o seu usuário

Ainda no Supabase: **Authentication → Users → Add user → Create new user**.

- E-mail: o seu
- Senha: uma senha forte
- **Marque "Auto Confirm User"** — senão o login não funciona

Esse é o único usuário do sistema. Não existe tela de cadastro no site de propósito: ninguém consegue criar conta sozinho.

### 4.3 Desligar o cadastro aberto

⚠️ **Atenção: existem duas opções parecidas e mexer na errada trava o seu login.**

| Opção | O que faz | Como deve ficar |
|---|---|---|
| **Enable Email provider** (Authentication → Sign In / Providers → Email) | Liga e desliga o login por e-mail **inteiro** | **LIGADA** |
| **Allow new users to sign up** (seção *User Signups*, na mesma página ou em Project Settings → Authentication) | Permite que estranhos criem conta sozinhos | **DESLIGADA** |

Se você desligar a primeira por engano, o login passa a responder **"Email logins are disabled"** e nem você entra. É só voltar e ligar de novo.

### 4.4 Pegar as chaves

**Project Settings → API**. Copie:

- **Project URL**
- **anon public** (é a chave pública, pode ficar no navegador — quem protege os dados é a política de segurança do banco que o `schema.sql` criou)

---

## 5. Rodar na sua máquina

### 5.1 Configuração (o jeito fácil)

Na pasta do projeto, rode:

```bash
npm run setup
```

Um assistente vai abrir e fazer as perguntas uma por uma. Você só cola as respostas. Ele cria o arquivo de configuração sozinho, arruma o formato do WhatsApp e avisa se você colar a chave errada.

Deixe esta página aberta no navegador antes de começar:
**Supabase → seu projeto → Settings (engrenagem) → API**

Ele vai pedir:

| Pergunta | Onde achar |
|---|---|
| Project URL | Primeiro campo da página Settings → API |
| Chave anon public | Mesma página, seção "Project API keys", a linha **anon / public** |
| Seu WhatsApp | Pode digitar com parênteses e traço, ele arruma |
| Nome da loja, cidade, seu nome, endereço | Aperte **Enter** para aceitar o que já vem preenchido |

> ⚠️ Existem duas chaves na página do Supabase. Use a **anon public**. A outra (`service_role` ou `secret`) nunca deve sair do servidor — o assistente recusa se você colar ela por engano.

### 5.2 O que é esse arquivo, afinal

O assistente cria um arquivo chamado `.env.local` na pasta do projeto. Pense nele como **um bloco de notas com as suas chaves**: o sistema lê esse arquivo para saber onde fica o seu banco de dados e qual é o seu WhatsApp.

Três coisas que importam:

- Ele fica **só no seu computador**. O `.gitignore` impede que ele vá para o GitHub.
- Se você mudar alguma coisa nele, precisa **parar o servidor (Ctrl+C) e rodar `npm run dev` de novo** — ele só é lido quando o sistema liga.
- Para trocar algo depois, rode `npm run setup` outra vez. Ele guarda uma cópia da versão anterior.

### 5.3 Ligar o sistema

```bash
npm run dev
```

Abra <http://localhost:3000>. A vitrine deve aparecer com os 12 carros do seed.
Abra <http://localhost:3000/painel> — deve mandar você para o login. Entre com o usuário do passo 4.2.

> **Se aparecer um aviso amarelo "Falta conectar o banco de dados"**, o arquivo não foi criado ou está sem as chaves. Rode `npm run setup` de novo.

> **Se algo não bater**, rode `npm run diagnostico`. Ele conecta no Supabase igual ao site e diz em português o que está faltando: chave errada, tabela vazia, projeto pausado ou falta de permissão.

### 5.4 Se preferir fazer na mão

Duplique o arquivo de exemplo e preencha:

```bash
cp .env.local.example .env.local
```

---

## 6. Publicar na Vercel

### 6.1 Subir o código para o GitHub

```bash
git init
git add .
git commit -m "Portal Veiculos"
```

Crie um repositório **privado** em <https://github.com/new> chamado `portal-veiculos`, sem README. Depois rode os dois comandos que o GitHub mostra na tela (`git remote add origin ...` e `git push -u origin main`).

> O `.gitignore` já bloqueia o `.env.local`. As suas chaves **não** vão para o GitHub.

### 6.2 Conectar na Vercel

1. <https://vercel.com> → entre com o GitHub.
2. **Add New → Project** → escolha `portal-veiculos` → **Import**.
3. Em **Environment Variables**, cole cada linha do seu `.env.local` (nome de um lado, valor do outro).
4. **Deploy**. Leva uns 2 minutos.

Pronto — o site fica em `portal-veiculos.vercel.app`.

### 6.3 Domínio próprio

Compre em <https://registro.br> (uns R$ 40/ano). Na Vercel: **Settings → Domains → Add**, digite o domínio e siga as instruções de DNS que aparecem. Leva de minutos a algumas horas para propagar.

### 6.4 Atualizar depois

Toda vez que mudar algo:

```bash
git add .
git commit -m "o que mudou"
git push
```

A Vercel publica sozinha.

---

## 7. O dia a dia

**Carro novo chegou:** Painel → Estoque → *Adicionar veículo*. Preencha e salve. Ele aparece na vitrine em até 1 minuto.

**Carro vendido:** Painel → Minhas vendas → *Registrar venda*. Escolha o carro, preencha o cliente, marque a troca se houver. O carro sai da vitrine e a troca entra no estoque.

**Compromisso:** Painel → Minhas tarefas → *Nova atividade*. Na hora marcada, o sino no topo acende.

**Mudou telefone ou endereço:** Painel → Vitrine → Identidade da loja.

---

## 8. Backup — faça isso toda semana

No plano gratuito do Supabase não existe backup automático. Uma vez por semana, no Supabase:

**Database → Backups → Download** (ou, se não aparecer no Free, use **SQL Editor** e rode:)

```sql
select * from public.veiculos;
select * from public.vendas;
select * from public.leads;
select * from public.tarefas;
```

Clique em **Download CSV** em cada um e guarde numa pasta do seu Mac. Leva 2 minutos e evita a única perda que seria irreversível.

---

## 9. Próximos passos (integrações)

Na ordem que faz sentido ligar, e o que cada uma exige:

1. **Fotos dos carros** — o bucket `fotos` já foi criado pelo `schema.sql`. Falta a tela de upload no cadastro. É a próxima coisa a fazer: sem foto, a vitrine não converte.
2. **WhatsApp Cloud API** — resposta automática em segundos. API oficial da Meta, sem mensalidade; mensagem de resposta dentro de 24h é gratuita.
3. **Mercado Livre** — API pública e self-service, o único portal que dá para ligar sozinho.
4. **Instagram e Facebook** — Graph API. O Instagram exige análise do app pela Meta, que leva de 1 a 4 semanas; comece o pedido cedo.
5. **OLX** — exige plano Autos e cadastro como integrador. Decisão comercial, não técnica.

---

## 10. Se der problema

**"Invalid API key" no login** — a chave no `.env.local` está errada ou você não reiniciou o `npm run dev` depois de editar o arquivo.

**Vitrine vazia** — rode o `seed.sql`, ou confira em Supabase → Table Editor → veiculos se há linhas com `status = 'disponivel'`.

**Login não entra** — confira se o usuário está com **Auto Confirm** marcado em Authentication → Users.

**Deploy falhou na Vercel** — quase sempre é variável de ambiente faltando. Confira se todas as linhas do `.env.local` estão em Settings → Environment Variables, e clique em **Redeploy**.

**Projeto pausado no Supabase** — entre no painel do Supabase e clique em **Restore**. Considere subir para o Pro se acontecer com frequência.
# portal-veiculos
# portal-veiculos
