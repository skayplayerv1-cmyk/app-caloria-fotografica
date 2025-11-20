'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Mail, Lock, Loader2, AlertCircle, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // Verificar se Supabase está configurado
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 mb-4">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Configuração Necessária</h1>
            <p className="text-gray-400">
              Configure o Supabase em Configurações → Integrações
            </p>
            <Button
              onClick={() => router.push('/')}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
            >
              Voltar
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (isSignUp) {
        // Cadastro
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: email.split('@')[0]
            }
          }
        })

        if (authError) throw authError

        if (authData.user) {
          console.log('✅ Usuário criado:', authData.user.id)

          // Aguardar um pouco para o trigger criar o perfil
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Verificar se perfil foi criado pelo trigger
          const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', authData.user.id)
            .single()

          if (!existingProfile) {
            console.log('⚠️ Trigger não criou perfil, criando manualmente...')
            
            // Criar perfil manualmente se trigger falhou
            const { error: profileError } = await supabase
              .from('user_profiles')
              .insert({
                id: authData.user.id,
                email: authData.user.email!,
                full_name: email.split('@')[0],
                weight: 75,
                height: 175,
                age: 30,
                gender: 'male',
                activity_level: 'moderate',
                goal: 'maintain',
                daily_calorie_goal: 2200,
                daily_protein_goal: 150,
                daily_carbs_goal: 275,
                daily_fat_goal: 61
              })

            if (profileError) {
              console.error('❌ Erro ao criar perfil:', profileError)
              throw new Error(`Erro ao criar perfil: ${profileError.message}`)
            }

            console.log('✅ Perfil criado manualmente')
          } else {
            console.log('✅ Perfil criado pelo trigger')
          }

          // Criar estatísticas diárias iniciais
          const today = new Date().toISOString().split('T')[0]
          const { error: statsError } = await supabase
            .from('daily_stats')
            .insert({
              user_id: authData.user.id,
              date: today,
              total_calories: 0,
              total_protein: 0,
              total_carbs: 0,
              total_fat: 0,
              meals_count: 0
            })

          if (statsError) {
            console.warn('⚠️ Erro ao criar stats iniciais:', statsError)
            // Não falha o cadastro por causa disso
          } else {
            console.log('✅ Estatísticas diárias criadas')
          }

          toast.success('Conta criada com sucesso! Redirecionando...')
          
          // Fazer login automático após cadastro
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password
          })

          if (signInError) {
            console.warn('⚠️ Erro no login automático:', signInError)
          }

          if (signInData.session) {
            console.log('✅ Cadastro completo, sessão criada:', signInData.session.user.id)
            
            // Aguardar um pouco para garantir que a sessão foi salva no localStorage
            await new Promise(resolve => setTimeout(resolve, 300))
            
            // Forçar navegação completa para garantir que a sessão seja carregada
            window.location.href = '/'
          }
        }
      } else {
        // Login
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password
        })

        if (signInError) throw signInError

        if (data.session) {
          console.log('✅ Login bem-sucedido, sessão criada:', data.session.user.id)
          toast.success('Login realizado! Redirecionando...')
          
          // Aguardar um pouco para garantir que a sessão foi salva no localStorage
          await new Promise(resolve => setTimeout(resolve, 300))
          
          // Forçar navegação completa para garantir que a sessão seja carregada
          window.location.href = '/'
        }
      }
    } catch (err: any) {
      console.error('❌ Erro completo:', err)
      
      let errorMsg = 'Erro ao autenticar'
      
      if (err.message?.includes('Invalid login credentials')) {
        errorMsg = 'Email ou senha incorretos'
      } else if (err.message?.includes('Email not confirmed')) {
        errorMsg = 'Confirme seu email antes de fazer login'
      } else if (err.message?.includes('User already registered')) {
        errorMsg = 'Email já cadastrado. Faça login.'
        setIsSignUp(false)
      } else if (err.message?.includes('Password should be at least')) {
        errorMsg = 'A senha deve ter pelo menos 6 caracteres'
      } else if (err.message?.includes('new row violates row-level security')) {
        errorMsg = 'Erro de permissão. Execute o SQL atualizado no Supabase.'
      } else if (err.message) {
        errorMsg = err.message
      }
      
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="p-8 space-y-6">
          {/* Logo */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-2xl shadow-emerald-500/30">
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

          {/* Erro */}
          {error && (
            <div className="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold py-6 rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-105"
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

          {/* Toggle */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
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
