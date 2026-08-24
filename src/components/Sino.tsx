'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { alternarTarefa } from '@/actions/tarefas'
import { marcarAlertasVistos } from '@/actions/alertas'
import { BRL } from '@/lib/format'
import type { Alerta, Tarefa } from '@/lib/types'

export default function Sino({ tarefas, alertas }: { tarefas: Tarefa[]; alertas: Alerta[] }) {
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
  const novos = useMemo(() => alertas.filter((a) => a.status === 'Novo'), [alertas])
  const total = vencidas.length + novos.length

  useEffect(() => {
    if (total > anterior.current && btn.current) {
      btn.current.classList.remove('ring')
      void btn.current.offsetWidth
      btn.current.classList.add('ring')
    }
    anterior.current = total
  }, [total])

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

  async function marcarVistos() {
    await marcarAlertasVistos(novos.map((a) => a.id))
    router.refresh()
  }

  return (
    <div style={{ position: 'relative' }}>
      <button ref={btn} className="bell" aria-label="Notificações"
        onClick={(e) => { e.stopPropagation(); setAberto((v) => !v) }}>
        <svg viewBox="0 0 24 24">
          <path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.2 7.5-2.2 7.5h16.4S18 14.5 18 8.5" />
          <path d="M13.7 20a2 2 0 0 1-3.4 0" />
        </svg>
        {total > 0 && <span className="badge">{total}</span>}
      </button>

      {aberto && (
        <div className="bell-pop">
          {novos.length > 0 && (
            <>
              <h4>
                {novos.length === 1 ? 'Novo veículo disponível para um lead!' : `${novos.length} veículos disponíveis para leads!`}
                <button className="mini" style={{ marginLeft: 'auto' }} onClick={marcarVistos}>marcar como vistos</button>
              </h4>
              {novos.map((a) => (
                <div className="bell-alerta" key={a.id}>
                  <div className="tt2">{a.lead_nome} procurava este carro</div>
                  <div className="dd">
                    {a.marca} {a.modelo} {a.versao} · {a.ano_fab}/{a.ano_mod} · <b>{BRL(a.preco)}</b>
                  </div>
                  <div className="bell-links">
                    <Link className="mini" href={`/painel/leads#lead-${a.lead_id}`} onClick={() => setAberto(false)}>Ver lead</Link>
                    <Link className="mini" href={`/carro/${a.cod.toLowerCase()}`} target="_blank">Ver veículo</Link>
                  </div>
                </div>
              ))}
              {vencidas.length > 0 && <div className="bell-sep" />}
            </>
          )}

          {vencidas.length > 0 && (
            <>
              <h4>{vencidas.length === 1 ? '1 atividade chegou na hora' : `${vencidas.length} atividades chegaram na hora`}</h4>
              <p className="np">Marque como feita para tirar da lista.</p>
              {vencidas.map((t) => (
                <div className="bell-item" key={t.id}>
                  <span className="hr">{t.hora.slice(0, 5)}</span>
                  <div>
                    <div className="tt2">{t.titulo}</div>
                    <div className="dd">
                      {new Date(t.data + 'T00:00').toLocaleDateString('pt-BR')}
                      {t.tipo === 'lembrete' ? ' · lembrete' : ''}
                    </div>
                  </div>
                  <button className="chk ok" title="Marcar como feita" onClick={() => concluir(t.id)}>✓</button>
                </div>
              ))}
            </>
          )}

          {total === 0 && (
            <>
              <h4>Nada pendente</h4>
              <p className="np" style={{ margin: 0 }}>Nenhuma atividade no horário e nenhum carro novo esperando por um cliente.</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
