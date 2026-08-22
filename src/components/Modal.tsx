'use client'
import { useEffect, useRef } from 'react'

type Props = {
  titulo: string
  ok?: string
  perigo?: boolean
  erro?: string
  pendente?: boolean
  children: React.ReactNode
  onCancel: () => void
  onConfirm?: () => void
  form?: (fd: FormData) => void
}

export default function Modal({ titulo, ok = 'Confirmar', perigo, erro, pendente, children, onCancel, onConfirm, form }: Props) {
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onCancel])

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (form && ref.current) form(new FormData(ref.current))
    else onConfirm?.()
  }

  return (
    <div className="modal-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <form className="modal" ref={ref} onSubmit={enviar} role="dialog" aria-modal="true" aria-label={titulo}>
        <h3>{titulo}</h3>
        <div>{children}</div>
        {erro && <div className="login-erro" style={{ marginTop: 12, marginBottom: 0 }}>{erro}</div>}
        <div className="modal-foot">
          <button type="button" className="btn ghost" onClick={onCancel}>Cancelar</button>
          <button type="submit" className={`btn${perigo ? ' danger' : ''}`} disabled={pendente}>
            {pendente ? 'Salvando…' : ok}
          </button>
        </div>
      </form>
    </div>
  )
}
