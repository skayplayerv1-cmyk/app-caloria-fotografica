import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  console.log('🔐 Auth callback recebido:', { code: !!code, url: requestUrl.toString() })

  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              console.error('Erro ao definir cookie:', error)
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              console.error('Erro ao remover cookie:', error)
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('❌ Erro ao trocar código por sessão:', error)
      return NextResponse.redirect(new URL('/login?error=auth_callback_error', request.url))
    }

    if (data?.user) {
      console.log('✅ Usuário autenticado com sucesso:', data.user.email)
      
      // Criar perfil se não existir (fallback)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!profile) {
        console.log('📝 Criando perfil para usuário:', data.user.id)
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || null,
          })
        
        if (profileError) {
          console.error('❌ Erro ao criar perfil:', profileError)
        } else {
          console.log('✅ Perfil criado com sucesso')
        }
      }
    }
  }

  // Redirecionar para a página principal
  const redirectUrl = new URL(next, request.url)
  console.log('🔄 Redirecionando para:', redirectUrl.toString())
  return NextResponse.redirect(redirectUrl)
}
