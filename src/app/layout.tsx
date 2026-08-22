import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Portal Veículos — Três Lagoas',
  description: 'Seminovos com laudo cautelar e procedência. Atendimento direto no WhatsApp.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="light" suppressHydrationWarning>
      <head>
        {/* aplica o tema salvo antes da primeira pintura, para não piscar */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('tema');if(t)document.documentElement.dataset.theme=t}catch(e){}` }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
