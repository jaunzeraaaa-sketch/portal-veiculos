import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase/server'
import { getConfig } from '@/lib/loja'
import ConfigForm from '@/components/ConfigForm'

export const dynamic = 'force-dynamic'

export default async function VitrinePainel() {
  const cfg = await getConfig()
  const sb = await supabaseServer()
  const { count } = await sb.from('veiculos').select('*', { count: 'exact', head: true }).eq('status', 'disponivel')

  return (
    <>
      <div className="panel-top">
        <p>Esta é a página que o comprador abre. Ela é gerada a partir do estoque — carro marcado como vendido some daqui sozinho.</p>
        <Link className="btn-client" href="/" target="_blank">
          <svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
          VER COMO O CLIENTE
        </Link>
      </div>

      <div className="grid g-2">
        <div className="card">
          <div className="card-head"><h2>Identidade da loja</h2></div>
          <div className="sub">Esses dados aparecem no cabeçalho, no rodapé e no link de WhatsApp da vitrine.</div>
          <ConfigForm cfg={cfg} />
        </div>

        <div className="card">
          <div className="card-head"><h2>Como o comprador chega</h2></div>
          <div className="sub">O código do carro viaja dentro do link. Quando a mensagem chega, você já sabe qual veículo é.</div>
          <div className="linkbox" style={{ marginTop: 0 }}>
            /carro/<b>onix-2021-a7x3</b>
          </div>
          <div className="linkbox">
            wa.me/{cfg.whatsapp}?text=Olá!%20Tenho%20interesse%20no%20<b>ONIX-2021-A7X3</b>
          </div>
          <div className="kv" style={{ marginTop: 12 }}><span>Carros publicados agora</span><strong>{count ?? 0}</strong></div>
          <div className="kv"><span>Atualização da vitrine</span><strong>automática a cada alteração</strong></div>
          <div className="kv"><span>Acesso</span><strong>livre, sem login</strong></div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12, lineHeight: 1.6 }}>
            Só a vitrine e a ficha de cada carro são públicas. Estoque, vendas e tarefas exigem login —
            quem tentar abrir <span className="mono">/painel</span> sem estar logado cai na tela de entrada.
          </div>
        </div>
      </div>
    </>
  )
}
