import { createServerClient, type CookieOptions } from '@supabase/ssr'

type Cookie = { name: string; value: string; options?: CookieOptions }
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Renova a sessão a cada requisição e fecha o /painel para quem não fez login.
 * Vitrine ("/", "/carro/...") continua aberta para qualquer visitante.
 */
const CONFIGURADO = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xxxxx')
)

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  // Sem chaves configuradas: o painel continua fechado e a vitrine mostra o aviso.
  if (!CONFIGURADO) {
    if (request.nextUrl.pathname.startsWith('/painel')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list: Cookie[]) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  // Se o Supabase estiver fora do ar, tratamos como "sem login":
  // o painel fecha (falha para o lado seguro) e a vitrine continua aberta.
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    user = null
  }
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/painel') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('destino', pathname)
    return NextResponse.redirect(url)
  }

  if (pathname === '/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/painel'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)'],
}
