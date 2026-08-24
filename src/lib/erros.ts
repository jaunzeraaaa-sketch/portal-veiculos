/** Traduz o erro cru do Postgres/Supabase para uma instrução que dá para seguir.
 *
 *  A causa mais comum é simples: o código novo já está instalado, mas a migração
 *  correspondente ainda não foi rodada no Supabase. Em vez de mostrar
 *  "violates check constraint veiculos_status_check", a tela diz qual arquivo rodar.
 */

const RODE = (arquivo: string) =>
  `Falta rodar a migração no banco. Abra o Supabase → SQL Editor → New query, ` +
  `cole o arquivo supabase/${arquivo} e clique em Run. Depois tente de novo.`

export function traduzErro(msg: string | undefined | null): string {
  const m = (msg ?? '').toString()
  const b = m.toLowerCase()

  // ---- migração 02: situação "suspenso" e coluna de condições ----
  if (b.includes('veiculos_status_check')) {
    return `A situação "Suspenso" ainda não existe no seu banco. ${RODE('migracao-02-vitrine-fotos.sql')}`
  }
  if (b.includes("'condicoes'") || b.includes('column "condicoes"') || b.includes('condicoes')) {
    return `A coluna de condições do veículo ainda não existe. ${RODE('migracao-02-vitrine-fotos.sql')}`
  }

  // ---- migração 03: interesses, alertas, tarefas ligadas ao lead ----
  if (b.includes('public.interesses') || b.includes("'interesses'")) {
    return `A tabela de procuras ainda não existe no seu banco. ${RODE('migracao-03-leads-interesses.sql')}`
  }
  if (b.includes('public.alertas') || b.includes("'alertas'")) {
    return `A tabela de alertas ainda não existe no seu banco. ${RODE('migracao-03-leads-interesses.sql')}`
  }
  if (b.includes('column "tipo"') || b.includes('column "lead_id"') || b.includes('observacoes')) {
    return `Falta uma coluna criada pela migração 03. ${RODE('migracao-03-leads-interesses.sql')}`
  }

  if (b.includes('veiculos_fotos_max')) {
    return 'São no máximo 10 fotos por veículo. Remova alguma antes de salvar.'
  }

  // ---- erros comuns de configuração ----
  if (b.includes('jwt') || b.includes('invalid api key') || b.includes('apikey')) {
    return 'A chave do Supabase não foi aceita. Rode "node setup.mjs" e cole a chave publishable de novo.'
  }
  if (b.includes('row-level security') || b.includes('violates row-level security')) {
    return 'O banco recusou a gravação por falta de permissão. Confirme que você está logado no painel e que as políticas do schema.sql foram aplicadas.'
  }
  if (b.includes('duplicate key') && b.includes('cod')) {
    return 'Já existe um veículo com esse código. Deixe o campo Código em branco que o sistema gera um único.'
  }
  if (b.includes('fetch failed') || b.includes('network')) {
    return 'Não consegui falar com o Supabase. Confira sua internet e se o projeto no Supabase não está pausado.'
  }

  return m || 'Erro desconhecido.'
}
