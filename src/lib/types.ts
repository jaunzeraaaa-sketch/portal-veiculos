export type Veiculo = {
  id: string
  cod: string
  placa: string | null
  marca: string
  modelo: string
  versao: string
  ano_fab: number
  ano_mod: number
  km: number
  cor: string
  cambio: string
  combustivel: string
  preco: number
  fipe: number | null
  custo: number
  descricao: string | null
  opcionais: string[] | null
  condicoes: string[] | null
  fotos: string[] | null
  status: 'disponivel' | 'suspenso' | 'reservado' | 'vendido'
  data_entrada: string
  dias_estoque?: number
  delta_fipe?: number | null
  margem?: number
}

export type Venda = {
  id: string
  data_venda: string
  cliente: string
  telefone: string | null
  cidade: string | null
  veiculo_id: string | null
  veiculo_desc: string
  veiculo_cod: string | null
  valor_venda: number
  custo_carro: number
  outros_custos: number
  troca_modelo: string | null
  troca_ano: string | null
  troca_placa: string | null
  troca_cor: string | null
  troca_valor: number | null
  lucro?: number
  dinheiro_entrou?: number
}

export type Tarefa = {
  id: string
  data: string
  hora: string
  titulo: string
  descricao: string | null
  feito: boolean
  tipo: 'tarefa' | 'lembrete'
  lead_id: string | null
}

export type Lead = {
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
}

/** Carro que o cliente procura e que ainda não está no pátio. */
export type Interesse = {
  id: string
  lead_id: string
  marca: string
  modelo: string
  versao: string | null
  ano: number | null
  ano_ate: number | null
  preco_ate: number | null
  observacoes: string | null
  status: 'Aguardando disponibilidade' | 'Atendido' | 'Cancelado'
  criado_em: string
}

export const STATUS_ALERTA = ['Novo', 'Visualizado', 'Contatado', 'Negociação', 'Vendido', 'Sem interesse'] as const
export type StatusAlerta = (typeof STATUS_ALERTA)[number]

/** Encontro entre um interesse e um veículo que entrou no estoque. */
export type Alerta = {
  id: string
  status: StatusAlerta
  criado_em: string
  visto_em: string | null
  lead_id: string
  interesse_id: string
  veiculo_id: string
  lead_nome: string
  lead_telefone: string | null
  busca_marca: string
  busca_modelo: string
  busca_versao: string | null
  busca_ano: number | null
  cod: string
  marca: string
  modelo: string
  versao: string
  ano_fab: number
  ano_mod: number
  preco: number
  km: number
  cor: string
  veiculo_status: string
  fotos: string[] | null
}

export type Config = {
  nome: string
  cidade: string
  vendedor: string
  whatsapp: string
  whatsapp_exibe: string
  endereco: string
  logo_url: string | null
}
