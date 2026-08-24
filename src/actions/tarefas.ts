'use server'
import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase/server'
import { traduzErro } from '@/lib/erros'

function limpa(s: FormDataEntryValue | null) { return (s ?? '').toString().trim() }

export async function criarTarefa(form: FormData) {
  const sb = await supabaseServer()
  const titulo = limpa(form.get('titulo'))
  if (!titulo) return { erro: 'Escreva o que você precisa lembrar.' }
  const { error } = await sb.from('tarefas').insert({
    data: limpa(form.get('data')),
    hora: limpa(form.get('hora')) || '09:00',
    titulo,
    descricao: limpa(form.get('descricao')) || null,
  })
  if (error) return { erro: traduzErro(error.message) }
  revalidatePath('/painel/tarefas'); revalidatePath('/painel')
  return { ok: true }
}

export async function alternarTarefa(id: string, feito: boolean) {
  const sb = await supabaseServer()
  const { error } = await sb.from('tarefas').update({ feito }).eq('id', id)
  if (error) return { erro: traduzErro(error.message) }
  revalidatePath('/painel/tarefas'); revalidatePath('/painel')
  return { ok: true }
}

export async function excluirTarefa(id: string) {
  const sb = await supabaseServer()
  const { error } = await sb.from('tarefas').delete().eq('id', id)
  if (error) return { erro: traduzErro(error.message) }
  revalidatePath('/painel/tarefas'); revalidatePath('/painel')
  return { ok: true }
}
