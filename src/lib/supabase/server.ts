import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

type Cookie = { name: string; value: string; options?: CookieOptions }

/** Diz se as chaves do Supabase já foram preenchidas no .env.local */
export function supabaseConfigurado() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return Boolean(url && key && url.startsWith('https://') && !url.includes('xxxxx'))
}

// Valores neutros para o app subir mesmo sem configuração:
// em vez de estourar erro 500, a tela mostra o aviso de o que falta fazer.
const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sem-configuracao.supabase.co'
const KEY_SB = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sem-configuracao'

export async function supabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(URL_SB, KEY_SB, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list: Cookie[]) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // chamado de um Server Component: o middleware já cuida de renovar a sessão
        }
      },
    },
  })
}
