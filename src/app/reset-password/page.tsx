'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Lock, Loader2, AlertCircle, CheckCircle, KeyRound } from 'lucide-react'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isValidToken, setIsValidToken] = useState(false)

  useEffect(() => {
    // Verificar se há um token de recuperação válido
    const checkRecoveryToken = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          setIsValidToken(true)
        } else {
          setErrorMessage('Link de recuperação inválido ou expirado. Solicite um novo link.')
        }
      } catch (error) {
        console.error('Erro ao verificar token:', error)
        setErrorMessage('Erro ao verificar link de recuperação.')
      }
    }
    
    checkRecoveryToken()
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    // Validações
    if (newPassword.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres')
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('As senhas não coincidem')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setSuccessMessage('✅ Senha redefinida com sucesso!\n\nVocê será redirecionado para o login...')
      toast.success('Senha redefinida com sucesso!')
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        router.push('/login')
      }, 3000)
      
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error)
      setErrorMessage(error.message || 'Erro ao redefinir senha. Tente novamente.')
      toast.error('Erro ao redefinir senha')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="p-8 space-y-6">
          {/* Logo e Título */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 shadow-2xl shadow-purple-500/30 mb-2">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Redefinir Senha
              </h1>
              <p className="text-gray-400 mt-2">
                Digite sua nova senha
              </p>
            </div>
          </div>

          {/* Mensagem de sucesso */}
          {successMessage && (
            <div className="flex items-start gap-2 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="whitespace-pre-line">{successMessage}</div>
            </div>
          )}

          {/* Mensagem de erro */}
          {errorMessage && (
            <div className="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="whitespace-pre-line">{errorMessage}</div>
            </div>
          )}

          {/* Formulário */}
          {isValidToken && !successMessage && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500/50"
                  />
                </div>
                <p className="text-xs text-gray-400">Mínimo de 6 caracteres</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Confirmar Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500/50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-6 rounded-xl shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/40"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Redefinindo...
                  </>
                ) : (
                  'Redefinir Senha'
                )}
              </Button>
            </form>
          )}

          {/* Link para voltar ao login */}
          {!isValidToken && (
            <Button
              onClick={() => router.push('/login')}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white"
            >
              Voltar para o Login
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
