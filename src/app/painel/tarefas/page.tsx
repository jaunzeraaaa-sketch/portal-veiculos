import { supabaseServer } from '@/lib/supabase/server'
import { hojeISO } from '@/lib/format'
import type { Tarefa } from '@/lib/types'
import Calendario from '@/components/Calendario'

export const dynamic = 'force-dynamic'

export default async function Tarefas() {
  const sb = await supabaseServer()
  const [{ data }, { data: ls }] = await Promise.all([
    sb.from('tarefas').select('*').order('data').order('hora'),
    sb.from('leads').select('id, nome'),
  ])
  const tarefas = (data ?? []) as Tarefa[]
  const leads = Object.fromEntries(((ls ?? []) as { id: string; nome: string }[]).map((l) => [l.id, l.nome]))
  const hoje = hojeISO()
  const agora = new Date()

  const vencidas = tarefas.filter((t) => !t.feito && new Date(`${t.data}T${t.hora}`) <= agora).length
  const deHoje = tarefas.filter((t) => t.data === hoje && !t.feito).length
  const semana = tarefas.filter((t) => !t.feito && t.data >= hoje && t.data <= new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10)).length
  const feitas = tarefas.filter((t) => t.feito).length

  return (
    <>
      <div className="page-head">
        <p>Seu calendário de compromissos. Quando chega a hora da atividade, o sino no topo da tela acende com o aviso. As tarefas criadas a partir de um lead trazem o nome do cliente e o atalho para o funil.</p>
      </div>
      <div className="grid g-5" style={{ marginBottom: 16 }}>
        <div className="tile"><div className="label">Chegaram na hora</div><div className="value" style={{ color: 'var(--critical)' }}>{vencidas}</div><div className="delta down">esperando você</div></div>
        <div className="tile"><div className="label">Para hoje</div><div className="value">{deHoje}</div><div className="delta">ainda abertas</div></div>
        <div className="tile"><div className="label">Próximos 7 dias</div><div className="value">{semana}</div><div className="delta">na agenda</div></div>
        <div className="tile"><div className="label">Concluídas</div><div className="value" style={{ color: 'var(--good-text)' }}>{feitas}</div><div className="delta up">no histórico</div></div>
        <div className="tile" style={{ justifyContent: 'center' }}>
          <div className="delta" style={{ marginTop: 0 }}>Use o botão no calendário</div>
          <div className="label">para marcar data, horário e lembrete</div>
        </div>
      </div>
      <Calendario tarefas={tarefas} leads={leads} />
    </>
  )
}
