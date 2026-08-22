#!/usr/bin/env node
/**
 * Assistente de configuração do Portal Veículos.
 * Cria o arquivo .env.local respondendo a algumas perguntas.
 *
 * Como usar, dentro da pasta do projeto:
 *    node setup.mjs
 */
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { writeFileSync, existsSync, copyFileSync } from 'node:fs'

const C = {
  reset: '\x1b[0m', neg: '\x1b[1m', fraco: '\x1b[2m',
  verm: '\x1b[31m', verde: '\x1b[32m', amar: '\x1b[33m', ciano: '\x1b[36m',
}
const linha = (t = '') => console.log(t)
const ok = (t) => linha(`${C.verde}✓${C.reset} ${t}`)
const erro = (t) => linha(`${C.verm}✗${C.reset} ${t}`)
const dica = (t) => linha(`${C.fraco}${t}${C.reset}`)

const rl = createInterface({ input: stdin, output: stdout })

async function pergunta({ titulo, ajuda, exemplo, padrao, valida, obrigatorio = true }) {
  linha()
  linha(`${C.neg}${titulo}${C.reset}`)
  if (ajuda) dica(`  ${ajuda}`)
  if (exemplo) dica(`  exemplo: ${exemplo}`)
  if (padrao) dica(`  aperte Enter para usar: ${padrao}`)

  for (;;) {
    const bruto = await rl.question(`${C.ciano}  > ${C.reset}`)
    const valor = bruto.trim().replace(/^["']|["']$/g, '')

    if (!valor && padrao) return padrao
    if (!valor && !obrigatorio) return ''
    if (!valor) { erro('Esse campo é obrigatório. Tente de novo.'); continue }

    if (valida) {
      const problema = valida(valor)
      if (problema) { erro(problema); continue }
    }
    return valor
  }
}

console.clear()
linha()
linha(`${C.neg}  Portal Veículos — configuração${C.reset}`)
linha(`${C.fraco}  ────────────────────────────────────────${C.reset}`)
linha()
linha('  Vou fazer algumas perguntas e criar o arquivo de configuração sozinho.')
linha(`  ${C.fraco}Esse arquivo é só um bloco de notas com as suas chaves. Ele fica${C.reset}`)
linha(`  ${C.fraco}no seu computador e nunca vai para a internet.${C.reset}`)
linha()
linha(`  ${C.amar}Antes de começar, deixe esta página aberta no navegador:${C.reset}`)
linha(`  ${C.neg}Supabase → seu projeto → Settings (engrenagem) → API${C.reset}`)

if (existsSync('.env.local')) {
  linha()
  const r = await pergunta({
    titulo: 'Já existe um arquivo .env.local. Quer substituir?',
    ajuda: 'Vou guardar uma cópia do antigo como .env.local.backup',
    padrao: 'sim',
  })
  if (!/^s/i.test(r)) {
    linha()
    dica('  Beleza, não mexi em nada. Até mais.')
    rl.close()
    process.exit(0)
  }
  copyFileSync('.env.local', '.env.local.backup')
  ok('Cópia de segurança salva em .env.local.backup')
}

const url = await pergunta({
  titulo: '1 de 6 · Project URL',
  ajuda: 'Na página Settings → API, é o primeiro campo, lá em cima.',
  exemplo: 'https://abcdefghijk.supabase.co',
  valida: (v) => {
    if (!v.startsWith('https://')) return 'Tem que começar com https://'
    if (!v.includes('.supabase.co')) return 'Não parece a URL do Supabase — deve terminar com .supabase.co'
    if (/x{4,}|exemplo|seu-projeto/i.test(v)) return 'Esse é o valor de exemplo. Cole a sua URL de verdade.'
    return null
  },
})

const chave = await pergunta({
  titulo: '2 de 6 · Chave pública do projeto',
  ajuda: 'Em Settings → API Keys. Prefira a "Publishable key" (sb_publishable_...). Se só houver as antigas, use a linha "anon".',
  exemplo: 'sb_publishable_ABC123...  ou  eyJhbGciOiJIUzI1NiIs...',
  valida: (v) => {
    if (/^sb_secret|service_role/i.test(v)) return 'Essa é a chave SECRETA. Use a "anon public".'
    if (v.includes('...') || v.includes('…')) return 'Isso é o exemplo abreviado. Cole a chave inteira.'
    if (v.startsWith('eyJ') && v.length < 100) return `A chave tem só ${v.length} caracteres. A de verdade passa de 200 — copie ela inteira.`
    if (!v.startsWith('eyJ') && !v.startsWith('sb_publishable_') && v.length < 30) return 'Não parece uma chave do Supabase. Confira o que copiou.'
    return null
  },
})

const zapBruto = await pergunta({
  titulo: '3 de 6 · Seu WhatsApp',
  ajuda: 'Pode digitar do jeito que quiser, eu arrumo o formato.',
  exemplo: '(67) 99999-0000',
  valida: (v) => {
    const d = v.replace(/\D/g, '')
    if (d.length < 10) return 'Faltam números. Digite com o DDD.'
    if (d.length > 13) return 'Números demais. Confira.'
    return null
  },
})

// normaliza: tira tudo que não é número, garante o 55 na frente
let digitos = zapBruto.replace(/\D/g, '')
if (digitos.startsWith('55') && digitos.length > 11) digitos = digitos.slice(2)
if (digitos.startsWith('0')) digitos = digitos.slice(1)
const zapApi = '55' + digitos
const ddd = digitos.slice(0, 2)
const resto = digitos.slice(2)
const zapExibe = `(${ddd}) ${resto.slice(0, resto.length - 4)}-${resto.slice(-4)}`

const nome = await pergunta({ titulo: '4 de 6 · Nome da loja', padrao: 'Portal Veículos' })
const cidade = await pergunta({ titulo: '5 de 6 · Cidade', padrao: 'Três Lagoas · MS' })
const vendedor = await pergunta({ titulo: '6 de 6 · Seu nome', padrao: 'João Vitor' })
const endereco = await pergunta({
  titulo: 'Endereço da loja',
  ajuda: 'Aparece no rodapé do site. Pode deixar em branco e preencher depois no painel.',
  padrao: 'Av. Ranulpho Marques Leal, 0000 — Três Lagoas/MS',
})

const conteudo = `# Criado pelo assistente (node setup.mjs)
# Este arquivo fica só no seu computador. O .gitignore impede que ele vá para o GitHub.

NEXT_PUBLIC_SUPABASE_URL=${url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${chave}

NEXT_PUBLIC_LOJA_NOME=${nome}
NEXT_PUBLIC_LOJA_CIDADE=${cidade}
NEXT_PUBLIC_VENDEDOR=${vendedor}
NEXT_PUBLIC_WHATSAPP=${zapApi}
NEXT_PUBLIC_WHATSAPP_EXIBE=${zapExibe}
NEXT_PUBLIC_ENDERECO=${endereco}
`

writeFileSync('.env.local', conteudo, 'utf8')

linha()
linha(`${C.fraco}  ────────────────────────────────────────${C.reset}`)
ok(`${C.neg}Arquivo .env.local criado.${C.reset}`)
linha()
linha(`  Banco:    ${C.fraco}${url}${C.reset}`)
linha(`  Chave:    ${C.fraco}${chave.slice(0, 18)}…${C.reset}`)
linha(`  WhatsApp: ${C.fraco}${zapExibe}  (link: wa.me/${zapApi})${C.reset}`)
linha(`  Loja:     ${C.fraco}${nome} · ${cidade} · ${vendedor}${C.reset}`)
linha()
linha(`  ${C.neg}Agora rode:${C.reset}  ${C.ciano}npm run dev${C.reset}`)
linha(`  ${C.fraco}e abra http://localhost:3000${C.reset}`)
linha()

rl.close()
