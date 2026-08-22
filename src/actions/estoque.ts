'use server'
import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase/server'

function limpa(s: FormDataEntryValue | null) { return (s ?? '').toString().trim() }
function num(s: FormDataEntryValue | null) { return Number((s ?? '0').toString().replace(/[^\d.-]/g, '')) || 0 }

function gerarCod(marca: string, modelo: string, ano: number) {
  const base = `${modelo}`.toUpperCase().normalize('NFD').replace(/[^A-Z0-9]/g, '')
  const sufixo = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${base || marca.toUpperCase()}-${ano}-${sufixo}`
}

export async function criarVeiculo(form: FormData) {
  const sb = await supabaseServer()
  const marca = limpa(form.get('marca'))
  const modelo = limpa(form.get('modelo'))
  const anoMod = num(form.get('ano_mod'))
  const { error } = await sb.from('veiculos').insert({
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
  })
  if (error) return { erro: error.message }
  revalidatePath('/painel/estoque'); revalidatePath('/')
  return { ok: true }
}

export async function atualizarVeiculo(id: string, form: FormData) {
  const sb = await supabaseServer()
  const { error } = await sb.from('veiculos').update({
    preco: num(form.get('preco')),
    km: num(form.get('km')),
    cor: limpa(form.get('cor')),
    custo: num(form.get('custo')),
    fipe: num(form.get('fipe')) || null,
  }).eq('id', id)
  if (error) return { erro: error.message }
  revalidatePath('/painel/estoque'); revalidatePath('/'); revalidatePath('/painel')
  return { ok: true }
}

export async function marcarVendido(id: string) {
  const sb = await supabaseServer()
  const { error } = await sb.from('veiculos').update({ status: 'vendido' }).eq('id', id)
  if (error) return { erro: error.message }
  revalidatePath('/painel/estoque'); revalidatePath('/'); revalidatePath('/painel')
  return { ok: true }
}

export async function excluirVeiculo(id: string) {
  const sb = await supabaseServer()
  const { error } = await sb.from('veiculos').delete().eq('id', id)
  if (error) return { erro: error.message }
  revalidatePath('/painel/estoque'); revalidatePath('/')
  return { ok: true }
}
