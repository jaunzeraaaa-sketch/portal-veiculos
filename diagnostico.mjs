#!/usr/bin/env node
/**
 * Diagnóstico do Portal Veículos.
 * Conecta no Supabase exatamente como o site conecta e diz o que está errado.
 *
 * Como usar, dentro da pasta do projeto:
 *    node diagnostico.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const C = {
  r: '\x1b[0m', b: '\x1b[1m', f: '\x1b[2m',
  verm: '\x1b[31m', verde: '\x1b[32m', amar: '\x1b[33m', ciano: '\x1b[36m',
}
const l = (t = '') => console.log(t)
const ok = (t) => l(`${C.verde}  ✓${C.r} ${t}`)
const x = (t) => l(`${C.verm}  ✗${C.r} ${t}`)
const aviso = (t) => l(`${C.amar}  !${C.r} ${t}`)
const dica = (t) => l(`${C.f}    ${t}${C.r}`)

l()
l(`${C.b}  Diagnóstico do Portal Veículos${C.r}`)
l(`${C.f}  ─────────────────────────────────────────${C.r}`)

// ---------- 1. o arquivo de configuração ----------
l()
l(`${C.b}1. Arquivo de configuração${C.r}`)

if (!existsSync('.env.local')) {
  x('O arquivo .env.local não existe.')
  dica('Rode: node setup.mjs')
  process.exit(1)
}
ok('.env.local encontrado')

const env = {}
for (const linha of readFileSync('.env.local', 'utf8').split('\n')) {
  const t = linha.trim()
  if (!t || t.startsWith('#')) continue
  const i = t.indexOf('=')
  if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
}

const url = env.NEXT_PUBLIC_SUPABASE_URL
const chave = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url) { x('Falta NEXT_PUBLIC_SUPABASE_URL'); process.exit(1) }
if (!chave) { x('Falta NEXT_PUBLIC_SUPABASE_ANON_KEY'); process.exit(1) }

// os valores que vêm no arquivo de exemplo, que precisam ser trocados pelos de verdade
const urlExemplo = /x{4,}|exemplo|seu-projeto|sem-configuracao/i.test(url)
const chaveExemplo = chave.includes('...') || chave.includes('…') ||
  (chave.startsWith('eyJ') && chave.length < 100) ||
  (!chave.startsWith('eyJ') && !chave.startsWith('sb_publishable_') && chave.length < 30)

if (urlExemplo || chaveExemplo) {
  l()
  x(`${C.b}O arquivo ainda está com os valores de exemplo.${C.r}`)
  l()
  if (urlExemplo) dica(`URL encontrada:   ${url}`)
  if (chaveExemplo) dica(`Chave encontrada: ${chave.slice(0, 24)}  (${chave.length} caracteres)`)
  l()
  l('  O comando `cp .env.local.example .env.local` só copia o modelo —')
  l('  ele não preenche nada. Faltou trocar pelos seus dados de verdade.')
  l()
  l(`  ${C.b}Resolva com um comando só:${C.r}`)
  l(`  ${C.ciano}node setup.mjs${C.r}`)
  l()
  l('  Ele pergunta a URL e a chave, valida na hora e escreve o arquivo por você.')
  l(`  ${C.f}Pegue as duas em: Supabase → seu projeto → Settings → API${C.r}`)
  l()
  l(`  ${C.f}Referência: a URL de verdade é algo como https://abcdefghijklm.supabase.co${C.r}`)
  l(`  ${C.f}e a chave anon tem mais de 200 caracteres (ou começa com sb_publishable_).${C.r}`)
  l()
  process.exit(1)
}

ok(`URL: ${url}`)
ok(`Chave: ${chave.slice(0, 20)}… (${chave.length} caracteres)`)

// A chave JWT carrega dentro dela de qual projeto e de qual papel ela é.
function lerJWT(t) {
  const p = t.split('.')
  if (p.length !== 3) return null
  try { return JSON.parse(Buffer.from(p[1], 'base64url').toString('utf8')) } catch { return null }
}
const refDaUrl = (url.match(/https:\/\/([^.]+)\.supabase\.co/) || [])[1]
const dados = chave.startsWith('eyJ') ? lerJWT(chave) : null

if (dados) {
  const papel = dados.role || '(sem papel)'
  const refDaChave = dados.ref || '(sem projeto)'

  if (papel === 'service_role') {
    l()
    x(`${C.b}Essa é a chave SECRETA (service_role).${C.r}`)
    dica('Ela ignora toda a segurança do banco e nunca pode ir para o navegador.')
    dica('Volte no Supabase e pegue a chave "anon" (ou a "publishable").')
    process.exit(1)
  }
  ok(`Papel da chave: ${papel}`)

  if (refDaUrl && refDaChave && refDaUrl !== refDaChave) {
    l()
    x(`${C.b}A chave é de OUTRO projeto.${C.r}`)
    l()
    dica(`A URL aponta para o projeto:   ${refDaUrl}`)
    dica(`Mas a chave pertence ao projeto: ${refDaChave}`)
    l()
    l('  Isso acontece quando você tem mais de um projeto no Supabase e')
    l('  copiou a URL de um e a chave de outro.')
    l()
    l(`  ${C.b}Como resolver:${C.r}`)
    l('  1. No Supabase, confirme em qual projeto você rodou o schema.sql')
    l('  2. Dentro DESSE projeto: Settings → API Keys')
    l('  3. Copie a URL e a chave da MESMA tela')
    l(`  4. Rode ${C.ciano}node setup.mjs${C.r} de novo`)
    l()
    process.exit(1)
  }
  if (refDaChave !== '(sem projeto)') ok(`Projeto da chave: ${refDaChave} (bate com a URL)`)

  if (dados.exp && dados.exp * 1000 < Date.now()) {
    l()
    x(`${C.b}A chave expirou em ${new Date(dados.exp * 1000).toLocaleDateString('pt-BR')}.${C.r}`)
    dica('Gere uma nova em Settings → API Keys e rode node setup.mjs.')
    process.exit(1)
  }
}

// ---------- 2. o servidor responde? ----------
l()
l(`${C.b}2. O Supabase responde?${C.r}`)
const sb = createClient(url, chave)

// Primeiro: o servidor existe? (só resolve o endereço, sem julgar a chave)
try {
  await fetch(`${url}/auth/v1/health`, { headers: { apikey: chave } })
  ok('Servidor no ar')
} catch (e) {
  x(`Não consegui alcançar o servidor: ${e.message}`)
  dica('Pode ser internet, URL errada, ou o projeto pausado por inatividade.')
  dica('Veja em supabase.com se o projeto está verde. Se estiver pausado, clique em Restore.')
  process.exit(1)
}

// Agora o teste que importa: uma consulta de verdade, igual à que o site faz.
const { error: eTeste } = await sb.from('config').select('nome').limit(1)

if (eTeste) {
  const m = eTeste.message || ''
  if (/Invalid API key|JWT|api key|apikey|401|unauthorized/i.test(m)) {
    l()
    x(`${C.b}O Supabase recusou a chave.${C.r}`)
    dica(`Mensagem: ${m}`)
    l()
    if (chave.startsWith('sb_publishable_')) {
      l('  Você está usando a chave nova (sb_publishable_). Confira duas coisas:')
      l()
      l(`  ${C.b}1. A chave está inteira?${C.r} Ela tem uns 40 a 60 caracteres.`)
      l(`     A sua tem ${chave.length}. Use o botão de copiar no Supabase, não o mouse.`)
      l()
      l(`  ${C.b}2. É do mesmo projeto da URL?${C.r} A URL aponta para:`)
      l(`     ${C.ciano}${refDaUrl}${C.r}`)
      l('     Confirme em Settings → API Keys DESSE projeto.')
      l()
      l(`  ${C.f}Se continuar recusando, tente a chave antiga "anon" da mesma tela —${C.r}`)
      l(`  ${C.f}as duas funcionam ao mesmo tempo enquanto a antiga não for desativada.${C.r}`)
    } else {
      l('  Você está usando a chave antiga (JWT). Duas saídas:')
      l()
      l(`  ${C.b}1.${C.r} Confira se copiou a linha "anon" inteira, com o botão de copiar.`)
      l(`  ${C.b}2.${C.r} Ou pegue a chave nova em Settings → API Keys → Publishable key`)
      l(`     (começa com ${C.ciano}sb_publishable_${C.r}).`)
    }
    l()
    l(`  Depois rode ${C.ciano}node setup.mjs${C.r} e cole a chave certa.`)
    l()
    process.exit(1)
  }
  if (/does not exist|schema cache/i.test(m)) {
    aviso('A chave funciona, mas a tabela config não existe.')
    dica('Rode o supabase/schema.sql no SQL Editor.')
  } else {
    aviso(`Resposta do banco: ${m}`)
  }
} else {
  ok('A chave funciona — o banco respondeu a uma consulta de verdade')
}

// ---------- 3. as tabelas existem? ----------
l()
l(`${C.b}3. As tabelas do banco${C.r}`)

async function conta(tabela) {
  const { count, error } = await sb.from(tabela).select('*', { count: 'exact', head: true })
  return { count, error }
}

let faltaSchema = false
for (const t of ['veiculos', 'leads', 'vendas', 'tarefas', 'config']) {
  const { count, error } = await conta(t)
  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) {
      x(`${t}: a tabela não existe`)
      faltaSchema = true
    } else {
      x(`${t}: ${error.message}`)
    }
  } else {
    const n = count ?? 0
    if (n > 0) ok(`${t}: ${n} ${n === 1 ? 'registro' : 'registros'}`)
    else aviso(`${t}: vazia (0 registros)`)
  }
}

if (faltaSchema) {
  l()
  x(`${C.b}O schema não foi criado.${C.r}`)
  dica('No Supabase: SQL Editor → New query → cole supabase/schema.sql → Run')
  process.exit(1)
}

// ---------- 4. as views ----------
l()
l(`${C.b}4. As views (o que a vitrine lê)${C.r}`)

const { data: vv, error: evv } = await sb
  .from('veiculos_view')
  .select('cod, marca, modelo, preco, status, dias_estoque')
  .eq('status', 'disponivel')
  .limit(3)

if (evv) {
  x(`veiculos_view: ${evv.message}`)
  if (/permission denied/i.test(evv.message)) {
    dica('Falta permissão de leitura para o visitante.')
    dica('Rode no SQL Editor:')
    dica("  grant select on public.veiculos_view to anon, authenticated;")
  }
} else if (!vv?.length) {
  aviso('veiculos_view: nenhum carro disponível voltou')
} else {
  ok(`veiculos_view: ${vv.length} carro(s) — a vitrine vai funcionar`)
  vv.forEach((c) => dica(`${c.cod} · ${c.marca} ${c.modelo} · R$ ${c.preco} · ${c.dias_estoque} dias`))
}

// ---------- 5. veredito ----------
const { count: totalCarros } = await conta('veiculos')
const { data: dispo } = await sb.from('veiculos').select('cod').eq('status', 'disponivel').limit(1)

l()
l(`${C.f}  ─────────────────────────────────────────${C.r}`)
l(`${C.b}  Conclusão${C.r}`)
l()

if ((totalCarros ?? 0) === 0) {
  x(`${C.b}A tabela de veículos está vazia — por isso a vitrine mostra 0 carros.${C.r}`)
  l()
  l('  Você criou as tabelas, mas ainda não colocou os carros de exemplo.')
  l()
  l(`  ${C.b}O que fazer:${C.r}`)
  l('  1. Abra o Supabase → SQL Editor → New query')
  l(`  2. Abra o arquivo ${C.ciano}supabase/seed.sql${C.r} do projeto, copie tudo`)
  l('  3. Cole no editor e clique em Run')
  l('  4. Volte no navegador e atualize a página (⌘R)')
  l()
  l(`  ${C.f}Se preferir começar já com os seus carros de verdade, pule o seed${C.r}`)
  l(`  ${C.f}e cadastre pelo painel: /painel/estoque → Adicionar veículo.${C.r}`)
} else if (!dispo?.length) {
  aviso(`${C.b}Existem ${totalCarros} carros, mas nenhum com status "disponivel".${C.r}`)
  l()
  l('  A vitrine só mostra carros disponíveis. Para liberar todos, rode no SQL Editor:')
  l(`  ${C.ciano}update public.veiculos set status = 'disponivel';${C.r}`)
} else if (evv || !vv?.length) {
  x(`${C.b}Os carros existem, mas o visitante não consegue lê-los.${C.r}`)
  l()
  l('  É um problema de permissão. Rode isto no SQL Editor do Supabase:')
  l()
  l(`  ${C.ciano}drop policy if exists veiculos_publico on public.veiculos;`)
  l(`  create policy veiculos_publico on public.veiculos`)
  l(`    for select to anon using (status = 'disponivel');`)
  l(`  grant select on public.veiculos      to anon, authenticated;`)
  l(`  grant select on public.veiculos_view to anon, authenticated;${C.r}`)
} else {
  ok(`${C.b}Está tudo certo. ${totalCarros} carros no banco.${C.r}`)
  l()
  l('  Se a vitrine ainda aparecer vazia no navegador:')
  l('  1. Pare o servidor com Ctrl+C')
  l(`  2. Rode ${C.ciano}npm run dev${C.r} de novo`)
  l('  3. Atualize a página com ⌘⇧R (recarregar ignorando o cache)')
}
l()
