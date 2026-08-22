'use client'
import { useEffect, useMemo, useState } from 'react'
import { BRL, NUM, linkWhats } from '@/lib/format'
import type { Veiculo } from '@/lib/types'

type Canal = { id: string; nome: string; tag: string; modo: 'auto' | 'revisao' | 'contrato' | 'manual'; dsc: string; lim: number }

const CANAIS: Canal[] = [
  { id: 'site', nome: 'Vitrine própria', tag: 'Automático', modo: 'auto', lim: 140,
    dsc: 'Já está no ar. O carro aparece sozinho assim que você cadastra no estoque.' },
  { id: 'ml', nome: 'Mercado Livre', tag: 'API pública', modo: 'manual', lim: 60,
    dsc: 'API self-service — é o único portal que dá para automatizar sozinho. Por enquanto, copie e cole.' },
  { id: 'ig', nome: 'Instagram', tag: 'Graph API · análise', modo: 'revisao', lim: 2200,
    dsc: 'Exige conta Business e análise do app na Meta (1 a 4 semanas). Até lá, copie a legenda e poste.' },
  { id: 'fb', nome: 'Facebook (Página)', tag: 'Graph API', modo: 'manual', lim: 2200,
    dsc: 'Mais simples que o Instagram. Entra junto com ele na fase de integração.' },
  { id: 'olx', nome: 'OLX', tag: 'Integrador', modo: 'contrato', lim: 90,
    dsc: 'Exige plano Autos e cadastro como integrador. Não existe caminho self-service — cole manualmente.' },
]

const INFO = {
  auto: { chip: 'good', txt: 'no ar' },
  manual: { chip: 'neutral', txt: 'copie e cole' },
  revisao: { chip: 'warn', txt: 'depende de aprovação' },
  contrato: { chip: 'serious', txt: 'depende de contrato' },
} as const

/** Escolhe a versão mais completa que ainda cabe no limite do canal. */
const cabe = (opcoes: string[], lim: number) =>
  opcoes.find((t) => t.length <= lim) ?? (opcoes[opcoes.length - 1].slice(0, lim - 1) + '…')

