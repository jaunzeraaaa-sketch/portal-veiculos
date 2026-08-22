'use client'
import { useEffect, useRef, useState } from 'react'
import { BRL, NUM } from '@/lib/format'
import type { Veiculo } from '@/lib/types'

type Msg = { id: number; texto: string; dir: 'in' | 'out' | 'sys'; hora: string }
type Opcao = { label: string; proximo: () => void }

export default function Simulador({ carros, vendedor, loja, endereco }: {
  carros: Veiculo[]; vendedor: string; loja: string; endereco: string
}) {
  const [cod, setCod] = useState(carros[0]?.cod ?? '')
  const [origem, setOrigem] = useState('Webmotors')
  const [nome, setNome] = useState('Rafael Moreira')

  const [msgs, setMsgs] = useState<Msg[]>([])
  const [opcoes, setOpcoes] = useState<Opcao[] | null>(null)
  const [digitando, setDigitando] = useState(false)
  const [ficha, setFicha] = useState<Record<string, string> | null>(null)
  const [enviadas, setEnviadas] = useState(0)
  const [tempo, setTempo] = useState<string | null>(null)

  const min = useRef(0)
  const seq = useRef(0)
  const dados = useRef<{ troca: string; pgto: string; horario: string }>({ troca: '—', pgto: '—', horario: '—' })
  const fim = useRef<HTMLDivElement>(null)

  const carro = carros.find((c) => c.cod === cod)
  const primeiro = (s: string) => s.trim().split(' ')[0] || 'você'
  const iniciais = nome.trim().split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || 'LD'

  useEffect(() => { fim.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, digitando])

  function relogio(m: number) {
    const d = new Date(); d.setHours(20, 47, 0, 0); d.setMinutes(d.getMinutes() + m)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  function add(texto: string, dir: Msg['dir'], avancar = false) {
    if (avancar) min.current += 1
    setMsgs((m) => [...m, { id: ++seq.current, texto, dir, hora: relogio(min.current) }])
    if (dir === 'out') setEnviadas((n) => n + 1)
  }
  function bot(texto: string, depois?: () => void, ops?: Opcao[]) {
    setOpcoes(null); setDigitando(true)
    setTimeout(() => {
      setDigitando(false); add(texto, 'out')
      depois?.(); setOpcoes(ops ?? null)
    }, 950)
  }
  function leadDiz(texto: string, proximo: () => void) {
    setOpcoes(null); add(texto, 'in', true)
    setTimeout(proximo, 420)
  }

  function comecar() {
    if (!carro) return
    min.current = 0; seq.current = 0; setEnviadas(0); setFicha(null)
    dados.current = { troca: '—', pgto: '—', horario: '—' }
    setMsgs([
      { id: ++seq.current, texto: `${nome} clicou no anúncio em ${origem} e abriu a conversa`, dir: 'sys', hora: relogio(0) },
      { id: ++seq.current, texto: `Olá! Tenho interesse no ${carro.cod}`, dir: 'in', hora: relogio(0) },
    ])
    setTimeout(() => {
      setTempo('0,8 s')
      bot(
`Oi, ${primeiro(nome)}! Aqui é o ${primeiro(vendedor)}, da ${loja} 👋

O ${carro.marca} ${carro.modelo} ${carro.versao} ${carro.ano_fab}/${carro.ano_mod} está disponível sim:
• ${NUM(carro.km)} km · ${carro.cor}
• ${BRL(carro.preco)}
• Revisões em dia, laudo cautelar aprovado

Só pra eu te ajudar melhor — você tem carro na troca?`,
        undefined,
        [
          { label: 'Tenho sim', proximo: () => leadDiz('Tenho sim, um Gol 2016', () => { dados.current.troca = 'Gol 2016 — avaliar'; perguntaPgto() }) },
          { label: 'Não tenho', proximo: () => leadDiz('Não tenho', () => { dados.current.troca = 'Sem troca'; perguntaPgto() }) },
        ]
      )
    }, 800)
  }

  function perguntaPgto() {
    bot('Perfeito. E como você pensa em pagar?', undefined, [
      { label: 'Financiado', proximo: () => leadDiz('Financiado', () => { dados.current.pgto = 'Financiamento'; perguntaVisita() }) },
      { label: 'À vista', proximo: () => leadDiz('À vista', () => { dados.current.pgto = 'À vista'; perguntaVisita() }) },
      { label: 'Ainda não sei', proximo: () => leadDiz('Ainda não sei', () => { dados.current.pgto = 'A definir'; perguntaVisita() }) },
    ])
  }

  function perguntaVisita() {
    const extra = dados.current.pgto === 'Financiamento'
      ? '\n\nTrabalhamos com vários bancos — a simulação exata eu faço aqui na loja com você, sem compromisso.'
      : ''
    bot(`Anotado.${extra}\n\nO melhor jeito de decidir é sentar no carro. Tenho estes horários livres:`, undefined, [
      { label: 'Quinta, 18h30', proximo: () => leadDiz('Quinta, 18h30', () => fechar('Quinta-feira, 18h30')) },
      { label: 'Sábado, 10h', proximo: () => leadDiz('Sábado, 10h', () => fechar('Sábado, 10h')) },
      { label: 'Prefiro outro', proximo: () => leadDiz('Prefiro outro horário', () => fechar('A combinar')) },
    ])
  }

  function fechar(horario: string) {
    dados.current.horario = horario
    bot(
`Fechado, ${primeiro(nome)} — ${horario} 🚗

Endereço: ${endereco}
Vou deixar o ${carro?.modelo} separado e já com a bateria carregada pra você testar.

Qualquer dúvida antes de lá, é só me chamar aqui mesmo.`,
      () => {
        add('lead qualificado · resumo no seu celular e card criado no funil', 'sys')
        if (carro) setFicha({
          Lead: nome,
          Telefone: '(67) 9 9xxx-4471',
          Origem: origem,
          Carro: `${carro.marca} ${carro.modelo} ${carro.ano_mod}`,
          Anúncio: BRL(carro.preco),
          Troca: dados.current.troca,
          Pagamento: dados.current.pgto,
          Visita: horario,
          'Piso de negociação': BRL(Number(carro.custo) + 3000),
        })
      },
      null as unknown as Opcao[]
    )
  }

  function limpar() {
    setMsgs([]); setOpcoes(null); setFicha(null); setEnviadas(0); setTempo(null); setDigitando(false)
  }

  if (!carros.length) {
    return <div className="card"><div className="empty">Cadastre um veículo no estoque para simular um atendimento.</div></div>
  }

  return (
    <div className="wa-layout">
      <div className="phone">
        <div className="phone-head">
          <div className="avatar">{msgs.length ? iniciais : 'PV'}</div>
          <div>
            <div className="nm">{msgs.length ? nome : loja}</div>
            <div className="st">{msgs.length ? `veio de ${origem}` : 'online'}</div>
          </div>
        </div>
        <div className="thread">
          {msgs.length === 0 && <div className="empty">Escolha um carro ao lado e simule a chegada de um lead.</div>}
          {msgs.map((m) => m.dir === 'sys'
            ? <div className="msg sys" key={m.id}>{m.texto}</div>
            : (
              <div className={`msg ${m.dir}`} key={m.id}>
                {m.texto}
                <span className="meta">{m.hora}{m.dir === 'out' ? ' ✓✓' : ''}</span>
              </div>
            ))}
          {digitando && <div className="typing"><i /><i /><i /></div>}
          <div ref={fim} />
        </div>
        <div className="quick">
          {opcoes?.length
            ? opcoes.map((o) => <button className="qr" key={o.label} onClick={o.proximo}>{o.label}</button>)
            : <span className="hint">{msgs.length && !digitando ? 'Conversa encerrada — você assume daqui.' : 'As respostas rápidas aparecem aqui.'}</span>}
        </div>
      </div>

      <div className="wa-side">
        <div className="card">
          <div className="card-head"><h2>Simulador de lead</h2></div>
          <div className="sub">O lead sempre inicia a conversa — é isso que torna a resposta gratuita na API oficial.</div>
          <div className="field">
            <label htmlFor="sCarro">Carro do anúncio</label>
            <select id="sCarro" value={cod} onChange={(e) => setCod(e.target.value)}>
              {carros.map((c) => <option key={c.id} value={c.cod}>{c.marca} {c.modelo} {c.versao} — {BRL(c.preco)}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="sOrigem">Canal de origem</label>
            <select id="sOrigem" value={origem} onChange={(e) => setOrigem(e.target.value)}>
              {['Webmotors', 'Instagram', 'OLX', 'Site próprio', 'Mercado Livre', 'Indicação'].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="sNome">Nome do lead</label>
            <input id="sNome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={comecar}>Simular chegada de lead</button>
            <button className="btn ghost" onClick={limpar}>Limpar</button>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h2>O que chega no seu celular</h2></div>
          <div className="sub">O robô só te chama depois de qualificar. Você entra na conversa já sabendo tudo.</div>
          {ficha ? (
            <>
              {Object.entries(ficha).map(([k, v]) => (
                <div className="kv" key={k}>
                  <span>{k}</span>
                  <strong style={k === 'Piso de negociação' ? { color: 'var(--good-text)' } : undefined}>{v}</strong>
                </div>
              ))}
              <div style={{ marginTop: 10, fontSize: '11.5px', color: 'var(--muted)', lineHeight: 1.5 }}>
                O piso aparece só para você. O robô nunca viu esse número e nunca negocia preço.
              </div>
            </>
          ) : <div className="empty">Ainda não houve repasse.</div>}
        </div>

        <div className="card">
          <div className="card-head"><h2>Medidor da conversa</h2></div>
          <div className="sub">O que essa conversa custou e quanto tempo levou.</div>
          <div className="kv"><span>Tempo até a 1ª resposta</span><strong>{tempo ?? '—'}</strong></div>
          <div className="kv"><span>Mensagens enviadas</span><strong>{enviadas}</strong></div>
          <div className="kv"><span>Categoria (janela de 24 h)</span><strong>{tempo ? 'service — dentro da janela' : '—'}</strong></div>
          <div className="kv"><span>Custo desta conversa</span><strong style={{ color: tempo ? 'var(--good-text)' : undefined }}>{tempo ? 'R$ 0,00 (grátis)' : 'R$ 0,00'}</strong></div>
        </div>
      </div>
    </div>
  )
}
