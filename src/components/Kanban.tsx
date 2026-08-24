'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BRL, dataBR, hojeISO } from '@/lib/format'
import {
  criarInteresse, criarLead, definirStatusInteresse, excluirInteresse,
  excluirLead, moverLead, perderLead, salvarAcao,
} from '@/actions/leads'
import type { LeadCompleto } from '@/app/painel/leads/page'
import { MOTIVOS_PERDA, type Interesse, type Veiculo } from '@/lib/types'
import Modal from '@/components/Modal'
import { AgendaLead, CamposInteresse, InteresseNoCadastro } from '@/components/LeadExtras'

const ESTAGIOS = ['Novo', 'Contatado', 'Qualificado', 'Visita agendada', 'Visita realizada', 'Proposta', 'Fechado'] as const
const COR: Record<string, string> = {
  'Novo': 'var(--ord-1)', 'Contatado': 'var(--ord-2)', 'Qualificado': 'var(--ord-3)',
  'Visita agendada': 'var(--ord-4)', 'Visita realizada': 'var(--ord-5)',
  'Proposta': 'var(--ord-6)', 'Fechado': 'var(--good)',
}
const STATUS_INT = ['Aguardando disponibilidade', 'Atendido', 'Cancelado']
const LIXO = <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></>

function prazo(data: string | null, hoje: string) {
  if (!data) return { txt: 'sem data', over: true }
  if (data < hoje) return { txt: `vencida ${dataBR(data)}`, over: true }
  if (data === hoje) return { txt: 'hoje', over: false }
  return { txt: dataBR(data), over: false }
}

const descreve = (i: Interesse) =>
  [i.marca, i.modelo, i.versao, i.ano ? (i.ano_ate && i.ano_ate > i.ano ? `${i.ano}–${i.ano_ate}` : i.ano) : null]
    .filter(Boolean).join(' ')

