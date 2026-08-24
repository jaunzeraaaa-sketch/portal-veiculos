'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BRL, NUM, linkWhats } from '@/lib/format'
import { definirStatusAlerta, excluirAlerta } from '@/actions/alertas'
import { STATUS_ALERTA, type Alerta } from '@/lib/types'

const CLS: Record<string, string> = {
  'Novo': 'critical', 'Visualizado': 'neutral', 'Contatado': 'warn',
  'Negociação': 'serious', 'Vendido': 'good', 'Sem interesse': 'neutral',
}
const LIXO = <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></>

export default function Alertas({ alertas, whatsapp }: { alertas: Alerta[]; whatsapp: string }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  const [verTudo, setVerTudo] = useState(false)
  const [erro, setErro] = useState('')

  const abertos = alertas.filter((a) => a.status === 'Novo' || a.status === 'Visualizado' || a.status === 'Contatado' || a.status === 'Negociação')
  const lista = verTudo ? alertas : abertos
  const novos = alertas.filter((a) => a.status === 'Novo').length

  const rodar = (fn: () => Promise<{ erro?: string }>) => iniciar(async () => {
    setErro('')
    const r = await fn()
    if (r?.erro) { setErro(r.erro); return }
    router.refresh()
  })

  if (!alertas.length) {
    return (
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head"><h2>Alertas de procura</h2></div>
        <div className="sub">
          Quando você cadastrar um veículo que bate com o que algum cliente procura, o aviso aparece aqui e no sino.
        </div>
        <div className="empty">Nenhuma correspondência até agora.</div>
      </div>
    )
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-head">
        <h2>Alertas de procura {novos > 0 && <span className="chip critical" style={{ marginLeft: 8 }}><span className="dot" />{novos} novo{novos > 1 ? 's' : ''}</span>}</h2>
        <button className="mini" onClick={() => setVerTudo((v) => !v)}>
          {verTudo ? 'Só os abertos' : `Ver todos (${alertas.length})`}
        </button>
      </div>
      <div className="sub">
        Cada linha é um cliente que estava esperando exatamente esse carro. Mude a situação conforme for tratando —
        assim o alerta não volta a te cobrar.
      </div>

      {erro && <div className="login-erro" style={{ marginBottom: 12 }}>{erro}</div>}

      {lista.length ? lista.map((a) => (
        <div className={`alerta${a.status === 'Novo' ? ' novo' : ''}`} key={a.id}>
          <div className="alerta-foto">
            {a.fotos?.[0]
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={a.fotos[0]} alt="" />
              : <span className="sem">sem foto</span>}
          </div>

          <div className="alerta-txt">
            <div className="al-tt">
              🔔 <b>{a.lead_nome}</b> procurava {a.busca_marca} {a.busca_modelo}
              {a.busca_ano ? ` ${a.busca_ano}` : ''}
            </div>
            <div className="al-cr">
              Entrou no estoque: <b>{a.marca} {a.modelo} {a.versao}</b> {a.ano_fab}/{a.ano_mod} ·
              {' '}{NUM(a.km)} km · {a.cor} · <b>{BRL(a.preco)}</b>
            </div>
            <div className="al-cd">
              <span className="mono">{a.cod}</span>
              {a.lead_telefone && <span> · {a.lead_telefone}</span>}
              {a.veiculo_status !== 'disponivel' && <span className="chip warn" style={{ marginLeft: 6 }}><span className="dot" />fora da vitrine</span>}
            </div>
          </div>

          <div className="alerta-acts">
            <div className="alerta-links">
              <Link className="mini" href={`/painel/leads#lead-${a.lead_id}`}>Ver lead</Link>
              <Link className="mini" href={`/carro/${a.cod.toLowerCase()}`} target="_blank">Ver veículo</Link>
              {a.lead_telefone && (
                <a className="mini" target="_blank" rel="noopener noreferrer"
                  href={linkWhats(whatsapp, `${a.marca} ${a.modelo} ${a.ano_mod} (${a.cod})`)}>
                  WhatsApp
                </a>
              )}
            </div>
            <div className="alerta-sit">
              <span className={`chip ${CLS[a.status]}`}><span className="dot" />{a.status}</span>
              <select value={a.status} disabled={pendente}
                onChange={(e) => rodar(() => definirStatusAlerta(a.id, e.target.value))}>
                {STATUS_ALERTA.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="ia danger" title="Descartar este alerta" disabled={pendente}
                onClick={() => rodar(() => excluirAlerta(a.id))}>
                <svg viewBox="0 0 24 24">{LIXO}</svg>
              </button>
            </div>
          </div>
        </div>
      )) : <div className="empty">Nenhum alerta aberto. Bom sinal — todos foram tratados.</div>}
    </div>
  )
}
