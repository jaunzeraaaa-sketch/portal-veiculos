'use server'
import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase/server'
import { traduzErro } from '@/lib/erros'
import { casarInteresseComEstoque } from '@/actions/alertas'

type SB = Awaited<ReturnType<typeof supabaseServer>>

const t = (v: FormDataEntryValue | null) => (v ?? '').toString().trim()
const marcado = (v: FormDataEntryValue | null) => t(v) === 'on' || t(v) === 'true'
const hoje = () => new Date().toISOString().slice(0, 10)

function recarregar() {
  revalidatePath('/painel/leads')
  revalidatePath('/painel/tarefas')
  revalidatePath('/painel')
}

/** Cria a tarefa e/ou o lembrete que o vendedor pediu no formulário do lead.
 *  Nada é criado sem a caixinha marcada — essa é a regra. */
async function agendarDoLead(sb: SB, leadId: string, nome: string, form: FormData) {
  const linhas: Record<string, unknown>[] = []

  if (marcado(form.get('criar_tarefa'))) {
    const acao = t(form.get('proxima_acao')) || 'Primeiro contato'
    linhas.push({
      data: t(form.get('proxima_acao_data')) || hoje(),
      hora: t(form.get('tarefa_hora')) || '09:00',
      titulo: `${acao} — ${nome}`,
      descricao: t(form.get('observacoes')) || null,
      tipo: 'tarefa',
      lead_id: leadId,
    })
  }

  if (marcado(form.get('criar_lembrete'))) {
    linhas.push({
      data: t(form.get('lembrete_data')) || t(form.get('proxima_acao_data')) || hoje(),
      hora: t(form.get('lembrete_hora')) || '09:00',
      titulo: t(form.get('lembrete_titulo')) || `Lembrete: ${nome}`,
      descricao: t(form.get('lembrete_desc')) || null,
      tipo: 'lembrete',
      lead_id: leadId,
    })
  }

  if (!linhas.length) return
  await sb.from('tarefas').insert(linhas)
}

/** Grava o interesse enviado junto com o formulário do lead, se houver. */
async function interesseDoLead(sb: SB, leadId: string, form: FormData) {
  const marca = t(form.get('int_marca'))
  const modelo = t(form.get('int_modelo'))
  if (!marca || !modelo) return

  const { data } = await sb.from('interesses').insert({
    lead_id: leadId,
    marca, modelo,
    versao: t(form.get('int_versao')) || null,
    ano: Number(t(form.get('int_ano'))) || null,
    ano_ate: Number(t(form.get('int_ano_ate'))) || null,
    preco_ate: Number(t(form.get('int_preco_ate'))) || null,
    observacoes: t(form.get('int_obs')) || null,
  }).select('id').single()

  // pode ser que o carro já esteja no pátio — vale conferir na hora
  if (data?.id) await casarInteresseComEstoque(data.id)
}

export async function moverLead(id: string, estagio: string) {
  // Perdido nunca entra por aqui: exige justificativa, então tem ação própria.
  if (estagio === 'Perdido') return { erro: 'Para marcar como perdido, informe a justificativa.' }
  const sb = await supabaseServer()
  const { error } = await sb.from('leads').update({ estagio }).eq('id', id)
  if (error) return { erro: traduzErro(error.message) }
  recarregar()
  return { ok: true }
}

/** Marca como perdido — a justificativa é obrigatória e fica gravada no lead. */
export async function perderLead(id: string, form: FormData) {
  const escolhido = t(form.get('motivo_perda'))
  const outro = t(form.get('motivo_outro'))
  const motivo = escolhido === 'Outro' ? outro : escolhido

  if (!escolhido) return { erro: 'Escolha o motivo da perda.' }
  if (escolhido === 'Outro' && !outro) return { erro: 'Escreva qual foi o motivo no campo abaixo.' }
  if (!motivo) return { erro: 'A justificativa é obrigatória para marcar o lead como perdido.' }

  const sb = await supabaseServer()
  const { error } = await sb.from('leads')
    .update({ estagio: 'Perdido', motivo_perda: motivo })
    .eq('id', id)
  if (error) return { erro: traduzErro(error.message) }
  recarregar()
  return { ok: true }
}

