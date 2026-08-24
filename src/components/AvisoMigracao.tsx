/** Faixa que aparece no painel enquanto faltar rodar alguma migração no Supabase.
 *  Sem isso, o erro só aparecia na hora de salvar, escrito em inglês de banco de dados. */
export default function AvisoMigracao({ pendentes }: { pendentes: string[] }) {
  if (!pendentes.length) return null

  return (
    <div className="mig-aviso">
      <div className="mig-ico">⚠︎</div>
      <div>
        <b>Falta atualizar o banco de dados.</b>
        <p>
          O código novo já está instalado, mas {pendentes.length === 1 ? 'uma parte dele' : 'partes dele'} ainda
          não {pendentes.length === 1 ? 'tem' : 'têm'} onde gravar. Enquanto isso não for feito, você vai receber
          erro ao suspender veículo, salvar fotos ou registrar uma procura.
        </p>
        <p><b>Como resolver</b> — no Supabase: <span className="mono">SQL Editor → New query</span>, cole o arquivo, clique em <b>Run</b>. Uma vez para cada:</p>
        <ul>
          {pendentes.map((m) => <li key={m}><span className="mono">supabase/{m}</span></li>)}
        </ul>
        <p className="fim">São seguras de rodar mais de uma vez — nada é apagado. Depois é só recarregar esta página.</p>
      </div>
    </div>
  )
}
