import { supabaseServer } from '@/lib/supabase/server'
import { BRL } from '@/lib/format'
import type { Veiculo, Venda } from '@/lib/types'
import VendasTabela from '@/components/VendasTabela'

export const dynamic = 'force-dynamic'

export default async function Vendas() {
  const sb = await supabaseServer()
  const [{ data: v }, { data: e }] = await Promise.all([
    sb.from('vendas_view').select('*').order('data_venda', { ascending: false }),
    sb.from('veiculos').select('id, cod, marca, modelo, versao, ano_fab, ano_mod, preco, custo, status').eq('status', 'disponivel'),
  ])
  const vendas = (v ?? []) as Venda[]
  const estoque = (e ?? []) as Veiculo[]

  const mes = new Date().getMonth(), ano = new Date().getFullYear()
  const doMes = vendas.filter((x) => { const d = new Date(x.data_venda + 'T00:00'); return d.getMonth() === mes && d.getFullYear() === ano })
  const lucroMes = doMes.reduce((a, x) => a + (x.lucro ?? 0), 0)
  const lucroTot = vendas.reduce((a, x) => a + (x.lucro ?? 0), 0)
  const ticket = vendas.length ? Math.round(vendas.reduce((a, x) => a + Number(x.valor_venda), 0) / vendas.length) : 0

  return (
    <>
      <div className="page-head">
        <p>Tudo que você já fechou, com o carro que saiu, o carro que entrou na troca e o lucro de cada operação. Passe o cursor sobre a linha para abrir a ficha completa.</p>
      </div>

      <div className="grid g-5" style={{ marginBottom: 16 }}>
        <div className="tile"><div className="label">Vendas neste mês</div><div className="value">{doMes.length}</div><div className="delta">fechadas por você</div></div>
        <div className="tile"><div className="label">Lucro do mês</div><div className="value" style={{ fontSize: 21 }}>{BRL(lucroMes)}</div><div className="delta up">venda menos custo e despesas</div></div>
        <div className="tile"><div className="label">Lucro acumulado</div><div className="value" style={{ fontSize: 21 }}>{BRL(lucroTot)}</div><div className="delta">todas as vendas registradas</div></div>
        <div className="tile"><div className="label">Ticket médio</div><div className="value" style={{ fontSize: 21 }}>{BRL(ticket)}</div><div className="delta">valor médio de venda</div></div>
        <div className="tile"><div className="label">Vendas com troca</div><div className="value">{vendas.filter((x) => x.troca_modelo).length}</div><div className="delta">carro que entrou no pátio</div></div>
      </div>

      <VendasTabela vendas={vendas} estoque={estoque} />
    </>
  )
}
