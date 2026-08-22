'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BRL, dataBR, hojeISO } from '@/lib/format'
import { criarLead, excluirLead, moverLead, salvarAcao } from '@/actions/leads'
import type { LeadCompleto } from '@/app/painel/leads/page'
import type { Veiculo } from '@/lib/types'
import Modal from '@/components/Modal'

const ESTAGIOS = ['Novo', 'Contatado', 'Qualificado', 'Visita agendada', 'Visita realizada', 'Proposta', 'Fechado'] as const
const COR: Record<string, string> = {
  'Novo': 'var(--ord-1)', 'Contatado': 'var(--ord-2)', 'Qualificado': 'var(--ord-3)',
  'Visita agendada': 'var(--ord-4)', 'Visita realizada': 'var(--ord-5)',
  'Proposta': 'var(--ord-6)', 'Fechado': 'var(--good)',
}
const MOTIVOS = ['Preço acima do orçamento', 'Comprou em outra loja', 'Não passou no financiamento', 'Sumiu / não respondeu', 'Não gostou do carro', 'Outro']
const LIXO = <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></>

function prazo(data: string | null, hoje: string) {
  if (!data) return { txt: 'sem data', over: true }
  if (data < hoje) return { txt: `vencida ${dataBR(data)}`, over: true }
  if (data === hoje) return { txt: 'hoje', over: false }
  return { txt: dataBR(data), over: false }
}

