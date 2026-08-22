'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { alternarTarefa } from '@/actions/tarefas'
import type { Tarefa } from '@/lib/types'

export default function Sino({ tarefas }: { tarefas: Tarefa[] }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [agora, setAgora] = useState(() => Date.now())
  const anterior = useRef(0)
  const btn = useRef<HTMLButtonElement>(null)

  // reavalia a cada 20s e recarrega do servidor a cada 5min
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 20000)
    const r = setInterval(() => router.refresh(), 300000)
    return () => { clearInterval(t); clearInterval(r) }
  }, [router])

  const vencidas = useMemo(
    () => tarefas.filter((t) => !t.feito && new Date(`${t.data}T${t.hora}`).getTime() <= agora),
    [tarefas, agora]
  )

  useEffect(() => {
    if (vencidas.length > anterior.current && btn.current) {
      btn.current.classList.remove('ring')
      void btn.current.offsetWidth
      btn.current.classList.add('ring')
    }
    anterior.current = vencidas.length
  }, [vencidas.length])

  useEffect(() => {
    const fora = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.bell, .bell-pop')) setAberto(false)
    }
    document.addEventListener('click', fora)
    return () => document.removeEventListener('click', fora)
  }, [])

  async function concluir(id: string) {
    await alternarTarefa(id, true)
    router.refresh()
  }

  return (
    <div style={{ position: 'relative' }}>
      <button ref={btn} className="bell" aria-label="Notificações de atividades"
        onClick={(e) => { e.stopPropagation(); setAberto((v) => !v) }}>
        <svg viewBox="0 0 24 24">
          <path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.2 7.5-2.2 7.5h16.4S18 14.5 18 8.5" />
          <path d="M13.7 20a2 2 0 0 1-3.4 0" />
        </svg>
        {vencidas.length > 0 && <span className="badge">{vencidas.length}</span>}
      </button>

      {aberto && (
        <div className="bell-pop">
          {vencidas.length ? (
            <>
              <h4>{vencidas.length === 1 ? '1 atividade chegou na hora' : `${vencidas.length} atividades chegaram na hora`}</h4>
              <p className="np">Marque como feita para tirar da lista.</p>
              {vencidas.map((t) => (
                <div className="bell-item" key={t.id}>
                  <span className="hr">{t.hora.slice(0, 5)}</span>
                  <div>
                    <div className="tt2">{t.titulo}</div>
                    <div className="dd">{new Date(t.data + 'T00:00').toLocaleDateString('pt-BR')}</div>
                  </div>
                  <button className="chk ok" title="Marcar como feita" onClick={() => concluir(t.id)}>✓</button>
                </div>
              ))}
            </>
          ) : (
            <>
              <h4>Nada pendente</h4>
              <p className="np" style={{ margin: 0 }}>Todas as atividades do horário já estão marcadas como feitas.</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
