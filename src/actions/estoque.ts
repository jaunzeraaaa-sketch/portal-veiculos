'use server'
import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase/server'
import { traduzErro } from '@/lib/erros'
import { OPCIONAIS, CONDICOES } from '@/lib/opcionais'
import { MAX_FOTOS } from '@/lib/types'
import { casarVeiculoComInteresses } from '@/actions/alertas'

function limpa(s: FormDataEntryValue | null) { return (s ?? '').toString().trim() }
function num(s: FormDataEntryValue | null) { return Number((s ?? '0').toString().replace(/[^\d.-]/g, '')) || 0 }

/** Só aceita itens que existem na lista do sistema — nada entra pelo formulário à força. */
function marcados(form: FormData, campo: 'opcionais' | 'condicoes') {
  const validos = new Set(campo === 'opcionais' ? OPCIONAIS : CONDICOES)
  return form.getAll(campo).map((v) => v.toString()).filter((v) => validos.has(v))
}

/** As fotos chegam como JSON de URLs; só passam as do Storage do próprio projeto. */
function fotosDe(form: FormData) {
  const bruto = limpa(form.get('fotos'))
  if (!bruto) return [] as string[]
  try {
    const lista = JSON.parse(bruto)
    if (!Array.isArray(lista)) return []
    return lista
      .filter((u): u is string => typeof u === 'string')
      .filter((u) => u.startsWith('https://') && u.includes('/storage/v1/object/public/fotos/'))
      .slice(0, MAX_FOTOS)   // o servidor corta o excesso mesmo se o navegador for burlado
  } catch { return [] }
}

function gerarCod(marca: string, modelo: string, ano: number) {
  const base = `${modelo}`.toUpperCase().normalize('NFD').replace(/[^A-Z0-9]/g, '')
  const sufixo = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${base || marca.toUpperCase()}-${ano}-${sufixo}`
}

function recarregar() {
  revalidatePath('/painel/estoque')
  revalidatePath('/painel/vitrine')
  revalidatePath('/painel')
  revalidatePath('/')
}

export async function criarVeiculo(form: FormData) {
  const sb = await supabaseServer()
  const marca = limpa(form.get('marca'))
  const modelo = limpa(form.get('modelo'))
  const anoMod = num(form.get('ano_mod'))
  const { data: criado, error } = await sb.from('veiculos').insert({
    cod: limpa(form.get('cod')) || gerarCod(marca, modelo, anoMod),
    placa: limpa(form.get('placa')).toUpperCase() || null,
    marca, modelo,
    versao: limpa(form.get('versao')),
    ano_fab: num(form.get('ano_fab')) || anoMod,
    ano_mod: anoMod,
    km: num(form.get('km')),
    cor: limpa(form.get('cor')),
    cambio: limpa(form.get('cambio')) || 'Manual',
    combustivel: limpa(form.get('combustivel')) || 'Flex',
    preco: num(form.get('preco')),
    fipe: num(form.get('fipe')) || null,
    custo: num(form.get('custo')),
    descricao: limpa(form.get('descricao')) || null,
    opcionais: marcados(form, 'opcionais'),
    condicoes: marcados(form, 'condicoes'),
    fotos: fotosDe(form),
    status: limpa(form.get('status')) === 'suspenso' ? 'suspenso' : 'disponivel',
  }).select('id, marca, modelo, versao, ano_fab, ano_mod, preco').single()
  if (error) return { erro: traduzErro(error.message) }

  // carro novo no pátio: procura clientes que estavam esperando exatamente ele
  let avisados = 0
  if (criado) {
    const r = await casarVeiculoComInteresses(criado)
    avisados = r.novos
  }
  recarregar()
  return { ok: true, avisados }
}

export async function atualizarVeiculo(id: string, form: FormData) {
  const sb = await supabaseServer()
  const { error } = await sb.from('veiculos').update({
    preco: num(form.get('preco')),
    km: num(form.get('km')),
    cor: limpa(form.get('cor')),
    custo: num(form.get('custo')),
    fipe: num(form.get('fipe')) || null,
    descricao: limpa(form.get('descricao')) || null,
    opcionais: marcados(form, 'opcionais'),
    condicoes: marcados(form, 'condicoes'),
    fotos: fotosDe(form),
  }).eq('id', id)
  if (error) return { erro: traduzErro(error.message) }
  recarregar()
  return { ok: true }
}

const SITUACOES = ['disponivel', 'suspenso', 'vendido'] as const
export type SituacaoVitrine = (typeof SITUACOES)[number]

/** Ativo (disponivel) · Suspenso · Vendido — é o que decide se o carro aparece para o cliente. */
export async function definirSituacao(id: string, situacao: string) {
  if (!SITUACOES.includes(situacao as SituacaoVitrine)) return { erro: 'Situação inválida.' }
  const sb = await supabaseServer()
  const { error } = await sb.from('veiculos').update({ status: situacao }).eq('id', id)
  if (error) return { erro: traduzErro(error.message) }
  recarregar()
  return { ok: true }
}

/** Coloca vários carros na vitrine de uma vez (botão "Adicionar veículo na vitrine"). */
export async function publicarVeiculos(ids: string[]) {
  if (!ids.length) return { erro: 'Escolha pelo menos um veículo.' }
  const sb = await supabaseServer()
  const { error } = await sb.from('veiculos').update({ status: 'disponivel' }).in('id', ids)
  if (error) return { erro: traduzErro(error.message) }
  recarregar()
  return { ok: true }
}

export async function marcarVendido(id: string) {
  return definirSituacao(id, 'vendido')
}

export async function excluirVeiculo(id: string) {
  const sb = await supabaseServer()
  const { error } = await sb.from('veiculos').delete().eq('id', id)
  if (error) return { erro: traduzErro(error.message) }
  recarregar()
  return { ok: true }
}
