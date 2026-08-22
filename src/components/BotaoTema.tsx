'use client'
import { useEffect, useState } from 'react'

export default function BotaoTema() {
  const [tema, setTema] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const salvo = (localStorage.getItem('tema') as 'light' | 'dark') || 'light'
    setTema(salvo)
    document.documentElement.dataset.theme = salvo
  }, [])

  function alternar() {
    const novo = tema === 'dark' ? 'light' : 'dark'
    setTema(novo)
    document.documentElement.dataset.theme = novo
    try { localStorage.setItem('tema', novo) } catch {}
  }

  return (
    <button className="icon-btn" onClick={alternar} title="Alternar entre tema claro e escuro">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        {tema === 'dark'
          ? <><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" /></>
          : <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />}
      </svg>
      {tema === 'dark' ? 'Tema claro' : 'Tema escuro'}
    </button>
  )
}
