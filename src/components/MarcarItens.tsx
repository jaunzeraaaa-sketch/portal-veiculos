'use client'
import { useState } from 'react'
import { GRUPOS_OPCIONAIS, CONDICOES } from '@/lib/opcionais'

function Caixa({ nome, item, marcado }: { nome: string; item: string; marcado: boolean }) {
  return (
    <label className="opc">
      <input type="checkbox" name={nome} value={item} defaultChecked={marcado} />
      <span className="box" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg></span>
      <span className="txt">{item}</span>
    </label>
  )
}

/** "Informe os opcionais do seu veículo" — agrupado, com contador. */
export function Opcionais({ marcados = [] }: { marcados?: string[] | null }) {
  const jaTem = new Set(marcados ?? [])
  const [total, setTotal] = useState(jaTem.size)

  return (
    <fieldset className="marcar" onChange={(e) => {
      const form = (e.currentTarget as HTMLFieldSetElement)
      setTotal(form.querySelectorAll('input[name="opcionais"]:checked').length)
    }}>
      <legend>
        Informe os opcionais do seu veículo
        <span className="cont">{total} marcado{total === 1 ? '' : 's'}</span>
      </legend>
      <p className="ajuda">Isso vira a lista &ldquo;Itens do veículo&rdquo; na ficha que o cliente abre.</p>
      {GRUPOS_OPCIONAIS.map((g) => (
        <div className="grupo" key={g.grupo}>
          <h5>{g.grupo}</h5>
          <div className="opcs">
            {g.itens.map((i) => <Caixa key={i} nome="opcionais" item={i} marcado={jaTem.has(i)} />)}
          </div>
        </div>
      ))}
    </fieldset>
  )
}

/** "Informe as condições do veículo" — o que derruba objeção na conversa. */
export function Condicoes({ marcados = [] }: { marcados?: string[] | null }) {
  const jaTem = new Set(marcados ?? [])
  const [total, setTotal] = useState(jaTem.size)

  return (
    <fieldset className="marcar" onChange={(e) => {
      setTotal((e.currentTarget as HTMLFieldSetElement)
        .querySelectorAll('input[name="condicoes"]:checked').length)
    }}>
      <legend>
        Informe as condições do veículo
        <span className="cont">{total} marcada{total === 1 ? '' : 's'}</span>
      </legend>
      <p className="ajuda">São os selos de confiança da ficha. Marque só o que você consegue provar.</p>
      <div className="opcs">
        {CONDICOES.map((i) => <Caixa key={i} nome="condicoes" item={i} marcado={jaTem.has(i)} />)}
      </div>
    </fieldset>
  )
}
