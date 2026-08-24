'use server'
import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase/server'
import { traduzErro } from '@/lib/erros'

function limpa(s: FormDataEntryValue | null) { return (s ?? '').toString().trim() }
function num(s: FormDataEntryValue | null) { return Number((s ?? '0').toString().replace(/[^\d.-]/g, '')) || 0 }

export async function registrarVenda(form: FormData) {
  const sb = await supabaseServer()
  const veiculoId = limpa(form.get('veiculo_id'))

  const { data: v } = await sb.from('veiculos').select('*').eq('id', veiculoId).single()
  if (!v) return { erro: 'Veículo não encontrado no estoque.' }

  const temTroca = form.get('tem_troca') === 'on'
  const trocaValor = temTroca ? num(form.get('troca_valor')) : 0

  const { error } = await sb.from('vendas').insert({
    data_venda: limpa(form.get('data_venda')),
    cliente: limpa(form.get('cliente')),
    telefone: limpa(form.get('telefone')) || null,
    cidade: limpa(form.get('cidade')) || null,
    veiculo_id: v.id,
    veiculo_desc: `${v.marca} ${v.modelo} ${v.versao}`.trim(),
    veiculo_cod: v.cod,
    valor_venda: num(form.get('valor_venda')),
    custo_carro: v.custo,
    outros_custos: num(form.get('outros_custos')),
    troca_modelo: temTroca ? limpa(form.get('troca_modelo')) : null,
    troca_ano: temTroca ? limpa(form.get('troca_ano')) : null,
    troca_placa: temTroca ? limpa(form.get('troca_placa')).toUpperCase() : null,
    troca_cor: temTroca ? limpa(form.get('troca_cor')) : null,
    troca_valor: temTroca ? trocaValor : null,
  })
  if (error) return { erro: traduzErro(error.message) }

  // o carro vendido sai da vitrine
  await sb.from('veiculos').update({ status: 'vendido' }).eq('id', v.id)

  // o carro da troca entra no estoque pelo valor de entrada
  if (temTroca && trocaValor > 0) {
    const placa = limpa(form.get('troca_placa')).toUpperCase().replace(/[^A-Z0-9]/g, '')
    const modelo = limpa(form.get('troca_modelo')) || 'Veículo na troca'
    await sb.from('veiculos').insert({
      cod: `TROCA-${placa || Date.now().toString(36).toUpperCase()}`,
      placa: limpa(form.get('troca_placa')).toUpperCase() || null,
      marca: modelo.split(' ')[0],
      modelo: modelo.split(' ').slice(1).join(' ') || modelo,
      versao: 'entrou na troca',
      ano_fab: Number(limpa(form.get('troca_ano')).slice(0, 4)) || new Date().getFullYear(),
      ano_mod: Number(limpa(form.get('troca_ano')).slice(-4)) || new Date().getFullYear(),
      km: 0,
      cor: limpa(form.get('troca_cor')),
      preco: Math.round(trocaValor * 1.12),
      fipe: Math.round(trocaValor * 1.1),
      custo: trocaValor,
    })
  }

  revalidatePath('/painel/vendas'); revalidatePath('/painel/estoque'); revalidatePath('/'); revalidatePath('/painel')
  return { ok: true }
}

export async function excluirVenda(id: string) {
  const sb = await supabaseServer()
  const { error } = await sb.from('vendas').delete().eq('id', id)
  if (error) return { erro: traduzErro(error.message) }
  revalidatePath('/painel/vendas')
  return { ok: true }
}
