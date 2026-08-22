import { supabaseServer } from '@/lib/supabase/server'
import { getConfig } from '@/lib/loja'
import GeradorAnuncio from '@/components/GeradorAnuncio'
import type { Veiculo } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function Publicar() {
  const sb = await supabaseServer()
  const cfg = await getConfig()
  const { data } = await sb
    .from('veiculos')
    .select('id, cod, marca, modelo, versao, ano_fab, ano_mod, km, cor, cambio, combustivel, preco, descricao, status')
    .eq('status', 'disponivel')
    .order('data_entrada', { ascending: false })

  return (
    <>
      <div className="page-head">
        <p>Escolha um carro do estoque e receba o anúncio pronto no formato de cada canal, já dentro do limite de caracteres. Copie e cole.</p>
      </div>
      <GeradorAnuncio carros={(data ?? []) as Veiculo[]} whatsapp={cfg.whatsapp} />
    </>
  )
}