export default function GeradorAnuncio({ carros, whatsapp }: { carros: Veiculo[]; whatsapp: string }) {
  const [cod, setCod] = useState(carros[0]?.cod ?? '')
  const carro = carros.find((c) => c.cod === cod)

  const gerados = useMemo(() => {
    if (!carro) return {} as Record<string, string>
    const c = carro
    const base = `${c.marca} ${c.modelo} ${c.versao} ${c.ano_fab}/${c.ano_mod}`.replace(/\s+/g, ' ').trim()
    const curto = `${c.marca} ${c.modelo} ${c.versao} ${c.ano_mod}`.replace(/\s+/g, ' ').trim()
    const cambioCurto = c.cambio === 'Automático' ? 'Aut.' : 'Man.'
    const desc = c.descricao ??
      `Único dono, revisões em dia e laudo cautelar aprovado. Pneus em bom estado, sem retoque de pintura e sem registro de sinistro.`
    return {
      site: cabe([`${base} · ${c.cor} · ${NUM(c.km)} km`, `${curto} · ${NUM(c.km)} km`], 140),
      ml: cabe([
        `${base} ${c.cambio} ${NUM(c.km)} km`,
        `${curto} ${cambioCurto} ${NUM(c.km)} km`,
        `${c.modelo} ${c.versao} ${c.ano_mod} ${cambioCurto} ${NUM(c.km)} km`,
        `${c.modelo} ${c.versao} ${c.ano_mod}`,
      ], 60),
      olx: cabe([
        `${base} · ${c.cambio} · ${NUM(c.km)} km · ${c.cor}`,
        `${curto} · ${cambioCurto} · ${NUM(c.km)} km · ${c.cor}`,
        `${c.modelo} ${c.versao} ${c.ano_mod} · ${NUM(c.km)} km`,
      ], 90),
      fb: `${base} — ${BRL(c.preco)}

• ${NUM(c.km)} km rodados
• ${c.combustivel ?? 'Flex'}, câmbio ${c.cambio.toLowerCase()}
• Cor ${c.cor.toLowerCase()}
• ${desc}
• Aceitamos troca e financiamos

Chame no WhatsApp e agende sua visita. Código ${c.cod}.
${linkWhats(whatsapp, c.cod)}`,
      ig: `${c.modelo} ${c.versao} ${c.ano_mod} por ${BRL(c.preco)} 🚗

${NUM(c.km)} km · ${c.cor} · câmbio ${c.cambio.toLowerCase()}
${desc}

Chama no direct ou no link da bio pra agendar — o carro fica separado pra você testar.

#${c.marca.toLowerCase().replace(/[^a-z0-9]/g, '')} #${c.modelo.toLowerCase().replace(/[^a-z0-9]/g, '')} #seminovos #carrosusados #treslagoas #portalveiculos`,
    }
  }, [carro, whatsapp])

  const [textos, setTextos] = useState<Record<string, string>>({})
  const [editado, setEditado] = useState<Record<string, boolean>>({})
  const [copiado, setCopiado] = useState('')

  useEffect(() => {
    setTextos(gerados)
    setEditado({})
  }, [gerados])

  async function copiar(id: string) {
    try {
      await navigator.clipboard.writeText(textos[id] ?? '')
      setCopiado(id)
      setTimeout(() => setCopiado(''), 1800)
    } catch {
      setCopiado('erro')
    }
  }

  if (!carros.length) {
    return <div className="card"><div className="empty">Cadastre um veículo no estoque para gerar os anúncios.</div></div>
  }

  return (
    <>
      <div className="demo-note">
        <span>📋</span>
        <div>
          <b>Por enquanto é copiar e colar.</b> A publicação automática depende de integrações que ainda não foram feitas —
          o Mercado Livre é o único que dá para ligar sozinho, e o Instagram precisa de aprovação da Meta.
          O que já economiza tempo hoje é o texto sair pronto no formato de cada canal.
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.35fr 1fr', gap: 14 }}>
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-head"><h2>Escolha o veículo</h2></div>
            <div className="sub">Os textos são montados a partir do que está cadastrado no estoque.</div>
            <div className="field" style={{ marginBottom: 0 }}>
              <select value={cod} onChange={(e) => setCod(e.target.value)}>
                {carros.map((c) => (
                  <option key={c.id} value={c.cod}>
                    {c.marca} {c.modelo} {c.versao} · {c.ano_fab}/{c.ano_mod} · {BRL(c.preco)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h2>Textos prontos</h2></div>
            <div className="sub">
              Cada canal tem limite e estilo diferente. Clique em qualquer texto para ajustar — o contador fica vermelho se passar do limite.
            </div>
            {CANAIS.map((c) => {
              const t = textos[c.id] ?? ''
              const over = t.length > c.lim
              return (
                <div className="txt-card" key={c.id}>
                  <div className="hd">
                    <b>{c.nome} {editado[c.id] && <span className="edited-tag">· editado</span>}</b>
                    <div className="acts">
                      <span className={`cnt ${over ? 'over' : ''}`}>{t.length}/{c.lim}</span>
                      {editado[c.id] && (
                        <button className="mini" onClick={() => {
                          setTextos((x) => ({ ...x, [c.id]: gerados[c.id] }))
                          setEditado((x) => ({ ...x, [c.id]: false }))
                        }}>Restaurar</button>
                      )}
                      <button className="mini" onClick={() => copiar(c.id)}>
                        {copiado === c.id ? '✓ copiado' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={c.lim > 200 ? 9 : 2}
                    spellCheck={false}
                    value={t}
                    onChange={(e) => {
                      setTextos((x) => ({ ...x, [c.id]: e.target.value }))
                      setEditado((x) => ({ ...x, [c.id]: e.target.value !== gerados[c.id] }))
                    }}
                  />
                </div>
              )
            })}
            <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5, marginTop: 4 }}>
              Os limites são configuráveis por canal — confirme os valores atuais na documentação de cada portal antes de usar de verdade.
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h2>Situação de cada canal</h2></div>
          <div className="sub">O que já dispara sozinho e o que depende de aprovação de terceiro. Essa distinção é a que mais some nas propostas.</div>
          {CANAIS.map((c) => {
            const m = INFO[c.modo]
            return (
              <div className="ch" key={c.id} style={{ paddingLeft: 0 }}>
                <div className="body">
                  <div className="nm">
                    {c.nome}
                    <span className={`chip ${m.chip}`}><span className="dot" />{m.txt}</span>
                    <span className="src">{c.tag}</span>
                  </div>
                  <div className="dsc">{c.dsc}</div>
                </div>
              </div>
            )
          })}
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12, lineHeight: 1.6 }}>
            <b style={{ color: 'var(--text-1)' }}>Ordem que faz sentido ligar:</b> Mercado Livre primeiro
            {' '}(é self-service), depois Facebook, depois Instagram — e o pedido de análise da Meta vale começar cedo,
            {' '}porque demora. OLX e Webmotors são decisão comercial, não técnica.
          </div>
        </div>
      </div>
    </>
  )
}
