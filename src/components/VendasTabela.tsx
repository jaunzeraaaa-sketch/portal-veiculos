'use client'
import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BRL, dataBR, hojeISO } from '@/lib/format'
import { registrarVenda } from '@/actions/vendas'
import type { Veiculo, Venda } from '@/lib/types'
import Modal from '@/components/Modal'

export default function VendasTabela({ vendas, estoque }: { vendas: Venda[]; estoque: Veiculo[] }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  const [nova, setNova] = useState(false)
  const [erro, setErro] = useState('')
  const [ativa, setAtiva] = useState<Venda | null>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const [temTroca, setTemTroca] = useState(false)
  const [valor, setValor] = useState(estoque[0]?.preco ?? 0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pop = useRef<HTMLDivElement>(null)

  function abrir(v: Venda, e: React.MouseEvent) {
    if (timer.current) clearTimeout(timer.current)
    setAtiva(v)
    const w = 372, h = pop.current?.offsetHeight ?? 520
    let top = e.clientY - h / 2
    top = Math.max(12, Math.min(top, window.innerHeight - h - 12))
    let left = e.clientX > window.innerWidth / 2 ? e.clientX - w - 26 : e.clientX + 26
    left = Math.max(12, Math.min(left, window.innerWidth - w - 12))
    setPos({ top, left })
  }
  const fechar = () => { timer.current = setTimeout(() => setAtiva(null), 160) }

  function salvar(fd: FormData) {
    setErro('')
    iniciar(async () => {
      const r = await registrarVenda(fd)
      if (r?.erro) { setErro(r.erro); return }
      setNova(false); setTemTroca(false); router.refresh()
    })
  }

  return (
    <>
      <div className="toolbar">
        <button className="btn" onClick={() => { setValor(estoque[0]?.preco ?? 0); setNova(true) }} disabled={!estoque.length}>
          + Registrar venda
        </button>
        <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
          {estoque.length
            ? 'O carro vendido sai do estoque e da vitrine sozinho. Se teve troca, o carro do cliente entra no estoque.'
            : 'Nenhum carro disponível no estoque para registrar venda.'}
        </span>
      </div>

      <div className="tbl-wrap">
        <table className="data" style={{ minWidth: 960 }}>
          <thead>
            <tr>
              <th>Data</th><th>Cliente</th><th>Carro que saiu</th><th>Carro que entrou</th>
              <th className="num">Valor de venda</th><th className="num">Valor da troca</th><th className="num">Lucro</th>
            </tr>
          </thead>
          <tbody onMouseLeave={fechar}>
            {vendas.length ? vendas.map((v) => (
              <tr key={v.id} className="sale-row" onMouseMove={(e) => abrir(v, e)}>
                <td>{dataBR(v.data_venda)}</td>
                <td><div className="car-name">{v.cliente}</div><div className="car-sub">{v.cidade}</div></td>
                <td><div className="car-name">{v.veiculo_desc}</div><div className="car-sub">{v.veiculo_cod}</div></td>
                <td>{v.troca_modelo
                  ? <div className="trade-cell">{v.troca_modelo}<div className="p">{v.troca_ano} · {v.troca_placa} · {v.troca_cor}</div></div>
                  : <span className="no-trade">sem troca</span>}</td>
                <td className="num">{BRL(v.valor_venda)}</td>
                <td className="num">{v.troca_valor ? BRL(v.troca_valor) : '—'}</td>
                <td className="num money-in">{BRL(v.lucro)}</td>
              </tr>
            )) : <tr><td colSpan={7} className="empty">Nenhuma venda registrada ainda.</td></tr>}
          </tbody>
        </table>
      </div>

      <div ref={pop} className={`sale-pop${ativa ? ' on' : ''}`} style={{ top: pos.top, left: pos.left }}
        onMouseEnter={() => timer.current && clearTimeout(timer.current)} onMouseLeave={() => setAtiva(null)}>
        {ativa && (
          <>
            <h4>{ativa.cliente}</h4>
            <div className="meta">{ativa.telefone} · {ativa.cidade} · vendido em {dataBR(ativa.data_venda)}</div>
            <div className="sp-sec"><h5>Carro que saiu</h5>
              <div className="sp-grid">
                <div><div className="k">Veículo</div><div className="v">{ativa.veiculo_desc}</div></div>
                <div><div className="k">Código</div><div className="v mono">{ativa.veiculo_cod}</div></div>
                <div><div className="k">Valor de venda</div><div className="v">{BRL(ativa.valor_venda)}</div></div>
                <div><div className="k">Custo do carro</div><div className="v">{BRL(ativa.custo_carro)}</div></div>
              </div>
            </div>
            <div className="sp-sec"><h5>Carro que entrou na troca</h5>
              {ativa.troca_modelo ? (
                <div className="sp-grid">
                  <div><div className="k">Modelo</div><div className="v">{ativa.troca_modelo}</div></div>
                  <div><div className="k">Ano</div><div className="v">{ativa.troca_ano}</div></div>
                  <div><div className="k">Placa</div><div className="v mono">{ativa.troca_placa}</div></div>
                  <div><div className="k">Cor</div><div className="v">{ativa.troca_cor}</div></div>
                  <div><div className="k">Valor na troca</div><div className="v">{BRL(ativa.troca_valor)}</div></div>
                  <div><div className="k">Entrou no estoque</div><div className="v">sim</div></div>
                </div>
              ) : <div className="no-trade">Não teve troca — o cliente pagou o carro cheio.</div>}
            </div>
            <div className="sp-sec"><h5>Conta da operação</h5>
              <div className="sp-grid">
                <div><div className="k">Valor de venda</div><div className="v">{BRL(ativa.valor_venda)}</div></div>
                <div><div className="k">Custo do carro</div><div className="v">− {BRL(ativa.custo_carro)}</div></div>
                <div><div className="k">Documentação e revisão</div><div className="v">− {BRL(ativa.outros_custos)}</div></div>
                <div><div className="k">Dinheiro que entrou</div><div className="v">{BRL(ativa.dinheiro_entrou)}</div></div>
              </div>
            </div>
            <div className="sp-total"><span>Lucro da venda</span><b>{BRL(ativa.lucro)}</b></div>
          </>
        )}
      </div>

      {nova && (
        <Modal titulo="Registrar venda" ok="Salvar venda" erro={erro} pendente={pendente}
          onCancel={() => { setNova(false); setErro('') }} form={salvar}>
          <div className="mtext">O carro vendido puxa preço e custo direto do estoque, e sai da vitrine ao salvar.</div>
          <div className="field">
            <label htmlFor="svCarro">Carro que vendi (do estoque)</label>
            <select id="svCarro" name="veiculo_id" onChange={(e) => {
              const c = estoque.find((x) => x.id === e.target.value); if (c) setValor(c.preco)
            }}>
              {estoque.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.marca} {c.modelo} {c.versao} · {c.ano_fab}/{c.ano_mod} · {BRL(c.preco)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid g-2" style={{ gap: '0 12px' }}>
            <div className="field"><label>Valor final de venda</label><input name="valor_venda" type="number" value={valor} onChange={(e) => setValor(Number(e.target.value))} /></div>
            <div className="field"><label>Documentação e revisão</label><input name="outros_custos" type="number" defaultValue={800} /></div>
            <div className="field"><label>Nome do cliente</label><input name="cliente" required placeholder="Nome completo" /></div>
            <div className="field"><label>Telefone</label><input name="telefone" placeholder="(67) 99999-0000" /></div>
            <div className="field"><label>Cidade</label><input name="cidade" defaultValue="Três Lagoas/MS" /></div>
            <div className="field"><label>Data da venda</label><input name="data_venda" type="date" defaultValue={hojeISO()} /></div>
          </div>
          <div className="field" style={{ margin: '6px 0 10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
              <input type="checkbox" name="tem_troca" checked={temTroca} onChange={(e) => setTemTroca(e.target.checked)}
                style={{ width: 15, height: 15, accentColor: 'var(--brand)' }} />
              Teve carro na troca
            </label>
          </div>
          {temTroca && (
            <>
              <div className="grid g-2" style={{ gap: '0 12px' }}>
                <div className="field"><label>Modelo do carro na troca</label><input name="troca_modelo" placeholder="Ford Ka 1.0 SE" /></div>
                <div className="field"><label>Ano</label><input name="troca_ano" placeholder="2017/2018" /></div>
                <div className="field"><label>Placa</label><input name="troca_placa" placeholder="ABC1D23" style={{ textTransform: 'uppercase' }} /></div>
                <div className="field"><label>Cor</label><input name="troca_cor" placeholder="Prata" /></div>
              </div>
              <div className="field" style={{ marginBottom: 0 }}><label>Valor que esse carro entrou</label><input name="troca_valor" type="number" defaultValue={0} /></div>
            </>
          )}
        </Modal>
      )}
    </>
  )
}
