import { supabaseServer } from '@/lib/supabase/server'
import { getConfig } from '@/lib/loja'
import Simulador from '@/components/Simulador'
import type { Veiculo } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function Atendimento() {
  const sb = await supabaseServer()
  const cfg = await getConfig()
  const { data } = await sb
    .from('veiculos')
    .select('id, cod, marca, modelo, versao, ano_fab, ano_mod, km, cor, cambio, preco, custo, status')
    .eq('status', 'disponivel')
    .order('data_entrada', { ascending: false })

  return (
    <>
      <div className="page-head">
        <p>Simule um lead chegando pelo link do WhatsApp e veja como o atendimento automático responde, qualifica e agenda antes de te chamar.</p>
      </div>
      <div className="demo-note">
        <span>⚠️</span>
        <div>
          <b>Isto é uma simulação.</b> A ligação de verdade com o WhatsApp (Cloud API da Meta) ainda não foi feita —
          é o próximo passo depois das fotos. Use esta tela para acertar o roteiro das mensagens antes de colocar no ar.
        </div>
      </div>
      <Simulador carros={(data ?? []) as Veiculo[]} vendedor={cfg.vendedor} loja={cfg.nome} endereco={cfg.endereco} />
    </>
  )
}
