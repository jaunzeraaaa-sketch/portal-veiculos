export default function AvisoSetup({ onde }: { onde: 'vitrine' | 'login' }) {
  return (
    <div className="setup-aviso">
      <b>Falta conectar o banco de dados</b>
      <p>
        O site subiu, mas ainda não achei as chaves do Supabase — por isso {onde === 'vitrine'
          ? 'a vitrine está vazia'
          : 'o login não vai funcionar'}. Isso é esperado se você ainda não fez o passo 4 do README.
      </p>
      <ol>
        <li>Crie o projeto em <b>supabase.com</b> e rode o <code>supabase/schema.sql</code></li>
        <li>Duplique o arquivo: <code>cp .env.local.example .env.local</code></li>
        <li>Cole a <b>Project URL</b> e a chave <b>anon public</b> (Project Settings → API)</li>
        <li>Pare o servidor com <b>Ctrl+C</b> e rode <code>npm run dev</code> de novo</li>
      </ol>
      <p className="nota">Este aviso some sozinho assim que as chaves estiverem preenchidas.</p>
    </div>
  )
}
