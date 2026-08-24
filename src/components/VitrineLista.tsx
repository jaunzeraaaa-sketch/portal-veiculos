'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BRL, NUM } from '@/lib/format'
import { definirSituacao, publicarVeiculos } from '@/actions/estoque'
import type { Veiculo } from '@/lib/types'
import { Miniatura } from '@/components/EstoqueTabela'
import Modal from '@/components/Modal'

const SITUACOES = [
  { id: 'disponivel', label: 'Ativo', cls: 'good', dsc: 'aparecendo na vitrine' },
  { id: 'suspenso', label: 'Suspenso', cls: 'warn', dsc: 'no estoque, fora da vitrine' },
  { id: 'vendido', label: 'Vendido', cls: 'neutral', dsc: 'saiu do pátio' },
] as const

export default function VitrineLista({ carros }: { carros: Veiculo[] }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  const [aba, setAba] = useState<string>('disponivel')
  const [adicionar, setAdicionar] = useState(false)
  const [escolhidos, setEscolhidos] = useState<Set<string>>(new Set())
  const [erro, setErro] = useState('')

  const porSituacao = (s: string) => carros.filter((c) => c.status === s)
  const lista = porSituacao(aba)
  const foraDaVitrine = carros.filter((c) => c.status !== 'disponivel')

  function rodar(fn: () => Promise<{ erro?: string; ok?: boolean }>, fechar?: () => void) {
    setErro('')
    iniciar(async () => {
      const r = await fn()
      if (r?.erro) { setErro(r.erro); return }
      fechar?.(); router.refresh()
    })
  }

  function alternar(id: string) {
    setEscolhidos((s) => {
      const novo = new Set(s)
      if (novo.has(id)) novo.delete(id); else novo.add(id)
      return novo
    })
  }

  return (
    <div className="card">
      <div className="card-head">
        <h2>Veículos na vitrine</h2>
        <button className="btn" onClick={() => { setErro(''); setEscolhidos(new Set()); setAdicionar(true) }}>
          + Adicionar veículo na vitrine
        </button>
      </div>
      <div className="sub">
        Ativo aparece para o cliente. Suspenso continua no estoque mas some do site — bom para carro reservado,
        em preparação ou sem foto. Vendido sai da vitrine e entra no histórico de margem.
      </div>

      <div className="segs">
        {SITUACOES.map((s) => (
          <button key={s.id} className={`seg${aba === s.id ? ' on' : ''}`} onClick={() => setAba(s.id)}>
            {s.label} <span className="n">{porSituacao(s.id).length}</span>
          </button>
        ))}
      </div>

      {erro && <div className="login-erro" style={{ marginBottom: 12 }}>{erro}</div>}

      {lista.length ? (
        <div className="vit-lista">
          {lista.map((c) => (
            <div className="vit-item" key={c.id}>
              <Miniatura carro={c} />
              <div className="vit-info">
                <div className="nm">{c.marca} {c.modelo} <span className="ano">{c.ano_fab}/{c.ano_mod}</span></div>
                <div className="sb">{c.versao} · {c.cor} · {NUM(c.km)} km</div>
                <div className="mono">{c.cod}</div>
              </div>
              <div className="vit-preco">
                <strong>{BRL(c.preco)}</strong>
                <span>{c.fotos?.length ? `${c.fotos.length} foto${c.fotos.length > 1 ? 's' : ''}` : 'sem foto'}</span>
              </div>
              <div className="vit-seg">
                {SITUACOES.map((s) => (
                  <button key={s.id} type="button" disabled={pendente}
                    className={`mini${c.status === s.id ? ` on ${s.cls}` : ''}`}
                    title={s.dsc}
                    onClick={() => c.status !== s.id && rodar(() => definirSituacao(c.id, s.id))}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">
          {aba === 'disponivel'
            ? 'Nenhum carro publicado. Use o botão acima para trazer do estoque.'
            : aba === 'suspenso' ? 'Nenhum carro suspenso.' : 'Nenhuma venda registrada ainda.'}
        </div>
      )}

      {adicionar && (
        <Modal titulo="Adicionar veículo na vitrine" ok={`Publicar ${escolhidos.size || ''}`.trim()}
          largo erro={erro} pendente={pendente}
          onCancel={() => { setAdicionar(false); setErro('') }}
          onConfirm={() => rodar(() => publicarVeiculos([...escolhidos]), () => setAdicionar(false))}>
          <div className="mtext">
            Estes são os carros que estão no estoque mas <b>não</b> aparecem para o cliente.
            Marque os que devem entrar na vitrine.
          </div>
          {foraDaVitrine.length ? (
            <div className="vit-lista escolha">
              {foraDaVitrine.map((c) => (
                <label className={`vit-item clic${escolhidos.has(c.id) ? ' on' : ''}`} key={c.id}>
                  <input type="checkbox" checked={escolhidos.has(c.id)} onChange={() => alternar(c.id)} />
                  <Miniatura carro={c} />
                  <div className="vit-info">
                    <div className="nm">{c.marca} {c.modelo} <span className="ano">{c.ano_fab}/{c.ano_mod}</span></div>
                    <div className="sb">{c.versao} · {c.cor} · {NUM(c.km)} km</div>
                    <div className="mono">{c.cod} · {c.status === 'vendido' ? 'vendido' : 'suspenso'}</div>
                  </div>
                  <div className="vit-preco">
                    <strong>{BRL(c.preco)}</strong>
                    <span>{c.fotos?.length ? `${c.fotos.length} foto${c.fotos.length > 1 ? 's' : ''}` : 'sem foto'}</span>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="empty">
              Todos os carros do estoque já estão na vitrine. Para cadastrar um novo, vá em <b>Estoque → + Adicionar veículo</b>.
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
