'use client'
import { useRef, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { MAX_FOTOS } from '@/lib/types'

type Foto = { url: string; caminho: string | null }

const MAX = MAX_FOTOS
const LADO = 1600      // maior lado da imagem salva
const QUALIDADE = 0.82 // JPEG

const IC = {
  camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>,
  galeria: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
  estrela: <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L7 14.2l-5-4.9 6.9-1z" />,
  x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
}

/** Reduz a foto no próprio navegador antes de subir: 4 MB do celular viram ~250 KB. */
async function comprimir(arquivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo, { imageOrientation: 'from-image' })
  const escala = Math.min(1, LADO / Math.max(bitmap.width, bitmap.height))
  const l = Math.round(bitmap.width * escala)
  const a = Math.round(bitmap.height * escala)
  const tela = document.createElement('canvas')
  tela.width = l; tela.height = a
  const ctx = tela.getContext('2d')
  if (!ctx) throw new Error('Não consegui preparar a imagem neste navegador.')
  ctx.drawImage(bitmap, 0, 0, l, a)
  bitmap.close?.()
  const blob = await new Promise<Blob | null>((r) => tela.toBlob(r, 'image/jpeg', QUALIDADE))
  if (!blob) throw new Error('Não consegui converter a imagem.')
  return blob
}

export default function FotosUpload({ iniciais = [] }: { iniciais?: string[] | null }) {
  const [fotos, setFotos] = useState<Foto[]>((iniciais ?? []).map((url) => ({ url, caminho: null })))
  const [subindo, setSubindo] = useState(0)
  const [erro, setErro] = useState('')
  const camera = useRef<HTMLInputElement>(null)
  const galeria = useRef<HTMLInputElement>(null)

  async function receber(lista: FileList | null) {
    if (!lista?.length) return
    setErro('')
    const arquivos = Array.from(lista).filter((f) => f.type.startsWith('image/'))
    const cabem = arquivos.slice(0, Math.max(0, MAX - fotos.length))
    if (arquivos.length > cabem.length) setErro(`Cabem ${MAX} fotos por veículo. As demais foram ignoradas.`)
    if (!cabem.length) return

    setSubindo(cabem.length)
    const sb = supabaseBrowser()

    for (const arquivo of cabem) {
      try {
        const blob = await comprimir(arquivo)
        const caminho = `veiculos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
        const { error } = await sb.storage.from('fotos').upload(caminho, blob, {
          contentType: 'image/jpeg', cacheControl: '31536000', upsert: false,
        })
        if (error) throw error
        const { data } = sb.storage.from('fotos').getPublicUrl(caminho)
        setFotos((f) => [...f, { url: data.publicUrl, caminho }])
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        setErro(msg.toLowerCase().includes('bucket')
          ? 'O balde "fotos" não existe no Supabase. Storage → New bucket → nome fotos → marque Public.'
          : `Não consegui subir ${arquivo.name}: ${msg}`)
      } finally {
        setSubindo((n) => Math.max(0, n - 1))
      }
    }
    if (camera.current) camera.current.value = ''
    if (galeria.current) galeria.current.value = ''
  }

  async function remover(i: number) {
    const alvo = fotos[i]
    setFotos((f) => f.filter((_, n) => n !== i))
    if (alvo.caminho) {
      try { await supabaseBrowser().storage.from('fotos').remove([alvo.caminho]) } catch { /* some da lista de qualquer jeito */ }
    }
  }

  function capa(i: number) {
    setFotos((f) => [f[i], ...f.filter((_, n) => n !== i)])
  }

  return (
    <div className="field">
      <label>Fotos do veículo</label>

      {/* é assim que o valor chega no formulário */}
      <input type="hidden" name="fotos" value={JSON.stringify(fotos.map((f) => f.url))} />

      <input ref={camera} type="file" accept="image/*" capture="environment" hidden
        onChange={(e) => receber(e.target.files)} />
      <input ref={galeria} type="file" accept="image/*" multiple hidden
        onChange={(e) => receber(e.target.files)} />

      <div className="foto-btns">
        <button type="button" className="btn ghost" onClick={() => camera.current?.click()}>
          <svg viewBox="0 0 24 24">{IC.camera}</svg> Tirar foto
        </button>
        <button type="button" className="btn ghost" onClick={() => galeria.current?.click()}>
          <svg viewBox="0 0 24 24">{IC.galeria}</svg> Escolher da galeria
        </button>
        <span className="foto-cont">
          {subindo > 0 ? `enviando ${subindo}…` : `${fotos.length} de ${MAX}`}
        </span>
      </div>

      {erro && <div className="foto-erro">{erro}</div>}

      {fotos.length > 0 && (
        <div className="foto-dica">
          Foto deitada (celular na horizontal) rende um anúncio maior. As em pé aparecem inteiras,
          com as laterais preenchidas — nenhum carro é cortado.
        </div>
      )}

      {fotos.length > 0 ? (
        <div className="foto-grid">
          {fotos.map((f, i) => (
            <div className={`foto-item${i === 0 ? ' capa' : ''}`} key={f.url}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={`Foto ${i + 1}`} />
              {i === 0 && <span className="foto-tag">capa</span>}
              <div className="foto-acts">
                {i !== 0 && (
                  <button type="button" title="Usar como capa" onClick={() => capa(i)}>
                    <svg viewBox="0 0 24 24">{IC.estrela}</svg>
                  </button>
                )}
                <button type="button" className="danger" title="Remover foto" onClick={() => remover(i)}>
                  <svg viewBox="0 0 24 24">{IC.x}</svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="foto-vazio">
          No celular, <b>Tirar foto</b> abre a câmera direto. No computador, os dois botões abrem os arquivos.
          A primeira foto vira a capa do anúncio.
          <br /><b>Dica:</b> vire o celular na horizontal para fotografar. Foto deitada preenche o
          anúncio inteiro; foto em pé aparece completa, mas menor.
        </div>
      )}
    </div>
  )
}
