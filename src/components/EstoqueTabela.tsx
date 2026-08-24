'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BRL, NUM, pct, situacao, dataBR } from '@/lib/format'
import { usePop } from '@/lib/usePop'
import { atualizarVeiculo, criarVeiculo, excluirVeiculo, marcarVendido } from '@/actions/estoque'
import type { Veiculo } from '@/lib/types'
import Modal from '@/components/Modal'
import FotosUpload from '@/components/FotosUpload'
import { Opcionais, Condicoes } from '@/components/MarcarItens'

const IC = {
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  sold: <path d="M20 6L9 17l-5-5" />,
  del: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></>,
}

/** Miniatura da primeira foto; sem foto, um contorno de carro e o aviso. */
export function Miniatura({ carro, grande }: { carro: Veiculo; grande?: boolean }) {
  const foto = carro.fotos?.[0]
  return (
    <div className={`thumb${grande ? ' g' : ''}${foto ? '' : ' sem'}`}>
      {foto
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={foto} alt={`${carro.marca} ${carro.modelo}`} loading="lazy" />
        : (
          <svg viewBox="0 0 132 58" aria-label="sem foto">
            <path d="M6 44h120" />
            <path d="M16 37c-5.4 0-8-2.4-8-6.2v-4.2c0-3.4 2.2-5.8 5.8-6.6l10.4-2.4 9.6-8.4C36.2 7.4 39 6.2 42.2 6.2h29.2c3.2 0 6 1.2 8.4 3.4l9.4 8.6 20.6 3.2c6 .9 10.2 3.9 10.2 8.2v4c0 2.6-1.8 3.4-4.6 3.4h-7.4" />
            <path d="M27 17.2h78" />
            <circle cx="38" cy="37" r="8.4" /><circle cx="96" cy="37" r="8.4" />
          </svg>
        )}
      {carro.fotos && carro.fotos.length > 1 && <span className="qtd">{carro.fotos.length}</span>}
    </div>
  )
}

