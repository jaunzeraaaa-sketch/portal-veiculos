import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase/server'
import { BRL, dataBR, hojeISO, pct, situacao } from '@/lib/format'
import type { Tarefa, Veiculo, Venda } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function Painel() {
  const sb = await supabaseServer()
  const hoje = hojeISO()

  const [{ data: veic }, { data: tar }, { data: vend }, { data: leads }] = await Promise.all([
    sb.from('veiculos_view').select('*'),
    sb.from('tarefas').select('*').eq('data', hoje).order('hora'),
    sb.from('vendas_view').select('*'),
    sb.from('leads').select('estagio, proxima_acao_data'),
  ])

  const carros = (veic ?? []) as Veiculo[]
  const tarefas = (tar ?? []) as Tarefa[]
  const vendas = (vend ?? []) as Venda[]
  const disponiveis = carros.filter((c) => c.status === 'disponivel')

  const mes = new Date().getMonth(), ano = new Date().getFullYear()
  const doMes = vendas.filter((v) => {
    const d = new Date(v.data_venda + 'T00:00')
    return d.getMonth() === mes && d.getFullYear() === ano
  })
  const lucroMes = doMes.reduce((a, v) => a + (v.lucro ?? 0), 0)

  const alertas = disponiveis
    .map((c) => ({ c, s: situacao(c) }))
    .filter((x) => x.s.prio > 0)
    .sort((a, b) => b.s.prio - a.s.prio)

  type LeadResumo = { estagio: string; proxima_acao_data: string | null }
  const ativos = ((leads ?? []) as LeadResumo[]).filter((l) => l.estagio !== 'Fechado' && l.estagio !== 'Perdido')
  const vencidos = ativos.filter((l) => l.proxima_acao_data && l.proxima_acao_data < hoje)
  const agora = new Date()
  const pendentesHoje = tarefas.filter((t) => !t.feito).length

  return (
    <>
      <div className="page-head">
        <p>O que você tem para fazer hoje, o que está travando o estoque e como o mês está indo.</p>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-head">
          <h2>Atividades de hoje</h2>
          <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
            <b style={{ color: 'var(--brand)' }}>{pendentesHoje}</b> pendentes
          </span>
        </div>
        <div className="sub">Na ordem do relógio. O sino no topo avisa quando chega a hora.</div>
        <div className="today-list">
          {tarefas.length ? tarefas.map((t) => {
            const passou = new Date(`${t.data}T${t.hora}`) <= agora
            const cls = t.feito ? 'done' : passou ? 'past' : ''
            return (
              <div className={`today-row ${cls}`} key={t.id}>
                <span className="hr">{t.hora.slice(0, 5)}</span>
                <span className="bar" />
                <div>
                  <div className="tt2">{t.titulo}</div>
                  {t.descricao && <div className="dd">{t.descricao}</div>}
                </div>
                <span className="st2">
                  {t.feito
                    ? <span className="chip good"><span className="dot" />feita</span>
                    : passou
                      ? <span className="chip critical"><span className="dot" />passou da hora</span>
                      : <span className="chip neutral"><span className="dot" />agendada</span>}
                </span>
              </div>
            )
          }) : (
            <div className="empty">
              Nenhuma atividade marcada para hoje. <Link href="/painel/tarefas">Abrir o calendário</Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid g-5" style={{ marginBottom: 14 }}>
        <div className="tile">
          <div className="label">Carros disponíveis</div>
          <div className="value">{disponiveis.length}</div>
          <div className="delta">na vitrine agora</div>
        </div>
        <div className="tile">
          <div className="label">Vendas no mês</div>
          <div className="value">{doMes.length}</div>
          <div className="delta">fechadas por você</div>
        </div>
        <div className="tile">
          <div className="label">Lucro do mês</div>
          <div className="value" style={{ fontSize: 21 }}>{BRL(lucroMes)}</div>
          <div className="delta up">venda menos custo e despesas</div>
        </div>
        <div className="tile">
          <div className="label">Leads ativos</div>
          <div className="value">{ativos.length}</div>
          <div className="delta">{vencidos.length > 0
            ? <span style={{ color: 'var(--critical)', fontWeight: 550 }}>{vencidos.length} com ação vencida</span>
            : 'nenhuma ação vencida'}</div>
        </div>
        <div className="tile">
          <div className="label">Carros com +45 dias</div>
          <div className="value" style={{ color: alertas.length ? 'var(--critical)' : undefined }}>
            {disponiveis.filter((c) => (c.dias_estoque ?? 0) > 45).length}
          </div>
          <div className="delta">precisam de decisão</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h2>Alertas de estoque</h2></div>
        <div className="sub">Mais de 45 dias parado ou preço acima de 3% da FIPE entra aqui automaticamente.</div>
        {alertas.length ? (
          <div className="tbl-wrap" style={{ boxShadow: 'none', border: 0 }}>
            <table className="data" style={{ minWidth: 660 }}>
              <thead>
                <tr>
                  <th>Veículo</th><th className="num">Dias</th><th className="num">Anúncio</th>
                  <th className="num">FIPE</th><th className="num">Δ</th><th>Alerta</th><th>Ação sugerida</th>
                </tr>
              </thead>
              <tbody>
                {alertas.map(({ c, s }) => (
                  <tr key={c.id}>
                    <td>
                      <div className="car-name">{c.marca} {c.modelo}</div>
                      <div className="car-sub">{c.versao} · {c.ano_fab}/{c.ano_mod}</div>
                    </td>
                    <td className="num">{c.dias_estoque}</td>
                    <td className="num">{BRL(c.preco)}</td>
                    <td className="num" style={{ color: 'var(--text-2)' }}>{BRL(c.fipe)}</td>
                    <td className="num" style={{ color: (c.delta_fipe ?? 0) > 0 ? 'var(--critical)' : 'var(--good-text)' }}>
                      {pct(c.delta_fipe)}
                    </td>
                    <td><span className={`chip ${s.cls}`}><span className="dot" />{s.txt}</span></td>
                    <td style={{ color: 'var(--text-2)' }}>
                      {(c.delta_fipe ?? 0) > 3 ? 'Baixar para a faixa da FIPE'
                        : (c.dias_estoque ?? 0) > 60 ? 'Repasse ou leilão'
                        : 'Reforçar anúncio e reativar base'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty">Nenhum alerta. Estoque girando dentro da meta.</div>}
      </div>

      {vendas.length > 0 && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="card-head">
            <h2>Últimas vendas</h2>
            <Link href="/painel/vendas" className="toggle-table">Ver todas</Link>
          </div>
          <div className="sub">As três mais recentes.</div>
          {vendas.slice(0, 3).map((v) => (
            <div className="kv" key={v.id}>
              <span>{dataBR(v.data_venda)} · {v.cliente} · {v.veiculo_desc}</span>
              <strong style={{ color: 'var(--good-text)' }}>{BRL(v.lucro)}</strong>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
