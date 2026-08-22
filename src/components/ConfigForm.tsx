'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { salvarConfig } from '@/actions/config'
import type { Config } from '@/lib/types'

export default function ConfigForm({ cfg }: { cfg: Config }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  const [msg, setMsg] = useState('')

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setMsg('')
    iniciar(async () => {
      const r = await salvarConfig(fd)
      setMsg(r?.erro ? `Não consegui salvar: ${r.erro}` : 'Salvo. A vitrine já está atualizada.')
      router.refresh()
    })
  }

  return (
    <form onSubmit={enviar}>
      <div className="grid g-2" style={{ gap: '0 12px' }}>
        <div className="field"><label>Nome da loja</label><input name="nome" defaultValue={cfg.nome} /></div>
        <div className="field"><label>Cidade</label><input name="cidade" defaultValue={cfg.cidade} /></div>
        <div className="field"><label>Seu nome (vendedor)</label><input name="vendedor" defaultValue={cfg.vendedor} /></div>
        <div className="field"><label>WhatsApp que aparece</label><input name="whatsapp_exibe" defaultValue={cfg.whatsapp_exibe} /></div>
      </div>
      <div className="field"><label>WhatsApp só números, com 55 na frente</label>
        <input name="whatsapp" defaultValue={cfg.whatsapp} placeholder="5567999990000" /></div>
      <div className="field"><label>Endereço da loja</label><input name="endereco" defaultValue={cfg.endereco} /></div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button className="btn" type="submit" disabled={pendente}>{pendente ? 'Salvando…' : 'Salvar'}</button>
        {msg && <span style={{ fontSize: 12, color: msg.startsWith('Não') ? 'var(--critical)' : 'var(--good-text)' }}>{msg}</span>}
      </div>
    </form>
  )
}