export default function EstoqueTabela({ carros }: { carros: Veiculo[] }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [novo, setNovo] = useState(false)
  const [editar, setEditar] = useState<Veiculo | null>(null)
  const [vender, setVender] = useState<Veiculo | null>(null)
  const [apagar, setApagar] = useState<Veiculo | null>(null)
  const [erro, setErro] = useState('')

  // mesmo cartão de hover de Minhas vendas — componente reaproveitado
  const { ativo, setAtivo, pos, pop, abrir, fechar, segurar } = usePop<Veiculo>(372)

  const lista = carros.filter((c) => {
    const txt = `${c.cod} ${c.marca} ${c.modelo} ${c.versao} ${c.cor} ${c.placa ?? ''}`.toLowerCase()
    if (busca && !txt.includes(busca.toLowerCase())) return false
    if (filtro === 'disponivel') return c.status === 'disponivel'
    if (filtro === 'suspenso') return c.status === 'suspenso'
    if (filtro === 'vendido') return c.status === 'vendido'
    if (filtro === 'sem-foto') return c.status !== 'vendido' && !c.fotos?.length
    if (filtro === 'alerta') return c.status === 'disponivel' && situacao(c).prio > 0
    return true
  })

  function rodar(fn: () => Promise<{ erro?: string; ok?: boolean }>, fechar: () => void) {
    setErro('')
    iniciar(async () => {
      const r = await fn()
      if (r?.erro) { setErro(r.erro); return }
      fechar(); router.refresh()
    })
  }

  return (
    <>
      <div className="toolbar">
        <button className="btn" onClick={() => { setErro(''); setNovo(true) }}>+ Adicionar veículo</button>
        <div className="search grow">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Filtrar por modelo, código, placa ou cor" />
        </div>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ width: 200 }}>
          <option value="todos">Todos os veículos</option>
          <option value="disponivel">Só na vitrine</option>
          <option value="suspenso">Só suspensos</option>
          <option value="vendido">Só vendidos</option>
          <option value="sem-foto">Sem foto</option>
          <option value="alerta">Só com alerta</option>
        </select>
      </div>

      <div className="tbl-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Foto</th><th>Veículo</th><th>Ano</th><th className="num">KM</th>
              <th className="num">Anúncio</th><th className="num">FIPE</th><th className="num">Δ FIPE</th>
              <th className="num">Custo</th><th className="num">Margem</th><th className="num">Dias</th>
              <th>Situação</th><th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody onMouseLeave={fechar}>
            {lista.length ? lista.map((c) => {
              const s = situacao(c)
              const vendido = c.status === 'vendido'
              return (
                <tr key={c.id} className={`sale-row${vendido ? ' sold' : ''}`}
                  onMouseMove={(e) => abrir(c, e)}>
                  <td><Miniatura carro={c} /></td>
                  <td>
                    <div className="car-name">{c.marca} {c.modelo}</div>
                    <div className="car-sub">{c.versao} · {c.cor}{c.placa ? ` · ${c.placa}` : ''}</div>
                    <div className="mono" style={{ marginTop: 3 }}>{c.cod}</div>
                  </td>
                  <td>{c.ano_fab}/{c.ano_mod}</td>
                  <td className="num">{NUM(c.km)}</td>
                  <td className="num">{BRL(c.preco)}</td>
                  <td className="num" style={{ color: 'var(--text-2)' }}>{BRL(c.fipe)}</td>
                  <td className="num" style={{ color: (c.delta_fipe ?? 0) > 3 ? 'var(--critical)' : 'var(--text-2)' }}>{pct(c.delta_fipe)}</td>
                  <td className="num" style={{ color: 'var(--text-2)' }}>{BRL(c.custo)}</td>
                  <td className="num" style={{ color: 'var(--good-text)' }}>{BRL(Number(c.preco) - Number(c.custo))}</td>
                  <td className="num">{c.dias_estoque}</td>
                  <td><span className={`chip ${s.cls}`}><span className="dot" />{s.txt}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="ia" title="Editar veículo" onClick={() => { setErro(''); setEditar(c) }}><svg viewBox="0 0 24 24">{IC.edit}</svg></button>
                      {!vendido && <button className="ia" title="Marcar como vendido" onClick={() => { setErro(''); setVender(c) }}><svg viewBox="0 0 24 24">{IC.sold}</svg></button>}
                      <button className="ia danger" title="Excluir do estoque" onClick={() => { setErro(''); setApagar(c) }}><svg viewBox="0 0 24 24">{IC.del}</svg></button>
                    </div>
                  </td>
                </tr>
              )
            }) : <tr><td colSpan={12} className="empty">Nenhum veículo com esse filtro.</td></tr>}
          </tbody>
        </table>
      </div>

      <div ref={pop} className={`sale-pop${ativo ? ' on' : ''}`} style={{ top: pos.top, left: pos.left }}
        onMouseEnter={segurar} onMouseLeave={() => setAtivo(null)}>
        {ativo && (() => {
          const s = situacao(ativo)
          const margem = Number(ativo.preco) - Number(ativo.custo)
          return (
            <>
              <div className="sp-topo">
                <Miniatura carro={ativo} grande />
                <div>
                  <h4>{ativo.marca} {ativo.modelo}</h4>
                  <div className="meta">{ativo.versao} · {ativo.ano_fab}/{ativo.ano_mod}</div>
                  <span className={`chip ${s.cls}`} style={{ marginTop: 6 }}><span className="dot" />{s.txt}</span>
                </div>
              </div>

              <div className="sp-sec"><h5>Ficha do veículo</h5>
                <div className="sp-grid">
                  <div><div className="k">Código</div><div className="v mono">{ativo.cod}</div></div>
                  <div><div className="k">Placa</div><div className="v mono">{ativo.placa ?? '—'}</div></div>
                  <div><div className="k">Quilometragem</div><div className="v">{NUM(ativo.km)} km</div></div>
                  <div><div className="k">Cor</div><div className="v">{ativo.cor || '—'}</div></div>
                  <div><div className="k">Câmbio</div><div className="v">{ativo.cambio}</div></div>
                  <div><div className="k">Combustível</div><div className="v">{ativo.combustivel}</div></div>
                </div>
              </div>

              <div className="sp-sec"><h5>Números</h5>
                <div className="sp-grid">
                  <div><div className="k">Preço de anúncio</div><div className="v">{BRL(ativo.preco)}</div></div>
                  <div><div className="k">Tabela FIPE</div><div className="v">{BRL(ativo.fipe)}</div></div>
                  <div><div className="k">Diferença da FIPE</div><div className="v">{pct(ativo.delta_fipe)}</div></div>
                  <div><div className="k">Custo total</div><div className="v">− {BRL(ativo.custo)}</div></div>
                  <div><div className="k">Dias no pátio</div><div className="v">{ativo.dias_estoque ?? 0}</div></div>
                  <div><div className="k">Entrou em</div><div className="v">{ativo.data_entrada ? dataBR(ativo.data_entrada) : '—'}</div></div>
                </div>
              </div>

              <div className="sp-sec"><h5>Anúncio</h5>
                <div className="sp-grid">
                  <div><div className="k">Fotos</div><div className="v">{ativo.fotos?.length ? `${ativo.fotos.length} publicada${ativo.fotos.length > 1 ? 's' : ''}` : 'nenhuma'}</div></div>
                  <div><div className="k">Opcionais marcados</div><div className="v">{ativo.opcionais?.length ?? 0}</div></div>
                  <div><div className="k">Condições marcadas</div><div className="v">{ativo.condicoes?.length ?? 0}</div></div>
                  <div><div className="k">Na vitrine</div><div className="v">{ativo.status === 'disponivel' ? 'sim' : 'não'}</div></div>
                </div>
                {!ativo.fotos?.length && ativo.status === 'disponivel' && (
                  <div className="no-trade">Está na vitrine sem foto — anúncio sem foto quase não recebe contato.</div>
                )}
              </div>

              <div className="sp-total"><span>Margem potencial</span><b>{BRL(margem)}</b></div>
            </>
          )
        })()}
      </div>

      {novo && (
        <Modal titulo="Adicionar veículo" ok="Salvar no estoque" largo erro={erro} pendente={pendente}
          onCancel={() => { setNovo(false); setErro('') }}
          form={(fd) => rodar(() => criarVeiculo(fd), () => setNovo(false))}>
          <div className="mtext">O código é gerado sozinho se você deixar em branco. Ele é o que viaja no link do WhatsApp.</div>

          <div className="grid g-2" style={{ gap: '0 12px' }}>
            <div className="field"><label>Marca</label><input name="marca" required placeholder="Chevrolet" /></div>
            <div className="field"><label>Modelo</label><input name="modelo" required placeholder="Onix" /></div>
            <div className="field"><label>Versão</label><input name="versao" placeholder="1.0 Turbo LTZ" /></div>
            <div className="field"><label>Placa</label><input name="placa" placeholder="ABC1D23" style={{ textTransform: 'uppercase' }} /></div>
            <div className="field"><label>Ano fabricação</label><input name="ano_fab" type="number" placeholder="2021" /></div>
            <div className="field"><label>Ano modelo</label><input name="ano_mod" type="number" required placeholder="2022" /></div>
            <div className="field"><label>Quilometragem</label><input name="km" type="number" placeholder="42300" /></div>
            <div className="field"><label>Cor</label><input name="cor" placeholder="Prata" /></div>
            <div className="field"><label>Câmbio</label>
              <select name="cambio"><option>Manual</option><option>Automático</option></select>
            </div>
            <div className="field"><label>Combustível</label>
              <select name="combustivel"><option>Flex</option><option>Gasolina</option><option>Diesel</option><option>Híbrido</option><option>Elétrico</option></select>
            </div>
            <div className="field"><label>Preço de anúncio</label><input name="preco" type="number" required placeholder="78900" /></div>
            <div className="field"><label>Tabela FIPE</label><input name="fipe" type="number" placeholder="79400" /></div>
            <div className="field"><label>Custo total</label><input name="custo" type="number" placeholder="71500" /></div>
            <div className="field"><label>Código (opcional)</label><input name="cod" placeholder="deixe em branco" /></div>
          </div>

          <FotosUpload />

          <Opcionais />
          <Condicoes />

          <div className="field">
            <label>Descrição para a vitrine</label>
            <textarea name="descricao" rows={3} placeholder="Único dono, revisões em concessionária, laudo cautelar aprovado…" />
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label>Já publicar na vitrine?</label>
            <select name="status" defaultValue="disponivel">
              <option value="disponivel">Sim — entra na vitrine agora</option>
              <option value="suspenso">Não — fica só no estoque, suspenso</option>
            </select>
          </div>
        </Modal>
      )}

      {editar && (
        <Modal titulo={`Editar ${editar.marca} ${editar.modelo}`} ok="Salvar alterações" largo erro={erro} pendente={pendente}
          onCancel={() => { setEditar(null); setErro('') }}
          form={(fd) => rodar(() => atualizarVeiculo(editar.id, fd), () => setEditar(null))}>
          <div className="mtext">Código <span className="mono">{editar.cod}</span>. Alterar aqui atualiza a vitrine na hora.</div>
          <div className="grid g-2" style={{ gap: '0 12px' }}>
            <div className="field"><label>Preço de anúncio</label><input name="preco" type="number" defaultValue={editar.preco} /></div>
            <div className="field"><label>Quilometragem</label><input name="km" type="number" defaultValue={editar.km} /></div>
            <div className="field"><label>Cor</label><input name="cor" defaultValue={editar.cor} /></div>
            <div className="field"><label>Custo total</label><input name="custo" type="number" defaultValue={editar.custo} /></div>
            <div className="field"><label>Tabela FIPE</label><input name="fipe" type="number" defaultValue={editar.fipe ?? ''} /></div>
          </div>

          <FotosUpload iniciais={editar.fotos} />

          <Opcionais marcados={editar.opcionais} />
          <Condicoes marcados={editar.condicoes} />

          <div className="field" style={{ marginBottom: 0 }}>
            <label>Descrição para a vitrine</label>
            <textarea name="descricao" rows={3} defaultValue={editar.descricao ?? ''} />
          </div>
        </Modal>
      )}

      {vender && (
        <Modal titulo="Marcar como vendido" ok="Confirmar venda" erro={erro} pendente={pendente}
          onCancel={() => { setVender(null); setErro('') }}
          onConfirm={() => rodar(() => marcarVendido(vender.id), () => setVender(null))}>
          <div className="mtext">
            O <b>{vender.marca} {vender.modelo} {vender.ano_mod}</b> sai da vitrine na hora.<br /><br />
            Nada é apagado: o carro continua no histórico para o cálculo de margem e tempo de giro.
            Para registrar cliente, troca e lucro, use <b>Minhas vendas → Registrar venda</b>.
          </div>
        </Modal>
      )}

      {apagar && (
        <Modal titulo="Excluir do estoque" ok="Excluir mesmo assim" perigo erro={erro} pendente={pendente}
          onCancel={() => { setApagar(null); setErro('') }}
          onConfirm={() => rodar(() => excluirVeiculo(apagar.id), () => setApagar(null))}>
          <div className="mtext">
            Isso apaga <b>{apagar.marca} {apagar.modelo}</b> (<span className="mono">{apagar.cod}</span>) de vez: some da vitrine e do histórico.<br /><br />
            Se o carro foi vendido, use <b>marcar como vendido</b> — assim você não perde o dado de margem. Excluir é para cadastro errado ou duplicado.
          </div>
        </Modal>
      )}
    </>
  )
}
