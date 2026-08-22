'use client'
import { useRouter, useSearchParams } from 'next/navigation'

type Props = {
  marcas: string[]
  atual: { marca?: string; faixa?: string; ordem?: string }
  encontrados: number
  filtrando: boolean
}

export default function Filtros({ marcas, atual, encontrados, filtrando }: Props) {
  const router = useRouter()
  const params = useSearchParams()

  function muda(campo: string, valor: string) {
    const p = new URLSearchParams(params.toString())
    if (valor === 'todas') p.delete(campo)
    else p.set(campo, valor)
    router.push(`/?${p.toString()}`, { scroll: false })
  }

  return (
    <div className="st-filters">
      <div className="st-fcell">
        <label htmlFor="fMarca">Marca</label>
        <select id="fMarca" value={atual.marca ?? 'todas'} onChange={(e) => muda('marca', e.target.value)}>
          <option value="todas">Todas as marcas</option>
          {marcas.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div className="st-fcell">
        <label htmlFor="fFaixa">Faixa de preço</label>
        <select id="fFaixa" value={atual.faixa ?? 'todas'} onChange={(e) => muda('faixa', e.target.value)}>
          <option value="todas">Qualquer preço</option>
          <option value="0-70000">Até R$ 70 mil</option>
          <option value="70000-100000">R$ 70 a 100 mil</option>
          <option value="100000-150000">R$ 100 a 150 mil</option>
          <option value="150000-9999999">Acima de R$ 150 mil</option>
        </select>
      </div>
      <div className="st-fcell">
        <label htmlFor="fOrdem">Ordenar por</label>
        <select id="fOrdem" value={atual.ordem ?? 'recentes'} onChange={(e) => muda('ordem', e.target.value)}>
          <option value="recentes">Chegaram por último</option>
          <option value="menor">Menor preço</option>
          <option value="maior">Maior preço</option>
          <option value="km">Menor quilometragem</option>
        </select>
      </div>
      <div className="st-fcell result">
        <span className="c"><b>{encontrados}</b> {encontrados === 1 ? 'carro encontrado' : 'carros encontrados'}</span>
        {filtrando && <button className="st-clear" onClick={() => router.push('/', { scroll: false })}>Limpar filtros</button>}
      </div>
    </div>
  )
}