export async function criarLead(form: FormData) {
  const sb = await supabaseServer()
  const nome = t(form.get('nome'))
  if (!nome) return { erro: 'O nome do lead é obrigatório.' }

  const { data, error } = await sb.from('leads').insert({
    nome,
    telefone: t(form.get('telefone')) || null,
    cidade: t(form.get('cidade')) || null,
    origem: t(form.get('origem')) || 'Site próprio',
    veiculo_id: t(form.get('veiculo_id')) || null,
    observacoes: t(form.get('observacoes')) || null,
    estagio: 'Novo',
    proxima_acao: t(form.get('proxima_acao')) || 'Primeiro contato',
    proxima_acao_data: t(form.get('proxima_acao_data')) || hoje(),
  }).select('id').single()

  if (error) return { erro: traduzErro(error.message) }
  if (data?.id) {
    await agendarDoLead(sb, data.id, nome, form)
    await interesseDoLead(sb, data.id, form)
  }
  recarregar()
  return { ok: true }
}

export async function salvarAcao(id: string, form: FormData) {
  const sb = await supabaseServer()
  const nome = t(form.get('nome_atual')) || 'lead'
  const { error } = await sb.from('leads').update({
    proxima_acao: t(form.get('proxima_acao')) || null,
    proxima_acao_data: t(form.get('proxima_acao_data')) || null,
    // motivo_perda NÃO entra aqui: quem grava é perderLead, com justificativa
    // obrigatória. Se entrasse, salvar o lead apagaria o motivo já registrado.
    observacoes: t(form.get('observacoes')) || null,
  }).eq('id', id)
  if (error) return { erro: traduzErro(error.message) }

  await agendarDoLead(sb, id, nome, form)
  recarregar()
  return { ok: true }
}

export async function excluirLead(id: string) {
  const sb = await supabaseServer()
  const { error } = await sb.from('leads').delete().eq('id', id)
  if (error) return { erro: traduzErro(error.message) }
  recarregar()
  return { ok: true }
}

// ---------------------------------------------------------------------
// INTERESSES — carro que o cliente procura e que ainda não temos
// ---------------------------------------------------------------------

export async function criarInteresse(leadId: string, form: FormData) {
  const sb = await supabaseServer()
  const marca = t(form.get('marca'))
  const modelo = t(form.get('modelo'))
  if (!marca || !modelo) return { erro: 'Informe pelo menos a marca e o modelo.' }

  const { data, error } = await sb.from('interesses').insert({
    lead_id: leadId,
    marca, modelo,
    versao: t(form.get('versao')) || null,
    ano: Number(t(form.get('ano'))) || null,
    ano_ate: Number(t(form.get('ano_ate'))) || null,
    preco_ate: Number(t(form.get('preco_ate'))) || null,
    observacoes: t(form.get('observacoes')) || null,
  }).select('id').single()

  if (error) return { erro: traduzErro(error.message) }

  let jaTem = 0
  if (data?.id) {
    const r = await casarInteresseComEstoque(data.id)
    jaTem = r.novos
  }
  recarregar()
  return { ok: true, jaTem }
}

export async function definirStatusInteresse(id: string, status: string) {
  if (!['Aguardando disponibilidade', 'Atendido', 'Cancelado'].includes(status)) {
    return { erro: 'Situação inválida.' }
  }
  const sb = await supabaseServer()
  const { error } = await sb.from('interesses').update({ status }).eq('id', id)
  if (error) return { erro: traduzErro(error.message) }
  recarregar()
  return { ok: true }
}

export async function excluirInteresse(id: string) {
  const sb = await supabaseServer()
  const { error } = await sb.from('interesses').delete().eq('id', id)
  if (error) return { erro: traduzErro(error.message) }
  recarregar()
  return { ok: true }
}
