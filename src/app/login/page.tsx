'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  // Função para registrar login
  const logLoginEvent = async (userId: string, loginType: 'login' | 'signup') => {
    try {
      const userAgent = navigator.userAgent
      
      // Registrar log de login
      const { error: logError } = await supabase
        .from('login_logs')
        .insert({
          user_id: userId,
          login_time: new Date().toISOString(),
          user_agent: userAgent,
          login_type: loginType,
          ip_address: null // IP será capturado pelo backend se necessário
        })

      if (logError) {
        console.error('❌ Erro ao registrar log de login:', logError)
      } else {
        console.log('✅ Log de login registrado com sucesso!')
      }
    } catch (error) {
      console.error('❌ Erro ao processar log:', error)
    }
  }

  useEffect(() => {
    // Verificar se usuário já está autenticado
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Sessão inicial:', session)
      if (session) {
        console.log('Usuário já autenticado, redirecionando...')
        router.push('/')
        router.refresh()
      }
      setLoading(false)
    })

    // Listener para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Evento de autenticação:', event)
      console.log('📝 Sessão:', session)
      
      if (event === 'SIGNED_IN' || event === 'SIGNED_UP') {
        console.log('✅ Autenticação bem-sucedida!')
        setMessage('Sucesso! Redirecionando...')
        
        if (session) {
          // Criar/atualizar perfil
          try {
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'id'
              })

            if (profileError) {
              console.error('❌ Erro ao criar perfil:', profileError)
            } else {
              console.log('✅ Perfil criado/atualizado com sucesso!')
            }
          } catch (error) {
            console.error('❌ Erro ao processar perfil:', error)
          }

          // Registrar log de login
          await logLoginEvent(
            session.user.id, 
            event === 'SIGNED_UP' ? 'signup' : 'login'
          )
        }

        // Redirecionar imediatamente
        console.log('🚀 Redirecionando para página inicial...')
        window.location.href = '/'
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 border-white/10 bg-black/40 backdrop-blur-xl">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-2xl shadow-emerald-500/30 mb-4">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            FatSecret
          </h1>
          <p className="text-gray-400">Nutrição Inteligente com IA</p>
        </div>

        {/* Mensagem de feedback */}
        {message && (
          <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm text-center">
            {message}
          </div>
        )}

        {/* Componente de Autenticação do Supabase */}
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#10b981',
                  brandAccent: '#059669',
                  brandButtonText: 'white',
                  defaultButtonBackground: '#1f2937',
                  defaultButtonBackgroundHover: '#374151',
                  defaultButtonBorder: '#374151',
                  defaultButtonText: 'white',
                  dividerBackground: '#374151',
                  inputBackground: '#1f2937',
                  inputBorder: '#374151',
                  inputBorderHover: '#10b981',
                  inputBorderFocus: '#10b981',
                  inputText: 'white',
                  inputLabelText: '#9ca3af',
                  inputPlaceholder: '#6b7280',
                },
                space: {
                  inputPadding: '12px',
                  buttonPadding: '12px',
                },
                borderWidths: {
                  buttonBorderWidth: '1px',
                  inputBorderWidth: '1px',
                },
                radii: {
                  borderRadiusButton: '8px',
                  buttonBorderRadius: '8px',
                  inputBorderRadius: '8px',
                },
              },
            },
            className: {
              container: 'space-y-4',
              button: 'font-semibold transition-all duration-300 hover:scale-105',
              input: 'transition-all duration-300',
            },
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email',
                password_label: 'Senha',
                email_input_placeholder: 'seu@email.com',
                password_input_placeholder: 'Sua senha',
                button_label: 'Entrar',
                loading_button_label: 'Entrando...',
                social_provider_text: 'Entrar com {{provider}}',
                link_text: 'Já tem uma conta? Entre',
              },
              sign_up: {
                email_label: 'Email',
                password_label: 'Senha',
                email_input_placeholder: 'seu@email.com',
                password_input_placeholder: 'Crie uma senha',
                button_label: 'Criar conta',
                loading_button_label: 'Criando conta...',
                social_provider_text: 'Criar conta com {{provider}}',
                link_text: 'Não tem uma conta? Cadastre-se',
                confirmation_text: 'Conta criada com sucesso!',
              },
              forgotten_password: {
                email_label: 'Email',
                password_label: 'Senha',
                email_input_placeholder: 'seu@email.com',
                button_label: 'Enviar instruções',
                loading_button_label: 'Enviando...',
                link_text: 'Esqueceu sua senha?',
                confirmation_text: 'Verifique seu email para redefinir a senha',
              },
            },
          }}
          providers={[]}
          redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/` : undefined}
        />

        {/* Informação adicional */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Ao criar uma conta, você concorda com nossos Termos de Uso e Política de Privacidade
          </p>
        </div>
      </Card>
    </div>
  )
}
