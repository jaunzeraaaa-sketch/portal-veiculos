'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

/** Botão ☰ Menu e a gaveta lateral do celular.
 *  O menu do computador continua exatamente como era — este componente
 *  só aparece abaixo de 900px de largura. */
export default function MenuMobile({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false)
  const path = usePathname()

  // trocou de tela: fecha
  useEffect(() => { setAberto(false) }, [path])

  // Esc fecha, e trava a rolagem do fundo enquanto está aberto
  useEffect(() => {
    if (!aberto) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('keydown', esc)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', esc)
      document.body.style.overflow = antes
    }
  }, [aberto])

  return (
    <>
      <button className="menu-btn" onClick={() => setAberto(true)}
        aria-label="Abrir o menu" aria-expanded={aberto}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        <span>Menu</span>
      </button>

      {aberto && (
        <div className="drawer-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) setAberto(false) }}>
          <aside className="drawer" role="dialog" aria-modal="true" aria-label="Menu do sistema"
            onClick={(e) => {
              // clicou num link: fecha junto com a navegação
              if ((e.target as HTMLElement).closest('a')) setAberto(false)
            }}>
            <button className="drawer-x" onClick={() => setAberto(false)} aria-label="Fechar o menu">
              <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
            {children}
          </aside>
        </div>
      )}
    </>
  )
}
