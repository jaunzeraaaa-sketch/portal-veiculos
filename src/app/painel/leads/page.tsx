import { supabaseServer } from '@/lib/supabase/server'
import { getConfig } from '@/lib/loja'
import { hojeISO } from '@/lib/format'
import Kanban from '@/components/Kanban'
import Alertas from '@/components/Alertas'
import type { Alerta, Interesse, Veiculo } from '@/lib/types'

export const dynamic = 'force-dynamic'

export type LeadCompleto = {
  id: string
  nome: string
  telefone: string | null
  cidade: string | null
  origem: string
  estagio: string
  proxima_acao: string | null
  proxima_acao_data: string | null
  motivo_perda: string | null
  observacoes: string | null
  veiculo_id: string | null
  veiculos: { cod: string; marca: string; modelo: string; ano_mod: number; preco: number } | null
}

export default async function Leads() {
  const sb = await supabaseServer()
  const cfg = await getConfig()
  const [{ data: l }, { data: v }, { data: i }, { data: a }] = await Promise.all([
    sb.from('leads').select('*, veiculos(cod, marca, modelo, ano_mod, preco)').order('criado_em', { ascending: false }),
    sb.from('veiculos').select('id, cod, marca, modelo, versao, ano_mod, preco').eq('status', 'disponivel'),
    sb.from('interesses').select('*').order('criado_em', { ascending: false }),
    sb.from('alertas_view').select('*').order('criado_em', { ascending: false }),
  ])
  const leads = (l ?? []) as unknown as LeadCompleto[]
  const estoque = (v ?? []) as Veiculo[]
  const interesses = (i ?? []) as Interesse[]
  const alertas = (a ?? []) as Alerta[]
  const hoje = hojeISO()

  const ativos = leads.filter((x) => x.estagio !== 'Fechado' && x.estagio !== 'Perdido')
  const vencidos = ativos.filter((x) => x.proxima_acao_data && x.proxima_acao_data < hoje)
  const semAcao = ativos.filter((x) => !x.proxima_acao_data)
  const visitas = leads.filter((x) => x.estagio === 'Visita agendada')
  const perdas = leads.filter((x) => x.estagio === 'Perdido' && x.motivo_perda)
  const contagem = new Map<string, number>()
  perdas.forEach((p) => contagem.set(p.motivo_perda!, (contagem.get(p.motivo_perda!) ?? 0) + 1))
  const topMotivo = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0]
  const procurando = interesses.filter((x) => x.status === 'Aguardando disponibilidade').length
  const novosAlertas = alertas.filter((x) => x.status === 'Novo').length

  return (
    <>
      <div className="page-head">
        <p>Uma regra inegociável: todo lead que não está em Fechado ou Perdido precisa ter uma próxima ação com data. A borda vermelha é ação vencida.</p>
      </div>

      <div className="grid" style={{ marginBottom: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(132px,1fr))' }}>
        <div className="tile">
          <div className="label">Leads ativos</div>
          <div className="value">{ativos.length}</div>
          <div className="delta">no funil agora</div>
        </div>
        <div className="tile">
          <div className="label">Ações vencidas</div>
          <div className="value" style={{ color: vencidos.length ? 'var(--critical)' : undefined }}>{vencidos.length}</div>
          <div className="delta down">precisa de contato hoje</div>
        </div>
        <div className="tile">
          <div className="label">Visitas agendadas</div>
          <div className="value">{visitas.length}</div>
          <div className="delta">esperando o cliente</div>
        </div>
        <div className="tile">
          <div className="label">Sem próxima ação</div>
          <div className="value" style={{ color: semAcao.length ? 'var(--critical)' : 'var(--good-text)' }}>{semAcao.length}</div>
          <div className={semAcao.length ? 'delta down' : 'delta up'}>{semAcao.length ? 'vão morrer assim' : '✓ regra cumprida'}</div>
        </div>
        <div className="tile">
          <div className="label">Procurando carro</div>
          <div className="value">{procurando}</div>
          <div className="delta">pedidos que você ainda não tem</div>
        </div>
        <div className="tile">
          <div className="label">Alertas novos</div>
          <div className="value" style={{ color: novosAlertas ? 'var(--critical)' : 'var(--good-text)' }}>{novosAlertas}</div>
          <div className={novosAlertas ? 'delta down' : 'delta up'}>{novosAlertas ? 'carro chegou para alguém' : 'nenhum pendente'}</div>
        </div>
        <div className="tile">
          <div className="label">Motivo nº 1 de perda</div>
          <div className="value" style={{ fontSize: 15, lineHeight: 1.3, paddingTop: 4 }}>
            {topMotivo ? topMotivo[0] : '—'}
          </div>
          <div className="delta">{topMotivo ? `${topMotivo[1]} de ${perdas.length} perdas` : 'anote o motivo ao perder'}</div>
        </div>
      </div>

      <Kanban leads={leads} estoque={estoque} interesses={interesses} hoje={hoje} />
      <Alertas alertas={alertas} whatsapp={cfg.whatsapp} />
    </>
  )
}
