import { supabaseServer } from '@/lib/supabase/server'
import type { Config } from '@/lib/types'

const padrao: Config = {
  nome: process.env.NEXT_PUBLIC_LOJA_NOME ?? 'Portal Veículos',
  cidade: process.env.NEXT_PUBLIC_LOJA_CIDADE ?? 'Três Lagoas · MS',
  vendedor: process.env.NEXT_PUBLIC_VENDEDOR ?? 'João Vitor',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? '5567999990000',
  whatsapp_exibe: process.env.NEXT_PUBLIC_WHATSAPP_EXIBE ?? '(67) 99999-0000',
  endereco: process.env.NEXT_PUBLIC_ENDERECO ?? '',
  logo_url: null,
}

/** Lê a configuração da loja; se o banco ainda não respondeu, usa o .env. */
export async function getConfig(): Promise<Config> {
  try {
    const sb = await supabaseServer()
    const { data, error } = await sb.from('config').select('*').eq('id', 1).single()
    if (error) {
      console.error('[config] Usando os dados do .env.local porque o banco respondeu:', error.message)
      return padrao
    }
    return data ? { ...padrao, ...data } : padrao
  } catch {
    return padrao
  }
}
