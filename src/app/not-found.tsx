import Link from 'next/link'

export default function NaoEncontrado() {
  return (
    <div className="login-wrap">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <h1 style={{ marginBottom: 10 }}>Página não encontrada</h1>
        <p className="login-sub">
          O carro pode ter sido vendido e saído do site. Volte ao estoque para ver o que está disponível agora.
        </p>
        <Link className="btn" href="/" style={{ display: 'inline-block', textDecoration: 'none' }}>Ver o estoque</Link>
      </div>
    </div>
  )
}
