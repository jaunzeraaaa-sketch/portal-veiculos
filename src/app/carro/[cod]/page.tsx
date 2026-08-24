import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { supabaseServer, supabaseConfigurado } from '@/lib/supabase/server'
import { getConfig } from '@/lib/loja'
import { BRL, NUM, linkWhats } from '@/lib/format'
import type { Veiculo } from '@/lib/types'
import CarroSvg from '@/components/CarroSvg'
import TopoVitrine, { IconeWhats } from '@/components/TopoVitrine'
import { Rodape } from '@/app/page'

export const revalidate = 60

const ITENS_PADRAO = [
  'Ar-condicionado', 'Direção elétrica', 'Vidros elétricos', 'Trava elétrica',
  'Airbag duplo', 'Freios ABS', 'Central multimídia', 'Câmera de ré',
  'Sensor de estacionamento', 'Rodas de liga leve', 'Computador de bordo', 'Chave reserva',
]

async function buscar(cod: string) {
  if (!supabaseConfigurado()) return null
  try {
    const sb = await supabaseServer()
    const { data } = await sb
      .from('veiculos_view')
      .select('*')
      .ilike('cod', cod)
      .eq('status', 'disponivel')
      .maybeSingle()
    return data as Veiculo | null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ cod: string }> }): Promise<Metadata> {
  const { cod } = await params
  const c = await buscar(cod)
  if (!c) return { title: 'Veículo não encontrado' }
  const titulo = `${c.marca} ${c.modelo} ${c.versao} ${c.ano_fab}/${c.ano_mod}`
  return {
    title: `${titulo} — ${BRL(c.preco)}`,
    description: `${NUM(c.km)} km, ${c.cor}, câmbio ${c.cambio.toLowerCase()}. Laudo cautelar aprovado. Aceitamos seu usado na troca.`,
    openGraph: { title: titulo, images: c.fotos?.[0] ? [c.fotos[0]] : [] },
  }
}

export default async function Ficha({ params }: { params: Promise<{ cod: string }> }) {
  const { cod } = await params
  const c = await buscar(cod)
  if (!c) notFound()

  const cfg = await getConfig()
  const iniciais = cfg.vendedor.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  const itens = c.opcionais?.length ? c.opcionais : ITENS_PADRAO
  const zap = linkWhats(cfg.whatsapp, c.cod)

  return (
    <div className="site">
      <TopoVitrine nome={cfg.nome} cidade={cfg.cidade} telefone={cfg.whatsapp_exibe} zap={zap} linha />

      <main className="st-body">
        <Link href="/" className="st-back">← Voltar para o estoque</Link>

        <div className="st-detail">
          <div>
            <div className="st-gal-main">
              {c.fotos?.[0]
                ? <img src={c.fotos[0]} alt={`${c.marca} ${c.modelo}`} className="st-foto-real" />
                : <CarroSvg />}
            </div>
            <div className="st-thumbs">
              {(c.fotos?.length ? c.fotos.slice(0, 6) : Array.from({ length: 6 })).map((f, i) => (
                <div key={i} className={i === 0 ? 'on' : ''}>
                  {typeof f === 'string' && <img src={f} alt="" className="st-foto-real" />}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2>{c.marca} {c.modelo}</h2>
            <div className="ver">{c.versao} · {c.ano_fab}/{c.ano_mod}</div>
            <div className="st-price">{BRL(c.preco)}</div>
            <div className="st-price-sub">Aceitamos seu usado na troca</div>

            <div className="st-specs">
              <div><div className="k">Quilometragem</div><div className="v">{NUM(c.km)} km</div></div>
              <div><div className="k">Ano</div><div className="v">{c.ano_fab}/{c.ano_mod}</div></div>
              <div><div className="k">Cor</div><div className="v">{c.cor}</div></div>
              <div><div className="k">Câmbio</div><div className="v">{c.cambio}</div></div>
            </div>

            <div className="st-seller-box">
              <span className="av">{iniciais}</span>
              <div>
                <div className="k">Seu vendedor</div>
                <div className="n">{cfg.vendedor}</div>
                <div className="s">{cfg.nome} · respondo em minutos</div>
              </div>
            </div>

            <div className="st-selo">
              {(c.condicoes?.length
                ? c.condicoes
                : ['Laudo cautelar', 'Garantia 3 meses', 'Revisões em dia']
              ).map((s) => <span key={s}>{s}</span>)}
            </div>

            <a className="st-cta-big" href={zap} target="_blank" rel="noopener noreferrer">
              <IconeWhats />
              Tenho interesse — falar no WhatsApp
            </a>
            <a className="st-cta-2" href={zap} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Agendar test-drive
            </a>
          </div>
        </div>

        <div className="st-about wide">
          <h4>Sobre este veículo</h4>
          <p>
            {c.descricao ?? `${c.marca} ${c.modelo} ${c.versao} ${c.ano_fab}/${c.ano_mod}, ${c.cor.toLowerCase()}, com ${NUM(c.km)} km rodados e câmbio ${c.cambio.toLowerCase()}. Revisões em dia e laudo cautelar aprovado — o documento fica disponível para você conferir antes de fechar.`}
          </p>
          <h4 style={{ marginTop: 20 }}>Itens do veículo</h4>
          <div className="st-eq">{itens.map((i) => <span key={i}>{i}</span>)}</div>
        </div>
      </main>

      <Rodape cfg={cfg} />
    </div>
  )
}
