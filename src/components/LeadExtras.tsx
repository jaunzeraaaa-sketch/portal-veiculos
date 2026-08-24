'use client'
import { useState } from 'react'
import { hojeISO } from '@/lib/format'

/** Caixa que só mostra os campos quando é marcada.
 *  Nada é criado sem ela — é a regra pedida para tarefa e lembrete. */
function Gaveta({ nome, titulo, ajuda, children }: {
  nome: string; titulo: string; ajuda: string; children: React.ReactNode
}) {
  const [aberta, setAberta] = useState(false)
  return (
    <div className={`gaveta${aberta ? ' on' : ''}`}>
      <label className="opc" style={{ padding: 0 }}>
        <input type="checkbox" name={nome} checked={aberta} onChange={(e) => setAberta(e.target.checked)} />
        <span className="box" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg></span>
        <span className="txt"><b>{titulo}</b><span className="aj">{ajuda}</span></span>
      </label>
      {aberta && <div className="gaveta-in">{children}</div>}
    </div>
  )
}

/** As duas opções de agenda do formulário de lead. */
export function AgendaLead({ dataAcao }: { dataAcao?: string | null }) {
  const dia = dataAcao || hojeISO()
  return (
    <>
      <Gaveta nome="criar_tarefa" titulo="Adicionar às minhas tarefas"
        ajuda="cria a tarefa da próxima ação, já com o nome do cliente">
        <div className="field" style={{ marginBottom: 0, maxWidth: 180 }}>
          <label>Horário da tarefa</label>
          <input name="tarefa_hora" type="time" defaultValue="09:00" />
        </div>
        <p className="gaveta-nota">
          A data é a mesma da <b>próxima ação</b> lá em cima. A tarefa aparece em Minhas tarefas com o link para este lead.
        </p>
      </Gaveta>

      <Gaveta nome="criar_lembrete" titulo="Criar lembrete no calendário"
        ajuda="um aviso com data e hora próprias, que faz o sino tocar">
        <div className="grid g-2" style={{ gap: '0 12px' }}>
          <div className="field"><label>Data do lembrete</label><input name="lembrete_data" type="date" defaultValue={dia} /></div>
          <div className="field"><label>Horário</label><input name="lembrete_hora" type="time" defaultValue="09:00" /></div>
        </div>
        <div className="field"><label>O que lembrar</label>
          <input name="lembrete_titulo" placeholder="Ex.: ligar antes das 10h, cliente trabalha à tarde" /></div>
        <div className="field" style={{ marginBottom: 0 }}><label>Detalhes</label>
          <textarea name="lembrete_desc" rows={2} placeholder="O que você vai querer saber na hora" /></div>
      </Gaveta>
    </>
  )
}

/** Bloco de interesse dentro do formulário de novo lead (prefixo int_). */
export function InteresseNoCadastro() {
  return (
    <Gaveta nome="tem_interesse" titulo="Procura um carro que não temos no estoque"
      ajuda="o sistema avisa você quando esse carro entrar no pátio">
      <div className="grid g-2" style={{ gap: '0 12px' }}>
        <div className="field"><label>Marca</label><input name="int_marca" placeholder="Toyota" /></div>
        <div className="field"><label>Modelo</label><input name="int_modelo" placeholder="Corolla" /></div>
        <div className="field"><label>Versão (opcional)</label><input name="int_versao" placeholder="2.0 XEi" /></div>
        <div className="field"><label>Ano</label><input name="int_ano" type="number" placeholder="2025" /></div>
        <div className="field"><label>Até o ano (opcional)</label><input name="int_ano_ate" type="number" placeholder="2026" /></div>
        <div className="field"><label>Paga até R$ (opcional)</label><input name="int_preco_ate" type="number" placeholder="160000" /></div>
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>Observações do que ele procura</label>
        <textarea name="int_obs" rows={2} placeholder="Cor, câmbio, se aceita rodado, prazo para comprar…" />
      </div>
    </Gaveta>
  )
}

/** Os mesmos campos, sem prefixo, para o modal de interesse avulso. */
export function CamposInteresse() {
  return (
    <>
      <div className="grid g-2" style={{ gap: '0 12px' }}>
        <div className="field"><label>Marca</label><input name="marca" required placeholder="Toyota" /></div>
        <div className="field"><label>Modelo</label><input name="modelo" required placeholder="Corolla" /></div>
        <div className="field"><label>Versão (opcional)</label><input name="versao" placeholder="2.0 XEi" /></div>
        <div className="field"><label>Ano</label><input name="ano" type="number" placeholder="2025" /></div>
        <div className="field"><label>Até o ano (opcional)</label><input name="ano_ate" type="number" placeholder="2026" /></div>
        <div className="field"><label>Paga até R$ (opcional)</label><input name="preco_ate" type="number" placeholder="160000" /></div>
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>Observações</label>
        <textarea name="observacoes" rows={2} placeholder="Cor, câmbio, prazo para comprar, o que já visitou…" />
      </div>
    </>
  )
}
