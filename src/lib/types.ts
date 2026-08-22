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
  fotos: string[] | null
  status: 'disponivel' | 'reservado' | 'vendido'
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
  veiculo_id: string | null
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
