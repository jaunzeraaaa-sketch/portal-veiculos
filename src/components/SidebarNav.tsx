'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const ICONES: Record<string, React.ReactNode> = {
  painel: <><rect x="3" y="3" width="7" height="8" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="3" y="15" width="7" height="6" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /></>,
  estoque: <><path d="M3.2 12.4l1.6-4.5A2 2 0 0 1 6.7 6.6h10.6a2 2 0 0 1 1.9 1.3l1.6 4.5" /><rect x="3.2" y="12.4" width="17.6" height="5" rx="1.8" /><path d="M6.6 17.4v1.5M17.4 17.4v1.5" /></>,
  vendas: <><path d="M12 2v20" /><path d="M17 6.5H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H6" /></>,
  tarefas: <><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M8 3v4M16 3v4M3 10h18" /><path d="M8.5 14.5l2 2 4-4" /></>,
  vitrine: <><path d="M3.2 9l1.6-5h14.4L21 9" /><path d="M4.5 9.2V20h15V9.2" /><path d="M9.5 20v-6h5v6" /></>,
  atendimento: <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-3.8-.9L3 21l1.9-4.6A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z" />,
  leadsIcon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="3.5" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></>,
  publicar: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3.5v13" /></>,
  followup: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5.2l3.4 2" /></>,
}

const ITENS = [
  { href: '/painel', chave: 'painel', label: 'Painel', titulo: 'Painel do dia' },
  { href: '/painel/atendimento', chave: 'atendimento', label: 'Atendimento', titulo: 'Atendimento automático' },
  { href: '/painel/leads', chave: 'leadsIcon', label: 'Leads', titulo: 'Funil de leads' },
  { href: '/painel/estoque', chave: 'estoque', label: 'Estoque', titulo: 'Estoque' },
  { href: '/painel/publicar', chave: 'publicar', label: 'Publicar', titulo: 'Publicar anúncio' },
  { href: '/painel/vendas', chave: 'vendas', label: 'Minhas vendas', titulo: 'Minhas vendas' },
  { href: '/painel/tarefas', chave: 'tarefas', label: 'Minhas tarefas', titulo: 'Minhas tarefas' },
  { href: '/painel/followup', chave: 'followup', label: 'Follow-up', titulo: 'Cadência de follow-up' },
  { href: '/painel/vitrine', chave: 'vitrine', label: 'Vitrine', titulo: 'Vitrine pública' },
]

export default function SidebarNav() {
  const path = usePathname()
  const atual = ITENS.slice().reverse().find((i) => path === i.href || path.startsWith(i.href + '/')) ?? ITENS[0]

  useEffect(() => {
    const el = document.getElementById('pageTitle')
    if (el) el.textContent = atual.titulo
  }, [atual.titulo])

  return (
    <nav className="tabs" aria-label="Seções do sistema">
      {ITENS.map((i) => (
        <Link key={i.href} href={i.href} className="tab"
          aria-selected={i.href === atual.href} role="tab">
          <svg viewBox="0 0 24 24">{ICONES[i.chave]}</svg>
          {i.label}
        </Link>
      ))}
    </nav>
  )
}