export default function Kanban({ leads, estoque, hoje }: { leads: LeadCompleto[]; estoque: Veiculo[]; hoje: string }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  const [novo, setNovo] = useState(false)
  const [editar, setEditar] = useState<LeadCompleto | null>(null)
  const [apagar, setApagar] = useState<LeadCompleto | null>(null)
  const [erro, setErro] = useState('')

  const rodar = (fn: () => Promise<{ erro?: string }>, fechar?: () => void) =>
    iniciar(async () => {
      setErro('')
      const r = await fn()
      if (r?.erro) { setErro(r.erro); return }
      fechar?.(); router.refresh()
    })

  const perdidos = leads.filter((l) => l.estagio === 'Perdido')

  return (
    <>
      <div className="toolbar">
        <button className="btn" onClick={() => { setErro(''); setNovo(true) }}>+ Novo lead</button>
        <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
          Clique no card para mudar o estágio ou anotar a próxima ação.
        </span>
      </div>

      <div className="kanban">
        {ESTAGIOS.map((est) => {
          const itens = leads.filter((l) => l.estagio === est)
          return (
            <div className="col-k" key={est}>
              <div className="col-head">
                <h3>{est}</h3>
                <span className="col-count">{itens.length}</span>
              </div>
              <div className="col-bar" style={{ background: COR[est] }} />
              {itens.length ? itens.map((l) => {
                const p = prazo(l.proxima_acao_data, hoje)
                const fechado = est === 'Fechado'
                return (
                  <button className={`lead-card ${p.over && !fechado ? 'overdue' : ''}`} key={l.id}
                    onClick={() => { setErro(''); setEditar(l) }} style={{ width: '100%', textAlign: 'left', font: 'inherit' }}>
                    <div className="nm">{l.nome}</div>
                    <div className="cr">
                      {l.veiculos ? `${l.veiculos.marca} ${l.veiculos.modelo} · ${l.veiculos.ano_mod}` : 'sem carro definido'}
                    </div>
                    <div className="mt">
                      <span>{l.proxima_acao ?? 'sem próxima ação'}</span>
                      {!fechado && (
                        <span style={{ color: p.over ? 'var(--critical)' : 'var(--muted)', fontWeight: p.over ? 600 : 400 }}>
                          {p.txt}
                        </span>
                      )}
                    </div>
                    <div className="mt" style={{ marginTop: 5 }}>
                      <span className="src">{l.origem}</span>
                      <span>{l.veiculos ? BRL(l.veiculos.preco) : ''}</span>
                    </div>
                  </button>
                )
              }) : <div className="empty" style={{ padding: '8px 0', fontSize: '11.5px' }}>vazio</div>}
            </div>
          )
        })}
      </div>

      {perdidos.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-head"><h2>Perdidos</h2><span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{perdidos.length}</span></div>
          <div className="sub">O motivo da perda é o dado mais útil que você tem depois de três meses.</div>
          {perdidos.map((l) => (
            <div className="kv" key={l.id}>
              <span>{l.nome} · {l.veiculos ? `${l.veiculos.marca} ${l.veiculos.modelo}` : '—'}</span>
              <strong style={{ color: 'var(--text-2)', fontWeight: 500 }}>{l.motivo_perda ?? 'motivo não anotado'}</strong>
            </div>
          ))}
        </div>
      )}

      {novo && (
        <Modal titulo="Novo lead" ok="Salvar lead" erro={erro} pendente={pendente}
          onCancel={() => setNovo(false)} form={(fd) => rodar(() => criarLead(fd), () => setNovo(false))}>
          <div className="mtext">Ele entra no funil em <b>Novo</b>, já com a próxima ação marcada para hoje.</div>
          <div className="grid g-2" style={{ gap: '0 12px' }}>
            <div className="field"><label>Nome</label><input name="nome" required placeholder="Nome do cliente" /></div>
            <div className="field"><label>Telefone</label><input name="telefone" placeholder="(67) 99999-0000" /></div>
            <div className="field"><label>Cidade</label><input name="cidade" defaultValue="Três Lagoas/MS" /></div>
            <div className="field">
              <label>De onde veio</label>
              <select name="origem" defaultValue="Site próprio">
                {['Site próprio', 'WhatsApp', 'Instagram', 'Webmotors', 'OLX', 'Mercado Livre', 'Indicação', 'Passou na loja'].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Carro de interesse</label>
            <select name="veiculo_id" defaultValue="">
              <option value="">Ainda não definiu</option>
              {estoque.map((c) => <option key={c.id} value={c.id}>{c.marca} {c.modelo} {c.versao} · {BRL(c.preco)}</option>)}
            </select>
          </div>
          <div className="grid g-2" style={{ gap: '0 12px' }}>
            <div className="field" style={{ marginBottom: 0 }}><label>Próxima ação</label><input name="proxima_acao" defaultValue="Primeiro contato" /></div>
            <div className="field" style={{ marginBottom: 0 }}><label>Quando</label><input name="proxima_acao_data" type="date" defaultValue={hojeISO()} /></div>
          </div>
        </Modal>
      )}

      {editar && (
        <Modal titulo={editar.nome} ok="Salvar" erro={erro} pendente={pendente}
          onCancel={() => setEditar(null)}
          form={(fd) => rodar(() => salvarAcao(editar.id, fd), () => setEditar(null))}>
          <div className="mtext">
            {editar.telefone ? `${editar.telefone} · ` : ''}{editar.cidade ?? ''} · veio de <b>{editar.origem}</b>
            {editar.veiculos ? <> · interesse no <b>{editar.veiculos.marca} {editar.veiculos.modelo}</b></> : null}
          </div>

          <div className="field">
            <label>Estágio no funil</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[...ESTAGIOS, 'Perdido'].map((e) => (
                <button key={e} type="button" className="mini"
                  style={e === editar.estagio ? { borderColor: 'var(--brand)', color: 'var(--brand)', fontWeight: 700 } : undefined}
                  onClick={() => rodar(() => moverLead(editar.id, e), () => setEditar(null))}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="grid g-2" style={{ gap: '0 12px' }}>
            <div className="field"><label>Próxima ação</label><input name="proxima_acao" defaultValue={editar.proxima_acao ?? ''} placeholder="Ex.: ligar sobre o laudo" /></div>
            <div className="field"><label>Quando</label><input name="proxima_acao_data" type="date" defaultValue={editar.proxima_acao_data ?? ''} /></div>
          </div>

          {editar.estagio === 'Perdido' && (
            <div className="field">
              <label>Motivo da perda</label>
              <select name="motivo_perda" defaultValue={editar.motivo_perda ?? ''}>
                <option value="">Escolha o motivo</option>
                {MOTIVOS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--grid)', marginTop: 14, paddingTop: 12 }}>
            <button type="button" className="ia danger" title="Excluir lead"
              onClick={() => { setApagar(editar); setEditar(null) }}>
              <svg viewBox="0 0 24 24">{LIXO}</svg>
            </button>
            <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>Excluir este lead</span>
          </div>
        </Modal>
      )}

      {apagar && (
        <Modal titulo="Excluir lead" ok="Excluir" perigo erro={erro} pendente={pendente}
          onCancel={() => setApagar(null)}
          onConfirm={() => rodar(() => excluirLead(apagar.id), () => setApagar(null))}>
          <div className="mtext">
            Apagar <b>{apagar.nome}</b> do funil? Se ele não comprou, prefira mover para <b>Perdido</b> com o motivo —
            assim você mantém o histórico do que faz você perder venda.
          </div>
        </Modal>
      )}
    </>
  )
}
