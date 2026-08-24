export const BRL = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export const BRL2 = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

export const NUM = (n: number | null | undefined) => (n ?? 0).toLocaleString('pt-BR')

export const pct = (n: number | null | undefined) =>
  n == null ? '—' : `${n > 0 ? '+' : ''}${n.toFixed(1).replace('.', ',')}%`

export const dataBR = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')

export const hhmm = (t: string) => t.slice(0, 5)

export const hojeISO = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const slug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Situação do veículo, igual à regra do painel. */
export function situacao(v: { dias_estoque?: number; delta_fipe?: number | null; status: string }) {
  if (v.status === 'vendido') return { cls: 'neutral', txt: 'Vendido', prio: 0 }
  if (v.status === 'suspenso') return { cls: 'neutral', txt: 'Fora da vitrine', prio: 0 }
  if (v.status === 'reservado') return { cls: 'warn', txt: 'Reservado', prio: 0 }
  const dias = v.dias_estoque ?? 0
  const d = v.delta_fipe ?? 0
  if (dias > 60) return { cls: 'critical', txt: `${dias} dias parado`, prio: 3 }
  if (d > 3) return { cls: 'serious', txt: `${d.toFixed(1).replace('.', ',')}% acima da FIPE`, prio: 2 }
  if (dias > 45) return { cls: 'warn', txt: `${dias} dias parado`, prio: 1 }
  return { cls: 'good', txt: 'Giro normal', prio: 0 }
}

export function linkWhats(numero: string, cod: string) {
  const txt = encodeURIComponent(`Olá! Tenho interesse no ${cod}`)
  return `https://wa.me/${numero}?text=${txt}`
}
