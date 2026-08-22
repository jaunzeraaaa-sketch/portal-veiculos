'use client'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { hojeISO } from '@/lib/format'
import { alternarTarefa, criarTarefa, excluirTarefa } from '@/actions/tarefas'
import type { Tarefa } from '@/lib/types'
import Modal from '@/components/Modal'

const MES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const DOW = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const LIXO = <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></>

export default function Calendario({ tarefas }: { tarefas: Tarefa[] }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  const hoje = hojeISO()
  const [ref, setRef] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d })
  const [sel, setSel] = useState(hoje)
  const [nova, setNova] = useState(false)
  const [apagar, setApagar] = useState<Tarefa | null>(null)
  const [erro, setErro] = useState('')

  const agora = new Date()
  const venceu = (t: Tarefa) => !t.feito && new Date(`${t.data}T${t.hora}`) <= agora

  const dias = useMemo(() => {
    const primeiro = new Date(ref.getFullYear(), ref.getMonth(), 1)
    const inicio = new Date(primeiro); inicio.setDate(1 - primeiro.getDay())
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(inicio); d.setDate(inicio.getDate() + i); return d })
  }, [ref])

  const doDia = tarefas.filter((t) => t.data === sel).sort((a, b) => a.hora.localeCompare(b.hora))
  const dSel = new Date(sel + 'T00:00')
  const titDia = sel === hoje ? 'Hoje' : (() => {
    const s = dSel.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    return s[0].toUpperCase() + s.slice(1)
  })()

  const acao = (fn: () => Promise<{ erro?: string }>) => iniciar(async () => {
    const r = await fn(); if (r?.erro) { setErro(r.erro); return }
    setNova(false); setApagar(null); router.refresh()
  })

  return (
    <div className="cal-wrap">
      <div className="card">
        <div className="cal-head">
          <h3>{MES[ref.getMonth()][0].toUpperCase() + MES[ref.getMonth()].slice(1)} de {ref.getFullYear()}</h3>
          <div className="cal-nav">
            <button title="Mês anterior" onClick={() => setRef(new Date(ref.getFullYear(), ref.getMonth() - 1, 1))}>‹</button>
            <button title="Voltar para hoje" style={{ width: 'auto', padding: '0 11px', fontSize: 12 }}
              onClick={() => { const d = new Date(); d.setDate(1); setRef(d); setSel(hoje) }}>hoje</button>
            <button title="Próximo mês" onClick={() => setRef(new Date(ref.getFullYear(), ref.getMonth() + 1, 1))}>›</button>
          </div>
        </div>

        <div className="cal-grid">
          {DOW.map((d) => <div className="cal-dow" key={d}>{d}</div>)}
          {dias.map((d) => {
            const key = iso(d)
            const lista = tarefas.filter((t) => t.data === key)
            const cls = [d.getMonth() !== ref.getMonth() ? 'out' : '', key === hoje ? 'today' : '', key === sel ? 'sel' : ''].join(' ')
            return (
              <button className={`cal-day ${cls}`} key={key} onClick={() => setSel(key)}>
                <span className="n">{d.getDate()}</span>
                <span className="cal-dots">
                  {lista.slice(0, 4).map((t) => (
                    <i key={t.id} className={t.feito ? 'done' : venceu(t) ? 'late' : ''} />
                  ))}
                  {lista.length > 4 && <span className="cal-more">+{lista.length - 4}</span>}
                </span>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 11, color: 'var(--muted)', flexWrap: 'wrap' }}>
          <span><i style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: 'var(--brand)', verticalAlign: 1 }} /> agendada</span>
          <span><i style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: 'var(--critical)', verticalAlign: 1 }} /> passou da hora</span>
          <span><i style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: 'var(--good)', verticalAlign: 1 }} /> feita</span>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>{titDia}</h2>
          <button className="btn" onClick={() => { setErro(''); setNova(true) }}>+ Nova atividade</button>
        </div>
        <div className="sub">{doDia.length ? `${doDia.length} ${doDia.length === 1 ? 'atividade' : 'atividades'}` : 'nenhuma atividade neste dia'}</div>

        {doDia.length ? doDia.map((t) => (
          <div className={`task-item ${t.feito ? 'done' : venceu(t) ? 'late' : ''}`} key={t.id}>
            <button className={`chk ${t.feito ? 'on' : ''}`} title={t.feito ? 'Desmarcar' : 'Marcar como feita'}
              onClick={() => acao(() => alternarTarefa(t.id, !t.feito))}>✓</button>
            <span className="hr">{t.hora.slice(0, 5)}</span>
            <div style={{ flex: 1 }}>
              <div className="tt2">{t.titulo}</div>
              {t.descricao && <div className="dd">{t.descricao}</div>}
            </div>
            <div className="acts">
              <button className="ia danger" title="Excluir" onClick={() => setApagar(t)}>
                <svg viewBox="0 0 24 24">{LIXO}</svg>
              </button>
            </div>
          </div>
        )) : <div className="empty">Nada marcado. Use o botão acima para adicionar.</div>}
      </div>

      {nova && (
        <Modal titulo="Nova atividade" ok="Salvar atividade" erro={erro} pendente={pendente}
          onCancel={() => setNova(false)} form={(fd) => acao(() => criarTarefa(fd))}>
          <div className="mtext">O sino no topo avisa você quando chegar a hora.</div>
          <div className="grid g-2" style={{ gap: '0 12px' }}>
            <div className="field"><label>Data</label><input name="data" type="date" defaultValue={sel} required /></div>
            <div className="field"><label>Horário</label><input name="hora" type="time" defaultValue="09:00" required /></div>
          </div>
          <div className="field"><label>O que você precisa lembrar</label>
            <input name="titulo" required placeholder="Ex.: ligar para o Fernando sobre o laudo" /></div>
          <div className="field" style={{ marginBottom: 0 }}><label>Descrição</label>
            <textarea name="descricao" rows={3} placeholder="Detalhes que você vai querer na hora: o que combinou, o que levar, qual carro" /></div>
        </Modal>
      )}

      {apagar && (
        <Modal titulo="Excluir atividade" ok="Excluir" perigo erro={erro} pendente={pendente}
          onCancel={() => setApagar(null)} onConfirm={() => acao(() => excluirTarefa(apagar.id))}>
          <div className="mtext">
            Apagar <b>{apagar.titulo}</b> de {new Date(apagar.data + 'T00:00').toLocaleDateString('pt-BR')} às {apagar.hora.slice(0, 5)}?
          </div>
        </Modal>
      )}
    </div>
  )
}
