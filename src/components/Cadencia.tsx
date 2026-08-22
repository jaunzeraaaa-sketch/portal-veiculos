'use client'
import { useState } from 'react'
import { BRL2, NUM } from '@/lib/format'

const PRECO = { service: 0, utility: 0.045, marketing: 0.345 }
const COR = { service: 'var(--good)', utility: 'var(--brand)', marketing: 'var(--warn)' }

const PASSOS = [
  { d: 'D+0', c: 'service' as const, t: 'Resposta automática e qualificação', desc: 'Dados do carro, fotos e as perguntas de qualificação. Enviado em segundos.' },
  { d: 'D+1', c: 'utility' as const, t: 'Conseguiu ver as fotos?', desc: 'Retomada leve, sem oferta. Reabre a janela gratuita se ele responder.' },
  { d: 'D+3', c: 'utility' as const, t: 'Vídeo do carro e laudo cautelar', desc: 'Prova, não pressão. É o que derruba a objeção de procedência.' },
  { d: 'D+7', c: 'utility' as const, t: 'Ainda está procurando?', desc: 'Se sim, oferece opções parecidas da faixa de preço dele.' },
  { d: 'D+15', c: 'marketing' as const, t: 'Condição ou ajuste de preço', desc: 'Primeira mensagem realmente comercial. Só aqui o custo sobe.' },
  { d: 'D+30', c: 'marketing' as const, t: 'Novidades do estoque na faixa dele', desc: 'Segmentada por faixa de preço e tipo de carro.' },
  { d: 'D+90', c: 'marketing' as const, t: 'Reativação', desc: 'Só para quem deu opt-in. Sempre com opção de sair.' },
]

export default function Cadencia() {
  const [leads, setLeads] = useState(100)
  const [respondem, setRespondem] = useState(45)
  const [base, setBase] = useState(0)

  const r = Math.min(100, Math.max(0, respondem)) / 100
  const silenciosos = leads * (1 - r)
  const utilidade = leads * r * 1 + silenciosos * 3
  const marketing = silenciosos * 2 + base
  const total = utilidade * PRECO.utility + marketing * PRECO.marketing

  return (
    <div className="grid g-2">
      <div className="card">
        <div className="card-head"><h2>Sequência padrão</h2></div>
        <div className="sub">Dispara a partir do primeiro contato. Qualquer resposta do lead cancela o restante.</div>
        <ul className="timeline">
          {PASSOS.map((p) => (
            <li key={p.d}>
              <div className="tl-dot" style={{ background: COR[p.c] }}>{p.d.replace('D+', '')}</div>
              <div className="tl-body">
                <div className="t">{p.t}</div>
                <div className="d">{p.desc}</div>
                <div className="c">
                  {p.d} · categoria <b>{p.c}</b> · {p.c === 'service' ? 'grátis' : `${BRL2(PRECO[p.c])} por mensagem`}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-head"><h2>Calculadora de custo</h2></div>
          <div className="sub">Valores de referência do Brasil em agosto/2026. Confirme na sua conta Meta Business antes de rodar campanha grande.</div>
          <div className="field">
            <label htmlFor="cLeads">Leads novos por mês</label>
            <input id="cLeads" type="number" min={0} max={5000} value={leads} onChange={(e) => setLeads(+e.target.value || 0)} />
          </div>
          <div className="field">
            <label htmlFor="cResp">% que responde dentro de 24 h (não gera custo depois)</label>
            <input id="cResp" type="number" min={0} max={100} value={respondem} onChange={(e) => setRespondem(+e.target.value || 0)} />
          </div>
          <div className="field">
            <label htmlFor="cBase">Base antiga para reativação mensal (marketing)</label>
            <input id="cBase" type="number" min={0} max={50000} value={base} onChange={(e) => setBase(+e.target.value || 0)} />
          </div>
          <div className="calc-out">
            <div><div className="l">Mensagens cobradas</div><div className="v">{NUM(Math.round(utilidade + marketing))}</div></div>
            <div><div className="l">Custo mensal estimado</div><div className="v">{BRL2(total)}</div></div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h2>Tabela de preços por categoria</h2></div>
          <div className="sub">A diferença de 6× entre utility e marketing é o que decide o custo da sua operação.</div>
          <div className="kv"><span><span className="chip good"><span className="dot" />Service</span> resposta em até 24 h</span><strong>Grátis</strong></div>
          <div className="kv"><span><span className="chip neutral"><span className="dot" />Utility</span> lembrete, confirmação</span><strong>R$ 0,04–0,05</strong></div>
          <div className="kv"><span><span className="chip neutral"><span className="dot" />Authentication</span> código</span><strong>R$ 0,15–0,19</strong></div>
          <div className="kv"><span><span className="chip warn"><span className="dot" />Marketing</span> oferta, reativação</span><strong>R$ 0,31–0,38</strong></div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12, lineHeight: 1.6 }}>
            Toda mensagem que você inicia fora da janela de 24 h é paga. Escreva os follow-ups como <b>utility</b>
            {' '}sempre que for legítimo (confirmação de visita, atualização sobre o carro que ele pediu) e guarde
            {' '}<b>marketing</b> para campanha de verdade.
          </div>
        </div>
      </div>
    </div>
  )
}
