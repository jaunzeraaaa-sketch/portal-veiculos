/** Regras de correspondência entre o que o cliente procura e o que entrou no pátio.
 *
 *  Critério base: MARCA + MODELO + ANO.
 *  A versão, quando o cliente informou, é usada como conferência extra.
 *  O texto é comparado sem acento, sem maiúscula e sem espaço sobrando —
 *  "Volkswagen" e "volkswagen", "T-Cross" e "t cross" são a mesma coisa.
 */

export function normal(s: string | null | undefined) {
  return (s ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // tira acento
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')       // hífen, ponto e barra viram espaço
    .trim()
}

/** Mesma normalização, sem espaço: faz "HR-V", "HRV" e "hr v" virarem a mesma chave. */
export const chave = (s: string | null | undefined) => normal(s).replace(/ /g, '')

type Busca = {
  marca: string
  modelo: string
  versao?: string | null
  ano?: number | null
  ano_ate?: number | null
  preco_ate?: number | string | null
}

type Carro = {
  marca: string
  modelo: string
  versao?: string | null
  ano_fab: number
  ano_mod: number
  preco: number | string
}

/** true quando o carro atende ao que o cliente pediu. */
export function combina(busca: Busca, carro: Carro) {
  if (chave(busca.marca) !== chave(carro.marca)) return false

  // modelo: aceita "Corolla" achar "Corolla Cross"? Não — igualdade é o que
  // evita alerta errado. Mas "HR-V" e "HRV" batem, porque a normalização iguala.
  if (chave(busca.modelo) !== chave(carro.modelo)) return false

  // ano em branco = qualquer ano serve. Confere contra fabricação e modelo.
  if (busca.ano) {
    const de = busca.ano
    const ate = busca.ano_ate && busca.ano_ate >= de ? busca.ano_ate : de
    const dentro = (a: number) => a >= de && a <= ate
    if (!dentro(carro.ano_mod) && !dentro(carro.ano_fab)) return false
  }

  // versão é conferência extra: só reprova se o cliente escreveu e não bate
  if (busca.versao && normal(busca.versao)) {
    const v = normal(carro.versao)
    if (!v.includes(normal(busca.versao))) return false
  }

  // teto de preço, quando informado
  if (busca.preco_ate && Number(busca.preco_ate) > 0) {
    if (Number(carro.preco) > Number(busca.preco_ate)) return false
  }

  return true
}
