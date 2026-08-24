'use server'
import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase/server'
import { traduzErro } from '@/lib/erros'
import { combina } from '@/lib/casar'
import { STATUS_ALERTA } from '@/lib/types'

type Carro = {
  id: string; marca: string; modelo: string; versao: string | null
  ano_fab: number; ano_mod: number; preco: number
}

function recarregar() {
  revalidatePath('/painel/leads')
  revalidatePath('/painel')
  revalidatePath('/painel/estoque')
}

/** Um carro entrou no pátio: existe algum cliente procurando exatamente ele?
 *  Chamado depois de cadastrar veículo. Nunca derruba o cadastro se falhar. */
export async function casarVeiculoComInteresses(carro: Carro) {
  try {
    const sb = await supabaseServer()
    const { data: interesses } = await sb
      .from('interesses')
      .select('id, lead_id, marca, modelo, versao, ano, ano_ate, preco_ate')
      .eq('status', 'Aguardando disponibilidade')

    const achados = (interesses ?? []).filter((i) => combina(i, carro))
    if (!achados.length) return { novos: 0 }

    // o índice único (interesse_id, veiculo_id) garante que nada se repete
    const { error } = await sb.from('alertas').upsert(
      achados.map((i) => ({ interesse_id: i.id, lead_id: i.lead_id, veiculo_id: carro.id })),
      { onConflict: 'interesse_id,veiculo_id', ignoreDuplicates: true }
    )
    if (error) return { novos: 0, erro: traduzErro(error.message) }
    recarregar()
    return { novos: achados.length }
  } catch (e) {
    return { novos: 0, erro: e instanceof Error ? e.message : 'falha ao procurar interessados' }
  }
}

/** Caminho inverso: acabei de anotar um interesse — o carro já não está no pátio? */
export async function casarInteresseComEstoque(interesseId: string) {
  try {
    const sb = await supabaseServer()
    const { data: i } = await sb
      .from('interesses')
      .select('id, lead_id, marca, modelo, versao, ano, ano_ate, preco_ate')
      .eq('id', interesseId)
      .single()
    if (!i) return { novos: 0 }

    const { data: carros } = await sb
      .from('veiculos')
      .select('id, marca, modelo, versao, ano_fab, ano_mod, preco')
      .in('status', ['disponivel', 'suspenso'])

    const achados = (carros ?? []).filter((c) => combina(i, c))
    if (!achados.length) return { novos: 0 }

    const { error } = await sb.from('alertas').upsert(
      achados.map((c) => ({ interesse_id: i.id, lead_id: i.lead_id, veiculo_id: c.id })),
      { onConflict: 'interesse_id,veiculo_id', ignoreDuplicates: true }
    )
    if (error) return { novos: 0, erro: traduzErro(error.message) }
    recarregar()
    return { novos: achados.length }
  } catch (e) {
    return { novos: 0, erro: e instanceof Error ? e.message : 'falha ao procurar no estoque' }
  }
}

/** Novo · Visualizado · Contatado · Negociação · Vendido · Sem interesse */
export async function definirStatusAlerta(id: string, status: string) {
  if (!(STATUS_ALERTA as readonly string[]).includes(status)) return { erro: 'Situação inválida.' }
  const sb = await supabaseServer()
  const { error } = await sb.from('alertas')
    .update({ status, visto_em: new Date().toISOString() })
    .eq('id', id)
  if (error) return { erro: traduzErro(error.message) }
  recarregar()
  return { ok: true }
}

/** Usado pelo sino: tira o "Novo" de todos de uma vez. */
export async function marcarAlertasVistos(ids: string[]) {
  if (!ids.length) return { ok: true }
  const sb = await supabaseServer()
  const { error } = await sb.from('alertas')
    .update({ status: 'Visualizado', visto_em: new Date().toISOString() })
    .in('id', ids).eq('status', 'Novo')
  if (error) return { erro: traduzErro(error.message) }
  recarregar()
  return { ok: true }
}

export async function excluirAlerta(id: string) {
  const sb = await supabaseServer()
  const { error } = await sb.from('alertas').delete().eq('id', id)
  if (error) return { erro: traduzErro(error.message) }
  recarregar()
  return { ok: true }
}
