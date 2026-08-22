import Link from 'next/link'
import Image from 'next/image'
import { supabaseServer, supabaseConfigurado } from '@/lib/supabase/server'
import { getConfig } from '@/lib/loja'
import { BRL, NUM, linkWhats } from '@/lib/format'
import type { Veiculo } from '@/lib/types'
import CarroSvg from '@/components/CarroSvg'
import Filtros from '@/components/Filtros'
import AvisoSetup from '@/components/AvisoSetup'

export const revalidate = 60

type Busca = { marca?: string; faixa?: string; ordem?: string }

export default async function Vitrine({ searchParams }: { searchParams: Promise<Busca> }) {
  const q = await searchParams
  const cfg = await getConfig()
  const pronto = supabaseConfigurado()

  let carros: Veiculo[] = []
  if (pronto) {
    try {
      const sb = await supabaseServer()
      const { data, error } = await sb.from('veiculos_view').select('*').eq('status', 'disponivel')
      if (error) {
        console.error('\n[vitrine] O banco recusou a consulta:', error.message,
          '\n           Rode  node diagnostico.mjs  para ver o motivo.\n')
      }
      carros = (data ?? []) as Veiculo[]
    } catch (e) {
      console.error('\n[vitrine] Não consegui falar com o banco:', (e as Error).message,
        '\n           Rode  node diagnostico.mjs  para ver o motivo.\n')
    }
  }
  const marcas = [...new Set(carros.map((c) => c.marca))].sort()
  const menor = carros.length ? Math.min(...carros.map((c) => c.preco)) : 0
  const total = carros.length

  if (q.marca && q.marca !== 'todas') carros = carros.filter((c) => c.marca === q.marca)
  if (q.faixa && q.faixa !== 'todas') {
    const [lo, hi] = q.faixa.split('-').map(Number)
    carros = carros.filter((c) => c.preco >= lo && c.preco < hi)
  }
  const ordens: Record<string, (a: Veiculo, b: Veiculo) => number> = {
    recentes: (a, b) => (a.dias_estoque ?? 0) - (b.dias_estoque ?? 0),
    menor: (a, b) => a.preco - b.preco,
    maior: (a, b) => b.preco - a.preco,
    km: (a, b) => a.km - b.km,
  }
  carros.sort(ordens[q.ordem ?? 'recentes'] ?? ordens.recentes)

  const filtrando = (q.marca && q.marca !== 'todas') || (q.faixa && q.faixa !== 'todas')
  const iniciais = cfg.vendedor.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()

  return (
    <div className="site">
      <header className="st-head">
        <Link href="/" className="st-logo">
          <Image src="/logo-escura.png" alt={cfg.nome} width={420} height={167} className="st-logo-img" priority />
          <span className="st-city">{cfg.cidade}</span>
        </Link>
        <div className="st-cta">
          <span className="st-fone">{cfg.whatsapp_exibe}</span>
          <a className="st-wa" href={`https://wa.me/${cfg.whatsapp}`} target="_blank" rel="noopener noreferrer">
            Falar no WhatsApp
          </a>
        </div>
      </header>

      <section className="st-hero">
        <div className="st-hero-in">
          <div>
            <div className="st-seller">
              <span className="av">{iniciais}</span>
              <span>Atendimento direto com <b>{cfg.vendedor}</b></span>
            </div>
            <h1>O estoque da {cfg.nome},<br />no seu WhatsApp</h1>
            <p>Escolha o carro aqui e me chame. Eu separo, deixo pronto e te espero com o laudo na mão.</p>
          </div>
          <div className="st-facts">
            <div><div className="n">{total}</div><div className="l">carros no pátio hoje</div></div>
            <div><div className="n">{BRL(menor)}</div><div className="l">a partir de</div></div>
            <div><div className="n">100%</div><div className="l">com laudo cautelar</div></div>
          </div>
        </div>
      </section>

      <main className="st-body">
        <Filtros marcas={marcas} atual={q} encontrados={carros.length} filtrando={!!filtrando} />

        <div className="st-sect">
          <h2>{filtrando ? 'Resultado da busca' : 'Disponíveis agora'}</h2>
          <span className="hint">Clique no carro para ver as fotos e a ficha completa</span>
        </div>

        {!pronto ? <AvisoSetup onde="vitrine" /> : carros.length ? (
          <div className="st-grid">
            {carros.map((c) => (
              <Link key={c.id} href={`/carro/${c.cod.toLowerCase()}`} className="st-card">
                <div className="st-photo">
                  {(c.dias_estoque ?? 99) <= 10
                    ? <span className="tag new">Chegou agora</span>
                    : <span className="tag">{c.cor}</span>}
                  {c.fotos?.[0]
                    ? <img src={c.fotos[0]} alt={`${c.marca} ${c.modelo}`} className="st-foto-real" />
                    : <CarroSvg />}
                </div>
                <div className="st-card-b">
                  <h3>{c.marca} {c.modelo}</h3>
                  <div className="v">{c.versao}</div>
                  <div className="st-price-row">
                    <span className="pr">{BRL(c.preco)}</span>
                    <span className="pl">aceita troca</span>
                  </div>
                </div>
                <div className="st-spec">
                  <div><div className="k">Ano</div><div className="v2">{c.ano_mod}</div></div>
                  <div><div className="k">KM</div><div className="v2">{NUM(c.km)}</div></div>
                  <div><div className="k">Câmbio</div><div className="v2">{c.cambio === 'Automático' ? 'Auto.' : 'Manual'}</div></div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="st-empty">
            <b>Nenhum carro nesse filtro</b>
            <a href={linkWhats(cfg.whatsapp, 'um carro assim')} target="_blank" rel="noopener noreferrer">
              Me chame no WhatsApp que eu procuro um para você.
            </a>
          </div>
        )}
      </main>

      <Rodape cfg={cfg} />
    </div>
  )
}

export function Rodape({ cfg }: { cfg: Awaited<ReturnType<typeof getConfig>> }) {
  return (
    <footer className="st-foot">
      <div className="st-foot-grid">
        <div><b>{cfg.nome}</b><p>{cfg.endereco}<br />Estoque completo da loja</p></div>
        <div><b>Atendimento</b><p>Segunda a sexta, 8h às 18h<br />Sábado, 8h às 13h</p></div>
        <div><b>Falar com {cfg.vendedor}</b><p>{cfg.whatsapp_exibe}<br />Vendedor responsável</p></div>
        <div><b>Todo carro daqui tem</b><p>Laudo cautelar aprovado<br />Garantia de motor e câmbio<br />Transferência inclusa</p></div>
      </div>
      <div className="st-foot-bar">
        <span>© {new Date().getFullYear()} {cfg.nome} · {cfg.cidade}</span>
        <span>Preços e disponibilidade sujeitos a alteração sem aviso.</span>
      </div>
    </footer>
  )
}
