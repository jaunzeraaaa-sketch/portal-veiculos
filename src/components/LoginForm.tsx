'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'

/** Transforma o recado técnico do Supabase em algo acionável. */
function traduzir(msg: string) {
  if (/Email logins are disabled/i.test(msg))
    return 'O login por e-mail está desligado no Supabase. Vá em Authentication → Sign In / Providers → Email e ligue "Enable Email provider". Cuidado: essa opção é diferente de "Allow new users to sign up".'
  if (/Invalid login/i.test(msg))
    return 'E-mail ou senha não conferem. Confira e tente de novo.'
  if (/Email not confirmed/i.test(msg))
    return 'Esse usuário não foi confirmado. No Supabase, em Authentication → Users, apague e crie de novo marcando "Auto Confirm User".'
  if (/signups? (not allowed|disabled)/i.test(msg))
    return 'O cadastro está bloqueado — isso é o esperado. Mas o seu usuário precisa ser criado direto no Supabase, em Authentication → Users → Add user.'
  if (/rate limit|too many/i.test(msg))
    return 'Muitas tentativas seguidas. Espere um minuto e tente de novo.'
  if (/fetch|network/i.test(msg))
    return 'Não consegui falar com o servidor. Confira sua internet e se o projeto no Supabase não está pausado.'
  return `Não consegui entrar: ${msg}`
}

export default function LoginForm({ destino }: { destino: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setErro(''); setCarregando(true)
    const sb = supabaseBrowser()
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: senha })
    setCarregando(false)
    if (error) {
      setErro(traduzir(error.message))
      return
    }
    router.push(destino)
    router.refresh()
  }

  return (
    <form onSubmit={entrar} className="login-form">
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" autoComplete="username" required
          value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" />
      </div>
      <div className="field">
        <label htmlFor="senha">Senha</label>
        <input id="senha" type="password" autoComplete="current-password" required
          value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" />
      </div>
      {erro && <div className="login-erro">{erro}</div>}
      <button className="btn" type="submit" disabled={carregando} style={{ width: '100%' }}>
        {carregando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}
