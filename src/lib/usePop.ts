'use client'
import { useRef, useState } from 'react'

/** Cartão que segue o mouse — o mesmo comportamento já usado em Minhas vendas.
 *  Ficou aqui para o Estoque reaproveitar em vez de nascer um segundo padrão. */
export function usePop<T>(largura = 372) {
  const [ativo, setAtivo] = useState<T | null>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pop = useRef<HTMLDivElement>(null)

  function abrir(item: T, e: React.MouseEvent) {
    if (timer.current) clearTimeout(timer.current)
    setAtivo(item)
    const w = largura
    const h = pop.current?.offsetHeight ?? 420
    let top = e.clientY - h / 2
    top = Math.max(12, Math.min(top, window.innerHeight - h - 12))
    // abre do lado que tem espaço, para não sair da tela
    let left = e.clientX > window.innerWidth / 2 ? e.clientX - w - 26 : e.clientX + 26
    left = Math.max(12, Math.min(left, window.innerWidth - w - 12))
    setPos({ top, left })
  }

  const fechar = () => { timer.current = setTimeout(() => setAtivo(null), 160) }
  const segurar = () => { if (timer.current) clearTimeout(timer.current) }

  return { ativo, setAtivo, pos, pop, abrir, fechar, segurar }
}
