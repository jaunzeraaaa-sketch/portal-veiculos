'use server'
import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase/server'

export async function salvarConfig(form: FormData) {
  const sb = await supabaseServer()
  const t = (k: string) => (form.get(k) ?? '').toString().trim()
  const { error } = await sb.from('config').update({
    nome: t('nome'), cidade: t('cidade'), vendedor: t('vendedor'),
    whatsapp: t('whatsapp').replace(/\D/g, ''), whatsapp_exibe: t('whatsapp_exibe'),
    endereco: t('endereco'), atualizado_em: new Date().toISOString(),
  }).eq('id', 1)
  if (error) return { erro: error.message }
  revalidatePath('/'); revalidatePath('/painel/vitrine')
  return { ok: true }
}
