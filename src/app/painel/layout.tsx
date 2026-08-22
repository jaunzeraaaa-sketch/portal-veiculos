import Image from 'next/image'
import { supabaseServer } from '@/lib/supabase/server'
import { getConfig } from '@/lib/loja'
import SidebarNav from '@/components/SidebarNav'
import Sino from '@/components/Sino'
import BotaoTema from '@/components/BotaoTema'
import type { Tarefa } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const sb = await supabaseServer()
  const cfg = await getConfig()
  const { data: { user } } = await sb.auth.getUser()

  const { data: tarefas } = await sb
    .from('tarefas')
    .select('*')
    .eq('feito', false)
    .lte('data', new Date().toISOString().slice(0, 10))
    .order('data', { ascending: false })

  const iniciais = cfg.vendedor.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()

  return (
    <div className="app">
      <aside className="side">
        <a className="side-brand" href="/" title="Ver a vitrine">
          <Image src="/logo-branca.png" alt={cfg.nome} width={420} height={167} className="side-logo" priority />
        </a>
        <div className="side-label">Operação</div>
        <SidebarNav />
        <div className="side-foot">
          <div className="who">
            <div className="av">{iniciais}</div>
            <div>
              <div className="nm">{cfg.vendedor}</div>
              <div className="rl">{user?.email ?? 'Vendedor'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <BotaoTema />
            <form action="/auth/signout" method="post">
              <button className="icon-btn" type="submit">Sair do painel</button>
            </form>
          </div>
        </div>
      </aside>

      <div className="col">
        <header className="topbar">
          <div className="topbar-inner">
            <h1 id="pageTitle">Painel</h1>
            <Sino tarefas={(tarefas ?? []) as Tarefa[]} />
            <div className="top-av">{iniciais}</div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="legal">
          {cfg.nome} · {cfg.cidade}. Sistema de uso interno — a vitrine pública fica em <a href="/">/</a>.
        </footer>
      </div>
    </div>
  )
}
