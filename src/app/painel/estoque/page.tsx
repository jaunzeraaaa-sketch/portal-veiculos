import { supabaseServer } from '@/lib/supabase/server'
import { BRL } from '@/lib/format'
import type { Veiculo } from '@/lib/types'
import EstoqueTabela from '@/components/EstoqueTabela'

export const dynamic = 'force-dynamic'

export default async function Estoque() {
  const sb = await supabaseServer()
  const { data } = await sb.from('veiculos_view').select('*').order('data_entrada', { ascending: false })
  const carros = (data ?? []) as Veiculo[]
  const disp = carros.filter((c) => c.status === 'disponivel')

  return (
    <>
      <div className="page-head">
        <p>Fonte única da verdade. Esta tabela alimenta a vitrine e os anúncios — carro marcado como vendido some do site na hora.</p>
      </div>

      <div className="grid g-5" style={{ marginBottom: 16 }}>
        <div className="tile"><div className="label">Carros em estoque</div><div className="value">{disp.length}</div><div className="delta">disponíveis para venda</div></div>
        <div className="tile"><div className="label">Capital parado</div><div className="value" style={{ fontSize: 21 }}>{BRL(disp.reduce((a, c) => a + Number(c.custo), 0))}</div><div className="delta">custo total do pátio</div></div>
        <div className="tile"><div className="label">Média de dias parado</div><div className="value">{disp.length ? Math.round(disp.reduce((a, c) => a + (c.dias_estoque ?? 0), 0) / disp.length) : 0}</div><div className="delta">meta: abaixo de 45</div></div>
        <div className="tile"><div className="label">Margem potencial</div><div className="value" style={{ fontSize: 21 }}>{BRL(disp.reduce((a, c) => a + (Number(c.preco) - Number(c.custo)), 0))}</div><div className="delta">preço de anúncio − custo</div></div>
        <div className="tile"><div className="label">Fora da faixa FIPE</div><div className="value">{disp.filter((c) => (c.delta_fipe ?? 0) > 3).length}</div><div className="delta down">mais de 3% acima</div></div>
      </div>

      <EstoqueTabela carros={carros} />
    </>
  )
}
