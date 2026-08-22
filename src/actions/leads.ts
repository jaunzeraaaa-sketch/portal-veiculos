'use server'
import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase/server'

const t = (v: FormDataEntryValue | null) => (v ?? '').toString().trim()

export async function moverLead(id: string, estagio: string) {
  const sb = await supabaseServer()
  const { error } = await sb.from('leads').update({ estagio }).eq('id', id)
  if (error) return { erro: error.message }
  revalidatePath('/painel/leads'); revalidatePath('/painel')
  return { ok: true }
}

export async function salvarAcao(id: string, form: FormData) {
  const sb = await supabaseServer()
  const { error } = await sb.from('leads').update({
    proxima_acao: t(form.get('proxima_acao')) || null,
    proxima_acao_data: t(form.get('proxima_acao_data')) || null,
    motivo_perda: t(form.get('motivo_perda')) || null,
  }).eq('id', id)
  if (error) return { erro: error.message }
  revalidatePath('/painel/leads'); revalidatePath('/painel')
  return { ok: true }
}

export async function criarLead(form: FormData) {
  const sb = await supabaseServer()
  const nome = t(form.get('nome'))
  if (!nome) return { erro: 'O nome do lead é obrigatório.' }
  const { error } = await sb.from('leads').insert({
    nome,
    telefone: t(form.get('telefone')) || null,
    cidade: t(form.get('cidade')) || null,
    origem: t(form.get('origem')) || 'Site próprio',
    veiculo_id: t(form.get('veiculo_id')) || null,
    estagio: 'Novo',
    proxima_acao: t(form.get('proxima_acao')) || 'Primeiro contato',
    proxima_acao_data: t(form.get('proxima_acao_data')) || new Date().toISOString().slice(0, 10),
  })
  if (error) return { erro: error.message }
  revalidatePath('/painel/leads'); revalidatePath('/painel')
  return { ok: true }
}

export async function excluirLead(id: string) {
  const sb = await supabaseServer()
  const { error } = await sb.from('leads').delete().eq('id', id)
  if (error) return { erro: error.message }
  revalidatePath('/painel/leads'); revalidatePath('/painel')
  return { ok: true }
}
