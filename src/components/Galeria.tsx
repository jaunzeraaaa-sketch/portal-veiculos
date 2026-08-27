'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import CarroSvg from '@/components/CarroSvg'

/** Galeria da ficha do carro.
 *
 *  Duas coisas que a versão anterior não fazia:
 *   1. as miniaturas agora trocam a foto grande, e dá para passar com seta,
 *      teclado ou arrastando o dedo no celular;
 *   2. a foto aparece INTEIRA. Foto tirada em pé no celular era cortada no meio —
 *      aparecia o teto da loja e o carro ficava de fora. Agora ela é encaixada
 *      dentro da moldura e o vazio das laterais é preenchido com a própria foto
 *      desfocada, que é como os portais grandes resolvem.
 */
export default function Galeria({ fotos, alt }: { fotos: string[] | null; alt: string }) {
  const lista = fotos?.length ? fotos : []
  const [i, setI] = useState(0)
  const toque = useRef<number | null>(null)

  const ir = useCallback((passo: number) => {
    setI((n) => (n + passo + lista.length) % lista.length)
  }, [lista.length])

  useEffect(() => {
    if (lista.length < 2) return
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') ir(-1)
      if (e.key === 'ArrowRight') ir(1)
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [ir, lista.length])

  if (!lista.length) {
    return (
      <>
        <div className="st-gal-main vazia"><CarroSvg /></div>
        <div className="st-thumbs">
          {Array.from({ length: 6 }).map((_, n) => <div key={n} />)}
        </div>
      </>
    )
  }

  const atual = lista[i]

  return (
    <>
      <div className="st-gal-main"
        onTouchStart={(e) => { toque.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          if (toque.current === null) return
          const d = e.changedTouches[0].clientX - toque.current
          if (Math.abs(d) > 45) ir(d > 0 ? -1 : 1)
          toque.current = null
        }}>
        {/* fundo: a própria foto desfocada, para preencher as laterais */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={atual} alt="" aria-hidden="true" className="gal-fundo" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={atual} alt={alt} className="gal-foto" />

        {lista.length > 1 && (
          <>
            <button className="gal-seta esq" onClick={() => ir(-1)} aria-label="Foto anterior">
              <svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button className="gal-seta dir" onClick={() => ir(1)} aria-label="Próxima foto">
              <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" /></svg>
            </button>
            <span className="gal-conta">{i + 1} / {lista.length}</span>
          </>
        )}
      </div>

      <div className="st-thumbs">
        {lista.map((f, n) => (
          <button type="button" key={`${n}-${f}`} className={n === i ? 'on' : ''}
            onClick={() => setI(n)} aria-label={`Ver foto ${n + 1}`} aria-current={n === i}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f} alt="" />
          </button>
        ))}
      </div>
    </>
  )
}
