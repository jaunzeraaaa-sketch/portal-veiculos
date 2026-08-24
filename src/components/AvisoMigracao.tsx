/** Faixa que aparece no painel enquanto faltar rodar a atualização do banco.
 *  Sem isso, o erro só aparecia na hora de salvar, escrito em inglês de banco de dados. */
export default function AvisoMigracao({ pendentes }: { pendentes: string[] }) {
  if (!pendentes.length) return null

  return (
    <div className="mig-aviso">
      <div className="mig-ico">⚠︎</div>
      <div>
        <b>Falta atualizar o banco de dados — leva um minuto.</b>
        <p>
          O código novo já está instalado, mas parte dele ainda não tem onde gravar. Enquanto isso não for
          feito, você recebe erro ao suspender veículo, salvar fotos ou registrar uma procura.
        </p>
        <ol>
          <li>Abra o Supabase e entre no seu projeto</li>
          <li>Menu da esquerda → <b>SQL Editor</b> → <b>New query</b></li>
          <li>Abra o arquivo <span className="mono">supabase/ATUALIZAR-BANCO.sql</span> aqui no VS Code,
            copie tudo (⌘A, ⌘C) e cole lá</li>
          <li>Clique em <b>Run</b> e espere aparecer <span className="mono">✅ TUDO CERTO</span></li>
          <li>Volte aqui e recarregue a página — este aviso some sozinho</li>
        </ol>
        <p className="fim">
          É seguro rodar mais de uma vez: nada é apagado e nenhum carro, lead ou venda é perdido.
          O arquivo já resolve tudo que está faltando de uma vez só.
        </p>
      </div>
    </div>
  )
}
