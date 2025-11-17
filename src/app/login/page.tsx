'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { TrendingUp, Mail, Lock, Loader2, AlertCircle, Settings, Info } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isConfigured, setIsConfigured] = useState(true)

  useEffect(() => {
    // Verificar se Supabase está configurado
    setIsConfigured(isSupabaseConfigured())
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Verificar configuração antes de tentar autenticar
    if (!isSupabaseConfigured()) {
      setErrorMessage('Supabase não está configurado. Configure as variáveis de ambiente.')
      toast.error('Configure o Supabase primeiro')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      if (isSignUp) {
        // Criar nova conta COM autoConfirm para desenvolvimento
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            // Dados adicionais do usuário
            data: {
              email: email
            }
          }
        })

        if (error) {
          console.error('Erro no signup:', error)
          throw error
        }

        console.log('Signup data:', data)

        // Verificar se a conta foi criada e já tem sessão ativa
        if (data.user && data.session) {
          // Login automático funcionou - usuário já está autenticado!
          toast.success('Conta criada e login realizado com sucesso!')
          router.push('/')
          router.refresh()
        } else if (data.user && !data.session) {
          // Precisa confirmar email (configuração do Supabase exige)
          toast.warning('Conta criada! Verifique seu email para ativar.')
          setErrorMessage('Conta criada! Verifique seu email para fazer login. Se não recebeu, verifique o spam ou tente fazer login diretamente.')
          // Mudar para modo login automaticamente
          setTimeout(() => {
            setIsSignUp(false)
            setErrorMessage('')
          }, 5000)
        }
      } else {
        // Fazer login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) {
          console.error('Erro no login:', error)
          throw error
        }

        console.log('Login data:', data)

        if (data.session) {
          toast.success('Login realizado com sucesso!')
          router.push('/')
          router.refresh()
        }
      }
    } catch (error: any) {
      console.error('Erro na autenticação:', error)
      
      // Mensagens de erro mais amigáveis e específicas
      let errorMsg = 'Erro ao autenticar. Tente novamente.'
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMsg = 'Email ou senha incorretos. Verifique suas credenciais ou crie uma conta se ainda não tem.'
      } else if (error.message?.includes('Email not confirmed')) {
        errorMsg = 'Email não confirmado. Verifique sua caixa de entrada e spam, ou tente criar a conta novamente.'
      } else if (error.message?.includes('User already registered')) {
        errorMsg = 'Este email já está cadastrado. Use a opção "Entrar" para fazer login.'
        setIsSignUp(false)
      } else if (error.message?.includes('Password should be at least 6 characters')) {
        errorMsg = 'A senha deve ter pelo menos 6 caracteres'
      } else if (error.message?.includes('not found') || error.message?.includes('sandbox')) {
        errorMsg = 'Erro de conexão. Verifique se o Supabase está configurado corretamente.'
      } else if (error.message?.includes('Email rate limit exceeded')) {
        errorMsg = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
      } else if (error.message) {
        errorMsg = error.message
      }
      
      setErrorMessage(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // Mostrar aviso se não estiver configurado
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="p-8 space-y-6">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 shadow-2xl shadow-orange-500/30 mb-2">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Configuração Necessária
                </h1>
                <p className="text-gray-400">
                  O Supabase precisa ser configurado para usar o login.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-gray-300">
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <p className="font-semibold text-orange-400 mb-2">Como configurar:</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-400">
                  <li>Vá em Configurações do Projeto</li>
                  <li>Clique em Integrações</li>
                  <li>Conecte sua conta Supabase</li>
                </ol>
              </div>

              <p className="text-center text-gray-500">
                Ou clique no banner laranja acima para configurar
              </p>
            </div>

            <Button
              onClick={() => router.push('/')}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white"
            >
              Voltar para Home
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="p-8 space-y-6">
          {/* Logo e Título */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-2xl shadow-emerald-500/30 mb-2">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                FatSecret
              </h1>
              <p className="text-gray-400 mt-2">
                {isSignUp ? 'Crie sua conta' : 'Entre na sua conta'}
              </p>
            </div>
          </div>

          {/* Aviso informativo */}
          {!errorMessage && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">
                  {isSignUp ? 'Criando sua conta' : 'Primeiro acesso?'}
                </p>
                <p className="text-blue-300/80">
                  {isSignUp 
                    ? 'Após criar a conta, você será automaticamente conectado e poderá começar a usar o app.'
                    : 'Clique em "Criar conta" abaixo para cadastrar seu email e senha. Depois você poderá fazer login.'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Mensagem de erro */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500/50"
                />
              </div>
              {isSignUp && (
                <p className="text-xs text-gray-400">Mínimo de 6 caracteres</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold py-6 rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/40"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                isSignUp ? 'Criar Conta' : 'Entrar'
              )}
            </Button>
          </form>

          {/* Toggle entre Login e Cadastro */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setErrorMessage('')
              }}
              className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
            >
              {isSignUp ? (
                <>
                  Já tem uma conta? <span className="font-semibold">Entrar</span>
                </>
              ) : (
                <>
                  Não tem uma conta? <span className="font-semibold">Criar conta</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