export default function Kanban({ leads, estoque, interesses, hoje }: {
  leads: LeadCompleto[]; estoque: Veiculo[]; interesses: Interesse[]; hoje: string
}) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  const [novo, setNovo] = useState(false)
  const [editar, setEditar] = useState<LeadCompleto | null>(null)
  const [apagar, setApagar] = useState<LeadCompleto | null>(null)
  const [interesseDe, setInteresseDe] = useState<LeadCompleto | null>(null)
  const [perder, setPerder] = useState<LeadCompleto | null>(null)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  const rodar = (fn: () => Promise<{ erro?: string }>, fechar?: () => void) =>
    iniciar(async () => {
      setErro('')
      const r = await fn()
      if (r?.erro) { setErro(r.erro); return }
      fechar?.(); router.refresh()
    })

  const doLead = (id: string) => interesses.filter((i) => i.lead_id === id)
  const perdidos = leads.filter((l) => l.estagio === 'Perdido')

  return (
    <>
      <div className="toolbar">
        <button className="btn" onClick={() => { setErro(''); setNovo(true) }}>+ Novo lead</button>
        <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
          Clique no card para mudar o estágio, anotar a próxima ação ou registrar o carro que ele procura.
        </span>
      </div>

      {aviso && <div className="demo-note" style={{ marginBottom: 14 }}><span>🔔</span><div>{aviso}</div></div>}

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
                const procura = doLead(l.id).filter((i) => i.status === 'Aguardando disponibilidade')
                return (
                  <button className={`lead-card ${p.over && !fechado ? 'overdue' : ''}`} key={l.id} id={`lead-${l.id}`}
                    onClick={() => { setErro(''); setEditar(l) }} style={{ width: '100%', textAlign: 'left', font: 'inherit' }}>
                    <div className="nm">{l.nome}</div>
                    <div className="cr">
                      {l.veiculos ? `${l.veiculos.marca} ${l.veiculos.modelo} · ${l.veiculos.ano_mod}` : 'sem carro definido'}
                    </div>
                    {procura.length > 0 && (
                      <div className="lead-busca" title="Carro que ele procura e ainda não temos">
                        🔎 procura {descreve(procura[0])}{procura.length > 1 ? ` +${procura.length - 1}` : ''}
                      </div>
                    )}
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
                    {l.observacoes && <div className="lead-obs">{l.observacoes}</div>}
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

      {/* ---------------- novo lead ---------------- */}
      {novo && (
        <Modal titulo="Novo lead" ok="Salvar lead" largo erro={erro} pendente={pendente}
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
            <label>Carro de interesse (do seu estoque)</label>
            <select name="veiculo_id" defaultValue="">
              <option value="">Ainda não definiu</option>
              {estoque.map((c) => <option key={c.id} value={c.id}>{c.marca} {c.modelo} {c.versao} · {BRL(c.preco)}</option>)}
            </select>
          </div>
          <div className="grid g-2" style={{ gap: '0 12px' }}>
            <div className="field"><label>Próxima ação</label><input name="proxima_acao" defaultValue="Primeiro contato" /></div>
            <div className="field"><label>Quando</label><input name="proxima_acao_data" type="date" defaultValue={hojeISO()} /></div>
          </div>

          <div className="field">
            <label>Observação</label>
            <textarea name="observacoes" rows={3}
              placeholder="Carro que ele quer, preferências, prazo para comprar, condições que pediu, o que ficou combinado…" />
          </div>

          <AgendaLead />
          <InteresseNoCadastro />
        </Modal>
      )}

      {/* ---------------- editar lead ---------------- */}
      {editar && (() => {
        const lista = doLead(editar.id)
        return (
          <Modal titulo={editar.nome} ok="Salvar" largo erro={erro} pendente={pendente}
            onCancel={() => setEditar(null)}
            form={(fd) => rodar(() => salvarAcao(editar.id, fd), () => setEditar(null))}>
            <input type="hidden" name="nome_atual" value={editar.nome} />
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
                    onClick={() => {
                      if (e === 'Perdido') {
                        // perder exige justificativa: abre o modal próprio
                        setMotivo(editar.motivo_perda && (MOTIVOS_PERDA as readonly string[]).includes(editar.motivo_perda)
                          ? editar.motivo_perda : '')
                        setPerder(editar); setEditar(null); setErro('')
                        return
                      }
                      rodar(() => moverLead(editar.id, e), () => setEditar(null))
                    }}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid g-2" style={{ gap: '0 12px' }}>
              <div className="field"><label>Próxima ação</label><input name="proxima_acao" defaultValue={editar.proxima_acao ?? ''} placeholder="Ex.: ligar sobre o laudo" /></div>
              <div className="field"><label>Quando</label><input name="proxima_acao_data" type="date" defaultValue={editar.proxima_acao_data ?? ''} /></div>
            </div>

            <div className="field">
              <label>Observação</label>
              <textarea name="observacoes" rows={3} defaultValue={editar.observacoes ?? ''}
                placeholder="Carro que ele quer, preferências, prazo para comprar, condições que pediu…" />
            </div>

            {editar.estagio === 'Perdido' && (
              <div className="field">
                <label>Justificativa da perda</label>
                <div className="just-box">
                  <span>{editar.motivo_perda || 'sem justificativa registrada'}</span>
                  <button type="button" className="mini" onClick={() => {
                    setMotivo(editar.motivo_perda && (MOTIVOS_PERDA as readonly string[]).includes(editar.motivo_perda)
                      ? editar.motivo_perda : (editar.motivo_perda ? 'Outro' : ''))
                    setPerder(editar); setEditar(null); setErro('')
                  }}>Alterar</button>
                </div>
              </div>
            )}

            <AgendaLead dataAcao={editar.proxima_acao_data} />

            {/* interesses do lead */}
            <fieldset className="marcar">
              <legend>
                Procura no mercado
                <span className="cont">{lista.length}</span>
              </legend>
              <p className="ajuda">
                Carro que este cliente quer e que você ainda não tem. Quando um igual entrar no estoque, o sino avisa.
              </p>
              {lista.length ? lista.map((i) => (
                <div className="int-item" key={i.id}>
                  <div className="int-info">
                    <div className="nm">{descreve(i)}</div>
                    {i.observacoes && <div className="ob">{i.observacoes}</div>}
                    {i.preco_ate ? <div className="ob">até {BRL(i.preco_ate)}</div> : null}
                  </div>
                  <select value={i.status} disabled={pendente}
                    onChange={(e) => rodar(() => definirStatusInteresse(i.id, e.target.value))}>
                    {STATUS_INT.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button type="button" className="ia danger" title="Excluir este interesse"
                    onClick={() => rodar(() => excluirInteresse(i.id))}>
                    <svg viewBox="0 0 24 24">{LIXO}</svg>
                  </button>
                </div>
              )) : <div className="empty" style={{ padding: '4px 0', fontSize: '11.5px' }}>nada registrado</div>}

              <button type="button" className="btn ghost" style={{ marginTop: 10 }}
                onClick={() => { setInteresseDe(editar); setEditar(null); setErro('') }}>
                + Registrar carro que ele procura
              </button>
            </fieldset>

            <div style={{ borderTop: '1px solid var(--grid)', marginTop: 14, paddingTop: 12 }}>
              <button type="button" className="ia danger" title="Excluir lead"
                onClick={() => { setApagar(editar); setEditar(null) }}>
                <svg viewBox="0 0 24 24">{LIXO}</svg>
              </button>
              <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>Excluir este lead</span>
            </div>
          </Modal>
        )
      })()}

      {/* ---------------- novo interesse ---------------- */}
      {interesseDe && (
        <Modal titulo={`O que ${interesseDe.nome} procura`} ok="Registrar procura" largo erro={erro} pendente={pendente}
          onCancel={() => setInteresseDe(null)}
          form={(fd) => iniciar(async () => {
            setErro('')
            const r = await criarInteresse(interesseDe.id, fd)
            if (r?.erro) { setErro(r.erro); return }
            setAviso(r.jaTem
              ? `Esse carro já está no seu estoque! Gerei ${r.jaTem === 1 ? 'um alerta' : `${r.jaTem} alertas`} — veja em Alertas de procura, logo abaixo do funil.`
              : `Procura registrada. Quando um ${fd.get('marca')} ${fd.get('modelo')} entrar no estoque, o sino avisa.`)
            setInteresseDe(null); router.refresh()
            setTimeout(() => setAviso(''), 12000)
          })}>
          <div className="mtext">
            Marca, modelo e ano são o que o sistema usa para achar o carro depois. Versão e preço são conferência extra —
            preencha só se o cliente foi específico, senão você corre o risco de perder um alerta bom.
          </div>
          <CamposInteresse />
        </Modal>
      )}

      {/* ---------------- justificativa da perda ---------------- */}
      {perder && (
        <Modal titulo={`Marcar ${perder.nome} como perdido`} ok="Salvar justificativa"
          erro={erro} pendente={pendente}
          onCancel={() => { setPerder(null); setErro('') }}
          form={(fd) => rodar(() => perderLead(perder.id, fd), () => { setPerder(null); setMotivo('') })}>
          <div className="mtext">
            Sem o motivo o lead não é fechado. Depois de três meses, essa lista é o dado mais útil
            que você tem — ela mostra o que faz você perder venda.
          </div>

          <div className="field">
            <label>Justificativa da perda <span style={{ color: 'var(--critical)' }}>*</span></label>
            <select name="motivo_perda" required value={motivo} onChange={(e) => setMotivo(e.target.value)}>
              <option value="">Escolha o motivo</option>
              {MOTIVOS_PERDA.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {motivo === 'Outro' && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Qual foi o motivo? <span style={{ color: 'var(--critical)' }}>*</span></label>
              <textarea name="motivo_outro" rows={3} required autoFocus
                defaultValue={perder.motivo_perda && !(MOTIVOS_PERDA as readonly string[]).includes(perder.motivo_perda)
                  ? perder.motivo_perda : ''}
                placeholder="Escreva com as suas palavras o que aconteceu" />
            </div>
          )}
        </Modal>
      )}

      {apagar && (
        <Modal titulo="Excluir lead" ok="Excluir" perigo erro={erro} pendente={pendente}
          onCancel={() => setApagar(null)}
          onConfirm={() => rodar(() => excluirLead(apagar.id), () => setApagar(null))}>
          <div className="mtext">
            Apagar <b>{apagar.nome}</b> do funil? Se ele não comprou, prefira mover para <b>Perdido</b> com o motivo —
            assim você mantém o histórico do que faz você perder venda.<br /><br />
            As procuras e os alertas deste cliente também são apagados.
          </div>
        </Modal>
      )}
    </>
  )
}
