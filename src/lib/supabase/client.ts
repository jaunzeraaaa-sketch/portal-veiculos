'use client'
import { createBrowserClient } from '@supabase/ssr'

export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sem-configuracao.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sem-configuracao'
  )
}
