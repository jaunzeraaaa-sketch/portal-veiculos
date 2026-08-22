import Image from 'next/image'
import LoginForm from '@/components/LoginForm'
import AvisoSetup from '@/components/AvisoSetup'
import { supabaseConfigurado } from '@/lib/supabase/server'

export const metadata = { title: 'Entrar — Portal Veículos' }

export default async function Login({ searchParams }: { searchParams: Promise<{ destino?: string }> }) {
  const { destino } = await searchParams
  if (!supabaseConfigurado()) {
    return <div className="login-wrap"><AvisoSetup onde="login" /></div>
  }
  return (
    <div className="login-wrap">
      <div className="login-card">
        <Image src="/logo-escura.png" alt="Portal Veículos" width={420} height={167} className="login-logo" priority />
        <h1>Entrar no painel</h1>
        <p className="login-sub">
          A vitrine é aberta para qualquer cliente. Estoque, leads, vendas e tarefas só com login.
        </p>
        <LoginForm destino={destino ?? '/painel'} />
        <a className="login-back" href="/">← Ver a vitrine</a>
      </div>
    </div>
  )
}
