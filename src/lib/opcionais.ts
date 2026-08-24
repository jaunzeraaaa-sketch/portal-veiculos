/** Listas de marcação do cadastro de veículo — mesmo espírito do Webmotors,
 *  agrupadas para dar para achar rápido no celular. */

export const GRUPOS_OPCIONAIS: { grupo: string; itens: string[] }[] = [
  {
    grupo: 'Conforto',
    itens: [
      'Ar-condicionado', 'Ar digital / dual zone', 'Direção hidráulica', 'Direção elétrica',
      'Vidros elétricos', 'Trava elétrica', 'Retrovisores elétricos', 'Banco do motorista com regulagem de altura',
      'Bancos de couro', 'Volante com regulagem de altura', 'Piloto automático', 'Teto solar',
    ],
  },
  {
    grupo: 'Segurança',
    itens: [
      'Airbag duplo', 'Airbag lateral', 'Freios ABS', 'Controle de estabilidade',
      'Controle de tração', 'Isofix para cadeirinha', 'Alarme', 'Faróis de neblina',
      'Sensor de estacionamento', 'Câmera de ré', 'Sensor de chuva', 'Sensor crepuscular',
    ],
  },
  {
    grupo: 'Tecnologia',
    itens: [
      'Central multimídia', 'Android Auto / Apple CarPlay', 'Bluetooth', 'Entrada USB',
      'Computador de bordo', 'Painel digital', 'Partida por botão', 'Chave presencial',
      'Carregador por indução', 'Som com comando no volante',
    ],
  },
  {
    grupo: 'Externo',
    itens: [
      'Rodas de liga leve', 'Faróis de LED', 'Farol de milha', 'Engate para reboque',
      'Estribo lateral', 'Capota marítima', 'Santo Antônio', 'Rack de teto',
    ],
  },
]

/** Achatado, para validar o que veio do formulário. */
export const OPCIONAIS = GRUPOS_OPCIONAIS.flatMap((g) => g.itens)

export const CONDICOES: string[] = [
  'Único dono',
  'Laudo cautelar aprovado',
  'Revisões em concessionária',
  'Manual do proprietário',
  'Chave reserva',
  'Sem retoque de pintura',
  'Nunca teve sinistro',
  'IPVA pago',
  'Sem multas',
  'Pneus novos',
  'Garantia de fábrica vigente',
  'Aceita troca',
]
